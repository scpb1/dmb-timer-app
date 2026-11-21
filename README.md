# Счётчик ДДД

Мобильное приложение для близких военнослужащих: обратный отсчёт до демобилизации, личные записи, письма, календарь событий и вспомогательные разделы (посылки, трекеры звонков/встреч, виджеты, «Опора»). Данные хранятся локально на устройстве.

**Платформы:** только Android и iOS, только телефон, только портрет. Веб не поддерживается (SQLite, SecureStore и виджеты на нём недоступны). Планшеты отключены в конфиге (`app.json`).

В корне — **Expo-приложение** (`schetchik-ddd`). Отдельно лежит **Telegram-бот** в каталоге `bot/` (свой `package.json`).

---

## Основной функционал

- **Таймер службы** — фазы до призыва / в строю / после демобиля; круг, линия, рамка, сетка дней; плашки «прошло / осталось»; дополнительные пользовательские таймеры; фото-фон, темы оформления, экспорт картинки и чеклиста.
- **Онбординг** — имя, даты призыва и демобиля, пресеты срока (365 / 547 дней), озвучка (`expo-av`).
- **События и праздники** — единая лента, фильтры, привязка к темам писем; локальные push в полночь (`expo-notifications`).
- **Дневник** — личный дневник (PIN + опционально биометрия) и дневник писем солдату; темы дня, редактор, PDF-книга писем (`expo-print`).
- **Посылки и передачки** — учёт отправленного/собираемого, напоминания.
- **Трекеры** — календарь, звонки и встречи с фото/аудио/видео.
- **Виджеты (Android)** — студия превью и настройки; на рабочий стол — таймер, праздник, статистика (`react-native-android-widget`).
- **Опора** — flip-карточки с подсказками (статические данные в `src/data/supportCards.ts`).
- **Песочница** — отдельный профиль БД для демо/тестов (`src/services/database/profile.ts`).

Подробнее по модулям: `docs/timer.md`, `docs/diary.md`, `docs/events.md`, `docs/letter-themes.md`, `docs/military-branches.md`.

---

## Стек технологий

