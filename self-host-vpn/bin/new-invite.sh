#!/usr/bin/env bash
# 產生一條一次性邀請連結。用法：sudo ./new-invite.sh [天數，預設7]
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "請用 sudo 執行"; exit 1; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f /etc/location-mitm/env ] && { set -a; . /etc/location-mitm/env; set +a; }
node "$DIR/bin/invite-cli.mjs" "${1:-7}"
