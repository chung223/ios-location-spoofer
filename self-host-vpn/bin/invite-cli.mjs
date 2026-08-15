// CLI：產生一條一次性邀請連結。用法：node invite-cli.mjs [有效天數，預設7]
import fs from "node:fs";
import path from "node:path";
import { mintInvite } from "../portal/server.mjs";

const F = process.env.INVITES_FILE || "/etc/location-mitm/invites.json";
const S = process.env.SERVER_NAME || "fly.chung.men";
const days = Number(process.argv[2] || 7);

let inv = {};
try {
  inv = JSON.parse(fs.readFileSync(F, "utf8"));
} catch (e) {
  inv = {};
}
const { code } = mintInvite(inv, { ttlMs: days > 0 ? days * 86400000 : 0 });
fs.mkdirSync(path.dirname(F), { recursive: true });
fs.writeFileSync(F, JSON.stringify(inv, null, 2), { mode: 0o600 });

console.log(`邀請連結（${days > 0 ? days + " 天有效" : "永久"}，一次性）：`);
console.log(`https://${S}/enroll?code=${code}`);
