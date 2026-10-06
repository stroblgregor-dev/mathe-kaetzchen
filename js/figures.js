/* Ausfüllbare Figuren wie auf den Arbeitsblättern: Rechendreieck, Zahlenmauer, Zahlenhaus,
   Zahlenfamilie (Tausch-/Umkehraufgaben), Tabelle (Verdoppeln/Halbieren/Malreihe), Päckchen ("Die kleine Aufgabe hilft").

   Aufgabe: { type: "figure", figure: { kind, cells: [{ v, given }], roof?, label?, lines? } }
   - triangle: cells[6] = [oben, links unten, rechts unten (innen), Seite links, Seite rechts, Seite unten (außen)]
   - wall:     cells[6] (3 Reihen) oder cells[10] (4 Reihen), unterste Reihe zuerst
   - house:    roof = Dachzahl, cells = [links0, rechts0, links1, rechts1, …]  (links + rechts = Dach)
   - family:   cells[15] = Sterne [a, Summe, b] + 4 Zeilen (x, y, z): 2× "+" und 2× "−"
   - table:    label (z.B. "das Doppelte"), cells = [Zahl0, Ergebnis0, Zahl1, Ergebnis1, …]
   - list:     lines = ["2 + 5 = 7", "12 + 5 = ?", …]; cells = je eine Zelle pro "?" in Reihenfolge
   - grid:     Rechengitter/Einmaleinstabelle: op "+" oder "·", rows = Zeilenköpfe, cols = Spaltenköpfe, cells zeilenweise
   - divrest:  Teilen mit Rest: a : b = q Rest r → cells [q, r]
   - hfield:   Ausschnitt aus der Hundertertafel 3×3: cells zeilenweise (rechts +1, unten +10)
   - magictri: Zauberdreieck mit 1–6, target = Seitensumme; cells [oben, links Mitte, links unten, unten Mitte, rechts unten, rechts Mitte]
   - magicsq:  Zauberquadrat 3×3 mit 1–9, Summe 15 in jeder Reihe, Spalte und Diagonale
   - sudoku4:  Mini-Sudoku 4×4 mit 1–4 (Zeile, Spalte und 2×2-Kästchen) */
