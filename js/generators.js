/* Eingebaute Aufgaben-Generatoren (2. Klasse VS, Österreich) – 3 Stufen je Modul.
   Jede Aufgabe hat dasselbe Format wie die KI-Pakete:
   {type, skill, prompt, expr, answer, choices, unit, hint, explain, clock, money, numberline, blocks} */
(function () {
  "use strict";

  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const NAMES = ["Mimi", "Felix", "Luna", "Minka", "Tiger", "Socke", "Lena", "Jonas", "Emma", "Paul", "Lara", "David", "Sophie", "Elias"];

  function task(o) {
    return Object.assign({ type: "input", skill: "sonstiges", prompt: "", expr: null, answer: "", choices: [], unit: null,
      hint: null, explain: null, clock: null, money: null, numberline: null, blocks: null }, o, { answer: String(o.answer) });
  }

  function numChoices(ans, n, spread, min, max) {
    const set = new Set([ans]);
    const cands = shuffle([ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, ans + spread, ans - spread]);
    for (const c of cands) { if (set.size >= n) break; if (c >= (min ?? 0) && c <= (max ?? 100)) set.add(c); }
    while (set.size < n) set.add(rnd(min ?? 0, max ?? 100));
    return shuffle([...set]).map(String);
  }

  // Zehnerübergang-Erklärungen
  function explainPlus(a, b) {
    const toTen = 10 - (a % 10);
    if (b % 10 === 0 || toTen === 10 || (a % 10) + (b % 10) < 10) return `${a} + ${b} = ${a + b}`;
    if (b < 10) return `${a} + ${b} = ${a} + ${toTen} + ${b - toTen} = ${a + b}`;
    const tens = Math.floor(b / 10) * 10, rest = b - tens;
    return `${a} + ${tens} = ${a + tens}, dann ${a + tens} + ${rest} = ${a + b}`;
  }
  function explainMinus(a, b) {
    const ones = a % 10;
    if (b % 10 === 0 || (b % 10) <= ones) return `${a} - ${b} = ${a - b}`;
    if (b < 10) return `${a} - ${b} = ${a} - ${ones} - ${b - ones} = ${a - b}`;
    const tens = Math.floor(b / 10) * 10, rest = b - tens;
    return `${a} - ${tens} = ${a - tens}, dann ${a - tens} - ${rest} = ${a - b}`;
  }

  // ------------------------------------------------------------------ Zahlen bis 100
  function genZahlen(level) {
    const kind = pick(level === 1 ? ["blocks", "next", "compare", "line20"] :
      level === 2 ? ["blocks", "next", "prev", "line100", "compare", "tens"] :
        ["line100", "neighbour10", "compareExpr", "tens", "prev", "blocks"]);
    if (kind === "blocks") {
      const tens = rnd(1, level === 1 ? 5 : 9), ones = rnd(0, 9);
      return task({ type: "blocks", skill: "zahlen100", prompt: "Welche Zahl ist das?", blocks: { tens, ones }, answer: tens * 10 + ones,
        hint: "Zähle zuerst die Zehnerstangen, dann die einzelnen Würfel.", explain: `${tens} Zehner und ${ones} Einer = ${tens * 10 + ones}` });
    }
    if (kind === "next") {
      const n = rnd(level === 1 ? 5 : 10, 98);
      return task({ type: "input", skill: "zahlen100", prompt: `Welche Zahl kommt nach ${n}?`, answer: n + 1, explain: `Nach ${n} kommt ${n + 1}.`, hint: "Zähle eins weiter." });
    }
    if (kind === "prev") {
      const n = rnd(11, 100);
      return task({ type: "input", skill: "zahlen100", prompt: `Welche Zahl kommt vor ${n}?`, answer: n - 1, explain: `Vor ${n} kommt ${n - 1}.`, hint: "Zähle eins zurück." });
    }
    if (kind === "line20") {
      const m = rnd(1, 19);
      return task({ type: "numberline", skill: "zahlen100", prompt: "Welche Zahl zeigt der Pfeil?", numberline: { min: 0, max: 20, marker: m }, answer: m,
        hint: "Zähle die Striche vom nächsten Zahl-Schild aus.", explain: `Der Pfeil zeigt auf ${m}.` });
    }
    if (kind === "line100") {
      const m = rnd(1, 19) * 5;
      return task({ type: "numberline", skill: "zahlen100", prompt: "Welche Zahl zeigt der Pfeil?", numberline: { min: 0, max: 100, marker: m }, answer: m,
        hint: "Die langen Striche sind die Zehner. Ein kurzer Strich ist 5.", explain: `Der Pfeil zeigt auf ${m}.` });
    }
    if (kind === "compare" || kind === "compareExpr") {
      let a = rnd(10, 99), b = Math.random() < 0.2 ? a : (Math.random() < 0.5 ? (a % 10) * 10 + Math.floor(a / 10) : rnd(10, 99));
      if (b < 1) b = rnd(10, 99);
      let left = String(a), lv = a;
      if (kind === "compareExpr") { const t = Math.floor(a / 10) * 10; left = `${t} + ${a - t}`; if (Math.random() < 0.5) { b = a + pick([-1, 0, 1, 10]); } }
      const ans = lv < b ? "<" : lv > b ? ">" : "=";
      return task({ type: "compare", skill: "zahlen100", prompt: "Setze das richtige Zeichen ein.", expr: `${left} ? ${b}`, choices: ["<", ">", "="], answer: ans,
        hint: "Vergleiche zuerst die Zehner. Das Krokodil-Maul frisst die größere Zahl.", explain: `${lv} ${ans} ${b}` });
    }
    if (kind === "tens") {
      const n = rnd(11, 99);
      const ask = pick(["Zehner", "Einer"]);
      const ans = ask === "Zehner" ? Math.floor(n / 10) : n % 10;
      return task({ type: "choice", skill: "zahlen100", prompt: `Wie viele ${ask} hat die Zahl ${n}?`, choices: numChoices(ans, 4, 3, 0, 9), answer: ans,
        hint: "Die linke Ziffer sind die Zehner, die rechte die Einer.", explain: `${n} = ${Math.floor(n / 10)} Zehner und ${n % 10} Einer` });
    }
    // neighbour10
    const n = rnd(11, 89);
    if (n % 10 === 0) return genZahlen(level);
    const lo = Math.floor(n / 10) * 10;
    const up = Math.random() < 0.5;
    return task({ type: "input", skill: "zahlen100", prompt: up ? `Welcher Zehner kommt nach ${n}?` : `Welcher Zehner ist vor ${n}?`, answer: up ? lo + 10 : lo,
      hint: "Zehner sind 10, 20, 30, …", explain: `${lo} < ${n} < ${lo + 10}` });
  }

  // ------------------------------------------------------------------ Zahlenpaare für Plus/Minus
  // Z = glatte Zehner, ZE = Zehner+Einer, E = Einer; "ZÜ" = Zehnerübergang
  const PAIRS = {
    plus: {
      ZE_ZE: () => { const at = rnd(1, 7), ao = rnd(1, 8); return [at * 10 + ao, rnd(1, 8 - at) * 10 + rnd(1, 9 - ao)]; },          // 34 + 25
      ZE_E: () => { const a = rnd(1, 8) * 10 + rnd(1, 7); return [a, rnd(1, 9 - (a % 10))]; },                                      // 32 + 5
      Z_Z: () => { const a = rnd(1, 7) * 10; return [a, rnd(1, 9 - a / 10) * 10]; },                                                 // 30 + 40
      ZE_Z: () => { const a = rnd(1, 7) * 10 + rnd(1, 9); return [a, rnd(1, 8 - Math.floor(a / 10)) * 10]; },                      // 34 + 20
      ZE_E_ZU: () => { const a = rnd(1, 8) * 10 + rnd(3, 9); return [a, rnd(10 - (a % 10), 9)]; },                                  // 38 + 5
      ZE_ZE_ZU: () => { const at = rnd(1, 6), ao = rnd(2, 9); return [at * 10 + ao, rnd(1, 8 - at) * 10 + rnd(10 - ao, 9)]; },    // 38 + 45
    },
    minus: {
      ZE_ZE: () => { const at = rnd(2, 9), ao = rnd(1, 9); return [at * 10 + ao, rnd(1, at - 1) * 10 + rnd(0, ao)]; },            // 38 - 27
      ZE_E: () => { const a = rnd(1, 9) * 10 + rnd(2, 9); return [a, rnd(1, a % 10)]; },                                            // 37 - 4
      Z_Z: () => { const a = rnd(3, 10) * 10; return [a, rnd(1, a / 10 - 1) * 10]; },                                                // 70 - 30
      ZE_Z: () => { const a = rnd(2, 9) * 10 + rnd(1, 9); return [a, rnd(1, Math.floor(a / 10) - 1) * 10]; },                     // 56 - 30
      ZE_E_ZU: () => { const a = rnd(2, 9) * 10 + rnd(0, 7); return [a, rnd((a % 10) + 1, 9)]; },                                  // 43 - 7
      ZE_ZE_ZU: () => { const at = rnd(3, 9), ao = rnd(0, 8); return [at * 10 + ao, rnd(1, at - 2) * 10 + rnd(ao + 1, 9)]; },     // 52 - 27
    },
  };
  // Mischung je Stufe: schon Stufe 1 enthält zweistellig ± zweistellig (ohne Zehnerübergang)
  const MIX = {
    1: [["ZE_ZE", 5], ["ZE_E", 2], ["ZE_Z", 2], ["Z_Z", 1]],
    2: [["ZE_ZE", 4], ["ZE_E_ZU", 3], ["ZE_ZE_ZU", 2], ["ZE_Z", 1]],
    3: [["ZE_ZE_ZU", 8], ["ZE_E_ZU", 2]],
  };
  function weighted(list) {
    const total = list.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    for (const [k, w] of list) { if ((r -= w) < 0) return k; }
    return list[0][0];
  }
  function pair(op, level) {
    for (let i = 0; i < 50; i++) {
      const [a, b] = PAIRS[op][weighted(MIX[level] || MIX[1])]();
      if (op === "plus" && a + b <= 100 && b >= 1) return [a, b];
      if (op === "minus" && b >= 1 && b < a) return [a, b];
    }
    return op === "plus" ? [34, 25] : [38, 27];
  }

  // ------------------------------------------------------------------ Plus
  function genPlus(level) {
    const [a, b] = pair("plus", level);
    const ans = a + b;
    const zu = (a % 10) + (b % 10) >= 10;
    const asChoice = Math.random() < 0.25;
    return task({ type: asChoice ? "choice" : "input", skill: "plus", prompt: "Rechne!", expr: `${a} + ${b} = ?`, answer: ans,
      choices: asChoice ? numChoices(ans, 3, 10, 0, 100) : [],
      hint: zu ? "Rechne zuerst bis zum nächsten Zehner." : "Rechne zuerst die Zehner, dann die Einer.", explain: explainPlus(a, b) });
  }

  // ------------------------------------------------------------------ Minus
  function genMinus(level) {
    const [a, b] = pair("minus", level);
    const ans = a - b;
    const zu = (b % 10) > (a % 10);
    const asChoice = Math.random() < 0.25;
    return task({ type: asChoice ? "choice" : "input", skill: "minus", prompt: "Rechne!", expr: `${a} - ${b} = ?`, answer: ans,
      choices: asChoice ? numChoices(ans, 3, 10, 0, 100) : [],
      hint: zu ? "Rechne zuerst zurück bis zum Zehner." : "Rechne zuerst die Zehner, dann die Einer.", explain: explainMinus(a, b) });
  }

  // ------------------------------------------------------------------ Ergänzen / Platzhalter
  function genErgaenzen(level) {
    const k = level === 1 ? pick(["ten", "hundred10", "gapEasy", "gapEasy"]) : level === 2 ? pick(["ten", "hundred", "front"]) : pick(["hundred", "minusGap", "frontMinus", "front"]);
    if (k === "ten") {
      const a = rnd(11, 89); if (a % 10 === 0) return genErgaenzen(level);
      const t = Math.ceil(a / 10) * 10;
      return task({ skill: "ergaenzen", prompt: "Ergänze bis zum nächsten Zehner!", expr: `${a} + ? = ${t}`, answer: t - a,
        hint: `Wie viel fehlt von ${a % 10} bis 10?`, explain: `${a} + ${t - a} = ${t}` });
    }
    if (k === "gapEasy") {
      const [a, b] = pair("plus", 1), front = Math.random() < 0.5;
      return task({ skill: "ergaenzen", prompt: "Welche Zahl fehlt?", expr: front ? `? + ${b} = ${a + b}` : `${a} + ? = ${a + b}`, answer: front ? a : b,
        hint: "Wie viele Zehner fehlen? Wie viele Einer fehlen?", explain: `${a} + ${b} = ${a + b}` });
    }
    if (k === "hundred10") {
      const a = rnd(1, 9) * 10;
      return task({ skill: "ergaenzen", prompt: "Ergänze auf 100!", expr: `${a} + ? = 100`, answer: 100 - a,
        hint: "Zähle in Zehnerschritten bis 100.", explain: `${a} + ${100 - a} = 100` });
    }
    if (k === "hundred") {
      const a = rnd(11, 89);
      return task({ skill: "ergaenzen", prompt: "Ergänze auf 100!", expr: `${a} + ? = 100`, answer: 100 - a,
        hint: "Rechne zuerst bis zum nächsten Zehner, dann bis 100.", explain: a % 10 ? `${a} + ${10 - a % 10} = ${Math.ceil(a / 10) * 10}, + ${100 - Math.ceil(a / 10) * 10} = 100 → ${100 - a}` : `${a} + ${100 - a} = 100` });
    }
    if (k === "front") {
      const b = rnd(5, 40), s = rnd(b + 5, 100);
      return task({ skill: "ergaenzen", prompt: "Welche Zahl fehlt?", expr: `? + ${b} = ${s}`, answer: s - b,
        hint: `Rechne ${s} - ${b}.`, explain: `${s - b} + ${b} = ${s}` });
    }
    if (k === "minusGap") {
      const a = rnd(30, 99), r = rnd(5, a - 10);
      return task({ skill: "ergaenzen", prompt: "Welche Zahl fehlt?", expr: `${a} - ? = ${r}`, answer: a - r,
        hint: `Wie viel fehlt von ${r} bis ${a}?`, explain: `${a} - ${a - r} = ${r}` });
    }
    const b = rnd(5, 40), r = rnd(5, 100 - b);
    return task({ skill: "ergaenzen", prompt: "Welche Zahl fehlt?", expr: `? - ${b} = ${r}`, answer: r + b,
      hint: `Rechne ${r} + ${b}.`, explain: `${r + b} - ${b} = ${r}` });
  }

  // ------------------------------------------------------------------ Geld
  function coinsFor(total, set) {
    const out = [];
    let rest = total;
    for (const v of set) { while (rest >= v && out.length < 9) { out.push(v); rest -= v; } }
    return rest === 0 ? out : null;
  }
  function genGeld(level) {
    if (level === 3 && Math.random() < 0.35) {
      const e = rnd(1, 9), c = pick([10, 20, 30, 40, 50, 60, 70, 80, 90, 5, 25, 45, 75, 95]);
      const ans = `${e},${String(c).padStart(2, "0")}`;
      if (Math.random() < 0.5) {
        const coins = coinsFor(e * 100 + c, [500, 200, 100, 50, 20, 10, 5]);
        if (coins) return task({ type: "money", skill: "geld", prompt: "Wie viel Geld ist das? Schreib mit Komma.", money: shuffle(coins), answer: ans, unit: "€", decimal: true,
          hint: "Zähle zuerst die Euro, dann die Cent. Vor das Komma kommen die Euro.", explain: `${e} € und ${c} c = ${ans} €` });
      }
      return task({ skill: "geld", prompt: "Schreib mit Komma!", expr: `${e} € ${c} c = ? €`, answer: ans, decimal: true,
        hint: "Vor das Komma kommen die Euro, danach immer zwei Ziffern für die Cent.", explain: `${e} € ${c} c = ${ans} €` });
    }
    const k = level === 1 ? pick(["cents", "cents", "euros"]) : level === 2 ? pick(["euros", "cents", "missing", "compare"]) : pick(["change", "shop", "missing", "euros"]);
    if (k === "cents") {
      const set = level === 1 ? [50, 20, 10, 5, 2, 1] : [50, 20, 10, 5, 2, 1];
      const total = level === 1 ? rnd(2, 18) * 5 : rnd(11, 99);
      const coins = coinsFor(total, shuffle(set).sort((a, b) => b - a).filter(() => true));
      if (!coins) return genGeld(level);
      return task({ type: "money", skill: "geld", prompt: "Wie viel Geld ist das?", money: shuffle(coins), answer: total, unit: "c",
        hint: "Beginne mit der größten Münze und zähle dazu.", explain: `${coins.sort((a, b) => b - a).join(" + ")} = ${total} c` });
    }
    if (k === "euros") {
      const total = level === 1 ? rnd(2, 20) : rnd(11, 99);
      const coins = coinsFor(total * 100, [5000, 2000, 1000, 500, 200, 100]);
      if (!coins) return genGeld(level);
      return task({ type: "money", skill: "geld", prompt: "Wie viel Geld ist das?", money: shuffle(coins), answer: total, unit: "€",
        hint: "Zähle zuerst die Scheine, dann die Münzen.", explain: `${coins.sort((a, b) => b - a).map((c) => c / 100).join(" + ")} = ${total} €` });
    }
    if (k === "missing") {
      const have = rnd(2, 18) * 5;
      const coins = coinsFor(have, [50, 20, 10, 5]);
      if (!coins) return genGeld(level);
      return task({ type: "money", skill: "geld", prompt: "Wie viel fehlt auf 1 €?", money: shuffle(coins), answer: 100 - have, unit: "c",
        hint: "1 € sind 100 Cent. Zähle zuerst, wie viel da liegt.", explain: `Da liegen ${have} c. ${have} + ${100 - have} = 100 c = 1 €` });
    }
    if (k === "compare") {
      const a = rnd(10, 95), b = rnd(10, 95);
      if (a === b) return genGeld(level);
      return task({ type: "compare", skill: "geld", prompt: "Was ist mehr? Setze das Zeichen ein.", expr: `${a} c ? ${b} c`, choices: ["<", ">", "="],
        answer: a < b ? "<" : ">", hint: "Vergleiche die Zahlen.", explain: `${a} c ${a < b ? "<" : ">"} ${b} c` });
    }
    if (k === "change") {
      const price = rnd(11, 48), pay = price < 20 ? 20 : 50;
      const item = pick(["ein Ball", "ein Buch", "ein Kuscheltier", "ein Spiel", "ein Katzenkorb"]);
      return task({ skill: "geld", prompt: `${item[0].toUpperCase() + item.slice(1)} kostet ${price} €. Du zahlst mit ${pay} €. Wie viel bekommst du zurück?`,
        answer: pay - price, unit: "€", hint: `Ergänze von ${price} bis ${pay}.`, explain: `${pay} € - ${price} € = ${pay - price} €` });
    }
    const a = rnd(12, 45), b = rnd(10, 100 - a - 5);
    const [i1, i2] = shuffle(["Katzenfutter", "ein Spielzeug-Fisch", "ein Wollknäuel", "eine Bürste", "ein Halsband"]);
    return task({ skill: "geld", prompt: `${i1} kostet ${a} €, ${i2} kostet ${b} €. Wie viel kostet beides zusammen?`, answer: a + b, unit: "€",
      hint: "Rechne die beiden Preise zusammen.", explain: `${a} € + ${b} € = ${a + b} €` });
  }

  // ------------------------------------------------------------------ Uhr
  function clockWord(h, m) {
    const h12 = ((h + 11) % 12) + 1, next = (h12 % 12) + 1;
    if (m === 0) return `${h12} Uhr`;
    if (m === 15) return `viertel ${next}`;
    if (m === 30) return `halb ${next}`;
    if (m === 45) return `dreiviertel ${next}`;
    return `${h12}:${String(m).padStart(2, "0")}`;
  }
  const digital = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`;

  /** Uhr-Aufgabe für eine feste Uhrzeit (auch für den Baukasten). */
  function clockTask(h, m, useDigital, onlyHalf) {
    const fmt = useDigital || ![0, 15, 30, 45].includes(m) ? digital : clockWord;
    const isDigital = fmt === digital;
    const ans = fmt(h, m);
    const set = new Set([ans]);
    const cands = shuffle([[h, (m + 30) % 60], [h % 12 + 1, m], [(h + 10) % 12 + 1, m], [h, (m + 15) % 60], [h, (m + 45) % 60], [m / 5 || 12, (h % 12) * 5], [h, (m + 5) % 60]]);
    for (const [ch, cm] of cands) { if (set.size >= 4) break; if (onlyHalf && cm % 30 !== 0) continue; if (!isDigital && cm % 15 !== 0) continue; if (Number.isInteger(cm) && cm < 60) set.add(fmt(ch, cm)); }
    let hint = "Der kurze Zeiger zeigt die Stunde, der lange die Minuten.";
    if (!isDigital && m === 30) hint = "Steht der lange Zeiger unten auf der 6, ist es halb. Halb heißt: eine halbe Stunde vor der nächsten Stunde.";
    if (!isDigital && (m === 15 || m === 45)) hint = "Viertel: langer Zeiger auf 3. Dreiviertel: langer Zeiger auf 9. Wir sagen schon die nächste Stunde!";
    return task({ type: "clock", skill: "uhr", prompt: "Wie spät ist es?", clock: { h, m }, choices: shuffle([...set]), answer: ans, hint,
      explain: `Es ist ${ans}${isDigital ? "" : ` (${digital(h, m)})`}.` });
  }

  function genUhr(level) {
    const h = rnd(1, 12);
    const ms = level === 1 ? [0, 30] : level === 2 ? [0, 15, 30, 45] : [5, 10, 20, 25, 35, 40, 50, 55, 15, 45];
    const m = pick(ms);
    const useDigital = level === 3 || (level === 2 && Math.random() < 0.35);
    return clockTask(h, m, useDigital, level === 1);
  }

  // ------------------------------------------------------------------ Zeit
  const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const MONTHS = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  function genSekunden(level) {
    if (level === 2 || Math.random() < 0.5) {
      const q = pick([["Wie viele Sekunden hat eine Minute?", 60], ["Wie viele Sekunden sind eine halbe Minute?", 30]]);
      if (level === 3 && Math.random() < 0.6) { const s = rnd(1, 3) * 10; return task({ skill: "zeit", prompt: "Wie viele Sekunden sind das?", expr: `1 min ${s} s = ? s`, answer: 60 + s, unit: null, hint: "1 Minute = 60 Sekunden.", explain: `60 s + ${s} s = ${60 + s} s` }); }
      return task({ skill: "zeit", prompt: q[0], answer: q[1], hint: "Zähle die Sekunden beim Sekundenzeiger einmal rundherum.", explain: `Richtig ist ${q[1]}.` });
    }
    const q = pick([["Was dauert ungefähr 1 Sekunde?", "Einmal klatschen", ["Einmal klatschen", "Zähne putzen", "Eine Nacht schlafen"]],
      ["Was dauert ungefähr 1 Minute?", "Hände waschen", ["Hände waschen", "Einmal blinzeln", "Ein Schultag"]]]);
    return task({ type: "choice", skill: "zeit", prompt: q[0], choices: shuffle(q[2]), answer: q[1], hint: "Stell es dir vor und zähle dabei langsam.", explain: `${q[1]}.` });
  }

  function genZeit(level) {
    if (level >= 2 && Math.random() < 0.25) return genSekunden(level);
    const k = level === 1 ? pick(["facts", "day", "month", "later"]) : level === 2 ? pick(["facts", "later", "duration", "day", "month"]) : pick(["duration", "later", "minutes", "facts"]);
    if (k === "facts") {
      const f = pick([["Wie viele Minuten hat eine Stunde?", 60], ["Wie viele Tage hat eine Woche?", 7], ["Wie viele Stunden hat ein Tag?", 24],
        ["Wie viele Minuten hat eine halbe Stunde?", 30], ["Wie viele Monate hat ein Jahr?", 12], ["Wie viele Minuten hat eine Viertelstunde?", 15]]);
      return task({ skill: "zeit", prompt: f[0], answer: f[1], hint: "Denk an die Uhr oder den Kalender.", explain: `Richtig ist ${f[1]}.` });
    }
    if (k === "day") {
      const i = rnd(0, 6), after = Math.random() < 0.6;
      const ans = after ? DAYS[(i + 1) % 7] : DAYS[(i + 6) % 7];
      const ch = new Set([ans]); while (ch.size < 3) ch.add(pick(DAYS));
      return task({ type: "choice", skill: "zeit", prompt: `Welcher Tag kommt ${after ? "nach" : "vor"} ${DAYS[i]}?`, choices: shuffle([...ch]), answer: ans,
        hint: "Sag die Wochentage der Reihe nach auf.", explain: DAYS.join(", ") });
    }
    if (k === "month") {
      const i = rnd(0, 11);
      const ans = MONTHS[(i + 1) % 12];
      const ch = new Set([ans]); while (ch.size < 3) ch.add(pick(MONTHS));
      return task({ type: "choice", skill: "zeit", prompt: `Welcher Monat kommt nach ${MONTHS[i]}?`, choices: shuffle([...ch]), answer: ans,
        hint: "Sag die Monate der Reihe nach auf.", explain: MONTHS.join(", ") });
    }
    if (k === "later") {
      const h = rnd(1, 9), d = level === 1 ? rnd(1, 3) : rnd(1, 5);
      const ans = `${h + d} Uhr`;
      const ch = new Set([ans]); while (ch.size < 3) ch.add(`${rnd(1, 12)} Uhr`);
      return task({ type: "choice", skill: "zeit", prompt: `Es ist ${h} Uhr. Wie spät ist es in ${d} Stunde${d > 1 ? "n" : ""}?`, choices: shuffle([...ch]), answer: ans,
        hint: "Zähle die Stunden weiter.", explain: `${h} Uhr + ${d} h = ${ans}` });
    }
    if (k === "duration") {
      const h = rnd(8, 16), m = pick([0, 15, 30]), d = pick([15, 30, 45]);
      const tot = h * 60 + m + d;
      const ans = `${Math.floor(tot / 60)}:${String(tot % 60).padStart(2, "0")}`;
      const ch = new Set([ans]);
      for (const delta of shuffle([15, -15, 30, 60])) { if (ch.size >= 3) break; const t = tot + delta; ch.add(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`); }
      const start = `${h}:${String(m).padStart(2, "0")}`;
      const what = pick(["Die Pause", "Der Film", "Das Turnen", "Die Musikstunde", "Das Katzenvideo"]);
      return task({ type: "choice", skill: "zeit", prompt: `${what} beginnt um ${start} Uhr und dauert ${d} Minuten. Wann ist ${what.startsWith("Der") ? "er" : what.startsWith("Das") ? "es" : "sie"} aus?`,
        choices: shuffle([...ch]), answer: ans, hint: "Rechne die Minuten dazu. 60 Minuten sind eine Stunde.", explain: `${start} + ${d} min = ${ans}` });
    }
    const a = rnd(1, 4) * 10, b = rnd(1, 3) * 5;
    return task({ skill: "zeit", prompt: `Lena liest ${a} Minuten, dann malt sie ${b} Minuten. Wie lange ist das zusammen?`, answer: a + b, unit: "min",
      hint: "Rechne die Minuten zusammen.", explain: `${a} + ${b} = ${a + b} Minuten` });
  }

  // ------------------------------------------------------------------ Sachaufgaben
  function genSach(level) {
    const max = level === 1 ? 50 : 100;
    const n = pick(NAMES);
    const k = pick(["plus", "minus", "plus", "minus", "compare", "class"]);
    if (k === "plus") {
      const [a, b] = pair("plus", level);
      const [thing, verb] = pick([["Fischlein", "bekommt"], ["Sticker", "bekommt"], ["Murmeln", "findet"], ["Wollknäuel", "kauft"]]);
      return task({ skill: "sach", prompt: `${n} hat ${a} ${thing}. ${n} ${verb} noch ${b} dazu. Wie viele ${thing} sind es jetzt?`, answer: a + b,
        hint: "Kommt etwas dazu, rechnest du plus.", explain: `${a} + ${b} = ${a + b}` });
    }
    if (k === "minus") {
      const [a, b] = pair("minus", level);
      const story = pick([`In der Dose sind ${a} Kekse. ${n} isst ${b} davon.`, `${n} hat ${a} Luftballons und verschenkt ${b} davon.`,
        `Im Korb liegen ${a} Kastanien. ${n} verliert ${b} davon.`, `Im Napf sind ${a} Fischlein. Die Katze frisst ${b} davon.`]);
      return task({ skill: "sach", prompt: `${story} Wie viele sind noch übrig?`, answer: a - b,
        hint: "Wird etwas weniger, rechnest du minus.", explain: `${a} - ${b} = ${a - b}` });
    }
    if (k === "compare") {
      const a = rnd(10, max - 10), b = rnd(a + 2, Math.min(max, a + (level === 1 ? 9 : 35)));
      const m = pick(NAMES.filter((x) => x !== n));
      return task({ skill: "sach", prompt: `${n} hat ${a} Sticker. ${m} hat ${b} Sticker. Wie viele Sticker hat ${m} mehr?`, answer: b - a,
        hint: `Ergänze von ${a} bis ${b}.`, explain: `${b} - ${a} = ${b - a}` });
    }
    const all = rnd(18, 26), g = rnd(7, all - 7);
    return task({ skill: "sach", prompt: `In der Klasse sind ${all} Kinder. ${g} davon sind Mädchen. Wie viele Buben sind es?`, answer: all - g,
      hint: "Alle Kinder minus die Mädchen.", explain: `${all} - ${g} = ${all - g}` });
  }


  // ------------------------------------------------------------------ Baukasten (eigene Übungen der Eltern)
  function evalSide(x) {
    x = String(x).replace(/·/g, "*").replace(/:/g, "/").trim();
    if (!x || !/^[\d\s+\-*/()]+$/.test(x)) return null;
    try { const v = Function(`"use strict";return (${x})`)(); return Number.isFinite(v) ? v : null; } catch (e) { return null; }
  }

  /** Eine Zeile wie "38 - 27", "34 + ? = 50", "? - 12 = 30" oder "45 + 23 = 68" in eine Aufgabe verwandeln.
      Rückgabe: {task} oder {error}. */
  function parseEquation(line, asChoice) {
    let x = String(line || "").trim();
    if (!x) return null;
    x = x.replace(/[x×*]/g, "·").replace(/÷/g, ":").replace(/[–−]/g, "-").replace(/_+|□|\.{2,}/g, "?");
    if (/[^\d\s+\-·:=?()]/.test(x)) return { error: "Nur Zahlen und + − · : = ? erlaubt" };
    let left, right;
    if (!x.includes("=")) { left = x; right = "?"; }
    else {
      const parts = x.split("=");
      if (parts.length !== 2) return { error: "Nur ein = erlaubt" };
      [left, right] = parts.map((t) => t.trim());
      if (!right) right = "?";
    }
    if (!x.includes("?") && right !== "?") {
      const l = evalSide(left), r = evalSide(right);
      if (l === null || r === null) return { error: "Rechnung nicht lesbar" };
      if (l !== r) return { error: `Stimmt nicht – richtig wäre ${left.trim()} = ${l}` };
      right = "?";
    }
    const expr = `${left} = ${right}`.replace(/\s*([+\-·:=])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
    if ((expr.match(/\?/g) || []).length !== 1) return { error: "Genau ein ? (Lücke) verwenden" };
    const sols = [];
    for (let v = 0; v <= 1000 && sols.length < 2; v++) {
      const [l, r] = expr.replace("?", String(v)).split("=").map(evalSide);
      if (l !== null && r !== null && Math.abs(l - r) < 1e-9) sols.push(v);
    }
    if (!sols.length) return { error: "Keine Lösung zwischen 0 und 1000" };
    if (sols.length > 1) return { error: "Mehrere Lösungen möglich" };
    const ans = sols[0];
    const gapLeft = expr.split("=")[0].includes("?");
    const skill = gapLeft ? "ergaenzen" : /·|:/.test(expr) ? "sonstiges" : expr.includes("-") ? "minus" : "plus";
    const nums = (expr.match(/\d+/g) || []).map(Number);
    let explain = expr.replace("?", String(ans));
    if (!gapLeft && nums.length === 2 && skill === "plus") explain = explainPlus(nums[0], nums[1]);
    if (!gapLeft && nums.length === 2 && skill === "minus") explain = explainMinus(nums[0], nums[1]);
    const hint = gapLeft ? "Welche Zahl macht die Rechnung richtig? Probier es mit der Umkehraufgabe."
      : skill === "minus" ? "Rechne zuerst die Zehner, dann die Einer." : "Rechne zuerst die Zehner, dann die Einer.";
    return { task: task({ type: asChoice ? "choice" : "input", skill, prompt: gapLeft ? "Welche Zahl fehlt?" : "Rechne!", expr, answer: ans,
      choices: asChoice ? numChoices(ans, 3, 10, 0, Math.max(100, ans + 20)) : [], hint, explain }) };
  }

  /** Geld-Aufgabe aus ausgewählten Münzen/Scheinen (Werte in Cent). kind: "total" | "missing". */
  function moneyTask(coins, kind) {
    if (!coins.length) return { error: "Bitte Münzen oder Scheine antippen" };
    const total = coins.reduce((a, b) => a + b, 0);
    const sorted = coins.slice().sort((a, b) => b - a);
    if (kind === "missing") {
      if (total >= 100) return { error: "Für „Wie viel fehlt auf 1 €?“ muss es weniger als 1 € sein" };
      return { task: task({ type: "money", skill: "geld", prompt: "Wie viel fehlt auf 1 €?", money: coins.slice(), answer: 100 - total, unit: "c",
        hint: "1 € sind 100 Cent. Zähle zuerst, wie viel da liegt.", explain: `Da liegen ${total} c. ${total} + ${100 - total} = 100 c = 1 €` }) };
    }
    const allCents = coins.every((c) => c < 100), allEuro = coins.every((c) => c >= 100);
    if (allCents && total < 100) {
      return { task: task({ type: "money", skill: "geld", prompt: "Wie viel Geld ist das?", money: coins.slice(), answer: total, unit: "c",
        hint: "Beginne mit der größten Münze und zähle dazu.", explain: `${sorted.join(" + ")} = ${total} c` }) };
    }
    if ((allEuro || total % 100 === 0) && total / 100 <= 100) {
      return { task: task({ type: "money", skill: "geld", prompt: "Wie viel Geld ist das?", money: coins.slice(), answer: total / 100, unit: "€",
        hint: "Zähle zuerst die Scheine, dann die Münzen.", explain: `${sorted.map((c) => c >= 100 ? c / 100 + " €" : c + " c").join(" + ")} = ${total / 100} €` }) };
    }
    return { error: "Bitte nur Cent (unter 1 €) oder nur ganze Euro – keine Kommabeträge" };
  }


  // ================================================================== Lehrplan-Erweiterung
  const fig = (kind, values, givenIdx, extra) => Object.assign({ kind, cells: values.map((v, i) => ({ v, given: givenIdx.includes(i) })) }, extra || {});
  const figTask = (skill, prompt, figure, hint, explain) => task({ type: "figure", skill, prompt, figure, answer: figure.cells.map((c) => c.v).join(","), hint, explain });
  // Zahl für Stufe: 1 = bis 20, 2 = bis 100 ohne Übergang, 3 = bis 100 mit Übergang
  function pairFor(level, maxSum) {
    if (level === 1) { const a = rnd(1, 10), b = rnd(1, Math.min(10, (maxSum || 20) - a)); return [a, b]; }
    return pair("plus", level === 2 ? 1 : 3);
  }

  // ------------------------------------------------------------------ Rechenrätsel (Figuren)
  function genTriangle(level) {
    let a, b, c;
    for (let i = 0; i < 80; i++) {
      if (level === 1) { a = rnd(1, 9); b = rnd(1, 9); c = rnd(1, 9); if (a + b <= 20 && a + c <= 20 && b + c <= 20) break; }
      else if (level === 2) { a = rnd(1, 4) * 10 + rnd(0, 3); b = rnd(1, 3) * 10 + rnd(0, 3); c = rnd(1, 3) * 10 + rnd(0, 3); if (a + b <= 100 && a + c <= 100 && b + c <= 100) break; }
      else { a = rnd(11, 45); b = rnd(11, 45); c = rnd(11, 45); if (a + b <= 100 && a + c <= 100 && b + c <= 100 && ((a % 10) + (b % 10) >= 10 || (b % 10) + (c % 10) >= 10)) break; }
    }
    const v = [a, b, c, a + b, a + c, b + c];
    // Lösbare Muster: alle Innenzahlen gegeben | wie am Blatt: eine Innenzahl fehlt, dafür eine Außenzahl gegeben
    const patterns = level === 1 ? [[0, 1, 2], [0, 1, 2], [1, 2, 3], [0, 2, 3]] : [[0, 1, 2], [1, 2, 3], [0, 2, 3], [0, 1, 4]];
    const given = pick(patterns);
    return figTask("raetsel", "Fülle das Rechendreieck aus!", fig("triangle", v, given), "Außen steht die Summe der zwei Innenfelder daneben. Fehlt innen etwas, rechne minus.",
      `Innen: ${a}, ${b}, ${c} · außen: ${a + b}, ${a + c}, ${b + c}`);
  }

  function genWall(level) {
    let b;
    for (let i = 0; i < 80; i++) {
      b = level === 1 ? [rnd(1, 6), rnd(1, 6), rnd(1, 6)] : level === 2 ? [rnd(1, 3) * 10 + rnd(0, 2), rnd(1, 2) * 10 + rnd(0, 2), rnd(1, 3) * 10 + rnd(0, 2)] : [rnd(5, 30), rnd(5, 25), rnd(5, 30)];
      const top = b[0] + 2 * b[1] + b[2];
      if (top <= (level === 1 ? 20 : 100) && (level < 3 || (b[0] % 10) + (b[1] % 10) >= 10 || (b[1] % 10) + (b[2] % 10) >= 10)) break;
    }
    const v = [b[0], b[1], b[2], b[0] + b[1], b[1] + b[2], b[0] + 2 * b[1] + b[2]];
    const given = pick(level === 1 ? [[0, 1, 2], [0, 1, 2], [0, 2, 3]] : [[0, 1, 2], [0, 2, 3], [1, 2, 3], [0, 3, 5], [2, 4, 5]]);
    return figTask("raetsel", "Fülle die Zahlenmauer aus!", fig("wall", v, given), "Jeder Stein ist die Summe der zwei Steine darunter. Oben fehlt etwas? Dann rechne minus.",
      `${v[0]} + ${v[1]} = ${v[3]}, ${v[1]} + ${v[2]} = ${v[4]}, ${v[3]} + ${v[4]} = ${v[5]}`);
  }

  function genHouse(level) {
    const roof = level === 1 ? rnd(10, 20) : level === 2 ? rnd(3, 10) * 10 : rnd(31, 99);
    const n = level === 1 ? 5 : 4, lefts = new Set();
    while (lefts.size < n) lefts.add(level === 2 ? rnd(1, roof / 10 - 1) * 10 + (Math.random() < 0.5 ? 0 : 5) % (roof) : rnd(1, roof - 1));
    const L = [...lefts].filter((x) => x > 0 && x < roof).slice(0, n);
    if (L.length < n) return genHouse(level);
    const v = []; L.forEach((x) => v.push(x, roof - x));
    return figTask("raetsel", `Zahlenhaus: Zerlege die ${roof}!`, fig("house", v, v.map((_, i) => i).filter((i) => i % 2 === 0), { roof }),
      `Links und rechts zusammen ergeben immer ${roof}.`, L.map((x) => `${x} + ${roof - x} = ${roof}`).join(", "));
  }

  function genFamily(level) {
    let a, b;
    if (level === 1) { a = rnd(3, 12); b = rnd(2, Math.min(12, 20 - a)); } else [a, b] = pair("plus", level === 2 ? 1 : 3);
    if (a === b) b = b + 1;
    const s = a + b;
    const v = [a, s, b, a, b, s, b, a, s, s, a, b, s, b, a];
    const given = level === 1 ? [0, 1, 2] : pick([[0, 1], [1, 2], [0, 1, 2]]);
    return figTask("raetsel", "Zahlenfamilie: Finde die 4 Rechnungen!", fig("family", v, given),
      "Zwei Plus-Aufgaben (Tauschaufgabe!) und zwei Minus-Aufgaben mit denselben drei Zahlen.", `${a} + ${b} = ${s}, ${b} + ${a} = ${s}, ${s} − ${a} = ${b}, ${s} − ${b} = ${a}`);
  }

  function genAnalogy(level) {
    const minus = level >= 2 && Math.random() < 0.4;
    const x = rnd(2, 8), y = minus ? rnd(1, x - 1) : rnd(1, 9 - x);
    const r = minus ? x - y : x + y, op = minus ? "-" : "+";
    let lines, vals;
    if (level === 1) {
      lines = [`${x} + ${y} = ${r}`, `${10 + x} + ${y} = ?`, `${y} + ${10 + x} = ?`];
      vals = [10 + r, 10 + r];
    } else {
      const tens = shuffle(level === 2 ? [10, 20, 30, 40, 50, 60, 70, 80] : [20, 30, 40, 50, 60, 70, 80, 90]).slice(0, 3).sort((p, q) => p - q);
      lines = [`${x} ${op} ${y} = ${r}`].concat(tens.map((t) => `${t + x} ${op} ${y} = ?`));
      vals = tens.map((t) => t + r);
    }
    return figTask("raetsel", "Die kleine Aufgabe hilft!", { kind: "list", lines, cells: vals.map((v) => ({ v, given: false })) },
      "Rechne zuerst die kleine Aufgabe – die Einer bleiben gleich, nur die Zehner ändern sich.", lines.slice(1).map((l, k) => l.replace("?", vals[k])).join(", "));
  }

  function genGridPlus(level) {
    const pickN = () => (level === 1 ? rnd(1, 9) : level === 2 ? rnd(1, 4) * 10 + rnd(0, 4) : rnd(11, 49));
    let R, C;
    for (let i = 0; i < 50; i++) {
      R = [pickN(), pickN()]; C = [pickN(), pickN()];
      const ok = R.every((a) => C.every((b) => a + b <= (level === 1 ? 20 : 100) && (level !== 2 || (a % 10) + (b % 10) < 10)));
      if (ok && new Set(R).size === 2 && new Set(C).size === 2) break;
    }
    const v = []; R.forEach((a) => C.forEach((b) => v.push(a + b)));
    return figTask("raetsel", "Rechengitter: Fülle aus!", { kind: "grid", op: "+", rows: R, cols: C, cells: v.map((x) => ({ v: x, given: false })) },
      "Rechne die Zahl links plus die Zahl oben.", R.map((a) => C.map((b) => `${a}+${b}=${a + b}`).join(", ")).join("; "));
  }

  function genRaetsel(level) {
    return pick([genTriangle, genTriangle, genWall, genWall, genHouse, genFamily, genAnalogy, genGridPlus])(level);
  }

  // ------------------------------------------------------------------ Verdoppeln & Halbieren
  function genDoppelt(level) {
    const k = pick(["tdouble", "thalf", "double", "half"]);
    const pool = level === 1 ? { d: Array.from({ length: 10 }, (_, i) => i + 1), h: Array.from({ length: 10 }, (_, i) => (i + 1) * 2) }
      : level === 2 ? { d: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50], h: [20, 30, 40, 50, 60, 70, 80, 90, 100, 10] }
      : { d: Array.from({ length: 40 }, (_, i) => i + 11), h: Array.from({ length: 45 }, (_, i) => (i + 6) * 2) };
    if (k === "tdouble" || k === "thalf") {
      const isD = k === "tdouble", xs = shuffle(isD ? pool.d : pool.h).slice(0, 5).sort((a, b) => isD ? a - b : b - a);
      const v = []; xs.forEach((x) => v.push(x, isD ? x * 2 : x / 2));
      return figTask("doppelt", isD ? "Verdopple die Zahlen!" : "Halbiere die Zahlen!", fig("table", v, v.map((_, i) => i).filter((i) => i % 2 === 0), { label: isD ? "das Doppelte" : "die Hälfte" }),
        isD ? "Das Doppelte heißt: die Zahl plus noch einmal die gleiche Zahl." : "Die Hälfte heißt: in zwei gleich große Teile teilen.", null);
    }
    if (k === "double") { const x = pick(pool.d); return task({ skill: "doppelt", prompt: `Wie viel ist das Doppelte von ${x}?`, expr: `${x} + ${x} = ?`, answer: x * 2, hint: "Rechne die Zahl plus noch einmal die gleiche Zahl.", explain: `${x} + ${x} = ${x * 2}` }); }
    const x = pick(pool.h);
    return task({ skill: "doppelt", prompt: `Wie viel ist die Hälfte von ${x}?`, expr: null, answer: x / 2, hint: "Welche Zahl plus sich selbst ergibt " + x + "?", explain: `${x / 2} + ${x / 2} = ${x}` });
  }

  // ------------------------------------------------------------------ Einmaleins & Teilen (Reihenfolge wie im Buch)
  const ROWS_BY_LEVEL = { 1: [2, 10, 5], 2: [2, 10, 5, 3, 6, 9, 4], 3: [2, 3, 4, 5, 6, 7, 8, 9, 10] };
  const DIV_BY_LEVEL = { 1: [2, 10], 2: [2, 5, 10], 3: [2, 3, 4, 5, 6, 7, 8, 9, 10] };
  function genEinmaleins(level) {
    const rows = ROWS_BY_LEVEL[level] || ROWS_BY_LEVEL[1];
    const r = pick(rows), n = rnd(1, 10), p = r * n;
    const kinds = level === 1 ? ["dots", "mal", "mal", "table", "schnecke", "schnecke", "tausch"]
      : level === 2 ? ["mal", "gap", "grid", "div", "dots", "quad", "schnecke", "table"]
      : ["mal", "div", "divrest", "divrest", "messen", "grid", "divgap", "story", "quad"];
    const k = pick(kinds);
    if (k === "dots") {
      const rr = Math.min(r, n) <= 5 ? Math.min(r, n) : r, cc = rr === r ? n : r;
      return task({ skill: "einmaleins", prompt: "Wie viele Punkte sind es?", expr: `${rr} · ${cc} = ?`, answer: rr * cc, visual: { kind: "dots", rows: rr, cols: cc },
        hint: `Zähle eine Reihe und rechne dann ${rr} mal.`, explain: `${rr} · ${cc} = ${rr * cc}` });
    }
    if (k === "schnecke") {
      const m = rnd(2, 5), lines = [`${Array(m).fill(r).join(" + ")} = ?`, `? · ${r} = ${m * r}`];
      return figTask("einmaleins", "Schneckenaufgabe und Mausaufgabe!", { kind: "list", lines, cells: [{ v: m * r, given: false }, { v: m, given: false }] },
        `Zähle, wie oft die ${r} vorkommt – das ist die Mausaufgabe.`, `${lines[0].replace("?", m * r)} → ${m} · ${r} = ${m * r}`);
    }
    if (k === "table") {
      const xs = shuffle(Array.from({ length: 10 }, (_, i) => i + 1)).slice(0, 5).sort((a, b) => a - b);
      const v = []; xs.forEach((x) => v.push(x, x * r));
      return figTask("einmaleins", `Malreihe mit ${r}!`, fig("table", v, v.map((_, i) => i).filter((i) => i % 2 === 0), { label: `· ${r}` }),
        `Rechne jede Zahl mal ${r}. Tipp: Die Reihe springt immer um ${r} weiter.`, null);
    }
    if (k === "grid") {
      const R = shuffle(rows).slice(0, 2).sort((a, b) => a - b), C = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => level === 3 || x <= 6)).slice(0, level === 3 ? 3 : 2).sort((a, b) => a - b);
      const v = []; R.forEach((a) => C.forEach((b) => v.push(a * b)));
      const given = level === 3 ? [rnd(0, v.length - 1)] : [];
      return figTask("einmaleins", "Einmaleinstabelle: Fülle aus!", { kind: "grid", op: "·", rows: R, cols: C, cells: v.map((x, i) => ({ v: x, given: given.includes(i) })) },
        "Rechne die Zahl links mal die Zahl oben.", R.map((a) => C.map((b) => `${a}·${b}=${a * b}`).join(", ")).join("; "));
    }
    if (k === "quad") { const q = rnd(2, level === 3 ? 10 : 6); return task({ skill: "einmaleins", prompt: "Quadratzahl: Rechne!", expr: `${q} · ${q} = ?`, answer: q * q, visual: { kind: "dots", rows: q, cols: q }, hint: "Quadratzahlen bilden ein Quadrat aus Punkten.", explain: `${q} · ${q} = ${q * q}` }); }
    if (k === "tausch") return task({ skill: "einmaleins", prompt: "Tauschaufgabe: Was kommt heraus?", expr: `${n} · ${r} = ?`, answer: p, hint: `Tausche: ${r} · ${n} ist genauso viel.`, explain: `${n} · ${r} = ${r} · ${n} = ${p}` });
    if (k === "gap") return task({ skill: "einmaleins", prompt: "Welche Zahl fehlt?", expr: `? · ${r} = ${p}`, answer: n, hint: `Zähle in ${r}er-Schritten bis ${p}.`, explain: `${n} · ${r} = ${p}` });
    if (k === "div" || k === "divgap") {
      const d = pick(DIV_BY_LEVEL[level] || DIV_BY_LEVEL[1]), q = rnd(1, 10), a = d * q;
      return k === "div"
        ? task({ skill: "einmaleins", prompt: "Teile!", expr: `${a} : ${d} = ?`, answer: q, hint: `Wie oft passt die ${d} in die ${a}? Die Umkehraufgabe ? · ${d} = ${a} hilft.`, explain: `${q} · ${d} = ${a}, also ${a} : ${d} = ${q}` })
        : task({ skill: "einmaleins", prompt: "Welche Zahl fehlt?", expr: `${a} : ? = ${q}`, answer: d, hint: "Denk an die Malaufgabe.", explain: `${a} : ${d} = ${q}` });
    }
    if (k === "divrest") {
      const d = pick([2, 3, 4, 5, 10, 6, 9]), q = rnd(1, 9), rest = rnd(1, d - 1), a = d * q + rest;
      return figTask("einmaleins", "Teilen mit Rest!", { kind: "divrest", a, b: d, cells: [{ v: q, given: false }, { v: rest, given: false }] },
        `Welche Zahl aus der ${d}er-Reihe passt am besten unter ${a}? Was übrig bleibt, ist der Rest.`, `${a} : ${d} = ${q} Rest ${rest}`);
    }
    if (k === "messen") {
      const d = pick([2, 5, 10, 3, 4]), q = rnd(2, 10), a = d * q;
      return task({ skill: "einmaleins", prompt: `Messen: Wie oft passt die ${d} in die ${a}?`, expr: `${d} in ${a} = ?`, answer: q, hint: `Lege ${d}er-Streifen hintereinander, bis du bei ${a} bist.`, explain: `${q} · ${d} = ${a}, also ${d} in ${a} = ${q}` });
    }
    if (k === "story") {
      const st = pick([
        [`${n} Kätzchen haben je 4 Pfoten. Wie viele Pfoten sind das?`, n * 4],
        [`Ein Päckchen hat ${r} Leckerli. Kalea kauft ${n} Päckchen. Wie viele Leckerli sind das?`, p],
        [`${p} Fischlein werden gerecht an ${r} Kätzchen verteilt. Wie viele bekommt jedes?`, n],
      ]);
      return task({ skill: "einmaleins", prompt: st[0], answer: st[1], hint: "Mal oder geteilt? Mal dir die Aufgabe auf.", explain: `Ergebnis: ${st[1]}` });
    }
    const asChoice = Math.random() < 0.3;
    return task({ type: asChoice ? "choice" : "input", skill: "einmaleins", prompt: "Rechne!", expr: `${r} · ${n} = ?`, answer: p, choices: asChoice ? numChoices(p, 3, r, 0, 100) : [],
      hint: `Zähle in ${r}er-Schritten: ${Array.from({ length: Math.min(n, 4) }, (_, i) => r * (i + 1)).join(", ")} …`, explain: `${r} · ${n} = ${p}` });
  }

  // ------------------------------------------------------------------ Längen
  function genLaengen(level) {
    const k = level === 1 ? pick(["ruler", "ruler", "compare", "plus"]) : level === 2 ? pick(["ruler", "m", "plus", "missing", "compare"]) : pick(["convert", "convert2", "missing", "plus", "story"]);
    if (k === "ruler") {
      const max = level === 1 ? 15 : 20, len = rnd(3, max - 1), item = pick(["pencil", "band"]);
      return task({ skill: "laengen", prompt: item === "band" ? "Wie lang ist das Band?" : "Wie lang ist der Stift?", answer: len, unit: "cm", visual: { kind: "ruler", len, max, item },
        hint: "Lies am Ende ab – das Lineal beginnt bei 0.", explain: `Er ist ${len} cm lang.` });
    }
    if (k === "compare") {
      const a = rnd(5, level === 1 ? 20 : 90), b = rnd(5, level === 1 ? 20 : 90);
      if (a === b) return genLaengen(level);
      return task({ type: "compare", skill: "laengen", prompt: "Was ist länger? Setze das Zeichen ein.", expr: `${a} cm ? ${b} cm`, choices: ["<", ">", "="], answer: a < b ? "<" : ">", hint: "Vergleiche die Zahlen.", explain: `${a} cm ${a < b ? "<" : ">"} ${b} cm` });
    }
    if (k === "plus") {
      const [a, b] = level === 1 ? [rnd(2, 10), rnd(2, 9)] : pair("plus", level === 2 ? 1 : 3);
      return task({ skill: "laengen", prompt: `Zwei Bänder: ${a} cm und ${b} cm. Wie lang sind sie zusammen?`, answer: a + b, unit: "cm", hint: "Rechne die Längen zusammen.", explain: `${a} cm + ${b} cm = ${a + b} cm` });
    }
    if (k === "m") return task({ type: "choice", skill: "laengen", prompt: "Wie viele Zentimeter hat 1 Meter?", choices: shuffle(["10", "100", "1000"]), answer: "100", hint: "Ein großer Schritt ist ungefähr 1 Meter.", explain: "1 m = 100 cm" });
    if (k === "missing") { const a = rnd(1, 19) * 5; return task({ skill: "laengen", prompt: `Der Kratzbaum ist ${a} cm hoch. Wie viel fehlt auf 1 m?`, answer: 100 - a, unit: "cm", hint: "1 m = 100 cm. Ergänze auf 100.", explain: `${a} + ${100 - a} = 100 cm` }); }
    if (k === "convert") { const m = rnd(2, 9); return Math.random() < 0.5
      ? task({ skill: "laengen", prompt: "Wie viele Zentimeter?", expr: `${m} m = ? cm`, answer: m * 100, hint: "1 m = 100 cm.", explain: `${m} m = ${m * 100} cm` })
      : task({ skill: "laengen", prompt: "Wie viele Meter?", expr: `${m * 100} cm = ? m`, answer: m, hint: "100 cm = 1 m.", explain: `${m * 100} cm = ${m} m` }); }
    if (k === "convert2") { const m = rnd(1, 3), c = rnd(1, 9) * 10; return task({ skill: "laengen", prompt: "Wie viele Zentimeter?", expr: `${m} m ${c} cm = ? cm`, answer: m * 100 + c, hint: "1 m = 100 cm, dann die cm dazu.", explain: `${m * 100} cm + ${c} cm = ${m * 100 + c} cm` }); }
    const a = rnd(20, 60), b = rnd(10, 100 - a);
    return task({ skill: "laengen", prompt: `Mimi springt ${a} cm weit, Luna ${b} cm weiter als Mimi. Wie weit springt Luna?`, answer: a + b, unit: "cm", hint: "Weiter heißt: dazuzählen.", explain: `${a} + ${b} = ${a + b} cm` });
  }

  // ------------------------------------------------------------------ Formen & Körper
  const FLAECHEN = ["Kreis", "Dreieck", "Quadrat", "Rechteck"], KOERPER = ["Würfel", "Quader", "Kugel", "Zylinder", "Kegel", "Pyramide"];
  function genGeometrie(level) {
    const k = level === 1 ? pick(["flaeche", "flaeche", "ecken"]) : level === 2 ? pick(["koerper", "koerper", "flaeche", "ecken"]) : pick(["sym", "sym", "koerper", "props", "roll"]);
    if (k === "flaeche") { const f = pick(FLAECHEN); return task({ type: "choice", skill: "geometrie", prompt: "Wie heißt diese Form?", visual: { kind: "shape", name: f }, choices: shuffle(FLAECHEN), answer: f, hint: "Zähle die Ecken und schau die Seiten an.", explain: `Das ist ein ${f}.` }); }
    if (k === "koerper") { const f = pick(KOERPER), ch = shuffle([f].concat(shuffle(KOERPER.filter((x) => x !== f)).slice(0, 3))); return task({ type: "choice", skill: "geometrie", prompt: "Wie heißt dieser Körper?", visual: { kind: "body", name: f }, choices: ch, answer: f, hint: "Kann er rollen? Hat er Ecken?", explain: `Das ist ein${["Kugel", "Pyramide"].includes(f) ? "e" : ""} ${f}.` }); }
    if (k === "ecken") { const f = pick([["Dreieck", 3], ["Quadrat", 4], ["Rechteck", 4], ["Kreis", 0]]); return task({ skill: "geometrie", prompt: `Wie viele Ecken hat ein${f[0] === "Kreis" ? "" : ""} ${f[0]}?`, visual: { kind: "shape", name: f[0] }, answer: f[1], hint: "Zähle die Spitzen.", explain: `Ein ${f[0]} hat ${f[1]} Ecken.` }); }
    if (k === "sym") { const sym = Math.random() < 0.5; return task({ type: "choice", skill: "geometrie", prompt: "Ist die Figur symmetrisch? (Spiegelachse gestrichelt)", visual: { kind: "sym", sym, k: rnd(0, 2) }, choices: ["Ja", "Nein"], answer: sym ? "Ja" : "Nein", hint: "Klappe die Figur in Gedanken an der Linie zusammen – passen beide Hälften genau?", explain: sym ? "Beide Hälften sind gleich – symmetrisch." : "Die Hälften sind verschieden – nicht symmetrisch." }); }
    if (k === "roll") return task({ type: "choice", skill: "geometrie", prompt: "Welcher Körper kann nur rollen und hat keine Ecken und Kanten?", choices: shuffle(["Kugel", "Würfel", "Zylinder"]), answer: "Kugel", hint: "Denk an einen Ball.", explain: "Die Kugel." });
    const q = pick([["Wie viele Flächen hat ein Würfel?", 6], ["Wie viele Ecken hat ein Würfel?", 8], ["Wie viele Ecken hat ein Quader?", 8], ["Wie viele Flächen hat ein Quader?", 6]]);
    return task({ skill: "geometrie", prompt: q[0], visual: { kind: "body", name: q[0].includes("Würfel") ? "Würfel" : "Quader" }, answer: q[1], hint: "Zähle auch die, die man nicht sieht!", explain: `Richtig ist ${q[1]}.` });
  }

  // ------------------------------------------------------------------ Zahlenfolgen & Muster
  function genMuster(level) {
    const steps = level === 1 ? [1, 2, 10, -1] : level === 2 ? [2, 5, 10, -2, -10, 3] : [3, 4, 5, -5, -3, "alt"];
    const st = pick(steps);
    let seq = [], x;
    if (st === "alt") { x = rnd(1, 20); for (let i = 0; i < 6; i++) { seq.push(x); x += i % 2 ? 3 : 2; } }
    else { const lim = level === 1 ? 20 : 100; x = st > 0 ? rnd(0, lim - st * 6) : rnd(-st * 6, lim); if (x < 0) return genMuster(level); for (let i = 0; i < 6; i++) { seq.push(x); x += st; } }
    if (seq.some((v) => v < 0 || v > 100)) return genMuster(level);
    const gapAt = level === 3 && Math.random() < 0.4 ? rnd(1, 4) : 5;
    const shown = seq.map((v, i) => (i === gapAt ? "?" : v)).slice(0, gapAt === 5 ? 6 : 6);
    return task({ skill: "muster", prompt: "Wie geht die Zahlenfolge weiter?", expr: shown.join(", "), answer: seq[gapAt],
      hint: st === "alt" ? "Schau genau: Die Sprünge wechseln sich ab." : "Wie groß ist der Sprung von einer Zahl zur nächsten?", explain: st === "alt" ? "Immer abwechselnd +2 und +3." : `Immer ${st > 0 ? "+" : "−"}${Math.abs(st)}.` });
  }

  // ------------------------------------------------------------------ Hunderterfeld, Zahlen bis 1000, Ordnungszahlen
  function genHundert(level) {
    const k = level === 1 ? pick(["field", "field", "ord", "nb"]) : level === 2 ? pick(["field", "h", "hline", "ord"]) : pick(["h", "hcalc", "hline", "hcmp", "field"]);
    if (k === "field") {
      const col = rnd(0, 7), row = rnd(0, 7), start = row * 10 + col + 1;
      const v = Array.from({ length: 9 }, (_, i) => start + Math.floor(i / 3) * 10 + (i % 3));
      const given = level === 1 ? [4, pick([0, 2, 6, 8])] : [pick([0, 1, 2, 3, 4, 5, 6, 7, 8])];
      return figTask("hundert", "Hunderterfeld: Ergänze den Ausschnitt!", fig("hfield", v, given), "Nach rechts +1, nach unten +10.", null);
    }
    if (k === "nb") { const n = rnd(12, 98); return task({ type: "choice", skill: "hundert", prompt: `Welche Zahl steht im Hunderterfeld genau unter ${n - 10}?`, choices: shuffle([String(n), String(n - 9), String(n + 1)]), answer: String(n), hint: "Darunter heißt: 10 mehr.", explain: `${n - 10} + 10 = ${n}` }); }
    if (k === "ord") {
      const len = 6, mark = rnd(0, 5), ans = `${mark + 1}.`;
      return task({ type: "choice", skill: "hundert", prompt: "Das wievielte Kätzchen in der Reihe trägt den Hut? (Gezählt wird von links)", visual: { kind: "row", n: len, mark },
        choices: shuffle([ans, `${mark + 2}.`, `${mark === 0 ? 3 : mark}.`].filter((x, i, a) => a.indexOf(x) === i)), answer: ans, hint: "Zähle von links: erstes, zweites, drittes …", explain: `Es ist das ${ans} Kätzchen.` });
    }
    if (k === "h") {
      const h = rnd(1, 8) * 100, up = Math.random() < 0.5;
      return task({ skill: "hundert", prompt: up ? `Welche Hunderterzahl kommt nach ${h}?` : `Welche Hunderterzahl kommt vor ${h + 100}?`, answer: up ? h + 100 : h, hint: "Hunderterzahlen: 100, 200, 300 …", explain: up ? `Nach ${h} kommt ${h + 100}.` : `Vor ${h + 100} kommt ${h}.` });
    }
    if (k === "hline") { const m = rnd(1, 9) * 100; return task({ type: "numberline", skill: "hundert", prompt: "Welche Zahl zeigt der Pfeil?", numberline: { min: 0, max: 1000, marker: m }, answer: m, hint: "Jeder lange Strich ist 100 mehr.", explain: `Der Pfeil zeigt auf ${m}.` }); }
    if (k === "hcalc") { const a = rnd(1, 8) * 100, b = rnd(1, (1000 - a) / 100) * 100, plus = Math.random() < 0.5 || a === b;
      return plus ? task({ skill: "hundert", prompt: "Rechne mit Hunderterzahlen!", expr: `${a} + ${b} = ?`, answer: a + b, hint: `Denk an ${a / 100} + ${b / 100}.`, explain: `${a / 100} + ${b / 100} = ${(a + b) / 100}, also ${a + b}` })
        : task({ skill: "hundert", prompt: "Rechne mit Hunderterzahlen!", expr: `${Math.max(a, b)} - ${Math.min(a, b)} = ?`, answer: Math.abs(a - b), hint: "Denk an die kleine Aufgabe ohne Nullen.", explain: `${Math.max(a, b)} - ${Math.min(a, b)} = ${Math.abs(a - b)}` }); }
    const a = rnd(1, 9) * 100 + rnd(0, 9) * 10, b = rnd(1, 9) * 100 + rnd(0, 9) * 10;
    if (a === b) return genHundert(level);
    return task({ type: "compare", skill: "hundert", prompt: "Setze das richtige Zeichen ein.", expr: `${a} ? ${b}`, choices: ["<", ">", "="], answer: a < b ? "<" : ">", hint: "Vergleiche zuerst die Hunderter.", explain: `${a} ${a < b ? "<" : ">"} ${b}` });
  }

  // ------------------------------------------------------------------ Gewicht (kg, dag) & Liter
  function genGroessen(level) {
    const k = level === 1 ? pick(["kg", "weights", "schaetz", "liter"]) : level === 2 ? pick(["weights", "fehlt", "kgdag", "liter", "literstory"]) : pick(["umw", "cmp", "fehlt", "litermal", "weights"]);
    if (k === "kg") return task({ type: "choice", skill: "groessen", prompt: "Wie viel Dekagramm hat 1 Kilogramm?", choices: shuffle(["10 dag", "100 dag", "1000 dag"]), answer: "100 dag", hint: "1 kg = 100 dag.", explain: "1 kg = 100 dag" });
    if (k === "weights") {
      const set = level === 1 ? [50, 20, 10, 5, 2, 1] : [100, 50, 20, 10, 5];
      const total = level === 1 ? rnd(3, 19) * 5 : rnd(11, 39) * 5;
      const ws = coinsFor(total, set);
      if (!ws) return genGroessen(level);
      return task({ skill: "groessen", prompt: "Wie schwer ist das zusammen? (in dag)", visual: { kind: "weights", values: shuffle(ws) }, answer: total, unit: "dag",
        hint: "1 kg = 100 dag. Zähle alle Gewichte zusammen.", explain: `${ws.sort((a, b) => b - a).map((w) => (w >= 100 ? w / 100 + " kg" : w + " dag")).join(" + ")} = ${total} dag` });
    }
    if (k === "schaetz") { const q = pick([["Was ist ungefähr 1 kg schwer?", "Ein Paket Mehl", ["Ein Paket Mehl", "Eine Feder", "Ein Auto"]], ["Was ist am schwersten?", "Ein Elefant", ["Ein Elefant", "Eine Katze", "Eine Maus"]]]);
      return task({ type: "choice", skill: "groessen", prompt: q[0], choices: shuffle(q[2]), answer: q[1], hint: "Stell dir vor, du hebst es hoch.", explain: q[1] + "." }); }
    if (k === "fehlt") { const a = rnd(1, 19) * 5; return task({ skill: "groessen", prompt: `Im Futtersack sind ${a} dag. Wie viel fehlt auf 1 kg?`, answer: 100 - a, unit: "dag", hint: "1 kg = 100 dag. Ergänze auf 100.", explain: `${a} + ${100 - a} = 100 dag` }); }
    if (k === "kgdag") { const d = rnd(1, 9) * 10; return task({ skill: "groessen", prompt: "Wie viel Dekagramm?", expr: `1 kg ${d} dag = ? dag`, answer: 100 + d, hint: "1 kg = 100 dag, dann dazuzählen.", explain: `100 dag + ${d} dag = ${100 + d} dag` }); }
    if (k === "umw") { const n = rnd(2, 9); return Math.random() < 0.5 ? task({ skill: "groessen", prompt: "Wie viel Dekagramm?", expr: `${n} kg = ? dag`, answer: n * 100, hint: "1 kg = 100 dag.", explain: `${n} kg = ${n * 100} dag` })
      : task({ skill: "groessen", prompt: "Wie viel Kilogramm?", expr: `${n * 100} dag = ? kg`, answer: n, hint: "100 dag = 1 kg.", explain: `${n * 100} dag = ${n} kg` }); }
    if (k === "cmp") { const a = pick([90, 100, 110, 120, 80]); return task({ type: "compare", skill: "groessen", prompt: "Setze das richtige Zeichen ein.", expr: `1 kg ? ${a} dag`, choices: ["<", ">", "="], answer: 100 < a ? "<" : 100 > a ? ">" : "=", hint: "1 kg = 100 dag.", explain: `1 kg = 100 dag ${100 < a ? "<" : 100 > a ? ">" : "="} ${a} dag` }); }
    if (k === "liter") { const n = rnd(2, level === 1 ? 6 : 9); return task({ skill: "groessen", prompt: "Wie viele Liter sind das zusammen?", visual: { kind: "liters", n }, answer: n, unit: "l", hint: "Jede Flasche hat 1 Liter.", explain: `${n} Flaschen = ${n} l` }); }
    if (k === "literstory") { const a = rnd(6, 10), b = rnd(1, a - 1); return task({ skill: "groessen", prompt: `Im Kübel sind ${a} l Wasser. Kalea gießt ${b} l in die Blumen. Wie viel bleibt im Kübel?`, answer: a - b, unit: "l", hint: "Es wird weniger – rechne minus.", explain: `${a} l - ${b} l = ${a - b} l` }); }
    const c = pick([2, 5]), n = rnd(2, 6);
    return task({ skill: "groessen", prompt: `Eine Kanne fasst ${c} l. Wie viele Kannen braucht man für ${c * n} l?`, answer: n, hint: `Wie oft passt ${c} in ${c * n}?`, explain: `${c * n} : ${c} = ${n}` });
  }

  // ------------------------------------------------------------------ Forschen & Entdecken
  let MAGIC_TRI = null;
  function magicTriSolutions() {
    if (MAGIC_TRI) return MAGIC_TRI;
    MAGIC_TRI = [];
    const perm = (arr, cur) => { if (!arr.length) { const v = cur, s1 = v[0] + v[1] + v[2]; if (v[2] + v[3] + v[4] === s1 && v[4] + v[5] + v[0] === s1) MAGIC_TRI.push(v.slice()); return; }
      arr.forEach((x, i) => perm(arr.slice(0, i).concat(arr.slice(i + 1)), cur.concat([x]))); };
    perm([1, 2, 3, 4, 5, 6], []);
    return MAGIC_TRI;
  }
  const MAGIC_SQ_BASE = [2, 7, 6, 9, 5, 1, 4, 3, 8];
  function magicSquare() {
    let g = MAGIC_SQ_BASE.slice();
    const rot = (q) => [q[6], q[3], q[0], q[7], q[4], q[1], q[8], q[5], q[2]], mir = (q) => [q[2], q[1], q[0], q[5], q[4], q[3], q[8], q[7], q[6]];
    for (let i = rnd(0, 3); i > 0; i--) g = rot(g);
    if (Math.random() < 0.5) g = mir(g);
    return g;
  }
  function sudoku4() {
    let g = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
    const map = shuffle([1, 2, 3, 4]); g = g.map((r) => r.map((x) => map[x - 1]));
    if (Math.random() < 0.5) [g[0], g[1]] = [g[1], g[0]];
    if (Math.random() < 0.5) [g[2], g[3]] = [g[3], g[2]];
    if (Math.random() < 0.5) g = g[0].map((_, c) => g.map((r) => r[c]));
    if (Math.random() < 0.5) [g[0], g[1], g[2], g[3]] = [g[2], g[3], g[0], g[1]];
    return g.flat();
  }
  function genForschen(level) {
    const k = level === 1 ? pick(["sudoku", "sudoku", "crypto", "tri"]) : level === 2 ? pick(["sudoku", "magictri", "crypto", "tri", "magicsq"]) : pick(["magicsq", "magictri", "sudoku", "crypto"]);
    if (k === "sudoku") {
      const v = sudoku4(), blanksN = level === 1 ? 6 : level === 2 ? 8 : 10;
      const blank = shuffle(Array.from({ length: 16 }, (_, i) => i)).slice(0, blanksN);
      return figTask("forschen", "Mini-Sudoku: Setze 1, 2, 3 und 4 ein!", { kind: "sudoku4", cells: v.map((x, i) => ({ v: x, given: !blank.includes(i) })) },
        "In jeder Zeile, jeder Spalte und jedem dicken Kästchen kommt jede Zahl genau einmal vor.", null);
    }
    if (k === "magictri") {
      const sol = pick(magicTriSolutions()), target = sol[0] + sol[1] + sol[2];
      const given = level === 2 ? [0, 2, 4] : pick([[0, 2], [0, 4], [2, 4]]);
      return figTask("forschen", "Zauberdreieck: Setze die Zahlen 1 bis 6 ein!", { kind: "magictri", target, cells: sol.map((x, i) => ({ v: x, given: given.includes(i) })) },
        "Jede Seite muss dieselbe Summe ergeben. Jede Zahl von 1 bis 6 kommt genau einmal vor.", null);
    }
    if (k === "magicsq") {
      const v = magicSquare(), blanksN = level === 2 ? 3 : 5;
      const blank = shuffle([0, 1, 2, 3, 5, 6, 7, 8]).slice(0, blanksN);
      return figTask("forschen", "Zauberquadrat: Jede Reihe ergibt 15!", { kind: "magicsq", cells: v.map((x, i) => ({ v: x, given: !blank.includes(i) })) },
        "Rechne in jeder Reihe: Was fehlt noch auf 15?", null);
    }
    if (k === "tri") {
      const n = rnd(3, 4), next = ((n + 1) * (n + 2)) / 2;
      return task({ skill: "forschen", prompt: `Dreieckszahlen: 1, 3, 6${n === 4 ? ", 10" : ""} … Wie viele Punkte hat das nächste Dreieck?`, visual: { kind: "tri", n }, answer: next,
        hint: "Das nächste Dreieck bekommt unten eine Reihe dazu – mit einem Punkt mehr als vorher.", explain: `${(n * (n + 1)) / 2} + ${n + 1} = ${next}` });
    }
    const A = ["🐱", "🐟", "🧶", "🍪"];
    const a = rnd(2, level === 1 ? 6 : 9), b = rnd(1, level === 1 ? 6 : 9);
    if (level === 1) return task({ skill: "forschen", prompt: `Kryptogramm: Wie viel ist ${A[1]} wert?`, visual: { kind: "crypto", lines: [`${A[0]} + ${A[0]} = ${2 * a}`, `${A[0]} + ${A[1]} = ${a + b}`] }, answer: b,
      hint: `Finde zuerst heraus, wie viel ${A[0]} ist.`, explain: `${A[0]} = ${a}, also ${A[1]} = ${a + b} − ${a} = ${b}` });
    const c = rnd(1, 9);
    return task({ skill: "forschen", prompt: `Kryptogramm: Wie viel ist ${A[2]} wert?`, visual: { kind: "crypto", lines: [`${A[0]} + ${A[0]} + ${A[0]} = ${3 * a}`, `${A[0]} + ${A[1]} = ${a + b}`, `${A[1]} + ${A[2]} = ${b + c}`] }, answer: c,
      hint: "Löse Zeile für Zeile von oben nach unten.", explain: `${A[0]} = ${a}, ${A[1]} = ${b}, ${A[2]} = ${c}` });
  }

  const MODULES = [
    { key: "zahlen100", name: "Zahlen bis 100", emoji: "💯", color: "#a78bfa", gen: genZahlen },
    { key: "hundert",   name: "Hunderterfeld & 1000", emoji: "🔟", color: "#8b5cf6", gen: genHundert },
    { key: "plus",      name: "Plus",           emoji: "➕", color: "#34d399", gen: genPlus },
    { key: "minus",     name: "Minus",          emoji: "➖", color: "#60a5fa", gen: genMinus },
    { key: "ergaenzen", name: "Ergänzen",       emoji: "➰", color: "#f472b6", gen: genErgaenzen },
    { key: "raetsel",   name: "Rechenrätsel",   emoji: "🧩", color: "#c084fc", gen: genRaetsel },
    { key: "doppelt",   name: "Verdoppeln & Halbieren", emoji: "✌️", color: "#38bdf8", gen: genDoppelt },
    { key: "einmaleins",name: "Einmaleins",     emoji: "✖️", color: "#f43f5e", gen: genEinmaleins },
    { key: "geld",      name: "Geld",           emoji: "💶", color: "#fbbf24", gen: genGeld },
    { key: "uhr",       name: "Uhr",            emoji: "🕒", color: "#fb923c", gen: genUhr },
    { key: "zeit",      name: "Zeit & Kalender",emoji: "📅", color: "#2dd4bf", gen: genZeit },
    { key: "laengen",   name: "Längen",         emoji: "📏", color: "#84cc16", gen: genLaengen },
    { key: "groessen",  name: "Gewicht & Liter", emoji: "⚖️", color: "#0ea5e9", gen: genGroessen },
    { key: "geometrie", name: "Formen & Körper",emoji: "🔷", color: "#6366f1", gen: genGeometrie },
    { key: "muster",    name: "Zahlenfolgen",   emoji: "🔢", color: "#14b8a6", gen: genMuster },
    { key: "forschen",  name: "Forschen & Entdecken", emoji: "🔍", color: "#ec4899", gen: genForschen },
    { key: "sach",      name: "Rechengeschichten", emoji: "📖", color: "#f87171", gen: genSach },
  ];

  function makeSession(keys, level, n, levelsByKey) {
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < n * 30) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      const mod = MODULES.find((m) => m.key === key);
      if (!mod) continue;
      const lv = (levelsByKey && levelsByKey[key]) || level || 1;
      const t = mod.gen(lv);
      const sig = t.type + "|" + t.prompt + "|" + (t.expr || "") + "|" + JSON.stringify(t.clock || t.money || t.numberline || t.blocks || t.figure || t.visual || "");
      if (seen.has(sig)) continue;
      seen.add(sig);
      t.module = key;
      out.push(t);
    }
    return out;
  }

  window.Generators = { MODULES, makeSession, shuffle, clockWord, clockTask, parseEquation, moneyTask };
})();
