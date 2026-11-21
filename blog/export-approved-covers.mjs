/**
 * PNG из утверждённых HTML-макетов (release, timer, feedback).
 * node blog/export-approved-covers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(__dirname, "tgk-posts");
const fontFile = path.join(root, "assets", "fonts", "dmb-timer-sans-Bold.ttf");

const W = 1920;
const H = 1080;
const CREAM = "#FCF7DF";
const INK = "#3E3630";
const MUTED = "#a79a8a";
const RED = "#e53935";
const FONT = "Taylor Sans";
const TRACK = "-0.045em";
const KICKER_TRACK = "0.12em";

const WORDMARK = {
  word: "ддд",
  fontSize: 300,
  textY: 580,
  letterSpacing: "-0.04em",
  stripe: { x: 328, y: 650, w: 368, h: 18, rx: 9 },
  crop: { x: 288, y: 352, w: 448, h: 336 },
};

const fontOpts = {
  loadSystemFonts: false,
  fontFiles: [fontFile],
  defaultFontFamily: FONT,
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderSvg(svg) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: fontOpts,
  });
  return resvg.render().asPng();
}

const widthCache = new Map();

async function textWidth(text, size, track = TRACK) {
  const key = `${track}|${size}|${text}`;
  if (widthCache.has(key)) return widthCache.get(key);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2400" height="600" viewBox="0 0 2400 600" xmlns="http://www.w3.org/2000/svg">
  <text x="40" y="380" font-family="${FONT}" font-size="${size}" letter-spacing="${track}" fill="#000">${esc(text)}</text>
</svg>`;
  const png = renderSvg(svg);
  const { info } = await sharp(png).trim().toBuffer({ resolveWithObject: true });
  widthCache.set(key, info.width);
  return info.width;
}

function textNode({ text, x, y, size, fill = INK, anchor = "middle", track = TRACK }) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}" letter-spacing="${track}" fill="${fill}">${esc(text)}</text>`;
}

function barNode({ cx, y, w, h }) {
  const height = Math.max(8, Math.round(h));
  const width = Math.max(height * 4, Math.round(w));
  return `<rect x="${(cx - width / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${width}" height="${height}" rx="${(height / 2).toFixed(1)}" fill="${RED}"/>`;
}

function wordmarkCorner(markW = 262) {
  const { crop, word, fontSize, textY, letterSpacing, stripe } = WORDMARK;
  const markH = Math.round((crop.h / crop.w) * markW);
  const x = Math.round(W - W * 0.055 - markW);
  const y = Math.round(H - H * 0.06 - markH);
  return `<svg x="${x}" y="${y}" width="${markW}" height="${markH}" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" xmlns="http://www.w3.org/2000/svg">
  <text x="512" y="${textY}" text-anchor="middle" font-size="${fontSize}" font-weight="800" fill="${INK}" font-family="${FONT}" letter-spacing="${letterSpacing}">${word}</text>
  <rect x="${stripe.x}" y="${stripe.y}" width="${stripe.w}" height="${stripe.h}" rx="${stripe.rx}" fill="${RED}"/>
</svg>`;
}

async function pillNode({ text, cx, y, size }) {
  const padX = Math.round(size * 0.62);
  const padY = Math.round(size * 0.38);
  const tw = await textWidth(text, size);
  const w = tw + padX * 2;
  const h = size + padY * 2;
  const rx = h / 2;
  const left = cx - w / 2;
  const top = y - size * 0.72 - padY;
  return [
    `<rect x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${w}" height="${h}" rx="${rx.toFixed(1)}" fill="rgba(255,255,255,0.35)" stroke="rgba(62,54,48,0.14)" stroke-width="2"/>`,
    textNode({ text, x: cx, y: top + padY + size * 0.78, size }),
  ].join("\n  ");
}

/**
 * Макет B: kicker сверху, title, полоска, pill или subtitle (одна строка).
 */
