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
    { id: "detektiv",  name: "Detektiv",   fur: "#b08455", dark: "#6e4a2b", belly: "#f1dfc6", eye: "#3b82f6", pattern: "tabby", rare: true,
      unlock: { type: "fixed", n: 15, text: "15 Fehler in der Werkstatt ausbessern" } },
    { id: "mondi",     name: "Mondi",      fur: "#33407a", dark: "#1e2754", belly: "#5b6bb5", eye: "#fde68a", pattern: "magic", rare: true,
      unlock: { type: "packstar", n: 1, text: "Ein Schul-Paket mit 3 Sternen schaffen" } },
  ];

  // slot: head | face | neck | body | back | extra  ·  surprise: nur aus Überraschungs-Geschenken
  const SLOTS = [
    { id: "head", name: "Kopf", emoji: "🎩" }, { id: "face", name: "Gesicht", emoji: "😎" },
    { id: "neck", name: "Hals", emoji: "🎀" }, { id: "body", name: "Kleidung", emoji: "👕" },
    { id: "back", name: "Rücken", emoji: "🦸" }, { id: "extra", name: "Lustiges", emoji: "🎈" },
  ];
  const ACCESSORIES = [
    // Kopf
    { id: "bow",       slot: "head",  name: "Masche",          price: 8,  emoji: "🎀" },
    { id: "flower",    slot: "head",  name: "Blume",           price: 8,  emoji: "🌸" },
    { id: "hat",       slot: "head",  name: "Partyhut",        price: 12, emoji: "🥳" },
    { id: "flowerring",slot: "head",  name: "Blumenkranz",     price: 14, emoji: "💐" },
    { id: "chef",      slot: "head",  name: "Kochmütze",       price: 14, emoji: "👨‍🍳" },
    { id: "headphones",slot: "head",  name: "Kopfhörer",       price: 16, emoji: "🎧" },
    { id: "pirate",    slot: "head",  name: "Piratenhut",      price: 18, emoji: "🏴‍☠️" },
    { id: "wizard",    slot: "head",  name: "Zauberhut",       price: 20, emoji: "🧙" },
    { id: "unicorn",   slot: "head",  name: "Einhorn-Horn",    price: 22, emoji: "🦄" },
    { id: "crown",     slot: "head",  name: "Krone",           price: 25, emoji: "👑" },
    // Gesicht
    { id: "glasses",   slot: "face",  name: "Brille",          price: 12, emoji: "👓" },
    { id: "sunglasses",slot: "face",  name: "Sonnenbrille",    price: 14, emoji: "😎" },
    { id: "mustache",  slot: "face",  name: "Schnurrbart",     price: 10, emoji: "🥸" },
    { id: "clownnose", slot: "face",  name: "Clownsnase",      price: 10, emoji: "🤡" },
    { id: "eyepatch",  slot: "face",  name: "Augenklappe",     price: 12, emoji: "🏴‍☠️" },
    // Hals
    { id: "scarf",     slot: "neck",  name: "Schal",           price: 10, emoji: "🧣" },
    { id: "bowtie",    slot: "neck",  name: "Fliege",          price: 10, emoji: "🤵" },
    { id: "bell",      slot: "neck",  name: "Glöckchen",       price: 12, emoji: "🔔" },
    { id: "pearls",    slot: "neck",  name: "Perlenkette",     price: 16, emoji: "📿" },
    // Kleidung
    { id: "sweater",   slot: "body",  name: "Ringelpulli",     price: 15, emoji: "🧶" },
    { id: "raincoat",  slot: "body",  name: "Regenmantel",     price: 18, emoji: "🧥" },
    { id: "tutu",      slot: "body",  name: "Tutu",            price: 18, emoji: "🩰" },
    // Rücken
    { id: "cape",      slot: "back",  name: "Mäntelchen",      price: 20, emoji: "🦸" },
    { id: "wizardcape",slot: "back",  name: "Zaubermantel",    price: 24, emoji: "✨" },
    { id: "wings",     slot: "back",  name: "Feenflügel",      price: 28, emoji: "🧚" },
    // Lustiges
    { id: "balloon",   slot: "extra", name: "Luftballon",      price: 8,  emoji: "🎈" },
    { id: "fishstick", slot: "extra", name: "Fisch am Stiel",  price: 12, emoji: "🐟" },
    { id: "wand",      slot: "extra", name: "Zauberstab",      price: 16, emoji: "🪄" },
    // Geheim – nur in Überraschungen
    { id: "goldcape",  slot: "back",  name: "Goldener Umhang",    surprise: true, emoji: "🌟" },
    { id: "rainbowwings", slot: "back", name: "Regenbogen-Flügel", surprise: true, emoji: "🌈" },
    { id: "diamondcrown", slot: "head", name: "Diamant-Krone",    surprise: true, emoji: "💎" },
    { id: "starglasses", slot: "face", name: "Sternchen-Brille",  surprise: true, emoji: "🤩" },
    { id: "astronaut", slot: "head",  name: "Astronauten-Helm",  surprise: true, emoji: "🚀" },
    { id: "heartballoon", slot: "extra", name: "Herz-Ballon",    surprise: true, emoji: "💖" },
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

  const star5 = (x, y, r, fill) => star(x, y, r).replace("<polygon", `<polygon fill="${fill}"`);
  const CAPE = (fill, extra) => ({
    back: `<path d="M58 124 Q22 182 28 210 L172 210 Q178 182 142 124 Z" fill="${fill}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>${extra || ""}`,
    front: `<path d="M74 134 Q100 150 126 134" stroke="${fill}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="100" cy="146" r="6" fill="#facc15" stroke="#b45309"/>` });
  const WINGS = (fill, stroke) => ({
    back: `<g fill="${fill}" stroke="${stroke}" stroke-width="3" opacity="0.92">
      <ellipse cx="48" cy="128" rx="34" ry="20" transform="rotate(-30 48 128)"/><ellipse cx="54" cy="160" rx="24" ry="13" transform="rotate(20 54 160)"/>
      <ellipse cx="152" cy="128" rx="34" ry="20" transform="rotate(30 152 128)"/><ellipse cx="146" cy="160" rx="24" ry="13" transform="rotate(-20 146 160)"/></g>` });

  /** Zeichnungen je Teil: back (hinter dem Kätzchen), body (über dem Bauch), front (vorne). */
  function accessoryParts(acc, clipBody) {
    switch (acc) {
      case "bow": return { front: `<g transform="translate(140 44) rotate(18)"><polygon points="0,0 -16,-10 -16,10" fill="#ef476f"/>
          <polygon points="0,0 16,-10 16,10" fill="#ef476f"/><circle r="5" fill="#c9184a"/></g>` };
      case "flower": return { front: `<g transform="translate(60 44)">${[0, 72, 144, 216, 288].map((a) =>
          `<circle cx="${(9 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(9 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="7" fill="#f9a8d4"/>`).join("")}<circle r="5" fill="#facc15"/></g>` };
      case "hat": return { front: `<polygon points="100,-8 80,40 120,40" fill="#8b5cf6"/><path d="M86 26 L114 26 M83 34 L117 34" stroke="#facc15" stroke-width="3"/>
          <circle cx="100" cy="-8" r="7" fill="#f472b6"/>` };
      case "crown": return { front: `<polygon points="72,40 74,10 88,26 100,4 112,26 126,10 128,40" fill="#facc15" stroke="#d97706" stroke-width="2"/>
          <circle cx="100" cy="30" r="4" fill="#ef4444"/><circle cx="84" cy="32" r="3" fill="#3b82f6"/><circle cx="116" cy="32" r="3" fill="#22c55e"/>` };
      case "diamondcrown": return { front: `<polygon points="70,42 72,8 88,26 100,0 112,26 128,8 130,42" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2.5"/>
          <polygon points="100,18 108,28 100,38 92,28" fill="#a5f3fc" stroke="#0ea5e9"/><circle cx="82" cy="34" r="3.5" fill="#f0abfc"/><circle cx="118" cy="34" r="3.5" fill="#f0abfc"/>
          ${star5(76, 2, 5, "#fde047")}${star5(128, 0, 4, "#fde047")}` };
      case "flowerring": return { front: [52, 66, 82, 100, 118, 134, 148].map((x, i) => {
          const y = 90 - 54 * Math.sqrt(Math.max(0, 1 - ((x - 100) / 62) ** 2)) + 8;
          const col = ["#f472b6", "#facc15", "#60a5fa", "#f87171", "#a78bfa", "#34d399", "#fb923c"][i];
          return `<circle cx="${x}" cy="${y.toFixed(1)}" r="8" fill="${col}"/><circle cx="${x}" cy="${y.toFixed(1)}" r="3" fill="#fff7d6"/>`; }).join("") };
      case "chef": return { front: `<rect x="74" y="20" width="52" height="22" rx="4" fill="#fff" stroke="#d1d5db" stroke-width="2"/>
          <circle cx="80" cy="12" r="14" fill="#fff" stroke="#d1d5db" stroke-width="2"/><circle cx="100" cy="4" r="16" fill="#fff" stroke="#d1d5db" stroke-width="2"/>
          <circle cx="120" cy="12" r="14" fill="#fff" stroke="#d1d5db" stroke-width="2"/><rect x="76" y="14" width="48" height="16" fill="#fff"/>` };
      case "headphones": return { front: `<path d="M42 96 Q40 26 100 24 Q160 26 158 96" stroke="#ec4899" stroke-width="9" fill="none" stroke-linecap="round"/>
          <rect x="28" y="80" width="22" height="34" rx="9" fill="#db2777"/><rect x="150" y="80" width="22" height="34" rx="9" fill="#db2777"/>` };
      case "pirate": return { front: `<path d="M44 46 Q100 -14 156 46 Q100 32 44 46 Z" fill="#1f2937"/><path d="M50 44 Q100 34 150 44" stroke="#facc15" stroke-width="3" fill="none"/>
          <circle cx="100" cy="22" r="7" fill="#fff"/><path d="M95 30 L105 30" stroke="#fff" stroke-width="3"/>` };
      case "wizard": return { front: `<polygon points="100,-14 74,40 126,40" fill="#6d28d9"/><ellipse cx="100" cy="40" rx="36" ry="8" fill="#5b21b6"/>
          ${star5(96, 8, 6, "#fde047")}${star5(108, 26, 4, "#fde047")}${star5(88, 30, 3.5, "#fde047")}` };
      case "astronaut": return { back: `<circle cx="100" cy="88" r="80" fill="rgba(186,230,253,.35)" stroke="#e5e7eb" stroke-width="7"/>`,
          front: `<path d="M34 120 Q100 150 166 120" stroke="#e5e7eb" stroke-width="10" fill="none"/><circle cx="160" cy="40" r="6" fill="#ef4444"/><path d="M160 34 L160 18" stroke="#9ca3af" stroke-width="3"/>` };
      case "unicorn": return { front: `<polygon points="100,-16 90,38 110,38" fill="#fde68a" stroke="#f59e0b" stroke-width="2"/>
          <path d="M93 26 L107 20 M95 14 L105 9 M91 34 L109 29" stroke="#f59e0b" stroke-width="2"/><circle cx="84" cy="38" r="5" fill="#f9a8d4"/><circle cx="116" cy="38" r="5" fill="#a5b4fc"/>` };
      case "glasses": return { front: `<g fill="none" stroke="#7c3aed" stroke-width="4"><circle cx="76" cy="90" r="18"/><circle cx="124" cy="90" r="18"/>
          <path d="M94 88 Q100 82 106 88"/><path d="M58 86 L42 80"/><path d="M142 86 L158 80"/></g><g fill="#ffffff" opacity="0.25"><circle cx="76" cy="90" r="16"/><circle cx="124" cy="90" r="16"/></g>` };
      case "sunglasses": return { front: `<rect x="56" y="78" width="40" height="26" rx="10" fill="#111827"/><rect x="104" y="78" width="40" height="26" rx="10" fill="#111827"/>
          <path d="M96 86 L104 86" stroke="#111827" stroke-width="4"/><path d="M56 84 L40 78 M144 84 L160 78" stroke="#111827" stroke-width="4"/>
          <path d="M62 84 L72 84" stroke="#fff" stroke-width="3" opacity=".6"/><path d="M110 84 L120 84" stroke="#fff" stroke-width="3" opacity=".6"/>` };
      case "starglasses": return { front: `${star5(76, 90, 20, "#f472b6")}${star5(124, 90, 20, "#f472b6")}<path d="M94 88 L106 88" stroke="#be185d" stroke-width="4"/>
          ${star5(76, 90, 9, "#fdf2f8")}${star5(124, 90, 9, "#fdf2f8")}` };
      case "mustache": return { front: `<path d="M100 112 C 90 104, 72 106, 66 120 C 78 114, 90 120, 100 115 C 110 120, 122 114, 134 120 C 128 106, 110 104, 100 112 Z" fill="#3b2a1a"/>` };
      case "clownnose": return { front: `<circle cx="100" cy="106" r="10" fill="#ef4444"/><circle cx="97" cy="103" r="3" fill="#fff" opacity=".7"/>` };
      case "eyepatch": return { front: `<path d="M48 70 L150 52" stroke="#111827" stroke-width="3"/><ellipse cx="76" cy="90" rx="16" ry="17" fill="#111827"/>` };
      case "scarf": return { front: `<path d="M58 128 Q100 148 142 128 L144 140 Q100 162 56 140 Z" fill="#3b82f6"/>
          <path d="M120 142 L132 176 L118 178 L110 146 Z" fill="#2563eb"/><path d="M70 134 L74 146 M86 139 L88 151 M102 141 L102 153 M118 139 L116 151" stroke="#93c5fd" stroke-width="3"/>` };
      case "bowtie": return { front: `<polygon points="100,146 78,134 78,158" fill="#dc2626"/><polygon points="100,146 122,134 122,158" fill="#dc2626"/><circle cx="100" cy="146" r="6" fill="#991b1b"/>` };
      case "bell": return { front: `<path d="M62 134 Q100 152 138 134" stroke="#ef4444" stroke-width="8" fill="none" stroke-linecap="round"/>
          <circle cx="100" cy="152" r="9" fill="#facc15" stroke="#b45309" stroke-width="2"/><path d="M93 152 L107 152" stroke="#b45309" stroke-width="2"/><circle cx="100" cy="157" r="2" fill="#b45309"/>` };
      case "pearls": return { front: [64, 73, 82, 91, 100, 109, 118, 127, 136].map((x) => {
          const y = 134 + 12 * (1 - ((x - 100) / 36) ** 2);
          return `<circle cx="${x}" cy="${y.toFixed(1)}" r="5" fill="#fdf2f8" stroke="#d8b4fe" stroke-width="1.5"/>`; }).join("") };
      case "sweater": return { body: `<g clip-path="url(#${clipBody})"><rect x="40" y="118" width="120" height="90" fill="#60a5fa"/>
          ${[142, 162, 182].map((y) => `<rect x="40" y="${y}" width="120" height="8" fill="#fff"/>`).join("")}<rect x="78" y="118" width="44" height="14" fill="#3b82f6"/></g>` };
      case "raincoat": return { body: `<g clip-path="url(#${clipBody})"><rect x="40" y="118" width="120" height="90" fill="#facc15"/>
          <path d="M100 124 L100 206" stroke="#ca8a04" stroke-width="2"/>${[150, 168, 186].map((y) => `<circle cx="108" cy="${y}" r="3.5" fill="#1f2937"/>`).join("")}
          <path d="M66 126 L100 146 L134 126" stroke="#eab308" stroke-width="8" fill="none"/></g>` };
      case "tutu": return { body: `<path d="M44 174 ${Array.from({ length: 12 }, (_, i) => `L${50 + i * 9} ${i % 2 ? 198 : 186}`).join(" ")} L156 174 Q100 162 44 174 Z" fill="#f9a8d4" stroke="#ec4899" stroke-width="2"/>
          <path d="M50 176 Q100 166 150 176" stroke="#f472b6" stroke-width="5" fill="none"/>` };
      case "cape": return CAPE("#ef4444");
      case "wizardcape": return CAPE("#7c3aed", `${star5(52, 190, 6, "#fde047")}${star5(148, 184, 5, "#fde047")}${star5(46, 160, 4, "#fde047")}${star5(154, 156, 4, "#fde047")}`);
      case "goldcape": return CAPE("#f59e0b", `${star5(50, 188, 6, "#fff7d6")}${star5(150, 188, 6, "#fff7d6")}${star5(152, 150, 4, "#fff7d6")}${star5(48, 150, 4, "#fff7d6")}`);
      case "wings": return WINGS("rgba(196,181,253,.75)", "#a78bfa");
      case "rainbowwings": return { back: `<g stroke-width="4" fill="none" opacity="0.95">${["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7"].map((c, i) =>
          `<ellipse cx="46" cy="130" rx="${36 - i * 5}" ry="${22 - i * 3}" transform="rotate(-30 46 130)" stroke="${c}"/><ellipse cx="154" cy="130" rx="${36 - i * 5}" ry="${22 - i * 3}" transform="rotate(30 154 130)" stroke="${c}"/>`).join("")}</g>` };
      case "balloon": return { front: `<path d="M124 196 Q150 150 176 70" stroke="#6b7280" stroke-width="2" fill="none"/><ellipse cx="178" cy="50" rx="17" ry="21" fill="#ef4444"/>
          <polygon points="178,71 173,77 183,77" fill="#ef4444"/><ellipse cx="172" cy="42" rx="4" ry="6" fill="#fff" opacity=".5"/>` };
      case "heartballoon": return { front: `<path d="M124 196 Q150 150 176 76" stroke="#6b7280" stroke-width="2" fill="none"/>
          <path d="M176 76 C 150 58, 158 30, 176 42 C 194 30, 202 58, 176 76 Z" fill="#ec4899"/><ellipse cx="168" cy="46" rx="3" ry="5" fill="#fff" opacity=".6"/>` };
      case "fishstick": return { front: `<path d="M128 196 L170 120" stroke="#92400e" stroke-width="5" stroke-linecap="round"/>
          <g transform="translate(172 106) rotate(-60)"><ellipse rx="20" ry="11" fill="#60a5fa"/><polygon points="18,0 32,-10 32,10" fill="#3b82f6"/><circle cx="-10" cy="-3" r="2.5" fill="#1f2937"/></g>` };
      case "wand": return { front: `<path d="M126 196 L166 110" stroke="#1f2937" stroke-width="5" stroke-linecap="round"/><path d="M162 118 L166 110" stroke="#fff" stroke-width="5"/>
          ${star5(168, 100, 14, "#fde047")}${star5(184, 78, 4, "#fde047")}${star5(150, 82, 3, "#fde047")}` };
      default: return {};
    }
  }

  /** acc: String (alt) oder Objekt {slot: teil} */
  function outfitList(acc) {
    if (!acc) return [];
    if (typeof acc === "string") return [acc];
    return SLOTS.map((sl) => acc[sl.id]).filter(Boolean);
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
    const parts = outfitList(opts.acc).map((a) => accessoryParts(a, id + "b"));
    const layer = (k) => parts.map((x) => x[k] || "").join("");
    return `<svg class="cat-svg ${opts.cls || ""}" viewBox="0 -12 200 222" aria-hidden="true">
      <defs>
        <clipPath id="${id}"><ellipse cx="100" cy="160" rx="50" ry="42"/><ellipse cx="100" cy="90" rx="62" ry="54"/>
          <polygon points="48,62 54,14 92,44"/><polygon points="152,62 146,14 108,44"/></clipPath>
        <clipPath id="${id}b"><ellipse cx="100" cy="160" rx="51" ry="43"/></clipPath>
        <radialGradient id="${id}g" cx="40%" cy="35%" r="75%"><stop offset="0%" stop-color="${c.belly}"/><stop offset="100%" stop-color="${c.fur}"/></radialGradient>
      </defs>
      ${layer("back")}
      <path class="cat-tail" d="M140 175 C 186 170, 192 120, 166 104" stroke="${tailColor}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="160" rx="50" ry="42" fill="${furFill}" stroke="rgba(59,49,80,.16)" stroke-width="2"/>
      <ellipse cx="100" cy="168" rx="${c.pattern === "tux" ? 32 : 27}" ry="${c.pattern === "tux" ? 34 : 28}" fill="${c.belly}"/>
      ${layer("body")}
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
      ${layer("front")}
    </svg>`;
  }

  window.Cats = { CATS, ACCESSORIES, SLOTS, byId, catSVG };
})();
