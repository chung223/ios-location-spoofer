// 与 location-picker/server.js 的 PAGE 保持一致（地图选点 UI）
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
  fetch(apiUrl("/loc.json")).then(function(r){return r.json();}).then(function(d){
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
