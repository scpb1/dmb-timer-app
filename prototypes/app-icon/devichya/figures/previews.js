(() => {
  const drawers = window.DSFigures;
  if (!drawers) return;
  document.querySelectorAll("[data-t]").forEach((el) => {
    const draw = drawers[el.getAttribute("data-t")];
    if (!draw) return;
    const svg = DSIcon.createIconSvg("light");
    draw(svg, "light", DSIcon.themeColors("light"));
    el.appendChild(svg);
  });
})();
