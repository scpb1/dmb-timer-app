(function () {
  const ACCENT = '#E53935';
  const CREAM = '#F2F0EC';
  const FILLED = 21;

  function segmentPath(cx, cy, innerR, outerR, startDeg, endDeg) {
    const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
    const sr = toRad(startDeg);
    const er = toRad(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const ix1 = cx + innerR * Math.cos(sr);
    const iy1 = cy + innerR * Math.sin(sr);
    const ox1 = cx + outerR * Math.cos(sr);
    const oy1 = cy + outerR * Math.sin(sr);
    const ox2 = cx + outerR * Math.cos(er);
    const oy2 = cy + outerR * Math.sin(er);
    const ix2 = cx + innerR * Math.cos(er);
    const iy2 = cy + innerR * Math.sin(er);
    return `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
  }

  function drawRing(svg, emptyFill, accent, count, filled) {
    const size = 88;
    const thickness = 12;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 2;
    const innerR = outerR - thickness;
    const step = 360 / count;
    const span = step - 1.2;
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const center = i * step + step / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', segmentPath(cx, cy, innerR, outerR, center - span / 2, center + span / 2));
      path.setAttribute('fill', i < filled ? accent : emptyFill);
      svg.appendChild(path);
    }
  }

  function drawLinear(container, emptyFill, accent, count, filled, borderEmpty) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const on = i < filled;
      const seg = document.createElement('div');
      seg.className = 'seg' + (on ? ' on' : '');
      seg.style.background = on ? accent : emptyFill;
      if (!on && borderEmpty) {
        seg.style.background = 'transparent';
        seg.style.border = `1px solid ${borderEmpty}`;
        seg.style.boxSizing = 'border-box';
      }
      container.appendChild(seg);
    }
  }

  function drawDots(container, emptyFill, emptyBorder, accent, total, passed) {
    container.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const on = i < passed;
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = on ? accent : emptyFill;
      dot.style.borderColor = on ? accent : emptyBorder || emptyFill;
      container.appendChild(dot);
    }
  }

  function drawTrack(el, emptyFill, accent) {
    el.style.background = emptyFill;
    const fill = el.querySelector('.fill');
    if (fill) fill.style.background = accent;
  }

  function drawSpine(el, emptyFill, accent) {
    el.style.background = emptyFill;
    const fill = el.querySelector('.fill');
    if (fill) fill.style.background = accent;
  }

  window.UNPASSED_VARIANTS_THEME = [
    {
      id: 'U01',
      name: 'Акцент 50 %',
      desc: 'Тот же красный, половинная непрозрачность. Ярко, контрастно.',
      fill: 'rgba(229, 57, 53, 0.5)',
      border: 'rgba(229, 57, 53, 0.5)',
      photo: { fill: 'rgba(242, 240, 236, 0.5)', border: 'rgba(242, 240, 236, 0.5)' },
    },
    {
      id: 'U02',
      name: 'Акцент 20 %',
      desc: 'Красный «приглушённый» — хорошо читается фон, виден hue.',
      fill: 'rgba(229, 57, 53, 0.2)',
      border: 'rgba(229, 57, 53, 0.2)',
      photo: { fill: 'rgba(242, 240, 236, 0.22)', border: 'rgba(242, 240, 236, 0.38)' },
    },
    {
      id: 'U03',
      name: 'Акцент 10 %',
      desc: 'Сейчас в коде. Еле заметный красный на градиенте.',
      fill: 'rgba(229, 57, 53, 0.1)',
      border: 'rgba(229, 57, 53, 0.1)',
      photo: { fill: 'rgba(242, 240, 236, 0.15)', border: 'rgba(242, 240, 236, 0.38)' },
    },
    {
      id: 'U04',
      name: 'Фон плашки',
      desc: 'Как карточка «прошло | осталось»: fill + серая рамка у точек.',
      fill: 'rgba(255, 255, 255, 0.48)',
      border: 'rgba(167, 154, 138, 0.35)',
      photo: { fill: 'transparent', border: 'rgba(242, 240, 236, 0.38)' },
    },
    {
      id: 'U05',
      name: 'Серый трек (как в приложении)',
      desc: 'secondary @ 28 % на светлой теме — как раньше, но без контура у точек.',
      fill: 'rgba(167, 154, 138, 0.11)',
      border: 'rgba(167, 154, 138, 0.11)',
      photo: { fill: 'rgba(242, 240, 236, 0.22)', border: 'rgba(242, 240, 236, 0.22)' },
    },
    {
      id: 'U08',
      name: 'Плашка + контур',
      desc: 'Белая заливка как плашка, рамка overlay.border.',
      fill: 'rgba(255, 255, 255, 0.48)',
      border: 'rgba(167, 154, 138, 0.35)',
      photo: { fill: 'rgba(242, 240, 236, 0.12)', border: 'rgba(242, 240, 236, 0.38)' },
    },
    {
      id: 'U09',
      name: 'Заливка 15 % + рамка 40 %',
      desc: 'Компромисс: слегка залито и виден контур.',
      fill: 'rgba(229, 57, 53, 0.15)',
      border: 'rgba(229, 57, 53, 0.4)',
      photo: { fill: 'rgba(242, 240, 236, 0.18)', border: 'rgba(242, 240, 236, 0.5)' },
    },
    {
      id: 'U10',
      name: 'Overlay muted',
      desc: 'theme.overlay.muted — сплошной «пыльный» серо-коричневый.',
      fill: 'rgba(167, 154, 138, 0.35)',
      border: 'rgba(167, 154, 138, 0.35)',
      photo: { fill: 'rgba(242, 240, 236, 0.25)', border: 'rgba(242, 240, 236, 0.4)' },
    },
    {
      id: 'U11',
      name: 'Белый 30 %',
      desc: 'Мягче плашки, без явной серой рамки на полоске.',
      fill: 'rgba(255, 255, 255, 0.3)',
      border: 'rgba(167, 154, 138, 0.28)',
      photo: { fill: 'rgba(255, 255, 255, 0.12)', border: 'rgba(242, 240, 236, 0.35)' },
    },
    {
      id: 'U12',
      name: 'Фон mid-темы',
      desc: 'Как второй стоп градиента #EDE8D5 — сливается с фоном.',
      fill: 'rgba(237, 232, 213, 0.9)',
      border: 'rgba(167, 154, 138, 0.22)',
      photo: { fill: 'rgba(0, 0, 0, 0.25)', border: 'rgba(242, 240, 236, 0.3)' },
    },
  ];

  function mountVariant(card, variant, mode) {
    const palette = mode === 'photo' ? variant.photo : variant;
    const accent = mode === 'photo' ? CREAM : ACCENT;
    const fill = palette.fill;
    const border = palette.border || palette.fill;
    const linearBorder = variant.linearBorderOnly ? border : null;

    const ring = card.querySelector('[data-ring]');
    const linear = card.querySelector('[data-linear]');
    const dots = card.querySelector('[data-dots]');
    const track = card.querySelector('[data-track]');
    const spine = card.querySelector('[data-spine]');

    if (ring) drawRing(ring, fill, accent, 36, Math.round((36 * FILLED) / 100));
    if (linear) drawLinear(linear, fill, accent, 24, Math.round((24 * FILLED) / 100), linearBorder);
    if (dots) drawDots(dots, fill, border, accent, 14, 3);
    if (track) drawTrack(track, fill, accent);
    if (spine) drawSpine(spine, fill, accent);
  }

  function buildCard(variant) {
    const el = document.createElement('article');
    el.className = 'variant';
    el.dataset.id = variant.id;
    el.innerHTML = `
      <div class="code">${variant.id}</div>
      <h3 class="name">${variant.name}</h3>
      <p class="desc">${variant.desc}</p>
      <div class="previews">
        <div class="preview-row"><span class="lbl">кольцо</span><div class="slot"><svg class="preview-ring" data-ring></svg></div></div>
        <div class="preview-row"><span class="lbl">лента</span><div class="slot"><div class="preview-linear" data-linear></div></div></div>
        <div class="preview-row"><span class="lbl">точки</span><div class="slot"><div class="preview-dots" data-dots></div></div></div>
        <div class="preview-row"><span class="lbl">трек</span><div class="slot"><div class="preview-track" data-track><span class="fill"></span></div></div></div>
        <div class="preview-row"><span class="lbl">ось</span><div class="slot"><div class="preview-spine" data-spine><span class="fill"></span></div></div></div>
      </div>
      <div class="photo-strip">
        <div class="lbl-photo">на фото-фоне</div>
        <div class="preview-row"><span class="lbl" style="color:rgba(242,240,236,0.6)">лента</span><div class="slot"><div class="preview-linear" data-linear-photo></div></div></div>
      </div>
    `;
    mountVariant(el, variant, 'theme');
    const photoLinear = el.querySelector('[data-linear-photo]');
    const palette = variant.photo;
    const linearBorder = variant.linearBorderOnly ? palette.border : null;
    if (photoLinear) {
      drawLinear(
        photoLinear,
        palette.fill,
        CREAM,
        24,
        Math.round((24 * FILLED) / 100),
        linearBorder,
      );
    }
    return el;
  }

  const grid = document.getElementById('variants-grid');
  const pickLabel = document.getElementById('pick-label');
  if (!grid) return;

  window.UNPASSED_VARIANTS_THEME.forEach((v) => grid.appendChild(buildCard(v)));

  function setPick(id) {
    document.querySelectorAll('.variant').forEach((c) => c.classList.toggle('picked', c.dataset.id === id));
    const v = window.UNPASSED_VARIANTS_THEME.find((x) => x.id === id);
    if (pickLabel && v) {
      pickLabel.innerHTML = `Выбор: <strong>${v.id}</strong> — ${v.name}. Напиши в чат код варианта.`;
    }
    try {
      localStorage.setItem('dmb-unpassed-pick', id);
    } catch (_) {}
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.variant');
    if (card) setPick(card.dataset.id);
  });

  try {
    const saved = localStorage.getItem('dmb-unpassed-pick');
    if (saved) setPick(saved);
  } catch (_) {}
})();
