import assert from "node:assert/strict";
import test from "node:test";
import {
  spoofAppleResponse,
  extractAppleWLocPayload,
  parseFields,
  firstFieldByNumber,
  signedVarintFieldValue,
  makeVarintField,
  makeLengthDelimitedField,
  buildAppleWLocResponse,
} from "./wloc-rewrite.mjs";

// —— 合成一個 Apple /clls/wloc 回應（含 Wi-Fi 定位子訊息），起始座標可控 ——
function locSub(lat, lng) {
  return concat([makeVarintField(1, Math.trunc(lat * 1e8)), makeVarintField(2, Math.trunc(lng * 1e8))]);
}
function wifiDev(lat, lng) {
  // 巢狀：root 的 field2 = Wi-Fi 裝置；Wi-Fi 裝置的 field2 = 定位子訊息（含 field1/2 座標）
  return makeLengthDelimitedField(2, makeLengthDelimitedField(2, locSub(lat, lng)));
}
function concat(arrs) {
  return new Uint8Array(Buffer.concat(arrs.map((a) => Buffer.from(a))));
}
function u16(n) { return Buffer.from([(n >> 8) & 0xff, n & 0xff]); }
function u32(n) { return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]); }
function pascal(s) { const b = Buffer.from(s, "ascii"); return Buffer.concat([u16(b.length), b]); }

// 讀回第一個 / 全部 Wi-Fi 的座標，驗證改寫結果
function readAllWifiCoords(responseBytes) {
  const ext = extractAppleWLocPayload(responseBytes);
  const root = parseFields(ext.payload);
  const out = [];
  for (const f of root) {
    if (f.fieldNumber === 2) {
      const loc = firstFieldByNumber(parseFields(f.valueBytes), 2);
      const lf = parseFields(loc.valueBytes);
      out.push({
        lat: Number(signedVarintFieldValue(firstFieldByNumber(lf, 1))) / 1e8,
        lng: Number(signedVarintFieldValue(firstFieldByNumber(lf, 2))) / 1e8,
      });
    }
  }
  return out;
}

const TAIPEI = { latitude: 25.0330, longitude: 121.5654 };

test("synthetic 前綴（APPLE_WLOC_PREFIX）：座標被改寫", () => {
  const payload = wifiDev(1.0, 2.0);
  const resp = buildAppleWLocResponse(payload);
  const out = spoofAppleResponse(resp, TAIPEI);
  assert.equal(out.kind, "synthetic");
  assert.equal(out.wifiCount, 1);
  const [c] = readAllWifiCoords(out.response);
  assert.ok(Math.abs(c.lat - 25.0330) < 1e-6, "lat=" + c.lat);
  assert.ok(Math.abs(c.lng - 121.5654) < 1e-6, "lng=" + c.lng);
});

test("真實前綴 0001000000030000（就是你 log 看到的那個）：改寫且前綴保留", () => {
  const realPrefix = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00]);
  const payload = Buffer.from(wifiDev(1.0, 2.0));
  const resp = new Uint8Array(Buffer.concat([realPrefix, u16(payload.length), payload]));
  const out = spoofAppleResponse(resp, TAIPEI);
  assert.equal(out.kind, "synthetic");
  // 前 8 bytes 前綴應原樣保留
  assert.deepEqual(Buffer.from(out.response.slice(0, 8)), realPrefix);
  const [c] = readAllWifiCoords(out.response);
  assert.ok(Math.abs(c.lat - 25.0330) < 1e-6);
  assert.ok(Math.abs(c.lng - 121.5654) < 1e-6);
});

test("ARPC 封包：以 ARPC 格式封回、座標被改寫、信封欄位保留", () => {
  const payload = Buffer.from(wifiDev(10, 20));
  const arpc = new Uint8Array(Buffer.concat([
    u16(1), pascal("en_US"), pascal("com.apple.locationd"), pascal("18.0"),
    u32(1), u32(payload.length), payload,
  ]));
  const out = spoofAppleResponse(arpc, TAIPEI);
  assert.equal(out.kind, "arpc");
  const [c] = readAllWifiCoords(out.response);
  assert.ok(Math.abs(c.lat - 25.0330) < 1e-6);
  assert.ok(Math.abs(c.lng - 121.5654) < 1e-6);
});

test("多個 Wi-Fi 裝置：全部被改成同一個目標座標", () => {
  const payload = concat([wifiDev(1, 1), wifiDev(2, 2), wifiDev(3, 3)]);
  const resp = buildAppleWLocResponse(payload);
  const out = spoofAppleResponse(resp, TAIPEI);
  assert.equal(out.wifiCount, 3);
  const coords = readAllWifiCoords(out.response);
  assert.equal(coords.length, 3);
  for (const c of coords) {
    assert.ok(Math.abs(c.lat - 25.0330) < 1e-6);
    assert.ok(Math.abs(c.lng - 121.5654) < 1e-6);
  }
});

test("負座標（南半球 / 西經）也正確", () => {
  const resp = buildAppleWLocResponse(wifiDev(0, 0));
  const out = spoofAppleResponse(resp, { latitude: -32.928231, longitude: -60.815463 }); // 阿根廷
  const [c] = readAllWifiCoords(out.response);
  assert.ok(Math.abs(c.lat - -32.928231) < 1e-6, "lat=" + c.lat);
  assert.ok(Math.abs(c.lng - -60.815463) < 1e-6, "lng=" + c.lng);
});

test("無效座標會被擋下", () => {
  const resp = buildAppleWLocResponse(wifiDev(0, 0));
  assert.throws(() => spoofAppleResponse(resp, { latitude: 999, longitude: 0 }));
});