async function layoutB({
  kicker,
  title,
  titleSize,
  pill,
  subtitle,
  subSize = 40,
  barScale = 0.58,
  barMax = 520,
  barMin = 160,
}) {
  const titleW = await textWidth(title, titleSize);
  const barH = 14;
  const barW = Math.round(Math.min(barMax, Math.max(barMin, titleW * barScale)));
  const barGap = Math.round(titleSize * 0.36);
  const pillGap = pill ? Math.round(titleSize * 0.32) : 0;
  const subGap = subtitle ? 56 : 0;
  const kickerSize = 38;
  const kickerY = Math.round(H * 0.08 + kickerSize * 0.85);

  const titleY =
    pill || subtitle
      ? Math.round(H * 0.46)
      : Math.round(H * 0.5);
  const barY = titleY + barGap;
  let nextY = barY + barH;

  const parts = [];
  if (kicker) {
    parts.push(
      textNode({
        text: kicker,
        x: W / 2,
        y: kickerY,
        size: kickerSize,
        fill: MUTED,
        track: KICKER_TRACK,
      }),
    );
  }
  parts.push(textNode({ text: title, x: W / 2, y: titleY, size: titleSize }));
  parts.push(barNode({ cx: W / 2, y: barY, w: barW, h: barH }));

  if (pill) {
    const pillSize = 46;
    nextY += pillGap;
    parts.push(await pillNode({ text: pill, cx: W / 2, y: nextY + pillSize, size: pillSize }));
  } else if (subtitle) {
    parts.push(textNode({ text: subtitle, x: W / 2, y: barY + barH + subGap, size: subSize }));
  }

  parts.push(wordmarkCorner());
  return parts.join("\n  ");
}

/** Таймер C: а / в + подписи в одну строку */
async function layoutTimerC() {
  const kicker = "таймеры";
  const title = "в комментарии";
  const titleSize = 128;
  const choiceSize = 188;
  const capSize = 34;
  const kickerY = Math.round(H * 0.08 + 32);
  const titleY = 360;
  const titleW = await textWidth(title, titleSize);
  const barY = titleY + Math.round(titleSize * 0.38);
  const barH = 14;
  const barW = Math.round(titleW * 0.58);

  const labels = [
    { letter: "а", cap: "скрин" },
    { letter: "в", cap: "цифра ддд" },
  ];
  const widths = await Promise.all(labels.map((l) => textWidth(l.letter, choiceSize)));
  const capWidths = await Promise.all(labels.map((l) => textWidth(l.cap, capSize)));
  const gap = 220;
  const total = widths[0] + gap + widths[1];
  const x0 = (W - total) / 2;
  const choiceY = 700;

  const parts = [
    textNode({ text: kicker, x: W / 2, y: kickerY, size: 38, fill: MUTED, track: KICKER_TRACK }),
    textNode({ text: title, x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: barW, h: barH }),
  ];

  labels.forEach((item, i) => {
    const cx = x0 + (i === 0 ? widths[0] / 2 : widths[0] + gap + widths[1] / 2);
    const barSmall = Math.round(capWidths[i] * 0.5);
    parts.push(textNode({ text: item.letter, x: cx, y: choiceY, size: choiceSize }));
    parts.push(barNode({ cx, y: choiceY + 32, w: barSmall, h: 8 }));
    parts.push(textNode({ text: item.cap, x: cx, y: choiceY + 92, size: capSize }));
  });

  parts.push(wordmarkCorner());
  return parts.join("\n  ");
}

/** Фидбек A: плюс / минус / баг */
async function layoutFeedbackTriCols() {
  const title = "напиши мне";
  const titleSize = 128;
  const colSize = 84;
  const capSize = 32;
  const titleY = 360;
  const titleW = await textWidth(title, titleSize);
  const barY = titleY + Math.round(titleSize * 0.32);
  const barH = 14;
  const barW = Math.round(titleW * 0.42);
  const columns = [
    { word: "плюс", cap: "зашло" },
    { word: "минус", cap: "мешает" },
    { word: "баг", cap: "сломалось" },
  ];
  const colWidths = await Promise.all(columns.map((c) => textWidth(c.word, colSize)));
  const capWidths = await Promise.all(columns.map((c) => textWidth(c.cap, capSize)));
  const colY = 640;
  const xs = [500, 960, 1420];
  const parts = [
    textNode({ text: title, x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: barW, h: barH }),
  ];
  columns.forEach((col, i) => {
    const x = xs[i];
    parts.push(textNode({ text: col.word, x, y: colY, size: colSize }));
    parts.push(barNode({ cx: x, y: colY + 28, w: Math.round(colWidths[i] * 0.55), h: 8 }));
    parts.push(textNode({ text: col.cap, x, y: colY + 100, size: capSize }));
  });
  parts.push(wordmarkCorner());
  return parts.join("\n  ");
}

