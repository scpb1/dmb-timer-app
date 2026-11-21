/**
 * Wordmark «ддд» + полоска — те же числа, что в prototypes/app-icon/concept-wordmark.html
 * и assets/app-icon (generate-app-icons.mjs).
 */
/* eslint-env browser */
const WORDMARK_LAYOUT = {
  word: "ддд",
  fontSize: 300,
  textY: 580,
  letterSpacing: "-0.04em",
  stripe: { x: 328, y: 650, w: 368, h: 18, rx: 9 },
  /** Кадр подписи (координаты мастер-иконки 1024×1024). */
  crop: { x: 288, y: 352, w: 448, h: 336 },
};

const WORDMARK_FONT = "dmb-timer-sans-Bold";
const WORDMARK_INK = "#3E3630";
const WORDMARK_ACCENT = "#e53935";

function wordmarkSvg() {
  const { word, fontSize, textY, letterSpacing, stripe, crop } = WORDMARK_LAYOUT;
  const { x, y, w, h } = crop;
  return `<svg viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <text x="512" y="${textY}" text-anchor="middle" font-size="${fontSize}" font-weight="800"
    fill="${WORDMARK_INK}" font-family="${WORDMARK_FONT}, system-ui, sans-serif" letter-spacing="${letterSpacing}">${word}</text>
  <rect x="${stripe.x}" y="${stripe.y}" width="${stripe.w}" height="${stripe.h}" rx="${stripe.rx}" fill="${WORDMARK_ACCENT}"/>
</svg>`;
}

function mountWordmark(el) {
  if (!el) return;
  el.innerHTML = wordmarkSvg();
}

function mountAllWordmarks() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-wordmark]").forEach(mountWordmark);
}

if (typeof window !== "undefined") {
  window.WORDMARK_LAYOUT = WORDMARK_LAYOUT;
  window.mountWordmark = mountWordmark;
  window.mountAllWordmarks = mountAllWordmarks;
}