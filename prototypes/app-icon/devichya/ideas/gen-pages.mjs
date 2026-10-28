import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const items = [
  ["bow-center", "01 · Только бант", "Красный бант по центру на кремовом — чистый знак бренда."],
  ["heart-bow", "02 · Сердце + бант", "Коричневое сердце, бант сверху — жду человека."],
  ["envelope-bow", "03 · Конверт + бант", "Письма и дневник, бант на конверте."],
  ["home-bow", "04 · Дом + бант", "Домой жду, без текста."],
  ["rings", "05 · Два кольца", "Связь: коричневое и красное кольцо, бант сверху."],
  ["calendar", "06 · Календарь", "Отмечаю дни, бант на углу листа."],
  ["ribbon-cross", "07 · Ленты + бант", "Перекрещённые ленты «службы», бант в центре."],
  ["d-bow", "08 · Д + бант", "«Д» от «Девичья», бант справа сверху."],
  ["path-heart", "09 · Дорога", "Линия времени к сердцу, бант у старта."],
];

function shell(draw, title, lead) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="../../shared.css" />
</head>
<body data-draw="${draw}">
  <a class="back" href="index.html">← Идеи</a>
  <h1>${title}</h1>
  <p class="lead">${lead} Название приложения: <strong>Девичья служба</strong>.</p>
  <div class="layout">
    <section class="panel">
      <h2>Светлый фон</h2>
      <div class="hero-row">
        <div class="icon-wrap"><div class="icon-ios" data-icon-slot="light"></div></div>
        <div class="size-ladder">
          <figure><div class="slot size-60" data-icon-slot="light"></div><figcaption>60</figcaption></figure>
          <figure><div class="slot size-29" data-icon-slot="light"></div><figcaption>29</figcaption></figure>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Тёмный фон</h2>
      <div class="hero-row"><div class="icon-wrap"><div class="icon-ios" data-icon-slot="dark"></div></div></div>
    </section>
    <section class="panel">
      <h2>Домашний экран</h2>
      <div class="phone-grid">
        <div class="phone light-wallpaper">
          <div class="phone-screen">
            <div class="phone-status"><span>9:41</span><span>●●●</span></div>
            <div class="app-grid">
              <div class="app-item target"><div class="icon-ios" data-icon-slot="light"></div><span class="label">Д. служба</span></div>
              <div class="app-item filler"><div class="icon-ios"></div><span class="label">Сообщения</span></div>
              <div class="app-item filler"><div class="icon-ios"></div><span class="label">Фото</span></div>
              <div class="app-item filler"><div class="icon-ios"></div><span class="label">Календарь</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="panel">
      <h2>Сплэш</h2>
      <div class="splash-preview light">
        <div class="icon-ios" data-icon-slot="light"></div>
        <div class="word">Девичья служба</div>
      </div>
    </section>
  </div>
  <script src="../shared-bow.js"></script>
  <script src="drawers.js"></script>
  <script src="boot.js"></script>
</body>
</html>
`;
}

for (const [d, t, l] of items) {
  fs.writeFileSync(path.join(dir, `${d}.html`), shell(d, t, l));
}
