/**
 * iOS Location Picker — Cloudflare Worker
 *
 * API（与 location-picker/server.js 兼容）：
 *   GET  /loc.json?token=   → 读取坐标 JSON（Loon / Shadowrocket configUrl）
 *   POST /set?token=        → 保存坐标
 *   GET  /?token=           → 地图选点网页（必须带正确 token）
 */

import { PAGE } from "./page.js";

const KV_KEY = "loc";

// 180×180 定位图钉图标，供 PWA「添加到主屏幕」使用；不含敏感信息，无需 token。
const ICON_180_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAIAAACyr5FlAAAE8klEQVR42u2dMU4jQRREOQJH4Ag+AkfYI3AEYiJESuDAIYGTDZFISBGRQ+SIFGcO7dBhr0YrEbBosWd+z3TVf18VoQV6PY/p39U1PWdnNwWh78VHgIADAQcCDgQcCDgQcCDgQMCBgAMBB0LAgYADAQcCDgQcCDgQcCDgQMCBgAMh4EDAgYADAQcCDgQcCDgQcCDgQMCBEHAg4EDAcaQuH8r1c5mvyutHp3/r79fnq+6fXT4Ah7tmi+5ir7elX6233bfPFsBhpIv77qJudiWqNrvuB17cA4f43PH0XurV07v7jOM6g3zbSdSo1w/fucbs/3N+V5ZvZfxavnW/Gjja1a/fZX8oU9X+0A0AOLhh5LiFeKxHei9Qa9R667KWMeg9J5xK/jPFOHSpkAEfhnC0TIYJH5ABH1ZwXNxrkPHJh2p/qrhqbWptcuT6RXJ9KzfiRvyMHv4HcFT3QHVLzz/VmlCEWo1vmw+xyYUJhclFHo7ZoniU0spWZaCj5TNGyH8AR3Cmy6lk8mMSo6yU9tsfuibg6vHr1bp86L64fKvV/z69A0ecHxpem113+Y/57VePkeHkz9LwTNsf4nwVfLe4fj55DNfPwXeR+Qo4IhT4h7ve9l8szBaRtv1mBxwtrWCHb3DEbusIrGmTzClRW1+BfAjMLI2PL+RKxIYqoqIk6y1wDFNI9ehAf+xPQwo4Jva+KrV+IW1y625Yy4ML+QM90s84VVePLd7SEsExvBvdHyoOb3jn0XpP6r3ZVnWLfHiEoPVNOG84Ks0pUTMLcEy5VKna8YX0y8AxGRyMEDiAAziAAziAAzhoSIGDpSxLWUww4MA+xz5n442NN7bs2bIn7EPYh5ggMUECxgSMgYNHE4CDh5qAg8cheRySB6l5kJojGAYURzA054a1Uxze0twmXCPFsU9Nr2mnLQ6Ma3SLfPLiqMla4pBa4HBuO5QaDi04DNoOsXevKI1VvO3Qe3GC1nC1XsPzpeHQeyWP2HBvyu2LJBy3L0Xuo5Z8U5PczUNvnSIKR2BKb7RqPUjsBEdsyKN2aUQ3nOAQep+X3tu71OFQ8cTEXC8bOCT28WV2583gqBcCShfqsYSjRoIwXRbQFY7w+HG6CLE3HG16YqqulxkcbRrqkma5JRznd215YpudxW3DA46o0zKiqupZU8Ax2fP4w0vg2fmEcDTiiWm7Xq5wtGCoa5vl3nBMHjIVi4imgmPakKleRDQbHFOFTCUjotngmMoTM3G97OEY31A3McszwDF+yFQ1IpoTjjFDpsIR0bRwjBYyFY6IpoVjHE/MzfXKA8cIhrqVWZ4KjtohU/mIaHI4qoZMDV2vVHDUC5k6RESBo4YnZut6ZYOjhqHuaZbnhCM2ZOoTEQWO8JCpT0QUOGJDplYRUeCI9cTMXa+0cAw31M3N8uRwDAyZukVEgSMqZGoYEQWOkJCpZ0QUOEI8sSyuF3CcaqhnMcuBo0fI1DYiChwDQ6bOEVHgGBgydY6IAscQTyyd6wUcxxvqucxy4Dg+ZOofEQWO3iHTjK4XcBwTMk0REQWOHp5YXtcLOH401JOa5cDxY8g0UUQUOE4NmSaKiALHSSHTXBFR4DjJE8vuegEHAg4EHAg4EHAg4EDAgYADAQcCDoSAAwEHAg4EHAg4EHAg4EDAgYADAQcCDj4CBBwIOBBwIOBAwIGAA0npD0TNwcqzzRXCAAAAAElFTkSuQmCC";
const ICON_180 = Uint8Array.from(atob(ICON_180_B64), (c) => c.charCodeAt(0));

