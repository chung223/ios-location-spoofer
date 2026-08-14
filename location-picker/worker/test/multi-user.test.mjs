import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

// 内存版 KV，模拟 Cloudflare KV 的 get/put，用来直接跑 Worker 的 fetch 处理。
function makeEnv() {
  const store = new Map();
  return {
    TOKEN: "secret",
    LOC_KV: {
      async get(k) {
        return store.has(k) ? store.get(k) : null;
      },
      async put(k, v) {
        store.set(k, String(v));
      },
    },
    _store: store,
  };
}

const base = "https://picker.example";

async function setLoc(env, { u, lat, lng } = {}) {
  const q = new URLSearchParams({ token: "secret", lat: String(lat), lng: String(lng) });
  if (u) q.set("u", u);
  return worker.fetch(new Request(base + "/set?" + q.toString()), env);
}

async function getLoc(env, u) {
  const q = new URLSearchParams({ token: "secret" });
  if (u) q.set("u", u);
  const res = await worker.fetch(new Request(base + "/loc.json?" + q.toString()), env);
  return res.json();
}

test("每个 ?u=<名字> 拿到相互独立的定位", async () => {
  const env = makeEnv();
  await setLoc(env, { u: "alice", lat: 10, lng: 20 });
  await setLoc(env, { u: "bob", lat: 30, lng: 40 });

  const alice = await getLoc(env, "alice");
  const bob = await getLoc(env, "bob");
  assert.equal(alice.latitude, 10);
  assert.equal(alice.longitude, 20);
  assert.equal(bob.latitude, 30);
  assert.equal(bob.longitude, 40);
});

test("不带 ?u= 用默认槽位，与具名用户互不干扰", async () => {
  const env = makeEnv();
  await setLoc(env, { lat: 1, lng: 2 }); // 默认
  await setLoc(env, { u: "alice", lat: 10, lng: 20 });

  const def = await getLoc(env);
  const alice = await getLoc(env, "alice");
  assert.equal(def.latitude, 1);
  assert.equal(def.longitude, 2);
  assert.equal(alice.latitude, 10);
  assert.notEqual(def.latitude, alice.latitude);
});

test("名字清洗后（大小写无关、去杂质）命中同一槽位", async () => {
  const env = makeEnv();
  await setLoc(env, { u: "Alice", lat: 55, lng: 66 });
  const same = await getLoc(env, "a l i c e!!"); // 清洗为 "alice"
  assert.equal(same.latitude, 55);
  assert.equal(same.longitude, 66);
});

test("具名槽位存成 loc:<名字>，默认键不受影响", async () => {
  const env = makeEnv();
  await setLoc(env, { u: "alice", lat: 10, lng: 20 });
  assert.ok(env._store.has("loc:alice"), "应存在 KV 键 loc:alice");
  assert.ok(!env._store.has("loc"), "默认键 loc 不应被写入");
});
