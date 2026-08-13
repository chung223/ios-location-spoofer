// 定位选点服务 —— 单文件、零依赖（仅用 Node 内置模块）
// 支持：高德矢量 / 高德卫星 / 国外 OSM 多地图切换，自动 GCJ-02<->WGS-84 坐标转换
// 搜索显示多个候选（只移动视野）；点地图/拖图钉移动定位点；点“保存定位”才写入
// 点地图自动按地形获取海拔；海拔/水平精度/垂直精度可手动微调
// 可选自带 https（复用 3x-ui 的 acme.sh 证书）
//
// 启动示例（http）：
//   TOKEN=你的密码 PORT=8080 node server.js
//
// 启动示例（https，复用已有证书）：
//   TOKEN=你的密码 PORT=8443 \
//   CERT=/root/cert/你的域名/fullchain.pem \
//   KEY=/root/cert/你的域名/privkey.pem \
//   node server.js
//
// Shadowrocket 模块 argument 末尾加：
//   &configUrl=https://你的域名:8443/loc.json?token=你的密码
//
// 注意：URL 必须带 ?token=<TOKEN>。缺 token → 服务端返回 401 + "missing token"；
// token 错 → 返回 403 + "bad token"。网页端点同样适用。

const http = require("http");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
// TOKEN 必设：不设直接退出，绝不用弱口令兜底（否则任何人都能读写你的定位）
const TOKEN = process.env.TOKEN || "";
if (!TOKEN) {
  console.error(
    "启动失败：未设置 TOKEN 环境变量。请用随机字符串启动，例如：\n" +
    "  TOKEN=$(openssl rand -hex 24) PORT=8080 node server.js"
  );
  process.exit(1);
}
const CERT = process.env.CERT || "";                   // https 证书 fullchain 路径（留空=http）
const KEY = process.env.KEY || "";                     // https 私钥路径
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "loc.json");

// 180×180 定位图钉图标，供 PWA「添加到主屏幕」使用；不含敏感信息，无需 token。
const ICON_180 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAIAAACyr5FlAAAE8klEQVR42u2dMU4jQRREOQJH4Ag+AkfYI3AEYiJESuDAIYGTDZFISBGRQ+SIFGcO7dBhr0YrEbBosWd+z3TVf18VoQV6PY/p39U1PWdnNwWh78VHgIADAQcCDgQcCDgQcCDgQMCBgAMBB0LAgYADAQcCDgQcCDgQcCDgQMCBgAMh4EDAgYADAQcCDgQcCDgQcCDgQMCBEHAg4EDAcaQuH8r1c5mvyutHp3/r79fnq+6fXT4Ah7tmi+5ir7elX6233bfPFsBhpIv77qJudiWqNrvuB17cA4f43PH0XurV07v7jOM6g3zbSdSo1w/fucbs/3N+V5ZvZfxavnW/Gjja1a/fZX8oU9X+0A0AOLhh5LiFeKxHei9Qa9R667KWMeg9J5xK/jPFOHSpkAEfhnC0TIYJH5ABH1ZwXNxrkPHJh2p/qrhqbWptcuT6RXJ9KzfiRvyMHv4HcFT3QHVLzz/VmlCEWo1vmw+xyYUJhclFHo7ZoniU0spWZaCj5TNGyH8AR3Cmy6lk8mMSo6yU9tsfuibg6vHr1bp86L64fKvV/z69A0ecHxpem113+Y/57VePkeHkz9LwTNsf4nwVfLe4fj55DNfPwXeR+Qo4IhT4h7ve9l8szBaRtv1mBxwtrWCHb3DEbusIrGmTzClRW1+BfAjMLI2PL+RKxIYqoqIk6y1wDFNI9ehAf+xPQwo4Jva+KrV+IW1y625Yy4ML+QM90s84VVePLd7SEsExvBvdHyoOb3jn0XpP6r3ZVnWLfHiEoPVNOG84Ks0pUTMLcEy5VKna8YX0y8AxGRyMEDiAAziAAziAAzhoSIGDpSxLWUww4MA+xz5n442NN7bs2bIn7EPYh5ggMUECxgSMgYNHE4CDh5qAg8cheRySB6l5kJojGAYURzA054a1Uxze0twmXCPFsU9Nr2mnLQ6Ma3SLfPLiqMla4pBa4HBuO5QaDi04DNoOsXevKI1VvO3Qe3GC1nC1XsPzpeHQeyWP2HBvyu2LJBy3L0Xuo5Z8U5PczUNvnSIKR2BKb7RqPUjsBEdsyKN2aUQ3nOAQep+X3tu71OFQ8cTEXC8bOCT28WV2583gqBcCShfqsYSjRoIwXRbQFY7w+HG6CLE3HG16YqqulxkcbRrqkma5JRznd215YpudxW3DA46o0zKiqupZU8Ax2fP4w0vg2fmEcDTiiWm7Xq5wtGCoa5vl3nBMHjIVi4imgmPakKleRDQbHFOFTCUjotngmMoTM3G97OEY31A3McszwDF+yFQ1IpoTjjFDpsIR0bRwjBYyFY6IpoVjHE/MzfXKA8cIhrqVWZ4KjtohU/mIaHI4qoZMDV2vVHDUC5k6RESBo4YnZut6ZYOjhqHuaZbnhCM2ZOoTEQWO8JCpT0QUOGJDplYRUeCI9cTMXa+0cAw31M3N8uRwDAyZukVEgSMqZGoYEQWOkJCpZ0QUOEI8sSyuF3CcaqhnMcuBo0fI1DYiChwDQ6bOEVHgGBgydY6IAscQTyyd6wUcxxvqucxy4Dg+ZOofEQWO3iHTjK4XcBwTMk0REQWOHp5YXtcLOH401JOa5cDxY8g0UUQUOE4NmSaKiALHSSHTXBFR4DjJE8vuegEHAg4EHAg4EHAg4EDAgYADAQcCDoSAAwEHAg4EHAg4EHAg4EDAgYADAQcCDj4CBBwIOBBwIOBAwIGAA0npD0TNwcqzzRXCAAAAAElFTkSuQmCC",
  "base64",
);

