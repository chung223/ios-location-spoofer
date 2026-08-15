# self-host-vpn — 自架「wloc8 式」定位引擎

把 `location-picker` 的 gs-loc 改寫,從「手機上的 Surge」搬到**你自己的 VPS**。
朋友端**不用任何 App、不用電腦**:只裝一個描述檔 → 連 VPN → 在網頁選點就改定位。

> 目標情境:`fly.chung.men`(Oracle Linux 9.6 VPS)一台包辦全部,**不再需要 Cloudflare**。
> 你自己維持用 Surge;這條 VPN 引擎是發給「沒有 Surge 的朋友」用的。

---

## 架構

```
朋友 iPhone ──(IKEv2 VPN,iOS 原生,零 App)──▶ fly.chung.men (OL 9.6)
                                                 │
   ┌─────────────────────────────────────────────┼───────────────────────────┐
   │ strongSwan (IKEv2)   每個朋友一組憑證/帳號 + 固定內網 IP（白名單）        │
   │ nftables 轉址        只把 Apple 定位 IP:443 導去本機 MITM                 │
   │ MITM proxy (Node)    只改 gs-loc，來源內網 IP → 對應朋友的 u             │
   │ picker (server.js)   走 localhost 讀寫定位（可不對外）                    │
   │ portal (Node)        邀請碼自助發卡 → 產生憑證 + .mobileconfig            │
   │ caddy/nginx + certbot  fly.chung.men 的公開 HTTPS（選點頁 + 發卡頁）      │
   └───────────────────────────────────────────────────────────────────────────┘
```

## 為什麼用 IKEv2,不用 WireGuard（重要決定）

朋友端「**零 App**」是這整條路的重點。

- **IKEv2 是 iOS 原生 VPN** → 一個 `.mobileconfig` 就設定完,**不用裝任何 App**。（wloc8 就是這樣。）
- WireGuard 在 iOS 要**另外裝 WireGuard App** 才能用 → 破壞「零 App」目標。

所以本方案用 **strongSwan + IKEv2**。代價是伺服器設定比 WireGuard 稍繁,但換來朋友端最乾淨的體驗。

## 前置需求

1. **VPS**:Oracle Linux 9.6(RHEL9 系)· root · 公網 IP。
2. **DNS**:`fly.chung.men` 的 **A 記錄指到 VPS 公網 IP**（發卡頁 + 選點頁的 HTTPS、以及 IKEv2 憑證的 SAN 都會用到這個名字）。
3. **防火牆放行**:UDP `500`、UDP `4500`（IKEv2）；TCP `443`（HTTPS 發卡/選點頁）。SSH 照舊。
4. 朋友端:**什麼都不用裝**（iOS 內建 IKEv2）。

## 存取控管（只開給朋友）

- **一個朋友 = 一組憑證/EAP 帳號 + 一個固定內網 IP**，strongSwan 白名單，預設拒絕。
- **邀請碼**:自助發卡頁必須帶有效邀請碼才生得出描述檔 → 隨機的人自助不了。
- **撤銷**:`bin/revoke-friend.sh <名字>` 移除該朋友的憑證/帳號 → 立即斷、其他人不受影響。

## 元件與建置順序（逐塊落地、能測則測）

- [x] `mitm/wloc-rewrite.mjs` — gs-loc 改寫核心（沿用 `location-spoofer.js` 的 ARPC/protobuf 邏輯，抽成可重用模組）＋自測（6 項合成封包測試全綠，含真實前綴 0001000000030000 / ARPC / 多 Wi-Fi / 負座標）
- [x] `mitm/proxy.mjs` — 透明 TLS MITM：攔 gs-loc、改寫、來源 IP→`u`、走 localhost 讀 picker（決策抽成純函式 `proxyDecide`，7 項 stub 端到端測試全綠：改寫 / 放行 / fail-open / 剝壓縮標頭）
- [x] `portal/mobileconfig.mjs` — iOS 原生 IKEv2 描述檔（VPN + CA 憑證 payload）產生器（5 測全綠）
- [x] `portal/provision.mjs` — 開卡/撤銷邏輯（swanctl 設定 + 固定IP + peers + mobileconfig，5 測全綠）
- [x] `portal/server.mjs` — 邀請碼自助發卡頁（邀請碼邏輯 4 測全綠）
- [x] `bin/*.sh` + `bin/*-cli.mjs` — add-friend / revoke-friend / new-invite / list-friends
- [x] `setup.sh` — OL9 一鍵安裝（dnf 依賴、Node、strongSwan(IKEv2)、dnsmasq(gs-loc 導流)、
      nftables 轉址、firewalld、Caddy 自動 HTTPS、CA+葉憑證、systemd）**（首版，上機必調）**
