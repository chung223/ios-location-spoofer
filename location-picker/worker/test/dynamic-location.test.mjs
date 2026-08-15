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

const base = "https://picker.example";

async function setFixed(env, { u, lat, lng }) {
  const q = new URLSearchParams({ token: "secret", lat: String(lat), lng: String(lng) });
  if (u) q.set("u", u);
  return worker.fetch(new Request(base + "/set?" + q.toString()), env);
}

async function post(env, path, bodyObj, u) {
  const q = new URLSearchParams({ token: "secret" });
  if (u) q.set("u", u);
  return worker.fetch(
    new Request(base + path + "?" + q.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj),
    }),
    env,
  );
}

async function getLoc(env, u, raw) {
  const q = new URLSearchParams({ token: "secret" });
  if (u) q.set("u", u);
  if (raw) q.set("raw", "1");
  const r = await worker.fetch(new Request(base + "/loc.json?" + q.toString()), env);
  return r.json();
}

test("微抖動：關=原點；raw 永遠是原點；開=在半徑內漂移且會變", async () => {
  const env = makeEnv();
  await setFixed(env, { u: "al", lat: 25, lng: 121 });

  let d = await getLoc(env, "al");
  assert.equal(d.latitude, 25);
  assert.equal(d.longitude, 121);

  const jr = await post(env, "/jitter", { meters: 50 }, "al");
  assert.equal(jr.status, 200);

  const raw = await getLoc(env, "al", true);
  assert.equal(raw.latitude, 25);
  assert.equal(raw.longitude, 121);
  assert.equal(raw.jitter, 50);

  const samples = [];
  for (let i = 0; i < 12; i += 1) samples.push(await getLoc(env, "al"));
  for (const s of samples) {
    assert.ok(Math.abs(s.latitude - 25) < 0.001, "lat 應在 ~100m 內: " + s.latitude);
    assert.ok(Math.abs(s.longitude - 121) < 0.001, "lng 應在 ~100m 內: " + s.longitude);
  }
  assert.ok(new Set(samples.map((s) => s.latitude)).size > 1, "抖動應該每次不同");

  await post(env, "/jitter", { meters: 0 }, "al");
  d = await getLoc(env, "al");
  assert.equal(d.latitude, 25);
  assert.equal(d.longitude, 121);
});

test("微抖動上限 500m（超過會夾住）", async () => {
  const env = makeEnv();
  await setFixed(env, { u: "al", lat: 0, lng: 0 });
  const r = await post(env, "/jitter", { meters: 99999 }, "al");
  const j = await r.json();
  assert.equal(j.jitter, 500);
});

test("跟隨朋友：鏡像對方即時位置；raw 顯示自己的錨點與 mirror 標記", async () => {
  const env = makeEnv();
  await setFixed(env, { u: "bob", lat: 35, lng: 139 });
  await setFixed(env, { u: "al", lat: 10, lng: 20 });

  const mr = await post(env, "/mirror", { u: "Bob" }, "al"); // 大小寫清洗 → bob
  assert.equal(mr.status, 200);

  let d = await getLoc(env, "al");
  assert.equal(d.latitude, 35);
  assert.equal(d.longitude, 139);

  const raw = await getLoc(env, "al", true);
  assert.equal(raw.latitude, 10);
  assert.equal(raw.mirror, "bob");

  // bob 移動 → al 跟著動
  await setFixed(env, { u: "bob", lat: 36, lng: 140 });
  d = await getLoc(env, "al");
  assert.equal(d.latitude, 36);
  assert.equal(d.longitude, 140);
});

test("手動選點 /set 會取消跟隨；{clear:true} 也會", async () => {
  const env = makeEnv();
  await setFixed(env, { u: "bob", lat: 35, lng: 139 });
  await setFixed(env, { u: "al", lat: 10, lng: 20 });

  await post(env, "/mirror", { u: "bob" }, "al");
  await setFixed(env, { u: "al", lat: 1, lng: 2 }); // 手動選點
  let d = await getLoc(env, "al");
  assert.equal(d.latitude, 1);
  assert.equal(d.longitude, 2);
  const raw = await getLoc(env, "al", true);
  assert.ok(!raw.mirror, "手動選點後不應還在跟隨");

  await post(env, "/mirror", { u: "bob" }, "al");
  await post(env, "/mirror", { clear: true }, "al");
  d = await getLoc(env, "al");
  assert.equal(d.latitude, 1);
});

test("跟隨只跟一層（不連鎖）", async () => {
  const env = makeEnv();
  await setFixed(env, { u: "c", lat: 50, lng: 60 });
  await setFixed(env, { u: "bob", lat: 35, lng: 139 });
  await post(env, "/mirror", { u: "c" }, "bob"); // bob 跟 c（但 bob 仍有自己的錨點 35,139）
  await setFixed(env, { u: "al", lat: 10, lng: 20 });
  await post(env, "/mirror", { u: "bob" }, "al"); // al 跟 bob

  const d = await getLoc(env, "al");
  assert.equal(d.latitude, 35, "應拿到 bob 的錨點，而非 c 的 50");
  assert.equal(d.longitude, 139);
});
