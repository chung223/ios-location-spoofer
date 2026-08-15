#!/usr/bin/env bash
# 踢掉一個朋友：移除鑰匙 + IP + 描述檔。用法：sudo ./revoke-friend.sh <代號>
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "請用 sudo 執行"; exit 1; }
[ -n "${1:-}" ] || { echo "用法：sudo $0 <朋友代號>"; exit 1; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f /etc/location-mitm/env ] && { set -a; . /etc/location-mitm/env; set +a; }
node "$DIR/bin/provision-cli.mjs" revoke "$1"
