// 透明 TLS MITM proxy（伺服器版定位引擎）。
//
// nftables 把 Apple 定位網域的 :443 轉到本 proxy；proxy 用「設定時預簽的葉憑證」
// 終結 TLS（手機信任我們的 CA），只改寫 /clls/wloc 回應，其餘一律原封轉發。
// 來源內網 IP → 對應某個朋友的 u → 走 localhost 讀該朋友在 picker 的座標。
//
// 只攔兩個網域 → 只需 2 張預簽葉憑證，不用執行期動態簽發。
// 上游對 Apple 帶 Accept-Encoding: identity → 回應不壓縮，免 gzip。
//
// 授權：AGPL-3.0（與本專案一致）。

import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import { spoofAppleResponse } from "./wloc-rewrite.mjs";

export const WLOC_HOSTS = new Set(["gs-loc.apple.com", "gs-loc-cn.apple.com"]);
export const WLOC_PATH = "/clls/wloc";

const CERT_DIR = process.env.CERT_DIR || "/etc/location-mitm/certs";
const LISTEN_PORT = Number(process.env.MITM_PORT || 8443);
const PICKER_BASE = process.env.PICKER_BASE || "http://127.0.0.1:8080";
const PICKER_TOKEN = process.env.PICKER_TOKEN || "";
const PEERS_FILE = process.env.PEERS_FILE || "/etc/location-mitm/peers.json";
// 測試用：把上游指到假 Apple。正式環境留空 → 直接連真 Apple。
const UPSTREAM_HOST = process.env.UPSTREAM_HOST || "";
const UPSTREAM_PORT = Number(process.env.UPSTREAM_PORT || 0);
const UPSTREAM_INSECURE = process.env.UPSTREAM_INSECURE === "1";

// —— 核心決策（純函式，可用 stub 端到端測試）——
// ctx: { host, method, url, headers, reqBody(Buffer), remoteAddress }
// deps: { fetchUpstream, fetchCoords, peerName, log }
export async function proxyDecide(ctx, deps) {
  const { host, method, url, reqBody, remoteAddress } = ctx;
  const isWloc = WLOC_HOSTS.has(host) && method === "POST" && String(url || "").startsWith(WLOC_PATH);

  const upstream = await deps.fetchUpstream({ host, method, path: url, headers: ctx.headers || {}, body: reqBody });
  let body = upstream.body;
  let rewritten = false;

  if (isWloc) {
    const u = deps.peerName ? deps.peerName(remoteAddress) : null;
    const coords = await deps.fetchCoords(u);
    const usable =
      coords &&
      coords.enabled !== false &&
      Number.isFinite(Number(coords.latitude)) &&
      Number.isFinite(Number(coords.longitude));
    if (usable) {
      try {
        const out = spoofAppleResponse(new Uint8Array(body), {
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          horizontalAccuracy: coords.horizontalAccuracy,
          verticalAccuracy: coords.verticalAccuracy,
        });
        body = Buffer.from(out.response);
        rewritten = true;
        deps.log && deps.log(`wloc rewritten for u=${u || "<none>"} -> ${coords.latitude},${coords.longitude} (${out.wifiCount} wifi)`);
      } catch (e) {
        // fail-open：改寫失敗就放行原回應，別弄斷朋友的連線
        deps.log && deps.log(`wloc rewrite failed (fail-open): ${e.message}`);
      }
    } else {
      deps.log && deps.log(`wloc pass-through (no usable coords for u=${u || "<none>"})`);
    }
  }

  const headers = {};
  for (const [k, v] of Object.entries(upstream.headers || {})) {
    const lk = k.toLowerCase();
    if (lk === "content-encoding" || lk === "transfer-encoding" || lk === "content-length") continue;
    headers[k] = v;
  }
  headers["Content-Length"] = String(body.length);
  return { status: upstream.status || 200, headers, body, rewritten };
}

