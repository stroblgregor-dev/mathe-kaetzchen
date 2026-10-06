/* KI-Anbindung direkt im Browser: Claude über das offizielle Anthropic-SDK (per CDN geladen).
   Der API-Key liegt nur auf diesem Gerät (localStorage) – nie im Code/Repo. */
(function () {
  "use strict";

  const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm";
  const DEFAULT_MODEL = "claude-opus-5-5";
  const EFFORT = "medium";

  const SKILLS = {
    zahlen100: "Zahlen bis 100 (Zehner/Einer, Nachbarzahlen, Zahlenstrahl, Vergleichen)",
    plus: "Plus bis 100",
    minus: "Minus bis 100",
    ergaenzen: "Ergänzen / Platzhalter",
    geld: "Geld (Euro und Cent)",
    uhr: "Uhrzeit lesen",
    zeit: "Zeitspannen und Zeiteinheiten",
    sach: "Sachaufgaben (Textaufgaben)",
    raetsel: "Rechenrätsel (Rechendreiecke, Zahlenmauern, Zahlenhäuser, Zahlenfamilien)",
    doppelt: "Verdoppeln und Halbieren",
    einmaleins: "Einmaleins und Teilen",
    laengen: "Längen (cm, m)",
    geometrie: "Formen und Körper, Symmetrie",
    muster: "Zahlenfolgen und Muster",
    sonstiges: "Sonstiges",
  };
  const TASK_TYPES = ["input", "choice", "compare", "clock", "money", "numberline", "blocks", "figure"];

  const nullable = (s) => ({ anyOf: [s, { type: "null" }] });
  const obj = (props) => ({ type: "object", additionalProperties: false, properties: props, required: Object.keys(props) });
  const TASK_SCHEMA = obj({
    type: { type: "string", enum: TASK_TYPES },
    skill: { type: "string", enum: Object.keys(SKILLS) },
    prompt: { type: "string" },
    expr: nullable({ type: "string" }),
    answer: { type: "string" },
    choices: { type: "array", items: { type: "string" } },
    unit: nullable({ type: "string" }),
    hint: nullable({ type: "string" }),
    explain: nullable({ type: "string" }),
    clock: nullable(obj({ h: { type: "integer" }, m: { type: "integer" } })),
    money: nullable({ type: "array", items: { type: "integer" } }),
    numberline: nullable(obj({ min: { type: "integer" }, max: { type: "integer" }, marker: { type: "integer" } })),
    blocks: nullable(obj({ tens: { type: "integer" }, ones: { type: "integer" } })),
    figure: nullable(obj({
      kind: { type: "string", enum: ["triangle", "wall", "house", "family", "table", "list"] },
      roof: nullable({ type: "integer" }), label: nullable({ type: "string" }),
      lines: { type: "array", items: { type: "string" } },
      cells: { type: "array", items: obj({ v: { type: "integer" }, given: { type: "boolean" } }) },
    })),
  });
  const PACK_SCHEMA = obj({ title: { type: "string" }, summary: { type: "string" }, emoji: { type: "string" }, tasks: { type: "array", items: TASK_SCHEMA } });

  const SYSTEM = `Du erstellst Mathematik-Übungsaufgaben für ein Kind in der 2. Klasse Volksschule in Österreich.
Die Aufgaben werden in einer Lern-App mit Kätzchen-Thema gespielt. Das Kind kann erst wenig lesen.

Lehrplan-Rahmen 2. Klasse (Österreich, z.B. Schulbuch "Die Matheforscher:innen"): Wiederholung Zahlenraum 20,
Zahlenraum bis 100, Zehner und Einer, Plus und Minus mit und ohne Zehnerübergang, Ergänzen, Platzhalteraufgaben,
Tausch- und Umkehraufgaben, Verdoppeln/Halbieren, Einmaleins und Teilen, Geld (Euro und Cent), Uhr und Zeitspannen,
Längen (cm, m), Formen und Körper, Zahlenfolgen, einfache Sachaufgaben.

Sprache: österreichisches Deutsch (Jänner; "viertel 3" = 2:15, "halb 3" = 2:30, "dreiviertel 3" = 2:45).
Kurze, einfache Sätze, maximal 2 Sätze pro Aufgabe. Gern Katzen, Tiere, Schule und Alltag als Geschichte.
Keine Zahlen über 100 (Ausnahme: Uhrzeit, Geld bis 100 €).

Aufgabentypen (Feld "type") – alle nicht benötigten Felder sind null bzw. choices = []:
- "input": Zahl eintippen. "expr" ist die Rechnung mit genau einem "?" für die Lücke, z.B. "34 + 25 = ?"
  oder "34 + ? = 50" oder "? - 12 = 30". Nur Zahlen, +, -, ·, :, = und ?. "answer" ist die Zahl.
  Für Sachaufgaben: expr = null, Frage steht in "prompt", "answer" ist die Zahl, "unit" z.B. "€", "c",
  "min", "cm" oder null.
- "choice": Antwort auswählen. 3–4 "choices" (Strings), "answer" ist exakt einer davon. "expr" optional (mit "?").
- "compare": expr wie "45 ? 54" oder "30 + 5 ? 35", choices = ["<", ">", "="], answer ist das Zeichen.
- "clock": analoge Uhr anzeigen. clock = {"h": 0-23, "m": 0-59}. choices = 3–4 Zeitangaben, answer ist eine davon.
  Schreibweise entweder österreichisch in Worten ("viertel 4", "halb 4", "dreiviertel 4", "3 Uhr") oder digital
  ("3:15"). Innerhalb einer Aufgabe nicht mischen.
- "money": Münzen/Scheine anzeigen. money = Liste der Werte in Cent (1,2,5,10,20,50,100,200,500,1000,2000,5000).
  Frage z.B. "Wie viel Geld ist das?" -> answer ist der Betrag als Zahl, unit "€" oder "c".
  Keine Kommabeträge: entweder nur Cent (unter 1 €) oder nur ganze Euro.
- "numberline": Zahlenstrahl. numberline = {"min","max","marker"}, (max-min) 10, 20 oder 100.
  Frage "Welche Zahl zeigt der Pfeil?" -> answer = marker.
- "blocks": Zehnerstangen und Einerwürfel. blocks = {"tens","ones"}, Frage "Welche Zahl ist das?", answer = tens*10+ones.

- "figure": ausfüllbare Figur wie am Arbeitsblatt (expr = null, answer = "", choices = []).
  figure = {kind, cells: [{v, given}], roof, label, lines}. Felder mit given=false füllt das Kind aus;
  mindestens ein Feld given=false, und die Figur muss mit den gegebenen Zahlen eindeutig lösbar sein.
  * "triangle" (Rechendreieck): genau 6 cells = [innen oben, innen links unten, innen rechts unten,
    Seite links (= oben + links unten), Seite rechts (= oben + rechts unten), Seite unten (= links unten + rechts unten)].
  * "wall" (Zahlenmauer): 6 cells (unterste Reihe 3 Steine von links nach rechts, dann 2, dann die Spitze)
    oder 10 cells (4 Reihen); jeder Stein ist die Summe der zwei Steine darunter.
  * "house" (Zahlenhaus/Zerlegungshaus): roof = Dachzahl, cells = [links, rechts, links, rechts, …] mit links + rechts = roof.
  * "family" (Zahlenfamilie, Tausch-/Umkehraufgaben): 15 cells = [a, Summe, b] und dann 4 Zeilen (x, y, z):
    a + b = Summe, b + a = Summe, Summe − a = b, Summe − b = a. Die 12 Zeilen-Felder sind given=false.
  * "table" (Tabelle): label z.B. "das Doppelte", "die Hälfte", "· 5"; cells = [Zahl, Ergebnis, Zahl, Ergebnis, …], Zahlen given=true.
  * "list" (Päckchen, z.B. "Die kleine Aufgabe hilft"): lines = ["2 + 5 = 7", "12 + 5 = ?", …] (je Zeile höchstens ein ?),
    cells = die Lösungen der ? in Reihenfolge (alle given=false).
  Nicht benötigte Felder: roof = null, label = null, lines = [].
  Nutze "figure", wenn am Lernzettel solche Darstellungen vorkommen (Rechendreiecke, Zahlenmauern, Zahlenhäuser, Sterne/Zahlenfamilien, Tabellen).

"hint": ein kurzer, freundlicher Tipp, ohne das Ergebnis zu verraten.
"explain": kurzer Lösungsweg für nach einem Fehler (z.B. "34 + 8 = 34 + 6 + 2 = 42").
"skill": passende Kategorie.
Jede Lösung muss mathematisch exakt stimmen. Variiere Aufgabentypen und Zahlen, keine Duplikate.
Titel kurz und kindgerecht (max. 4 Wörter), "summary" ist ein Satz für die Eltern, was geübt wird. "emoji": ein passendes Emoji.`;

  // ------------------------------------------------------------------ Client
  let sdk = null;
  async function client(key) {
    if (!key) throw new Error("Kein Anthropic-API-Key hinterlegt (Elternbereich → ⚙️ Einstellungen).");
    if (!sdk) {
      try { sdk = await import(SDK_URL); }
      catch (e) { throw new Error("Die KI-Bibliothek konnte nicht geladen werden – ist das Handy online?"); }
    }
    const Anthropic = sdk.default || sdk.Anthropic;
    return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2 });
  }

  function friendly(e) {
    const msg = String((e && e.message) || e);
    const low = msg.toLowerCase();
    if (e && e.status === 401) return "Der API-Key ist ungültig. Bitte unter ⚙️ Einstellungen einen gültigen Key eintragen.";
    if (low.includes("credit balance")) return "Das Guthaben des Anthropic-Kontos ist aufgebraucht. Bitte unter console.anthropic.com → Plans & Billing aufladen.";
    if (e && e.status === 429) return "Die KI ist gerade ausgelastet. Bitte in einer Minute nochmal versuchen.";
    if (e && e.status === 404) return "Das eingestellte KI-Modell wurde nicht gefunden. Bitte unter ⚙️ Einstellungen prüfen.";
    if (e && e.status >= 500) return `Die KI meldet einen Fehler (${e.status}). Bitte später nochmal versuchen.`;
    if (e && e.name && /Connection/.test(e.name)) return "Keine Verbindung zur KI – ist das Handy online?";
    return msg;
  }

  async function call(key, model, content) {
    const cl = await client(key);
    const req = {
      model: model || DEFAULT_MODEL, max_tokens: 16000, system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { effort: EFFORT, format: { type: "json_schema", schema: PACK_SCHEMA } },
    };
    let resp;
    try {
      resp = await cl.messages.stream(req).finalMessage();
    } catch (e) {
      const low = String(e.message || "").toLowerCase();
      if (e.status === 400 && /output_config|schema|format|effort/.test(low)) {
        delete req.output_config;
        req.messages[0].content = content.concat([{ type: "text", text: "Antworte ausschließlich mit einem JSON-Objekt {title, summary, emoji, tasks:[...]} nach den Regeln oben." }]);
        try { resp = await cl.messages.stream(req).finalMessage(); } catch (e2) { throw new Error(friendly(e2)); }
      } else throw new Error(friendly(e));
    }
    if (resp.stop_reason === "refusal") throw new Error("Die KI hat die Anfrage abgelehnt. Bitte anders formulieren.");
    if (resp.stop_reason === "max_tokens") throw new Error("Die Antwort war zu lang – bitte weniger Aufgaben anfordern.");
    const text = resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Die KI hat kein gültiges Ergebnis geliefert.");
    return JSON.parse(m[0]);
  }

  // ------------------------------------------------------------------ Prüfung (wie Server-Version)
  function evalSide(s) {
    s = String(s).replace(/·|×|x/g, "*").replace(/:/g, "/").trim();
    if (!s || !/^[\d\s+\-*/()]+$/.test(s)) return null;
    try { const v = Function(`"use strict";return (${s})`)(); return Number.isFinite(v) ? v : null; } catch (e) { return null; }
  }
  function checkEquation(expr, answer) {
    if ((expr.match(/\?/g) || []).length !== 1 || !expr.includes("=")) return null;
    const parts = expr.replace("?", answer).split("=");
    if (parts.length !== 2) return null;
    const l = evalSide(parts[0]), r = evalSide(parts[1]);
    if (l === null || r === null) return null;
    return Math.abs(l - r) < 1e-9;
  }
  const norm = (s) => String(s ?? "").trim().replace(",", ".");
  const isInt = (v) => Number.isInteger(v);

  function validateTask(t) {
    t = Object.assign({}, t);
    if (!TASK_TYPES.includes(t.type) || !String(t.prompt || "").trim()) return null;
    if (t.type === "figure") {
      const f = t.figure;
      if (!f || !window.Figures || !Figures.rulesOk(f) || !Figures.blanks(f).length) return null;
      if (f.kind === "family" && !(f.cells.slice(3).every((c) => !c.given))) f.cells.slice(3).forEach((c) => { c.given = false; });
      t.answer = f.cells.map((c) => c.v).join(","); t.choices = []; t.expr = null;
      if (!SKILLS[t.skill]) t.skill = "raetsel";
      return t;
    }
    t.answer = String(t.answer ?? "").trim();
    t.choices = (t.choices || []).map((c) => String(c).trim()).filter(Boolean);
    if (!t.answer) return null;
    if (!SKILLS[t.skill]) t.skill = "sonstiges";
    t.expr = (t.expr || "").trim() || null;
    const typ = t.type, expr = t.expr;
    if ((typ === "input" || typ === "choice") && expr && checkEquation(expr, t.answer) === false) return null;
    if (typ === "input" && isNaN(Number(norm(t.answer)))) return null;
    if (typ === "choice" || typ === "clock") {
      if (t.choices.length < 2 || !t.choices.includes(t.answer) || new Set(t.choices).size !== t.choices.length) return null;
    }
    if (typ === "compare") {
      t.choices = ["<", ">", "="];
      if (!expr || !expr.includes("?") || !t.choices.includes(t.answer)) return null;
      const [l, r] = expr.replace(/ c\b|€/g, "").split("?");
      const lv = evalSide(l), rv = evalSide(r);
      if (lv !== null && rv !== null && (lv < rv ? "<" : lv > rv ? ">" : "=") !== t.answer) return null;
    }
    if (typ === "clock") {
      const c = t.clock || {};
      if (!isInt(c.h) || !isInt(c.m) || c.h < 0 || c.h > 23 || c.m < 0 || c.m > 59) return null;
    }
    if (typ === "money") {
      const allowed = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
      const coins = t.money || [];
      if (!coins.length || coins.some((c) => !allowed.includes(c))) return null;
      const p = t.prompt.toLowerCase();
      if (p.includes("wie viel") && p.includes("ist das")) {
        const total = coins.reduce((a, b) => a + b, 0);
        const want = (t.unit || "").trim() === "€" ? total / 100 : total;
        if (Math.abs(Number(norm(t.answer)) - want) > 1e-9) return null;
      }
    }
    if (typ === "numberline") {
      const n = t.numberline || {};
      if (!isInt(n.min) || !isInt(n.max) || !isInt(n.marker)) return null;
      if (n.marker < n.min || n.marker > n.max || ![10, 20, 50, 100].includes(n.max - n.min)) return null;
      if (norm(t.answer) !== String(n.marker)) return null;
    }
    if (typ === "blocks") {
      const b = t.blocks || {};
      if (!isInt(b.tens) || !isInt(b.ones) || norm(t.answer) !== String(b.tens * 10 + b.ones)) return null;
    }
    return t;
  }

  function finish(pack) {
    const tasks = []; let dropped = 0;
    for (const t of pack.tasks || []) { const v = validateTask(t); if (v) tasks.push(v); else dropped++; }
    if (!tasks.length) throw new Error("Die KI hat keine verwendbaren Aufgaben geliefert. Bitte nochmal versuchen.");
    return { title: String(pack.title || "Lernpaket").slice(0, 60), summary: pack.summary || "", emoji: String(pack.emoji || "⭐").slice(0, 4), tasks, dropped };
  }

  // ------------------------------------------------------------------ Öffentlich
  async function packFromWorksheet(files, note, count, key, model) {
    const content = files.map((f) => f.type === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.b64 } }
      : { type: "image", source: { type: "base64", media_type: f.type, data: f.b64 } });
    content.push({ type: "text", text:
      "Das sind Lernzettel/Arbeitsblätter aus der Schule (Fotos oder PDF).\n" +
      "1. Erkenne, welches Thema und welche Aufgabenarten geübt werden und in welchem Zahlenraum.\n" +
      "2. Übernimm die Aufgaben vom Zettel, die sich mit den Aufgabentypen darstellen lassen (rechne die Lösungen selbst nach, Handschrift des Kindes ignorieren).\n" +
      `3. Ergänze ähnliche neue Aufgaben im selben Stil und Schwierigkeitsgrad, insgesamt ca. ${count} Aufgaben.\n` +
      "Im 'summary' beschreibe in einem Satz, was laut Zettel gerade gelernt wird." + (note ? `\nHinweis der Eltern: ${note}` : "") });
    return finish(await call(key, model, content));
  }

  async function packGenerate(skills, level, count, wish, key, model) {
    const names = skills.map((s) => SKILLS[s] || s).join(", ") || "gemischt";
    const lv = { 1: "leicht (Einstieg)", 2: "mittel", 3: "schwer (für Fortgeschrittene in der 2. Klasse)" }[level] || "mittel";
    const content = [{ type: "text", text:
      `Erstelle ein neues Lernpaket mit ${count} Aufgaben.\nThemen: ${names}.\nSchwierigkeit: ${lv}.\n` +
      "Nutze verschiedene passende Aufgabentypen (z.B. Rechnung eintippen, auswählen, Uhr, Münzen, Zahlenstrahl, Zehnerstangen) und baue ein paar kurze Kätzchen-Geschichten ein." +
      (wish ? `\nWunsch der Eltern: ${wish}` : "") }];
    return finish(await call(key, model, content));
  }

  async function testConnection(key, model) {
    const cl = await client(key);
    try {
      const r = await cl.messages.create({ model: model || DEFAULT_MODEL, max_tokens: 50, output_config: { effort: "low" },
        messages: [{ role: "user", content: "Sag nur: Miau!" }] });
      return r.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    } catch (e) { throw new Error(friendly(e)); }
  }

  window.KI = { SKILLS, DEFAULT_MODEL, validateTask, packFromWorksheet, packGenerate, testConnection };
})();
