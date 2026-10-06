/* Ausfüllbare Figuren wie auf den Arbeitsblättern: Rechendreieck, Zahlenmauer, Zahlenhaus,
   Zahlenfamilie (Tausch-/Umkehraufgaben), Tabelle (Verdoppeln/Halbieren/Malreihe), Päckchen ("Die kleine Aufgabe hilft").

   Aufgabe: { type: "figure", figure: { kind, cells: [{ v, given }], roof?, label?, lines? } }
   - triangle: cells[6] = [oben, links unten, rechts unten (innen), Seite links, Seite rechts, Seite unten (außen)]
   - wall:     cells[6] (3 Reihen) oder cells[10] (4 Reihen), unterste Reihe zuerst
   - house:    roof = Dachzahl, cells = [links0, rechts0, links1, rechts1, …]  (links + rechts = Dach)
   - family:   cells[15] = Sterne [a, Summe, b] + 4 Zeilen (x, y, z): 2× "+" und 2× "−"
   - table:    label (z.B. "das Doppelte"), cells = [Zahl0, Ergebnis0, Zahl1, Ergebnis1, …]
   - list:     lines = ["2 + 5 = 7", "12 + 5 = ?", …]; cells = je eine Zelle pro "?" in Reihenfolge */
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
      default: return false;
    }
  }

  /** Prüft Eingaben; liefert Liste der falschen Zell-Indizes (leere zählen als falsch). */
  function check(f, inputs) {
    const wrong = [];
    const val = (i) => (f.cells[i].given ? f.cells[i].v : num(inputs[i]));
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
      default: return "";
    }
  }

  function blanks(f) { return f.cells.map((c, i) => (c.given ? -1 : i)).filter((i) => i >= 0); }

  window.Figures = { rulesOk, check, solutionText, hint, html, blanks };
})();
