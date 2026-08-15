import assert from "node:assert/strict";
import test from "node:test";
import { proxyDecide } from "./proxy.mjs";
import {
  buildAppleWLocResponse,
  makeVarintField,
  makeLengthDelimitedField,
  parseFields,
  firstFieldByNumber,
  signedVarintFieldValue,
  extractAppleWLocPayload,
} from "./wloc-rewrite.mjs";

function concat(arrs) { return new Uint8Array(Buffer.concat(arrs.map((a) => Buffer.from(a)))); }
function locSub(lat, lng) { return concat([makeVarintField(1, Math.trunc(lat * 1e8)), makeVarintField(2, Math.trunc(lng * 1e8))]); }
function wifiDev(lat, lng) { return makeLengthDelimitedField(2, makeLengthDelimitedField(2, locSub(lat, lng))); }
function wlocResp(lat, lng) { return Buffer.from(buildAppleWLocResponse(wifiDev(lat, lng))); }
function readCoord(buf) {
  const ext = extractAppleWLocPayload(new Uint8Array(buf));
  const wifi = firstFieldByNumber(parseFields(ext.payload), 2);
  const loc = firstFieldByNumber(parseFields(wifi.valueBytes), 2);
  const lf = parseFields(loc.valueBytes);
  return {
    lat: Number(signedVarintFieldValue(firstFieldByNumber(lf, 1))) / 1e8,
    lng: Number(signedVarintFieldValue(firstFieldByNumber(lf, 2))) / 1e8,
  };
}

function ctx({ host = "gs-loc.apple.com", method = "POST", url = "/clls/wloc" } = {}) {
  return { host, method, url, headers: {}, reqBody: Buffer.from([]), remoteAddress: "10.9.0.2" };
}
function deps({ upstreamBody, upstreamHeaders = {}, coords, u = "alice" }) {
  return {
    fetchUpstream: async () => ({ status: 200, headers: upstreamHeaders, body: Buffer.from(upstreamBody) }),
    fetchCoords: async () => coords,
    peerName: () => u,
    log: () => {},
  };
}

test("wloc + 可用座標 → 改寫成目標座標，Content-Length 正確", async () => {
  const r = await proxyDecide(ctx(), deps({ upstreamBody: wlocResp(0, 0), coords: { latitude: 25.0330, longitude: 121.5654, enabled: true } }));
  assert.equal(r.rewritten, true);
  const c = readCoord(r.body);
  assert.ok(Math.abs(c.lat - 25.0330) < 1e-6, "lat=" + c.lat);
  assert.ok(Math.abs(c.lng - 121.5654) < 1e-6, "lng=" + c.lng);
  assert.equal(r.headers["Content-Length"], String(r.body.length));
});

test("非 wloc（GET /）→ 原封放行", async () => {
  const r = await proxyDecide(ctx({ method: "GET", url: "/" }), deps({ upstreamBody: Buffer.from("hello"), coords: { latitude: 1, longitude: 1, enabled: true } }));
  assert.equal(r.rewritten, false);
  assert.equal(r.body.toString(), "hello");
});

test("非目標網域 → 不改寫（就算路徑是 /clls/wloc）", async () => {
  const r = await proxyDecide(ctx({ host: "apple.com" }), deps({ upstreamBody: wlocResp(9, 9), coords: { latitude: 1, longitude: 1, enabled: true } }));
  assert.equal(r.rewritten, false);
  assert.ok(Math.abs(readCoord(r.body).lat - 9) < 1e-6);
});

test("查不到座標（朋友未登記 / picker 掛）→ fail-open 放行", async () => {
  const r = await proxyDecide(ctx(), deps({ upstreamBody: wlocResp(5, 5), coords: null }));
  assert.equal(r.rewritten, false);
  assert.ok(Math.abs(readCoord(r.body).lat - 5) < 1e-6, "應保留原座標");
});

test("enabled:false（恢復真實定位）→ 放行不改", async () => {
  const r = await proxyDecide(ctx(), deps({ upstreamBody: wlocResp(7, 7), coords: { latitude: 1, longitude: 1, enabled: false } }));
  assert.equal(r.rewritten, false);
  assert.ok(Math.abs(readCoord(r.body).lat - 7) < 1e-6);
});

test("上游回應無法解析 → fail-open（原封放行，不弄斷連線）", async () => {
  const garbage = Buffer.from([0xff, 0xff, 0xff, 0xff]);
  const r = await proxyDecide(ctx(), deps({ upstreamBody: garbage, coords: { latitude: 25, longitude: 121, enabled: true } }));
  assert.equal(r.rewritten, false);
  assert.deepEqual(Buffer.from(r.body), garbage);
});

test("剝掉 content-encoding / transfer-encoding，保留其他標頭", async () => {
  const r = await proxyDecide(ctx(), deps({
    upstreamBody: wlocResp(0, 0),
    upstreamHeaders: { "content-encoding": "gzip", "transfer-encoding": "chunked", "x-apple": "1" },
    coords: { latitude: 25, longitude: 121, enabled: true },
  }));
  assert.ok(!("content-encoding" in r.headers) && !("Content-Encoding" in r.headers));
  assert.ok(!("transfer-encoding" in r.headers));
  assert.equal(r.headers["x-apple"], "1");
  assert.equal(r.headers["Content-Length"], String(r.body.length));
});