// 512×512 同款图标，供 PWA manifest（Android/桌面安装）使用。
const ICON_512 = Buffer.from(
  "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",
  "base64",
);

// 常量时间比较，避免通过响应时延逐字节爆破 token
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

// 字段名/默认值与 location-spoofer.js 的 DEFAULT_CONFIG 对齐
const DEFAULT = {
  enabled: true,          // false = 脚本放行原始响应（恢复真实定位）
  latitude: 25.0330,
  longitude: 121.5654,
  altitude: 10,
  horizontalAccuracy: 39,
  verticalAccuracy: 1000
};

function readLoc() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return Object.assign({}, DEFAULT);
  }
}

function writeLoc(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

function send(res, code, type, body) {
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

// 区分「没传 token」和「token 传错」：前者 401 引导补 ?token=，后者 403
function checkToken(token, res) {
  if (token == null || token === "") {
    send(res, 401, "application/json", '{"error":"missing token","hint":"add ?token=<TOKEN> to the URL (must match the TOKEN env var)"}');
    return false;
  }
  if (!safeEqual(token, TOKEN)) {
    send(res, 403, "application/json", '{"error":"bad token"}');
    return false;
  }
  return true;
}

function handler(req, res) {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const token = url.searchParams.get("token");

  // ---- Shadowrocket 读取坐标（存的就是 WGS-84，Apple 需要的格式） ----
  if (url.pathname === "/loc.json" && req.method === "GET") {
    if (!checkToken(token, res)) return;
    return send(res, 200, "application/json", JSON.stringify(readLoc()));
  }

  // ---- 网页保存（前端已转好 WGS-84 再发过来；海拔/精度可选） ----
  if (url.pathname === "/set" && req.method === "POST") {
    if (!checkToken(token, res)) return;
    let body = "";
    req.on("data", function (c) {
      body += c;
      if (body.length > 1e4) req.destroy();
    });
    req.on("end", function () {
      try {
        const j = JSON.parse(body);
        const la = Number(j.lat);
        const lo = Number(j.lng);
        if (
          !isFinite(la) || !isFinite(lo) ||
          la < -90 || la > 90 || lo < -180 || lo > 180
        ) {
          return send(res, 400, "application/json", '{"error":"bad coords"}');
        }
        const cur = readLoc();
        cur.enabled = true; // 保存一个新位置 = 开启伪造
        cur.latitude = la;
        cur.longitude = lo;
        // 海拔/精度：脚本里都会被 Math.trunc 成整数，这里取整存
        function setInt(key, v) {
          if (v !== undefined && v !== null && v !== "" && isFinite(Number(v))) {
            cur[key] = Math.round(Number(v));
          }
        }
        setInt("altitude", j.altitude);
        setInt("horizontalAccuracy", j.horizontalAccuracy);
        setInt("verticalAccuracy", j.verticalAccuracy);
        writeLoc(cur);
        return send(res, 200, "application/json", JSON.stringify(cur));
      } catch (e) {
        return send(res, 400, "application/json", '{"error":"bad json"}');
      }
    });
    return;
  }

  // ---- 一键切换：伪造 / 恢复真实定位 ----
  if (url.pathname === "/enable" && req.method === "POST") {
    if (!checkToken(token, res)) return;
    let body = "";
    req.on("data", function (c) {
      body += c;
      if (body.length > 1e4) req.destroy();
    });
    req.on("end", function () {
      try {
        const j = JSON.parse(body);
        const cur = readLoc();
        cur.enabled = j.enabled !== false; // false=恢复真实定位（脚本放行）
        writeLoc(cur);
        return send(res, 200, "application/json", JSON.stringify(cur));
      } catch (e) {
        return send(res, 400, "application/json", '{"error":"bad json"}');
      }
    });
    return;
  }

  // ---- PWA 图标：无需 token（不含敏感信息），供「添加到主屏幕」和浏览器标签使用 ----
  if (
    (url.pathname === "/icon-180.png" ||
      url.pathname === "/apple-touch-icon.png" ||
      url.pathname === "/apple-touch-icon-precomposed.png") &&
    req.method === "GET"
  ) {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=604800, immutable",
    });
    return res.end(ICON_180);
  }

  if (url.pathname === "/icon-512.png" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=604800, immutable",
    });
    return res.end(ICON_512);
  }

  // ---- PWA manifest（带 token；start_url 含 token 便于安装后直接打开） ----
  if (url.pathname === "/manifest.webmanifest" && req.method === "GET") {
    if (!checkToken(token, res)) return;
    const manifest = {
      name: "定位選點",
      short_name: "定位選點",
      start_url: "/?token=" + encodeURIComponent(token || ""),
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#007aff",
      icons: [
        { src: "/icon-180.png", sizes: "180x180", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    };
    return send(res, 200, "application/manifest+json", JSON.stringify(manifest));
  }

  // ---- 地图网页（与 Worker 版一致，必须带正确 token） ----
  if (url.pathname === "/" && req.method === "GET") {
    if (!checkToken(token, res)) return;
    return send(res, 200, "text/html; charset=utf-8", PAGE);
  }

  return send(res, 404, "text/plain", "not found");
}

// ---- 启动：有证书走 https，否则 http ----
function onListenError(err) {
  if (err.code === "EADDRINUSE") {
    console.error("启动失败：端口 " + PORT + " 已被占用，请改用其它空闲端口（修改 PORT 环境变量）。");
  } else if (err.code === "EACCES") {
    console.error("启动失败：没有权限监听端口 " + PORT + "（1024 以下端口需 root 权限）。");
  } else {
    console.error("启动失败：" + err.message);
  }
  process.exit(1);
}

function start() {
  if (CERT && KEY) {
    try {
      const opts = { cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) };
      const server = https.createServer(opts, handler);
      server.on("error", onListenError);
      // acme.sh 续期后无需重启：每 12 小时热加载一次证书
      setInterval(function () {
        try {
          server.setSecureContext({ cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) });
        } catch (e) {
          console.log("cert reload failed: " + e.message);
        }
      }, 12 * 3600 * 1000);
      server.listen(PORT, function () {
        console.log("location picker (https) listening on :" + PORT);
      });
      return;
    } catch (e) {
      console.log("https 启动失败（证书读取失败），回退到 http：" + e.message);
    }
  }
  const server = http.createServer(handler);
  server.on("error", onListenError);
  server.listen(PORT, function () {
    console.log("location picker (http) listening on :" + PORT);
  });
}

