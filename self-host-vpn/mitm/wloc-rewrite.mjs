// gs-loc / clls/wloc 回應改寫核心（伺服器版）。
//
// 這是把專案根目錄 location-spoofer.js（AGPL-3.0）裡「與 Surge/Loon 執行環境無關」的
// 純位元組處理函式抽出來、原樣移植成可重用的 Node 模組，供本機 MITM proxy 使用。
// 行為與已驗證的 Surge 版一致：解 ARPC/protobuf → 換 Wi-Fi/基站座標 → 依原格式封回。
//
// 授權：衍生自 location-spoofer.js，同樣依 AGPL-3.0 釋出。

const APPLE_WLOC_PREFIX = bytesFromArray([0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);
const APPLE_WLOC_MARKER = bytesFromArray([0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);
const ROOT_DROP_FIELDS = { 3: true, 4: true, 33: true };
const CELL_RESPONSE_FIELDS = { 22: true, 24: true };
const LOCATION_REPLACED_FIELDS = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 11: true, 12: true };

const DEFAULTS = {
  latitude: 37.3349,
  longitude: -122.00902,
  horizontalAccuracy: 39,
  verticalAccuracy: 1000,
  altitude: 530,
  unknownValue4: 3,
  motionActivityType: 63,
  motionActivityConfidence: 467,
};

function bytesFromArray(values) {
  return new Uint8Array(values);
}

function concatBytes(parts) {
  let total = 0;
  for (let i = 0; i < parts.length; i += 1) total += parts[i].length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (let i = 0; i < parts.length; i += 1) {
    out.set(parts[i], offset);
    offset += parts[i].length;
  }
  return out;
}

function findBytes(bytes, marker) {
  if (!bytes || !marker || marker.length === 0) return -1;
  for (let i = 0; i <= bytes.length - marker.length; i += 1) {
    let ok = true;
    for (let j = 0; j < marker.length; j += 1) {
      if (bytes[i + j] !== marker[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

function tryParseFields(bytes) {
  try {
    if (!bytes || bytes.length === 0) return null;
    const fields = parseFields(bytes);
    return fields.length > 0 ? fields : null;
  } catch (e) {
    return null;
  }
}

export function binaryStringToBytes(value) {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) out[i] = value.charCodeAt(i) & 0xff;
  return out;
}

export function bytesToBinaryString(bytes) {
  const chunkSize = 0x8000;
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, Array.prototype.slice.call(chunk)));
  }
  return chunks.join("");
}

function readUInt16BE(bytes, offset) {
  if (offset + 2 > bytes.length) throw new Error("uint16 out of range");
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUInt32BE(bytes, offset) {
  if (offset + 4 > bytes.length) throw new Error("uint32 out of range");
  return ((bytes[offset] * 0x1000000) + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0;
}

function writeUInt16BE(value) {
  if (value < 0 || value > 0xffff) throw new Error("uint16 value out of range: " + value);
  return bytesFromArray([(value >> 8) & 0xff, value & 0xff]);
}

function writeUInt32BE(value) {
  return bytesFromArray([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function asciiBytes(value) {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) out[i] = value.charCodeAt(i) & 0x7f;
  return out;
}

function encodeVarintUnsigned(value) {
  let v = typeof value === "bigint" ? value : BigInt(value);
  if (v < 0n) throw new Error("negative unsigned varint");
  const out = [];
  while (v >= 0x80n) {
    out.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  out.push(Number(v));
  return bytesFromArray(out);
}

function encodeVarintSignedInt64(value) {
  let v = typeof value === "bigint" ? value : BigInt(Math.trunc(value));
  if (v < 0n) v = BigInt.asUintN(64, v);
  return encodeVarintUnsigned(v);
}

function decodeVarint(bytes, offset) {
  let result = 0n;
  let shift = 0n;
  let current = offset;
  while (current < bytes.length) {
    const b = bytes[current];
    current += 1;
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value: result, offset: current };
    shift += 7n;
    if (shift > 70n) throw new Error("varint too long");
  }
  throw new Error("unterminated varint");
}

function makeKey(fieldNumber, wireType) {
  return encodeVarintUnsigned((BigInt(fieldNumber) << 3n) | BigInt(wireType));
}

export function makeVarintField(fieldNumber, value) {
  return concatBytes([makeKey(fieldNumber, 0), encodeVarintSignedInt64(value)]);
}

export function makeLengthDelimitedField(fieldNumber, payload) {
  return concatBytes([makeKey(fieldNumber, 2), encodeVarintUnsigned(payload.length), payload]);
}

export function parseFields(bytes) {
  const fields = [];
  let offset = 0;
  while (offset < bytes.length) {
    const keyStart = offset;
    const key = decodeVarint(bytes, offset);
    offset = key.offset;
    const fieldNumber = Number(key.value >> 3n);
    const wireType = Number(key.value & 0x7n);
    if (fieldNumber === 0) throw new Error("protobuf field number 0");
    let valueStart = offset;
    let valueEnd;
    if (wireType === 0) valueEnd = decodeVarint(bytes, offset).offset;
    else if (wireType === 1) valueEnd = offset + 8;
    else if (wireType === 2) {
      const lengthInfo = decodeVarint(bytes, offset);
      const length = Number(lengthInfo.value);
      valueStart = lengthInfo.offset;
      valueEnd = valueStart + length;
    } else if (wireType === 5) valueEnd = offset + 4;
    else throw new Error("unsupported protobuf wire type: " + wireType);
    if (valueEnd > bytes.length) throw new Error("protobuf field exceeds buffer");
    fields.push({
      fieldNumber, wireType, keyStart, valueStart, valueEnd, end: valueEnd,
      raw: bytes.slice(keyStart, valueEnd),
      valueBytes: bytes.slice(valueStart, valueEnd),
    });
    offset = valueEnd;
  }
  return fields;
}

export function firstFieldByNumber(fields, fieldNumber) {
  for (let i = 0; i < fields.length; i += 1) if (fields[i].fieldNumber === fieldNumber) return fields[i];
  return null;
}

export function signedVarintFieldValue(field) {
  if (!field || field.wireType !== 0) return null;
  return BigInt.asIntN(64, decodeVarint(field.valueBytes, 0).value);
}

function isCellResponseField(fieldNumber) {
  return CELL_RESPONSE_FIELDS[fieldNumber] === true;
}

function coordToInt(value) {
  return Math.trunc(Number(value) * 100000000);
}

function patchLocation(locationPayload, config) {
  const parts = [];
  const fields = locationPayload.length ? parseFields(locationPayload) : [];
  for (let i = 0; i < fields.length; i += 1) {
    if (!LOCATION_REPLACED_FIELDS[fields[i].fieldNumber]) parts.push(fields[i].raw);
  }
  parts.push(makeVarintField(1, coordToInt(config.latitude)));
  parts.push(makeVarintField(2, coordToInt(config.longitude)));
  parts.push(makeVarintField(3, config.horizontalAccuracy));
  parts.push(makeVarintField(4, config.unknownValue4));
  parts.push(makeVarintField(5, config.altitude));
  parts.push(makeVarintField(6, config.verticalAccuracy));
  parts.push(makeVarintField(11, config.motionActivityType));
  parts.push(makeVarintField(12, config.motionActivityConfidence));
  return concatBytes(parts);
}

function patchWifiDevice(wifiPayload, config) {
  const fields = parseFields(wifiPayload);
  const parts = [];
  let patchedLocation = false;
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    if (field.fieldNumber === 2 && field.wireType === 2) {
      parts.push(makeLengthDelimitedField(2, patchLocation(field.valueBytes, config)));
      patchedLocation = true;
    } else parts.push(field.raw);
  }
  if (!patchedLocation) parts.push(makeLengthDelimitedField(2, patchLocation(bytesFromArray([]), config)));
  return concatBytes(parts);
}

function patchCellTower(cellPayload, config) {
  const fields = parseFields(cellPayload);
  const parts = [];
  let patchedLocation = false;
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    if (field.fieldNumber === 5 && field.wireType === 2) {
      parts.push(makeLengthDelimitedField(5, patchLocation(field.valueBytes, config)));
      patchedLocation = true;
    } else parts.push(field.raw);
  }
  if (!patchedLocation) parts.push(makeLengthDelimitedField(5, patchLocation(bytesFromArray([]), config)));
  return concatBytes(parts);
}

function patchAppleWLocPayload(payload, config) {
  const fields = parseFields(payload);
  const parts = [];
  let wifiCount = 0;
  let cellCount = 0;
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    if (field.fieldNumber === 2 && field.wireType === 2) {
      parts.push(makeLengthDelimitedField(2, patchWifiDevice(field.valueBytes, config)));
      wifiCount += 1;
    } else if (isCellResponseField(field.fieldNumber) && field.wireType === 2) {
      parts.push(makeLengthDelimitedField(field.fieldNumber, patchCellTower(field.valueBytes, config)));
      cellCount += 1;
    } else if (!ROOT_DROP_FIELDS[field.fieldNumber]) parts.push(field.raw);
  }
  return { payload: concatBytes(parts), wifiCount, cellCount };
}

function readPascalString(bytes, state) {
  const length = readUInt16BE(bytes, state.offset);
  state.offset += 2;
  if (state.offset + length > bytes.length) throw new Error("ARPC pascal string exceeds buffer");
  const chars = [];
  for (let i = 0; i < length; i += 1) chars.push(String.fromCharCode(bytes[state.offset + i]));
  state.offset += length;
  return chars.join("");
}

function writePascalString(value) {
  const bytes = asciiBytes(value);
  return concatBytes([writeUInt16BE(bytes.length), bytes]);
}

function parseArpc(bytes) {
  const state = { offset: 0 };
  const version = readUInt16BE(bytes, state.offset);
  state.offset += 2;
  const locale = readPascalString(bytes, state);
  const appIdentifier = readPascalString(bytes, state);
  const osVersion = readPascalString(bytes, state);
  const functionId = readUInt32BE(bytes, state.offset);
  state.offset += 4;
  const payloadLength = readUInt32BE(bytes, state.offset);
  state.offset += 4;
  if (state.offset + payloadLength > bytes.length) throw new Error("ARPC payload exceeds buffer");
  return { version, locale, appIdentifier, osVersion, functionId, payload: bytes.slice(state.offset, state.offset + payloadLength) };
}

function serializeArpc(arpc) {
  return concatBytes([
    writeUInt16BE(arpc.version),
    writePascalString(arpc.locale),
    writePascalString(arpc.appIdentifier),
    writePascalString(arpc.osVersion),
    writeUInt32BE(arpc.functionId),
    writeUInt32BE(arpc.payload.length),
    arpc.payload,
  ]);
}

export function buildAppleWLocResponse(payload, prefix) {
  return concatBytes([prefix || APPLE_WLOC_PREFIX, writeUInt16BE(payload.length), payload]);
}

function extractPrefixedAppleWLocPayload(responseBytes) {
  if (!responseBytes || responseBytes.length < 10) return null;
  if (responseBytes[0] !== 0x00 || responseBytes[1] !== 0x01) return null;
  if (responseBytes[6] !== 0x00 || responseBytes[7] !== 0x00) return null;
  const payloadLength = readUInt16BE(responseBytes, 8);
  const payloadOffset = 10;
  if (payloadLength <= 0 || payloadOffset + payloadLength > responseBytes.length) return null;
  const payload = responseBytes.slice(payloadOffset, payloadOffset + payloadLength);
  if (tryParseFields(payload) === null) return null;
  return { kind: "synthetic", payload, prefix: responseBytes.slice(0, 8), suffix: responseBytes.slice(payloadOffset + payloadLength) };
}

function looksLikeAppleWLocPayload(bytes) {
  if (!bytes || bytes.length === 0) return false;
  const tag = bytes[0];
  const fieldNumber = tag >> 3;
  const wireType = tag & 0x7;
  return fieldNumber > 0 && (wireType === 0 || wireType === 2);
}

export function extractAppleWLocPayload(responseBytes) {
  if (!responseBytes || responseBytes.length < 2) throw new Error("Apple WLoc response too short");
  const prefixed = extractPrefixedAppleWLocPayload(responseBytes);
  if (prefixed) return prefixed;
  try {
    const arpc = parseArpc(responseBytes);
    if (arpc.payload.length > 0 && tryParseFields(arpc.payload) !== null) return { kind: "arpc", payload: arpc.payload, arpc };
  } catch (e) {
    // fall through
  }
  const markerIdx = findBytes(responseBytes, APPLE_WLOC_MARKER);
  if (markerIdx >= 0) {
    const lenOffset = markerIdx + APPLE_WLOC_MARKER.length;
    if (lenOffset + 2 <= responseBytes.length) {
      const realLen = readUInt16BE(responseBytes, lenOffset);
      const realPayloadOffset = lenOffset + 2;
      if (realLen > 0 && realPayloadOffset + realLen <= responseBytes.length) {
        const candidatePayload = responseBytes.slice(realPayloadOffset, realPayloadOffset + realLen);
        if (tryParseFields(candidatePayload) !== null) {
          return {
            kind: "marker", payload: candidatePayload,
            prefix: responseBytes.slice(0, markerIdx),
            markerAndLen: responseBytes.slice(markerIdx, realPayloadOffset),
            suffix: responseBytes.slice(realPayloadOffset + realLen),
          };
        }
      }
    }
  }
  if (looksLikeAppleWLocPayload(responseBytes)) return { kind: "bare", payload: responseBytes };
  throw new Error("missing Apple WLoc response prefix");
}

export function normalizeConfig(input) {
  const src = input || {};
  // 缺值 / undefined / "" 一律回退預設（不能用 Object.assign：undefined 會蓋掉預設 → NaN → BigInt 爆炸）
  const pick = (k) => (src[k] === undefined || src[k] === null || src[k] === "" ? DEFAULTS[k] : src[k]);
  const cfg = {
    latitude: Number(pick("latitude")),
    longitude: Number(pick("longitude")),
    horizontalAccuracy: Math.trunc(Number(pick("horizontalAccuracy"))),
    verticalAccuracy: Math.trunc(Number(pick("verticalAccuracy"))),
    altitude: Math.trunc(Number(pick("altitude"))),
    unknownValue4: Math.trunc(Number(pick("unknownValue4"))),
    motionActivityType: Math.trunc(Number(pick("motionActivityType"))),
    motionActivityConfidence: Math.trunc(Number(pick("motionActivityConfidence"))),
  };
  if (!Number.isFinite(cfg.latitude) || cfg.latitude < -90 || cfg.latitude > 90) throw new Error("invalid latitude");
  if (!Number.isFinite(cfg.longitude) || cfg.longitude < -180 || cfg.longitude > 180) throw new Error("invalid longitude");
  // 精度/海拔若仍非有限值，回退預設，避免 BigInt(NaN) 爆掉
  for (const k of ["horizontalAccuracy", "verticalAccuracy", "altitude", "unknownValue4", "motionActivityType", "motionActivityConfidence"]) {
    if (!Number.isFinite(cfg[k])) cfg[k] = DEFAULTS[k];
  }
  return cfg;
}

// 主入口：吃 Apple /clls/wloc 的「已解壓」回應位元組 + 座標設定，回傳改寫後的位元組。
// 依原格式（ARPC / synthetic / marker / bare）封回，與 Surge 版一致。
export function spoofAppleResponse(responseBytes, configInput) {
  const config = normalizeConfig(configInput);
  const extraction = extractAppleWLocPayload(responseBytes);
  const patched = patchAppleWLocPayload(extraction.payload, config);
  let response;
  if (extraction.kind === "arpc") {
    response = serializeArpc({
      version: extraction.arpc.version,
      locale: extraction.arpc.locale,
      appIdentifier: extraction.arpc.appIdentifier,
      osVersion: extraction.arpc.osVersion,
      functionId: extraction.arpc.functionId,
      payload: patched.payload,
    });
  } else if (extraction.kind === "marker") {
    const newLenBytes = writeUInt16BE(patched.payload.length);
    response = concatBytes([
      extraction.prefix,
      extraction.markerAndLen.slice(0, APPLE_WLOC_MARKER.length),
      newLenBytes,
      patched.payload,
      extraction.suffix,
    ]);
  } else {
    response = buildAppleWLocResponse(patched.payload, extraction.prefix);
  }
  return { response, payload: patched.payload, wifiCount: patched.wifiCount, cellCount: patched.cellCount, kind: extraction.kind };
}
