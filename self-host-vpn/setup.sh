#!/usr/bin/env bash
# =============================================================================
# self-host-vpn 一鍵安裝（Oracle Linux 9.x / RHEL9 系）
#
#   picker(server.js) + MITM proxy + 邀請碼 portal + strongSwan(IKEv2) + dnsmasq
#   + nftables + Caddy(自動 Let's Encrypt)。全部在這一台，對外只認 fly.chung.men。
#
# ⚠️ 這是「首版」腳本，VPN/MITM 這類東西沒法在開發機驗證，上機第一次八成要一起微調。
#    每一步都會 echo 在做什麼，出錯就把畫面貼回來。
#
# 用法：  sudo bash self-host-vpn/setup.sh
#         （先把 DNS：SERVER_NAME 的 A 記錄指到本機公網 IP，Caddy 才發得了憑證）
# 授權：AGPL-3.0
# =============================================================================
set -euo pipefail

# ---- 可調設定（也可先 export 覆蓋）----
SERVER_NAME="${SERVER_NAME:-fly.chung.men}"
IP_PREFIX="${IP_PREFIX:-10.9.0}"          # VPN 內網網段（/24）
GW_IP="${GW_IP:-${IP_PREFIX}.1}"          # VPN 閘道（本機在 VPN 內的 IP）
PICKER_PORT="${PICKER_PORT:-8080}"
PORTAL_PORT="${PORTAL_PORT:-8090}"
MITM_PORT="${MITM_PORT:-8443}"
CA_CN="${CA_CN:-Location CA}"
ETC=/etc/location-mitm
CERTS=$ETC/certs

[ "$(id -u)" -eq 0 ] || { echo "請用 sudo 執行"; exit 1; }
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WAN_IF="${WAN_IF:-$(ip route show default 2>/dev/null | awk '/default/{print $5; exit}')}"
[ -n "$WAN_IF" ] || { echo "偵測不到對外網卡，請 export WAN_IF=<網卡名> 再跑"; exit 1; }

echo "== 設定 =="
echo "   SERVER_NAME=$SERVER_NAME  WAN_IF=$WAN_IF  VPN=$IP_PREFIX.0/24  gw=$GW_IP"
echo "   REPO_DIR=$REPO_DIR"

# ---- 1) 目錄 + 隨機權杖 ----
mkdir -p "$ETC" "$CERTS" "$ETC/mobileconfigs" /var/lib/location /etc/swanctl/{conf.d,x509,x509ca,private}
PICKER_TOKEN="${PICKER_TOKEN:-$(openssl rand -hex 24)}"
ADMIN_TOKEN="${ADMIN_TOKEN:-$(openssl rand -hex 16)}"

cat > "$ETC/env" <<ENV
# location self-host 設定（systemd 與 CLI 共用；含權杖，勿外流）
SERVER_NAME=$SERVER_NAME
IP_PREFIX=$IP_PREFIX
# picker（server.js）
TOKEN=$PICKER_TOKEN
PORT=$PICKER_PORT
DATA_FILE=/var/lib/location/loc.json
# MITM proxy
CERT_DIR=$CERTS
MITM_PORT=$MITM_PORT
PICKER_BASE=http://127.0.0.1:$PICKER_PORT
PICKER_TOKEN=$PICKER_TOKEN
PEERS_FILE=$ETC/peers.json
# portal
PORTAL_PORT=$PORTAL_PORT
ADMIN_TOKEN=$ADMIN_TOKEN
INVITES_FILE=$ETC/invites.json
SWANCTL_CONF_DIR=/etc/swanctl/conf.d
MOBILECONFIG_DIR=$ETC/mobileconfigs
CA_PEM=$ETC/ca.crt
CA_CN=$CA_CN
ENV
chmod 600 "$ETC/env"
echo "== 1) 目錄與 env 就緒（TOKEN 已隨機產生，記在 $ETC/env）=="

# ---- 2) 安裝套件 ----
echo "== 2) 安裝套件（dnf）=="
dnf install -y oracle-epel-release-el9 || dnf install -y epel-release || true
dnf install -y nodejs strongswan nftables dnsmasq openssl git policycoreutils-python-utils curl
# Caddy（自動 HTTPS）：走 COPR
dnf install -y 'dnf-command(copr)' || true
dnf copr enable -y @caddy/caddy || true
dnf install -y caddy || echo "⚠ Caddy 裝失敗，稍後手動裝（自助 portal 的公開 HTTPS 需要它）"