start();

// === PAGE:BEGIN 由 worker/src/page.js 生成，勿手改（改 UI 请改 page.js 再 npm run build:webui）===
const PAGE = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>定位選點</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="定位選點">
<meta name="theme-color" content="#0a84ff">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="icon" type="image/png" href="/icon-180.png">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous">
<style>
  :root{
    --bg:#eef0f4;--bg2:#f7f8fa;--card:#fff;--card2:#f2f3f6;
    --fg:#111318;--fg2:#6b7078;--fg3:#9aa0a8;--line:#e6e8ec;
    --accent:#0a84ff;--accent-soft:rgba(10,132,255,.12);--accent-glow:rgba(10,132,255,.06);
    --go:#30b45a;--go2:#37c163;--go-glow:rgba(48,180,90,.35);--go-soft:rgba(48,180,90,.15);
    --warn:#f0961e;--warn-soft:rgba(240,150,30,.15);--fav:#5b5be6;
    --sh-sm:0 1px 2px rgba(16,20,30,.05),0 2px 8px rgba(16,20,30,.05);
    --sh-md:0 2px 8px rgba(16,20,30,.07),0 18px 44px rgba(16,20,30,.08);
    --glass:rgba(255,255,255,.82);
  }
  :root[data-theme="dark"]{
    --bg:#000;--bg2:#0a0a0c;--card:#1a1a1e;--card2:#232329;
    --fg:#f5f6f8;--fg2:#9fa3ac;--fg3:#72767f;--line:#2a2b31;
    --accent:#0a84ff;--accent-soft:rgba(10,132,255,.20);--accent-glow:rgba(10,132,255,.10);
    --go:#32d16a;--go2:#38dd72;--go-glow:rgba(50,209,106,.35);--go-soft:rgba(50,209,106,.16);
    --warn:#ffab2e;--warn-soft:rgba(255,171,46,.16);--fav:#7a79f0;
    --sh-sm:0 1px 2px rgba(0,0,0,.45);
    --sh-md:0 2px 8px rgba(0,0,0,.5),0 20px 48px rgba(0,0,0,.55);
    --glass:rgba(26,26,30,.8);
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --bg:#000;--bg2:#0a0a0c;--card:#1a1a1e;--card2:#232329;
      --fg:#f5f6f8;--fg2:#9fa3ac;--fg3:#72767f;--line:#2a2b31;
      --accent-soft:rgba(10,132,255,.20);--accent-glow:rgba(10,132,255,.10);
      --go:#32d16a;--go2:#38dd72;--go-glow:rgba(50,209,106,.35);--go-soft:rgba(50,209,106,.16);
      --warn:#ffab2e;--warn-soft:rgba(255,171,46,.16);--fav:#7a79f0;
      --sh-sm:0 1px 2px rgba(0,0,0,.45);
      --sh-md:0 2px 8px rgba(0,0,0,.5),0 20px 48px rgba(0,0,0,.55);
      --glass:rgba(26,26,30,.8);
    }
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
    background:radial-gradient(120% 60% at 100% 0%,var(--accent-glow),transparent 60%),linear-gradient(180deg,var(--bg2),var(--bg));
    background-attachment:fixed;color:var(--fg);min-height:100vh;-webkit-font-smoothing:antialiased;line-height:1.4;
  }
  .wrap{max-width:540px;margin:0 auto;padding:0 14px calc(40px + env(safe-area-inset-bottom))}
  .appbar{position:sticky;top:0;z-index:1200;display:flex;align-items:center;gap:10px;
    padding:calc(12px + env(safe-area-inset-top)) 4px 12px;
    -webkit-backdrop-filter:saturate(160%) blur(14px);backdrop-filter:saturate(160%) blur(14px);
    background:var(--glass);border-bottom:1px solid transparent;transition:border-color .2s}
  .appbar.scrolled{border-bottom-color:var(--line)}
  .logo{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;
    background:linear-gradient(160deg,#3aa0ff,#0a6bff);box-shadow:0 3px 10px rgba(10,107,255,.4)}
  .logo svg{width:18px;height:18px;fill:#fff}
  .brand{font-weight:680;font-size:19px;letter-spacing:-.02em}
  .status{margin-left:auto;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--fg);
    padding:6px 12px 6px 10px;border-radius:999px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sh-sm)}
  .status .dot{width:8px;height:8px;border-radius:50%;background:var(--go);box-shadow:0 0 0 4px var(--go-soft)}
  .status.real{color:var(--warn)}
  .status.real .dot{background:var(--warn);box-shadow:0 0 0 4px var(--warn-soft)}
  .iconbtn{width:38px;height:38px;flex:none;border:1px solid var(--line);border-radius:11px;background:var(--card);color:var(--fg);
    font-size:16px;display:grid;place-items:center;box-shadow:var(--sh-sm);cursor:pointer;transition:transform .12s}
  .iconbtn:active{transform:scale(.92)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:var(--sh-sm);margin-top:14px;
    animation:rise .5s cubic-bezier(.2,.7,.2,1) both}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .search{display:flex;gap:8px;padding:10px}
  .field{flex:1;display:flex;align-items:center;gap:8px;background:var(--card2);border:1px solid transparent;border-radius:12px;padding:0 12px;transition:border-color .15s,background .15s}
  .field:focus-within{border-color:var(--accent);background:var(--card)}
  .field svg{width:17px;height:17px;fill:var(--fg3);flex:none}
  .field input{flex:1;border:0;background:none;outline:none;color:var(--fg);font-size:16px;padding:12px 0;min-width:0}
  .field input::placeholder{color:var(--fg3)}
  #locatebtn{flex:none;border:0;border-radius:12px;padding:0 15px;font-size:14px;font-weight:640;background:var(--accent-soft);color:var(--accent);cursor:pointer;transition:transform .12s}
  #locatebtn:active{transform:scale(.96)}
  #locatebtn:disabled{opacity:.5}
  .results{margin:10px 4px 0;border:1px solid var(--line);border-radius:14px;max-height:34vh;overflow:auto;display:none;background:var(--card);box-shadow:var(--sh-sm)}
  .results.show{display:block}
  .rrow{padding:12px 14px;font-size:14px;border-bottom:1px solid var(--line);color:var(--fg);display:flex;align-items:center;gap:8px}
  .rrow:last-child{border-bottom:0}
  .rrow:active{background:var(--card2)}
  .rrow .fname{flex:1;min-width:0}
  .rrow .fdel{padding:7px 12px;font-size:13px;border:0;border-radius:9px;background:var(--warn-soft);color:var(--warn);flex-shrink:0;font-weight:640}
  .map-card{position:relative;overflow:hidden;padding:0}
  #map{height:46vh;min-height:280px;background:var(--card2)}
  #coordpill{position:absolute;left:12px;right:12px;bottom:12px;z-index:1000;pointer-events:none;
    display:flex;align-items:center;gap:10px;background:var(--glass);
    -webkit-backdrop-filter:blur(10px) saturate(160%);backdrop-filter:blur(10px) saturate(160%);
    border:1px solid var(--line);border-radius:14px;padding:10px 13px;box-shadow:var(--sh-sm)}
  #coordpill .co{font-variant-numeric:tabular-nums;font-feature-settings:"tnum";font-size:13.5px;letter-spacing:.01em;font-weight:600}
  #coordpill .sub{font-size:11.5px;color:var(--fg2);margin-top:1px}
  #coordpill .flag{font-size:20px;margin-left:auto}
  #info{display:flex;align-items:center;gap:12px;padding:14px 16px;min-height:62px}
  #info .badge{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-size:17px;flex:none}
  #info .badge.saved{background:var(--go-soft);color:var(--go)}
  #info .badge.unsaved{background:var(--warn-soft);color:var(--warn)}
  #info .t{font-weight:660;font-size:15px}
  #info .s{font-size:12.5px;color:var(--fg2);margin-top:1px}
  details.params>summary{list-style:none;cursor:pointer;padding:14px 16px;font-weight:620;font-size:15px;display:flex;align-items:center;justify-content:space-between}
  details.params>summary::-webkit-details-marker{display:none}
  details.params>summary .chev{transition:transform .2s;color:var(--fg3);font-size:18px}
  details.params[open]>summary .chev{transform:rotate(90deg)}
  .pgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:0 16px 16px}
  .pgrid label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--fg2)}
  .pgrid input{border:1px solid var(--line);border-radius:11px;background:var(--card2);color:var(--fg);padding:11px 12px;font-size:16px;outline:none;font-variant-numeric:tabular-nums;transition:border-color .15s,background .15s;width:100%}
  .pgrid input:focus{border-color:var(--accent);background:var(--card)}
  #savebtn{width:100%;margin-top:16px;border:0;border-radius:16px;padding:16px;font-size:17px;font-weight:700;letter-spacing:.01em;color:#fff;cursor:pointer;
    background:linear-gradient(180deg,var(--go2),var(--go));box-shadow:0 6px 18px var(--go-glow),inset 0 1px 0 rgba(255,255,255,.25);
    transition:transform .12s,box-shadow .15s}
  #savebtn:active{transform:translateY(1px) scale(.99);box-shadow:0 3px 10px var(--go-glow)}
  .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
  .actions .full{grid-column:1 / -1}
  .btn{border:1px solid var(--line);border-radius:14px;padding:13px;font-size:14.5px;font-weight:640;background:var(--card);color:var(--fg);cursor:pointer;box-shadow:var(--sh-sm);transition:transform .12s}
  .btn:active{transform:scale(.97)}
  #restorebtn{color:var(--warn)}
  #favadd{color:var(--fav)}
  .pwahint{margin:16px 4px 0;padding:10px 13px;font-size:12px;color:var(--fg2);background:var(--card2);border-radius:14px;line-height:1.6}
  @media (display-mode: standalone){.pwahint{display:none}}
  .foot{margin:18px 0 4px;text-align:center;font-size:12px;color:var(--fg3);line-height:1.7}
  .foot a{color:var(--accent);text-decoration:none}
  .toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);background:rgba(20,20,24,.92);color:#fff;padding:11px 18px;border-radius:12px;font-size:14px;font-weight:560;opacity:0;transition:opacity .3s;pointer-events:none;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.35)}
  .toast.show{opacity:1}
  /* Leaflet 控件配色贴合主题 */
  .leaflet-control-layers,.leaflet-bar a{background:var(--card)!important;color:var(--fg)!important;border-color:var(--line)!important}
  .leaflet-bar a{border-bottom-color:var(--line)!important}
  .leaflet-control-layers-toggle{filter:var(--lf,none)}
  :root[data-theme="dark"] .leaflet-control-layers-toggle,:root:not([data-theme="light"]) .leaflet-tile-container{}
