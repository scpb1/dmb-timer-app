/** data-draw="bow-center" на body → монтирует иконки */
document.addEventListener("DOMContentLoaded", () => {
  const key = document.body.getAttribute("data-draw");
  const draw = window.DSIconDrawers && window.DSIconDrawers[key];
  if (draw) DSIcon.mount(draw);
});
