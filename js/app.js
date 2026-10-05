/* Mathe-Kätzchen – App-Logik (Kind: Üben, Kätzchen, Laden · Eltern: Lernzettel, KI, Fortschritt, Einstellungen). */
(function () {
  "use strict";

  const { CATS, ACCESSORIES, catSVG } = window.Cats;
  const V = window.Visuals;
  const GEN = window.Generators;
  const BASKET_PRICE = 15;
  const $app = document.getElementById("app");
  const $overlay = document.getElementById("overlay");
  const $toast = document.getElementById("toast");

  const S = {
    boot: null, profile: null, view: "profiles", pin: null, parentTab: "progress", parentProfile: null,
    admin: null, game: null, result: null, files: [], muted: false,
  };

  // ------------------------------------------------------------------ Hilfen
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = () => isoDay(new Date());
  const yesterday = () => isoDay(new Date(Date.now() - 86400000));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  async function api(path, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    if (S.pin) headers["X-PIN"] = S.pin;
    if (opts.json !== undefined) opts.body = JSON.stringify(opts.json);
    return window.LocalAPI(path, { method: opts.method, headers, body: opts.body });
  }

  function toast(msg, ms) {
    $toast.textContent = msg;
    $toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => $toast.classList.add("hidden"), ms || 2600);
  }

  function showOverlay(html, cls) {
    $overlay.innerHTML = `<div class="sheet ${cls || ""}">${html}</div>`;
    $overlay.classList.remove("hidden");
  }
  function hideOverlay() { $overlay.classList.add("hidden"); $overlay.innerHTML = ""; }

  // ------------------------------------------------------------------ Töne & Vorlesen
  let actx = null;
  function tone(freqs, dur, type, gap) {
    if (S.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      freqs.forEach((f) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
        t += gap ?? dur * 0.7;
      });
    } catch (e) { /* kein Audio */ }
  }
  const sfx = {
    ok: () => tone([660, 880, 1320], 0.16, "triangle"),
    bad: () => tone([300, 240], 0.2, "sine"),
    coin: () => tone([1200, 1600], 0.08, "square", 0.06),
    fanfare: () => tone([523, 659, 784, 1046, 784, 1046], 0.18, "triangle", 0.13),
    purr: () => tone([70, 75, 70, 78, 72], 0.18, "sawtooth", 0.12),
    tap: () => tone([520], 0.06, "triangle"),
  };

  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => v.lang === "de-AT") || vs.find((v) => v.lang === "de-DE") || vs.find((v) => (v.lang || "").startsWith("de")) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speakable(t) {
    let s = t.prompt || "";
    if (t.expr) {
      const e = t.expr.replace(/\?/g, t.type === "compare" ? " Zeichen " : " wie viel ").replace(/\+/g, " plus ").replace(/(\d)\s*-\s*(\d)/g, "$1 minus $2")
        .replace(/ - /g, " minus ").replace(/=/g, " ist ").replace(/·/g, " mal ").replace(/:/g, " geteilt durch ").replace(/ c\b/g, " Cent").replace(/€/g, " Euro");
      s += ". " + e;
    }
    if (t.unit === "c") s = s.replace(/(\d+) c\b/g, "$1 Cent");
    return s.replace(/(\d+) €/g, "$1 Euro").replace(/(\d+) c\b/g, "$1 Cent").replace(/(\d+):(\d\d) Uhr/g, "$1 Uhr $2").replace(/(\d+):(\d\d)/g, "$1 Uhr $2");
  }
  function speak(text) {
    if (!("speechSynthesis" in window) || S.muted) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : "de-DE"; if (voice) u.voice = voice; u.rate = 0.9; u.pitch = 1.1;
    speechSynthesis.speak(u);
  }

  // ------------------------------------------------------------------ Profil-Zustand
  function st() { return S.profile.state; }
  function ensureState(p) {
    const s = p.state;
    s.fish = s.fish ?? 0; s.cats = s.cats || []; s.accessories = s.accessories || []; s.levels = s.levels || {};
    s.retry = s.retry || []; s.streak = s.streak || 0; s.best_streak = s.best_streak || 0; s.total_correct = s.total_correct || 0;
    s.packstars = s.packstars || 0;
    return p;
  }
  let saveTimer = null;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => api(`/api/profiles/${S.profile.id}/state`, { json: { state: st() } }).catch(() => toast("Speichern hat nicht geklappt – ist der Handy-Speicher voll?")), 300);
  }
  function favCat() {
    const s = st();
    const own = s.cats.find((c) => c.id === s.fav) || s.cats[0];
    return own ? { def: Cats.byId(own.id), acc: own.acc } : { def: CATS[0], acc: null };
  }
  function moduleLevel(key) {
    const fixed = (S.boot.settings.levels || {})[key];
    return fixed || st().levels[key] || 1;
  }

  // ------------------------------------------------------------------ Laden & Start
  async function boot() {
    S.muted = store("mk_muted") === "1";
    try {
      S.boot = await api("/api/bootstrap");
    } catch (e) {
      $app.innerHTML = `<div class="center-msg">${catSVG(CATS[1], { mood: "sad", cls: "cat-xl" })}<h2>Hoppla!</h2>
        <p>Die gespeicherten Daten konnten nicht geladen werden.</p>
        <button class="btn big" data-act="reload">Nochmal versuchen</button></div>`;
      return;
    }
    const last = Number(store("mk_profile"));
    const p = S.boot.profiles.find((x) => x.id === last);
    if (p) { S.profile = ensureState(p); S.view = "home"; checkUnlocks(); }
    else S.view = "profiles";
    render();
  }

  async function refreshBoot() {
    S.boot = await api("/api/bootstrap");
    if (S.profile) {
      const p = S.boot.profiles.find((x) => x.id === S.profile.id);
      if (p) S.profile = ensureState(p); else { S.profile = null; S.view = "profiles"; }
    }
  }

  // ------------------------------------------------------------------ Render-Weiche
  function render() {
    if (S.view === "profiles") return renderProfiles();
    if (S.view === "home") return renderHome();
    if (S.view === "game") return renderGame();
    if (S.view === "result") return renderResult();
    if (S.view === "cats") return renderCats();
    if (S.view === "shop") return renderShop();
    if (S.view === "parent") return renderParent();
  }

  function topbar() {
    const s = st();
    return `<header class="topbar">
      <button class="who" data-act="profiles">${catSVG(favCat().def, { cls: "cat-xs" })}<span>${esc(S.profile.name)}</span></button>
      <div class="pills">
        <span class="pill fish" title="Fischlein">🐟 <b>${s.fish}</b></span>
        <span class="pill streak" title="Tage hintereinander">🔥 <b>${s.streak}</b></span>
        <button class="pill icon" data-act="mute" aria-label="Ton">${S.muted ? "🔇" : "🔊"}</button>
      </div></header>`;
  }
  function bottomnav(active) {
    const items = [["home", "🏠", "Üben"], ["cats", "🐱", "Kätzchen"], ["shop", "🧺", "Laden"], ["parent", "🔒", "Eltern"]];
    return `<nav class="bottomnav">${items.map(([v, i, l]) => `<button class="${active === v ? "on" : ""}" data-act="nav" data-v="${v}"><span>${i}</span>${l}</button>`).join("")}</nav>`;
  }

  // ------------------------------------------------------------------ Profile
  function renderProfiles() {
    const ps = S.boot.profiles;
    $app.innerHTML = `<div class="screen profiles">
      <div class="brand">${catSVG(CATS[0], { mood: "joy", cls: "cat-lg bob" })}<h1>Mathe-Kätzchen</h1><p>Rechnen üben &amp; Kätzchen sammeln</p></div>
      <div class="profile-list">
        ${ps.map((p) => { ensureState(p); const own = p.state.cats.find((c) => c.id === p.state.fav) || p.state.cats[0];
          return `<button class="profile-card" data-act="pickprofile" data-id="${p.id}">${catSVG(own ? own.id : "luna", { cls: "cat-sm", acc: own && own.acc })}
            <span class="pname">${esc(p.name)}</span><span class="pmeta">🐟 ${p.state.fish} · 🐱 ${p.state.cats.length}</span></button>`; }).join("")}
        <button class="profile-card add" data-act="newprofile"><span class="plus">＋</span><span class="pname">Neues Kind</span></button>
      </div></div>`;
  }

  function newProfileDialog() {
    const starters = ["mimi", "luna", "felix"];
    showOverlay(`<h2>Wie heißt du?</h2>
      <input id="pname" class="field big" maxlength="20" placeholder="Name" autocomplete="off">
      <h3>Such dir dein erstes Kätzchen aus:</h3>
      <div class="starter">${starters.map((id, i) => `<button class="starter-cat ${i === 0 ? "on" : ""}" data-act="starter" data-id="${id}">${catSVG(id, { cls: "cat-md" })}<span>${Cats.byId(id).name}</span></button>`).join("")}</div>
      <div class="row"><button class="btn ghost" data-act="close">Abbrechen</button><button class="btn big" data-act="createprofile">Los geht's! 🐾</button></div>`);
    setTimeout(() => document.getElementById("pname")?.focus(), 50);
  }

  async function createProfile() {
    const name = (document.getElementById("pname").value || "").trim();
    if (!name) { toast("Bitte einen Namen eingeben."); return; }
    const starter = $overlay.querySelector(".starter-cat.on")?.dataset.id || "mimi";
    const p = ensureState(await api("/api/profiles", { json: { name } }));
    p.state.cats = [{ id: starter, acc: null }]; p.state.fav = starter;
    S.profile = p;
    await api(`/api/profiles/${p.id}/state`, { json: { state: p.state } });
    store("mk_profile", String(p.id));
    hideOverlay();
    await refreshBoot();
    S.view = "home"; render();
    setTimeout(() => speak(`Hallo ${name}! Ich bin ${Cats.byId(starter).name}. Rechne mit mir, dann bekommen wir Fischlein!`), 300);
  }

  // ------------------------------------------------------------------ Startseite
  function greeting() {
    const s = st(), n = S.profile.name, goal = S.boot.settings.daily_goal, done = S.profile.today_correct;
    if (done >= goal) return `Juhu, ${n}! Tagesziel geschafft! ⭐ Du bist ein Mathe-Profi!`;
    if (done === 0) return pick([`Hallo ${n}! Ich bin noch ganz müde… Rechnest du mit mir?`, `Miau, ${n}! Hast du heute schon geübt?`, `Hallo ${n}! Mein Bauch knurrt – verdienen wir uns Fischlein?`]);
    if (s.fish >= BASKET_PRICE && commonLeft() > 0) return `Du hast ${s.fish} Fischlein! Schau mal in den Laden – ein Kätzchen wartet! 🧺`;
    return pick([`Super, schon ${done} richtig heute! Noch ${goal - done} bis zum Tagesziel.`, `Weiter so, ${n}! Du schaffst das!`]);
  }

  function renderHome() {
    const s = st(), set = S.boot.settings, goal = set.daily_goal, done = Math.min(S.profile.today_correct, goal);
    const fc = favCat();
    const mood = S.profile.today_correct === 0 ? "sleep" : (S.profile.today_correct >= goal ? "joy" : "happy");
    const packs = S.boot.packs;
    const mods = GEN.MODULES.filter((m) => set.modules.includes(m.key));
    $app.innerHTML = `${topbar()}<main class="screen home">
      <section class="hero">
        <div class="hero-cat" data-act="petfav">${catSVG(fc.def, { mood, acc: fc.acc, cls: "cat-lg " + (mood === "sleep" ? "" : "bob") })}</div>
        <div class="bubble">${esc(greeting())}</div>
      </section>
      <section class="goal">
        <div class="goal-label"><span>Tagesziel</span><b>${done} / ${goal} 🐾</b></div>
        <div class="goal-bar"><i style="width:${Math.round(done / goal * 100)}%"></i></div>
      </section>
      ${packs.length ? `<h2 class="sec">📚 Von der Schule &amp; neu für dich</h2><div class="packs">${packs.map((p) => `
        <button class="pack-card" data-act="playpack" data-id="${p.id}"><span class="pe">${esc(p.emoji || "⭐")}</span>
          <span class="pt">${esc(p.title)}</span><span class="tag ${p.source}">${p.source === "lernzettel" ? "Lernzettel" : "KI ✨"}</span></button>`).join("")}</div>` : ""}
      <h2 class="sec">🎯 Üben</h2>
      <div class="modules">
        <button class="mod-card mix" data-act="playmix"><span class="me">🌈</span><span class="mn">Bunte Mischung</span><span class="ml">von allem etwas</span></button>
        ${s.retry.length >= 3 ? `<button class="mod-card retry" data-act="playretry"><span class="me">🔁</span><span class="mn">Nochmal üben</span><span class="ml">${s.retry.length} knifflige Aufgaben</span></button>` : ""}
        ${mods.map((m) => `<button class="mod-card" style="--c:${m.color}" data-act="playmod" data-key="${m.key}">
          <span class="me">${m.emoji}</span><span class="mn">${m.name}</span><span class="ml">${"🐾".repeat(moduleLevel(m.key))}<span class="dim">${"🐾".repeat(3 - moduleLevel(m.key))}</span></span></button>`).join("")}
      </div></main>${bottomnav("home")}`;
  }

  // ------------------------------------------------------------------ Spiel
  function startGame(mode) {
    const n = S.boot.settings.session_len || 10;
    let tasks = [];
    if (mode.kind === "module") tasks = GEN.makeSession([mode.key], moduleLevel(mode.key), n);
    else if (mode.kind === "mix") {
      const keys = S.boot.settings.modules.length ? S.boot.settings.modules : GEN.MODULES.map((m) => m.key);
      const lv = {}; keys.forEach((k) => (lv[k] = moduleLevel(k)));
      tasks = GEN.makeSession(keys, 1, n, lv);
    } else if (mode.kind === "pack") {
      const p = mode.pack;
      tasks = GEN.shuffle(p.tasks).slice(0, n).map((t) => Object.assign({}, t, { module: t.skill || "sonstiges", pack: p.id }));
    } else if (mode.kind === "retry") {
      tasks = GEN.shuffle(st().retry).slice(0, n).map((t) => Object.assign({}, t, { fromRetry: true }));
    }
    if (!tasks.length) { toast("Keine Aufgaben gefunden."); return; }
    S.game = { mode, tasks, idx: 0, tries: 0, input: "", results: [], fish: 0, combo: 0, locked: false, wrongChoices: [], feedback: null, mood: "happy" };
    S.view = "game"; render();
    if (S.boot.settings.tts_auto) setTimeout(() => speak(speakable(tasks[0])), 350);
  }

  function gameVisual(t) {
    if (t.type === "clock" && t.clock) return `<div class="visual">${V.clockSVG(t.clock.h, t.clock.m)}</div>`;
    if (t.money && t.money.length) return `<div class="visual">${V.moneyHTML(t.money)}</div>`;
    if (t.type === "numberline" && t.numberline) return `<div class="visual">${V.numberlineSVG(t.numberline.min, t.numberline.max, t.numberline.marker)}</div>`;
    if (t.type === "blocks" && t.blocks) return `<div class="visual">${V.blocksSVG(t.blocks.tens, t.blocks.ones)}</div>`;
    return "";
  }

  const usesKeypad = (t) => !(t.type === "compare" || t.type === "clock" || t.type === "choice" || (t.choices && t.choices.length >= 2));

  function exprHTML(t, g) {
    const box = `<span class="gap ${g.input ? "filled" : ""}">${usesKeypad(t) ? esc(g.input || "") : (g.feedback === "ok" ? esc(t.answer) : "?")}</span>`;
    if (t.expr) {
      if (t.expr.includes("?")) return `<div class="expr">${t.expr.split("?").map(esc).join(box)}</div>`;
      return `<div class="expr">${esc(t.expr)} ${usesKeypad(t) ? box : ""}</div>`;
    }
    if (usesKeypad(t)) return `<div class="expr answer-only">${box}${t.unit ? `<span class="unit">${esc(t.unit)}</span>` : ""}</div>`;
    return "";
  }

  function renderGame() {
    const g = S.game, t = g.tasks[g.idx], total = g.tasks.length;
    const fc = favCat();
    const paws = g.tasks.map((_, i) => `<i class="${i < g.idx ? (g.results[i] && g.results[i].first_try ? "ok" : "meh") : i === g.idx ? "now" : ""}"></i>`).join("");
    let answer = "";
    if (usesKeypad(t)) {
      answer = `<div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-act="key" data-k="${d}">${d}</button>`).join("")}
        <button class="del" data-act="key" data-k="del" aria-label="Löschen">⌫</button><button data-act="key" data-k="0">0</button>
        <button class="ok" data-act="key" data-k="ok" ${g.input ? "" : "disabled"}>✔</button></div>`;
    } else {
      const choices = t.type === "compare" ? ["<", "=", ">"] : t.choices;
      const label = { "<": "kleiner", ">": "größer", "=": "gleich" };
      answer = `<div class="choices ${t.type === "compare" ? "cmp" : ""} n${choices.length}">${choices.map((c) => `<button data-act="choice" data-c="${esc(c)}"
        class="${g.wrongChoices.includes(c) ? "wrong" : ""} ${g.feedback === "ok" && c === t.answer ? "right" : ""}" ${g.wrongChoices.includes(c) || g.locked ? "disabled" : ""}>
        <b>${esc(c)}</b>${t.type === "compare" ? `<small>${label[c]}</small>` : ""}</button>`).join("")}</div>`;
    }
    const solution = g.feedback === "solution" ? `<div class="solution"><div>Richtig ist: <b>${esc(t.answer)}${t.unit && usesKeypad(t) ? " " + esc(t.unit) : ""}</b></div>
      ${t.explain ? `<div class="explain">${esc(t.explain)}</div>` : ""}<button class="btn big" data-act="next">Weiter ➜</button></div>` : "";
    $app.innerHTML = `<div class="screen game">
      <header class="game-top"><button class="x" data-act="quit" aria-label="Beenden">✕</button>
        <div class="paws">${paws}</div><span class="pill fish">🐟 +${g.fish}</span></header>
      <div class="mascot"><div class="m-cat">${catSVG(fc.def, { mood: g.mood, acc: fc.acc, cls: "cat-sm " + (g.feedback === "ok" ? "jump" : "") })}</div>
        <div class="bubble small">${esc(g.bubble || pick(["Du schaffst das!", "Los geht's!", "Ich glaub an dich!"]))}</div></div>
      <section class="task-card ${g.feedback === "ok" ? "ok" : ""} ${g.shake ? "shake" : ""}">
        <div class="prompt"><span>${esc(t.prompt)}</span><button class="say" data-act="say" aria-label="Vorlesen">🔊</button></div>
        ${gameVisual(t)}${exprHTML(t, g)}
        ${g.feedback === "hint" && t.hint ? `<div class="hint">💡 ${esc(t.hint)}</div>` : ""}
      </section>
      ${solution || answer}
      <div class="count">Aufgabe ${g.idx + 1} von ${total}</div>
    </div>`;
    g.shake = false;
  }

  function normalize(x) { return String(x).trim().replace(",", ".").replace(/\s+/g, " ").toLowerCase(); }
  function isCorrect(t, given) {
    const a = normalize(t.answer), b = normalize(given);
    if (a === b) return true;
    const na = parseFloat(a), nb = parseFloat(b);
    return !isNaN(na) && !isNaN(nb) && /^-?[\d.]+$/.test(b) && Math.abs(na - nb) < 1e-9;
  }

  function submit(given) {
    const g = S.game, t = g.tasks[g.idx];
    if (g.locked) return;
    if (isCorrect(t, given)) {
      const first = g.tries === 0;
      g.locked = true; g.feedback = "ok"; g.mood = "joy";
      g.combo = first ? g.combo + 1 : 0;
      let earned = first ? 1 : 0;
      if (first && g.combo > 0 && g.combo % 5 === 0) { earned += 2; }
      g.fish += earned;
      g.bubble = earned > 1 ? `${g.combo} richtig hintereinander! +${earned} 🐟` : first ? pick(["Super!", "Richtig! 🎉", "Toll gemacht!", "Spitze!", "Miau, genau!", "Wow, richtig!"]) : "Jetzt stimmt's! Gut gemacht!";
      sfx.ok(); if (earned) setTimeout(sfx.coin, 250);
      record(t, true, first, given);
      render();
      if (earned) floatFish(earned);
      setTimeout(nextTask, first ? 1150 : 1400);
      return;
    }
    g.tries++; g.shake = true; g.combo = 0; sfx.bad();
    if (g.tries === 1) {
      g.feedback = "hint"; g.mood = "wow"; g.input = ""; g.firstWrong = given;
      if (!usesKeypad(t)) g.wrongChoices.push(given);
      g.bubble = pick(["Fast! Versuch es nochmal.", "Hmm, schau nochmal genau.", "Nicht ganz – du schaffst das!"]);
      render();
      if (S.boot.settings.tts_auto && t.hint) speak(t.hint);
    } else {
      g.feedback = "solution"; g.mood = "happy"; g.locked = true;
      g.bubble = "Macht nichts! So geht's:";
      record(t, false, false, given);
      addRetry(t);
      render();
    }
  }

  function floatFish(n) {
    const el = document.createElement("div");
    el.className = "float-fish"; el.textContent = `+${n} 🐟`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  function record(t, correct, first, given) {
    const g = S.game, s = st();
    g.results[g.idx] = { correct, first_try: first, module: t.module || t.skill };
    if (g.mode.trial) return;
    if (correct) {
      s.total_correct++;
      S.profile.today_correct++;
      if (s.last_day !== today()) {
        s.streak = s.last_day === yesterday() ? s.streak + 1 : 1;
        s.last_day = today();
        s.best_streak = Math.max(s.best_streak, s.streak);
        saveState();
      }
      if (t.fromRetry && first) s.retry = s.retry.filter((r) => sig(r) !== sig(t));
    }
    api("/api/attempts", { json: { profile_id: S.profile.id, items: [{ module: t.module || t.skill, skill: t.pack ? "pack:" + t.pack : t.skill,
      correct, first_try: first, question: [t.prompt, t.expr].filter(Boolean).join(" "), answer: t.answer, given: g.firstWrong ?? given }] } }).catch(() => {});
  }

  const sig = (t) => [t.type, t.prompt, t.expr, t.answer, JSON.stringify(t.clock || t.money || t.numberline || t.blocks || "")].join("|");
  function addRetry(t) {
    const s = st();
    if (S.game && S.game.mode.trial) return;
    const clean = Object.assign({}, t); delete clean.fromRetry;
    if (!s.retry.some((r) => sig(r) === sig(clean))) s.retry.push(clean);
    if (s.retry.length > 30) s.retry.shift();
  }

  function nextTask() {
    const g = S.game;
    if (!g || S.view !== "game") return;
    g.idx++; g.tries = 0; g.input = ""; g.locked = false; g.feedback = null; g.wrongChoices = []; g.mood = "happy"; g.bubble = null; g.firstWrong = null;
    if (g.idx >= g.tasks.length) return finishGame();
    render();
    if (S.boot.settings.tts_auto) speak(speakable(g.tasks[g.idx]));
  }

  function finishGame() {
    const g = S.game, s = st();
    if (g.mode.trial) { S.game = null; S.view = "parent"; toast("Probespiel beendet"); askPinAgain(); return; }
    const n = g.results.length, firsts = g.results.filter((r) => r && r.first_try).length;
    const rate = n ? firsts / n : 0;
    const stars = rate >= 0.9 ? 3 : rate >= 0.7 ? 2 : 1;
    const bonus = [0, 1, 3, 5][stars];
    let goalBonus = 0;
    if (S.profile.today_correct >= S.boot.settings.daily_goal && s.goal_day !== today()) { goalBonus = 5; s.goal_day = today(); }
    s.fish += g.fish + bonus + goalBonus;
    // Stufen anpassen (pro Modul)
    const levelMsgs = [];
    const byMod = {};
    g.results.forEach((r) => { if (!r) return; (byMod[r.module] = byMod[r.module] || []).push(r.first_try ? 1 : 0); });
    if (g.mode.kind === "module" || g.mode.kind === "mix") {
      Object.entries(byMod).forEach(([k, arr]) => {
        if (arr.length < 4 || (S.boot.settings.levels || {})[k] || !GEN.MODULES.find((m) => m.key === k)) return;
        const r = arr.reduce((a, b) => a + b, 0) / arr.length, cur = s.levels[k] || 1;
        if (r >= 0.9 && cur < 3) { s.levels[k] = cur + 1; levelMsgs.push(`${GEN.MODULES.find((m) => m.key === k).name}: Stufe ${cur + 1}! 🐾`); }
        else if (r < 0.5 && cur > 1) s.levels[k] = cur - 1;
      });
    }
    if (g.mode.kind === "pack" && stars === 3) s.packstars++;
    const unlocked = checkUnlocks(true);
    saveState();
    S.result = { stars, fish: g.fish, bonus, goalBonus, firsts, n, levelMsgs, unlocked, mode: g.mode };
    S.game = null; S.view = "result"; render();
    sfx.fanfare(); confetti();
  }

  function renderResult() {
    const r = S.result, fc = favCat();
    const msg = r.stars === 3 ? "Fantastisch!" : r.stars === 2 ? "Sehr gut!" : "Gut gemacht – üben macht stark!";
    $app.innerHTML = `<div class="screen result">
      <div class="stars">${[1, 2, 3].map((i) => `<span class="${i <= r.stars ? "on" : ""}" style="animation-delay:${i * 0.25}s"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="currentColor" stroke="rgba(0,0,0,.12)" stroke-width="1" stroke-linejoin="round"/></svg></span>`).join("")}</div>
      <h1>${msg}</h1>
      ${catSVG(fc.def, { mood: "joy", acc: fc.acc, cls: "cat-lg jump" })}
      <p class="big">${r.firsts} von ${r.n} gleich richtig</p>
      <div class="loot"><span>🐟 +${r.fish}</span>${r.bonus ? `<span>⭐ Sterne-Bonus +${r.bonus}</span>` : ""}${r.goalBonus ? `<span>🎯 Tagesziel +${r.goalBonus}</span>` : ""}</div>
      ${r.levelMsgs.map((m) => `<div class="levelup">⬆️ ${esc(m)}</div>`).join("")}
      ${st().fish >= BASKET_PRICE && commonLeft() > 0 ? `<button class="btn big pulse" data-act="nav" data-v="shop">🧺 Kätzchen-Körbchen öffnen!</button>` : ""}
      <div class="row"><button class="btn ghost big" data-act="nav" data-v="home">Fertig</button><button class="btn big" data-act="again">Nochmal 🔁</button></div>
    </div>`;
    if (r.unlocked.length) setTimeout(() => revealCat(r.unlocked[0], true), 900);
  }

  function confetti() {
    const box = document.createElement("div"); box.className = "confetti";
    const colors = ["#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%"; p.style.background = pick(colors);
      p.style.animationDelay = Math.random() * 0.6 + "s"; p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3200);
  }

  // ------------------------------------------------------------------ Kätzchen & Freischaltungen
  const owned = (id) => st().cats.some((c) => c.id === id);
  const commonLeft = () => CATS.filter((c) => !c.rare && !owned(c.id)).length;

  function checkUnlocks(returnList) {
    const s = st(), out = [];
    CATS.filter((c) => c.rare && !owned(c.id)).forEach((c) => {
      const u = c.unlock;
      const ok = (u.type === "streak" && s.best_streak >= u.n) || (u.type === "total" && s.total_correct >= u.n) || (u.type === "packstar" && s.packstars >= u.n);
      if (ok) { s.cats.push({ id: c.id, acc: null }); out.push(c.id); }
    });
    if (out.length && !returnList) { saveState(); setTimeout(() => revealCat(out[0], true), 600); }
    return out;
  }

  function renderCats() {
    const s = st();
    $app.innerHTML = `${topbar()}<main class="screen cats">
      <h1 class="title">Meine Kätzchen <small>${s.cats.length} / ${CATS.length}</small></h1>
      <div class="cat-grid">${CATS.map((c) => {
        const o = s.cats.find((x) => x.id === c.id);
        if (o) return `<button class="cat-tile ${s.fav === c.id ? "fav" : ""} ${c.rare ? "rare" : ""}" data-act="opencat" data-id="${c.id}">
          ${catSVG(c, { acc: o.acc, mood: S.profile.today_correct ? "happy" : "sleep", cls: "cat-md" })}<span>${esc(c.name)}${s.fav === c.id ? " 💖" : ""}</span></button>`;
        return `<div class="cat-tile locked ${c.rare ? "rare" : ""}">${catSVG(c, { silhouette: true, cls: "cat-md" })}
          <span>${c.rare ? "⭐ " + esc(c.unlock.text) : "Im Körbchen"}</span></div>`;
      }).join("")}</div></main>${bottomnav("cats")}`;
  }

  function openCat(id) {
    const s = st(), o = s.cats.find((x) => x.id === id), c = Cats.byId(id);
    const accs = s.accessories;
    showOverlay(`<div class="cat-detail">
      <button class="pet" data-act="pet" data-id="${id}">${catSVG(c, { acc: o.acc, mood: "happy", cls: "cat-xl" })}</button>
      <h2>${esc(c.name)}${c.rare ? " ⭐" : ""}</h2><p class="muted">Tippe mich an zum Streicheln!</p>
      ${accs.length ? `<h3>Anziehen</h3><div class="acc-row"><button class="acc ${!o.acc ? "on" : ""}" data-act="wear" data-id="${id}" data-acc="">✖️</button>
        ${accs.map((a) => `<button class="acc ${o.acc === a ? "on" : ""}" data-act="wear" data-id="${id}" data-acc="${a}">${ACCESSORIES.find((x) => x.id === a).emoji}</button>`).join("")}</div>`
        : `<p class="muted small">Im Laden gibt es Maschen, Hüte und Kronen zum Anziehen.</p>`}
      <div class="row"><button class="btn ghost" data-act="close">Zurück</button>
      ${s.fav === id ? `<span class="badge">💖 Liebling</span>` : `<button class="btn" data-act="setfav" data-id="${id}">💖 Mein Liebling</button>`}</div></div>`);
  }

  function pet(btn) {
    sfx.purr();
    const id = btn.dataset.id, o = st().cats.find((x) => x.id === id);
    btn.innerHTML = catSVG(id, { acc: o.acc, mood: "joy", cls: "cat-xl jump" });
    for (let i = 0; i < 5; i++) {
      const h = document.createElement("span"); h.className = "heart"; h.textContent = pick(["💖", "💕", "💗", "✨"]);
      h.style.left = 30 + Math.random() * 40 + "%"; h.style.animationDelay = i * 0.12 + "s";
      btn.appendChild(h); setTimeout(() => h.remove(), 1500);
    }
    clearTimeout(pet._t);
    pet._t = setTimeout(() => { if (btn.isConnected) btn.innerHTML = catSVG(id, { acc: o.acc, mood: "happy", cls: "cat-xl" }); }, 1400);
  }

  function revealCat(id, rare) {
    const c = Cats.byId(id);
    showOverlay(`<div class="reveal">
      <div class="basket">🧺</div>
      <div class="reveal-cat">${catSVG(c, { mood: "joy", cls: "cat-xl" })}</div>
      <h2>${rare ? "Seltenes Kätzchen! ⭐" : "Neues Kätzchen!"}</h2>
      <p class="big"><b>${esc(c.name)}</b> zieht bei dir ein!</p>
      <button class="btn big" data-act="close">Hallo ${esc(c.name)}! 👋</button></div>`, "reveal-sheet");
    setTimeout(() => { $overlay.querySelector(".reveal")?.classList.add("open"); sfx.fanfare(); confetti(); speak(`${c.name} zieht bei dir ein!`); }, 1100);
  }

  // ------------------------------------------------------------------ Laden
  function renderShop() {
    const s = st(), left = commonLeft();
    $app.innerHTML = `${topbar()}<main class="screen shop">
      <h1 class="title">Laden</h1>
      <section class="shop-basket">
        <div class="bk">🧺</div>
        <div><h2>Überraschungs-Körbchen</h2><p>Darin schläft ein neues Kätzchen!</p>
        <button class="btn big" data-act="buybasket" ${s.fish < BASKET_PRICE || !left ? "disabled" : ""}>Öffnen · ${BASKET_PRICE} 🐟</button>
        ${!left ? `<p class="small">Du hast alle Körbchen-Kätzchen! Die seltenen ⭐ bekommst du durch fleißiges Üben.</p>` :
          s.fish < BASKET_PRICE ? `<p class="small">Noch ${BASKET_PRICE - s.fish} Fischlein – rechne weiter!</p>` : ""}</div>
      </section>
      <h2 class="sec">🎀 Zum Anziehen</h2>
      <div class="acc-shop">${ACCESSORIES.map((a) => {
        const has = s.accessories.includes(a.id);
        return `<div class="acc-card"><span class="ae">${a.emoji}</span><span>${a.name}</span>
          ${has ? `<span class="badge">✔ gehört dir</span>` : `<button class="btn small" data-act="buyacc" data-id="${a.id}" ${s.fish < a.price ? "disabled" : ""}>${a.price} 🐟</button>`}</div>`;
      }).join("")}</div></main>${bottomnav("shop")}`;
  }

  function buyBasket() {
    const s = st();
    const pool = CATS.filter((c) => !c.rare && !owned(c.id));
    if (s.fish < BASKET_PRICE || !pool.length) return;
    s.fish -= BASKET_PRICE;
    const c = pick(pool);
    s.cats.push({ id: c.id, acc: null });
    saveState(); render(); revealCat(c.id, false);
  }

  function buyAcc(id) {
    const s = st(), a = ACCESSORIES.find((x) => x.id === id);
    if (!a || s.fish < a.price || s.accessories.includes(id)) return;
    s.fish -= a.price; s.accessories.push(id); sfx.coin();
    saveState(); render(); toast(`${a.emoji} ${a.name} gekauft! Zieh sie einem Kätzchen an.`);
  }

  // ------------------------------------------------------------------ Eltern: PIN
  function pinDialog() {
    let val = "";
    const draw = () => {
      showOverlay(`<h2>🔒 Elternbereich</h2><p class="muted">PIN eingeben${S.boot.pin_is_default ? " (Start-PIN: 1234 – bitte gleich ändern)" : ""}</p>
        <div class="pin-dots">${[0, 1, 2, 3].map((i) => `<i class="${i < val.length ? "on" : ""}"></i>`).join("")}</div>
        <div class="keypad small">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-pin="${d}">${d}</button>`).join("")}
        <button class="del" data-pin="close">✕</button><button data-pin="0">0</button><button class="del" data-pin="del">⌫</button></div>`);
      $overlay.querySelectorAll("[data-pin]").forEach((b) => b.addEventListener("click", async () => {
        const k = b.dataset.pin;
        if (k === "close") return hideOverlay();
        if (k === "del") val = val.slice(0, -1); else if (val.length < 4) val += k;
        if (val.length === 4) {
          try { await api("/api/admin/login", { json: { pin: val } }); S.pin = val; hideOverlay(); S.view = "parent"; await loadAdmin(); render(); return; }
          catch (e) { toast("PIN falsch"); val = ""; }
        }
        draw();
      }));
    };
    draw();
  }

  async function askPinAgain() { S.view = "parent"; await loadAdmin(); render(); }

  async function loadAdmin() {
    S.admin = await api("/api/admin/overview");
    if (!S.parentProfile && S.admin.profiles.length) S.parentProfile = (S.profile && S.profile.id) || S.admin.profiles[0].id;
  }

  // ------------------------------------------------------------------ Eltern: Ansicht
  function renderParent() {
    const tabs = [["progress", "📈 Fortschritt"], ["sheet", "📷 Lernzettel"], ["ai", "✨ KI-Paket"], ["packs", "📚 Pakete"], ["settings", "⚙️ Einstellungen"]];
    $app.innerHTML = `<div class="screen parent">
      <header class="p-top"><h1>Elternbereich</h1><button class="btn ghost small" data-act="leaveparent">Zurück zum Kind ➜</button></header>
      <nav class="p-tabs">${tabs.map(([k, l]) => `<button class="${S.parentTab === k ? "on" : ""}" data-act="ptab" data-k="${k}">${l}</button>`).join("")}</nav>
      <main id="pbody" class="p-body"><div class="muted">Lädt…</div></main></div>`;
    ({ progress: pProgress, sheet: pSheet, ai: pAI, packs: pPacks, settings: pSettings })[S.parentTab]();
  }
  const pbody = () => document.getElementById("pbody");

  function moduleName(k) {
    const m = GEN.MODULES.find((x) => x.key === k);
    return m ? `${m.emoji} ${m.name}` : (S.admin.skills[k] || k);
  }

  async function pProgress() {
    const ps = S.admin.profiles;
    if (!ps.length) { pbody().innerHTML = `<p>Noch kein Kinderprofil angelegt.</p>`; return; }
    const pid = S.parentProfile || ps[0].id;
    const prof = ps.find((p) => p.id === pid) || ps[0];
    ensureState(prof);
    const d = await api(`/api/admin/stats/${prof.id}`);
    if (S.view !== "parent" || S.parentTab !== "progress" || !pbody()) return;
    const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
    const maxDay = Math.max(5, ...d.days.map((x) => x.n));
    const weak = Object.entries(d.modules).filter(([, v]) => v.n >= 8 && v.first_try / v.n < 0.7).map(([k]) => moduleName(k));
    pbody().innerHTML = `
      ${ps.length > 1 ? `<div class="chips">${ps.map((p) => `<button class="chip ${p.id === prof.id ? "on" : ""}" data-act="pprof" data-id="${p.id}">${esc(p.name)}</button>`).join("")}</div>` : ""}
      <div class="kpis">
        <div class="kpi"><b>${d.total.n}</b><span>Aufgaben gesamt</span></div>
        <div class="kpi"><b>${pct(d.total.first_try, d.total.n)} %</b><span>gleich richtig</span></div>
        <div class="kpi"><b>${prof.state.streak || 0} 🔥</b><span>Tage in Folge (Rekord ${prof.state.best_streak || 0})</span></div>
        <div class="kpi"><b>${prof.state.cats.length} 🐱 · ${prof.state.fish} 🐟</b><span>Kätzchen · Fischlein</span></div>
      </div>
      ${weak.length ? `<div class="note warn">💡 Hier lohnt sich Üben: <b>${weak.join(", ")}</b> – z.B. ein KI-Paket dazu erstellen.</div>` : ""}
      <h3>Letzte 14 Tage</h3>
      <div class="days">${d.days.map((x) => `<div class="day" title="${x.day}: ${x.n} Aufgaben, ${x.first_try} gleich richtig">
        <div class="bar"><i style="height:${x.n / maxDay * 100}%"></i><i class="ok" style="height:${x.first_try / maxDay * 100}%"></i></div>
        <span>${new Date(x.day).toLocaleDateString("de-AT", { weekday: "short" }).slice(0, 2)}</span></div>`).join("")}</div>
      <p class="legend"><i class="lg all"></i> Aufgaben <i class="lg ok"></i> gleich richtig</p>
      <h3>Themen (30 Tage)</h3>
      ${Object.keys(d.modules).length ? `<table class="tbl"><tr><th>Thema</th><th>Aufgaben</th><th>gleich richtig</th></tr>
        ${Object.entries(d.modules).map(([k, v]) => { const p = pct(v.first_try, v.n);
          return `<tr><td>${esc(moduleName(k))}</td><td>${v.n}</td><td><div class="rate"><i class="${p >= 85 ? "g" : p >= 65 ? "y" : "r"}" style="width:${p}%"></i><span>${p} %</span></div></td></tr>`; }).join("")}</table>`
        : `<p class="muted">Noch keine Übungen.</p>`}
      <h3>Zuletzt schwierig</h3>
      ${d.mistakes.length ? `<ul class="mistakes">${d.mistakes.map((m) => `<li><span>${esc(m.question)}</span><span class="muted">richtig: <b>${esc(m.answer)}</b> · ${m.given ? "getippt: " + esc(m.given) : ""}</span></li>`).join("")}</ul>` : `<p class="muted">Keine Fehler – super!</p>`}
      <h3>Belohnung</h3>
      <p class="muted small">Z.B. für eine Hausübung auf Papier – die Fischlein landen sofort beim Kind.</p>
      <div class="row left"><button class="btn" data-act="gift" data-id="${prof.id}" data-n="5">+5 🐟 schenken</button><button class="btn" data-act="gift" data-id="${prof.id}" data-n="15">+15 🐟 schenken</button></div>`;
  }

  function pSheet() {
    pbody().innerHTML = `
      <div class="card">
        <h3>📷 Lernzettel aus der Schule hochladen</h3>
        <p class="muted">Fotografiere Arbeitsblätter oder lade ein PDF hoch. Claude liest die Aufgaben, erkennt das Thema und baut daraus ein Lernpaket mit ähnlichen Übungen. Danach kannst du es prüfen und für dein Kind freischalten.</p>
        <label class="upload">
          <input id="files" type="file" accept="image/*,application/pdf" multiple>
          <span>📸 Foto aufnehmen oder Datei wählen</span>
        </label>
        <div id="thumbs" class="thumbs">${S.files.map((f, i) => `<div class="thumb">${f.preview ? `<img src="${f.preview}" alt="">` : "📄"}<small>${esc(f.name)}</small><button data-act="rmfile" data-i="${i}">✕</button></div>`).join("")}</div>
        <label class="lbl">Hinweis für die KI (optional)</label>
        <textarea id="note" class="field" rows="2" placeholder="z.B. Bitte nur die Plus-Aufgaben, Zahlen bis 50"></textarea>
        <label class="lbl">Anzahl Aufgaben</label>
        <select id="count" class="field"><option>15</option><option selected>20</option><option>30</option></select>
        <button class="btn big" data-act="uploadsheet" ${S.files.length ? "" : "disabled"}>✨ Lernpaket erstellen</button>
        ${aiWarning()}
      </div>`;
    document.getElementById("files").addEventListener("change", async (e) => {
      for (const f of e.target.files) S.files.push(await prepareFile(f));
      pSheet();
    });
  }

  function aiWarning() {
    return S.admin.api_key_set ? "" : `<div class="note warn">⚠️ Noch kein Anthropic-API-Key hinterlegt – unter ⚙️ Einstellungen eintragen.</div>`;
  }

  // Fotos am Handy verkleinern (schneller Upload, gut lesbar für die KI)
  function prepareFile(file) {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve({ name: file.name, blob: file, type: file.type || "application/pdf", preview: null });
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 2000, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => resolve({ name: file.name, blob: b, type: "image/jpeg", preview: c.toDataURL("image/jpeg", 0.4) }), "image/jpeg", 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve({ name: file.name, blob: file, type: file.type, preview: null }); };
      img.src = url;
    });
  }

  function busy(text) {
    showOverlay(`<div class="busy">${catSVG(CATS[0], { mood: "wow", cls: "cat-lg bob" })}<h2>${esc(text)}</h2>
      <p class="muted">Das dauert meist 30–90 Sekunden. Bitte die App offen lassen.</p><div class="dots"><i></i><i></i><i></i></div></div>`);
  }

  async function uploadSheet() {
    const fd = new FormData();
    S.files.forEach((f, i) => fd.append("files", f.blob, f.name || `seite${i + 1}.jpg`));
    fd.append("note", document.getElementById("note").value || "");
    fd.append("count", document.getElementById("count").value);
    busy("Claude liest den Lernzettel …");
    try {
      const pack = await api("/api/admin/packs/worksheet", { body: fd });
      S.files = [];
      hideOverlay(); await loadAdmin(); S.parentTab = "packs"; renderParent(); openPack(pack.id);
    } catch (e) { hideOverlay(); toast(e.message, 6000); }
  }

  function pAI() {
    const skills = GEN.MODULES;
    pbody().innerHTML = `<div class="card">
      <h3>✨ Neues Lernpaket mit KI erstellen</h3>
      <p class="muted">Claude erstellt passende Aufgaben für die aktuelle Lernphase – mit Uhr, Münzen, Zahlenstrahl und Kätzchen-Geschichten.</p>
      <label class="lbl">Themen</label>
      <div class="chips" id="aiskills">${skills.map((m, i) => `<button class="chip ${i === 1 ? "on" : ""}" data-act="togglechip" data-k="${m.key}">${m.emoji} ${m.name}</button>`).join("")}</div>
      <label class="lbl">Schwierigkeit</label>
      <div class="chips" id="ailevel">${[[1, "leicht"], [2, "mittel"], [3, "schwer"]].map(([v, l]) => `<button class="chip ${v === 2 ? "on" : ""}" data-act="radiochip" data-k="${v}">${l}</button>`).join("")}</div>
      <label class="lbl">Anzahl Aufgaben</label>
      <select id="aicount" class="field"><option>10</option><option selected>20</option><option>30</option></select>
      <label class="lbl">Was übt ihr gerade? (optional)</label>
      <textarea id="aiwish" class="field" rows="3" placeholder="z.B. Plus mit Zehnerübergang bis 60, Geschichten über Kätzchen im Garten. Oder: Uhr – viertel und dreiviertel."></textarea>
      <button class="btn big" data-act="aigenerate">✨ Lernpaket erstellen</button>
      ${aiWarning()}</div>`;
  }

  async function aiGenerate() {
    const skills = [...document.querySelectorAll("#aiskills .chip.on")].map((b) => b.dataset.k);
    const level = Number(document.querySelector("#ailevel .chip.on")?.dataset.k || 2);
    if (!skills.length) { toast("Bitte mindestens ein Thema wählen."); return; }
    busy("Claude erfindet neue Aufgaben …");
    try {
      const pack = await api("/api/admin/packs/generate", { json: { skills, level, count: Number(document.getElementById("aicount").value), wish: document.getElementById("aiwish").value } });
      hideOverlay(); await loadAdmin(); S.parentTab = "packs"; renderParent(); openPack(pack.id);
    } catch (e) { hideOverlay(); toast(e.message, 6000); }
  }

  function pPacks() {
    const ps = S.admin.packs;
    pbody().innerHTML = ps.length ? `<div class="pack-list">${ps.map((p) => `<div class="pack-row">
        <span class="pe">${esc(p.emoji)}</span>
        <div class="pinfo"><b>${esc(p.title)}</b><span class="muted small">${p.source === "lernzettel" ? "aus Lernzettel" : "KI-erstellt"} · ${p.count} Aufgaben · ${new Date(p.created).toLocaleDateString("de-AT")}</span>
          ${p.summary ? `<span class="small">${esc(p.summary)}</span>` : ""}</div>
        <label class="switch" title="Für das Kind sichtbar"><input type="checkbox" data-act="packactive" data-id="${p.id}" ${p.active ? "checked" : ""}><i></i></label>
        <button class="btn small ghost" data-act="openpack" data-id="${p.id}">Ansehen</button></div>`).join("")}</div>`
      : `<div class="card"><p>Noch keine Lernpakete. Lade einen 📷 Lernzettel hoch oder erstelle ein ✨ KI-Paket.</p></div>`;
  }

  function taskPreview(t, i) {
    const icon = { input: "⌨️", choice: "🔘", compare: "⚖️", clock: "🕒", money: "💶", numberline: "📏", blocks: "🧱" }[t.type] || "•";
    let vis = "";
    if (t.type === "clock" && t.clock) vis = `<span class="mini">${V.clockSVG(t.clock.h, t.clock.m)}</span>`;
    if (t.money && t.money.length) vis = `<span class="mini wide">${V.moneyHTML(t.money)}</span>`;
    if (t.type === "numberline" && t.numberline) vis = `<span class="mini wide">${V.numberlineSVG(t.numberline.min, t.numberline.max, t.numberline.marker)}</span>`;
    if (t.type === "blocks" && t.blocks) vis = `<span class="mini">${V.blocksSVG(t.blocks.tens, t.blocks.ones)}</span>`;
    return `<li class="tp"><span class="ti">${icon}</span><div class="tb"><div>${esc(t.prompt)} ${t.expr ? `<b>${esc(t.expr)}</b>` : ""}</div>${vis}
      <div class="small muted">Lösung: <b>${esc(t.answer)}${t.unit ? " " + esc(t.unit) : ""}</b>${t.choices && t.choices.length ? " · Auswahl: " + t.choices.map(esc).join(" / ") : ""}</div></div>
      <button class="x" data-act="rmtask" data-i="${i}" title="Aufgabe entfernen">🗑</button></li>`;
  }

  async function openPack(id) {
    const p = await api(`/api/admin/packs/${id}`);
    S.openPack = p;
    showOverlay(`<div class="pack-detail"><h2>${esc(p.emoji)} <span contenteditable="true" id="ptitle">${esc(p.title)}</span></h2>
      <p class="muted">${esc(p.summary)}</p>
      ${p.meta && p.meta.dropped ? `<div class="note">ℹ️ ${p.meta.dropped} Aufgabe(n) wurden automatisch aussortiert, weil die Lösung nicht nachrechenbar stimmte.</div>` : ""}
      <ol class="task-list">${p.tasks.map(taskPreview).join("")}</ol>
      <div class="row wrap"><button class="btn ghost" data-act="deletepack" data-id="${p.id}">🗑 Löschen</button>
        <button class="btn ghost" data-act="trypack">▶️ Probe spielen</button>
        <button class="btn" data-act="savepack" data-active="${p.active ? 1 : 0}">${p.active ? "💾 Speichern" : "✅ Für das Kind freischalten"}</button>
        <button class="btn ghost" data-act="close">Schließen</button></div></div>`, "wide");
  }

  async function savePack(activate) {
    const p = S.openPack;
    const title = (document.getElementById("ptitle")?.textContent || p.title).trim();
    await api(`/api/admin/packs/${p.id}`, { json: { title, tasks: p.tasks, active: activate ? true : p.active } });
    hideOverlay(); await loadAdmin(); await refreshBoot(); renderParent();
    toast(activate ? "Paket ist jetzt beim Kind sichtbar 🎉" : "Gespeichert");
  }

  function pSettings() {
    const s = S.admin.settings;
    const lv = s.levels || {};
    pbody().innerHTML = `
      <div class="card"><h3>📱 Als App installieren</h3>
        <p class="small"><b>iPhone:</b> in Safari öffnen → Teilen-Symbol → „Zum Home-Bildschirm“.<br>
        <b>Android:</b> in Chrome öffnen → Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.<br>
        Danach immer über das Kätzchen-Symbol starten – dann funktioniert das Üben auch offline.</p>
        <div id="qr" class="qr"></div></div>
      <div class="card"><h3>💾 Sicherung</h3>
        <p class="small muted">Fortschritt, Kätzchen und Lernpakete sind nur auf diesem Gerät gespeichert. Mach ab und zu eine Sicherung (z.B. vor einem Handywechsel). Der API-Key kommt nicht mit in die Datei.</p>
        <div class="row left"><button class="btn" data-act="backup">⬇️ Sicherung speichern</button>
        <label class="btn ghost">⬆️ Sicherung laden<input id="restore" type="file" accept="application/json,.json" hidden></label></div></div>
      <div class="card"><h3>🎯 Üben</h3>
        <div class="grid2">
          <label class="lbl">Tagesziel (richtige Aufgaben)<input id="s_goal" class="field" type="number" min="5" max="100" value="${s.daily_goal}"></label>
          <label class="lbl">Aufgaben pro Runde<input id="s_len" class="field" type="number" min="5" max="30" value="${s.session_len}"></label>
        </div>
        <label class="check"><input id="s_tts" type="checkbox" ${s.tts_auto ? "checked" : ""}> Aufgaben automatisch vorlesen</label>
        <h4>Themen &amp; Stufe</h4>
        <table class="tbl">${GEN.MODULES.map((m) => `<tr><td><label class="check"><input type="checkbox" class="s_mod" value="${m.key}" ${s.modules.includes(m.key) ? "checked" : ""}> ${m.emoji} ${m.name}</label></td>
          <td><select class="field s_lv" data-k="${m.key}"><option value="">automatisch</option>${[1, 2, 3].map((v) => `<option value="${v}" ${String(lv[m.key]) === String(v) ? "selected" : ""}>Stufe ${v}</option>`).join("")}</select></td></tr>`).join("")}</table>
        <p class="small muted">Automatisch: nach einer Runde mit ≥ 90 % steigt die Stufe, unter 50 % sinkt sie.</p>
        <button class="btn" data-act="savesettings">💾 Speichern</button></div>
      <div class="card"><h3>✨ KI (Claude)</h3>
        <p>API-Key: <b>${S.admin.api_key_set ? "hinterlegt ✅" : "fehlt ❌"}</b> <span class="muted small">(Quelle: ${esc(S.admin.api_key_source)})</span></p>
        <label class="lbl">Neuer Anthropic-API-Key (optional)<input id="s_key" class="field" type="password" autocomplete="off" placeholder="sk-ant-…"></label>
        <p class="small muted">Der Key wird nur auf diesem Gerät gespeichert und direkt an Anthropic geschickt. Tipp: in der Anthropic-Console einen eigenen Key mit niedrigem Ausgabelimit anlegen.</p>
        <label class="lbl">Modell<input id="s_model" class="field" value="${esc(s.model)}"></label>
        <div class="row left"><button class="btn" data-act="savekey">💾 Speichern</button><button class="btn ghost" data-act="testai">🔌 Verbindung testen</button></div></div>
      <div class="card"><h3>🔒 PIN ändern</h3>
        <div class="row left"><input id="s_pin" class="field" inputmode="numeric" maxlength="4" placeholder="neue 4-stellige PIN"><button class="btn" data-act="savepin">Ändern</button></div></div>
      <div class="card"><h3>👧 Kinderprofile</h3>
        ${S.admin.profiles.map((p) => `<div class="row left"><span class="grow">${esc(p.name)}</span><button class="btn small ghost" data-act="delprofile" data-id="${p.id}">Löschen</button></div>`).join("")}
        <p class="small muted">Neue Profile legt man auf dem Startbildschirm an (auf den Namen oben links tippen).</p></div>`;
    loadQR(location.href.split("#")[0]);
    document.getElementById("restore").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!confirm("Sicherung laden? Die aktuellen Daten auf diesem Gerät werden ersetzt.")) return;
      try { window.LocalBackup.import(await f.text()); S.profile = null; await loadAdmin(); await refreshBoot(); toast("Sicherung geladen ✅"); renderParent(); }
      catch (err) { toast(err.message, 5000); }
    });
  }

  function loadQR(url) {
    const draw = () => { const el = document.getElementById("qr"); if (el && window.QRCode) { el.innerHTML = ""; new QRCode(el, { text: url, width: 160, height: 160 }); } };
    if (window.QRCode) return draw();
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    sc.onload = draw; document.head.appendChild(sc);
  }

  async function saveSettings(extra) {
    try {
      await api("/api/admin/settings", { json: extra });
      await loadAdmin(); await refreshBoot(); toast("Gespeichert ✅");
    } catch (e) { toast(e.message); }
  }

  // ------------------------------------------------------------------ Klicks
  document.addEventListener("click", async (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) { if (ev.target === $overlay && !$overlay.querySelector(".busy,.reveal")) hideOverlay(); return; }
    const act = el.dataset.act, d = el.dataset;
    try {
      switch (act) {
        case "reload": location.reload(); break;
        case "mute": S.muted = !S.muted; store("mk_muted", S.muted ? "1" : "0"); if (S.muted && "speechSynthesis" in window) speechSynthesis.cancel(); render(); break;
        case "profiles": S.view = "profiles"; render(); break;
        case "pickprofile": { const p = S.boot.profiles.find((x) => x.id === Number(d.id)); S.profile = ensureState(p); store("mk_profile", d.id); S.view = "home"; checkUnlocks(); render(); sfx.tap(); break; }
        case "newprofile": newProfileDialog(); break;
        case "starter": $overlay.querySelectorAll(".starter-cat").forEach((b) => b.classList.toggle("on", b === el)); sfx.tap(); break;
        case "createprofile": await createProfile(); break;
        case "close": hideOverlay(); if (S.view === "cats" || S.view === "shop") render(); break;
        case "nav":
          if (d.v === "parent") { if (S.pin) { S.view = "parent"; await loadAdmin(); render(); } else pinDialog(); break; }
          S.view = d.v; render(); break;
        case "petfav": { sfx.purr(); const fc = favCat(); el.innerHTML = catSVG(fc.def, { mood: "joy", acc: fc.acc, cls: "cat-lg jump" }); setTimeout(() => S.view === "home" && render(), 1200); break; }
        case "playmod": startGame({ kind: "module", key: d.key }); break;
        case "playmix": startGame({ kind: "mix" }); break;
        case "playretry": startGame({ kind: "retry" }); break;
        case "playpack": startGame({ kind: "pack", pack: S.boot.packs.find((p) => p.id === Number(d.id)) }); break;
        case "again": startGame(S.result.mode); break;
        case "say": { const t = S.game.tasks[S.game.idx]; speak(speakable(t) + (S.game.feedback === "hint" && t.hint ? ". Tipp: " + t.hint : "")); break; }
        case "key": {
          const g = S.game; if (g.locked) break;
          if (d.k === "del") g.input = g.input.slice(0, -1);
          else if (d.k === "ok") { if (g.input) submit(g.input); break; }
          else if (g.input.length < 4) g.input = (g.input === "0" ? "" : g.input) + d.k;
          sfx.tap(); render(); break;
        }
        case "choice": submit(d.c); break;
        case "next": nextTask(); break;
        case "quit":
          if (S.game.mode.trial) { S.game = null; askPinAgain(); break; }
          if (S.game.idx === 0 || confirm("Runde wirklich beenden? Die Fischlein dieser Runde gehen verloren.")) { S.game = null; S.view = "home"; saveState(); render(); }
          break;
        case "opencat": openCat(d.id); break;
        case "pet": pet(el); break;
        case "wear": { const o = st().cats.find((c) => c.id === d.id); o.acc = d.acc || null; saveState(); openCat(d.id); sfx.tap(); break; }
        case "setfav": st().fav = d.id; saveState(); openCat(d.id); render(); break;
        case "buybasket": buyBasket(); break;
        case "buyacc": buyAcc(d.id); break;
        // Eltern
        case "leaveparent": S.view = S.profile ? "home" : "profiles"; S.pin = null; await refreshBoot(); render(); break;
        case "ptab": S.parentTab = d.k; renderParent(); break;
        case "pprof": S.parentProfile = Number(d.id); renderParent(); break;
        case "gift": await api(`/api/admin/profiles/${d.id}/gift`, { json: { fish: Number(d.n) } }); await loadAdmin(); await refreshBoot(); toast(`${d.n} Fischlein verschenkt 🐟`); renderParent(); break;
        case "rmfile": S.files.splice(Number(d.i), 1); pSheet(); break;
        case "uploadsheet": await uploadSheet(); break;
        case "togglechip": el.classList.toggle("on"); break;
        case "radiochip": el.parentElement.querySelectorAll(".chip").forEach((b) => b.classList.toggle("on", b === el)); break;
        case "aigenerate": await aiGenerate(); break;
        case "openpack": await openPack(Number(d.id)); break;
        case "rmtask": S.openPack.tasks.splice(Number(d.i), 1); el.closest("ol").innerHTML = S.openPack.tasks.map(taskPreview).join(""); break;
        case "savepack": await savePack(d.active !== "1"); break;
        case "deletepack":
          if (confirm("Dieses Lernpaket löschen?")) { await api(`/api/admin/packs/${d.id}`, { method: "DELETE" }); hideOverlay(); await loadAdmin(); await refreshBoot(); renderParent(); }
          break;
        case "trypack": {
          if (!S.profile) { toast("Bitte zuerst ein Kinderprofil anlegen."); break; }
          hideOverlay(); S.view = "home";
          startGame({ kind: "pack", pack: S.openPack, trial: true }); break;
        }
        case "savesettings": {
          const modules = [...document.querySelectorAll(".s_mod:checked")].map((x) => x.value);
          const levels = {}; document.querySelectorAll(".s_lv").forEach((x) => { if (x.value) levels[x.dataset.k] = Number(x.value); });
          await saveSettings({ daily_goal: Number(document.getElementById("s_goal").value), session_len: Number(document.getElementById("s_len").value),
            tts_auto: document.getElementById("s_tts").checked, modules, levels });
          break;
        }
        case "savekey": {
          const extra = { model: document.getElementById("s_model").value };
          const k = document.getElementById("s_key").value.trim(); if (k) extra.api_key = k;
          await saveSettings(extra); renderParent(); break;
        }
        case "testai": {
          toast("Teste Verbindung …", 8000);
          try { const r = await api("/api/admin/test-ai", { method: "POST", json: {} }); toast("✅ KI antwortet: " + r.reply, 5000); }
          catch (e) { toast("❌ " + e.message, 8000); }
          break;
        }
        case "backup": {
          const blob = new Blob([window.LocalBackup.export()], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
          a.download = `mathe-kaetzchen-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          break;
        }
        case "savepin": {
          const pin = document.getElementById("s_pin").value.trim();
          try { await api("/api/admin/settings", { json: { new_pin: pin } }); S.pin = pin; await refreshBoot(); toast("PIN geändert ✅"); }
          catch (e) { toast(e.message); }
          break;
        }
        case "delprofile":
          if (confirm("Profil mit allen Kätzchen und Ergebnissen löschen?")) {
            await api(`/api/admin/profiles/${d.id}`, { method: "DELETE" });
            if (S.profile && S.profile.id === Number(d.id)) S.profile = null;
            S.parentProfile = null; await loadAdmin(); await refreshBoot(); renderParent();
          }
          break;
      }
    } catch (e) { console.error(e); toast(e.message || "Fehler"); }
  });

  document.addEventListener("change", async (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.act === "packactive") {
      await api(`/api/admin/packs/${el.dataset.id}`, { json: { active: el.checked } });
      await loadAdmin(); await refreshBoot(); toast(el.checked ? "Für das Kind sichtbar" : "Ausgeblendet");
    }
  });

  // Tastatur (am PC)
  document.addEventListener("keydown", (ev) => {
    if (S.view !== "game" || !S.game || ev.target.tagName === "INPUT") return;
    const t = S.game.tasks[S.game.idx];
    if (S.game.feedback === "solution" && ev.key === "Enter") return nextTask();
    if (!usesKeypad(t)) return;
    const g = S.game; if (g.locked) return;
    if (/^\d$/.test(ev.key) && g.input.length < 4) { g.input = (g.input === "0" ? "" : g.input) + ev.key; render(); }
    else if (ev.key === "Backspace") { g.input = g.input.slice(0, -1); render(); }
    else if (ev.key === "Enter" && g.input) submit(g.input);
  });

  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  boot();
})();
