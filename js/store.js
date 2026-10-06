/* Lokale Datenhaltung (statt Server): bildet die bisherigen /api/…-Routen im Browser nach.
   Alles liegt in localStorage dieses Geräts. Sicherung/Wiederherstellung über Export/Import. */
(function () {
  "use strict";

  const KEY = "mk_db_v1";
  const DEFAULT_PIN = "1234";
  const MAX_ATTEMPTS = 6000;
  const DEFAULT_SETTINGS = {
    pin: DEFAULT_PIN, daily_goal: 20, session_len: 10, tts_auto: false,
    modules: ["zahlen100", "hundert", "plus", "minus", "ergaenzen", "raetsel", "doppelt", "einmaleins", "geld", "uhr", "zeit", "laengen", "groessen", "geometrie", "muster", "forschen", "sach"],
    levels: {}, api_key: "", model: "claude-opus-5-5",
  };

  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = () => isoDay(new Date());
  const clone = (x) => JSON.parse(JSON.stringify(x));

  let mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { mem = null; }
    mem = mem || {};
    mem.settings = Object.assign(clone(DEFAULT_SETTINGS), mem.settings || {});
    // neue Bereiche (z.B. nach einem Update) automatisch einblenden, abgewählte bleiben aus
    const ALL_MODULES = ["zahlen100", "hundert", "plus", "minus", "ergaenzen", "raetsel", "doppelt", "einmaleins", "geld", "uhr", "zeit", "laengen", "groessen", "geometrie", "muster", "forschen", "sach"];
    const known = mem.settings.modulesKnown || ["zahlen100", "plus", "minus", "ergaenzen", "geld", "uhr", "zeit", "sach"];
    ALL_MODULES.forEach((k) => { if (!known.includes(k) && !mem.settings.modules.includes(k)) mem.settings.modules.push(k); });
    mem.settings.modulesKnown = ALL_MODULES;
    mem.profiles = mem.profiles || []; mem.packs = mem.packs || []; mem.attempts = mem.attempts || [];
    mem.seq = mem.seq || { profile: 0, pack: 0 };
    return mem;
  }
  function save() {
    const db = load();
    if (db.attempts.length > MAX_ATTEMPTS) db.attempts = db.attempts.slice(-MAX_ATTEMPTS);
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { throw new Error("Der Speicher am Handy ist voll. Bitte alte Lernpakete löschen."); }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  function fail(msg, status) { const e = new Error(msg); e.status = status || 400; throw e; }
  function needPin(h) { if (String((h || {})["X-PIN"] || "") !== String(load().settings.pin)) fail("PIN falsch", 403); }

  function profileOut(p) {
    const d = today();
    const n = load().attempts.filter((a) => a.profile_id === p.id && a.day === d && a.correct).length;
    return { id: p.id, name: p.name, avatar: p.avatar || "", state: clone(p.state || {}), today_correct: n };
  }
  function packOut(p, withTasks) {
    const o = { id: p.id, title: p.title, summary: p.summary, emoji: p.emoji, source: p.source, active: !!p.active,
      created: p.created, meta: clone(p.meta || {}), count: p.tasks.length };
    if (withTasks !== false) o.tasks = clone(p.tasks);
    return o;
  }
  const findProfile = (id) => load().profiles.find((p) => p.id === id) || fail("nicht gefunden", 404);
  const findPack = (id) => load().packs.find((p) => p.id === id) || fail("nicht gefunden", 404);

  function storePack(pack, source, meta) {
    const db = load();
    const p = { id: ++db.seq.pack, title: pack.title, summary: pack.summary, emoji: pack.emoji, source, tasks: pack.tasks,
      active: false, created: new Date().toISOString().slice(0, 19), meta: Object.assign({}, meta, { dropped: pack.dropped || 0 }) };
    db.packs.push(p); save();
    return packOut(p);
  }

  function blobToB64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1]);
      r.onerror = () => rej(new Error("Datei konnte nicht gelesen werden."));
      r.readAsDataURL(blob);
    });
  }

  function stats(pid) {
    const db = load();
    const mine = db.attempts.filter((a) => a.profile_id === pid);
    const sd = new Date(); sd.setDate(sd.getDate() - 29); const since = isoDay(sd);
    const modules = {};
    mine.filter((a) => a.day >= since).forEach((a) => {
      const m = modules[a.module] || (modules[a.module] = { n: 0, first_try: 0, correct: 0 });
      m.n++; m.first_try += a.first_try ? 1 : 0; m.correct += a.correct ? 1 : 0;
    });
    const sorted = Object.fromEntries(Object.entries(modules).sort((a, b) => b[1].n - a[1].n));
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const dd = new Date(); dd.setDate(dd.getDate() - i); const d = isoDay(dd);
      const list = mine.filter((a) => a.day === d);
      days.push({ day: d, n: list.length, first_try: list.filter((a) => a.first_try).length });
    }
    const mistakes = mine.filter((a) => !a.first_try).slice(-25).reverse()
      .map((a) => ({ ts: a.ts, module: a.module, question: a.question, answer: a.answer, given: a.given }));
    return { modules: sorted, days, mistakes, total: { n: mine.length, first_try: mine.filter((a) => a.first_try).length } };
  }

  async function route(method, path, h, json, body) {
    const db = load();
    let m;
    // ---------------- Kind
    if (path === "/api/bootstrap") {
      const s = db.settings;
      return { profiles: db.profiles.map(profileOut), packs: db.packs.filter((p) => p.active).slice().reverse().map((p) => packOut(p)),
        settings: { daily_goal: s.daily_goal, session_len: s.session_len, tts_auto: s.tts_auto, modules: s.modules, levels: s.levels },
        pin_is_default: String(s.pin) === DEFAULT_PIN, today: today() };
    }
    if (path === "/api/profiles" && method === "POST") {
      const name = String(json.name || "").trim().slice(0, 30);
      if (!name) fail("Name fehlt");
      const p = { id: ++db.seq.profile, name, avatar: json.avatar || "", created: new Date().toISOString(),
        state: { fish: 5, cats: [], accessories: [], streak: 0, last_day: null, stars: 0 } };
      db.profiles.push(p); save();
      return profileOut(p);
    }
    if ((m = path.match(/^\/api\/profiles\/(\d+)\/state$/))) {
      findProfile(+m[1]).state = clone(json.state || {}); save(); return { ok: true };
    }
    if (path === "/api/attempts") {
      const pid = Number(json.profile_id || 0), now = new Date();
      (json.items || []).forEach((it) => db.attempts.push({ profile_id: pid, ts: now.toISOString().slice(0, 19), day: today(),
        module: String(it.module || "").slice(0, 40), skill: String(it.skill || "").slice(0, 40), correct: !!it.correct,
        first_try: !!it.first_try, question: String(it.question || "").slice(0, 300), answer: String(it.answer || "").slice(0, 60),
        given: String(it.given || "").slice(0, 60) }));
      save();
      const p = db.profiles.find((x) => x.id === pid);
      return p ? profileOut(p) : {};
    }
    // ---------------- Eltern
    if (path === "/api/admin/login") {
      if (String(json.pin || "") !== String(db.settings.pin)) fail("PIN falsch", 403);
      return { ok: true };
    }
    needPin(h);
    if (path === "/api/admin/overview") {
      const s = db.settings;
      const rest = Object.assign({}, s); delete rest.pin; delete rest.api_key;
      return { settings: rest, api_key_set: !!s.api_key, api_key_source: s.api_key ? "auf diesem Gerät" : "keiner",
        packs: db.packs.slice().reverse().map((p) => packOut(p, false)), profiles: db.profiles.map(profileOut), skills: KI.SKILLS };
    }
    if (path === "/api/admin/settings") {
      const s = db.settings;
      ["daily_goal", "session_len"].forEach((k) => { if (k in json) s[k] = Math.max(5, Math.min(100, parseInt(json[k], 10) || s[k])); });
      if ("tts_auto" in json) s.tts_auto = !!json.tts_auto;
      if (Array.isArray(json.modules)) s.modules = json.modules.filter((x) => typeof x === "string");
      if (json.levels && typeof json.levels === "object") s.levels = Object.fromEntries(Object.entries(json.levels).filter(([, v]) => [1, 2, 3].includes(Number(v))).map(([k, v]) => [k, Number(v)]));
      if (json.new_pin) { const pin = String(json.new_pin).trim(); if (!/^\d{4}$/.test(pin)) fail("PIN muss 4 Ziffern haben"); s.pin = pin; }
      if ("api_key" in json) s.api_key = String(json.api_key).trim();
      if (json.model) s.model = String(json.model).trim();
      save(); return { ok: true };
    }
    if (path === "/api/admin/test-ai") return { ok: true, reply: await KI.testConnection(db.settings.api_key, db.settings.model) };
    if (path === "/api/admin/packs/worksheet") {
      const files = [];
      for (const f of body.getAll("files")) {
        const type = (f.type || "").replace("image/jpg", "image/jpeg");
        if (!["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(type)) fail("Dateityp nicht unterstützt: " + (f.name || ""));
        files.push({ type, b64: await blobToB64(f) });
      }
      if (!files.length) fail("Bitte mindestens ein Foto oder PDF auswählen.");
      const count = Math.max(5, Math.min(40, parseInt(body.get("count"), 10) || 20));
      const pack = await KI.packFromWorksheet(files, String(body.get("note") || "").trim(), count, db.settings.api_key, db.settings.model);
      return storePack(pack, "lernzettel", { files: files.length });
    }
    if (path === "/api/admin/packs/generate") {
      const skills = (json.skills || []).filter((k) => KI.SKILLS[k]);
      const level = Number(json.level) || 2, count = Math.max(5, Math.min(40, Number(json.count) || 20));
      const pack = await KI.packGenerate(skills, level, count, String(json.wish || "").trim(), db.settings.api_key, db.settings.model);
      return storePack(pack, "ki", { skills, level });
    }
    if (path === "/api/admin/packs" && method === "POST") {
      const tasks = (json.tasks || []).map(KI.validateTask).filter(Boolean);
      if (!tasks.length) fail("Keine gültigen Aufgaben.");
      const out = storePack({ title: String(json.title || "Meine Übung").slice(0, 60), summary: "", emoji: String(json.emoji || "✏️").slice(0, 4), tasks },
        json.source === "eigen" ? "eigen" : "ki", {});
      if (json.active) { db.packs.find((p) => p.id === out.id).active = true; save(); out.active = true; }
      return out;
    }
    if ((m = path.match(/^\/api\/admin\/packs\/(\d+)$/))) {
      const id = +m[1];
      if (method === "DELETE") { db.packs = db.packs.filter((p) => p.id !== id); save(); return { ok: true }; }
      const p = findPack(id);
      if (method === "GET") return packOut(p);
      if ("active" in json) p.active = !!json.active;
      if ("title" in json) p.title = String(json.title).slice(0, 60);
      if ("emoji" in json) p.emoji = String(json.emoji).slice(0, 4);
      if (Array.isArray(json.tasks)) p.tasks = json.tasks.map(KI.validateTask).filter(Boolean);
      save(); return packOut(p);
    }
    if ((m = path.match(/^\/api\/admin\/profiles\/(\d+)$/)) && method === "POST") {
      const p = findProfile(+m[1]), name = String(json.name || "").trim().slice(0, 30);
      if (!name) fail("Name fehlt");
      p.name = name; save(); return profileOut(p);
    }
    if ((m = path.match(/^\/api\/admin\/profiles\/(\d+)$/)) && method === "DELETE") {
      const id = +m[1];
      db.profiles = db.profiles.filter((p) => p.id !== id); db.attempts = db.attempts.filter((a) => a.profile_id !== id);
      save(); return { ok: true };
    }
    if ((m = path.match(/^\/api\/admin\/profiles\/(\d+)\/gift$/))) {
      const p = findProfile(+m[1]), n = Math.max(1, Math.min(100, Number(json.fish) || 5));
      p.state.fish = (p.state.fish || 0) + n; p.state.gift = (p.state.gift || 0) + n;
      save(); return { ok: true, fish: p.state.fish };
    }
    if ((m = path.match(/^\/api\/admin\/stats\/(\d+)$/))) return stats(+m[1]);
    fail("Unbekannte Aktion: " + path, 404);
  }

  window.LocalAPI = async function (path, opts) {
    opts = opts || {};
    const method = opts.method || (opts.body ? "POST" : "GET");
    const json = opts.body && typeof opts.body === "string" ? JSON.parse(opts.body) : {};
    const form = opts.body instanceof FormData ? opts.body : null;
    return clone(await route(method, path, opts.headers, json, form));
  };

  // Sicherung
  window.LocalBackup = {
    export() {
      const db = clone(load()); db.settings.api_key = ""; // Key nie in die Sicherungsdatei
      return JSON.stringify({ app: "mathe-kaetzchen", version: 1, exported: new Date().toISOString(), db }, null, 1);
    },
    import(text) {
      const data = JSON.parse(text);
      if (!data || data.app !== "mathe-kaetzchen" || !data.db) throw new Error("Das ist keine Mathe-Kätzchen-Sicherung.");
      const key = load().settings.api_key;
      mem = data.db; mem.settings = Object.assign(clone(DEFAULT_SETTINGS), mem.settings || {}, { api_key: key });
      load(); save();
    },
  };
})();
