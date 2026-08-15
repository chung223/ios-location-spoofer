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
- [ ] `bin/setup.sh` — OL9 一鍵安裝:dnf 依賴、Node、strongSwan、nftables 轉址、sysctl 轉發、SELinux、certbot
- [ ] `bin/add-friend.sh` / `bin/revoke-friend.sh` — 手動發卡 / 踢人
- [ ] `portal/` — 邀請碼自助發卡頁 + `.mobileconfig` 產生器（憑證 payload + IKEv2 payload）
- [ ] `systemd/*.service` — picker / mitm / portal 常駐
- [ ] 把你自己的 Surge `configUrl` 改指到 `https://fly.chung.men/loc.json?token=...&u=你`

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
