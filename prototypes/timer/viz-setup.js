(function () {
  const PASSED = 78;
  const TOTAL = 365;

  document.querySelectorAll('[data-dot-grid]').forEach((el) => {
    const cols = Number(el.dataset.cols || 20);
    const passed = Number(el.dataset.passed || PASSED);
    const total = Number(el.dataset.total || TOTAL);
    el.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('span');
      d.className = 'dot' + (i < passed ? ' on' : '');
      el.appendChild(d);
    }
  });
})();
