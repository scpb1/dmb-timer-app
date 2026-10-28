/** Рисует сегментное кольцо / полоску как в приложении (linen, не фото). */
(function () {
  const TRACK = 'rgba(167, 154, 138, 0.35)';
  const FILL = '#E53935';

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

  function renderRing(svg, { size, thickness, count, filled, gapDeg = 1.4 }) {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 8;
    const innerR = outerR - thickness;
    const step = 360 / count;
    const span = Math.max(step - gapDeg, step * 0.6);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const center = i * step + step / 2;
      const start = center - span / 2;
      const end = center + span / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', segmentPath(cx, cy, innerR, outerR, start, end));
      path.setAttribute('fill', i < filled ? FILL : TRACK);
      svg.appendChild(path);
    }
  }

  function renderBar(container, { count, filled }) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const seg = document.createElement('div');
      seg.className = 'app-linear-seg' + (i < filled ? ' on' : '');
      container.appendChild(seg);
    }
  }

  function drawAppRing(svg) {
    renderRing(svg, {
      size: Number(svg.dataset.size || 280),
      thickness: Number(svg.dataset.thickness || 32),
      count: Number(svg.dataset.count || 100),
      filled: Number(svg.dataset.filled || 21),
    });
  }
  window.__drawAppRing = drawAppRing;

  document.querySelectorAll('[data-app-ring]').forEach(drawAppRing);

  document.querySelectorAll('[data-app-linear]').forEach((el) => {
    renderBar(el, {
      count: Number(el.dataset.count || 100),
      filled: Number(el.dataset.filled || 21),
    });
  });
})();
