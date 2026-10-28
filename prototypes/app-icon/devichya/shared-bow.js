/** Общие цвета и бант для «Девичья служба» */
window.DSIcon = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const CREAM = "#FCF7DF";
  const BROWN = "#3E3630";
  const CREAM_TEXT = "#F5F2EB";
  const ACCENT = "#e53935";
  const BOW_W = 54.051;
  const BOW_H = 25.844;
  const BOW_PATHS = [
    "M32.834,5.094H21.24c-1.132,0-2.048,0.914-2.048,2.043v11.57c0,1.127,0.916,2.043,2.048,2.043h11.594c1.131,0,2.048-0.914,2.048-2.043V7.137C34.882,6.008,33.964,5.094,32.834,5.094z",
    "M12.115,3.565L3.82,0.137C3.641,0.093,3.471,0.06,3.31,0.039C0.954-0.293,0.14,1.584,0.019,3.417v0.007C0.01,3.51,0.01,3.599,0.005,3.69C0,3.775,0,3.864,0,3.948v17.95c0,0.087,0,0.172,0.004,0.261c0.004,0.09,0.004,0.176,0.014,0.264c0,0.006,0,0.006,0,0.006c0.12,1.83,0.931,3.701,3.276,3.383c0.167-0.023,0.341-0.053,0.524-0.098l8.295-3.432c2.176-0.98,3.82-1.707,3.82-3.81V7.376C15.935,5.272,14.291,4.542,12.115,3.565z",
    "M54.045,3.683c0-0.085-0.005-0.174-0.013-0.26c0-0.002,0-0.002,0-0.007c-0.121-1.828-0.931-3.701-3.279-3.378c-0.165,0.016-0.34,0.049-0.519,0.098l-8.299,3.428c-2.174,0.978-3.818,1.707-3.818,3.811V7.376c0,2.107,1.645,2.834,3.818,3.813l8.299,3.427c0.174,0.049,0.346,0.076,0.506,0.099c2.355,0.331,3.171-1.548,3.292-3.378V22.42c0.008-0.088,0.013-0.18,0.013-0.264c0.006-0.089,0.006-0.177,0.006-0.259V3.943C54.051,3.864,54.051,3.775,54.045,3.683z",
  ];

  function themeColors(theme) {
    const dark = theme === "dark";
    return {
      bg: dark ? BROWN : CREAM,
      fg: dark ? CREAM_TEXT : BROWN,
    };
  }

  function appendBow(intoGroup, fill = ACCENT) {
    intoGroup.setAttribute("fill", fill);
    BOW_PATHS.forEach((d) => {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      intoGroup.appendChild(path);
    });
    return intoGroup;
  }

  function addBow(svg, { x, y, scale, rotate = 0, fill = ACCENT }) {
    const wrap = document.createElementNS(NS, "g");
    wrap.setAttribute(
      "transform",
      `translate(${x} ${y}) rotate(${rotate}) scale(${scale}) translate(${-BOW_W / 2} ${-BOW_H / 2})`
    );
    wrap.appendChild(appendBow(document.createElementNS(NS, "g"), fill));
    svg.appendChild(wrap);
    return wrap;
  }

  function createIconSvg(theme) {
    const { bg } = themeColors(theme);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1024 1024");
    svg.setAttribute("aria-hidden", "true");
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("width", "1024");
    rect.setAttribute("height", "1024");
    rect.setAttribute("fill", bg);
    svg.appendChild(rect);
    return svg;
  }

  function mount(drawFn) {
    document.querySelectorAll("[data-icon-slot]").forEach((el) => {
      const theme = el.getAttribute("data-icon-slot") || "light";
      const svg = createIconSvg(theme);
      drawFn(svg, theme, themeColors(theme));
      el.replaceChildren(svg);
    });
  }

  return {
    NS,
    CREAM,
    BROWN,
    CREAM_TEXT,
    ACCENT,
    BOW_W,
    BOW_H,
    appendBow,
    addBow,
    createIconSvg,
    themeColors,
    mount,
  };
})();