// —— 正式環境的真依賴 ——
function fetchUpstreamReal({ host, method, path: reqPath, headers, body }) {
  return new Promise((resolve, reject) => {
    const h = {};
    for (const [k, v] of Object.entries(headers || {})) {
      const lk = k.toLowerCase();
      if (lk === "accept-encoding" || lk === "content-length" || lk === "host") continue;
      h[k] = v;
    }
    h["accept-encoding"] = "identity"; // 逼 Apple 回未壓縮，免 gzip
    h.host = host;
    const opts = {
      host: UPSTREAM_HOST || host,
      port: UPSTREAM_PORT || 443,
      method,
      path: reqPath,
      servername: host,
      headers: h,
    };
    if (UPSTREAM_INSECURE) opts.rejectUnauthorized = false;
    const req2 = https.request(opts, (r) => {
      const bufs = [];
      r.on("data", (c) => bufs.push(c));
      r.on("end", () => resolve({ status: r.statusCode, headers: r.headers, body: Buffer.concat(bufs) }));
    });
    req2.on("error", reject);
    if (body && body.length) req2.write(body);
    req2.end();
  });
}

function loadPeers() {
  try {
    return JSON.parse(fs.readFileSync(PEERS_FILE, "utf8"));
  } catch (e) {
    return {};
  }
}
function peerName(ip) {
  const clean = String(ip || "").replace(/^::ffff:/, "");
  return loadPeers()[clean] || null;
}

function fetchCoordsReal(u) {
  return new Promise((resolve) => {
    const url = PICKER_BASE + "/loc.json?token=" + encodeURIComponent(PICKER_TOKEN) + (u ? "&u=" + encodeURIComponent(u) : "");
    http
      .get(url, (r) => {
        const b = [];
        r.on("data", (c) => b.push(c));
        r.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(b).toString()));
          } catch (e) {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

const ctxCache = new Map();
function secureContextFor(servername) {
  if (ctxCache.has(servername)) return ctxCache.get(servername);
  try {
    const base = path.join(CERT_DIR, servername);
    const ctx = tls.createSecureContext({
      cert: fs.readFileSync(base + ".crt"),
      key: fs.readFileSync(base + ".key"),
    });
    ctxCache.set(servername, ctx);
    return ctx;
  } catch (e) {
    return null;
  }
}

function start() {
  // 預設憑證（無 SNI 的連線用；正常都有 SNI）
  let defaultCreds = {};
  const first = [...WLOC_HOSTS][0];
  try {
    defaultCreds = {
      cert: fs.readFileSync(path.join(CERT_DIR, first + ".crt")),
      key: fs.readFileSync(path.join(CERT_DIR, first + ".key")),
    };
  } catch (e) {
    console.error(`[warn] 找不到預設葉憑證 ${first}.crt/.key（跑 setup.sh 產生）`);
  }
  const server = https.createServer(
    {
      ...defaultCreds,
      SNICallback: (servername, cb) => {
        const ctx = secureContextFor(servername);
        cb(ctx ? null : new Error("no cert for " + servername), ctx || undefined);
      },
    },
    (req, res) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", async () => {
        try {
          const host = (req.headers.host || "").split(":")[0] || req.socket.servername || "";
          const out = await proxyDecide(
            {
              host,
              method: req.method,
              url: req.url,
              headers: req.headers,
              reqBody: Buffer.concat(chunks),
              remoteAddress: req.socket.remoteAddress,
            },
            { fetchUpstream: fetchUpstreamReal, fetchCoords: fetchCoordsReal, peerName, log: (m) => console.error(m) },
          );
          res.writeHead(out.status, out.headers);
          res.end(out.body);
        } catch (e) {
          console.error("proxy error:", e.message);
          try {
            res.writeHead(502);
            res.end();
          } catch (e2) {
            /* ignore */
          }
        }
      });
    },
  );
  server.on("tlsClientError", (e) => console.error("tlsClientError:", e.message));
  server.listen(LISTEN_PORT, () => console.error(`location MITM listening on :${LISTEN_PORT} (picker=${PICKER_BASE})`));
}

// 只有被直接執行時才啟動伺服器；被 import（測試）時不啟動。
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  start();
}