async function layoutLetterChoices({ kicker, title, choices, gap }) {
  const titleSize = 128;
  const choiceSize = choices.length > 3 ? 150 : 176;
  const capSize = 32;
  const kickerY = Math.round(H * 0.08 + 32);
  const titleY = 350;
  const titleW = await textWidth(title, titleSize);
  const barY = titleY + Math.round(titleSize * 0.38);
  const barH = 14;
  const barW = Math.round(titleW * 0.58);
  const choiceY = 700;

  const widths = await Promise.all(choices.map((c) => textWidth(c.letter, choiceSize)));
  const capWidths = await Promise.all(choices.map((c) => textWidth(c.cap, capSize)));
  const useGap = gap ?? (choices.length > 3 ? 100 : 150);
  const total = widths.reduce((a, w) => a + w, 0) + useGap * (choices.length - 1);
  let cursor = (W - total) / 2;

  const parts = [
    textNode({ text: kicker, x: W / 2, y: kickerY, size: 38, fill: MUTED, track: KICKER_TRACK }),
    textNode({ text: title, x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: barW, h: barH }),
  ];

  choices.forEach((item, i) => {
    const cx = cursor + widths[i] / 2;
    parts.push(textNode({ text: item.letter, x: cx, y: choiceY, size: choiceSize }));
    parts.push(barNode({ cx, y: choiceY + 30, w: Math.round(capWidths[i] * 0.52), h: 8 }));
    parts.push(textNode({ text: item.cap, x: cx, y: choiceY + 90, size: capSize }));
    cursor += widths[i] + useGap;
  });

  parts.push(wordmarkCorner());
  return parts.join("\n  ");
}

