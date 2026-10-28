/** Иконки «Девичья служба» — силуэт, руки (без бантов и букв) */
window.DSFigures = (() => {
  const { NS, ACCENT, themeColors } = DSIcon;

  function el(name, attrs, text) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (text != null) node.textContent = text;
    return node;
  }

  /** Профиль, смотрит вправо — «жду новости» */
  const profileWait = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M420 780V520c0-120 80-200 180-220 40-8 90-4 120 24 28 26 32 68 20 102-12 38-44 64-82 72l-18 302H420zm92-458c48 0 88-36 88-84s-40-86-92-86c-50 0-90 38-90 88 0 48 38 82 86 82h8zm178 24c-36 52-98 84-164 84-24 0-48-4-70-12 98 28 168 98 196 196 8 28 12 58 12 88H780c-8-180-88-320-230-356z",
      })
    );
    svg.appendChild(el("circle", { cx: 720, cy: 420, r: 10, fill: ACCENT, opacity: 0.9 }));
  };

  /** Стоит, смотрит вдаль — минимальный силуэт */
  const standing = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M472 820V560c-8-72 36-128 96-136 24-4 48 0 68 12 52 32 72 96 64 156v228H472zm48-420c0-56 44-100 100-100s100 44 100 100-44 96-100 96-100-40-100-96z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.35,
        d: "M320 820h384v24H320z",
      })
    );
  };

  /** Ладони сложены — спокойствие, ожидание */
  const handsFolded = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 760c-120-40-200-120-220-220-6-28-4-58 8-84 24-48 76-76 128-68 32 6 58 26 74 54 16-40 48-68 88-76 56-12 112 24 128 78 12 38 10 78-4 114-28 88-108 168-220 202l18 20H512zm-20-280c-32 0-58 24-62 56-4 36 18 68 52 82 48 20 102 8 136-28-28-52-84-84-126-110zm168 0c-38 18-68 52-82 94 34 36 88 48 136 28 34-14 56-46 52-82-4-32-30-56-62-56-14 0-28 4-44 16z",
      })
    );
    svg.appendChild(el("ellipse", { cx: 512, cy: 520, rx: 28, ry: 18, fill: ACCENT, opacity: 0.85 }));
  };

  /** Две руки держат сердце */
  const handsHeart = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M512 580c-56-42-112-34-140 14-32 54 14 112 88 158l52 36 52-36c74-46 120-104 88-158-28-48-84-56-140-14z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M280 640c48-80 120-120 196-120 32 0 64 8 92 24-36 48-56 108-56 172 0 24 4 48 12 70H268c12-48 18-98 12-146z M744 640c-48-80-120-120-196-120-32 0-64 8-92 24 36 48 56 108 56 172 0 24-4 48-12 70h232c-12-48-18-98-12-146z",
      })
    );
  };

  /** Руки обнимают себя */
  const selfHug = (svg, _t, c) => {
    svg.appendChild(el("circle", { cx: 512, cy: 380, r: 88, fill: c.fg }));
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 468c-100 0-168 72-168 168v184h336V636c0-96-68-168-168-168z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.92,
        d: "M340 560c60-40 132-48 172-8 40 40 32 112-8 152-48 48-120 56-172 16-40-32-48-96-8-132 8-8 12-18 16-28z M684 560c-60-40-132-48-172-8-40 40-32 112 8 152 48 48 120 56 172 16 40-32 48-96 8-132-8-8-12-18-16-28z",
      })
    );
  };

  /** Силуэт у окна */
  const windowSilhouette = (svg, _t, c) => {
    svg.appendChild(el("rect", { x: 280, y: 260, width: 464, height: 520, rx: 8, fill: c.fg, opacity: 0.2 }));
    svg.appendChild(el("rect", { x: 280, y: 260, width: 464, height: 520, rx: 8, fill: "none", stroke: c.fg, "stroke-width": 28 }));
    svg.appendChild(el("line", { x1: 512, y1: 260, x2: 512, y2: 780, stroke: c.fg, "stroke-width": 20, opacity: 0.5 }));
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 720V520c0-60 48-108 8-108-28 0-52 16-64 40-12-48 20-88 68-88 56 0 96 44 96 100v256H512z M512 360c36 0 64-28 64-64s-28-68-64-68-64 32-64 68 28 64 64 64z",
      })
    );
    svg.appendChild(el("circle", { cx: 620, cy: 340, r: 36, fill: ACCENT, opacity: 0.75 }));
  };

  /** Одна рука у щеки + плечо — «скучаю» */
  const handCheek = (svg, _t, c) => {
    svg.appendChild(el("circle", { cx: 512, cy: 400, r: 100, fill: c.fg }));
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 500c-88 0-156 64-156 152v168h312V652c0-88-68-152-156-152z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.95,
        d: "M620 440c48 32 72 88 64 144-8 48-40 88-84 104-24-56-20-120 20-168z M404 460c-32 40-40 96-20 148 48-20 84-64 92-116 8-52-16-104-52-132z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M448 420c-24 16-36 44-28 72 16-20 40-32 68-32s52 12 68 32c8-28-4-56-28-72-20-14-48-14-80 0z",
        opacity: 0.9,
      })
    );
  };

  /** Две руки тянутся друг к другу (она — красный акцент, он — коричневый) */
  const handsReach = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M240 620c80-120 160-180 260-180 40 0 76 12 108 36-48 28-84 72-100 124-12 40-12 84 0 124l-68 32c-56-48-96-88-120-136z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M784 620c-80-120-160-180-260-180-40 0-76 12-108 36 48 28 84 72 100 124 12 40 12 84 0 124l68 32c56-48 96-88 120-136z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: c.fg,
        "stroke-width": 8,
        opacity: 0.25,
        "stroke-dasharray": "16 20",
        d: "M512 520 Q512 480 512 440",
      })
    );
  };

  /** Кольцо отсчёта — таймер службы */
  const countdownRing = (svg, _t, c) => {
    svg.appendChild(
      el("circle", {
        cx: 512,
        cy: 512,
        r: 300,
        fill: "none",
        stroke: c.fg,
        "stroke-width": 52,
        opacity: 0.22,
      })
    );
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: ACCENT,
        "stroke-width": 52,
        "stroke-linecap": "round",
        d: "M512 212 A300 300 0 1 1 332 732",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M512 560c-36-28-72-24-92 4-22 32 4 72 52 96l40 22 40-22c48-24 74-64 52-96-20-28-56-32-92-4z",
      })
    );
  };

  /** Конверт с печатью — жду письмо */
  const envelopeSeal = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.18,
        d: "M268 360h488c44 0 80 36 80 80v320c0 44-36 80-80 80H268c-44 0-80-36-80-80V440c0-44 36-80 80-80z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: c.fg,
        "stroke-width": 36,
        "stroke-linejoin": "round",
        d: "M248 440l264 184 264-184",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M268 360l244 168L756 360H268z",
      })
    );
    svg.appendChild(
      el("rect", {
        x: 268,
        y: 520,
        width: 488,
        height: 240,
        rx: 12,
        fill: c.fg,
        opacity: 0.35,
      })
    );
    svg.appendChild(el("circle", { cx: 512, cy: 448, r: 44, fill: ACCENT }));
  };

  /** Сижу, обняв колени */
  const sittingKnees = (svg, _t, c) => {
    svg.appendChild(el("circle", { cx: 512, cy: 340, r: 92, fill: c.fg }));
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 432c-120 8-196 88-196 196v196h392V628c0-108-76-188-196-196z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.88,
        d: "M360 620c48-72 120-108 152-108s104 36 152 108c-40 48-96 76-152 76s-112-28-152-76z",
      })
    );
    svg.appendChild(el("ellipse", { cx: 512, cy: 668, rx: 120, ry: 48, fill: c.fg, opacity: 0.5 }));
  };

  /** Звезда желания — «загадала» */
  const wishStar = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M512 240l68 138 152 22-110 107 26 151-136-72-136 72 26-151-110-107 152-22 68-138z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 780V620c0-56 44-100 0-100-36 0-64 28-64 64v196H512zm0-280c44 0 80-36 80-80s-36-84-80-84-80 40-80 84 36 80 80 80z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.3,
        d: "M320 820h384v20H320z",
      })
    );
  };

  /** Нить между двумя точками — связь */
  const threadLink = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: c.fg,
        "stroke-width": 14,
        opacity: 0.35,
        d: "M320 520 Q512 360 704 520",
      })
    );
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: ACCENT,
        "stroke-width": 10,
        "stroke-dasharray": "6 14",
        d: "M320 520 Q512 360 704 520",
      })
    );
    svg.appendChild(el("circle", { cx: 320, cy: 520, r: 72, fill: c.fg }));
    svg.appendChild(el("circle", { cx: 704, cy: 520, r: 72, fill: ACCENT }));
    svg.appendChild(el("circle", { cx: 320, cy: 520, r: 28, fill: ACCENT, opacity: 0.85 }));
    svg.appendChild(el("circle", { cx: 704, cy: 520, r: 28, fill: c.fg, opacity: 0.9 }));
  };

  /** Почтовый ящик — жду весточку */
  const mailbox = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M640 320H384c-44 0-80 36-80 80v360c0 44 36 80 80 80h256c44 0 80-36 80-80V400c0-44-36-80-80-80z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.45,
        d: "M304 480h416v80H304z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M720 360h48v200h-48c-26 0-48-22-48-48V408c0-26 22-48 48-48z",
      })
    );
    svg.appendChild(el("rect", { x: 448, y: 560, width: 128, height: 24, rx: 8, fill: c.fg, opacity: 0.35 }));
  };

  /** Луна и силуэт — ночные мысли */
  const moonThought = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.25,
        d: "M680 280c-120 0-220 100-220 220s100 220 220 220c-80-40-132-120-132-220s52-180 132-220z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M640 300c-100 0-180 80-180 180s80 180 180 180c-60-36-100-108-100-180s40-144 100-180z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M380 780V580c0-48 36-88 84-88 24 0 48 8 64 24 16-32 48-52 84-52 56 0 96 44 96 100v216H380zm88-320c40 0 72-32 72-72s-32-76-72-76-72 36-72 76 32 72 72 72z",
      })
    );
  };

  /** Дневник и ручка */
  const diaryPen = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M320 300c0-44 36-80 80-80h224c44 0 80 36 80 80v424c0 44-36 80-80 80H400c-44 0-80-36-80-80V300z",
      })
    );
    [
      [400, 380, 624, 380],
      [400, 460, 584, 460],
      [400, 540, 560, 540],
      [400, 620, 600, 620],
    ].forEach(([x1, y1, x2, y2]) => {
      svg.appendChild(
        el("line", {
          x1,
          y1,
          x2,
          y2,
          stroke: c.fg,
          "stroke-width": 16,
          "stroke-linecap": "round",
          opacity: 0.35,
        })
      );
    });
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M680 360l120 120-48 48-120-120 48-48z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M728 408l48 48-16 16c-24-8-48-8-72 0l40-64z",
        opacity: 0.9,
      })
    );
    svg.appendChild(el("circle", { cx: 752, cy: 384, r: 20, fill: ACCENT }));
  };

  /** Рассвет — скоро домой */
  const sunriseWait = (svg, _t, c) => {
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.35,
        d: "M240 640h544v160H240z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: "none",
        stroke: c.fg,
        "stroke-width": 24,
        d: "M240 640h544",
      })
    );
    svg.appendChild(
      el("path", {
        fill: ACCENT,
        d: "M512 640c-120 0-220-80-220-180h440c0 100-100 180-220 180z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        opacity: 0.5,
        d: "M512 280l48 96h104l-84 64 32 104-100-68-100 68 32-104-84-64h104l48-96z",
      })
    );
    svg.appendChild(
      el("path", {
        fill: c.fg,
        d: "M512 780V660c0-40 32-72 0-72-28 0-52 16-64 40-12-44 20-84 64-84 48 0 84 40 84 88v148H512z",
      })
    );
  };

  /** Телефон — жду звонок */
  const phonePulse = (svg, _t, c) => {
    svg.appendChild(
      el("rect", {
        x: 352,
        y: 260,
        width: 320,
        height: 520,
        rx: 56,
        fill: c.fg,
      })
    );
    svg.appendChild(
      el("rect", {
        x: 392,
        y: 320,
        width: 240,
        height: 360,
        rx: 16,
        fill: c.fg,
        opacity: 0.25,
      })
    );
    svg.appendChild(el("circle", { cx: 512, cy: 720, r: 28, fill: c.fg, opacity: 0.4 }));
    svg.appendChild(
      el("circle", {
        cx: 512,
        cy: 500,
        r: 88,
        fill: "none",
        stroke: ACCENT,
        "stroke-width": 12,
        opacity: 0.35,
      })
    );
    svg.appendChild(
      el("circle", {
        cx: 512,
        cy: 500,
        r: 56,
        fill: "none",
        stroke: ACCENT,
        "stroke-width": 10,
        opacity: 0.55,
      })
    );
    svg.appendChild(el("circle", { cx: 512, cy: 500, r: 24, fill: ACCENT }));
  };

  return {
    "profile-wait": profileWait,
    standing,
    "hands-folded": handsFolded,
    "hands-heart": handsHeart,
    "self-hug": selfHug,
    window: windowSilhouette,
    "hand-cheek": handCheek,
    "hands-reach": handsReach,
    "countdown-ring": countdownRing,
    "envelope-seal": envelopeSeal,
    "sitting-knees": sittingKnees,
    "wish-star": wishStar,
    "thread-link": threadLink,
    mailbox,
    "moon-thought": moonThought,
    "diary-pen": diaryPen,
    "sunrise-wait": sunriseWait,
    "phone-pulse": phonePulse,
  };
})();
