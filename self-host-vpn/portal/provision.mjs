// 開卡 / 撤銷的共用邏輯（add-friend.sh 與發卡 portal 都用這個）。
//
// 一個朋友 = 一個 swanctl 設定檔（連線 + 單一 IP pool + EAP 密碼）+ peers.json 一筆
// （固定內網 IP → 名字，供 MITM proxy 對應）+ 一份 .mobileconfig。
// 撤銷 = 刪掉那個設定檔與 peers 記錄，reload。
//
// 授權：AGPL-3.0。

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { buildMobileConfig } from "./mobileconfig.mjs";

export function cleanName(raw) {
  return String(raw == null ? "" : raw).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}

export function genSecret(bytes = 18) {
  return crypto.randomBytes(bytes).toString("base64url");
}

// 在 prefix.（start..end）內取第一個未被佔用的 IP
export function nextIp(prefix, used, start = 11, end = 250) {
  const set = new Set(used);
  for (let i = start; i <= end; i += 1) {
    const ip = prefix + "." + i;
    if (!set.has(ip)) return ip;
  }
  throw new Error("IP pool exhausted");
}

// 產生一個朋友的 swanctl 設定檔內容（連線 + 單一 IP pool + EAP 密碼）
export function swanctlConf({ name, ip, secret, server, serverCert = "server-cert.pem" }) {
  return `connections {
  loc-${name} {
    version = 2
    proposals = aes256gcm16-sha256-ecp256,default
    rekey_time = 0
    pools = pool-${name}
    pull = yes
    dpd_delay = 30s
    send_cert = always
    local {
      auth = pubkey
      certs = ${serverCert}
      id = ${server}
    }
    remote {
      auth = eap-mschapv2
      eap_id = ${name}
      id = ${name}
    }
    children {
      loc-${name} {
        local_ts = 0.0.0.0/0
        esp_proposals = aes256gcm16-ecp256,default
      }
    }
  }
}
pools {
  pool-${name} {
    addrs = ${ip}/32
  }
}
secrets {
  eap-${name} {
    id = ${name}
    secret = "${secret}"
  }
}
`;
}

function readPeers(peersFile) {
  try {
    return JSON.parse(fs.readFileSync(peersFile, "utf8"));
  } catch (e) {
    return {};
  }
}
function writePeers(peersFile, map) {
  fs.mkdirSync(path.dirname(peersFile), { recursive: true });
  fs.writeFileSync(peersFile, JSON.stringify(map, null, 2));
}
function ipForName(map, name) {
  for (const [ip, n] of Object.entries(map)) if (n === name) return ip;
  return null;
}

// cfg: { confDir, peersFile, mobileconfigDir, server, ipPrefix, caPemPath, serverCert?, reload? }
export function provisionFriend(rawName, cfg) {
  const name = cleanName(rawName);
  if (!name) throw new Error("bad friend name");
  const reload = cfg.reload || (() => {});

  const peers = readPeers(cfg.peersFile);
  if (ipForName(peers, name)) throw new Error(`friend "${name}" already exists`);

  const ip = nextIp(cfg.ipPrefix, Object.keys(peers));
  const secret = genSecret();
  const caPem = fs.readFileSync(cfg.caPemPath, "utf8");

  fs.mkdirSync(cfg.confDir, { recursive: true });
  fs.writeFileSync(
    path.join(cfg.confDir, `friend-${name}.conf`),
    swanctlConf({ name, ip, secret, server: cfg.server, serverCert: cfg.serverCert }),
    { mode: 0o600 },
  );

  peers[ip] = name;
  writePeers(cfg.peersFile, peers);

  const mobileconfig = buildMobileConfig({
    server: cfg.server,
    friend: name,
    eapUser: name,
    eapPass: secret,
    caPem,
    caCommonName: cfg.caCommonName || "",
  });
  let mobileconfigPath = null;
  if (cfg.mobileconfigDir) {
    fs.mkdirSync(cfg.mobileconfigDir, { recursive: true });
    mobileconfigPath = path.join(cfg.mobileconfigDir, `${name}.mobileconfig`);
    fs.writeFileSync(mobileconfigPath, mobileconfig, { mode: 0o600 });
  }

  reload();
  return { name, ip, secret, mobileconfig, mobileconfigPath };
}

export function revokeFriend(rawName, cfg) {
  const name = cleanName(rawName);
  if (!name) throw new Error("bad friend name");
  const reload = cfg.reload || (() => {});

  const confFile = path.join(cfg.confDir, `friend-${name}.conf`);
  const existedConf = fs.existsSync(confFile);
  if (existedConf) fs.rmSync(confFile);

  const peers = readPeers(cfg.peersFile);
  const ip = ipForName(peers, name);
  if (ip) {
    delete peers[ip];
    writePeers(cfg.peersFile, peers);
  }

  if (cfg.mobileconfigDir) {
    const mc = path.join(cfg.mobileconfigDir, `${name}.mobileconfig`);
    if (fs.existsSync(mc)) fs.rmSync(mc);
  }

  reload();
  return { name, ip, removed: existedConf || !!ip };
}

export function listFriends(cfg) {
  const peers = readPeers(cfg.peersFile);
  return Object.entries(peers).map(([ip, name]) => ({ name, ip }));
}