async function chipRow(texts, topY, hotIndex = null) {
  const size = 38;
  const padX = 22;
  const gap = 18;
  const widths = await Promise.all(texts.map((t) => textWidth(t, size)));
  const heights = size + 20;
  const boxes = widths.map((tw) => tw + padX * 2);
  const total = boxes.reduce((a, b) => a + b, 0) + gap * (texts.length - 1);
  let x = (W - total) / 2;
  const parts = [];
  texts.forEach((label, i) => {
    const w = boxes[i];
    const cx = x + w / 2;
    const rx = heights / 2;
    const hot = hotIndex !== null && i === hotIndex;
    const stroke = hot ? "rgba(229,57,53,0.45)" : "rgba(62,54,48,0.12)";
    const fill = hot ? "rgba(229,57,53,0.08)" : "rgba(255,255,255,0.4)";
    parts.push(
      `<rect x="${x.toFixed(1)}" y="${topY}" width="${w}" height="${heights}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
    );
    parts.push(textNode({ text: label, x: cx, y: topY + heights * 0.7, size }));
    x += w + gap;
  });
  return parts.join("\n  ");
}

const FEEDBACK_CHIP_WORDS = ["зашло", "бесит", "баг", "идея"];

async function layoutFeedbackChips(hotIndex = null) {
  const kicker = "обратная связь";
  const title = "твой отзыв";
  const titleSize = 154;
  const kickerY = Math.round(H * 0.08 + 32);
  const titleY = Math.round(H * 0.44);
  const titleW = await textWidth(title, titleSize);
  const barY = titleY + Math.round(titleSize * 0.36);
  const barH = 14;
  const barW = Math.round(Math.min(520, titleW * 0.58));
  const chipY = barY + barH + 48;

  const parts = [
    textNode({ text: kicker, x: W / 2, y: kickerY, size: 38, fill: MUTED, track: KICKER_TRACK }),
    textNode({ text: title, x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: barW, h: barH }),
    await chipRow(FEEDBACK_CHIP_WORDS, chipY, hotIndex),
    wordmarkCorner(),
  ];
  return parts.join("\n  ");
}

function svgDoc(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${inner}
</svg>`;
}

const COVERS = [
  {
    file: "release.png",
    body: () =>
      layoutB({
        kicker: "апдейт приложения",
        title: "новая версия",
        titleSize: 154,
        pill: "v 1.0.4",
      }),
  },
  {
    file: "timer-a.png",
    body: () =>
      layoutB({
        kicker: "таймеры",
        title: "твой таймер",
        titleSize: 154,
        subtitle: "скинь скрин в комментарии",
        subSize: 42,
      }),
  },
  {
    file: "timer-b.png",
    body: () =>
      layoutB({
        kicker: "таймеры",
        title: "сколько ддд осталось вам?",
        titleSize: 108,
      }),
  },
  {
    file: "timer-c.png",
    body: () => layoutTimerC(),
  },
  {
    file: "timer.png",
    body: () =>
      layoutB({
        kicker: "таймеры",
        title: "твой таймер",
        titleSize: 154,
        subtitle: "скинь скрин в комментарии",
        subSize: 42,
      }),
  },
  { file: "feedback-a.png", body: () => layoutFeedbackTriCols() },
  {
    file: "feedback-b.png",
    body: () =>
      layoutB({
        kicker: "обратная связь",
        title: "фидбек",
        titleSize: 154,
        subtitle: "плюс · минус · баг",
        subSize: 42,
      }),
  },
  {
    file: "feedback-c.png",
    body: () =>
      layoutLetterChoices({
        kicker: "обратная связь",
        title: "в комментарии",
        choices: [
          { letter: "а", cap: "плюс" },
          { letter: "б", cap: "минус" },
          { letter: "в", cap: "баг" },
        ],
      }),
  },
  {
    file: "feedback-d.png",
    body: () =>
      layoutLetterChoices({
        kicker: "обратная связь",
        title: "в комментарии",
        gap: 95,
        choices: [
          { letter: "а", cap: "плюс" },
          { letter: "б", cap: "минус" },
          { letter: "в", cap: "баг" },
          { letter: "г", cap: "идея" },
        ],
      }),
  },
  {
    file: "feedback-e.png",
    body: () =>
      layoutB({
        kicker: "обратная связь",
        title: "багрепорт",
        titleSize: 154,
        subtitle: "скрин в комментарии",
        subSize: 42,
      }),
  },
  { file: "feedback-f1.png", body: () => layoutFeedbackChips(null) },
  { file: "feedback-f2.png", body: () => layoutFeedbackChips(0) },
  { file: "feedback-f3.png", body: () => layoutFeedbackChips(1) },
  { file: "feedback-f4.png", body: () => layoutFeedbackChips(2) },
  { file: "feedback-f5.png", body: () => layoutFeedbackChips(3) },
  { file: "feedback-f.png", body: () => layoutFeedbackChips(null) },
  { file: "feedback.png", body: () => layoutFeedbackTriCols() },
  {
    file: "poll-a.png",
    body: () =>
      layoutB({
        kicker: "функционал",
        title: "опрос",
        titleSize: 188,
        subtitle: "помоги решить",
        subSize: 42,
      }),
  },
  {
    file: "poll-b.png",
    body: () =>
      layoutB({
        kicker: "разработка",
        title: "опрос",
        titleSize: 188,
        subtitle: "поучаствуй в разработке",
        subSize: 40,
      }),
  },
  {
    file: "poll-c.png",
    body: () =>
      layoutB({
        kicker: "функционал",
        title: "опрос",
        titleSize: 188,
        subtitle: "каждый голос важен",
        subSize: 42,
        barScale: 0.34,
        barMax: 200,
        barMin: 112,
      }),
  },
  {
    file: "poll-d.png",
    body: () =>
      layoutB({
        kicker: "твой выбор",
        title: "опрос",
        titleSize: 188,
        subtitle: "что лучше для тебя",
        subSize: 42,
      }),
  },
  {
    file: "poll-e.png",
    body: () =>
      layoutB({
        kicker: "дорожная карта",
        title: "опрос",
        titleSize: 188,
        subtitle: "ответь в комментарии",
        subSize: 42,
      }),
  },
  {
    file: "poll-f.png",
    body: () =>
      layoutB({
        kicker: "новая фича",
        title: "опрос",
        titleSize: 188,
        subtitle: "выбери в тексте поста",
        subSize: 38,
      }),
  },
  {
    file: "poll.png",
    body: () =>
      layoutB({
        kicker: "функционал",
        title: "опрос",
        titleSize: 188,
        subtitle: "каждый голос важен",
        subSize: 42,
        barScale: 0.34,
        barMax: 200,
        barMin: 112,
      }),
  },
];

async function main() {
  if (!fs.existsSync(fontFile)) {
    throw new Error(`Нет шрифта: ${fontFile}`);
  }
  fs.mkdirSync(outDir, { recursive: true });

  for (const cover of COVERS) {
    const inner = await cover.body();
    const png = renderSvg(svgDoc(inner));
    await sharp(png).png({ compressionLevel: 9 }).toFile(path.join(outDir, cover.file));
    console.log(cover.file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});