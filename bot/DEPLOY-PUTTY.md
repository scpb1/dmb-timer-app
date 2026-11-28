# Обновление бота через PuTTY (и WinSCP)

Подходит, если второй проект на сервере ты тоже обновляешь из PuTTY, без Git Bash на Windows.

## Один раз

1. Как в основной инструкции: папка `~/girly-ddd-bot`, `.env`, systemd `girly-ddd-bot`.
2. WinSCP — дозалить на сервер папку `bot/scripts/` (чтобы был `server-update.sh`).
3. В PuTTY:

```bash
chmod +x ~/girly-ddd-bot/scripts/*.sh
bash ~/girly-ddd-bot/scripts/server-update.sh setup-git
```

`setup-git` клонирует репозиторий в `~/dmb-timer-app` (на диске только каталог `bot/`) и при первом `pull` скопирует код в `~/girly-ddd-bot`. Файлы `.env` и `data/` не трогаются.

Если репозиторий на GitHub приватный, на сервере настрой доступ (SSH-ключ `deploy` или deploy token). Публичный репозиторий работает без лишних шагов.

## Каждое обновление (как «зашла в PuTTY — git pull — перезапустил»)

На **своём ПК**: закоммить и **push** изменений в `bot/` на GitHub.

В **PuTTY**:

```bash
bash ~/girly-ddd-bot/scripts/server-update.sh
```

Скрипт сделает `git pull`, обновит файлы в `~/girly-ddd-bot`, `npm ci`. На первом деплое с этой версией сам создаст базу PostgreSQL и один раз перенесёт `data/store.json`. Дальше перенос пропускается. Потом бот запускается снова. Для установки PostgreSQL нужен `sudo` без пароля, если сервера базы ещё нет.

Проверка:

```bash
systemctl --user status girly-ddd-bot
journalctl --user -u girly-ddd-bot -n 30 --no-pager
```

## Если правки заливаешь WinSCP, без GitHub

1. WinSCP → `/home/deploy/girly-ddd-bot`, перезаписать изменённые файлы (не трогать `.env` и `data/`).
2. PuTTY:

```bash
bash ~/girly-ddd-bot/scripts/server-update.sh reload
```

Только `npm ci` и перезапуск.

## Настройки путей (если другие)

```bash
mkdir -p ~/.config/girly-ddd-bot
nano ~/.config/girly-ddd-bot/deploy.env
```

Пример — в `bot/scripts/deploy.env.example`.

## Git Bash и `bot-deploy.sh`

С ПК одной командой (ssh с Windows) — корневой `bot-deploy.sh`. Для PuTTY это **не обязательно**: достаточно схемы **push с ПК → `server-update.sh` в PuTTY**, как у многих проектов на VPS.