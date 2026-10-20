/** Сцены «вид войск» для HTML-прототипов. pct: 0…100 */
(function (global) {
  const clamp = (n) => Math.min(100, Math.max(0, n));
  const t = (pct) => clamp(pct) / 100;

  function sceneSvg(inner) {
    return `<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  function renderVMF(pct) {
    const p = t(pct);
    const surfaceY = 320;
    const bottomY = 780;
    const anchorY = surfaceY + 40 + p * (bottomY - surfaceY - 120);
    const chainLen = anchorY - surfaceY - 20;
    const bubbles = [0.2, 0.45, 0.7].map((k, i) => {
      const by = surfaceY + 80 + p * 400 * k + i * 30;
      const op = 0.15 + p * 0.35;
      return `<circle cx="${120 + i * 90}" cy="${by}" r="${4 + i * 2}" fill="rgba(255,255,255,${op})"/>`;
    }).join('');
    return sceneSvg(`
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8eb4c9"/>
          <stop offset="35%" stop-color="#4a7d96"/>
          <stop offset="100%" stop-color="#2a4a5e"/>
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#sea)"/>
      <path d="M0 ${surfaceY} Q97 ${surfaceY - 8} 195 ${surfaceY} T390 ${surfaceY} L390 0 L0 0 Z" fill="rgba(199,211,219,0.55)"/>
      <line x1="195" y1="${surfaceY - 30}" x2="195" y2="${surfaceY + chainLen}" stroke="rgba(62,54,48,0.45)" stroke-width="2"/>
      <path d="M175 ${anchorY} L195 ${anchorY + 28} L215 ${anchorY} L205 ${anchorY + 8} L185 ${anchorY + 8} Z" fill="#3e3630" opacity="0.85"/>
      ${bubbles}
      <text x="24" y="${surfaceY + 24}" fill="rgba(255,255,255,0.5)" font-size="11" font-family="Segoe UI,sans-serif">поверхность</text>
      <text x="24" y="${bottomY - 8}" fill="rgba(255,255,255,0.35)" font-size="11" font-family="Segoe UI,sans-serif">дно · дембель</text>
    `);
  }

  function renderVKS(pct, variant) {
    const p = t(pct);
    const sky = variant === 'assault' ? '#b8c9d8' : '#c7d3db';
    const planeY = 680 - p * 520;
    const cloudY = p * 120;
    const isRocket = variant === 'fighter';
    const body = isRocket
      ? `<path transform="translate(195 ${planeY}) rotate(-78)" d="M0 -24 L8 18 L0 12 L-8 18 Z" fill="#3e3630" opacity="0.75"/>`
      : `<g transform="translate(195 ${planeY})">
          <ellipse cx="0" cy="0" rx="28" ry="6" fill="#3e3630" opacity="0.7"/>
          <path d="M-32 0 L-8 -4 L12 -2 L28 0 L12 2 L-8 4 Z" fill="#3e3630" opacity="0.8"/>
        </g>`;
    const clouds = [0, 1, 2].map((i) =>
      `<ellipse cx="${80 + i * 120}" cy="${400 + cloudY + i * 40}" rx="56" ry="18" fill="rgba(255,255,255,${0.35 + i * 0.08})"/>`
    ).join('');
    return sceneSvg(`
      <rect width="390" height="844" fill="${sky}"/>
      <rect y="720" width="390" height="124" fill="#a79a8a" opacity="0.35"/>
      <line x1="0" y1="720" x2="390" y2="720" stroke="#3e3630" stroke-width="2" opacity="0.2"/>
      ${clouds}
      ${body}
      <circle cx="320" cy="${80 + p * 40}" r="36" fill="rgba(255,220,160,0.45)"/>
      <text x="20" y="800" fill="rgba(62,54,48,0.45)" font-size="11">0% — призыв</text>
      <text x="20" y="818" fill="rgba(62,54,48,0.45)" font-size="11">100% — дембель · вершина</text>
    `);
  }

  function renderSV(pct) {
    const p = t(pct);
    const roadW = 280 * p;
    let steps = '';
    for (let i = 0; i < Math.floor(p * 14); i++) {
      const x = 55 + i * 18;
      steps += `<ellipse cx="${x}" cy="620" rx="5" ry="3" fill="rgba(62,54,48,0.2)" transform="rotate(-15 ${x} 620)"/>`;
    }
    return sceneSvg(`
      <rect width="390" height="844" fill="#d4c4a8"/>
      <rect x="40" y="560" width="310" height="80" rx="8" fill="#c9b896"/>
      <rect x="55" y="595" width="${roadW}" height="12" rx="4" fill="#a79a8a" opacity="0.5"/>
      ${steps}
      <g transform="translate(${120 + p * 160} 540)" opacity="0.65">
        <circle cx="0" cy="0" r="10" fill="#3e3630"/>
        <rect x="-6" y="8" width="12" height="28" rx="3" fill="#3e3630"/>
      </g>
      <line x1="40" y1="560" x2="350" y2="520" stroke="rgba(62,54,48,0.12)" stroke-width="2"/>
    `);
  }

  function renderRVSN(pct) {
    const p = t(pct);
    const hatch = 520 - p * 200;
    return sceneSvg(`
      <rect width="390" height="844" fill="#1a2230"/>
      <rect x="145" y="480" width="100" height="280" fill="#2a3544"/>
      <rect x="155" y="${hatch}" width="80" height="12" fill="#4a5568"/>
      <rect x="168" y="${hatch - 180 * p}" width="54" height="${180 * p + 20}" rx="4" fill="#5a6578"/>
      <ellipse cx="195" cy="${hatch - 180 * p - 8}" rx="18" ry="8" fill="#c7d3db" opacity="${0.3 + p * 0.7}"/>
      <circle cx="195" cy="200" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="280" cy="140" r="1" fill="#fff" opacity="0.6"/>
      <circle cx="90" cy="260" r="1" fill="#fff" opacity="0.5"/>
    `);
  }

  function renderVDV(pct) {
    const p = t(pct);
    const chuteY = 120 + p * 480;
    return sceneSvg(`
      <defs><linearGradient id="vdvSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9eb8d4"/><stop offset="100%" stop-color="#ede8d5"/></linearGradient></defs>
      <rect width="390" height="844" fill="url(#vdvSky)"/>
      <ellipse cx="195" cy="680" rx="140" ry="24" fill="#a79a8a" opacity="0.35"/>
      <line x1="195" y1="${chuteY}" x2="195" y2="${chuteY + 50}" stroke="#3e3630" stroke-width="2" opacity="0.5"/>
      <path d="M195 ${chuteY} Q120 ${chuteY - 40} 130 ${chuteY - 90} Q195 ${chuteY - 110} 260 ${chuteY - 90} Q280 ${chuteY - 40} 195 ${chuteY}" fill="rgba(229,57,53,0.35)" stroke="rgba(229,57,53,0.5)"/>
      <circle cx="195" cy="${chuteY + 58}" r="8" fill="#3e3630" opacity="0.6"/>
    `);
  }

  function renderRosgvardia(pct) {
    const p = t(pct);
    const fillH = 220 * p;
    return sceneSvg(`
      <rect width="390" height="844" fill="#ede8d5"/>
      <path d="M120 640 L195 480 L270 640 Z" fill="none" stroke="rgba(62,54,48,0.25)" stroke-width="3"/>
      <clipPath id="shieldClip"><path d="M120 640 L195 480 L270 640 Z"/></clipPath>
      <rect x="100" y="${640 - fillH}" width="190" height="${fillH}" fill="rgba(229,57,53,0.35)" clip-path="url(#shieldClip)"/>
      <polygon points="195,520 200,535 216,535 204,545 209,560 195,550 181,560 186,545 174,535 190,535" fill="#3e3630" opacity="${0.3 + p * 0.6}"/>
    `);
  }

  function renderFSB(pct) {
    const p = t(pct);
    const lit = Math.floor(p * 8);
    let posts = '';
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 40;
      const on = i < lit;
      posts += `<rect x="${x}" y="580" width="6" height="80" fill="${on ? '#3e3630' : 'rgba(62,54,48,0.2)'}"/>
        <rect x="${x - 8}" y="${on ? 560 : 600}" width="22" height="4" fill="${on ? '#e53935' : 'rgba(167,154,138,0.4)'}"/>`;
    }
    const gate = p > 0.95 ? 90 : 0;
    return sceneSvg(`
      <rect width="390" height="844" fill="#c7d3db"/>
      <line x1="40" y1="660" x2="350" y2="660" stroke="rgba(62,54,48,0.25)" stroke-width="2"/>
      ${posts}
      <rect x="175" y="${580 - gate}" width="40" height="8" fill="#3e3630" opacity="0.7" transform="rotate(${-gate * 0.8} 175 584)"/>
    `);
  }

  function renderSignal(pct) {
    const p = t(pct);
    const waves = 3 + Math.floor(p * 4);
    let arcs = '';
    for (let i = 0; i < waves; i++) {
      const r = 40 + i * 28;
      arcs += `<path d="M195 ${520 - r} A ${r} ${r} 0 0 1 ${195 + r} ${520}" fill="none" stroke="rgba(229,57,53,${0.25 + p * 0.5})" stroke-width="3"/>`;
    }
    const pulseX = 195 + Math.sin(p * 20) * 80;
    return sceneSvg(`
      <rect width="390" height="844" fill="#ede8d5"/>
      <line x1="195" y1="520" x2="195" y2="720" stroke="rgba(62,54,48,0.35)" stroke-width="3"/>
      <line x1="195" y1="520" x2="160" y2="480" stroke="rgba(62,54,48,0.35)" stroke-width="3"/>
      <line x1="195" y1="520" x2="230" y2="480" stroke="rgba(62,54,48,0.35)" stroke-width="3"/>
      ${arcs}
      <circle cx="${pulseX}" cy="650" r="6" fill="#e53935" opacity="${0.4 + p * 0.6}"/>
      <rect x="170" y="700" width="50" height="8" rx="2" fill="rgba(62,54,48,0.15)"/>
      <rect x="170" y="700" width="${50 * p}" height="8" rx="2" fill="#4caf50" opacity="0.7"/>
    `);
  }

  function renderGenericBar(pct, label, color) {
    const p = t(pct);
    return sceneSvg(`
      <rect width="390" height="844" fill="#ede8d5"/>
      <text x="195" y="400" text-anchor="middle" fill="#a79a8a" font-size="13">${label}</text>
      <rect x="80" y="620" width="230" height="16" rx="8" fill="rgba(167,154,138,0.3)"/>
      <rect x="80" y="620" width="${230 * p}" height="16" rx="8" fill="${color}"/>
    `);
  }

  function renderEngineers(pct) {
    const p = t(pct);
    const span = 140 * p;
    return sceneSvg(`
      <rect width="390" height="844" fill="#c7d3db"/>
      <rect x="0" y="640" width="120" height="120" fill="#8a9a6a"/>
      <rect x="270" y="640" width="120" height="120" fill="#8a9a6a"/>
      <rect x="40" y="600" width="80" height="80" fill="#2a4a5e" opacity="0.3"/>
      <rect x="270" y="600" width="80" height="80" fill="#2a4a5e" opacity="0.3"/>
      <rect x="120" y="668" width="${span}" height="10" fill="#3e3630" opacity="0.6"/>
      ${p >= 1 ? '<text x="195" y="580" text-anchor="middle" fill="#3e3630" font-size="12">мост · дембель</text>' : ''}
    `);
  }

  function renderRadar(pct, fullSweep) {
    const p = t(pct);
    const angle = fullSweep ? p * 360 : p * 180;
    const rings = 2 + Math.floor(p * 5);
    let rs = '';
    for (let i = 1; i <= rings; i++) {
      rs += `<circle cx="195" cy="620" r="${20 + i * 22}" fill="none" stroke="rgba(62,54,48,${0.08 + i * 0.04})" stroke-width="1"/>`;
    }
    return sceneSvg(`
      <rect width="390" height="844" fill="#1a2230"/>
      ${rs}
      <line x1="195" y1="620" x2="195" y2="480" stroke="rgba(229,57,53,0.7)" stroke-width="2" transform="rotate(${angle} 195 620)"/>
      <ellipse cx="195" cy="620" rx="48" ry="16" fill="#3e3630" opacity="0.5"/>
    `);
  }

  function renderREB(pct) {
    const p = t(pct);
    let path = 'M40 640';
    for (let x = 40; x <= 350; x += 8) {
      const noise = Math.sin(x * 0.73) * 18 + Math.cos(x * 0.31) * 12;
      const y = 640 + (1 - p) * noise + p * Math.sin(x / 20) * 12;
      path += ` L${x} ${y}`;
    }
    return sceneSvg(`
      <rect width="390" height="844" fill="#2a2830"/>
      <path d="${path}" fill="none" stroke="${p > 0.85 ? '#4caf50' : '#e53935'}" stroke-width="2"/>
    `);
  }

  function renderSub(pct) {
    const p = t(pct);
    const depth = 200 + p * 350;
    return sceneSvg(`
      <rect width="390" height="844" fill="#2a4a5e"/>
      <rect x="170" y="480" width="50" height="${depth}" fill="rgba(199,211,219,0.15)" stroke="rgba(255,255,255,0.2)"/>
      <rect x="178" y="490" width="34" height="24" rx="4" fill="#3e3630" opacity="0.8"/>
      <line x1="220" y1="500" x2="260" y2="${490 + depth * 0.7}" stroke="#e53935" stroke-width="2"/>
      <text x="268" y="${500 + depth * 0.7}" fill="rgba(255,255,255,0.5)" font-size="10">${Math.round(p * 100)}%</text>
    `);
  }

  function renderArcShot(pct) {
    const p = t(pct);
    const cx = 80 + p * 230;
    const cy = 640 - Math.sin(p * Math.PI) * 180;
    return sceneSvg(`
      <rect width="390" height="844" fill="#ede8d5"/>
      <path d="M80 640 Q195 420 310 640" fill="none" stroke="rgba(167,154,138,0.4)" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="${cx}" cy="${cy}" r="8" fill="#e53935"/>
      <circle cx="310" cy="640" r="24" fill="none" stroke="#3e3630" stroke-width="2" opacity="${0.3 + p * 0.7}"/>
    `);
  }

  function renderAuto(pct) {
    const p = t(pct);
    const x = 60 + p * 260;
    return sceneSvg(`
      <rect width="390" height="844" fill="#d4c4a8"/>
      <rect x="40" y="640" width="310" height="8" fill="rgba(62,54,48,0.15)"/>
      <g transform="translate(${x} 610)">
        <rect x="-22" y="0" width="44" height="22" rx="4" fill="#3e3630" opacity="0.7"/>
        <circle cx="-12" cy="26" r="8" fill="#3e3630" opacity="0.5"/>
        <circle cx="12" cy="26" r="8" fill="#3e3630" opacity="0.5"/>
      </g>
      <line x1="${60 + 260 * p}" y1="600" x2="${60 + 260 * p}" y2="680" stroke="#e53935" stroke-width="2" opacity="${p > 0.92 ? 1 : 0}"/>
    `);
  }

  function renderRail(pct) {
    const p = t(pct);
    let ties = '';
    for (let i = 0; i < Math.floor(p * 12); i++) {
      ties += `<rect x="${100 + i * 22}" y="652" width="14" height="6" fill="#3e3630" opacity="0.35"/>`;
    }
    return sceneSvg(`
      <rect width="390" height="844" fill="#c7d3db"/>
      <line x1="80" y1="640" x2="350" y2="580" stroke="#3e3630" stroke-width="3" opacity="0.4"/>
      <line x1="80" y1="660" x2="350" y2="600" stroke="#3e3630" stroke-width="3" opacity="0.4"/>
      ${ties}
      <text x="300" y="560" fill="#3e3630" font-size="11" opacity="${p > 0.9 ? 1 : 0}">Дембель</text>
    `);
  }

  function renderMed(pct) {
    const p = t(pct);
    let path = 'M60 640';
    for (let x = 60; x <= 330; x += 6) {
      const chaos = (1 - p) * (Math.sin(x * 0.5) * 25 + Math.cos(x * 0.17) * 15);
      const calm = p * Math.sin(x / 30) * 6;
      path += ` L${x} ${640 + chaos + calm}`;
    }
    return sceneSvg(`
      <rect width="390" height="844" fill="#fcf7df"/>
      <rect x="165" y="480" width="60" height="12" fill="#e53935" opacity="${0.4 + p * 0.6}"/>
      <rect x="188" y="457" width="14" height="58" fill="#e53935" opacity="${0.4 + p * 0.6}"/>
      <path d="${path}" fill="none" stroke="#3e3630" stroke-width="2"/>
    `);
  }

  function renderSpace(pct) {
    const p = t(pct);
    const angle = p * 270;
    const rad = (angle - 90) * Math.PI / 180;
    const sx = 195 + 120 * Math.cos(rad);
    const sy = 420 + 120 * Math.sin(rad);
    return sceneSvg(`
      <rect width="390" height="844" fill="#0f1520"/>
      <circle cx="195" cy="420" r="80" fill="#4a7d96" opacity="0.6"/>
      <circle cx="195" cy="420" r="110" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4 6"/>
      <rect x="${sx - 8}" y="${sy - 4}" width="16" height="8" rx="2" fill="#c7d3db" transform="rotate(${angle} ${sx} ${sy})"/>
    `);
  }

  const RENDERERS = {
    'branch-vmf': renderVMF,
    'branch-vks': (pct) => renderVKS(pct, 'default'),
    'branch-sv': renderSV,
    'branch-rvsn': renderRVSN,
    'branch-vdv': renderVDV,
    'branch-rosgvardia': renderRosgvardia,
    'branch-fsb-border': renderFSB,
    'arm-msv': (pct) => renderEngineers(pct),
    'arm-tanks': (pct) => renderGenericBar(pct, 'гусеница = кольцо таймера', '#3e3630'),
    'arm-rvia': renderArcShot,
    'arm-zrv': renderArcShot,
    'arm-pvo-sv': (pct) => renderRadar(pct, true),
    'arm-mp': renderAuto,
    'arm-sub': renderSub,
    'arm-sso': (pct) => {
      const p = t(pct);
      const sx = 60 + p * 270;
      return sceneSvg(`
        <rect width="390" height="844" fill="#1a2230"/>
        <line x1="0" y1="680" x2="390" y2="680" stroke="rgba(255,255,255,0.15)"/>
        <circle cx="${sx}" cy="660" r="4" fill="#fff" opacity="0.9"/>
      `);
    },
    'spec-signal': renderSignal,
    'spec-rtv': (pct) => renderRadar(pct, false),
    'spec-reb': renderREB,
    'spec-engineers': renderEngineers,
    'spec-rhbz': (pct) => {
      const p = t(pct);
      const r = 40 + p * 100;
      return sceneSvg(`
        <rect width="390" height="844" fill="#ede8d5"/>
        <path d="M195 ${620 + r} Q195 ${620 - r} ${195 + r} ${620} Q195 ${620 + r} ${195 - r} ${620} Q195 ${620 - r} 195 ${620 + r}" fill="none" stroke="rgba(76,175,80,${0.2 + p * 0.6})" stroke-width="3"/>
      `);
    },
    'spec-auto': renderAuto,
    'spec-rail': renderRail,
    'spec-topo': (pct) => {
      const p = t(pct);
      const step = 24;
      let g = '';
      for (let x = 0; x < 390; x += step) {
        for (let y = 480; y < 760; y += step) {
          g += `<line x1="${x}" y1="${y}" x2="${x + step}" y2="${y}" stroke="rgba(62,54,48,${0.05 + p * 0.15})"/>`;
        }
      }
      return sceneSvg(`<rect width="390" height="844" fill="#f5ecd8"/>${g}
        <circle cx="280" cy="560" r="6" fill="#e53935" opacity="${p}"/>`);
    },
    'spec-mto': (pct) => {
      const p = t(pct);
      const n = Math.floor(p * 6);
      let boxes = '';
      for (let i = 0; i < n; i++) {
        boxes += `<rect x="${150 + (i % 3) * 36}" y="${680 - Math.floor(i / 3) * 28}" width="30" height="22" fill="#a79a8a" opacity="0.6"/>`;
      }
      return sceneSvg(`<rect width="390" height="844" fill="#ede8d5"/>${boxes}`);
    },
    'spec-med': renderMed,
    'spec-vp': (pct) => renderGenericBar(pct, 'нарукавная повязка', '#3e3630'),
    'vks-fighter': (pct) => renderVKS(pct, 'fighter'),
    'vks-assault': (pct) => renderVKS(pct, 'assault'),
    'vks-transport': (pct) => renderVKS(pct, 'default'),
    'vks-uav': (pct) => {
      const p = t(pct);
      let d = 'M60 640';
      for (let i = 0; i <= 20; i++) {
        d += ` L${60 + i * 14} ${640 - Math.sin(i * 0.8 + p * 3) * 30 - p * 80}`;
      }
      return sceneSvg(`<rect width="390" height="844" fill="#c7d3db"/><path d="${d}" fill="none" stroke="#3e3630" stroke-width="2"/>
        <circle cx="${60 + 20 * 14}" cy="${640 - Math.sin(20 * 0.8 + p * 3) * 30 - p * 80}" r="5" fill="#e53935"/>`);
    },
    'vks-space': renderSpace,
  };

  const BRANCH_META = {
    'branch-vmf': { title: 'ВМФ', group: 'Виды ВС', hint: 'Якорь опускается к дну; 100% — касание дна (дембель).' },
    'branch-vks': { title: 'ВКС', group: 'Виды ВС', hint: 'Самолёт набирает высоту; вершина — дембель.' },
    'branch-sv': { title: 'Сухопутные войска', group: 'Виды ВС', hint: 'Следы и маршрут на грунтовке.' },
    'branch-rvsn': { title: 'РВСН', group: 'Виды ВС', hint: 'Ракета поднимается из шахты.' },
    'branch-vdv': { title: 'ВДВ', group: 'Виды ВС', hint: 'Парашют снижается к плацу.' },
    'branch-rosgvardia': { title: 'Росгвардия', group: 'Вне Минобороны', hint: 'Щит заполняется снизу вверх.' },
    'branch-fsb-border': { title: 'Пограничники', group: 'Вне Минобороны', hint: 'Секции забора зажигаются по порядку.' },
    'arm-msv': { title: 'МСВ', group: 'Боевые рода', hint: 'Бруствер / мост (упрощённо).' },
    'arm-tanks': { title: 'Танковые войска', group: 'Боевые рода', hint: 'Основной прогресс — сегментное кольцо (гусеница).' },
    'arm-rvia': { title: 'РВиА', group: 'Боевые рода', hint: 'Точка по баллистической дуге.' },
    'arm-zrv': { title: 'ЗРВ', group: 'Боевые рода', hint: 'Дуга перехвата (как РВиА).' },
    'arm-pvo-sv': { title: 'ПВО СВ', group: 'Боевые рода', hint: 'Луч РЛС — полный оборот к дембелю.' },
    'arm-mp': { title: 'Морская пехота', group: 'Боевые рода', hint: 'Катер к причалу.' },
    'arm-sub': { title: 'Подводники', group: 'Боевые рода', hint: 'Шкала глубины.' },
    'arm-sso': { title: 'ССО', group: 'Боевые рода', hint: 'Звезда по горизонту.' },
    'spec-signal': { title: 'Войска связи', group: 'Спецвойска', hint: 'Волны от антенны, индикатор «связь с домом».' },
    'spec-rtv': { title: 'РТВ', group: 'Спецвойска', hint: 'Кольца РЛС и луч.' },
    'spec-reb': { title: 'РЭБ', group: 'Спецвойска', hint: 'Помехи → чистая синусоида.' },
    'spec-engineers': { title: 'Инженерные', group: 'Спецвойска', hint: 'Мост наращивается между берегами.' },
    'spec-rhbz': { title: 'РХБЗ', group: 'Спецвойска', hint: 'Купол защиты растёт.' },
    'spec-auto': { title: 'Автомобильные', group: 'Спецвойска', hint: 'Грузовик по полосе к финишу.' },
    'spec-rail': { title: 'Ж/д войска', group: 'Спецвойска', hint: 'Шпалы появляются впереди.' },
    'spec-topo': { title: 'Топографические', group: 'Спецвойска', hint: 'Сетка координат проявляется.' },
    'spec-mto': { title: 'МТО / тыл', group: 'Спецвойска', hint: 'Стопка ящиков растёт.' },
    'spec-med': { title: 'Медслужба', group: 'Спецвойска', hint: 'Пульс стабилизируется.' },
    'spec-vp': { title: 'Военная полиция', group: 'Спецвойска', hint: 'Полоса на повязке.' },
    'vks-fighter': { title: 'Истребительная авиация', group: 'ВКС · уточнения', hint: 'Ракета/истребитель — крутой набор.' },
    'vks-assault': { title: 'Штурмовая авиация', group: 'ВКС · уточнения', hint: 'Низкая высота, диагональ.' },
    'vks-transport': { title: 'Транспортная авиация', group: 'ВКС · уточнения', hint: 'Как базовый ВКС, медленный подъём.' },
    'vks-uav': { title: 'БпЛА', group: 'ВКС · уточнения', hint: 'Змейка траектории на карте.' },
    'vks-space': { title: 'Космические подразделения', group: 'ВКС · уточнения', hint: 'Спутник по орбите (кольцо = орбита).' },
  };

  function renderBranchScene(id, pct, container) {
    const fn = RENDERERS[id];
    if (!fn || !container) return;
    container.innerHTML = fn(pct);
  }

  global.BranchScenes = {
    RENDERERS,
    BRANCH_META,
    renderBranchScene,
    defaultId: 'branch-vmf',
  };
})(window);
