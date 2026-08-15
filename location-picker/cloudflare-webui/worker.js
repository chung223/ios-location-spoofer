// ⚠️ 自动生成，请勿手改：由 worker/src/page.js + worker/src/index.js 合并（npm run build:webui）。
//    要改逻辑请改 worker/src/ 再重新生成，避免多份副本漂移。
//    用途：Cloudflare 网页后台「复制粘贴单文件」部署（无需 npm / Wrangler / GitHub）。

export const PAGE = `<!doctype html>
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
  .play{padding:2px 0}
  .playrow{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap}
  .playrow:last-of-type{border-bottom:0}
  .playlbl{flex:1;min-width:120px}
  .playlbl b{font-size:14.5px;font-weight:660}
  .playlbl span{display:block;font-size:12px;color:var(--fg2);margin-top:2px}
  .seg{display:flex;gap:4px;background:var(--card2);border-radius:10px;padding:3px;flex:none}
  .seg button{border:0;background:none;color:var(--fg2);font-size:13px;font-weight:600;padding:6px 10px;border-radius:8px;cursor:pointer;transition:transform .1s}
  .seg button:active{transform:scale(.94)}
  .seg button.on{background:var(--card);color:var(--accent);box-shadow:var(--sh-sm)}
  .mirrorctl{display:flex;gap:6px;flex:none}
  .mirrorctl input{width:118px;border:1px solid var(--line);border-radius:10px;background:var(--card2);color:var(--fg);padding:9px 10px;font-size:14px;outline:none}
  .mirrorctl input:focus{border-color:var(--accent);background:var(--card)}
  .mirrorctl button{border:0;border-radius:10px;padding:9px 14px;font-size:13.5px;font-weight:640;background:var(--accent-soft);color:var(--accent);cursor:pointer}
  .mirrorstate{padding:0 16px 14px;font-size:12.5px;color:var(--fg2)}
  .mirrorstate a{color:var(--accent);text-decoration:none;font-weight:600}
  .mirrorstate:empty{display:none}
  .route .rtop{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:14px 16px 10px}
  .route .rtop b{font-size:15px;font-weight:680}
  .route .rtop span{font-size:12.5px;color:var(--fg2)}
  .ractions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px}
  .rrow2{display:flex;align-items:center;gap:12px;padding:12px 16px;flex-wrap:wrap}
  .rloop{display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--fg2);font-weight:600}
  .rloop input{width:17px;height:17px;accent-color:var(--accent)}
  #routego{width:calc(100% - 32px);margin:0 16px 14px;border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(180deg,#3aa0ff,#0a6bff);box-shadow:0 5px 16px rgba(10,107,255,.35);transition:transform .12s}
  #routego:active{transform:translateY(1px) scale(.99)}
  .rstate{padding:0 16px 14px;font-size:13px;color:var(--go);font-weight:600;line-height:1.6}
  .rstate a{color:var(--warn);text-decoration:none;font-weight:700}
  .rstate:empty{display:none}
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
  <button class="btn full" id="randombtn">🎲 隨機傳送</button>
</div>
<div class="results" id="favs"></div>

<section class="card play">
  <div class="playrow">
    <div class="playlbl"><b>微抖動</b><span>讓定位像真手機輕微漂移，反「定死在原地」</span></div>
    <div class="seg" id="jitterseg">
      <button type="button" data-m="0" class="on">關</button>
      <button type="button" data-m="5">5m</button>
      <button type="button" data-m="15">15m</button>
      <button type="button" data-m="50">50m</button>
    </div>
  </div>
  <div class="playrow">
    <div class="playlbl"><b>跟隨朋友</b><span>你的定位＝某個 u 的定位（互相同步）</span></div>
    <div class="mirrorctl">
      <input id="mirroru" placeholder="對方 u 代號" autocapitalize="off" autocorrect="off" spellcheck="false">
      <button type="button" id="mirrorbtn">跟隨</button>
    </div>
  </div>
  <div class="mirrorstate" id="mirrorstate"></div>
</section>

<section class="card route">
  <div class="rtop"><b>🚶 路線移動</b><span id="routecount">尚未加入路線點</span></div>
  <div class="ractions">
    <button class="btn" id="routeadd">＋ 加入目前圖釘</button>
    <button class="btn" id="routeclear">清除</button>
  </div>
  <div class="rrow2">
    <div class="seg" id="routespeed">
      <button type="button" data-s="1.4" class="on">🚶 走路</button>
      <button type="button" data-s="5">🚲 騎車</button>
      <button type="button" data-s="15">🚗 開車</button>
    </div>
    <label class="rloop"><input type="checkbox" id="routeloop"> 循環</label>
  </div>
  <button id="routego">▶ 開始移動</button>
  <div class="rstate" id="routestate"></div>
</section>

<div class="pwahint">💡 想像 App 一樣用？在 Safari 點底部「分享」→「加入主畫面」，即可全螢幕獨立開啟。想「一鍵切換定位」，見倉庫「快捷指令一鍵改定位」教學，搭配 iOS 捷徑 + 背面輕點即可。</div>
<div class="foot">本工具基於 <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a> 開源 · <a href="https://github.com/chung223/ios-location-spoofer" target="_blank" rel="noopener noreferrer">原始碼</a></div>
<div class="toast" id="toast"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH" crossorigin="anonymous"></script>
<script>
var token = new URLSearchParams(location.search).get("token") || "";
// 多用户：URL 带 ?u=<名字> 时，所有 API 请求都带上，读写各自独立的定位（分享给朋友用）。
var scope = new URLSearchParams(location.search).get("u") || "";
function apiUrl(path){return path+"?token="+encodeURIComponent(token)+(scope?"&u="+encodeURIComponent(scope):"");}

// PWA manifest：动态注入（带 token + u，供 Android/桌面安装；iOS 靠 apple meta 也能加主屏幕）
(function(){try{var l=document.createElement("link");l.rel="manifest";l.href=apiUrl("/manifest.webmanifest");document.head.appendChild(l);}catch(e){}})();

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

// 🎲 随机传送：内建一批地标，随机跳一个（仍需按储存）
var PLACES=[
  {name:"艾菲爾鐵塔",lat:48.8584,lng:2.2945},
  {name:"紐約自由女神",lat:40.6892,lng:-74.0445},
  {name:"東京鐵塔",lat:35.6586,lng:139.7454},
  {name:"雪梨歌劇院",lat:-33.8568,lng:151.2153},
  {name:"倫敦大笨鐘",lat:51.5007,lng:-0.1246},
  {name:"吉薩金字塔",lat:29.9792,lng:31.1342},
  {name:"泰姬瑪哈陵",lat:27.1751,lng:78.0421},
  {name:"羅馬競技場",lat:41.8902,lng:12.4922},
  {name:"新加坡魚尾獅",lat:1.2868,lng:103.8545},
  {name:"首爾南山塔",lat:37.5512,lng:126.9882},
  {name:"台北101",lat:25.0339,lng:121.5645},
  {name:"舊金山金門大橋",lat:37.8199,lng:-122.4783},
  {name:"杜拜哈里發塔",lat:25.1972,lng:55.2744},
  {name:"里約基督像",lat:-22.9519,lng:-43.2105},
  {name:"香港維多利亞港",lat:22.2940,lng:114.1722}
];
function teleport(){
  var p=PLACES[Math.floor(Math.random()*PLACES.length)];
  WGS={lat:p.lat,lng:p.lng};
  saved=false;
  var d=dispPos();
  marker.setLatLng(d);
  map.setView(d,13);
  info();
  fetchElevation(WGS.lat,WGS.lng).then(function(el){if(el!==null)$("alt").value=Math.round(el);info();});
  toast("🎲 "+p.name+"，確認後儲存");
}

// ✨ 微抖动：让定位轻微随机漂移
function jitterUI(m){
  var seg=$("jitterseg"); if(!seg)return;
  var bs=seg.getElementsByTagName("button");
  for(var i=0;i<bs.length;i++){bs[i].classList.toggle("on",Number(bs[i].getAttribute("data-m"))===Number(m||0));}
}
function setJitter(m){
  fetch(apiUrl("/jitter"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({meters:m})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
    .then(function(){jitterUI(m);toast(m>0?("抖動 ±"+m+"m 已開，關開定位生效"):"抖動已關");})
    .catch(function(){toast("設定失敗");});
}

// 👥 跟随朋友：本账号定位镜像另一个 u
function mirrorUI(name){
  var s=$("mirrorstate"); if(!s)return;
  if(name){
    s.innerHTML="正在跟隨 <b>"+name+"</b> · <a href='#' id='mirrorclear'>取消跟隨</a>";
    var c=$("mirrorclear");
    if(c)c.addEventListener("click",function(e){e.preventDefault();clearMirror();});
  }else{
    s.innerHTML="";
  }
}
function applyMirror(){
  var name=$("mirroru").value.trim();
  if(!name){toast("先填對方的 u 代號");return;}
  fetch(apiUrl("/mirror"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({u:name})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
    .then(function(d){mirrorUI(d.mirror||"");toast(d.mirror?("已跟隨 "+d.mirror+"，關開定位生效"):"名稱無效");})
    .catch(function(){toast("設定失敗");});
}
function clearMirror(){
  fetch(apiUrl("/mirror"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clear:true})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
    .then(function(){mirrorUI("");$("mirroru").value="";toast("已取消跟隨");})
    .catch(function(){toast("設定失敗");});
}

// 🚶 路线移动：把「目前图钉」一个个加进路线，设速度后开始沿线移动
var routePts=[]; // WGS [lat,lng]
var routeLine=null;
var routeSpeed=1.4;
function toDisp(ll){return datum==="gcj"?GCJ.wgs2gcj(ll[0],ll[1]):[ll[0],ll[1]];}
function drawRoute(){
  if(!map)return;
  if(routeLine){map.removeLayer(routeLine);routeLine=null;}
  if(routePts.length>=2){routeLine=L.polyline(routePts.map(toDisp),{color:"#0a6bff",weight:4,opacity:.85,dashArray:"6,7"}).addTo(map);}
  var c=$("routecount");
  if(c)c.textContent=routePts.length?("已加入 "+routePts.length+" 點"):"尚未加入路線點";
}
function routeAdd(){
  if(!Number.isFinite(WGS.lat)||!Number.isFinite(WGS.lng)){toast("目前座標無效");return;}
  routePts.push([WGS.lat,WGS.lng]);
  drawRoute();
  toast("已加入第 "+routePts.length+" 點");
}
function routeClearFn(){
  routePts=[];
  drawRoute();
  toast("已清除路線");
}
function routeSpeedUI(s){
  var seg=$("routespeed");if(!seg)return;
  var bs=seg.getElementsByTagName("button");
  for(var i=0;i<bs.length;i++){bs[i].classList.toggle("on",Number(bs[i].getAttribute("data-s"))===Number(s));}
}
function routeStateUI(rec){
  var s=$("routestate");if(!s)return;
  if(rec&&rec.mode==="route"&&rec.route){
    var kmh=Math.round((Number(rec.speed)||1.4)*3.6);
    s.innerHTML="🟢 移動中 · "+rec.route.length+" 點 · "+kmh+" km/h"+(rec.loop?" · 循環":"")+" · <a href='#' id='routestop'>停止</a>";
    var st=$("routestop");if(st)st.addEventListener("click",function(e){e.preventDefault();routeStop();});
  }else{
    s.innerHTML="";
  }
}
function routeGo(){
  if(routePts.length<2){toast("至少加入 2 個路線點");return;}
  fetch(apiUrl("/route"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({route:routePts,speed:routeSpeed,loop:$("routeloop").checked})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
    .then(function(d){routeStateUI(d);toast("🚶 開始移動！關開定位生效");})
    .catch(function(){toast("設定失敗");});
}
function routeStop(){
  fetch(apiUrl("/route"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stop:true})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
    .then(function(d){
      routeStateUI(d);
      WGS={lat:d.latitude,lng:d.longitude};saved=true;
      var p=dispPos();marker.setLatLng(p);map.setView(p,map.getZoom());info();
      toast("已停止，停在目前位置");
    })
    .catch(function(){toast("停止失敗");});
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
  fetch(apiUrl("/enable"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:want})})
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
  fetch(apiUrl("/set"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
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
  fetch(apiUrl("/loc.json")+"&raw=1").then(function(r){return r.json();}).then(function(d){
    WGS={lat:d.latitude, lng:d.longitude};
    saved=true;
    enabledState=(d.enabled!==false);
    $("alt").value=(d.altitude!==undefined?d.altitude:"");
    $("hacc").value=(d.horizontalAccuracy!==undefined?d.horizontalAccuracy:39);
    $("vacc").value=(d.verticalAccuracy!==undefined?d.verticalAccuracy:1000);
    jitterUI(d.jitter||0);
    mirrorUI(d.mirror||"");

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

    map.on("baselayerchange",function(e){datum=e.layer.datum||"wgs"; var p=dispPos(); marker.setLatLng(p); map.setView(p,map.getZoom()); info(); drawRoute();});
    map.on("click",function(e){movePin(e.latlng.lat,e.latlng.lng);});
    marker.on("dragend",function(){var p=marker.getLatLng(); movePin(p.lat,p.lng);});

    // 若正在路线移动，恢复路线显示与状态
    if(d.mode==="route"&&Array.isArray(d.route)&&d.route.length){
      routePts=d.route.map(function(p){return [Number(p[0]),Number(p[1])];});
      routeSpeed=Number(d.speed)||1.4;
      if($("routeloop"))$("routeloop").checked=!!d.loop;
      routeSpeedUI(routeSpeed);
      drawRoute();
    }
    routeStateUI(d);
  }).catch(function(){$("info").textContent="載入失敗，請檢查 token 是否正確";});
}

$("q").addEventListener("keydown",function(e){if(e.key==="Enter")search();});
$("locatebtn").addEventListener("click",locateCurrent);
$("savebtn").addEventListener("click",commit);
$("restorebtn").addEventListener("click",toggleEnabled);
$("favadd").addEventListener("click",addFavorite);
$("favlistbtn").addEventListener("click",toggleFavs);
$("randombtn").addEventListener("click",teleport);
$("mirrorbtn").addEventListener("click",applyMirror);
$("mirroru").addEventListener("keydown",function(e){if(e.key==="Enter")applyMirror();});
(function(){var seg=$("jitterseg");if(!seg)return;var bs=seg.getElementsByTagName("button");for(var i=0;i<bs.length;i++){(function(b){b.addEventListener("click",function(){setJitter(Number(b.getAttribute("data-m")));});})(bs[i]);}})();
$("routeadd").addEventListener("click",routeAdd);
$("routeclear").addEventListener("click",routeClearFn);
$("routego").addEventListener("click",routeGo);
(function(){var seg=$("routespeed");if(!seg)return;var bs=seg.getElementsByTagName("button");for(var i=0;i<bs.length;i++){(function(b){b.addEventListener("click",function(){routeSpeed=Number(b.getAttribute("data-s"));routeSpeedUI(routeSpeed);});})(bs[i]);}})();
$("themebtn").addEventListener("click",toggleTheme);
$("statuspill").addEventListener("click",toggleEnabled);
updateThemeBtn();
load();
</script>
</body>
</html>`;

/**
 * iOS Location Picker — Cloudflare Worker
 *
 * API（与 location-picker/server.js 兼容）：
 *   GET  /loc.json?token=   → 读取坐标 JSON（Loon / Shadowrocket configUrl）
 *   POST /set?token=        → 保存坐标
 *   GET  /?token=           → 地图选点网页（必须带正确 token）
 */


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