</style>
</head>
<body>
<script>try{var _t=localStorage.getItem("lp_theme");if(_t)document.documentElement.setAttribute("data-theme",_t);}catch(e){}</script>
<header class="appbar" id="appbar">
  <span class="logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2C7.8 2 4.5 5.3 4.5 9.5c0 5.2 6.2 11.4 7 12.1.3.3.7.3 1 0 .8-.7 7-6.9 7-12.1C19.5 5.3 16.2 2 12 2zm0 10.2a2.7 2.7 0 110-5.4 2.7 2.7 0 010 5.4z"/></svg></span>
  <span class="brand">定位選點</span>
  <span class="status" id="statuspill"><span class="dot"></span><span id="statustxt">偽造中</span></span>
  <button class="iconbtn" id="themebtn" aria-label="切換深色">🌙</button>
</header>

<section class="card">
  <div class="search">
    <div class="field">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 104.24 10.24l4.5 4.5 1.42-1.42-4.5-4.5A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z"/></svg>
      <input id="q" placeholder="搜尋地名，按 Enter 列出候選">
    </div>
    <button id="locatebtn" disabled>目前位置</button>
  </div>
</section>
<div class="results" id="results"></div>

<section class="card map-card">
  <div id="map"></div>
  <div id="coordpill"><div><div class="co">--</div><div class="sub">WGS-84</div></div><span class="flag">🇹🇼</span></div>