| Слой | Технологии |
| --- | --- |
| Платформа | [Expo SDK 51](https://docs.expo.dev/versions/v51.0.0/), `expo-dev-client` (не Expo Go) |
| UI | React 18.2, React Native 0.74.5, TypeScript 5.3 |
| Навигация | React Navigation 6 (bottom tabs, stack) |
| Состояние | React hooks; **Zustand** — трекеры (`src/stores/useTrackerStore.ts`) |
| Данные | **expo-sqlite** (config + дневник), **expo-secure-store** (PIN дневника) |
| Даты | **date-fns**, `@react-native-community/datetimepicker` |
| Медиа и файлы | `expo-image-picker`, `expo-file-system`, `expo-media-library`, `expo-document-picker`, `expo-av`, `react-native-view-shot`, `expo-sharing`, `expo-print` |
| Безопасность / система | `expo-local-authentication`, `expo-crypto`, `expo-notifications` |
| Графика | `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler` |
| Виджеты | `react-native-android-widget` |
| Сборка | EAS (`eas.json`), config plugin `plugins/withLocalSqliteAmalgamation.js` (локальный SQLite для Android) |
| Качество | Jest + ts-jest, ESLint (`eslint-config-expo`), GitHub Actions (Node 20) |
| Бот | Grammy, dotenv, tsx (`bot/`) |

---

## Структура проекта

```
dmb-timer-app/
├── App.tsx                 # Корень UI: шрифты, SafeArea, RootNavigator
├── index.ts                # Точка входа Expo; регистрация Android widget handler
├── app.json                # Базовая конфигурация Expo (имя, permissions, plugins)
├── app.config.js           # Вариант development: отдельный package/bundle id
├── assets/                 # Иконки, splash, шрифты, onboarding-аудио
├── docs/                   # Документация по экранам и модулям
├── plugins/                # Expo config plugins (SQLite amalgamation)
├── prototypes/             # HTML-прототипы UI (настройки таймера)
├── scripts/                # Генерация иконок и тем писем
├── vendor/                 # sqlite-amalgamation zip для офлайн-сборок
├── .github/workflows/      # CI: typecheck, lint, test
├── bot/                    # Telegram-бот (отдельный npm-проект)
└── src/
    ├── components/         # UI по доменам: timer, diary, events, parcels, trackers, …
    ├── constants/          # Имя приложения, FEATURES, пресеты срока службы
    ├── data/               # Статические данные (карточки «Опора»)
    ├── hooks/              # Загрузка профиля, таймера, событий, дневника, виджетов
    ├── navigation/         # Root, вкладки, стеки «Главная» и «Дневник»
    ├── screens/            # Экраны по разделам
    ├── services/           # БД, пуши праздников, блокировка дневника
    ├── stores/             # Zustand (трекеры)
    ├── theme/              # Палитры, ThemeProvider, типографика
    ├── types/              # Типы и ключи config в SQLite
    ├── utils/              # Расчёты, экспорт, виджеты, уведомления; __tests__
    └── widgets/            # Обработчик задач Android-виджетов
```

Каталогов `android/` и `ios/` в репозитории нет — нативные проекты появляются после `expo prebuild` / `expo run:*`.

---

## Установка и запуск

### Требования

- **Node.js 20** (как в `.github/workflows/ci.yml`)
- npm
- Для локального нативного запуска: Android SDK и/или Xcode (macOS для iOS)
- **Development client** — приложение со встроенными нативными модулями; обычный Expo Go не подходит

Документация Expo для этого репозитория: [Expo SDK 51](https://docs.expo.dev/versions/v51.0.0/).

### Мобильное приложение

```bash
cd C:\Users\anwxcr\source\repos\dmb-timer-app
npm install
npm start
```

Metro с development client. На устройстве или эмуляторе:

```bash
npm run android
```

На macOS:

```bash
npm run ios:dev
```

(или `expo run:ios` после установки dev client — в `package.json` явно задан только `ios:dev` с `APP_VARIANT=development`.)

Первый нативный билд подтягивает зависимости и плагины из `app.json` (SQLite, виджеты, биометрия и т.д.).

### Параллельная dev-сборка рядом с продом

Переменная **`APP_VARIANT=development`** (или профиль EAS `development`) переключает `app.config.js`:

| | Production | Development |
| --- | --- | --- |
| Имя | Счётчик ДДД | girly-ddd |
| Android package | `com.zhdi.app` | `com.girlyddd.dev` |
| iOS bundle | `com.zhdi.app` | `com.girlyddd.dev` |

Локально:

```bash
npm run android:dev
npm run start:dev
```

Через EAS (нужен установленный EAS CLI и аккаунт Expo):

```bash
eas build --profile development --platform android
```

У dev-варианта **отдельные** БД и SecureStore — продовый APK не перезаписывается.

Для Metro на физическом устройстве: одна Wi‑Fi сеть или `adb reverse tcp:8081 tcp:8081`.

### Переменные окружения (приложение)

| Переменная | Где задаётся | Назначение |
| --- | --- | --- |
| `APP_VARIANT=development` | `npm run start:dev`, `android:dev`, `ios:dev`; `eas.json` → `build.development` | Отдельный идентификатор приложения |
| `EAS_BUILD_PROFILE=development` | EAS Build | То же при облачной сборке dev client |

Файла `.env` для основного приложения нет.

### Сборка релиза (EAS)

В `app.json` → `extra.eas.projectId` уже прописан project id. Профили: `eas.json` — `development`, `preview` (internal APK на Android), `production` (autoIncrement версии).

```bash
eas build --profile production --platform android
```

Android-сборка использует SQLite из `vendor/sqlite-amalgamation-3450300.zip`, чтобы не зависеть от доступности sqlite.org на билд-сервере.

### Telegram-бот (`bot/`)

```bash
cd bot
npm install
cp .env.example .env
# заполнить BOT_TOKEN и при необходимости CHANNEL_USERNAME, ADMIN_USERNAME, TZ
npm run dev
```

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `BOT_TOKEN` | да | Токен от BotFather |
| `CHANNEL_USERNAME` | да | Канал для проверки подписки (по умолчанию в примере: `girly_ddd`) |
| `ADMIN_USERNAME` | да | Куда уходят отзывы |
| `ADMIN_CHAT_ID` | нет | Числовой id админа |
| `TZ` | нет | Часовой пояс (по умолчанию `Europe/Moscow`) |

### Проверки качества

```bash
npm test
npm run typecheck
npm run lint
```

Jest покрывает в основном чистые функции (`src/**/__tests__`). UI и нативные модули проверяются вручную на устройстве.

---

## Скрипты (`package.json`)

| Скрипт | Команда | Назначение |
| --- | --- | --- |
| `start` | `expo start --dev-client` | Metro для development client |
| `start:dev` | `APP_VARIANT=development` + то же | Metro под dev-приложение **girly-ddd** |
| `android` | `expo run:android` | Сборка и запуск Android (prod id) |
| `android:dev` | `APP_VARIANT=development` + `expo run:android` | Android dev client |
| `ios:dev` | `APP_VARIANT=development` + `expo run:ios` | iOS dev client |
| `test` | `jest` | Юнит-тесты |
| `typecheck` | `tsc --noEmit` | Проверка TypeScript |
| `lint` | `expo lint` | ESLint |
| `generate:icons` | `node scripts/generate-app-icons.mjs` | Генерация иконок приложения |

В `scripts/` также есть `generate_letter_themes.mjs` / `.py` — **без** npm-скрипта; запуск вручную при обновлении тем писем.

### Скрипты бота (`bot/package.json`)

| Скрипт | Назначение |
| --- | --- |
| `start` | Запуск бота (`tsx src/index.ts`) |
| `dev` | То же с `tsx watch` |

---

## Модули и функции на стадии зарождения

Флаги в `src/constants/features.ts` (`FEATURES`). При `false` UI скрыт или упрощён, код обычно остаётся в репозитории.

| Флаг | Состояние по умолчанию | Смысл |
| --- | --- | --- |
| `widgets` | `false` | Регистрация handler Android-виджетов в `index.ts`; часть настроек в таймере |
| `biometrics` | `false` | Переключатели Face ID / отпечаток в дневнике |
| `showShopTab` | `false` | Вкладка «Магазин» (заглушка) |
| `showTrackersTab` | `false` | Пункт «Трекеры» в «Ещё» и экран вкладки. Код экрана остаётся в репозитории |
| `diaryPlaceholder` | `false` | Вместо дневника — заглушка «в разработке» |
| `showPhotoElementBorderSwitches` | `false` | Окантовка «Событие» / «Таймер» на фото-фоне |
| `milestonesChipsLayout` | `false` | Горизонтальные «плитки» в ленте вех |
| `letterNotifications` | `false` | Push «написать письмо» |
| `letterBookHomeEntry` | `false` | Карточка «Книга писем» на экране дневника |
| `legacySummaryStats` | `false` | Старые блоки статистики в итогах службы |
| `timerSettingsSaveDatesOverlay` | `false` | Overlay «Сохранение…» при сохранении дат службы |

**Магазин** — экран-заглушка, подключается только при `showShopTab: true`.

**Прототипы** в `prototypes/timer/settings/` — статические HTML-макеты настроек таймера, не входят в сборку приложения.

**Бот** (`bot/`, версия `0.1.0`) — компаньон к каналу: срок службы и праздники в Telegram; развивается отдельно от мобильного клиента.

---

## Лицензия и публикация

Проект помечен `"private": true` в `package.json`. Перед публикацией в сторы проверьте идентификаторы в `app.json` и политики разрешений (камера, микрофон, медиатека, биометрия).