const DEFAULT = {
  enabled: true,          // false = 脚本放行原始响应（恢复真实定位）
  latitude: 37.3349,
  longitude: -122.00902,
  altitude: 530,
  horizontalAccuracy: 39,
  verticalAccuracy: 1000,
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // 选点页 URL 带 ?token=，务必阻止它经 Referer 泄漏给 unpkg / 高德 / OSM / open-meteo / nominatim
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

// 选点页专属 CSP：页面 URL 带 token，锁死脚本来源与可连接域名做纵深防御，
// 万一 CDN 被投毒也无法把 token 外传。script/style 需 'unsafe-inline'（页面自身内联），
// 外部脚本只放行 unpkg（已配 SRI）；connect 只放行地图/地理编码接口。
const PAGE_CSP = [
  "default-src 'none'",
  "script-src https://unpkg.com 'unsafe-inline'",
  "style-src https://unpkg.com 'unsafe-inline'",
  "img-src 'self' https: data:", // 地图瓦片（高德 wprd0*/webst0*、OSM 多子域）
  "connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

function jsonResponse(body, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS,
    },
  });
}

function textResponse(body, contentType, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      ...CORS,
    },
  });
}

function unauthorized() {
  return jsonResponse({ error: "bad token" }, 403);
}

// 常量时间比较，避免通过响应时延逐字节爆破 token
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(String(a));
  const bb = enc.encode(String(b));
  if (ab.length !== bb.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < ab.length; i += 1) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}

function checkToken(request, env) {
  const configured = env.TOKEN;
  if (!configured) {
    return { ok: false, error: "server misconfigured: TOKEN secret not set" };
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token == null || !safeEqual(token, configured)) {
    return { ok: false, error: "bad token" };
  }
  return { ok: true };
}

async function readLoc(env) {
  try {
    const raw = await env.LOC_KV.get(KV_KEY);
    if (!raw) {
      return { ...DEFAULT };
    }
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT };
  }
}

async function writeLoc(env, obj) {
  await env.LOC_KV.put(KV_KEY, JSON.stringify(obj));
}

function setInt(target, key, value) {
  if (value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value))) {
    target[key] = Math.round(Number(value));
  }
}

function wrapLng(lng) {
  return ((((Number(lng) + 180) % 360) + 360) % 360) - 180;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const auth = checkToken(request, env);

    if (url.pathname === "/loc.json" && request.method === "GET") {
      if (!auth.ok) {
        return unauthorized();
      }
      const loc = await readLoc(env);
      return jsonResponse(loc);
    }

    if (url.pathname === "/set" && request.method === "POST") {
      if (!auth.ok) {
        return unauthorized();
      }
      let bodyText;
      try {
        bodyText = await request.text();
        if (bodyText.length > 10000) {
          return jsonResponse({ error: "payload too large" }, 413);
        }
        const j = JSON.parse(bodyText);
        const la = Number(j.lat);
        const loRaw = Number(j.lng);
        if (!Number.isFinite(la) || !Number.isFinite(loRaw) || la < -90 || la > 90) {
          return jsonResponse({ error: "bad coords" }, 400);
        }
        const lo = wrapLng(loRaw);
        const cur = await readLoc(env);
        cur.enabled = true; // 保存一个新位置 = 开启伪造
        cur.latitude = la;
        cur.longitude = lo;
        setInt(cur, "altitude", j.altitude);
        setInt(cur, "horizontalAccuracy", j.horizontalAccuracy);
        setInt(cur, "verticalAccuracy", j.verticalAccuracy);
        await writeLoc(env, cur);
        return jsonResponse(cur);
      } catch {
        return jsonResponse({ error: "bad json" }, 400);
      }
    }

    // ---- 一键切换：伪造 / 恢复真实定位 ----
    if (url.pathname === "/enable" && request.method === "POST") {
      if (!auth.ok) {
        return unauthorized();
      }
      let bodyText;
      try {
        bodyText = await request.text();
        if (bodyText.length > 10000) {
          return jsonResponse({ error: "payload too large" }, 413);
        }
        const j = JSON.parse(bodyText);
        const cur = await readLoc(env);
        cur.enabled = j.enabled !== false; // false=恢复真实定位（脚本放行）
        await writeLoc(env, cur);
        return jsonResponse(cur);
      } catch (error) {
        return jsonResponse({ error: "bad json" }, 400);
      }
    }

    if ((url.pathname === "/" || url.pathname === "") && request.method === "GET") {
      if (!auth.ok) {
        return unauthorized();
      }
      return new Response(PAGE, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Security-Policy": PAGE_CSP,
          ...CORS,
        },
      });
    }

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, kv: !!env.LOC_KV, tokenConfigured: !!env.TOKEN });
    }

    // PWA 图标：无需 token（不含敏感信息），供「添加到主屏幕」和浏览器标签使用
    if (
      url.pathname === "/icon-180.png" ||
      url.pathname === "/apple-touch-icon.png" ||
      url.pathname === "/apple-touch-icon-precomposed.png"
    ) {
      return new Response(ICON_180, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=604800, immutable",
          ...CORS,
        },
      });
    }

    // 浏览器会自动请求 favicon；这里静默返 204，避免落到 404 分支产生噪音日志
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204, headers: CORS });
    }

    return textResponse("not found", "text/plain", 404);
  },
};
