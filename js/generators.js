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

  function genZeit(level) {
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

  function genRaetsel(level) {
    return pick([genTriangle, genTriangle, genWall, genWall, genHouse, genFamily, genAnalogy])(level);
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

  // ------------------------------------------------------------------ Einmaleins & Teilen
  function genEinmaleins(level) {
    const rows = level === 1 ? [2, 5, 10] : level === 2 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10];
    const r = pick(rows), n = rnd(1, 10), p = r * n;
    const k = level === 1 ? pick(["dots", "mal", "mal", "table"]) : level === 2 ? pick(["mal", "tausch", "gap", "dots", "table", "story"]) : pick(["mal", "div", "div", "gap", "divgap", "story"]);
    if (k === "dots") {
      const rr = Math.min(r, n) <= 5 ? Math.min(r, n) : r, cc = rr === r ? n : r;
      return task({ skill: "einmaleins", prompt: "Wie viele Punkte sind es?", expr: `${rr} · ${cc} = ?`, answer: rr * cc, visual: { kind: "dots", rows: rr, cols: cc },
        hint: `Zähle eine Reihe und rechne dann ${rr} mal.`, explain: `${rr} · ${cc} = ${rr * cc}` });
    }
    if (k === "table") {
      const xs = shuffle(Array.from({ length: 10 }, (_, i) => i + 1)).slice(0, 5).sort((a, b) => a - b);
      const v = []; xs.forEach((x) => v.push(x, x * r));
      return figTask("einmaleins", `Malreihe mit ${r}!`, fig("table", v, v.map((_, i) => i).filter((i) => i % 2 === 0), { label: `· ${r}` }),
        `Rechne jede Zahl mal ${r}. Tipp: Die Reihe springt immer um ${r} weiter.`, null);
    }
    if (k === "tausch") return task({ skill: "einmaleins", prompt: "Tauschaufgabe: Was kommt heraus?", expr: `${n} · ${r} = ?`, answer: p, hint: `Tausche: ${r} · ${n} ist genauso viel.`, explain: `${n} · ${r} = ${r} · ${n} = ${p}` });
    if (k === "gap") return task({ skill: "einmaleins", prompt: "Welche Zahl fehlt?", expr: `? · ${r} = ${p}`, answer: n, hint: `Zähle in ${r}er-Schritten bis ${p}.`, explain: `${n} · ${r} = ${p}` });
    if (k === "div") return task({ skill: "einmaleins", prompt: "Teile!", expr: `${p} : ${r} = ?`, answer: n, hint: `Wie oft passt die ${r} in die ${p}? Die Malaufgabe hilft.`, explain: `${n} · ${r} = ${p}, also ${p} : ${r} = ${n}` });
    if (k === "divgap") return task({ skill: "einmaleins", prompt: "Welche Zahl fehlt?", expr: `${p} : ? = ${n}`, answer: r, hint: "Denk an die Malaufgabe.", explain: `${p} : ${r} = ${n}` });
    if (k === "story") {
      const st = pick([
        [`${n} Kätzchen haben je 4 Pfoten. Wie viele Pfoten sind das?`, n * 4, 4],
        [`Ein Päckchen hat ${r} Leckerli. Kalea kauft ${n} Päckchen. Wie viele Leckerli sind das?`, p, r],
        [`${p} Fischlein werden gerecht an ${r} Kätzchen verteilt. Wie viele bekommt jedes?`, n, r],
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

  const MODULES = [
    { key: "zahlen100", name: "Zahlen bis 100", emoji: "💯", color: "#a78bfa", gen: genZahlen },
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
    { key: "geometrie", name: "Formen & Körper",emoji: "🔷", color: "#6366f1", gen: genGeometrie },
    { key: "muster",    name: "Zahlenfolgen",   emoji: "🔢", color: "#14b8a6", gen: genMuster },
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
