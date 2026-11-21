/**
 * Обложки 16:9 для постов ТГК (PNG после утверждения HTML-макета).
 * Макеты: blog/tgk-posts-html/
 *
 * Стиль иконки: крем #FCF7DF, чернила #3E3630, одна красная полоска.
 * Шрифт: assets/fonts/dmb-timer-sans-Bold.ttf (Taylor Sans Bold).
 *
 * Запуск из корня: node blog/generate-tgk-posts.mjs
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
const RED = "#e53935";
const FONT = "Taylor Sans";
const TRACK = "-0.045em";

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

async function textWidth(text, size) {
  const key = `${size}:${text}`;
  if (widthCache.has(key)) return widthCache.get(key);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2400" height="600" viewBox="0 0 2400 600" xmlns="http://www.w3.org/2000/svg">
  <text x="40" y="380" font-family="${FONT}" font-size="${size}" letter-spacing="${TRACK}" fill="#000000">${esc(text)}</text>
</svg>`;
  const png = renderSvg(svg);
  const { info } = await sharp(png).trim().toBuffer({ resolveWithObject: true });
  widthCache.set(key, info.width);
  return info.width;
}

function textNode({ text, x, y, size, anchor = "middle" }) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}" letter-spacing="${TRACK}" fill="${INK}">${esc(text)}</text>`;
}

function barNode({ cx, y, w, h }) {
  const height = Math.max(8, Math.round(h));
  const width = Math.max(height * 4, Math.round(w));
  return `<rect x="${(cx - width / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${width}" height="${height}" rx="${height / 2}" fill="${RED}"/>`;
}

function signature(markWidth) {
  const size = 44;
  const x = 1792;
  const y = 968;
  const barW = Math.round(markWidth * 0.62);
  const cx = x - markWidth / 2;
  return [
    textNode({ text: "ддд", x, y, size, anchor: "end" }),
    barNode({ cx, y: y + 16, w: barW, h: 8 }),
  ].join("\n  ");
}

function svgDoc(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${inner}
</svg>`;
}

async function poster({ lines, subtitle, titleSize }) {
  const widths = await Promise.all(lines.map((line) => textWidth(line, titleSize)));
  const longest = Math.max(...widths);
  const lineGap = Math.round(titleSize * 0.98);
  const barH = Math.max(12, Math.round(titleSize * 0.065));
  const barW = Math.round(Math.min(520, Math.max(148, longest * 0.56)));
  const barGap = Math.round(titleSize * 0.4);
  const subSize = 40;
  const subGap = 78;

  const lastIndex = lines.length - 1;
  const block =
    lastIndex * lineGap + barGap + barH + (subtitle ? subGap + subSize * 0.25 : 0);
  const firstBaseline = Math.round((H - block) / 2 + titleSize * 0.72);

  const parts = [];
  lines.forEach((line, index) => {
    parts.push(textNode({ text: line, x: W / 2, y: firstBaseline + index * lineGap, size: titleSize }));
  });
  const barY = firstBaseline + lastIndex * lineGap + barGap;
  parts.push(barNode({ cx: W / 2, y: barY, w: barW, h: barH }));
  if (subtitle) {
    parts.push(
      textNode({
        text: subtitle,
        x: W / 2,
        y: barY + barH + subGap,
        size: subSize,
      }),
    );
  }
  return parts.join("\n  ");
}

async function choiceCard() {
  const titleSize = 132;
  const choiceSize = 200;
  const titleW = await textWidth("опрос", titleSize);
  const aW = await textWidth("а", choiceSize);
  const bW = await textWidth("б", choiceSize);
  const pairGap = 200;
  const pairWidth = aW + pairGap + bW;
  const pairLeft = (W - pairWidth) / 2;
  const barH = 14;
  const barW = Math.round(titleW * 0.7);
  const titleY = 360;
  const barY = titleY + Math.round(titleSize * 0.42);
  const choiceY = 700;
  return [
    textNode({ text: "опрос", x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: barW, h: barH }),
    textNode({ text: "а", x: pairLeft + aW / 2, y: choiceY, size: choiceSize }),
    textNode({ text: "б", x: pairLeft + aW + pairGap + bW / 2, y: choiceY, size: choiceSize }),
    textNode({ text: "напиши букву", x: W / 2, y: 860, size: 36 }),
  ].join("\n  ");
}

async function feedbackCard() {
  const titleSize = 128;
  const colSize = 84;
  const capSize = 32;
  const title = "напиши мне";
  const titleW = await textWidth(title, titleSize);
  const columns = [
    { word: "плюс", caption: "зашло" },
    { word: "минус", caption: "мешает" },
    { word: "баг", caption: "сломалось" },
  ];
  const colWidths = await Promise.all(columns.map((col) => textWidth(col.word, colSize)));
  const titleY = 360;
  const barH = 14;
  const barY = titleY + Math.round(titleSize * 0.26);
  const colY = 640;
  const xs = [500, 960, 1420];
  const parts = [
    textNode({ text: title, x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: Math.round(titleW * 0.42), h: barH }),
  ];
  columns.forEach((col, index) => {
    const x = xs[index];
    const wordBarW = Math.round(colWidths[index] * 0.55);
    parts.push(textNode({ text: col.word, x, y: colY, size: colSize }));
    parts.push(barNode({ cx: x, y: colY + 28, w: wordBarW, h: 8 }));
    parts.push(textNode({ text: col.caption, x, y: colY + 100, size: capSize }));
  });
  return parts.join("\n  ");
}

async function numberCard(value) {
  const titleSize = 340;
  const width = await textWidth(value, titleSize);
  const barH = 18;
  const barW = Math.round(Math.max(120, width * 0.62));
  const titleY = 545;
  const barY = titleY + 96;
  return [
    textNode({ text: value, x: W / 2, y: titleY, size: titleSize }),
    barNode({ cx: W / 2, y: barY, w: barW, h: barH }),
    textNode({ text: "ддд", x: W / 2, y: barY + 110, size: 56 }),
  ].join("\n  ");
}

const posters = [
  {
    file: "release.png",
    lines: ["новая", "версия"],
    subtitle: "что внутри",
    titleSize: 168,
  },
  {
    file: "feature.png",
    lines: ["в работе"],
    subtitle: "пока не в телефоне",
    titleSize: 168,
  },
  {
    file: "timer.png",
    lines: ["твой", "таймер"],
    subtitle: "скинь скрин со счётом",
    titleSize: 168,
  },
  {
    file: "question.png",
    lines: ["вопрос", "дня"],
    subtitle: "без вариантов",
    titleSize: 168,
  },
  {
    file: "letter.png",
    lines: ["письмо"],
    subtitle: "что напишешь ему",
    titleSize: 188,
  },
  {
    file: "diary.png",
    lines: ["дневник"],
    subtitle: "только для себя",
    titleSize: 176,
  },
  {
    file: "support.png",
    lines: ["опора"],
    subtitle: "если тяжело ждать",
    titleSize: 188,
  },
  {
    file: "parcel.png",
    lines: ["посылка"],
    subtitle: "собрала или уже уехала",
    titleSize: 168,
  },
  {
    file: "call.png",
    lines: ["звонок"],
    subtitle: "был или тишина",
    titleSize: 188,
  },
  {
    file: "night.png",
    lines: ["ночь"],
    subtitle: "напиши, если не спишь",
    titleSize: 200,
  },
  {
    file: "together.png",
    lines: ["мы ждём"],
    subtitle: "кидай свой день",
    titleSize: 176,
  },
  {
    file: "demob.png",
    lines: ["дембель"],
    subtitle: "дождалась",
    titleSize: 176,
  },
  {
    file: "first-day.png",
    lines: ["пошёл", "счёт"],
    subtitle: "первый день",
    titleSize: 176,
  },
];

async function main() {
  if (!fs.existsSync(fontFile)) {
    throw new Error(`Нет шрифта: ${fontFile}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const markWidth = await textWidth("ддд", 44);
  const sign = signature(markWidth);

  const jobs = [];

  for (const item of posters) {
    jobs.push(
      poster(item).then((body) => ({
        file: item.file,
        svg: svgDoc(`${body}\n  ${sign}`),
      })),
    );
  }

  jobs.push(
    choiceCard().then((body) => ({
      file: "poll.png",
      svg: svgDoc(`${body}\n  ${sign}`),
    })),
  );
  jobs.push(
    feedbackCard().then((body) => ({
      file: "feedback.png",
      svg: svgDoc(`${body}\n  ${sign}`),
    })),
  );
  for (const value of ["100", "30", "7", "1"]) {
    jobs.push(
      numberCard(value).then((body) => ({
        file: `milestone-${value}.png`,
        svg: svgDoc(`${body}\n  ${sign}`),
      })),
    );
  }

  const cards = await Promise.all(jobs);
  for (const card of cards) {
    const png = renderSvg(card.svg);
    const file = path.join(outDir, card.file);
    await sharp(png).png({ compressionLevel: 9 }).toFile(file);
    console.log(card.file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