</section>

<section class="card"><div id="info">載入中…</div></section>

<details class="card params">
  <summary>進階參數 <span class="chev">›</span></summary>
  <div class="pgrid">
    <label>海拔(公尺)<input id="alt" type="number" inputmode="numeric"></label>
    <label>水平精度<input id="hacc" type="number" inputmode="numeric"></label>
    <label>垂直精度<input id="vacc" type="number" inputmode="numeric"></label>
  </div>
</details>

<button id="savebtn">儲存定位</button>
<div class="actions">
  <button class="btn full" id="restorebtn">恢復真實定位</button>
  <button class="btn" id="favadd">☆ 收藏此點</button>
  <button class="btn" id="favlistbtn">我的收藏</button>
</div>
<div class="results" id="favs"></div>

<div class="pwahint">💡 想像 App 一樣用？在 Safari 點底部「分享」→「加入主畫面」，即可全螢幕獨立開啟。想「一鍵切換定位」，見倉庫「快捷指令一鍵改定位」教學，搭配 iOS 捷徑 + 背面輕點即可。</div>
<div class="foot">本工具基於 <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a> 開源 · <a href="https://github.com/chung223/ios-location-spoofer" target="_blank" rel="noopener noreferrer">原始碼</a></div>
<div class="toast" id="toast"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH" crossorigin="anonymous"></script>
<script>
var token = new URLSearchParams(location.search).get("token") || "";

// PWA manifest：动态注入（带 token，供 Android/桌面安装；iOS 靠 apple meta 也能加主屏幕）
(function(){try{var l=document.createElement("link");l.rel="manifest";l.href="/manifest.webmanifest?token="+encodeURIComponent(token);document.head.appendChild(l);}catch(e){}})();

