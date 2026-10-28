/**
 * Writes assets/app-icon/*.svg from LAYOUT, then renders PNGs.
 * Keep LAYOUT in sync with prototypes/app-icon/concept-wordmark.html.
 * Requires: npm i -D sharp @resvg/resvg-js
 *
 * Outputs (1024 unless noted):
 * - assets/icon.png — iOS / store / notifications reference
 * - assets/favicon.png — 48×48
 * - assets/splash-icon.png — splash (same master)
 * - assets/android-icon-foreground.png — adaptive fg (transparent)
 * - assets/android-icon-background.png — adaptive bg (cream)
 * - assets/android-icon-monochrome.png — themed icon (Android 13+)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconDir = path.join(root, "assets", "app-icon");
const assets = path.join(root, "assets");

const FONT_FAMILY = "Segoe UI";
const FONT_STACK = "Segoe UI, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
const windowsFonts = path.join(process.env.WINDIR || "C:\\Windows", "Fonts");
const fontFiles = ["segoeuib.ttf", "segoeui.ttf", "seguibl.ttf"]
  .map((name) => path.join(windowsFonts, name))
  .filter((file) => fs.existsSync(file));

/** Same numbers as LAYOUT in prototypes/app-icon/concept-wordmark.html */
const LAYOUT = {
  word: "\u0434\u0434\u0434",
  fontSize: 300,
  textY: 580,
  letterSpacing: "-0.04em",
  stripe: { x: 328, y: 650, w: 368, h: 18, rx: 9 },
};

function wordmarkMarkup({ fill, accent }) {
  const { word, fontSize, textY, letterSpacing, stripe } = LAYOUT;
  return [
    `<text x="512" y="${textY}" text-anchor="middle" font-size="${fontSize}" font-weight="800" fill="${fill}"`,
    `    font-family="${FONT_STACK}" letter-spacing="${letterSpacing}">${word}</text>`,
    `<rect x="${stripe.x}" y="${stripe.y}" width="${stripe.w}" height="${stripe.h}" rx="${stripe.rx}" fill="${accent}"/>`,
  ].join("\n  ");
}

function wrapSvg(inner, comment) {
  return [
    `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">`,
    `  <!-- ${comment} -->`,
    inner,
    `</svg>`,
    ``,
  ].join("\n");
}

function writeSourceSvgs() {
  fs.mkdirSync(iconDir, { recursive: true });
  const masterInner = [
    `<rect width="1024" height="1024" fill="#FCF7DF"/>`,
    wordmarkMarkup({ fill: "#3E3630", accent: "#e53935" }),
  ].join("\n  ");
  const scaled = (markup) =>
    `<g transform="translate(512 512) scale(0.68) translate(-512 -512)">\n    ${markup.replaceAll("\n  ", "\n    ")}\n  </g>`;

  fs.writeFileSync(
    path.join(iconDir, "icon-wordmark-ddd.svg"),
    wrapSvg(masterInner, "Wordmark ddd · ds-cream"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(iconDir, "icon-adaptive-foreground.svg"),
    wrapSvg(
      scaled(wordmarkMarkup({ fill: "#3E3630", accent: "#e53935" })),
      "Android adaptive foreground · safe zone ~66%",
    ),
    "utf8",
  );
  fs.writeFileSync(
    path.join(iconDir, "icon-adaptive-monochrome.svg"),
    wrapSvg(scaled(wordmarkMarkup({ fill: "#000000", accent: "#000000" })), "Android monochrome"),
    "utf8",
  );
}

function renderSvg(relativeName, width = 1024, height = 1024) {
  const svgPath = path.join(iconDir, relativeName);
  const svg = fs.readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: true,
      fontFiles,
      defaultFontFamily: FONT_FAMILY,
    },
  });
  const png = resvg.render().asPng();
  if (width === 1024 && height === 1024) return png;
  return sharp(png).resize(width, height).png().toBuffer();
}

async function writeSolidBackground(fileName, color) {
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toFile(path.join(assets, fileName));
}

async function main() {
  writeSourceSvgs();
  const master = await renderSvg("icon-wordmark-ddd.svg");
  const fg = await renderSvg("icon-adaptive-foreground.svg");
  const mono = await renderSvg("icon-adaptive-monochrome.svg");
  const favicon = await renderSvg("icon-wordmark-ddd.svg", 48, 48);

  const masterOpaque = await sharp(master).removeAlpha().png().toBuffer();
  await fs.promises.writeFile(path.join(assets, "icon.png"), masterOpaque);
  await fs.promises.writeFile(path.join(assets, "splash-icon.png"), masterOpaque);
  await fs.promises.writeFile(path.join(assets, "favicon.png"), favicon);
  await fs.promises.writeFile(path.join(assets, "android-icon-foreground.png"), fg);
  await fs.promises.writeFile(path.join(assets, "android-icon-monochrome.png"), mono);
  await writeSolidBackground("android-icon-background.png", "#FCF7DF");

  console.log("App icons written to assets/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
