/* Kätzchen: Katalog + SVG-Zeichnung (prozedural, keine Bilddateien nötig). */
(function () {
  "use strict";

  // pattern: plain | tabby | spots | tux | calico | points | magic
  const CATS = [
    { id: "mimi",      name: "Mimi",       fur: "#f4a259", dark: "#d9782f", belly: "#fde6c8", eye: "#5dae5b", pattern: "tabby" },
    { id: "luna",      name: "Luna",       fur: "#9aa3ad", dark: "#7a838d", belly: "#e3e7eb", eye: "#4fa3e0", pattern: "plain" },
    { id: "felix",     name: "Felix",      fur: "#3b3b46", dark: "#26262e", belly: "#ffffff", eye: "#e8c547", pattern: "tux" },
    { id: "minka",     name: "Minka",      fur: "#fbf5ec", dark: "#3b3b46", belly: "#ffffff", eye: "#5dae5b", pattern: "calico", patch: "#f0a050" },
    { id: "schnurri",  name: "Schnurri",   fur: "#f3dfb8", dark: "#dcc193", belly: "#fff7e8", eye: "#c98a3c", pattern: "plain" },
    { id: "tiger",     name: "Tiger",      fur: "#ee8a3c", dark: "#b65a1b", belly: "#fde2c2", eye: "#7bbf4a", pattern: "tabby" },
    { id: "socke",     name: "Socke",      fur: "#a7a9ac", dark: "#5f6266", belly: "#eceded", eye: "#e8c547", pattern: "tabby" },
    { id: "kiki",      name: "Kiki",       fur: "#ffffff", dark: "#e4e4ea", belly: "#ffffff", eye: "#3fb37f", pattern: "plain" },
    { id: "mocca",     name: "Mocca",      fur: "#a47551", dark: "#6e4a30", belly: "#e8d3bd", eye: "#e8c547", pattern: "spots" },
    { id: "lilly",     name: "Lilly",      fur: "#f6ead6", dark: "#6b5240", belly: "#fffaf1", eye: "#4f9ee8", pattern: "points" },
    { id: "puenktchen",name: "Pünktchen",  fur: "#ffffff", dark: "#2f2f38", belly: "#ffffff", eye: "#6bb0e8", pattern: "spots" },
    { id: "zimt",      name: "Zimt",       fur: "#c9824a", dark: "#8f522a", belly: "#f1d6bb", eye: "#5dae5b", pattern: "tabby" },
    { id: "wolke",     name: "Wolke",      fur: "#d9dde3", dark: "#b9bfc8", belly: "#f6f7f9", eye: "#7a8ce0", pattern: "plain" },
    { id: "leo",       name: "Leo",        fur: "#f2c14e", dark: "#c99327", belly: "#fff0c9", eye: "#4f9a3c", pattern: "tabby" },
    { id: "bella",     name: "Bella",      fur: "#2d2a32", dark: "#1b191f", belly: "#3d3943", eye: "#f2c14e", pattern: "plain" },
    { id: "kruemel",   name: "Krümel",     fur: "#f3dfb8", dark: "#b8875a", belly: "#fff7e8", eye: "#5dae5b", pattern: "spots" },
    { id: "rosi",      name: "Rosi",       fur: "#f7b9cf", dark: "#e889ab", belly: "#ffe6ef", eye: "#8b5cf6", pattern: "plain" },
    { id: "mia",       name: "Mia",        fur: "#7d8590", dark: "#5c636c", belly: "#ffffff", eye: "#e8c547", pattern: "tux" },
    { id: "paul",      name: "Paul",       fur: "#9c7052", dark: "#5e3f2b", belly: "#e7d0bb", eye: "#e8a33c", pattern: "tabby" },
    { id: "nala",      name: "Nala",       fur: "#efd9b4", dark: "#8b6a4a", belly: "#fff7ea", eye: "#52a3e8", pattern: "points" },
    // seltene Kätzchen – werden durch Erfolge freigeschaltet
    { id: "sternchen", name: "Sternchen",  fur: "#a78bfa", dark: "#7c5ce8", belly: "#e9e1ff", eye: "#fbbf24", pattern: "magic", rare: true,
      unlock: { type: "streak", n: 3, text: "3 Tage hintereinander üben" } },
    { id: "regenbogen",name: "Regenbogen", fur: "#7dd3fc", dark: "#38bdf8", belly: "#ffffff", eye: "#ec4899", pattern: "rainbow", rare: true,
      unlock: { type: "total", n: 150, text: "150 Aufgaben richtig lösen" } },
    { id: "goldi",     name: "Goldi",      fur: "#f5c84b", dark: "#d49a12", belly: "#fff3c4", eye: "#16a34a", pattern: "magic", rare: true,
      unlock: { type: "streak", n: 7, text: "7 Tage hintereinander üben" } },
    { id: "mondi",     name: "Mondi",      fur: "#33407a", dark: "#1e2754", belly: "#5b6bb5", eye: "#fde68a", pattern: "magic", rare: true,
      unlock: { type: "packstar", n: 1, text: "Ein Schul-Paket mit 3 Sternen schaffen" } },
  ];

  const ACCESSORIES = [
    { id: "bow",     name: "Masche",       price: 8,  emoji: "🎀" },
    { id: "flower",  name: "Blume",        price: 8,  emoji: "🌸" },
    { id: "scarf",   name: "Schal",        price: 10, emoji: "🧣" },
    { id: "glasses", name: "Brille",       price: 12, emoji: "👓" },
    { id: "hat",     name: "Partyhut",     price: 12, emoji: "🥳" },
    { id: "crown",   name: "Krone",        price: 25, emoji: "👑" },
  ];

  let uid = 0;

  function byId(id) { return CATS.find((c) => c.id === id); }

  function patternLayer(c, clip) {
    const d = c.dark;
    switch (c.pattern) {
      case "tabby":
        return `<g clip-path="url(#${clip})" stroke="${d}" stroke-width="7" stroke-linecap="round" fill="none">
          <path d="M100 38 L100 58"/><path d="M84 41 L87 57"/><path d="M116 41 L113 57"/>
          <path d="M38 88 L56 92"/><path d="M40 102 L56 101"/><path d="M162 88 L144 92"/><path d="M160 102 L144 101"/>
          <path d="M54 140 Q62 150 56 162"/><path d="M146 140 Q138 150 144 162"/><path d="M52 168 Q60 176 58 186"/><path d="M148 168 Q140 176 142 186"/>
        </g>`;
      case "spots":
        return `<g clip-path="url(#${clip})" fill="${d}">
          <circle cx="64" cy="58" r="9"/><circle cx="138" cy="70" r="7"/><circle cx="120" cy="48" r="5"/>
          <circle cx="62" cy="150" r="10"/><circle cx="140" cy="160" r="9"/><circle cx="128" cy="138" r="5"/><circle cx="70" cy="180" r="6"/>
        </g>`;
      case "calico":
        return `<g clip-path="url(#${clip})">
          <ellipse cx="66" cy="62" rx="30" ry="24" fill="${c.patch}"/><ellipse cx="140" cy="58" rx="26" ry="22" fill="${d}"/>
          <ellipse cx="62" cy="160" rx="22" ry="26" fill="${d}"/><ellipse cx="140" cy="150" rx="22" ry="20" fill="${c.patch}"/>
        </g>`;
      case "points":
        return `<g clip-path="url(#${clip})" fill="${d}" opacity="0.85">
          <ellipse cx="100" cy="108" rx="34" ry="26"/>
          <polygon points="48,62 54,14 92,44"/><polygon points="152,62 146,14 108,44"/>
        </g>`;
      case "magic":
        return `<g clip-path="url(#${clip})" fill="#fde68a">
          ${star(60, 150, 7)}${star(142, 160, 6)}${star(128, 136, 4)}${star(70, 52, 5)}${star(136, 56, 4)}${star(80, 180, 4)}
        </g>`;
      case "rainbow":
        return `<g clip-path="url(#${clip})" opacity="0.55" fill="none" stroke-width="7">
          <path d="M40 190 Q100 110 160 190" stroke="#ef4444"/><path d="M48 190 Q100 122 152 190" stroke="#f59e0b"/>
          <path d="M56 190 Q100 134 144 190" stroke="#facc15"/><path d="M64 190 Q100 146 136 190" stroke="#22c55e"/>
          <path d="M72 190 Q100 158 128 190" stroke="#3b82f6"/><path d="M80 190 Q100 170 120 190" stroke="#a855f7"/>
        </g>`;
      default:
        return "";
    }
  }

  function star(x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 5 * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      pts.push((x + rr * Math.cos(a)).toFixed(1) + "," + (y + rr * Math.sin(a)).toFixed(1));
    }
    return `<polygon points="${pts.join(" ")}"/>`;
  }

  function eyes(c, mood) {
    const dk = "#2b2233";
    if (mood === "sleep") {
      return `<path d="M64 92 Q76 100 88 92" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M112 92 Q124 100 136 92" stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
    if (mood === "joy") {
      return `<path d="M64 94 Q76 80 88 94" stroke="${dk}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <path d="M112 94 Q124 80 136 94" stroke="${dk}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    }
    const ry = mood === "wow" ? 16 : 14;
    const one = (x) => `<ellipse cx="${x}" cy="90" rx="12.5" ry="${ry}" fill="${c.eye}"/>
      <ellipse cx="${x}" cy="91" rx="${mood === "wow" ? 8 : 6}" ry="${ry - 3}" fill="${dk}"/>
      <circle cx="${x - 4}" cy="84" r="4" fill="#fff"/><circle cx="${x + 4}" cy="96" r="1.8" fill="#fff"/>`;
    const brows = mood === "sad"
      ? `<path d="M66 72 L84 78" stroke="${dk}" stroke-width="3" stroke-linecap="round"/><path d="M134 72 L116 78" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`
      : "";
    return one(76) + one(124) + brows;
  }

  function mouth(mood) {
    const dk = "#2b2233";
    if (mood === "wow") return `<ellipse cx="100" cy="120" rx="6" ry="7" fill="#7a2e3a"/>`;
    if (mood === "sad") return `<path d="M90 122 Q100 114 110 122" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (mood === "joy") return `<path d="M90 113 Q100 128 110 113 Z" fill="#7a2e3a"/><path d="M95 119 Q100 124 105 119" fill="#f48ca8"/>`;
    return `<path d="M100 111 Q100 119 91 119" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M100 111 Q100 119 109 119" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }

  function accessory(acc) {
    switch (acc) {
      case "bow":
        return `<g transform="translate(140 44) rotate(18)"><polygon points="0,0 -16,-10 -16,10" fill="#ef476f"/>
          <polygon points="0,0 16,-10 16,10" fill="#ef476f"/><circle r="5" fill="#c9184a"/></g>`;
      case "flower":
        return `<g transform="translate(60 44)">${[0, 72, 144, 216, 288].map((a) =>
          `<circle cx="${(9 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(9 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="7" fill="#f9a8d4"/>`).join("")}
          <circle r="5" fill="#facc15"/></g>`;
      case "scarf":
        return `<path d="M58 128 Q100 148 142 128 L144 140 Q100 162 56 140 Z" fill="#3b82f6"/>
          <path d="M120 142 L132 176 L118 178 L110 146 Z" fill="#2563eb"/>
          <path d="M70 134 L74 146 M86 139 L88 151 M102 141 L102 153 M118 139 L116 151" stroke="#93c5fd" stroke-width="3"/>`;
      case "glasses":
        return `<g fill="none" stroke="#1f2937" stroke-width="4"><circle cx="76" cy="90" r="18"/><circle cx="124" cy="90" r="18"/>
          <path d="M94 88 Q100 82 106 88"/><path d="M58 86 L42 80"/><path d="M142 86 L158 80"/></g>
          <g fill="#ffffff" opacity="0.25"><circle cx="76" cy="90" r="16"/><circle cx="124" cy="90" r="16"/></g>`;
      case "hat":
        return `<polygon points="100,-8 80,40 120,40" fill="#8b5cf6"/>
          <path d="M86 26 L114 26 M83 34 L117 34" stroke="#facc15" stroke-width="3"/>
          <circle cx="100" cy="-8" r="7" fill="#f472b6"/>`;
      case "crown":
        return `<polygon points="72,40 74,10 88,26 100,4 112,26 126,10 128,40" fill="#facc15" stroke="#d97706" stroke-width="2"/>
          <circle cx="100" cy="30" r="4" fill="#ef4444"/><circle cx="84" cy="32" r="3" fill="#3b82f6"/><circle cx="116" cy="32" r="3" fill="#22c55e"/>`;
      default:
        return "";
    }
  }

  /** catSVG(cat, {mood, acc, silhouette, cls}) – liefert einen SVG-String. */
  function catSVG(cat, opts) {
    opts = opts || {};
    const c = typeof cat === "string" ? byId(cat) : cat;
    const mood = opts.mood || "happy";
    const id = "cc" + (++uid);
    if (opts.silhouette) {
      return `<svg class="cat-svg ${opts.cls || ""}" viewBox="0 -12 200 222" aria-hidden="true">
        <g fill="var(--silhouette)"><path d="M140 175 C 186 170, 192 120, 166 104" stroke="var(--silhouette)" stroke-width="14" fill="none" stroke-linecap="round"/>
        <ellipse cx="100" cy="160" rx="50" ry="42"/><ellipse cx="100" cy="90" rx="62" ry="54"/>
        <polygon points="48,62 54,14 92,44"/><polygon points="152,62 146,14 108,44"/></g>
        <text x="100" y="112" text-anchor="middle" font-size="58" font-weight="700" fill="var(--silhouette-q)">?</text></svg>`;
    }
    const tailColor = c.pattern === "points" ? c.dark : c.fur;
    const pawColor = c.pattern === "points" ? c.dark : (c.pattern === "tux" ? "#ffffff" : c.fur);
    const muzzle = c.pattern === "tux" ? "#ffffff" : c.belly;
    const furFill = c.pattern === "magic" ? `url(#${id}g)` : c.fur;
    return `<svg class="cat-svg ${opts.cls || ""}" viewBox="0 -12 200 222" aria-hidden="true">
      <defs>
        <clipPath id="${id}"><ellipse cx="100" cy="160" rx="50" ry="42"/><ellipse cx="100" cy="90" rx="62" ry="54"/>
          <polygon points="48,62 54,14 92,44"/><polygon points="152,62 146,14 108,44"/></clipPath>
        <radialGradient id="${id}g" cx="40%" cy="35%" r="75%"><stop offset="0%" stop-color="${c.belly}"/><stop offset="100%" stop-color="${c.fur}"/></radialGradient>
      </defs>
      <path class="cat-tail" d="M140 175 C 186 170, 192 120, 166 104" stroke="${tailColor}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="160" rx="50" ry="42" fill="${furFill}" stroke="rgba(59,49,80,.16)" stroke-width="2"/>
      <ellipse cx="100" cy="168" rx="${c.pattern === "tux" ? 32 : 27}" ry="${c.pattern === "tux" ? 34 : 28}" fill="${c.belly}"/>
      <polygon points="48,62 54,14 92,44" fill="${furFill}" stroke="rgba(59,49,80,.16)" stroke-width="2" stroke-linejoin="round"/><polygon points="152,62 146,14 108,44" fill="${furFill}" stroke="rgba(59,49,80,.16)" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="100" cy="90" rx="62" ry="54" fill="${furFill}" stroke="rgba(59,49,80,.16)" stroke-width="2"/>
      ${patternLayer(c, id)}
      <polygon points="57,55 60,27 81,45" fill="#f9a8c0"/><polygon points="143,55 140,27 119,45" fill="#f9a8c0"/>
      <ellipse cx="100" cy="112" rx="24" ry="15" fill="${muzzle}"/>
      <ellipse cx="80" cy="199" rx="15" ry="9" fill="${pawColor}" stroke="rgba(0,0,0,.08)"/>
      <ellipse cx="120" cy="199" rx="15" ry="9" fill="${pawColor}" stroke="rgba(0,0,0,.08)"/>
      ${eyes(c, mood)}
      <circle cx="58" cy="110" r="8" fill="#f78fb3" opacity="0.38"/><circle cx="142" cy="110" r="8" fill="#f78fb3" opacity="0.38"/>
      <path d="M94 103 L106 103 L100 110 Z" fill="#f47c9c"/>
      ${mouth(mood)}
      <g stroke="#2b2233" stroke-width="1.6" opacity="0.45" stroke-linecap="round">
        <path d="M74 110 L40 104"/><path d="M74 115 L40 120"/><path d="M126 110 L160 104"/><path d="M126 115 L160 120"/></g>
      ${mood === "sleep" ? `<text x="150" y="40" font-size="22" font-weight="700" fill="#8b80a8">z</text><text x="166" y="22" font-size="28" font-weight="700" fill="#8b80a8">Z</text>` : ""}
      ${accessory(opts.acc)}
    </svg>`;
  }

  window.Cats = { CATS, ACCESSORIES, byId, catSVG };
})();