// 深色模式：默认跟随系统；点按钮在 深/浅 间切换并记住（早期内联脚本已先应用，避免闪白）
function currentTheme(){
  var t=document.documentElement.getAttribute("data-theme");
  if(t==="dark"||t==="light")return t;
  return (window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";
}
function applyTheme(t){
  if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);
  else document.documentElement.removeAttribute("data-theme");
}
function updateThemeBtn(){var b=document.getElementById("themebtn");if(b)b.textContent=currentTheme()==="dark"?"☀️":"🌙";}
function toggleTheme(){var n=currentTheme()==="dark"?"light":"dark";applyTheme(n);try{localStorage.setItem("lp_theme",n);}catch(e){}updateThemeBtn();}

var GCJ = (function(){
  var PI = Math.PI, a = 6378245.0, ee = 0.00669342162296594323;
  function outOfChina(lat,lng){return (lng<72.004||lng>137.8347)||(lat<0.8293||lat>55.8271);}
  function tLat(x,y){
    var r=-100.0+2.0*x+3.0*y+0.2*y*y+0.1*x*y+0.2*Math.sqrt(Math.abs(x));
    r+=(20.0*Math.sin(6.0*x*PI)+20.0*Math.sin(2.0*x*PI))*2.0/3.0;
    r+=(20.0*Math.sin(y*PI)+40.0*Math.sin(y/3.0*PI))*2.0/3.0;
    r+=(160.0*Math.sin(y/12.0*PI)+320*Math.sin(y*PI/30.0))*2.0/3.0;return r;
  }
  function tLng(x,y){
    var r=300.0+x+2.0*y+0.1*x*x+0.1*x*y+0.1*Math.sqrt(Math.abs(x));
    r+=(20.0*Math.sin(6.0*x*PI)+20.0*Math.sin(2.0*x*PI))*2.0/3.0;
    r+=(20.0*Math.sin(x*PI)+40.0*Math.sin(x/3.0*PI))*2.0/3.0;
    r+=(150.0*Math.sin(x/12.0*PI)+300*Math.sin(x/30.0*PI))*2.0/3.0;return r;
  }
  function wgs2gcj(lat,lng){
    if(outOfChina(lat,lng))return [lat,lng];
    var dLat=tLat(lng-105.0,lat-35.0), dLng=tLng(lng-105.0,lat-35.0);
    var radLat=lat/180.0*PI, m=Math.sin(radLat); m=1-ee*m*m; var sm=Math.sqrt(m);
    dLat=(dLat*180.0)/((a*(1-ee))/(m*sm)*PI);
    dLng=(dLng*180.0)/(a/sm*Math.cos(radLat)*PI);
    return [lat+dLat,lng+dLng];
  }
  function gcj2wgs(lat,lng){ // 迭代反解，往返误差 <0.001 米
    if(outOfChina(lat,lng))return [lat,lng];
    var wlat=lat, wlng=lng;
    for(var i=0;i<3;i++){ var g=wgs2gcj(wlat,wlng); wlat+=lat-g[0]; wlng+=lng-g[1]; }
    return [wlat,wlng];
  }
  return {wgs2gcj:wgs2gcj, gcj2wgs:gcj2wgs};
})();

var map, marker;
var WGS = {lat:0, lng:0};
var datum = "wgs";
var saved = true;
var enabledState = true;  // true=伪造中；false=已恢复真实定位（脚本放行）

function $(id){return document.getElementById(id);}
function toast(t){var e=$("toast");e.textContent=t;e.classList.add("show");setTimeout(function(){e.classList.remove("show");},1800);}
function numOrNull(id){var v=$(id).value.trim();return v===""?null:Number(v);}
// Leaflet 在重复世界地图上可能返回 -239 这类经度，需要归一化。
function wrapLng(lng){return ((((Number(lng)+180)%360)+360)%360)-180;}

function setLocateBusy(busy){
  var b=$("locatebtn");
  b.disabled=!!busy;
  b.textContent=busy?"定位中…":"目前位置";
}

function geolocationErrorMessage(err){
  if(err&&err.code===1)return "定位權限被拒絕，請在 Safari 設定中允許定位";
  if(err&&err.code===2)return "暫時無法取得目前位置";
  if(err&&err.code===3)return "取得目前位置逾時，請到空曠處重試";
  return "取得目前位置失敗";
}

