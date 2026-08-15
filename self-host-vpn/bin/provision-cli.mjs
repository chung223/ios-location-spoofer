// CLI：開卡 / 撤銷 / 列出朋友。設定從環境變數讀（由 /etc/location-mitm/env 提供）。
// 用法：node provision-cli.mjs add <name> | revoke <name> | list
import { execFileSync } from "node:child_process";
import { provisionFriend, revokeFriend, listFriends } from "../portal/provision.mjs";

function reloadSwanctl() {
  try {
    execFileSync("swanctl", ["--load-all"], { stdio: "inherit" });
  } catch (e) {
    console.error("⚠ swanctl reload 失敗（VPN 設定沒生效）:", e.message);
  }
}

function cfg() {
  const e = process.env;
  return {
    confDir: e.SWANCTL_CONF_DIR || "/etc/swanctl/conf.d",
    peersFile: e.PEERS_FILE || "/etc/location-mitm/peers.json",
    mobileconfigDir: e.MOBILECONFIG_DIR || "/etc/location-mitm/mobileconfigs",
    server: e.SERVER_NAME || "fly.chung.men",
    ipPrefix: e.IP_PREFIX || "10.9.0",
    caPemPath: e.CA_PEM || "/etc/location-mitm/ca.crt",
    caCommonName: e.CA_CN || "Location CA",
    reload: reloadSwanctl,
  };
}

const [cmd, name] = process.argv.slice(2);
try {
  if (cmd === "add") {
    const r = provisionFriend(name, cfg());
    console.log(`✅ 已開卡：${r.name}  內網IP ${r.ip}`);
    console.log(`   描述檔：${r.mobileconfigPath}`);
    console.log(`   （把這個檔案傳給朋友，或用邀請碼自助頁）`);
  } else if (cmd === "revoke") {
    const r = revokeFriend(name, cfg());
    console.log(r.removed ? `✅ 已撤銷：${r.name}` : `（找不到 ${name}，無動作）`);
  } else if (cmd === "list") {
    const list = listFriends(cfg());
    if (!list.length) console.log("（尚無朋友）");
    for (const f of list) console.log(`${f.ip}\t${f.name}`);
  } else {
    console.error("用法：provision-cli.mjs add <name> | revoke <name> | list");
    process.exit(1);
  }
} catch (e) {
  console.error("✗ 失敗：", e.message);
  process.exit(1);
}
