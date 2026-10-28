/** SVG-иллюстрации для «Армейский год в датах» — pct 0…100 или ddd 0…365 */
(function (global) {
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const t = (pct) => clamp(pct, 0, 100) / 100;

  function wrap(inner) {
    return `<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  /** Бутылка «путешествует»: холодильник → пол → дверь → стол (ddd 50→0) */
  function renderVodkaJourney(ddd) {
    const d = clamp(ddd, 0, 365);
    const stages = [
      { max: 365, min: 51, x: 72, y: 420, label: 'далеко' },
      { max: 50, min: 41, x: 72, y: 380, label: 'холодильник' },
      { max: 40, min: 31, x: 200, y: 520, label: 'паркет' },
      { max: 30, min: 21, x: 300, y: 460, label: 'у дверей' },
      { max: 20, min: 0, x: 220, y: 540, label: 'на столе' },
    ];
    let stage = stages[0];
    for (const s of stages) {
      if (d <= s.max && d >= s.min) {
        stage = s;
        break;
      }
    }
    const bx = stage.x;
    const by = stage.y;
    const fridgeOpen = d <= 50 && d > 40 ? 0.85 : d <= 40 ? 1 : 0.35;
    return wrap(`
      <defs>
        <linearGradient id="roomWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ede8d5"/>
          <stop offset="100%" stop-color="#d4c4a8"/>
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#roomWall)"/>
      <rect x="0" y="580" width="390" height="264" fill="#c9b896"/>
      <line x1="0" y1="580" x2="390" y2="580" stroke="#a79a8a" stroke-width="2" opacity="0.4"/>
      <!-- холодильник -->
      <rect x="40" y="320" width="88" height="200" rx="6" fill="#e8e0d4" stroke="#3e3630" stroke-width="2" opacity="0.9"/>
      <rect x="48" y="328" width="72" height="88" rx="4" fill="#c7d3db" opacity="${0.25 + fridgeOpen * 0.35}"/>
      <line x1="128" y1="400" x2="138" y2="400" stroke="#3e3630" stroke-width="3" opacity="${fridgeOpen}"/>
      <!-- дверь -->
      <rect x="280" y="300" width="70" height="280" rx="4" fill="#e8e0d4" stroke="#3e3630" stroke-width="2"/>
      <circle cx="338" cy="440" r="4" fill="#3e3630" opacity="0.5"/>
      <path d="M280 300 L350 300 L350 580 L280 580" fill="none" stroke="#a79a8a" stroke-width="1" opacity="0.3"/>
      <!-- стол -->
      <rect x="160" y="560" width="140" height="10" rx="2" fill="#3e3630" opacity="0.55"/>
      <line x1="180" y1="570" x2="180" y2="620" stroke="#3e3630" stroke-width="4" opacity="0.45"/>
      <line x1="280" y1="570" x2="280" y2="620" stroke="#3e3630" stroke-width="4" opacity="0.45"/>
      <!-- бутылка (стилизованно) -->
      <g transform="translate(${bx} ${by})">
        <rect x="-10" y="-28" width="20" height="32" rx="4" fill="#4a6741" opacity="0.85"/>
        <rect x="-6" y="-36" width="12" height="10" rx="2" fill="#3e3630" opacity="0.6"/>
        <rect x="-8" y="-8" width="16" height="6" fill="#fff" opacity="0.25"/>
      </g>
      <text x="24" y="720" fill="rgba(62,54,48,0.5)" font-size="11" font-family="Segoe UI,sans-serif">${stage.label} · ${d} ддд</text>
      <text x="24" y="740" fill="rgba(62,54,48,0.35)" font-size="10" font-family="Segoe UI,sans-serif">50 холод · 40 пол · 30 дверь · 20 стол</text>
    `);
  }

  /** Гуси летят к дому: pct службы 0…100 */
  function renderGeeseLebedi(pct) {
    const p = t(pct);
    const houseX = 300;
    const houseY = 520;
    const flockX = 60 + p * (houseX - 100);
    const flockY = 180 + p * 280;
    const birds = [0, 1, 2, 3].map((i) => {
      const ox = i * 28 - 42;
      const oy = (i % 2) * 12 - 6;
      return `<path d="M${flockX + ox} ${flockY + oy} q-18 -10 -32 0 q14 8 32 0 q-14 8 -32 0" fill="none" stroke="#3e3630" stroke-width="2.2" opacity="${0.45 + p * 0.45}"/>`;
    }).join('');
    return wrap(`
      <defs>
        <linearGradient id="gooseSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9eb8d4"/>
          <stop offset="55%" stop-color="#c7d3db"/>
          <stop offset="100%" stop-color="#ede8d5"/>
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#gooseSky)"/>
      <ellipse cx="195" cy="620" rx="160" ry="40" fill="#a79a8a" opacity="0.25"/>
      <!-- дом -->
      <rect x="${houseX - 40}" y="${houseY}" width="64" height="48" fill="#e8e0d4" stroke="#3e3630" stroke-width="2"/>
      <path d="M${houseX - 48} ${houseY} L${houseX - 8} ${houseY - 36} L${houseX + 32} ${houseY} Z" fill="#e53935" opacity="0.55"/>
      <rect x="${houseX - 18}" y="${houseY + 18}" width="20" height="30" fill="#3e3630" opacity="0.35"/>
      ${birds}
      <text x="20" y="800" fill="rgba(62,54,48,0.45)" font-size="11" font-family="Segoe UI,sans-serif">222 · гуси-лебедi · ${Math.round(p * 100)}% к дому</text>
    `);
  }

  /** Заборчик: секции зажигаются по мере приближения к дембелю (111 ддд → 0) */
  function renderZaborchik(ddd) {
    const d = clamp(ddd, 0, 111);
    const lit = Math.floor(((111 - d) / 111) * 12);
    let posts = '';
    for (let i = 0; i < 12; i++) {
      const x = 40 + i * 28;
      const on = i < lit;
      posts += `
        <line x1="${x}" y1="480" x2="${x}" y2="560" stroke="${on ? '#e53935' : '#a79a8a'}" stroke-width="3" opacity="${on ? 0.9 : 0.35}"/>
        <line x1="${x}" y1="500" x2="${x + 28}" y2="500" stroke="${on ? '#3e3630' : '#a79a8a'}" stroke-width="2" opacity="${on ? 0.7 : 0.25}"/>
      `;
    }
    const gateOpen = d <= 14 ? (14 - d) / 14 : 0;
    return wrap(`
      <rect width="390" height="844" fill="#ede8d5"/>
      <rect x="0" y="560" width="390" height="284" fill="#c9b896"/>
      <path d="M0 560 Q195 520 390 560" fill="#a79a8a" opacity="0.2"/>
      ${posts}
      <g transform="translate(320 480)">
        <line x1="0" y1="0" x2="0" y2="80" stroke="#3e3630" stroke-width="4"/>
        <line x1="0" y1="40" x2="${40 * gateOpen}" y2="${20 - gateOpen * 15}" stroke="#3e3630" stroke-width="3"/>
      </g>
      <text x="24" y="620" fill="rgba(62,54,48,0.5)" font-size="11" font-family="Segoe UI,sans-serif">${d} ддд · заборчик ${111 - d}/111</text>
      <text x="24" y="640" fill="rgba(62,54,48,0.35)" font-size="10" font-family="Segoe UI,sans-serif">111 малый · 111 большой (ддд)</text>
    `);
  }

  /** Светофор: ddd 3 / 2 / 1 */
  function renderSvetofor(ddd) {
    const d = clamp(ddd, 0, 3);
    const red = d >= 3 ? 1 : d === 0 ? 0.15 : 0.2;
    const yellow = d === 2 ? 1 : 0.15;
    const green = d === 1 ? 1 : d === 0 ? 1 : 0.15;
    return wrap(`
      <rect width="390" height="844" fill="#2a3544"/>
      <rect x="0" y="640" width="390" height="204" fill="#3e3630" opacity="0.35"/>
      <line x1="0" y1="640" x2="390" y2="640" stroke="#fff" stroke-width="4" opacity="0.15" stroke-dasharray="24 16"/>
      <!-- столб -->
      <rect x="168" y="200" width="54" height="200" rx="12" fill="#1a1a1a" opacity="0.85"/>
      <circle cx="195" cy="240" r="18" fill="#e53935" opacity="${red}"/>
      <circle cx="195" cy="290" r="18" fill="#f4c430" opacity="${yellow}"/>
      <circle cx="195" cy="340" r="18" fill="#43a047" opacity="${green}"/>
      <text x="195" y="440" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="13" font-family="Segoe UI,sans-serif">
        ${d === 3 ? 'Красный' : d === 2 ? 'Жёлтый' : d === 1 ? 'Зелёный' : 'Дембель'}
      </text>
      <text x="24" y="780" fill="rgba(255,255,255,0.35)" font-size="11" font-family="Segoe UI,sans-serif">3 · 2 · 1 ддд</text>
    `);
  }

  /** Космос → посадка: большой ddd = далеко в звёздах */
  function renderCosmosLand(ddd) {
    const d = clamp(ddd, 0, 350);
    const p = 1 - d / 350;
    const earthY = 200 + p * 420;
    const stars = Array.from({ length: 40 }, (_, i) => {
      const sx = (i * 97) % 390;
      const sy = (i * 53) % 500;
      const op = 0.2 + (1 - p) * 0.6;
      return `<circle cx="${sx}" cy="${sy}" r="${1 + (i % 3)}" fill="#fff" opacity="${op}"/>`;
    }).join('');
    return wrap(`
      <rect width="390" height="844" fill="#1a2230"/>
      ${stars}
      <circle cx="195" cy="${earthY}" r="${48 + p * 24}" fill="#4a7d96" opacity="0.85"/>
      <ellipse cx="195" cy="${earthY}" rx="70" ry="12" fill="rgba(199,211,219,0.25)"/>
      <g transform="translate(195 ${earthY - 80 - p * 40})" opacity="${0.4 + p * 0.5}">
        <ellipse cx="0" cy="0" rx="20" ry="5" fill="#e8e0d4"/>
        <path d="M-8 0 L8 0 L4 20 L-4 20 Z" fill="#e53935" opacity="0.6"/>
      </g>
      <text x="24" y="800" fill="rgba(255,255,255,0.4)" font-size="11" font-family="Segoe UI,sans-serif">${d} ддд · ${d > 200 ? 'космос' : d > 50 ? 'снижение' : 'посадка'}</text>
    `);
  }

  /** Матрёшки: до экватора маленькая, после — большая (dpp) */
  function renderMatryoshka(dpp) {
    const d = clamp(dpp, 0, 365);
    const big = d >= 182;
    const scale = big ? 1.35 : 0.75;
    const cx = 195;
    const cy = 420;
    const layers = big ? 4 : 3;
    let dolls = '';
    for (let i = 0; i < layers; i++) {
      const r = (layers - i) * 22 * scale;
      dolls += `<ellipse cx="${cx}" cy="${cy + i * 8}" rx="${r}" ry="${r * 1.15}" fill="${i % 2 ? '#e53935' : '#e8e0d4'}" opacity="${0.85 - i * 0.12}" stroke="#3e3630" stroke-width="1.5"/>`;
      dolls += `<ellipse cx="${cx}" cy="${cy + i * 8 - r * 0.9}" rx="${r * 0.55}" ry="${r * 0.35}" fill="#e8e0d4" opacity="0.9"/>`;
    }
    return wrap(`
      <rect width="390" height="844" fill="#fcf7df"/>
      <rect x="0" y="580" width="390" height="264" fill="#ede8d5"/>
      ${dolls}
      <text x="24" y="720" fill="rgba(62,54,48,0.5)" font-size="11" font-family="Segoe UI,sans-serif">${big ? 'Большие' : 'Малые'} матрёшки · ${d} дпп</text>
      <text x="24" y="740" fill="rgba(62,54,48,0.35)" font-size="10" font-family="Segoe UI,sans-serif">88 дпп / 88 ддд</text>
    `);
  }

  /** Дембельская пачка: 20 ячеек = 20 ддд */
  function renderDembelPack(ddd) {
    const d = clamp(ddd, 0, 20);
    const crossed = 20 - d;
    let cells = '';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const idx = row * 5 + col;
        const x = 115 + col * 32;
        const y = 360 + row * 28;
        const done = idx < crossed;
        cells += `<rect x="${x}" y="${y}" width="26" height="22" rx="3" fill="${done ? '#e53935' : '#e8e0d4'}" stroke="#3e3630" stroke-width="1" opacity="0.9"/>`;
        if (done) {
          cells += `<line x1="${x + 4}" y1="${y + 4}" x2="${x + 22}" y2="${y + 18}" stroke="#fff" stroke-width="2"/>`;
        }
      }
    }
    return wrap(`
      <rect width="390" height="844" fill="#d4cdc0"/>
      <rect x="95" y="320" width="200" height="140" rx="8" fill="#fff" stroke="#3e3630" stroke-width="2" opacity="0.9"/>
      ${cells}
      <text x="195" y="340" text-anchor="middle" fill="#3e3630" font-size="10" font-weight="600" font-family="Segoe UI,sans-serif">ПАЧКА</text>
      <text x="24" y="520" fill="rgba(62,54,48,0.5)" font-size="11" font-family="Segoe UI,sans-serif">${d} ддд · вычеркнуто ${crossed}/20</text>
    `);
  }

  const SCENES = {
    vodka: { title: 'Путь «водки»', hint: 'Бутылка: холодильник → пол → дверь → стол (50…20 ддд)', render: (v) => renderVodkaJourney(v.ddd) },
    geese: { title: 'Гуси-лебеди', hint: '% службы — стая летит к дому (222)', render: (v) => renderGeeseLebedi(v.pct) },
    fence: { title: 'Заборчик', hint: 'Секции загораются от 111 ддд к нулю', render: (v) => renderZaborchik(v.ddd) },
    traffic: { title: 'Светофор', hint: 'Фон для 3 · 2 · 1 ддд', render: (v) => renderSvetofor(v.ddd) },
    cosmos: { title: 'Космос → посадка', hint: '350…10 ддд — земля приближается', render: (v) => renderCosmosLand(v.ddd) },
    matryoshka: { title: 'Матрёшки', hint: 'До экватора малые, после — большие (88)', render: (v) => renderMatryoshka(v.dpp) },
    pack: { title: 'Дембельская пачка', hint: '20 клеток = 20 ддд', render: (v) => renderDembelPack(v.ddd) },
  };

  function valuesFromDpp(dpp) {
    const TOTAL = 365;
    const d = clamp(dpp, 0, TOTAL);
    return {
      dpp: d,
      ddd: TOTAL - d,
      pct: (d / TOTAL) * 100,
    };
  }

  global.ArmyIllustrations = { SCENES, valuesFromDpp, renderVodkaJourney, renderGeeseLebedi, renderZaborchik, renderSvetofor, renderCosmosLand, renderMatryoshka, renderDembelPack };
})(window);