var FAV_KEY="lp_favs_v1";
var FAV_MAX=12;
function loadFavs(){
  try{
    var raw=localStorage.getItem(FAV_KEY);
    var a=raw?JSON.parse(raw):[];
    return Array.isArray(a)?a:[];
  }catch(e){return [];}
}
function saveFavs(list){
  try{localStorage.setItem(FAV_KEY,JSON.stringify(list.slice(0,FAV_MAX)));}catch(e){}
}
function applyFavorite(it){
  var lat=Number(it.lat), lng=wrapLng(it.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast("收藏座標無效");return;}
  WGS={lat:lat,lng:lng};
  saved=false;
  if(it.alt!=null&&it.alt!=="")$("alt").value=it.alt;
  if(it.hacc!=null&&it.hacc!=="")$("hacc").value=it.hacc;
  if(it.vacc!=null&&it.vacc!=="")$("vacc").value=it.vacc;
  var p=dispPos();
  marker.setLatLng(p);
  map.setView(p,15);
  info();
  toast("已載入收藏，確認後儲存");
}
function renderFavs(){
  var box=$("favs");
  var list=loadFavs();
  box.innerHTML="";
  if(!list.length){box.classList.remove("show");return;}
  list.forEach(function(it,idx){
    var row=document.createElement("div");
    row.className="rrow";
    var name=document.createElement("span");
    name.className="fname";
    name.textContent=it.name||(Number(it.lat).toFixed(4)+","+Number(it.lng).toFixed(4));
    name.addEventListener("click",function(){
      $("results").classList.remove("show");
      applyFavorite(it);
    });
    var del=document.createElement("button");
    del.className="fdel";
    del.type="button";
    del.textContent="刪";
    del.addEventListener("click",function(e){
      e.stopPropagation();
      var next=loadFavs();
      next.splice(idx,1);
      saveFavs(next);
      if(next.length)renderFavs();else{box.innerHTML="";box.classList.remove("show");}
      toast("已刪除收藏");
    });
    row.appendChild(name);
    row.appendChild(del);
    box.appendChild(row);
  });
  box.classList.add("show");
}
function addFavorite(){
  if(!Number.isFinite(WGS.lat)||!Number.isFinite(WGS.lng)){toast("目前座標無效");return;}
  var def=$("q").value.trim()||(WGS.lat.toFixed(4)+","+WGS.lng.toFixed(4));
  var name=window.prompt("收藏名稱",def);
  if(name===null)return;
  name=String(name).trim()||def;
  var list=loadFavs().filter(function(it){
    return Math.abs(Number(it.lat)-WGS.lat)>1e-5||Math.abs(Number(it.lng)-WGS.lng)>1e-5;
  });
  list.unshift({
    name:name,
    lat:WGS.lat,
    lng:WGS.lng,
    alt:numOrNull("alt"),
    hacc:numOrNull("hacc"),
    vacc:numOrNull("vacc"),
    ts:Date.now()
  });
  saveFavs(list);
  renderFavs();
  toast("已收藏");
}
function toggleFavs(){
  var box=$("favs");
  if(box.classList.contains("show")){box.classList.remove("show");return;}
  $("results").classList.remove("show");
  if(!loadFavs().length){toast("暫無收藏");return;}
  renderFavs();
}

function info(){
  var pill=$("coordpill");
  if(pill){
    pill.innerHTML="<div><div class='co'>"+WGS.lat.toFixed(5)+", "+WGS.lng.toFixed(5)+
      "</div><div class='sub'>WGS-84 · 海拔 "+($("alt").value||"?")+" 公尺</div></div><span class='flag'>🇹🇼</span>";
  }
  if(!enabledState){
    $("info").innerHTML="<span class='badge saved'>✓</span><div><div class='t'>已恢復真實定位</div><div class='s'>腳本放行、不修改（關開定位後生效）</div></div>";
    return;
  }
  var savedTxt=saved?"已儲存":"尚未儲存";
  var subTxt=saved?"Loon／小火箭約 60 秒內生效":"點下方「儲存定位」後生效";
  var cls=saved?"saved":"unsaved";
  var sym=saved?"✓":"◐";
  $("info").innerHTML="<span class='badge "+cls+"'>"+sym+"</span><div><div class='t'>"+savedTxt+"</div><div class='s'>"+subTxt+"</div></div>";
}

// 切换按钮外观：伪造中(灰按钮"恢复真实定位") / 已恢复(橙按钮"重新开启伪造")；同步顶部状态胶囊
function updateEnabledUI(){
  var b=$("restorebtn"), p=$("statuspill"), pt=$("statustxt");
  if(enabledState){ b.textContent="恢復真實定位"; if(p)p.classList.remove("real"); if(pt)pt.textContent="偽造中"; }
  else { b.textContent="● 重新開啟偽造"; if(p)p.classList.add("real"); if(pt)pt.textContent="真實定位"; }
  info();
}

// 一键切换 伪造/恢复真实
function toggleEnabled(){
  var want = !enabledState;
  fetch("/enable?token="+encodeURIComponent(token),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:want})})
    .then(function(r){
      if(r.ok){ enabledState=want; updateEnabledUI();
        toast(want ? "已開啟偽造，記得關開定位生效" : "已恢復真實定位，記得關開定位生效"); }
      else toast("切換失敗 "+r.status);
    })
    .catch(function(){ toast("網路錯誤"); });
}

function dispPos(){return datum==="gcj"?GCJ.wgs2gcj(WGS.lat,WGS.lng):[WGS.lat,WGS.lng];}
function toWgs(lat,lng){lng=wrapLng(lng);return datum==="gcj"?GCJ.gcj2wgs(lat,lng):[lat,lng];}

function fetchElevation(lat,lng){
  lng=wrapLng(lng);
  return fetch("https://api.open-meteo.com/v1/elevation?latitude="+lat+"&longitude="+lng)
    .then(function(r){return r.json();})
    .then(function(d){return (d&&d.elevation&&d.elevation.length)?d.elevation[0]:null;})
    .catch(function(){return null;});
}

function movePin(dispLat,dispLng){
  dispLng=wrapLng(dispLng);
  var w=toWgs(dispLat,dispLng);
  WGS={lat:w[0], lng:wrapLng(w[1])};
  saved=false;
  marker.setLatLng([dispLat,dispLng]);
  info();
  fetchElevation(WGS.lat,WGS.lng).then(function(el){ if(el!==null)$("alt").value=Math.round(el); info(); });
}

