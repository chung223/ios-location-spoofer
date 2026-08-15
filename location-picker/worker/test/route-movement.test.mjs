import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

function makeEnv() {
  const store = new Map();
  return {
    TOKEN: "secret",
    LOC_KV: {
      async get(k) { return store.has(k) ? store.get(k) : null; },
      async put(k, v) { store.set(k, String(v)); },
    },
    _store: store,
  };
}

const B = "https://picker.example";

// 与 worker 内部一致的 haversine，用来在测试里推导期望位置
function hav(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(bLat - aLat);
  const dLng = toR(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

async function post(env, path, body, u) {
  const q = new URLSearchParams({ token: "secret" });
  if (u) q.set("u", u);
  return worker.fetch(new Request(B + path + "?" + q.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }), env);
}
async function setFixed(env, { u, lat, lng }) {
  const q = new URLSearchParams({ token: "secret", lat: String(lat), lng: String(lng) });
  if (u) q.set("u", u);
  return worker.fetch(new Request(B + "/set?" + q.toString()), env);
}
async function getLoc(env, u, { raw, now } = {}) {
  const q = new URLSearchParams({ token: "secret" });
  if (u) q.set("u", u);
  if (raw) q.set("raw", "1");
  if (now) q.set("now", String(now));
  const r = await worker.fetch(new Request(B + "/loc.json?" + q.toString()), env);
  return r.json();
}

const START = 1000000000000; // 固定 startedAt，便于用 now 覆盖推算
function seedRoute(env, key, route, { speed = 1, loop = false } = {}) {
  env._store.set(key, JSON.stringify({
    enabled: true, mode: "route", route, speed, loop, startedAt: START,
    latitude: route[0][0], longitude: route[0][1], altitude: 10, horizontalAccuracy: 39, verticalAccuracy: 1000,
  }));
}

test("路線：按經過時間沿線內插（起點/中點/終點夾住）", async () => {
  const env = makeEnv();
  const route = [[0, 0], [0, 1]]; // 沿赤道向東 1 度
  const total = hav(0, 0, 0, 1);
  seedRoute(env, "loc:al", route, { speed: 1, loop: false });

  let d = await getLoc(env, "al", { now: START });
  assert.ok(Math.abs(d.latitude - 0) < 1e-6 && Math.abs(d.longitude - 0) < 1e-6, "起點");

  d = await getLoc(env, "al", { now: START + Math.round((total / 2) * 1000) });
  assert.ok(Math.abs(d.longitude - 0.5) < 0.01, "中點應 ~0.5，實得 " + d.longitude);
  assert.ok(Math.abs(d.latitude - 0) < 1e-6);

  d = await getLoc(env, "al", { now: START + Math.round(total * 2 * 1000) });
  assert.ok(Math.abs(d.longitude - 1) < 1e-6, "無循環超過終點應夾在終點");
});

test("路線：循環會繞回（2.25 圈 → 0.25 處）", async () => {
  const env = makeEnv();
  const total = hav(0, 0, 0, 1);
  seedRoute(env, "loc:al", [[0, 0], [0, 1]], { speed: 1, loop: true });
  const d = await getLoc(env, "al", { now: START + Math.round(total * 2.25 * 1000) });
  assert.ok(Math.abs(d.longitude - 0.25) < 0.02, "2.25 圈應在 0.25，實得 " + d.longitude);
});

test("raw=1 移動中回傳錨點（route[0]），不內插", async () => {
  const env = makeEnv();
  const total = hav(0, 0, 0, 1);
  seedRoute(env, "loc:al", [[0, 0], [0, 1]], { speed: 1 });
  const raw = await getLoc(env, "al", { raw: true, now: START + Math.round((total / 2) * 1000) });
  assert.equal(raw.longitude, 0);
  assert.equal(raw.mode, "route");
});

test("POST /route 設定移動模式並回傳 startedAt；stop 凍結成固定點", async () => {
  const env = makeEnv();
  const r = await post(env, "/route", { route: [[10, 20], [10, 21]], speed: 100 }, "al");
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.mode, "route");
  assert.ok(Number.isFinite(j.startedAt));
  assert.equal(j.latitude, 10);
  assert.equal(j.longitude, 20);

  const s = await (await post(env, "/route", { stop: true }, "al")).json();
  assert.ok(!s.mode, "stop 後應清掉 mode");
  assert.ok(!s.route, "stop 後應清掉 route");
});

test("POST /route 拒絕 <2 點與超範圍座標", async () => {
  const env = makeEnv();
  assert.equal((await post(env, "/route", { route: [[0, 0]] }, "al")).status, 400);
  assert.equal((await post(env, "/route", { route: [[0, 0], [999, 0]] }, "al")).status, 400);
});

test("手動 /set 會停止路線移動", async () => {
  const env = makeEnv();
  await post(env, "/route", { route: [[10, 20], [10, 21]], speed: 100 }, "al");
  await setFixed(env, { u: "al", lat: 1, lng: 2 });
  const raw = await getLoc(env, "al", { raw: true });
  assert.ok(!raw.mode, "/set 應清掉 route");
  assert.equal(raw.latitude, 1);
});

test("跟隨會鏡像對方「移動中」的即時位置", async () => {
  const env = makeEnv();
  const total = hav(0, 0, 0, 1);
  seedRoute(env, "loc:bob", [[0, 0], [0, 1]], { speed: 1 });
  await setFixed(env, { u: "al", lat: 50, lng: 50 });
  await post(env, "/mirror", { u: "bob" }, "al");
  const d = await getLoc(env, "al", { now: START + Math.round((total / 2) * 1000) });
  assert.ok(Math.abs(d.longitude - 0.5) < 0.01, "al 應跟到 bob 的即時中點，實得 " + d.longitude);
});
