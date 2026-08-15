// 邀請碼自助發卡 portal（跑在 localhost，由 Caddy 前置公開 HTTPS）。
//
// 朋友：GET /enroll?code=XXX → 輸入代號 → POST /enroll → 產生並下載 .mobileconfig。
// 你（管理）：bin/new-invite.sh 產生邀請碼；或 GET /admin/new-invite?token=ADMIN_TOKEN。
// 有邀請碼才發得出描述檔 → 只開給你邀的人。
//
// 授權：AGPL-3.0。

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { provisionFriend, cleanName } from "./provision.mjs";

const PORT = Number(process.env.PORTAL_PORT || 8090);
const INVITES_FILE = process.env.INVITES_FILE || "/etc/location-mitm/invites.json";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const PROVISION_CFG = {
  confDir: process.env.SWANCTL_CONF_DIR || "/etc/swanctl/conf.d",
  peersFile: process.env.PEERS_FILE || "/etc/location-mitm/peers.json",
  mobileconfigDir: process.env.MOBILECONFIG_DIR || "/etc/location-mitm/mobileconfigs",
  server: process.env.SERVER_NAME || "fly.chung.men",
  ipPrefix: process.env.IP_PREFIX || "10.9.0",
  caPemPath: process.env.CA_PEM || "/etc/location-mitm/ca.crt",
  caCommonName: process.env.CA_CN || "",
};

// —— 純邏輯（可測）——
export function makeCode() {
  return crypto.randomBytes(9).toString("base64url");
}
export function checkInvite(invites, code, now = Date.now()) {
  const inv = invites[code];
  if (!inv) return { ok: false, reason: "邀請碼無效" };
  if (inv.used) return { ok: false, reason: "邀請碼已被使用" };
  if (inv.expires && now > inv.expires) return { ok: false, reason: "邀請碼已過期" };
  return { ok: true };
}
export function markUsed(invites, code, name, now = Date.now()) {
  invites[code] = Object.assign({}, invites[code], { used: true, usedBy: name, usedAt: now });
  return invites;
}
export function mintInvite(invites, { code = makeCode(), ttlMs, note, now = Date.now() } = {}) {
  invites[code] = { created: now, used: false, note: note || "", expires: ttlMs ? now + ttlMs : 0 };
  return { code, invites };
}

function readInvites() {
  try { return JSON.parse(fs.readFileSync(INVITES_FILE, "utf8")); } catch (e) { return {}; }
}
function writeInvites(map) {
  fs.mkdirSync(path.dirname(INVITES_FILE), { recursive: true });
  fs.writeFileSync(INVITES_FILE, JSON.stringify(map, null, 2), { mode: 0o600 });
}

function html(body) {
  return `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>定位服務 · 開通</title><style>
body{font-family:-apple-system,sans-serif;background:#0a0a0c;color:#f5f6f8;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#1a1a1e;border:1px solid #2a2b31;border-radius:20px;max-width:420px;width:100%;padding:26px}
h1{font-size:20px;margin:0 0 6px}p{color:#9fa3ac;font-size:14px;line-height:1.6}
input{width:100%;box-sizing:border-box;margin:14px 0;padding:13px;border-radius:12px;border:1px solid #2a2b31;background:#232329;color:#fff;font-size:16px}
button{width:100%;padding:15px;border:0;border-radius:14px;background:linear-gradient(180deg,#3aa0ff,#0a6bff);color:#fff;font-size:17px;font-weight:700}
.err{color:#ff6b6b}.ok{color:#32d16a}.mono{font-family:ui-monospace,monospace;font-size:12px;color:#72767f}
</style><div class=card>${body}</div>`;
}

function send(res, code, type, body) {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/health") return send(res, 200, "application/json", '{"ok":true}');

  // 管理：產生邀請碼（需 ADMIN_TOKEN）
  if (url.pathname === "/admin/new-invite" && req.method === "GET") {
    if (!ADMIN_TOKEN || url.searchParams.get("token") !== ADMIN_TOKEN) return send(res, 403, "text/plain", "forbidden");
    const invites = readInvites();
    const days = Number(url.searchParams.get("days") || 7);
    const { code } = mintInvite(invites, { ttlMs: days > 0 ? days * 86400000 : 0, note: url.searchParams.get("note") || "" });
    writeInvites(invites);
    const link = `https://${PROVISION_CFG.server}/enroll?code=${code}`;
    return send(res, 200, "application/json", JSON.stringify({ code, link }, null, 2));
  }

  // 朋友：開通頁
  if (url.pathname === "/enroll" && req.method === "GET") {
    const code = url.searchParams.get("code") || "";
    const chk = checkInvite(readInvites(), code);
    if (!chk.ok) return send(res, 400, "text/html; charset=utf-8", html(`<h1>無法開通</h1><p class=err>${chk.reason}</p><p>跟分享者要一條新的邀請連結。</p>`));
    return send(res, 200, "text/html; charset=utf-8", html(
      `<h1>開通你的定位</h1><p>取一個英文代號（只用英文字母/數字），這是你專屬的定位槽位。</p>
<form method=post action="/enroll">
<input type=hidden name=code value="${code.replace(/"/g, "")}">
<input name=name placeholder="你的代號，例如 alice" autocapitalize=off autocorrect=off spellcheck=false required>
<button>產生我的描述檔</button></form>
<p class=mono>裝好後：設定→一般→關於本機→憑證信任設定，開啟「定位服務 CA」的完全信任，再連 VPN。</p>`));
  }

  // 朋友：送出 → 開卡 → 回傳 .mobileconfig
  if (url.pathname === "/enroll" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e4) req.destroy(); });
    req.on("end", () => {
      const p = new URLSearchParams(body);
      const code = p.get("code") || "";
      const name = cleanName(p.get("name"));
      const invites = readInvites();
      const chk = checkInvite(invites, code);
      if (!chk.ok) return send(res, 400, "text/html; charset=utf-8", html(`<h1>無法開通</h1><p class=err>${chk.reason}</p>`));
      if (!name) return send(res, 400, "text/html; charset=utf-8", html(`<h1>代號無效</h1><p class=err>只能用英文字母/數字。</p>`));
      try {
        const r = provisionFriend(name, Object.assign({}, PROVISION_CFG, { reload: reloadSwanctl }));
        markUsed(invites, code, name);
        writeInvites(invites);
        res.writeHead(200, {
          "Content-Type": "application/x-apple-aspen-config",
          "Content-Disposition": `attachment; filename="loc-${name}.mobileconfig"`,
          "Cache-Control": "no-store",
        });
        return res.end(r.mobileconfig);
      } catch (e) {
        return send(res, 400, "text/html; charset=utf-8", html(`<h1>開通失敗</h1><p class=err>${String(e.message)}</p><p>可能是代號已被用過，換一個試試。</p>`));
      }
    });
    return;
  }

  return send(res, 404, "text/plain", "not found");
}

function reloadSwanctl() {
  // 由伺服器實際執行時才 import child_process，測試不觸發
  import("node:child_process").then(({ execFile }) => {
    execFile("swanctl", ["--load-all"], (e) => { if (e) console.error("swanctl reload failed:", e.message); });
  });
}

function start() {
  http.createServer(handler).listen(PORT, "127.0.0.1", () => console.error(`enroll portal on 127.0.0.1:${PORT}`));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) start();
