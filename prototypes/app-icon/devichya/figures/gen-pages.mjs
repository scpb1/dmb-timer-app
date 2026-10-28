import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const items = [
  ["profile-wait", "Профиль", "Женский профиль, взгляд вправо — жду весточку. Красная точка — акцент."],
  ["standing", "Силуэт", "Стоит спиной/в три четверти, минимум деталей."],
  ["hands-folded", "Ладони", "Сложенные ладони, спокойное ожидание."],
  ["hands-heart", "Руки + сердце", "Две руки и красное сердце — держу любовь."],
  ["self-hug", "Обнимаю себя", "Силуэт обнимает себя — «держусь»."],
  ["window", "У окна", "Фигура в раме окна, красное солнце/закат."],
  ["hand-cheek", "Рука у щеки", "Портрет, руки у лица — скучаю."],
  ["hands-reach", "Руки друг к другу", "Две ладони: она (красная) и он (коричн.) — связь на расстоянии."],
  ["countdown-ring", "Кольцо", "Дуга отсчёта и сердце — таймер до demob."],
  ["envelope-seal", "Конверт", "Письмо с красной печатью — жду весточку."],
  ["sitting-knees", "На коленях", "Сижу, обняв колени — тихое ожидание."],
  ["wish-star", "Звезда", "Загадала — силуэт смотрит на звезду."],
  ["thread-link", "Нить", "Два круга и красная нить между нами."],
  ["mailbox", "Ящик", "Поднятый флаг — жду письмо."],
  ["moon-thought", "Луна", "Ночь, луна и силуэт у окна."],
  ["diary-pen", "Дневник", "Записываю дни службы."],
  ["sunrise-wait", "Рассвет", "Солнце над горизонтом — скоро домой."],
  ["phone-pulse", "Телефон", "Пульс вокруг экрана — жду звонок."],
];

function shell(draw, title, lead) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Девичья служба</title>
  <link rel="stylesheet" href="../../shared.css" />
</head>
<body data-draw="${draw}">
  <a class="back" href="index.html">← Силуэты и руки</a>
  <h1>${title}</h1>
  <p class="lead">${lead}</p>
  <div class="layout">
    <section class="panel">
      <h2>Светлый · тёмный</h2>
      <div class="hero-row">
        <div class="icon-wrap"><div class="icon-ios" data-icon-slot="light"></div><span>свет</span></div>
        <div class="icon-wrap"><div class="icon-ios" data-icon-slot="dark"></div><span>тёмный</span></div>
      </div>
      <div class="size-ladder" style="margin-top:1.25rem;">
        <figure><div class="slot size-60" data-icon-slot="light"></div><figcaption>60</figcaption></figure>
        <figure><div class="slot size-29" data-icon-slot="light"></div><figcaption>29</figcaption></figure>
      </div>
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
