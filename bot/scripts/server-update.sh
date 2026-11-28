#!/usr/bin/env bash
# Запуск только в PuTTY (на сервере под пользователем deploy).
#
#   bash ~/girly-ddd-bot/scripts/server-update.sh          — git pull + обновить код + npm ci + postgres + restart
#   bash ~/girly-ddd-bot/scripts/server-update.sh reload   — только npm ci + restart (после WinSCP)
#   bash ~/girly-ddd-bot/scripts/server-update.sh setup-git — один раз: клон репозитория (только bot/)
#
# Настройки (по желанию) в ~/.config/girly-ddd-bot/deploy.env

set -euo pipefail

CONFIG="${BOT_SERVER_CONFIG:-$HOME/.config/girly-ddd-bot/deploy.env}"
if [[ -f "$CONFIG" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG"
fi

BOT_DIR="${BOT_DIR:-$HOME/girly-ddd-bot}"
REPO_DIR="${BOT_REPO_DIR:-$HOME/dmb-timer-app}"
GIT_URL="${BOT_GIT_URL:-https://github.com/scpb1/dmb-timer-app.git}"
GIT_BRANCH="${BOT_GIT_BRANCH:-main}"
BOT_SYSTEMD_UNIT="${BOT_SYSTEMD_UNIT:-girly-ddd-bot}"

sync_bot_from_repo() {
  mkdir -p "$BOT_DIR"
  rsync -a --delete \
    --exclude=node_modules \
    --exclude=data \
    --exclude=.env \
    "${REPO_DIR}/bot/" "${BOT_DIR}/"
}

run_deploy() {
  export BOT_DIR BOT_SYSTEMD_UNIT
  bash "${BOT_DIR}/scripts/deploy-on-server.sh"
}

cmd_setup_git() {
  if [[ -d "${REPO_DIR}/.git" ]]; then
    echo "Репозиторий уже есть: ${REPO_DIR}"
    return 0
  fi
  mkdir -p "$(dirname "$REPO_DIR")"
  git clone --filter=blob:none --sparse "$GIT_URL" "$REPO_DIR"
  cd "$REPO_DIR"
  git sparse-checkout set bot
  echo "Готово. Дальше: bash ${BOT_DIR}/scripts/server-update.sh"
}

cmd_pull() {
  if [[ ! -d "${REPO_DIR}/.git" ]]; then
    echo "Сначала один раз: bash ${BOT_DIR}/scripts/server-update.sh setup-git" >&2
    exit 1
  fi
  cd "$REPO_DIR"
  git fetch origin "$GIT_BRANCH"
  git checkout "$GIT_BRANCH"
  git pull --ff-only origin "$GIT_BRANCH"
  sync_bot_from_repo
  run_deploy
}

cmd_reload() {
  run_deploy
}

ACTION="${1:-pull}"

case "$ACTION" in
  setup-git) cmd_setup_git ;;
  pull | "") cmd_pull ;;
  reload) cmd_reload ;;
  *)
    echo "Использование: server-update.sh [pull | reload | setup-git]" >&2
    exit 1
    ;;
esac