# ---- 3) CA + 伺服器憑證 + 兩張 gs-loc 葉憑證 ----
echo "== 3) 產生憑證（CA / IKEv2 伺服器 / gs-loc 葉）=="
cd "$ETC"
if [ ! -f ca.key ]; then
  openssl genrsa -out ca.key 3072
  openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -subj "/CN=$CA_CN" -out ca.crt
  echo "   ✓ CA 產生（ca.key 是萬能鑰匙，權限已鎖）"
else
  echo "   ✓ CA 已存在，沿用"
fi
chmod 600 ca.key

# IKEv2 伺服器憑證（SAN=SERVER_NAME）
if [ ! -f /etc/swanctl/x509/server-cert.pem ]; then
  openssl genrsa -out server.key 3072
  openssl req -new -key server.key -subj "/CN=$SERVER_NAME" -out server.csr
  printf "subjectAltName=DNS:%s\nextendedKeyUsage=serverAuth\n" "$SERVER_NAME" > server.ext
  openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -sha256 -extfile server.ext -out server.crt
  install -m600 server.key /etc/swanctl/private/server-key.pem
  install -m644 server.crt /etc/swanctl/x509/server-cert.pem
  install -m644 ca.crt     /etc/swanctl/x509ca/ca.crt
  rm -f server.csr server.ext
  echo "   ✓ IKEv2 伺服器憑證產生"
fi

# gs-loc 葉憑證（MITM 用；只需兩張）
for H in gs-loc.apple.com gs-loc-cn.apple.com; do
  if [ ! -f "$CERTS/$H.crt" ]; then
    openssl genrsa -out "$CERTS/$H.key" 2048
    openssl req -new -key "$CERTS/$H.key" -subj "/CN=$H" -out "$CERTS/$H.csr"
    printf "subjectAltName=DNS:%s\nextendedKeyUsage=serverAuth\n" "$H" > "$CERTS/$H.ext"
    openssl x509 -req -in "$CERTS/$H.csr" -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -sha256 -extfile "$CERTS/$H.ext" -out "$CERTS/$H.crt"
    rm -f "$CERTS/$H.csr" "$CERTS/$H.ext"
    chmod 600 "$CERTS/$H.key"
    echo "   ✓ 葉憑證 $H"
  fi
done

