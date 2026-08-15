#!/usr/bin/env bash
# 開一個朋友：產生 VPN 鑰匙 + 固定內網 IP + .mobileconfig。用法：sudo ./add-friend.sh <代號>
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "請用 sudo 執行"; exit 1; }
[ -n "${1:-}" ] || { echo "用法：sudo $0 <朋友代號，英文/數字>"; exit 1; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f /etc/location-mitm/env ] && { set -a; . /etc/location-mitm/env; set +a; }
node "$DIR/bin/provision-cli.mjs" add "$1"
