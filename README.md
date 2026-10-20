# Счётчик ДДД

Приложение для ожидания службы: таймер до дембеля, дневник, письма, события и трекеры звонков и встреч.

Только **Android и iOS**, только телефон, только портрет. Веб не поддерживается: SQLite, SecureStore и виджет рабочего стола на нём не работают. Планшеты выключены специально — вёрстка под телефон, отдельный iPad-макет не делали.

## Требования

- Node 20
- Expo SDK **51** — документация: https://docs.expo.dev/versions/v51.0.0/
- Development client (`expo-dev-client`), не Expo Go

## Запуск

```bash
npm install
npm start
npm run android
```

На macOS: `npm run ios`.

## Тесты и проверка типов

```bash
npm test
npm run typecheck
```

Покрыты чистые расчёты: фазы таймера и ддд, склонения, праздники, статистика трекеров, HTML книги писем. UI и нативные модули руками.

## Сборка EAS

В `app.json` нет `projectId` — заглушку убрали, иначе прод-сборка падала бы на фейковом id.

Первый раз привязать проект:

```bash
npx eas init
eas build --profile production
```

Профили лежат в `eas.json`: `development` (dev client), `preview`, `production`.