function commit(){
  var payload={lat:WGS.lat, lng:WGS.lng,
    altitude:numOrNull("alt"), horizontalAccuracy:numOrNull("hacc"), verticalAccuracy:numOrNull("vacc")};
  fetch("/set?token="+encodeURIComponent(token),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
    .then(function(r){ if(r.ok){ saved=true; enabledState=true; updateEnabledUI(); toast("已儲存 ✓ Loon/小火箭約 60 秒內生效"); } else { toast("儲存失敗 "+r.status); } })
    .catch(function(){ toast("網路錯誤"); });
}

function locateCurrent(){
  if(enabledState){
    toast("請先恢復真實定位並刷新定位服務");
    return;
  }
  if(!navigator.geolocation){
    toast("目前瀏覽器不支援定位");
    return;
  }

  setLocateBusy(true);
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat=Number(pos&&pos.coords&&pos.coords.latitude);
      var lng=wrapLng(pos&&pos.coords&&pos.coords.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)){
        toast("取得目前位置失敗");
        setLocateBusy(false);
        return;
      }

      WGS={lat:lat,lng:lng};
      saved=false;
      var p=dispPos();
      marker.setLatLng(p);
      map.setView(p,16);
      info();
      fetchElevation(WGS.lat,WGS.lng).then(function(el){
        if(el!==null)$("alt").value=Math.round(el);
        info();
      });
      toast("已定位到目前位置，請確認後儲存");
      setLocateBusy(false);
    },
    function(err){
      toast(geolocationErrorMessage(err));
      setLocateBusy(false);
    },
    {enableHighAccuracy:true,maximumAge:0,timeout:12000}
  );
}

function search(){
  var q=$("q").value.trim(); if(!q) return;
  fetch("https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=8&q="+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(a){
      var box=$("results"); box.innerHTML="";
      if(!a||!a.length){ box.classList.remove("show"); toast("找不到"); return; }
      a.forEach(function(it){
        var row=document.createElement("div");
        row.className="rrow";
        row.textContent=it.display_name;
        row.addEventListener("click",function(){
          box.classList.remove("show"); box.innerHTML="";
          var la=+it.lat, lo=+it.lon;
          var p = datum==="gcj"?GCJ.wgs2gcj(la,lo):[la,lo];
          map.setView(p,15);
          toast("已移動視野，在地圖上點一下放置圖釘");
        });
        box.appendChild(row);
      });
      box.classList.add("show");
    })
    .catch(function(){toast("搜尋失敗");});
}

function load(){
  fetch("/loc.json?token="+encodeURIComponent(token)).then(function(r){return r.json();}).then(function(d){
    WGS={lat:d.latitude, lng:d.longitude};
    saved=true;
    enabledState=(d.enabled!==false);
    $("alt").value=(d.altitude!==undefined?d.altitude:"");
    $("hacc").value=(d.horizontalAccuracy!==undefined?d.horizontalAccuracy:39);
    $("vacc").value=(d.verticalAccuracy!==undefined?d.verticalAccuracy:1000);

    // 台湾/国际用 WGS-84 地图（预设）；高德为中国大陆 GCJ-02，偏移已自动处理
    var osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"});
    osm.datum="wgs";
    var esriSat=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"© Esri"});
    esriSat.datum="wgs";
    var amapVec=L.tileLayer("https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",{subdomains:"1234",maxZoom:18,attribution:"高德地圖"});
    amapVec.datum="gcj";
    var amapSat=L.layerGroup([
      L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",{subdomains:"1234",maxZoom:18}),
      L.tileLayer("https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8",{subdomains:"1234",maxZoom:18})
    ]);
    amapSat.datum="gcj";

    map=L.map("map");
    osm.addTo(map); datum="wgs";
    map.setView(dispPos(),13);
    L.control.layers({"OpenStreetMap":osm,"衛星（Esri）":esriSat,"高德地圖":amapVec,"高德衛星":amapSat},null,{collapsed:false}).addTo(map);

    marker=L.marker(dispPos(),{draggable:true}).addTo(map);
    updateEnabledUI();
    setLocateBusy(false);

    map.on("baselayerchange",function(e){datum=e.layer.datum||"wgs"; var p=dispPos(); marker.setLatLng(p); map.setView(p,map.getZoom()); info();});
    map.on("click",function(e){movePin(e.latlng.lat,e.latlng.lng);});
    marker.on("dragend",function(){var p=marker.getLatLng(); movePin(p.lat,p.lng);});
  }).catch(function(){$("info").textContent="載入失敗，請檢查 token 是否正確";});
}

$("q").addEventListener("keydown",function(e){if(e.key==="Enter")search();});
$("locatebtn").addEventListener("click",locateCurrent);
$("savebtn").addEventListener("click",commit);
$("restorebtn").addEventListener("click",toggleEnabled);
$("favadd").addEventListener("click",addFavorite);
$("favlistbtn").addEventListener("click",toggleFavs);
$("themebtn").addEventListener("click",toggleTheme);
$("statuspill").addEventListener("click",toggleEnabled);
updateThemeBtn();
load();
</script>
</body>
</html>`;
// === PAGE:END ===
