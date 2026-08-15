import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cleanName, genSecret, nextIp, swanctlConf, provisionFriend, revokeFriend, listFriends } from "./provision.mjs";

function setup() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prov-"));
  const caPemPath = path.join(tmp, "ca.crt");
  fs.writeFileSync(caPemPath, "-----BEGIN CERTIFICATE-----\nMIIBFAKEca0BASE64+/==\n-----END CERTIFICATE-----\n");
  let reloads = 0;
  const cfg = {
    confDir: path.join(tmp, "conf.d"),
    peersFile: path.join(tmp, "peers.json"),
    mobileconfigDir: path.join(tmp, "mc"),
    server: "fly.chung.men",
    ipPrefix: "10.9.0",
    caPemPath,
    reload: () => { reloads += 1; },
  };
  return { tmp, cfg, reloads: () => reloads };
}

test("cleanName / genSecret / nextIp / swanctlConf 純函式", () => {
  assert.equal(cleanName("Alice!! 空白"), "alice");
  const s = genSecret();
  assert.ok(s.length >= 20 && /^[A-Za-z0-9_-]+$/.test(s), "base64url 密碼: " + s);

  assert.equal(nextIp("10.9.0", []), "10.9.0.11");
  assert.equal(nextIp("10.9.0", ["10.9.0.11"]), "10.9.0.12");
  assert.throws(() => nextIp("10.9.0", ["10.9.0.11", "10.9.0.12"], 11, 12));

  const conf = swanctlConf({ name: "alice", ip: "10.9.0.11", secret: "PW", server: "fly.chung.men" });
  assert.match(conf, /loc-alice/);
  assert.match(conf, /eap_id = alice/);
  assert.match(conf, /addrs = 10\.9\.0\.11\/32/);
  assert.match(conf, /secret = "PW"/);
  assert.match(conf, /id = fly\.chung\.men/);
});

test("provisionFriend：寫設定檔 + peers + mobileconfig，回傳 IP/密碼", () => {
  const { cfg, reloads } = setup();
  const r = provisionFriend("Alice", cfg);
  assert.equal(r.name, "alice");
  assert.equal(r.ip, "10.9.0.11");
  assert.ok(r.secret.length > 0);

  // swanctl 設定檔
  assert.ok(fs.existsSync(path.join(cfg.confDir, "friend-alice.conf")));
  // peers.json：ip → name
  assert.deepEqual(JSON.parse(fs.readFileSync(cfg.peersFile, "utf8")), { "10.9.0.11": "alice" });
  // mobileconfig 產出且內含 IKEv2 + 名字
  assert.ok(fs.existsSync(r.mobileconfigPath));
  const mc = fs.readFileSync(r.mobileconfigPath, "utf8");
  assert.match(mc, /IKEv2/);
  assert.match(mc, /<string>alice<\/string>/);
  assert.equal(reloads(), 1, "應觸發一次 reload");
});

test("第二個朋友拿到下一個 IP；重複開卡會擋", () => {
  const { cfg } = setup();
  provisionFriend("alice", cfg);
  const b = provisionFriend("bob", cfg);
  assert.equal(b.ip, "10.9.0.12");
  assert.throws(() => provisionFriend("Alice", cfg), /already exists/);
  assert.deepEqual(listFriends(cfg).sort((x, y) => x.ip.localeCompare(y.ip)), [
    { name: "alice", ip: "10.9.0.11" },
    { name: "bob", ip: "10.9.0.12" },
  ]);
});

test("revokeFriend：清掉設定檔/peers/mobileconfig，IP 可被回收", () => {
  const { cfg } = setup();
  provisionFriend("alice", cfg); // .11
  provisionFriend("bob", cfg); // .12

  const rv = revokeFriend("alice", cfg);
  assert.equal(rv.ip, "10.9.0.11");
  assert.ok(rv.removed);
  assert.ok(!fs.existsSync(path.join(cfg.confDir, "friend-alice.conf")));
  assert.deepEqual(JSON.parse(fs.readFileSync(cfg.peersFile, "utf8")), { "10.9.0.12": "bob" });
  assert.ok(!fs.existsSync(path.join(cfg.mobileconfigDir, "alice.mobileconfig")));

  // 新朋友回收 alice 空出的 .11
  const carol = provisionFriend("carol", cfg);
  assert.equal(carol.ip, "10.9.0.11");
});

test("revoke 不存在的朋友不會爆炸", () => {
  const { cfg } = setup();
  const rv = revokeFriend("ghost", cfg);
  assert.equal(rv.removed, false);
});
