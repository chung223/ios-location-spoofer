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

// 512×512 同款图标，供 PWA manifest（Android/桌面安装）使用。
const ICON_512_B64 =
  "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";
const ICON_512 = Uint8Array.from(atob(ICON_512_B64), (c) => c.charCodeAt(0));

const DEFAULT = {
  enabled: true,          // false = 脚本放行原始响应（恢复真实定位）
  latitude: 25.0330,
  longitude: 121.5654,
  altitude: 10,
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
  "manifest-src 'self'", // PWA manifest（同源，带 token）
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

// 多用户：URL 带 ?u=<名字> 时，定位存到独立的 KV 键（loc:<名字>），
// 一个部署即可分享给多位朋友，各自的定位互不干扰。
// 不带 u（或清洗后为空）时用默认键 "loc"，与旧的单人用法完全兼容。
// 名字只保留 a-z 0-9 _ - （小写），最长 32 字符，避免污染 KV 键。
function cleanName(raw) {
  return String(raw == null ? "" : raw).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}
function keyForName(name) {
  const safe = cleanName(name);
  return safe ? KV_KEY + ":" + safe : KV_KEY;
}
function scopeKey(url) {
  return keyForName(url.searchParams.get("u"));
}

async function readLoc(env, key) {
  try {
    const raw = await env.LOC_KV.get(key);
    if (!raw) {
      return { ...DEFAULT };
    }
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT };
  }
}

async function writeLoc(env, key, obj) {
  await env.LOC_KV.put(key, JSON.stringify(obj));
}

// 微抖动：在半径 meters 内加一个随机偏移，让定位像真手机一样轻微漂移（反“定死在原地”露馅）。
// 均匀撒在圆面内（sqrt 让分布不偏心）。
function applyJitter(lat, lng, meters) {
  const m = Number(meters);
  if (!Number.isFinite(m) || m <= 0) {
    return { lat, lng };
  }
  const ang = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * m;
  const dLat = (r * Math.cos(ang)) / 111320;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLng = (r * Math.sin(ang)) / (111320 * (Math.abs(cosLat) < 1e-6 ? 1e-6 : cosLat));
  return { lat: lat + dLat, lng: wrapLng(lng + dLng) };
}