# ---- 4) strongSwan 基本設定 ----
echo "== 4) strongSwan swanctl 基本設定 =="
cat > /etc/swanctl/swanctl.conf <<'SW'
# 每個朋友的連線/pool/secret 放在 conf.d/friend-*.conf（由 add-friend 產生）
include conf.d/*.conf
SW

# ---- 5) dnsmasq：只在 VPN 閘道 IP 上，把 gs-loc 導到本機 ----
echo "== 5) dnsmasq（gs-loc → $GW_IP，其餘照常）=="
cat > /etc/dnsmasq.d/locmitm.conf <<DNS
listen-address=$GW_IP
bind-interfaces
no-resolv
server=1.1.1.1
server=8.8.8.8
address=/gs-loc.apple.com/$GW_IP
address=/gs-loc-cn.apple.com/$GW_IP
DNS

# ---- 6) 開啟轉發 ----
echo "== 6) 開啟 IP 轉發 =="
cat > /etc/sysctl.d/99-locmitm.conf <<'SC'
net.ipv4.ip_forward=1
SC
sysctl --system >/dev/null

# ---- 7) 防火牆(firewalld) + 我方 nftables nat 表 ----
echo "== 7) firewalld 開埠 + masquerade，nftables 導流 =="
if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-port=500/udp --add-port=4500/udp --add-port=443/tcp --add-port=80/tcp >/dev/null
  firewall-cmd --permanent --add-service=ipsec >/dev/null || true
  firewall-cmd --permanent --add-masquerade >/dev/null
  # 讓 VPN 內網可查本機 dnsmasq
  firewall-cmd --permanent --add-port=53/udp >/dev/null
  firewall-cmd --reload >/dev/null
  echo "   ✓ firewalld：已開 500/4500(udp)、80/443(tcp)、53、masquerade"
else
  echo "   ⚠ firewalld 沒開，跳過（請自行確保 500/4500/udp、80/443/tcp 放行 + masquerade）"
fi
# 只把「被 dnsmasq 導到 $GW_IP:443 的 gs-loc」轉進 MITM
cat > "$ETC/nat.nft" <<NFT
table ip locmitm {
  chain pre {
    type nat hook prerouting priority dstnat; policy accept;
    ip daddr $GW_IP tcp dport 443 redirect to :$MITM_PORT
  }
}
NFT

# ---- 8) systemd 服務 ----
echo "== 8) 建立 systemd 服務 =="
cat > /etc/systemd/system/location-nat.service <<NAT
[Unit]
Description=location MITM nftables redirect
After=network-online.target nftables.service
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/sbin/nft -f $ETC/nat.nft
ExecStop=/usr/sbin/nft delete table ip locmitm
[Install]
WantedBy=multi-user.target
NAT

cat > /etc/systemd/system/location-picker.service <<PS
[Unit]
Description=Location Picker (server.js)
After=network-online.target
[Service]
EnvironmentFile=$ETC/env
WorkingDirectory=$REPO_DIR/location-picker
ExecStart=/usr/bin/node server.js
Restart=on-failure
[Install]
WantedBy=multi-user.target
PS

cat > /etc/systemd/system/location-mitm.service <<MS
[Unit]
Description=Location MITM proxy
After=network-online.target location-picker.service
[Service]
EnvironmentFile=$ETC/env
ExecStart=/usr/bin/node $REPO_DIR/self-host-vpn/mitm/proxy.mjs
Restart=on-failure
[Install]
WantedBy=multi-user.target
MS

cat > /etc/systemd/system/location-portal.service <<PO
[Unit]
Description=Location enroll portal
After=network-online.target
[Service]
EnvironmentFile=$ETC/env
ExecStart=/usr/bin/node $REPO_DIR/self-host-vpn/portal/server.mjs
Restart=on-failure
[Install]
WantedBy=multi-user.target
PO

# ---- 9) Caddy：公開 HTTPS（/enroll、/admin → portal；其餘 → picker）----
echo "== 9) Caddy 反向代理設定 =="
mkdir -p /etc/caddy
cat > /etc/caddy/Caddyfile <<CADDY
$SERVER_NAME {
  @portal path /enroll* /admin/*
  handle @portal {
    reverse_proxy 127.0.0.1:$PORTAL_PORT
  }
  handle {
    reverse_proxy 127.0.0.1:$PICKER_PORT
  }
}
CADDY

# ---- 10) 啟動 ----
echo "== 10) 啟動所有服務 =="
systemctl daemon-reload
systemctl enable --now nftables 2>/dev/null || true
systemctl enable --now strongswan 2>/dev/null || systemctl enable --now strongswan-starter 2>/dev/null || true
systemctl enable --now dnsmasq
systemctl enable --now location-nat location-picker location-mitm location-portal
systemctl enable --now caddy 2>/dev/null || echo "⚠ caddy 未啟動（可能沒裝成功）"
swanctl --load-all 2>/dev/null || echo "⚠ swanctl --load-all 失敗（還沒有朋友時正常）"

echo
echo "==================== 完成（首版）===================="
echo "picker TOKEN：$PICKER_TOKEN"
echo "你自己的 Surge configUrl 可改指到："
echo "  https://$SERVER_NAME/loc.json?token=$PICKER_TOKEN&u=you"
echo
echo "下一步："
echo "  1) 確認 DNS：$SERVER_NAME 的 A 記錄 → 本機公網 IP（Caddy 才發得了憑證）"
echo "  2) 開一個朋友：       sudo $REPO_DIR/self-host-vpn/bin/add-friend.sh alice"
echo "     或產生邀請連結：   sudo $REPO_DIR/self-host-vpn/bin/new-invite.sh 7"
echo "  3) 檢查服務：         systemctl status location-picker location-mitm location-portal caddy strongswan"
echo "  4) 看日誌：           journalctl -u location-mitm -f"
echo "===================================================="
