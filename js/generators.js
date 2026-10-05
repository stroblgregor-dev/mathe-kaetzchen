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

  const MODULES = [
    { key: "zahlen100", name: "Zahlen bis 100", emoji: "🔢", color: "#a78bfa", gen: genZahlen },
    { key: "plus",      name: "Plus",           emoji: "➕", color: "#34d399", gen: genPlus },
    { key: "minus",     name: "Minus",          emoji: "➖", color: "#60a5fa", gen: genMinus },
    { key: "ergaenzen", name: "Ergänzen",       emoji: "🧩", color: "#f472b6", gen: genErgaenzen },
    { key: "geld",      name: "Geld",           emoji: "💶", color: "#fbbf24", gen: genGeld },
    { key: "uhr",       name: "Uhr",            emoji: "🕒", color: "#fb923c", gen: genUhr },
    { key: "zeit",      name: "Zeit & Kalender",emoji: "📅", color: "#2dd4bf", gen: genZeit },
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
      const sig = t.type + "|" + t.prompt + "|" + (t.expr || "") + "|" + JSON.stringify(t.clock || t.money || t.numberline || t.blocks || "");
      if (seen.has(sig)) continue;
      seen.add(sig);
      t.module = key;
      out.push(t);
    }
    return out;
  }

  window.Generators = { MODULES, makeSession, shuffle, clockWord, clockTask, parseEquation, moneyTask };
})();
