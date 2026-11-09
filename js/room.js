/* Katzenzimmer: Einrichtungs-Katalog + SVG-Szene (Tageszeit & Jahreszeit im Fenster). */
(function () {
  "use strict";

  const SPOTS = [
    { id: "wall",    name: "Tapete",   emoji: "🧱" },
    { id: "floor",   name: "Boden",    emoji: "🟫" },
    { id: "carpet",  name: "Teppich",  emoji: "🟣" },
    { id: "curtain", name: "Vorhang",  emoji: "🪟" },
    { id: "picture", name: "Bild",     emoji: "🖼️" },
    { id: "lamp",    name: "Licht",    emoji: "💡" },
    { id: "left",    name: "Möbel",    emoji: "🛋️" },
    { id: "right",   name: "Ecke",     emoji: "🪴" },
    { id: "toy",     name: "Spielzeug",emoji: "🧶" },
  ];

  // world: nur als Belohnung, wenn eine Kätzchen-Welt vollständig ist
  const ROOM_ITEMS = [
    { id: "wall_pink",    spot: "wall",    name: "Rosa Streifen",     emoji: "🩷", price: 15 },
    { id: "wall_flowers", spot: "wall",    name: "Blumentapete",      emoji: "🌼", price: 20 },
    { id: "wall_stars",   spot: "wall",    name: "Sternentapete",     emoji: "✨", price: 22 },
    { id: "wall_wood",    spot: "wall",    name: "Holzwand",          emoji: "🪵", price: 18 },
    { id: "floor_check",  spot: "floor",   name: "Schachbrett-Boden", emoji: "🏁", price: 15 },
    { id: "floor_grass",  spot: "floor",   name: "Wiese",             emoji: "🌱", price: 20 },
    { id: "floor_cloud",  spot: "floor",   name: "Wolkenboden",       emoji: "☁️", price: 25 },
    { id: "rug_round",    spot: "carpet",  name: "Runder Teppich",    emoji: "⭕", price: 12 },
    { id: "rug_paw",      spot: "carpet",  name: "Pfoten-Teppich",    emoji: "🐾", price: 16 },
    { id: "rug_rainbow",  spot: "carpet",  name: "Regenbogen-Teppich",emoji: "🌈", price: 22 },
    { id: "curtain_red",  spot: "curtain", name: "Rote Vorhänge",     emoji: "🟥", price: 12 },
    { id: "curtain_stars",spot: "curtain", name: "Sternen-Vorhänge",  emoji: "🌟", price: 16 },
    { id: "pic_fish",     spot: "picture", name: "Fischbild",         emoji: "🐟", price: 10 },
    { id: "pic_rainbow",  spot: "picture", name: "Regenbogenbild",    emoji: "🌈", price: 12 },
    { id: "pic_moon",     spot: "picture", name: "Mondbild",          emoji: "🌙", price: 12 },
    { id: "lamp",         spot: "lamp",    name: "Hängelampe",        emoji: "💡", price: 15 },
    { id: "fairy",        spot: "lamp",    name: "Lichterkette",      emoji: "🎆", price: 20 },
    { id: "disco",        spot: "lamp",    name: "Discokugel",        emoji: "🪩", price: 30 },
    { id: "sofa",         spot: "left",    name: "Sofa",              emoji: "🛋️", price: 35 },
    { id: "bookshelf",    spot: "left",    name: "Bücherregal",       emoji: "📚", price: 30 },
    { id: "fireplace",    spot: "left",    name: "Kamin",             emoji: "🔥", price: 45 },
    { id: "plant",        spot: "right",   name: "Zimmerpflanze",     emoji: "🪴", price: 15 },
    { id: "aquarium",     spot: "right",   name: "Aquarium",          emoji: "🐠", price: 40 },
    { id: "yarn",         spot: "toy",     name: "Wollknäuel",        emoji: "🧶", price: 8 },
    { id: "ball",         spot: "toy",     name: "Ball",              emoji: "⚽", price: 8 },
    { id: "mouse",        spot: "toy",     name: "Spielmaus",         emoji: "🐭", price: 10 },
    // Welt-Belohnungen
    { id: "familyphoto",  spot: "picture", name: "Familienfoto",      emoji: "📸", world: "home" },
    { id: "hay",          spot: "left",    name: "Heuballen",         emoji: "🌾", world: "farm" },
    { id: "mushroomhouse",spot: "right",   name: "Pilzhaus",          emoji: "🍄", world: "forest" },
    { id: "throne",       spot: "left",    name: "Königsthron",       emoji: "👑", world: "castle" },
    { id: "treasure",     spot: "toy",     name: "Schatztruhe",       emoji: "💰", world: "sea" },
    { id: "rocket",       spot: "right",   name: "Rakete",            emoji: "🚀", world: "space" },
  ];

  const star = (x, y, r, fill) => window.Cats.star(x, y, r).replace("<polygon", `<polygon fill="${fill}"`);

  // ------------------------------------------------------------ Hintergrund
  function wallSVG(id) {
    switch (id) {
      case "wall_pink": return `<rect width="360" height="180" fill="#fde2ec"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 30 + 8}" width="12" height="180" fill="#fbcfe0"/>`).join("")}`;
      case "wall_flowers": return `<rect width="360" height="180" fill="#dcf5ea"/>${Array.from({ length: 24 }, (_, i) => {
        const x = (i % 6) * 62 + (Math.floor(i / 6) % 2) * 31 + 14, y = Math.floor(i / 6) * 46 + 20;
        return `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(5 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(5 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="3.6" fill="#fff"/>`).join("")}<circle r="2.6" fill="#facc15"/></g>`; }).join("")}`;
      case "wall_stars": return `<rect width="360" height="180" fill="#2e3a73"/>${Array.from({ length: 22 }, (_, i) => star((i * 67) % 350 + 6, (i * 41) % 170 + 6, i % 3 ? 3 : 5, "#fde68a")).join("")}`;
      case "wall_wood": return `<rect width="360" height="180" fill="#d9a46a"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 40}" width="40" height="180" fill="${i % 2 ? "#cf9a60" : "#dcaa72"}" stroke="#b07a42" stroke-width="1.5"/>`).join("")}`;
      default: return `<rect width="360" height="180" fill="#fdf1e4"/>${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i % 6) * 62 + 20 + (Math.floor(i / 6) % 2) * 31}" cy="${Math.floor(i / 6) * 56 + 26}" r="3" fill="#f6dcc4"/>`).join("")}`;
    }
  }
  function floorSVG(id) {
    switch (id) {
      case "floor_check": return `<rect y="180" width="360" height="100" fill="#fff"/>${Array.from({ length: 36 }, (_, i) => (i + Math.floor(i / 12)) % 2 ? "" : `<rect x="${(i % 12) * 30}" y="${180 + Math.floor(i / 12) * 34}" width="30" height="34" fill="#374151"/>`).join("")}`;
      case "floor_grass": return `<rect y="180" width="360" height="100" fill="#86d36b"/>${Array.from({ length: 40 }, (_, i) => { const x = (i * 37) % 356, y = 190 + (i * 23) % 84; return `<path d="M${x} ${y} l3 -8 l3 8" stroke="#4ea83a" stroke-width="2" fill="none"/>`; }).join("")}
        ${[[40, 262, "#f472b6"], [320, 200, "#facc15"], [250, 270, "#fff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`).join("")}`;
      case "floor_cloud": return `<rect y="180" width="360" height="100" fill="#bfe3ff"/>${[[50, 210], [190, 250], [300, 205], [110, 265]].map(([x, y]) => `<g fill="#fff" opacity=".9"><ellipse cx="${x}" cy="${y}" rx="24" ry="10"/><ellipse cx="${x - 12}" cy="${y - 6}" rx="12" ry="9"/><ellipse cx="${x + 10}" cy="${y - 8}" rx="14" ry="11"/></g>`).join("")}`;
      default: return `<rect y="180" width="360" height="100" fill="#e2b585"/>${[204, 228, 252].map((y) => `<path d="M0 ${y} L360 ${y}" stroke="#c99560" stroke-width="2"/>`).join("")}
        ${[[60, 180], [170, 204], [290, 180], [90, 228], [230, 228], [40, 252], [200, 252], [320, 252]].map(([x, y]) => `<path d="M${x} ${y} L${x} ${y + 24}" stroke="#c99560" stroke-width="2"/>`).join("")}`;
    }
  }

  // ------------------------------------------------------------ Fenster: Tageszeit + Jahreszeit
  function dayPart(d) {
    const h = d.getHours();
    return h >= 20 || h < 6 ? "night" : h < 11 ? "morning" : h < 17 ? "day" : "evening";
  }
  function season(d) { const m = d.getMonth(); return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn"; }
  function windowSVG(part, sea) {
    const sky = { morning: ["#bae6fd", "#fef3c7"], day: ["#7dd3fc", "#e0f2fe"], evening: ["#f97316", "#fbcfe8"], night: ["#1e1b4b", "#3730a3"] }[part];
    const sun = part === "night" ? `<circle cx="196" cy="48" r="11" fill="#fef9c3"/><circle cx="201" cy="44" r="10" fill="${sky[0]}"/>${star(158, 40, 3, "#fef9c3")}${star(176, 70, 2.5, "#fef9c3")}${star(206, 82, 2, "#fef9c3")}`
      : part === "evening" ? `<circle cx="180" cy="98" r="16" fill="#fde047" opacity=".9"/>` : `<circle cx="${part === "morning" ? 160 : 196}" cy="${part === "morning" ? 70 : 46}" r="11" fill="#fde047"/>`;
    const hill = sea === "winter" ? "#f8fafc" : sea === "autumn" ? "#d9a441" : "#7cc86a";
    let deco = "";
    if (sea === "winter") deco = Array.from({ length: 14 }, (_, i) => `<circle class="snow" style="animation-delay:${(i % 7) * 0.5}s" cx="${146 + (i * 23) % 70}" cy="${30 + (i * 17) % 60}" r="2" fill="#fff"/>`).join("");
    else if (sea === "autumn") deco = [[156, 50, "#ea580c"], [190, 70, "#facc15"], [208, 40, "#b45309"]].map(([x, y, c]) => `<ellipse class="leaf" cx="${x}" cy="${y}" rx="4" ry="2.5" fill="${c}"/>`).join("");
    else if (sea === "spring") deco = [[154, 102, "#f472b6"], [170, 106, "#fde047"], [204, 103, "#fff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`).join("");
    else deco = `<path d="M150 60 q5 -4 10 0 q5 -4 10 0" stroke="#334155" stroke-width="1.5" fill="none"/>`;
    return `<defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
      <clipPath id="rwin"><rect x="140" y="24" width="80" height="88" rx="6"/></clipPath></defs>
      <rect x="134" y="18" width="92" height="100" rx="8" fill="#fff" stroke="#d6c3b0" stroke-width="2"/>
      <g clip-path="url(#rwin)"><rect x="140" y="24" width="80" height="88" fill="url(#rsky)"/>${sun}
        <ellipse cx="170" cy="118" rx="60" ry="18" fill="${hill}"/>${sea === "winter" ? `<path d="M196 104 l8 -16 l8 16 Z" fill="#16a34a"/><path d="M198 98 l6 -10 l6 10 Z" fill="#fff" opacity=".8"/>` : `<path d="M196 104 l8 -16 l8 16 Z" fill="#15803d"/>`}${deco}</g>
      <path d="M180 24 L180 112 M140 68 L220 68" stroke="#fff" stroke-width="4"/>
      <rect x="130" y="114" width="100" height="8" rx="3" fill="#e7d3bd"/>`;
  }
  function curtainSVG(id) {
    if (!id) return "";
    const c = id === "curtain_stars" ? "#7c3aed" : "#dc2626", d = id === "curtain_stars" ? "#5b21b6" : "#991b1b";
    const st = id === "curtain_stars" ? [star(130, 40, 4, "#fde047"), star(124, 80, 3, "#fde047"), star(232, 50, 4, "#fde047"), star(236, 92, 3, "#fde047")].join("") : "";
    return `<rect x="120" y="10" width="120" height="7" rx="3" fill="#92400e"/>
      <path d="M118 14 Q132 70 122 128 L144 128 Q140 70 150 14 Z" fill="${c}" stroke="${d}" stroke-width="2"/>
      <path d="M242 14 Q228 70 238 128 L216 128 Q220 70 210 14 Z" fill="${c}" stroke="${d}" stroke-width="2"/>${st}`;
  }
  function pictureSVG(id) {
    if (!id) return "";
    const frame = (inner) => `<g transform="translate(26 36)"><rect width="66" height="54" rx="4" fill="#b45309"/><rect x="5" y="5" width="56" height="44" fill="#fff"/>${inner}</g>`;
    switch (id) {
      case "pic_fish": return frame(`<rect x="5" y="5" width="56" height="44" fill="#bae6fd"/><g transform="translate(32 27)"><ellipse rx="14" ry="8" fill="#f97316"/><polygon points="13,0 23,-7 23,7" fill="#ea580c"/><circle cx="-7" cy="-2" r="2" fill="#1f2937"/></g>`);
      case "pic_rainbow": return frame(`${["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6"].map((c, i) => `<path d="M${12 + i * 4} 46 a${21 - i * 4} ${21 - i * 4} 0 0 1 ${42 - i * 8} 0" stroke="${c}" stroke-width="4" fill="none"/>`).join("")}`);
      case "pic_moon": return frame(`<rect x="5" y="5" width="56" height="44" fill="#1e1b4b"/><circle cx="36" cy="26" r="12" fill="#fef9c3"/><circle cx="41" cy="22" r="11" fill="#1e1b4b"/>${star(16, 16, 3, "#fef9c3")}${star(50, 40, 2.5, "#fef9c3")}`);
      case "familyphoto": return frame(`<rect x="5" y="5" width="56" height="44" fill="#fde68a"/><g fill="#f4a259"><circle cx="20" cy="30" r="8"/><circle cx="46" cy="30" r="8"/><polygon points="13,26 15,17 20,23"/><polygon points="27,26 25,17 20,23"/><polygon points="39,26 41,17 46,23"/><polygon points="53,26 51,17 46,23"/></g><circle cx="33" cy="34" r="6" fill="#9aa3ad"/><path d="M28 32 l2 -6 l3 4 l3 -4 l2 6" fill="#9aa3ad"/><text x="33" y="15" text-anchor="middle" font-size="8">💖</text>`);
      default: return "";
    }
  }
  function trophySVG(trophies) {
    if (!trophies || !trophies.length) return "";
    const list = trophies.slice(-6);
    return `<g transform="translate(250 92)"><rect x="0" y="22" width="96" height="7" rx="2" fill="#a16207"/><path d="M8 29 L8 38 M88 29 L88 38" stroke="#a16207" stroke-width="4"/>
      ${list.map((t, i) => `<text x="${10 + i * 15}" y="20" text-anchor="middle" font-size="16">${t.icon}</text>`).join("")}</g>`;
  }
  function lampSVG(id, part) {
    if (!id) return "";
    const on = part === "night" || part === "evening";
    if (id === "lamp") return `<path d="M96 0 L96 26" stroke="#6b7280" stroke-width="2"/>${on ? `<circle cx="96" cy="44" r="44" fill="#fde68a" opacity=".22"/>` : ""}
      <path d="M78 42 Q96 18 114 42 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/><circle cx="96" cy="44" r="5" fill="${on ? "#fef08a" : "#fff7d6"}"/>`;
    if (id === "fairy") {
      const cols = ["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#ec4899"];
      return `<path d="M0 8 Q45 26 90 8 Q135 26 180 8 Q225 26 270 8 Q315 26 360 8" stroke="#374151" stroke-width="1.5" fill="none"/>
        ${Array.from({ length: 16 }, (_, i) => { const x = i * 24 + 6, y = 8 + 16 * Math.sin(((x % 90) / 90) * Math.PI) * 0.75; return `<circle class="${on ? "twinkle" : ""}" style="animation-delay:${(i % 5) * 0.3}s" cx="${x}" cy="${(y + 3).toFixed(1)}" r="${on ? 4 : 3}" fill="${cols[i % 5]}"/>`; }).join("")}`;
    }
    if (id === "disco") return `<path d="M300 0 L300 18" stroke="#6b7280" stroke-width="2"/><circle cx="300" cy="32" r="14" fill="#cbd5e1" stroke="#64748b"/>
      <path d="M286 32 L314 32 M300 18 L300 46 M290 22 L310 42 M310 22 L290 42" stroke="#94a3b8" stroke-width="1.2"/>
      ${[[270, 60, "#f472b6"], [326, 70, "#60a5fa"], [290, 90, "#facc15"], [334, 40, "#a78bfa"]].map(([x, y, c], i) => `<g class="twinkle" style="animation-delay:${i * 0.4}s">${star(x, y, 4, c)}</g>`).join("")}`;
    return "";
  }
  function carpetSVG(id) {
    if (id === "rug_round") return `<ellipse cx="180" cy="244" rx="92" ry="24" fill="#93c5fd" stroke="#3b82f6" stroke-width="3"/><ellipse cx="180" cy="244" rx="70" ry="16" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/>`;
    if (id === "rug_paw") return `<ellipse cx="180" cy="244" rx="92" ry="24" fill="#fbcfe8" stroke="#ec4899" stroke-width="3"/>
      ${[[150, 244], [210, 240]].map(([x, y]) => `<g fill="#ec4899"><ellipse cx="${x}" cy="${y + 4}" rx="9" ry="6"/><circle cx="${x - 9}" cy="${y - 5}" r="3.5"/><circle cx="${x - 3}" cy="${y - 8}" r="3.5"/><circle cx="${x + 3}" cy="${y - 8}" r="3.5"/><circle cx="${x + 9}" cy="${y - 5}" r="3.5"/></g>`).join("")}`;
    if (id === "rug_rainbow") return ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7"].map((c, i) => `<ellipse cx="180" cy="244" rx="${96 - i * 13}" ry="${25 - i * 3.5}" fill="${c}"/>`).join("");
    return "";
  }
  function leftSVG(id, part) {
    switch (id) {
      case "sofa": return `<g transform="translate(6 168)"><rect x="6" y="14" width="104" height="42" rx="14" fill="#f472b6"/><rect x="0" y="30" width="20" height="40" rx="9" fill="#ec4899"/><rect x="96" y="30" width="20" height="40" rx="9" fill="#ec4899"/>
        <rect x="14" y="44" width="88" height="22" rx="8" fill="#f9a8d4"/><rect x="10" y="68" width="8" height="10" fill="#9d174d"/><rect x="98" y="68" width="8" height="10" fill="#9d174d"/></g>`;
      case "bookshelf": return `<g transform="translate(10 104)"><rect width="84" height="146" rx="4" fill="#92400e"/><rect x="6" y="6" width="72" height="134" fill="#b45309"/>
        ${[40, 80, 120].map((y) => `<rect x="6" y="${y}" width="72" height="5" fill="#78350f"/>`).join("")}
        ${[[10, 12, "#ef4444"], [20, 16, "#3b82f6"], [30, 10, "#22c55e"], [40, 14, "#facc15"], [52, 12, "#a855f7"], [12, 52, "#f97316"], [24, 56, "#0ea5e9"], [36, 50, "#ec4899"], [60, 54, "#16a34a"], [14, 92, "#facc15"], [28, 96, "#ef4444"], [44, 90, "#6366f1"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="9" height="${40 - (y % 40) - 2}" fill="${c}"/>`).join("")}</g>`;
      case "fireplace": return `<g transform="translate(8 128)"><rect width="110" height="122" fill="#b91c1c"/>${Array.from({ length: 6 }, (_, r) => Array.from({ length: 4 }, (_, i) => `<rect x="${i * 28 + (r % 2) * 14 - 7}" y="${r * 20}" width="27" height="19" fill="none" stroke="#7f1d1d" stroke-width="1.5"/>`).join("")).join("")}
        <rect x="-6" y="-8" width="122" height="12" rx="3" fill="#78350f"/><path d="M22 122 L22 58 Q55 30 88 58 L88 122 Z" fill="#1f2937"/>
        <g class="flame"><path d="M40 120 Q42 92 56 78 Q54 98 66 90 Q74 104 70 120 Z" fill="#f97316"/><path d="M48 120 Q50 102 58 94 Q60 106 64 104 Q66 112 62 120 Z" fill="#fde047"/></g>
        <rect x="34" y="116" width="42" height="6" rx="3" fill="#78350f"/></g>`;
      case "hay": return `<g transform="translate(8 178)"><rect width="104" height="70" rx="12" fill="#e9c46a" stroke="#b7862b" stroke-width="2"/>
        ${Array.from({ length: 10 }, (_, i) => `<path d="M${8 + i * 10} 8 l4 54" stroke="#c99a35" stroke-width="2"/>`).join("")}<rect x="0" y="18" width="104" height="5" fill="#a16207"/><rect x="0" y="48" width="104" height="5" fill="#a16207"/>
        <path d="M90 0 l8 -12 M96 2 l10 -8" stroke="#c99a35" stroke-width="2"/></g>`;
      case "throne": return `<g transform="translate(14 112)"><path d="M10 40 L10 0 L24 14 L48 -6 L72 14 L86 0 L86 40 Z" fill="#facc15" stroke="#b45309" stroke-width="2"/>
        <circle cx="48" cy="12" r="5" fill="#ef4444"/><rect x="6" y="40" width="84" height="66" rx="6" fill="#7c3aed"/><rect x="0" y="90" width="96" height="26" rx="8" fill="#a855f7"/>
        <rect x="6" y="114" width="10" height="24" fill="#b45309"/><rect x="80" y="114" width="10" height="24" fill="#b45309"/>${star(48, 64, 9, "#fde047")}</g>`;
      default: return "";
    }
  }
  function rightSVG(id) {
    switch (id) {
      case "plant": return `<g transform="translate(290 150)"><path d="M30 60 Q4 30 10 4 Q26 26 30 50 Q32 18 50 0 Q52 30 34 58 Q50 36 66 30 Q56 52 34 64 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
        <path d="M14 62 L54 62 L48 100 L20 100 Z" fill="#ea580c" stroke="#9a3412" stroke-width="2"/></g>`;
      case "aquarium": return `<g transform="translate(252 140)"><rect x="0" y="66" width="100" height="44" fill="#78350f"/><rect x="0" y="0" width="100" height="68" rx="4" fill="#7dd3fc" stroke="#0369a1" stroke-width="3" opacity=".9"/>
        <path d="M0 56 Q25 48 50 56 Q75 64 100 56 L100 68 L0 68 Z" fill="#fde68a"/><path d="M18 62 Q14 40 22 26 M22 62 Q28 44 24 30" stroke="#16a34a" stroke-width="3" fill="none"/>
        <g class="swim"><ellipse cx="50" cy="26" rx="9" ry="5" fill="#f97316"/><polygon points="58,26 65,21 65,31" fill="#f97316"/></g>
        <g class="swim2"><ellipse cx="70" cy="44" rx="7" ry="4" fill="#facc15"/><polygon points="76,44 82,40 82,48" fill="#facc15"/></g>
        <circle cx="34" cy="16" r="2.5" fill="none" stroke="#fff"/><circle cx="38" cy="8" r="1.8" fill="none" stroke="#fff"/></g>`;
      case "mushroomhouse": return `<g transform="translate(262 132)"><rect x="22" y="56" width="52" height="62" rx="10" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
        <path d="M0 62 Q48 -14 96 62 Z" fill="#e5484d" stroke="#991b1b" stroke-width="2"/>${[[24, 42, 7], [52, 26, 8], [74, 46, 6], [46, 50, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join("")}
        <path d="M40 118 L40 90 Q48 80 56 90 L56 118 Z" fill="#92400e"/><circle cx="64" cy="76" r="6" fill="#93c5fd" stroke="#1d4ed8" stroke-width="1.5"/></g>`;
      case "rocket": return `<g transform="translate(280 92)"><path d="M36 0 Q66 30 60 112 L12 112 Q6 30 36 0 Z" fill="#e5e7eb" stroke="#6b7280" stroke-width="2"/>
        <circle cx="36" cy="48" r="11" fill="#60a5fa" stroke="#1d4ed8" stroke-width="3"/><path d="M12 84 L-6 120 L14 112 Z M60 84 L78 120 L58 112 Z" fill="#ef4444"/>
        <path d="M24 112 L36 140 L48 112 Z" fill="#f97316" class="flame"/><path d="M30 12 L42 12" stroke="#ef4444" stroke-width="5"/></g>`;
      default: return "";
    }
  }
  function toySVG(id) {
    switch (id) {
      case "yarn": return `<g transform="translate(252 258)"><circle r="13" fill="#f472b6"/><path d="M-10 -6 Q0 4 10 -8 M-12 2 Q0 12 12 0 M-6 10 Q2 -2 4 -12" stroke="#be185d" stroke-width="2" fill="none"/><path d="M12 6 Q30 18 44 8" stroke="#f472b6" stroke-width="2" fill="none"/></g>`;
      case "ball": return `<g transform="translate(256 258)"><circle r="12" fill="#fff" stroke="#1f2937" stroke-width="2"/><polygon points="0,-5 5,-1 3,5 -3,5 -5,-1" fill="#1f2937"/></g>`;
      case "mouse": return `<g transform="translate(256 262)"><ellipse rx="14" ry="8" fill="#9ca3af"/><circle cx="-12" cy="-6" r="5" fill="#d1d5db"/><circle cx="-15" cy="-1" r="1.5" fill="#1f2937"/><path d="M14 0 Q26 -8 30 4" stroke="#f9a8d4" stroke-width="2" fill="none"/></g>`;
      case "treasure": return `<g transform="translate(240 240)"><rect width="40" height="26" y="10" rx="3" fill="#92400e" stroke="#78350f" stroke-width="2"/><path d="M0 12 Q20 -6 40 12 Z" fill="#b45309" stroke="#78350f" stroke-width="2"/>
        <rect x="16" y="12" width="8" height="10" fill="#facc15"/><circle cx="8" cy="8" r="3" fill="#facc15"/><circle cx="32" cy="7" r="3" fill="#facc15"/>${star(20, 0, 4, "#fde047")}</g>`;
      default: return "";
    }
  }

  /** Raum-SVG. room = {placed:{spot:id}}, trophies = [{icon}], d = Datum */
  function roomSVG(room, trophies, d) {
    const p = (room && room.placed) || {}, part = dayPart(d), sea = season(d);
    const dark = part === "night" ? (p.lamp ? 0.22 : 0.38) : part === "evening" ? 0.12 : 0;
    return `<svg class="room-svg" viewBox="0 0 360 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${wallSVG(p.wall)}${floorSVG(p.floor)}<rect y="176" width="360" height="6" fill="rgba(0,0,0,.08)"/>
      ${windowSVG(part, sea)}${curtainSVG(p.curtain)}${pictureSVG(p.picture)}${trophySVG(trophies)}
      ${carpetSVG(p.carpet)}${leftSVG(p.left, part)}${rightSVG(p.right)}${toySVG(p.toy)}
      ${dark ? `<rect width="360" height="280" fill="#1e1b4b" opacity="${dark}"/>` : ""}
      ${lampSVG(p.lamp, part)}
    </svg>`;
  }

  window.Room = { SPOTS, ROOM_ITEMS, roomSVG, dayPart, season };
})();
