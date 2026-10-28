document.addEventListener("DOMContentLoaded", () => {
  const key = document.body.getAttribute("data-draw");
  const draw = window.DSFigures && window.DSFigures[key];
  if (draw) DSIcon.mount(draw);
});
