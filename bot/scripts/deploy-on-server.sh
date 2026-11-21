#!/usr/bin/env bash
# Запуск на сервере: npm ci + перезапуск бота. .env и data/ не трогаем.
set -euo pipefail

BOT_DIR="${BOT_DIR:-${HOME}/girly-ddd-bot}"
BOT_SYSTEMD_UNIT="${BOT_SYSTEMD_UNIT:-girly-ddd-bot}"

if [[ ! -f "${BOT_DIR}/package.json" ]]; then
  echo "Нет package.json в ${BOT_DIR}" >&2
  exit 1
fi

cd "${BOT_DIR}"
npm ci

if systemctl --user is-active --quiet "${BOT_SYSTEMD_UNIT}" 2>/dev/null; then
  systemctl --user restart "${BOT_SYSTEMD_UNIT}"
  systemctl --user --no-pager status "${BOT_SYSTEMD_UNIT}" || true
else
  echo "Сервис ${BOT_SYSTEMD_UNIT} не запущен. Первый раз: systemctl --user start ${BOT_SYSTEMD_UNIT}"
  echo "Код обновлён в ${BOT_DIR}, npm ci выполнен."
fi