(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (x) => (x === "" || x === null || x === undefined || isNaN(Number(x)) ? null : Number(x));

  function evalSide(x) {
    x = String(x).replace(/·|×/g, "*").replace(/:/g, "/").replace(/−/g, "-").trim();
    if (!x || !/^[\d\s+\-*/()]+$/.test(x)) return null;
    try { const v = Function(`"use strict";return (${x})`)(); return Number.isFinite(v) ? v : null; } catch (e) { return null; }
  }

  // ---------------------------------------------------------------- Regeln je Figur (für Prüfung der KI und Lösungsweg)
  function rulesOk(f) {
    const v = (f.cells || []).map((c) => c.v);
    if (!v.every((x) => Number.isInteger(x) && x >= 0 && x <= 1000)) return false;
    switch (f.kind) {
      case "triangle": return v.length === 6 && v[3] === v[0] + v[1] && v[4] === v[0] + v[2] && v[5] === v[1] + v[2];
      case "wall":
        if (v.length === 6) return v[3] === v[0] + v[1] && v[4] === v[1] + v[2] && v[5] === v[3] + v[4];
        if (v.length === 10) return v[4] === v[0] + v[1] && v[5] === v[1] + v[2] && v[6] === v[2] + v[3] && v[7] === v[4] + v[5] && v[8] === v[5] + v[6] && v[9] === v[7] + v[8];
        return false;
      case "house": return Number.isInteger(f.roof) && v.length >= 2 && v.length % 2 === 0 && v.every((x, i) => i % 2 || x + v[i + 1] === f.roof);
      case "family": {
        if (v.length !== 15) return false;
        const [a, s, b] = v;
        if (a + b !== s) return false;
        const rows = [0, 1, 2, 3].map((r) => v.slice(3 + r * 3, 6 + r * 3));
        return rows.slice(0, 2).every(([x, y, z]) => x + y === z) && rows.slice(2).every(([x, y, z]) => x - y === z);
      }
      case "table": return v.length >= 2 && v.length % 2 === 0;
      case "list": {
        const lines = f.lines || [];
        let k = 0;
        for (const line of lines) {
          const gaps = (line.match(/\?/g) || []).length;
          if (gaps > 1) return false;
          let filled = line;
          if (gaps) { if (k >= v.length) return false; filled = line.replace("?", String(v[k++])); }
          const parts = filled.split("=");
          if (parts.length !== 2 || evalSide(parts[0]) === null || evalSide(parts[0]) !== evalSide(parts[1])) return false;
        }
        return k === v.length;
      }
      case "grid": {
        const R = f.rows || [], C = f.cols || [], add = f.op === "+";
        return R.length * C.length === v.length && R.every((r, i) => C.every((c, j) => v[i * C.length + j] === (add ? r + c : r * c)));
      }
      case "divrest": return v.length === 2 && Number.isInteger(f.a) && Number.isInteger(f.b) && f.b > 0 && v[0] * f.b + v[1] === f.a && v[1] < f.b;
      case "hfield": return v.length === 9 && v.every((x, i) => x === v[0] + Math.floor(i / 3) * 10 + (i % 3)) && v[0] >= 1 && v[8] <= 100 && (v[0] - 1) % 10 <= 7;
      case "magictri": return v.length === 6 && validMagicTri(v, f.target);
      case "magicsq": return v.length === 9 && validMagicSq(v);
      case "sudoku4": return v.length === 16 && validSudoku(v);
      default: return false;
    }
  }

  const TRI_SIDES = [[0, 1, 2], [2, 3, 4], [4, 5, 0]];
  const SQ_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const SU_GROUPS = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => r * 4 + c))
    .concat([0, 1, 2, 3].map((c) => [0, 1, 2, 3].map((r) => r * 4 + c)))
    .concat([[0, 1, 4, 5], [2, 3, 6, 7], [8, 9, 12, 13], [10, 11, 14, 15]]);
  const allDistinctRange = (v, lo, hi) => v.every((x) => Number.isInteger(x) && x >= lo && x <= hi) && new Set(v).size === v.length;
  function validMagicTri(v, target) { return allDistinctRange(v, 1, 6) && TRI_SIDES.every((sd) => sd.reduce((a, i) => a + v[i], 0) === target); }
  function validMagicSq(v) { return allDistinctRange(v, 1, 9) && SQ_LINES.every((l) => l.reduce((a, i) => a + v[i], 0) === 15); }
  function validSudoku(v) { return v.every((x) => x >= 1 && x <= 4) && SU_GROUPS.every((g) => new Set(g.map((i) => v[i])).size === 4); }
  // Für Rätsel mit mehreren richtigen Lösungen: falsche Zeilen/Seiten markieren
  function checkByGroups(f, vals, groups, isOk) {
    const wrong = new Set();
    groups.forEach((g) => { if (!isOk(g.map((i) => vals[i]))) g.forEach((i) => { if (!f.cells[i].given) wrong.add(i); }); });
    vals.forEach((x, i) => { if (!f.cells[i].given && x === null) wrong.add(i); });
    return [...wrong].sort((a, b) => a - b);
  }

  /** Prüft Eingaben; liefert Liste der falschen Zell-Indizes (leere zählen als falsch). */
  function check(f, inputs) {
    const wrong = [];
    const val = (i) => (f.cells[i].given ? f.cells[i].v : num(inputs[i]));
    if (f.kind === "magictri" || f.kind === "magicsq" || f.kind === "sudoku4") {
      const vals = f.cells.map((c, i) => val(i));
      const max = f.kind === "magictri" ? 6 : f.kind === "magicsq" ? 9 : 4;
      if (f.kind === "sudoku4") return checkByGroups(f, vals, SU_GROUPS, (g) => g.every((x) => x >= 1 && x <= 4) && new Set(g).size === 4);
      const dupl = (x) => vals.filter((y) => y === x).length > 1;
      const bad = new Set(checkByGroups(f, vals, f.kind === "magictri" ? TRI_SIDES : SQ_LINES,
        (g) => g.every((x) => x !== null) && g.reduce((a, x) => a + x, 0) === (f.kind === "magictri" ? f.target : 15)));
      vals.forEach((x, i) => { if (!f.cells[i].given && (x === null || x < 1 || x > max || dupl(x))) bad.add(i); });
      return [...bad].sort((a, b) => a - b);
    }
    if (f.kind === "family") {
      const a = f.cells[0].v, s = f.cells[1].v, b = f.cells[2].v;
      [0, 1, 2].forEach((i) => { if (!f.cells[i].given && val(i) !== f.cells[i].v) wrong.push(i); });
      const rowIdx = (r) => [3 + r * 3, 4 + r * 3, 5 + r * 3];
      const okPlus = (x, y, z) => z === s && x + y === s && ((x === a && y === b) || (x === b && y === a));
      const okMinus = (x, y, z) => x === s && x - y === z && ((y === a && z === b) || (y === b && z === a));
      const seen = { plus: [], minus: [] };
      [0, 1, 2, 3].forEach((r) => {
        const idx = rowIdx(r), [x, y, z] = idx.map(val), kind = r < 2 ? "plus" : "minus";
        const ok = kind === "plus" ? okPlus(x, y, z) : okMinus(x, y, z);
        const key = `${x}|${y}`;
        const dup = ok && a !== b && seen[kind].includes(key);
        if (!ok || dup) idx.forEach((i) => { if (!f.cells[i].given) wrong.push(i); });
        else seen[kind].push(key);
      });
      return wrong;
    }
    f.cells.forEach((c, i) => { if (!c.given && val(i) !== c.v) wrong.push(i); });
    return wrong;
  }

  /** Lösung als Text (für Lösungsanzeige/Protokoll). */
  function solutionText(f) {
    const v = f.cells.map((c) => c.v);
    switch (f.kind) {
      case "triangle": return `${v[1]} + ${v[0]} = ${v[3]}, ${v[0]} + ${v[2]} = ${v[4]}, ${v[1]} + ${v[2]} = ${v[5]}`;
      case "wall": return v.length === 6 ? `${v[0]} + ${v[1]} = ${v[3]}, ${v[1]} + ${v[2]} = ${v[4]}, ${v[3]} + ${v[4]} = ${v[5]}` : "Immer die zwei Steine darunter zusammenzählen.";
      case "house": return v.filter((_, i) => i % 2 === 0).map((x, i) => `${x} + ${v[i * 2 + 1]} = ${f.roof}`).join(", ");
      case "family": return `${v[0]} + ${v[2]} = ${v[1]}, ${v[2]} + ${v[0]} = ${v[1]}, ${v[1]} − ${v[0]} = ${v[2]}, ${v[1]} − ${v[2]} = ${v[0]}`;
      case "table": return v.filter((_, i) => i % 2 === 0).map((x, i) => `${x} → ${v[i * 2 + 1]}`).join(", ");
      case "list": { let k = 0; return (f.lines || []).map((l) => l.includes("?") ? l.replace("?", String(v[k++])) : l).join(", "); }
      case "grid": return `${f.op === "+" ? "Zeile + Spalte" : "Zeile · Spalte"}`;
      case "divrest": return `${f.a} : ${f.b} = ${v[0]} Rest ${v[1]}, denn ${v[0]} · ${f.b} = ${v[0] * f.b} und ${v[0] * f.b} + ${v[1]} = ${f.a}`;
      case "hfield": return "Nach rechts +1, nach unten +10.";
      case "magictri": return `Jede Seite ergibt ${f.target}.`;
      case "magicsq": return "Jede Reihe, Spalte und Diagonale ergibt 15.";
      case "sudoku4": return "In jeder Zeile, Spalte und jedem Kästchen kommt 1, 2, 3 und 4 genau einmal vor.";
      default: return "";
    }
  }

  const HINTS = {
    triangle: "Außen steht immer die Summe der zwei Felder, die daneben liegen.",
    wall: "Jeder Stein ist die Summe der zwei Steine darunter.",
    house: "Links und rechts zusammen ergeben immer die Zahl im Dach.",
    family: "Zwei Plus-Aufgaben (Tauschaufgabe!) und zwei Minus-Aufgaben (Umkehraufgabe) mit denselben drei Zahlen.",
    table: "Schau in die Kopfzeile: Was sollst du mit jeder Zahl machen?",
    list: "Die kleine Aufgabe hilft! Rechne zuerst die kleine Aufgabe.",
    grid: "Rechne immer die Zahl links mit der Zahl oben.",
    divrest: "Welche Malaufgabe passt am besten hinein? Was bleibt übrig, ist der Rest.",
    hfield: "Nach rechts wird es immer um 1 mehr, nach unten um 10 mehr.",
    magictri: "Probiere: Große Zahlen in die Ecken machen große Seiten.",
    magicsq: "In die Mitte gehört die 5.",
    sudoku4: "Schau, welche Zahl in der Zeile, Spalte und im Kästchen noch fehlt.",
  };
  const hint = (f) => HINTS[f.kind] || "";

  // ---------------------------------------------------------------- Darstellung
  /** fs = { inputs: [], active, wrong: [], solved (bool), reveal (bool) } */
  function cellBtn(f, fs, i, extra) {
    const c = f.cells[i];
    if (c.given) return `<span class="fcell given ${extra || ""}">${c.v}</span>`;
    const val = fs.reveal ? c.v : (fs.inputs[i] ?? "");
    const st = fs.reveal ? "reveal" : fs.solved ? "right" : fs.wrong.includes(i) ? "wrong" : fs.active === i ? "active" : "";
    return `<button class="fcell blank ${st} ${extra || ""}" data-act="fcell" data-i="${i}" ${fs.solved || fs.reveal ? "disabled" : ""}>${esc(val)}</button>`;
  }

  function html(t, fs) {
    const f = t.figure, B = (i, x) => cellBtn(f, fs, i, x);
    switch (f.kind) {
      case "triangle":
        return `<div class="fig fig-triangle"><svg viewBox="0 0 100 92" preserveAspectRatio="none" class="tri-svg">
            <polygon points="50,2 4,90 96,90" fill="#fffaf3" stroke="#4a3f5c" stroke-width="1.4"/>
            <path d="M50 62 L27 46 M50 62 L73 46 M50 62 L50 90" stroke="#4a3f5c" stroke-width="1.2" fill="none"/></svg>
          <div class="tpos tp-top">${B(0)}</div><div class="tpos tp-bl">${B(1)}</div><div class="tpos tp-br">${B(2)}</div>
          <div class="tpos tp-left">${B(3, "out")}</div><div class="tpos tp-right">${B(4, "out")}</div><div class="tpos tp-bottom">${B(5, "out")}</div></div>`;
      case "wall": {
        const rows = f.cells.length === 10 ? [[9], [7, 8], [4, 5, 6], [0, 1, 2, 3]] : [[5], [3, 4], [0, 1, 2]];
        return `<div class="fig fig-wall">${rows.map((r) => `<div class="wall-row">${r.map((i) => B(i, "brick")).join("")}</div>`).join("")}</div>`;
      }
      case "house": {
        const n = f.cells.length / 2;
        return `<div class="fig fig-house"><div class="roof"><span>${f.roof}</span></div>
          <div class="house-body">${Array.from({ length: n }, (_, r) => `<div class="house-row">${B(r * 2)}${B(r * 2 + 1)}</div>`).join("")}</div></div>`;
      }
      case "family": {
        const star = (i) => `<div class="fam-star ${i === 1 ? "big" : ""}">${B(i, "in-star")}</div>`;
        const ops = ["+", "+", "−", "−"];
        return `<div class="fig fig-family"><div class="fam-stars">${star(0)}${star(1)}${star(2)}</div>
          <div class="fam-rows">${ops.map((op, r) => `<div class="fam-row">${B(3 + r * 3)}<b>${op}</b>${B(4 + r * 3)}<b>=</b>${B(5 + r * 3)}</div>`).join("")}</div></div>`;
      }
      case "table": {
        const n = f.cells.length / 2;
        return `<div class="fig fig-table"><div class="tbl-head"><span>Zahl</span><span>${esc(f.label || "")}</span></div>
          <div class="tbl-cols">${Array.from({ length: n }, (_, k) => `<div class="tbl-col">${B(k * 2, "tin")}${B(k * 2 + 1, "tout")}</div>`).join("")}</div></div>`;
      }
      case "list": {
        let k = 0;
        return `<div class="fig fig-list">${(f.lines || []).map((line, li) => {
          if (!line.includes("?")) return `<div class="list-line helper">${esc(line)} <span class="helper-tag">💡 kleine Aufgabe</span></div>`;
          const i = k++, [a, b] = line.split("?");
          return `<div class="list-line">${esc(a)}${B(i)}${esc(b)}</div>`;
        }).join("")}</div>`;
      }
      case "grid": {
        const R = f.rows, C = f.cols;
        return `<div class="fig fig-grid"><table class="grid-tbl"><tr><th class="op">${f.op === "+" ? "+" : "·"}</th>${C.map((c) => `<th>${c}</th>`).join("")}</tr>
          ${R.map((r, i) => `<tr><th>${r}</th>${C.map((_, j) => `<td>${B(i * C.length + j)}</td>`).join("")}</tr>`).join("")}</table></div>`;
      }
      case "divrest":
        return `<div class="fig fig-list"><div class="list-line">${f.a} : ${f.b} = ${B(0)} <span class="rest">Rest</span> ${B(1)}</div></div>`;
      case "hfield":
        return `<div class="fig fig-hfield">${[0, 1, 2].map((r) => `<div class="hf-row">${[0, 1, 2].map((c) => B(r * 3 + c, "hf")).join("")}</div>`).join("")}</div>`;
      case "magictri":
        return `<div class="fig fig-magictri"><svg viewBox="0 0 100 92" class="tri-svg"><polygon points="50,8 8,86 92,86" fill="#fffaf3" stroke="#4a3f5c" stroke-width="1.4"/></svg>
          <div class="tpos mt0">${B(0, "round")}</div><div class="tpos mt1">${B(1, "round")}</div><div class="tpos mt2">${B(2, "round")}</div>
          <div class="tpos mt3">${B(3, "round")}</div><div class="tpos mt4">${B(4, "round")}</div><div class="tpos mt5">${B(5, "round")}</div>
          <div class="magic-goal">Jede Seite = <b>${f.target}</b> · Zahlen 1 bis 6</div></div>`;
      case "magicsq":
        return `<div class="fig fig-magicsq"><div class="ms-grid">${f.cells.map((_, i) => B(i, "sq")).join("")}</div><div class="magic-goal">Jede Reihe, Spalte, Diagonale = <b>15</b> · Zahlen 1 bis 9</div></div>`;
      case "sudoku4":
        return `<div class="fig fig-sudoku"><div class="su-grid">${f.cells.map((_, i) => B(i, `su su-r${Math.floor(i / 4)} su-c${i % 4}`)).join("")}</div></div>`;
      default: return "";
    }
  }

  function blanks(f) { return f.cells.map((c, i) => (c.given ? -1 : i)).filter((i) => i >= 0); }

  window.Figures = { rulesOk, check, solutionText, hint, html, blanks };
})();