// —— 路线移动：沿一条折线按时间前进，让定位“会动” ——
// 两点间大圆距离（米）。
function haversineMeters(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(bLat - aLat);
  const dLng = toR(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// 沿折线走 distMeters 后的位置。loop=true 循环；否则走到终点停在终点。
function positionAlongRoute(route, distMeters, loop) {
  if (!Array.isArray(route) || route.length === 0) return null;
  if (route.length === 1) return [Number(route[0][0]), Number(route[0][1])];
  const segs = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    const d = haversineMeters(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
    segs.push(d);
    total += d;
  }
  if (total === 0) return [Number(route[0][0]), Number(route[0][1])];
  let dist = distMeters;
  if (loop) {
    dist = ((dist % total) + total) % total;
  } else if (dist <= 0) {
    return [Number(route[0][0]), Number(route[0][1])];
  } else if (dist >= total) {
    const last = route[route.length - 1];
    return [Number(last[0]), Number(last[1])];
  }
  for (let i = 0; i < segs.length; i += 1) {
    if (dist <= segs[i] || i === segs.length - 1) {
      const f = segs[i] > 0 ? dist / segs[i] : 0;
      const a = route[i];
      const b = route[i + 1];
      return [Number(a[0]) + (Number(b[0]) - Number(a[0])) * f, Number(a[1]) + (Number(b[1]) - Number(a[1])) * f];
    }
    dist -= segs[i];
  }
  const last = route[route.length - 1];
  return [Number(last[0]), Number(last[1])];
}

// 某个存档在 now 时刻的“基准点”（处理路线移动；否则用固定 lat/lng）。不含跟随/抖动。
function computeBasePoint(rec, now) {
  if (rec && rec.mode === "route" && Array.isArray(rec.route) && rec.route.length >= 2) {
    const speed = Number(rec.speed) > 0 ? Number(rec.speed) : 1.4; // 默认步行 ~1.4 m/s
    const started = Number(rec.startedAt) || now;
    const dist = Math.max(0, (now - started) / 1000) * speed;
    const p = positionAlongRoute(rec.route, dist, !!rec.loop);
    if (p) return { lat: p[0], lng: p[1] };
  }
  return { lat: Number(rec.latitude), lng: Number(rec.longitude) };
}

// 清掉“移动”相关字段（回到固定点时用）。
function clearMotion(rec) {
  delete rec.mode;
  delete rec.route;
  delete rec.speed;
  delete rec.startedAt;
  delete rec.loop;
}

// 计算“真正要回给 iPhone 的坐标”：先跟随（镜像另一个用户的实时点，只跟一层避免环）
// 或按自己的路线移动，再套用微抖动。raw=1 时跳过，用于选点页显示“存下来的锚点”本身。
async function resolveLoc(env, base, now) {
  const t = Number.isFinite(now) ? now : Date.now();
  const eff = { ...base };
  let src = base;
  if (base && base.mirror) {
    src = await readLoc(env, keyForName(base.mirror)); // 跟随对方的实时点（含其路线移动）
  }
  const p = computeBasePoint(src, t);
  eff.latitude = p.lat;
  eff.longitude = p.lng;
  if (base && base.jitter) {
    const j = applyJitter(Number(eff.latitude), Number(eff.longitude), base.jitter);
    eff.latitude = j.lat;
    eff.longitude = j.lng;
  }
  return eff;
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
    const locKey = scopeKey(url); // 多用户：?u=<名字> → 独立定位

    if (url.pathname === "/loc.json" && request.method === "GET") {
      if (!auth.ok) {
        return unauthorized();
      }
      const base = await readLoc(env, locKey);
      // raw=1：返回存下来的锚点本身（选点页用），不做跟随/移动/抖动。
      // 否则：脚本读到的是“解析后”的坐标（含跟随/路线移动 + 微抖动）。
      // now=<毫秒> 可覆盖参考时间（测试/预览路线用）。
      const nowOv = Number(url.searchParams.get("now"));
      const now = Number.isFinite(nowOv) && nowOv > 0 ? nowOv : Date.now();
      const loc = url.searchParams.get("raw") ? base : await resolveLoc(env, base, now);
      return jsonResponse(loc);
    }

    // 用网址就能改定位（GET，方便加书签 / 主屏幕图标 / 极简捷径）：
    //   /set?token=..&lat=..&lng=..   （可选 &alt= &hacc= &vacc=）
    if (url.pathname === "/set" && request.method === "GET") {
      if (!auth.ok) {
        return unauthorized();
      }
      const la = Number(url.searchParams.get("lat"));
      const loRaw = Number(url.searchParams.get("lng"));
      if (!Number.isFinite(la) || !Number.isFinite(loRaw) || la < -90 || la > 90) {
        return jsonResponse({ error: "bad coords" }, 400);
      }
      const lo = wrapLng(loRaw);
      const cur = await readLoc(env, locKey);
      cur.enabled = true;
      cur.latitude = la;
      cur.longitude = lo;
      delete cur.mirror; // 手动选点 = 取消跟随/移动
      clearMotion(cur);
      setInt(cur, "altitude", url.searchParams.get("alt"));
      setInt(cur, "horizontalAccuracy", url.searchParams.get("hacc"));
      setInt(cur, "verticalAccuracy", url.searchParams.get("vacc"));
      await writeLoc(env, locKey, cur);
      const html =
        "<!doctype html><meta charset=utf-8>" +
        "<meta name=viewport content='width=device-width,initial-scale=1'>" +
        "<body style='margin:0;font-family:-apple-system,sans-serif;background:#111;color:#fff;display:flex;" +
        "flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center'>" +
        "<div style='font-size:52px'>✅</div>" +
        "<div style='font-size:20px;font-weight:600;margin-top:8px'>已設定定位</div>" +
        "<div style='font-family:ui-monospace,monospace;margin-top:6px'>" +
        la.toFixed(5) + ", " + lo.toFixed(5) +
        "</div><div style='color:#8e8e93;font-size:13px;margin-top:14px'>關開一次定位服務即生效</div></body>";
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...CORS },
      });
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
        const cur = await readLoc(env, locKey);
        cur.enabled = true; // 保存一个新位置 = 开启伪造
        cur.latitude = la;
        cur.longitude = lo;
        delete cur.mirror; // 手动选点 = 取消跟随/移动
        clearMotion(cur);
        setInt(cur, "altitude", j.altitude);
        setInt(cur, "horizontalAccuracy", j.horizontalAccuracy);
        setInt(cur, "verticalAccuracy", j.verticalAccuracy);
        await writeLoc(env, locKey, cur);
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
        const cur = await readLoc(env, locKey);
        cur.enabled = j.enabled !== false; // false=恢复真实定位（脚本放行）
        await writeLoc(env, locKey, cur);
        return jsonResponse(cur);
      } catch (error) {
        return jsonResponse({ error: "bad json" }, 400);
      }
    }

    // ---- 微抖动：让定位轻微随机漂移，像真手机（meters=0 关闭，最大 500） ----
    if (url.pathname === "/jitter" && request.method === "POST") {
      if (!auth.ok) {
        return unauthorized();
      }
      try {
        const bodyText = await request.text();
        if (bodyText.length > 10000) {
          return jsonResponse({ error: "payload too large" }, 413);
        }
        const j = JSON.parse(bodyText);
        let m = Math.round(Number(j.meters));
        if (!Number.isFinite(m) || m < 0) m = 0;
        if (m > 500) m = 500;
        const cur = await readLoc(env, locKey);
        if (m > 0) cur.jitter = m;
        else delete cur.jitter;
        await writeLoc(env, locKey, cur);
        return jsonResponse(cur);
      } catch {
        return jsonResponse({ error: "bad json" }, 400);
      }
    }

    // ---- 跟随朋友：本账号定位镜像另一个 u=<名字>（{clear:true} 取消） ----
    if (url.pathname === "/mirror" && request.method === "POST") {
      if (!auth.ok) {
        return unauthorized();
      }
      try {
        const bodyText = await request.text();
        if (bodyText.length > 10000) {
          return jsonResponse({ error: "payload too large" }, 413);
        }
        const j = JSON.parse(bodyText);
        const cur = await readLoc(env, locKey);
        const name = cleanName(j.u);
        if (j.clear || !name) {
          delete cur.mirror;
        } else {
          cur.mirror = name;
          clearMotion(cur); // 跟随时暂停自己的路线移动
        }
        cur.enabled = true;
        await writeLoc(env, locKey, cur);
        return jsonResponse(cur);
      } catch {
        return jsonResponse({ error: "bad json" }, 400);
      }
    }

    // ---- 路线移动：沿折线按速度移动，让定位“会动”。{stop:true} 停在当前插值位置 ----
    if (url.pathname === "/route" && request.method === "POST") {
      if (!auth.ok) {
        return unauthorized();
      }
      try {
        const bodyText = await request.text();
        if (bodyText.length > 100000) {
          return jsonResponse({ error: "payload too large" }, 413);
        }
        const j = JSON.parse(bodyText);
        const cur = await readLoc(env, locKey);
        if (j.stop) {
          const p = computeBasePoint(cur, Date.now());
          cur.latitude = p.lat;
          cur.longitude = p.lng;
          clearMotion(cur);
          await writeLoc(env, locKey, cur);
          return jsonResponse(cur);
        }
        const route = Array.isArray(j.route) ? j.route : null;
        if (!route || route.length < 2 || route.length > 200) {
          return jsonResponse({ error: "route needs 2..200 points" }, 400);
        }
        const clean = [];
        for (const pt of route) {
          const la = Number(pt && pt[0]);
          const lo = Number(pt && pt[1]);
          if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
            return jsonResponse({ error: "bad route point" }, 400);
          }
          clean.push([la, lo]);
        }
        let speed = Number(j.speed);
        if (!Number.isFinite(speed) || speed <= 0) speed = 1.4;
        if (speed > 300) speed = 300;
        delete cur.mirror;
        cur.enabled = true;
        cur.mode = "route";
        cur.route = clean;
        cur.speed = speed;
        cur.loop = !!j.loop;
        cur.startedAt = Date.now();
        cur.latitude = clean[0][0];
        cur.longitude = clean[0][1];
        await writeLoc(env, locKey, cur);
        return jsonResponse(cur);
      } catch {
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

    if (url.pathname === "/icon-512.png") {
      return new Response(ICON_512, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=604800, immutable",
          ...CORS,
        },
      });
    }

    // PWA manifest（带 token；start_url 含 token，Android/桌面安装后可直接打开）
    if (url.pathname === "/manifest.webmanifest" && request.method === "GET") {
      if (!auth.ok) {
        return unauthorized();
      }
      const t = url.searchParams.get("token") || "";
      const u = url.searchParams.get("u") || "";
      const startUrl = "/?token=" + encodeURIComponent(t) + (u ? "&u=" + encodeURIComponent(u) : "");
      const manifest = {
        name: "定位選點",
        short_name: "定位選點",
        start_url: startUrl,
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#007aff",
        icons: [
          { src: "/icon-180.png", sizes: "180x180", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      };
      return new Response(JSON.stringify(manifest), {
        status: 200,
        headers: {
          "Content-Type": "application/manifest+json",
          "Cache-Control": "no-store",
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
