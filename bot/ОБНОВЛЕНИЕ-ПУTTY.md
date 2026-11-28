# Часть E. Обновление бота (PuTTY + GitHub)

Инструкция для себя: что делать **каждый раз**, когда меняется код в папке `bot/`.

Carwash в `/opt` и Docker **не трогаем**.

---

## Перед первым использованием

Один раз должны быть сделаны части A–D:

- бот в `~/girly-ddd-bot`, `.env`, systemd `girly-ddd-bot`;
- `bash ~/girly-ddd-bot/scripts/server-update.sh setup-git` уже выполнен;
- `server-update.sh` отрабатывает без fatal-ошибок.

Если это ещё не так — см. полный чеклист в чате или `bot/DEPLOY-PUTTY.md`.

---

## E1. На своём ПК

1. Правишь код в `dmb-timer-app/bot/`.
2. Коммит.
3. **Push** в ветку `main` на GitHub:

```bash
git push origin main
```

Пока нет push на GitHub, сервер старую версию не получит.

Можно через IDE (Cursor / VS Code) вместо терминала — важно, чтобы изменения `bot/` оказались в `main` на GitHub.

---

## E2. В PuTTY (одна команда)

Войди как пользователь **deploy**, затем:

```bash
bash ~/girly-ddd-bot/scripts/server-update.sh
```

Скрипт сам:

- делает `git pull` в `~/dmb-timer-app`;
- копирует `bot/` в `~/girly-ddd-bot` (не затирает `.env` и `data/`);
- запускает `npm ci`;
- при первом таком деплое ставит PostgreSQL, если его ещё нет и есть `sudo` без пароля, создаёт базу и один раз переносит `data/store.json`;
- следующие деплои перенос пропускают;
- останавливает бота на время переноса и снова запускает `girly-ddd-bot`.

Подожди 1–2 минуты, пока идёт `npm ci`.

---

## E3. Проверка

```bash
systemctl --user status girly-ddd-bot
```

Нужно: **Active: active (running)**. Выйти из экрана статуса: **q**.

Логи:

```bash
journalctl --user -u girly-ddd-bot -n 40 --no-pager
```

В Telegram в **личке** боту — `/start` или команда, которую меняла.

---

## E4. Если бот не отвечает после обновления

По порядку в PuTTY:

```bash
journalctl --user -u girly-ddd-bot -n 50 --no-pager
```

```bash
systemctl --user stop girly-ddd-bot
cd ~/girly-ddd-bot
npm start
```

- Если `npm start` работает — смотри unit-файл systemd (`ExecStart`, путь к `npm`).
- Если `npm start` падает — ошибка в коде или `.env`.

Остановить ручной запуск: **Ctrl+C**, затем:

```bash
systemctl --user start girly-ddd-bot
```

---

## Только правка `.env` (без GitHub)

Токен, `ADMIN_CHAT_ID`, канал и т.п.:

```bash
nano ~/girly-ddd-bot/.env
```

Сохранить: **Ctrl+O**, Enter, **Ctrl+X**.

```bash
systemctl --user restart girly-ddd-bot
```

`server-update.sh` в этом случае **не** нужен.

---

## Шпаргалка

| Где | Что сделать |
|-----|-------------|
| ПК | commit + push в `main` |
| PuTTY | `bash ~/girly-ddd-bot/scripts/server-update.sh` |
| PuTTY | `systemctl --user status girly-ddd-bot` |
| PuTTY | `journalctl --user -u girly-ddd-bot -n 40 --no-pager` |

---

## Нельзя

- Лезть в `/opt/carwash`, останавливать контейнеры carwash.
- Удалять на сервере `~/girly-ddd-bot/.env` (там токен и `DATABASE_URL`) и папку `~/girly-ddd-bot/data/` (копия до переноса в Postgres).