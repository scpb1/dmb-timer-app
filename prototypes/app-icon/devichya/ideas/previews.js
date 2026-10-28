/** Мини-превью на index — те же draw, что на страницах идей */
(() => {
  const { createIconSvg, mount: _ } = DSIcon;
  const drawers = window.DSIconDrawers;
  if (!drawers) return;
  document.querySelectorAll("[data-t]").forEach((el) => {
    const key = el.getAttribute("data-t");
    const draw = drawers[key];
    if (!draw) return;
    const svg = createIconSvg("light");
    draw(svg, "light", DSIcon.themeColors("light"));
    el.appendChild(svg);
  });
})();
