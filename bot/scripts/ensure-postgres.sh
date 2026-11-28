#!/usr/bin/env bash
# Один раз поднимает PostgreSQL и дописывает DATABASE_URL в .env.
# Повторный запуск ничего не меняет, если строка уже есть.
set -euo pipefail

BOT_DIR="${BOT_DIR:-${HOME}/girly-ddd-bot}"
cd "${BOT_DIR}"

if [[ ! -f .env ]]; then
  echo "Нет ${BOT_DIR}/.env" >&2
  exit 1
fi

existing="$(grep -E '^DATABASE_URL=' .env | head -n 1 || true)"
if [[ -n "${existing}" && "${existing}" != "DATABASE_URL=" ]]; then
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  if ! sudo -n true >/dev/null 2>&1; then
    echo "На сервере нет PostgreSQL и нет sudo без пароля. Один раз выполни sudo apt-get install -y postgresql и повтори деплой." >&2
    exit 1
  fi
  sudo -n apt-get update
  sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql
fi

if command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active --quiet postgresql 2>/dev/null; then
    sudo -n systemctl enable --now postgresql
  fi
fi

if ! sudo -n true >/dev/null 2>&1; then
  echo "Нужен sudo без пароля, чтобы создать роль girly_bot и базу girly_ddd. Повтори деплой после этого." >&2
  exit 1
fi

db_name="girly_ddd"
db_user="girly_bot"
password="$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))")"

sudo -n -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$body\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${db_user}') THEN
    CREATE ROLE ${db_user} LOGIN PASSWORD '${password}';
  ELSE
    ALTER ROLE ${db_user} WITH LOGIN PASSWORD '${password}';
  END IF;
END
\$body\$;
SQL

if ! sudo -n -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${db_name}'" | grep -q 1; then
  sudo -n -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${db_name} OWNER ${db_user}"
fi

sudo -n -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER DATABASE ${db_name} OWNER TO ${db_user}"
sudo -n -u postgres psql -d "${db_name}" -v ON_ERROR_STOP=1 -c "ALTER SCHEMA public OWNER TO ${db_user}"

encoded="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "${password}")"
grep -v -E '^DATABASE_URL=' .env > .env.tmp || true
mv .env.tmp .env
printf '\nDATABASE_URL=postgres://%s:%s@127.0.0.1:5432/%s\n' "${db_user}" "${encoded}" "${db_name}" >> .env
echo "PostgreSQL готов, DATABASE_URL записан в .env"
