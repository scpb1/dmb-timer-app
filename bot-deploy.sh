#!/usr/bin/env bash
# Деплой бота на Timeweb/VPS.
#   ./bot-deploy.sh          — залить папку bot/ с этого компьютера (без GitHub)
#   ./bot-deploy.sh git      — push в origin (если чисто) + git pull на сервере
#   ./bot-deploy.sh git --no-push — только pull на сервере
#
# Нужен Git Bash на Windows (или Linux/macOS). Один раз: cp .bot-deploy.env.example .bot-deploy.env

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${BOT_DEPLOY_ENV:-$ROOT/.bot-deploy.env}"

usage() {
  sed -n '2,7p' "$0"
  exit 1
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE — скопируй .bot-deploy.env.example в .bot-deploy.env и заполни IP/пользователя" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${BOT_DEPLOY_HOST:?BOT_DEPLOY_HOST в .bot-deploy.env}"
: "${BOT_DEPLOY_USER:?BOT_DEPLOY_USER в .bot-deploy.env}"
BOT_DEPLOY_PATH="${BOT_DEPLOY_PATH:-/home/deploy/girly-ddd-bot}"
BOT_SSH_PORT="${BOT_SSH_PORT:-22}"
BOT_SYSTEMD_UNIT="${BOT_SYSTEMD_UNIT:-girly-ddd-bot}"
BOT_REPO_DIR="${BOT_REPO_DIR:-/home/deploy/dmb-timer-app}"
BOT_GIT_URL="${BOT_GIT_URL:-https://github.com/scpb1/dmb-timer-app.git}"
BOT_GIT_BRANCH="${BOT_GIT_BRANCH:-main}"

SSH_TARGET="${BOT_DEPLOY_USER}@${BOT_DEPLOY_HOST}"
SSH_OPTS=(-p "$BOT_SSH_PORT" -o BatchMode=no)

MODE="${1:-local}"
NO_PUSH=0
if [[ "${2:-}" == "--no-push" ]] || [[ "${1:-}" == "--no-push" ]]; then
  NO_PUSH=1
  if [[ "$1" == "--no-push" ]]; then
    MODE="${2:-git}"
  fi
fi

run_remote_deploy() {
  local bot_dir="$1"
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
    "BOT_DIR='${bot_dir}' BOT_SYSTEMD_UNIT='${BOT_SYSTEMD_UNIT}' bash -s" \
    < "$ROOT/bot/scripts/deploy-on-server.sh"
}

deploy_local() {
  echo "→ Заливаю bot/ на ${SSH_TARGET}:${BOT_DEPLOY_PATH} (без .env, node_modules, data/)"

  tar -C "$ROOT/bot" \
    --exclude=node_modules \
    --exclude=data \
    --exclude=.env \
    --exclude=.cursor \
    -czf - . \
    | ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p '${BOT_DEPLOY_PATH}' && tar -xzf - -C '${BOT_DEPLOY_PATH}'"

  run_remote_deploy "$BOT_DEPLOY_PATH"
}

deploy_git() {
  if [[ "$NO_PUSH" -eq 0 ]]; then
    if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
      echo "В репозитории есть незакоммиченные изменения." >&2
      echo "Закоммить и push, или: ./bot-deploy.sh local" >&2
      exit 1
    fi
    echo "→ git push origin ${BOT_GIT_BRANCH}"
    git -C "$ROOT" push origin "$BOT_GIT_BRANCH"
  fi

  echo "→ На сервере: clone/pull + npm ci + restart"

  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s <<REMOTE
set -euo pipefail
REPO_DIR='${BOT_REPO_DIR}'
GIT_URL='${BOT_GIT_URL}'
BRANCH='${BOT_GIT_BRANCH}'
DEPLOY_PATH='${BOT_DEPLOY_PATH}'

if [[ ! -d "\$REPO_DIR/.git" ]]; then
  echo "Первый раз: клонирую только bot/ (sparse checkout)"
  mkdir -p "\$(dirname "\$REPO_DIR")"
  git clone --filter=blob:none --sparse "\$GIT_URL" "\$REPO_DIR"
  cd "\$REPO_DIR"
  git sparse-checkout set bot
else
  cd "\$REPO_DIR"
  git fetch origin "\$BRANCH"
  git checkout "\$BRANCH"
  git pull --ff-only origin "\$BRANCH"
fi

mkdir -p "\$DEPLOY_PATH"
rsync -a --delete \
  --exclude=node_modules \
  --exclude=data \
  --exclude=.env \
  "\$REPO_DIR/bot/" "\$DEPLOY_PATH/"

if [[ ! -f "\$DEPLOY_PATH/.env" ]] && [[ -f "\$DEPLOY_PATH/.env.example" ]]; then
  echo "Напоминание: создай \$DEPLOY_PATH/.env на сервере (токен не из git)"
fi
REMOTE

  run_remote_deploy "$BOT_DEPLOY_PATH"
}

case "$MODE" in
  local) deploy_local ;;
  git) deploy_git ;;
  -h | --help | help) usage ;;
  *)
    echo "Неизвестный режим: $MODE (local | git)" >&2
    usage
    ;;
esac

echo "Готово."