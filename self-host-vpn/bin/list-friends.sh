#!/usr/bin/env bash
# 列出目前所有朋友（內網IP 名字）
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f /etc/location-mitm/env ] && { set -a; . /etc/location-mitm/env; set +a; }
node "$DIR/bin/provision-cli.mjs" list
