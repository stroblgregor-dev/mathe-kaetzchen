/* Anschauungsmaterial: Uhr, Geld, Zahlenstrahl, Zehnerstangen. */
(function () {
  "use strict";

  function clockSVG(h, m) {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 - 90) * Math.PI / 180;
      const big = i % 5 === 0;
      const r1 = big ? 80 : 85, r2 = 90;
      ticks.push(`<line x1="${(100 + r1 * Math.cos(a)).toFixed(1)}" y1="${(100 + r1 * Math.sin(a)).toFixed(1)}"
        x2="${(100 + r2 * Math.cos(a)).toFixed(1)}" y2="${(100 + r2 * Math.sin(a)).toFixed(1)}"
        stroke="#4a3f5c" stroke-width="${big ? 3.5 : 1.4}" stroke-linecap="round"/>`);
    }
    const nums = [];
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 - 90) * Math.PI / 180;
      nums.push(`<text x="${(100 + 66 * Math.cos(a)).toFixed(1)}" y="${(100 + 66 * Math.sin(a) + 7).toFixed(1)}"
        text-anchor="middle" font-size="20" font-weight="700" fill="#3b3150">${n}</text>`);
    }
    const ha = ((h % 12) + m / 60) * 30;
    const ma = m * 6;
    return `<svg class="vis-clock" viewBox="0 0 200 200" role="img" aria-label="Uhr">
      <circle cx="100" cy="100" r="96" fill="#fff" stroke="#f4a259" stroke-width="7"/>
      ${ticks.join("")}${nums.join("")}
      <line x1="100" y1="100" x2="100" y2="52" stroke="#3b3150" stroke-width="8" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>
      <line x1="100" y1="100" x2="100" y2="26" stroke="#ef476f" stroke-width="5" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>
      <circle cx="100" cy="100" r="7" fill="#3b3150"/></svg>`;
  }

  const NOTE_COLORS = { 500: "#9ca3af", 1000: "#f87171", 2000: "#60a5fa", 5000: "#fb923c" };

  function coinSVG(v) {
    if (v >= 500) {
      const col = NOTE_COLORS[v];
      return `<svg class="vis-note" viewBox="0 0 120 64"><rect x="2" y="2" width="116" height="60" rx="6" fill="${col}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
        <rect x="10" y="10" width="40" height="44" rx="4" fill="rgba(255,255,255,.35)"/>
        <text x="84" y="42" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">${v / 100} €</text></svg>`;
    }
    let outer, inner, label, size;
    if (v === 100) { outer = "#d9b04c"; inner = "#d4d7dc"; label = "1 €"; size = 46; }
    else if (v === 200) { outer = "#d4d7dc"; inner = "#d9b04c"; label = "2 €"; size = 50; }
    else if (v >= 10) { outer = inner = "#e2b84f"; label = v + " c"; size = 30 + (v === 50 ? 12 : v === 20 ? 8 : 4); }
    else { outer = inner = "#c8773d"; label = v + " c"; size = 26 + (v === 5 ? 8 : v === 2 ? 4 : 0); }
    return `<svg class="vis-coin" viewBox="0 0 60 60" style="width:${size + 8}px;height:${size + 8}px">
      <circle cx="30" cy="30" r="28" fill="${outer}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <circle cx="30" cy="30" r="${v >= 100 ? 19 : 23}" fill="${inner}" stroke="rgba(0,0,0,.12)"/>
      <text x="30" y="36" text-anchor="middle" font-size="${label.length > 3 ? 14 : 16}" font-weight="800" fill="#3b2a12">${label}</text></svg>`;
  }

  function moneyHTML(values) {
    const sorted = values.slice().sort((a, b) => b - a);
    return `<div class="vis-money">${sorted.map(coinSVG).join("")}</div>`;
  }

  function numberlineSVG(min, max, marker) {
    const span = max - min;
    const W = 320, x0 = 18, x1 = W - 18;
    const step = span <= 20 ? 1 : (span <= 50 ? 5 : 5);
    const labelEvery = span <= 10 ? 1 : (span <= 20 ? 5 : 10);
    const parts = [];
    for (let v = min; v <= max; v += step) {
      const x = x0 + (v - min) / span * (x1 - x0);
      const big = (v - min) % labelEvery === 0;
      const mid = span === 100 && (v - min) % 10 === 0;
      parts.push(`<line x1="${x.toFixed(1)}" y1="${big || mid ? 52 : 57}" x2="${x.toFixed(1)}" y2="${big || mid ? 76 : 71}" stroke="#4a3f5c" stroke-width="${big ? 2.6 : 1.4}"/>`);
      if (big && v !== marker) parts.push(`<text x="${x.toFixed(1)}" y="96" text-anchor="middle" font-size="15" font-weight="700" fill="#3b3150">${v}</text>`);
    }
    const mx = x0 + (marker - min) / span * (x1 - x0);
    return `<svg class="vis-line" viewBox="0 0 ${W} 104" role="img" aria-label="Zahlenstrahl">
      <line x1="${x0 - 6}" y1="64" x2="${x1 + 10}" y2="64" stroke="#4a3f5c" stroke-width="3"/>
      <polygon points="${x1 + 14},64 ${x1 + 4},58 ${x1 + 4},70" fill="#4a3f5c"/>
      ${parts.join("")}
      <g transform="translate(${mx.toFixed(1)} 0)"><path d="M0 48 L-10 30 L-4 30 L-4 8 L4 8 L4 30 L10 30 Z" fill="#ef476f"/>
      <text x="0" y="98" text-anchor="middle" font-size="18" font-weight="800" fill="#ef476f">?</text></g></svg>`;
  }

  function blocksSVG(tens, ones) {
    const u = 11;
    const parts = [];
    let x = 4;
    for (let t = 0; t < tens; t++) {
      for (let i = 0; i < 10; i++) parts.push(`<rect x="${x}" y="${4 + i * u}" width="${u}" height="${u}" fill="#60a5fa" stroke="#1d4ed8" stroke-width="1"/>`);
      x += u + 7;
    }
    x += 8;
    for (let o = 0; o < ones; o++) {
      const row = Math.floor(o / 5), col = o % 5;
      parts.push(`<rect x="${x + col * (u + 3)}" y="${4 + 10 * u - (row + 1) * (u + 3) + 3}" width="${u}" height="${u}" fill="#fbbf24" stroke="#b45309" stroke-width="1"/>`);
    }
    const width = x + Math.min(ones, 5) * (u + 3) + 4;
    return `<svg class="vis-blocks" viewBox="0 0 ${Math.max(width, 60)} ${10 * u + 8}" role="img" aria-label="Zehner und Einer">${parts.join("")}</svg>`;
  }

  window.Visuals = { clockSVG, moneyHTML, numberlineSVG, blocksSVG, coinSVG };
})();