- [ ] （你）把 Surge `configUrl` 改指到 `https://fly.chung.men/loc.json?token=...&u=你`

> 可測的軟體核心共 **27 測全綠**（改寫6 + proxy7 + mobileconfig5 + 開卡5 + 邀請4）。
> `setup.sh` 與 strongSwan/dnsmasq/nftables 這層無法在開發機驗證，是上機起點。

## 導流方式（實作細節）

改用 **DNS 覆寫**（比追 Apple IP 段穩）：dnsmasq 只在 VPN 閘道 IP 上，把
`gs-loc.apple.com` / `gs-loc-cn.apple.com` 解到閘道 IP；nftables 再把「到閘道 IP:443」
的封包 redirect 進本機 MITM proxy（其餘流量照常 NAT 出去）。MITM 上游用本機自己的
DNS 解到「真 Apple」，不會繞回來。全通道路由（catch 得到 gs-loc），朋友其他流量只轉不解。

## 上機 runbook（你 SSH 進 VPS 跑）

```bash
# 0) 先把 DNS 指好：fly.chung.men 的 A 記錄 → 這台 VPS 公網 IP

# 1) 拿到程式碼並安裝（一行）
git clone https://github.com/chung223/ios-location-spoofer
cd ios-location-spoofer
sudo bash self-host-vpn/setup.sh          # 每步都會 echo；出錯把畫面貼回來

# 2) 開通一個朋友（產生 .mobileconfig）
sudo self-host-vpn/bin/add-friend.sh alice
#   或給朋友自助邀請連結（7 天有效、一次性）：
sudo self-host-vpn/bin/new-invite.sh 7

# 3) 檢查 / 看日誌
systemctl status location-picker location-mitm location-portal caddy strongswan
journalctl -u location-mitm -f
sudo self-host-vpn/bin/list-friends.sh
sudo self-host-vpn/bin/revoke-friend.sh alice   # 踢人
```

朋友端：打開描述檔連結（或收到的 `.mobileconfig`）→ 安裝 → **設定→一般→關於本機→
憑證信任設定** 開啟「定位服務 CA」完全信任 → 連 VPN → 開選點網頁選點 → 關開一次定位服務。

## 首次上機最可能要調的點（心裡有數）

1. **IKEv2 EAP 描述檔**：`AuthenticationMethod=None` + `ExtendedAuthEnabled` 這組在你的
   iOS 版本上連不連得起來，可能要微調（憑證式 vs EAP）。先看 `journalctl -u strongswan`。
2. **憑證信任**：CA 沒「完全信任」→ VPN 連不上 / MITM 解不開（跟 Surge 同一個坑）。
3. **firewalld vs nftables** 共存：若導流沒生效，檢查 `nft list table ip locmitm` 有沒有在。
4. **Caddy 憑證**：DNS 沒指好 / 80 埠沒通 → Let's Encrypt 發不出來。
5. **SELinux**：若 node 服務起不來，`journalctl` 看有沒有 AVC；必要時 `semanage`/暫時 permissive 測。

## 朋友的體驗（最終）

1. 你把一條**邀請連結**發給朋友。
2. 朋友用 Safari 打開 → 按「產生我的描述檔」→ 裝上（含 VPN + 憑證）。
3. 到「設定 → 一般 → 關於本機 → 憑證信任設定」把該憑證打開（這步 iOS 規定要手動）。
4. 連上 VPN → 開你給的選點網頁選地點 → 關開一次定位服務。搞定。

## 安全須知

- **CA 私鑰 = 萬能鑰匙**:只留在 VPS、權限鎖死、絕不外流。
- MITM **只改 `gs-loc`,其餘流量原封轉發**（朋友隱私 + 少破壞）。
- 只對**你自己或知情同意的朋友**的裝置做;這是自用/朋友圈工具,不是對外服務。
- VPS 是單點:它掛了,picker 跟著掛（連你自己的 Surge）。可接受再走這條。

## 誠實提醒

VPN / TLS-MITM / strongSwan 這幾塊**無法在開發機完整測試**（要 root + 真 iPhone + 公網）。
程式碼會寫得盡量穩 + 附清楚 runbook,但**實機首跑很可能要一起微調**。gs-loc 改寫核心會在這裡用合成封包自測,確保行為與你已驗證的 Surge 版一致。
