#!/usr/bin/env bash
# Запуск на сервере: npm ci, Postgres, разовый перенос JSON, перезапуск бота.
# .env и data/ не затираются. store.json остаётся на месте как копия.
set -euo pipefail

BOT_DIR="${BOT_DIR:-${HOME}/girly-ddd-bot}"
BOT_SYSTEMD_UNIT="${BOT_SYSTEMD_UNIT:-girly-ddd-bot}"

if [[ ! -f "${BOT_DIR}/package.json" ]]; then
  echo "Нет package.json в ${BOT_DIR}" >&2
  exit 1
fi

cd "${BOT_DIR}"
npm ci
bash "${BOT_DIR}/scripts/ensure-postgres.sh"

if systemctl --user is-active --quiet "${BOT_SYSTEMD_UNIT}" 2>/dev/null; then
  systemctl --user stop "${BOT_SYSTEMD_UNIT}"
fi

if ! npm run import-json; then
  echo "Перенос в Postgres не удался. Бот не запущен, store.json не тронут. Исправь ошибку и запусти деплой ещё раз." >&2
  exit 1
fi

if systemctl --user cat "${BOT_SYSTEMD_UNIT}" >/dev/null 2>&1; then
  systemctl --user start "${BOT_SYSTEMD_UNIT}"
  systemctl --user --no-pager status "${BOT_SYSTEMD_UNIT}" || true
else
  echo "Сервис ${BOT_SYSTEMD_UNIT} ещё не создан. Код обновлён, база готова. Первый раз: systemctl --user start ${BOT_SYSTEMD_UNIT}"
fi
