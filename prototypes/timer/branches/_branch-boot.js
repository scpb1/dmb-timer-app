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

  function renderRing(svg, filled) {
    const size = Number(svg.dataset.size || 280);
    const thickness = Number(svg.dataset.thickness || 32);
    const count = Number(svg.dataset.count || 100);
    const gapDeg = 1.4;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 8;
    const innerR = outerR - thickness;
    const step = 360 / count;
    const span = Math.max(step - gapDeg, step * 0.6);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.innerHTML = '';
    const filledSeg = Math.round((filled / 100) * count);
    for (let i = 0; i < count; i++) {
      const center = i * step + step / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', segmentPath(cx, cy, innerR, outerR, center - span / 2, center + span / 2));
      path.setAttribute('fill', i < filledSeg ? FILL : TRACK);
      svg.appendChild(path);
    }
  }

  function parseId() {
    const q = new URLSearchParams(window.location.search);
    return q.get('id') || BranchScenes.defaultId;
  }

  function init() {
    const id = parseId();
    const meta = BranchScenes.BRANCH_META[id];
    if (!meta) {
      document.body.innerHTML = '<p style="padding:2rem">Неизвестный id. <a href="index.html">К списку</a></p>';
      return;
    }

    const titleEl = document.getElementById('branchTitle');
    const subEl = document.getElementById('branchSub');
    const hintEl = document.getElementById('branchHint');
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.group + ' · ' + id;
    if (hintEl) hintEl.textContent = meta.hint;
    document.title = meta.title + ' · виды войск';

    const scene = document.getElementById('branchScene');
    const slider = document.getElementById('progressSlider');
    const pctLabel = document.getElementById('progressValue');
    const ring = document.querySelector('[data-app-ring]');
    const centerPct = document.querySelector('.app-ring-center .pct');
    const centerNum = document.querySelector('.app-ring-center .num');
    const statPassed = document.querySelector('.app-stat-row .app-stat-card:first-child .val');
    const statLeft = document.querySelector('.app-stat-row .app-stat-card:last-child .val');

    const totalDays = 365;
    let pct = Number(slider?.value || 21);

    function apply(p) {
      pct = Math.min(100, Math.max(0, p));
      if (slider) slider.value = String(Math.round(pct));
      const pctStr = pct.toFixed(2).replace('.', ',') + '%';
      if (pctLabel) pctLabel.textContent = pctStr;
      if (centerPct) centerPct.textContent = pctStr;
      const passed = Math.round((pct / 100) * totalDays);
      const left = totalDays - passed;
      if (centerNum) centerNum.textContent = String(left);
      if (statPassed) statPassed.textContent = String(passed);
      if (statLeft) statLeft.textContent = String(left);
      if (ring) renderRing(ring, pct);
      BranchScenes.renderBranchScene(id, pct, scene);
    }

    slider?.addEventListener('input', () => apply(Number(slider.value)));
    apply(pct);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
