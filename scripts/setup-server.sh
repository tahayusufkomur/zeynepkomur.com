#!/bin/bash
# First-time server setup. Run from local machine:
#   ssh root@<IP> 'bash -s' < scripts/setup-server.sh
#
# Requires GITHUB_TOKEN and REPO env vars to be set, e.g.:
#   GITHUB_TOKEN=ghp_xxx REPO=user/repo ssh root@<IP> 'bash -s' < scripts/setup-server.sh

set -euo pipefail

GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
REPO="${REPO:?REPO is required}"
APP_DIR="/opt/zeynepkomur"

echo "==> Waiting for cloud-init to finish..."
cloud-init status --wait 2>/dev/null || true

echo "==> Cloning repo..."
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "https://${GITHUB_TOKEN}@github.com/${REPO}.git" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull origin main
fi

echo "==> Server setup complete."
echo "    Next steps:"
echo "    1. scp .env.prod root@<IP>:${APP_DIR}/.env.prod"
echo "    2. ssh root@<IP> 'cd ${APP_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d'"
