/** Отрисовка иконок — подключается на страницах идей + previews.js */
window.DSIconDrawers = (() => {
  const { NS, ACCENT, addBow, themeColors } = DSIcon;

  function el(name, attrs, text) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (text != null) node.textContent = text;
    return node;
  }

  const bowCenter = (svg) => {
    addBow(svg, { x: 512, y: 500, scale: 9.2, rotate: -8 });
  };

  const heartBow = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 560c-92-70-188-58-232 18-48 84 20 172 128 248l96 84 96-84c108-76 176-164 128-248-44-76-140-88-232-18z",
      })
    );
    addBow(svg, { x: 512, y: 360, scale: 5.2, rotate: 0 });
  };

  const envelopeBow = (svg, _t, c) => {
    svg.appendChild(el("rect", { x: 262, y: 400, width: 500, height: 320, rx: 28, fill: c.fg }));
    svg.appendChild(el("path", { fill: c.fg, opacity: 0.85, d: "M262 424 L512 620 L762 424 Z" }));
    addBow(svg, { x: 512, y: 390, scale: 4.6, rotate: 0 });
  };

  const homeBow = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 320 L744 480 V760 H592 V580 H432 V760 H280 V480 Z",
      })
    );
    addBow(svg, { x: 512, y: 268, scale: 4.8, rotate: 0 });
  };

  const rings = (svg, _t, c) => {
    svg.appendChild(
      el("circle", {
        cx: 448,
        cy: 540,
        r: 148,
        fill: "none",
        stroke: c.fg,
        "stroke-width": 52,
      })
    );
    svg.appendChild(
      el("circle", {
        cx: 576,
        cy: 540,
        r: 148,
        fill: "none",
        stroke: ACCENT,
        "stroke-width": 52,
      })
    );
    addBow(svg, { x: 512, y: 380, scale: 3.6, rotate: 0 });
  };

  const calendar = (svg, theme, c) => {
    svg.appendChild(el("rect", { x: 300, y: 300, width: 424, height: 480, rx: 36, fill: c.fg }));
    svg.appendChild(el("rect", { x: 300, y: 300, width: 424, height: 100, rx: 36, fill: ACCENT }));
    const dot = theme === "dark" ? DSIcon.CREAM_TEXT : DSIcon.CREAM;
    svg.appendChild(
      el("circle", { cx: 512, cy: 580, r: 48, fill: dot })
    );
    addBow(svg, { x: 680, y: 340, scale: 3.2, rotate: 22 });
  };

  const ribbonCross = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M480 240 L544 240 L620 784 L556 784 Z M240 480 L784 544 L784 480 L240 416 Z",
        opacity: 0.92,
      })
    );
    addBow(svg, { x: 512, y: 512, scale: 5.5, rotate: 45 });
  };

  const dBow = (svg, _t, c) => {
    const text = el("text", {
      x: 512,
      y: 680,
      "text-anchor": "middle",
      "font-size": 520,
      "font-weight": 800,
      fill: c.fg,
      "font-family": "Segoe UI, system-ui, sans-serif",
    }, "Д");
    svg.appendChild(text);
    addBow(svg, { x: 680, y: 320, scale: 4.2, rotate: 24 });
  };

  const pathHeart = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: c.fg,
        "stroke-width": 36,
        "stroke-linecap": "round",
        d: "M280 720 C 360 520, 440 480, 512 520 S 680 560, 744 720",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M744 720c-36-28-72-22-88 10-18 36 8 72 52 98l36 24 36-24c44-26 70-62 52-98-16-32-52-38-88-10z",
      })
    );
    addBow(svg, { x: 280, y: 720, scale: 3.4, rotate: -30 });
  };

  return {
    "bow-center": bowCenter,
    "heart-bow": heartBow,
    "envelope-bow": envelopeBow,
    "home-bow": homeBow,
    rings,
    calendar,
    "ribbon-cross": ribbonCross,
    "d-bow": dBow,
    "path-heart": pathHeart,
  };
})();
