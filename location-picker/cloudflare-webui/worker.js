// ⚠️ 自动生成，请勿手改：由 worker/src/page.js + worker/src/index.js 合并（npm run build:webui）。
//    要改逻辑请改 worker/src/ 再重新生成，避免多份副本漂移。
//    用途：Cloudflare 网页后台「复制粘贴单文件」部署（无需 npm / Wrangler / GitHub）。

export const PAGE = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>定位选点</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="定位选点">
<meta name="theme-color" content="#007aff">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="icon" type="image/png" href="/icon-180.png">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous">
<style>
  :root{
    --bg:#fff;--fg:#111;--card:#fff;--line:#e2e2e2;--rowline:#eee;
    --input-bg:#fff;--input-line:#ccc;--label:#444;--muted:#555;
    --hint-bg:#f2f2f7;--active:#f0f6ff;
  }
  :root[data-theme="dark"]{
    --bg:#1c1c1e;--fg:#f2f2f7;--card:#2c2c2e;--line:#3a3a3c;--rowline:#3a3a3c;
    --input-bg:#2c2c2e;--input-line:#48484a;--label:#c7c7cc;--muted:#aeaeb2;
    --hint-bg:#2c2c2e;--active:#0a2540;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --bg:#1c1c1e;--fg:#f2f2f7;--card:#2c2c2e;--line:#3a3a3c;--rowline:#3a3a3c;
      --input-bg:#2c2c2e;--input-line:#48484a;--label:#c7c7cc;--muted:#aeaeb2;
      --hint-bg:#2c2c2e;--active:#0a2540;
    }
  }
  html,body{margin:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--fg)}
  .bar{padding:8px;display:flex;gap:6px;box-sizing:border-box}
  .bar input{flex:1;padding:10px;font-size:16px;border:1px solid var(--input-line);border-radius:8px;background:var(--input-bg);color:var(--fg)}
  .bar button{padding:10px 14px;font-size:16px;border:0;border-radius:8px;background:#007aff;color:#fff}
  .bar button:disabled{opacity:.55}
  .results{margin:0 8px;border:1px solid var(--line);border-radius:8px;max-height:34vh;overflow:auto;display:none;background:var(--card)}
  .results.show{display:block}
  .rrow{padding:10px 12px;font-size:14px;border-bottom:1px solid var(--rowline);color:var(--fg);display:flex;align-items:center;gap:8px}
  .rrow:last-child{border-bottom:0}
  .rrow:active{background:var(--active)}
  .rrow .fname{flex:1;min-width:0}
  .rrow .fdel{padding:6px 10px;font-size:13px;border:0;border-radius:6px;background:#ff3b30;color:#fff;flex-shrink:0}
  #map{height:52vh;background:var(--card)}
  #info{padding:8px 10px;font-size:13px;line-height:1.4}
  .opts{padding:6px 10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
  .opts label{font-size:13px;color:var(--label);display:flex;flex-direction:column}
  .opts input{width:88px;padding:8px;font-size:15px;border:1px solid var(--input-line);border-radius:6px;margin-top:2px;background:var(--input-bg);color:var(--fg)}
  #savebtn{padding:11px 20px;font-size:16px;border:0;border-radius:8px;background:#34c759;color:#fff;font-weight:600}
  #restorebtn{padding:11px 16px;font-size:15px;border:0;border-radius:8px;background:#8e8e93;color:#fff}
  #favadd,#favlistbtn,#themebtn{padding:11px 14px;font-size:15px;border:0;border-radius:8px;background:#5856d6;color:#fff}
  #themebtn{background:#6c6c70}
  .toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,.85);color:#fff;padding:10px 16px;border-radius:8px;
    font-size:14px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:9999}
  .toast.show{opacity:1}
  .pwahint{margin:10px 8px 6px;padding:9px 11px;font-size:12px;color:var(--muted);background:var(--hint-bg);border-radius:8px;line-height:1.6}
  @media (display-mode: standalone){.pwahint{display:none}}
  .foot{margin:0 8px 16px;font-size:12px;color:var(--muted);line-height:1.6}
  .foot a{color:#007aff}
</style>
</head>
<body>
<script>try{var _t=localStorage.getItem("lp_theme");if(_t)document.documentElement.setAttribute("data-theme",_t);}catch(e){}</script>
<div class="bar">
  <input id="q" placeholder="搜地名，回车列出候选（只预览，不改定位）">
  <button id="locatebtn" disabled>当前位置</button>
  <button id="btn">搜</button>
</div>
<div class="results" id="results"></div>
<div id="map"></div>
<div id="info">加载中…</div>
<div class="opts">
  <label>海拔(米)<input id="alt" type="number" inputmode="numeric"></label>
  <label>水平精度<input id="hacc" type="number" inputmode="numeric"></label>
  <label>垂直精度<input id="vacc" type="number" inputmode="numeric"></label>
  <button id="savebtn">保存定位</button>
  <button id="restorebtn">恢复真实定位</button>
  <button id="favadd">收藏此点</button>
  <button id="favlistbtn">我的收藏</button>
  <button id="themebtn">🌙 深色</button>
</div>
<div class="results" id="favs"></div>
<div class="pwahint">💡 想像 App 一样用？在 Safari 点底部「分享」→「添加到主屏幕」，即可全屏独立打开。想“一键切换定位”，见仓库「快捷指令一键改定位」教程，配合 iOS 快捷指令 + 背面轻点即可。</div>
<div class="foot">本工具基于 <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a> 开源 · <a href="https://github.com/chung223/ios-location-spoofer" target="_blank" rel="noopener noreferrer">源码</a></div>
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
function updateThemeBtn(){var b=document.getElementById("themebtn");if(b)b.textContent=currentTheme()==="dark"?"☀️ 浅色":"🌙 深色";}
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
var datum = "gcj";
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
  b.textContent=busy?"定位中…":"当前位置";
}

function geolocationErrorMessage(err){
  if(err&&err.code===1)return "定位权限被拒绝，请在 Safari 设置中允许定位";
  if(err&&err.code===2)return "暂时无法获取当前位置";
  if(err&&err.code===3)return "获取当前位置超时，请到开阔处重试";
  return "获取当前位置失败";
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
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast("收藏坐标无效");return;}
  WGS={lat:lat,lng:lng};
  saved=false;
  if(it.alt!=null&&it.alt!=="")$("alt").value=it.alt;
  if(it.hacc!=null&&it.hacc!=="")$("hacc").value=it.hacc;
  if(it.vacc!=null&&it.vacc!=="")$("vacc").value=it.vacc;
  var p=dispPos();
  marker.setLatLng(p);
  map.setView(p,15);
  info();
  toast("已加载收藏，确认后保存");
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
    del.textContent="删";
    del.addEventListener("click",function(e){
      e.stopPropagation();
      var next=loadFavs();
      next.splice(idx,1);
      saveFavs(next);
      if(next.length)renderFavs();else{box.innerHTML="";box.classList.remove("show");}
      toast("已删除收藏");
    });
    row.appendChild(name);
    row.appendChild(del);
    box.appendChild(row);
  });
  box.classList.add("show");
}
function addFavorite(){
  if(!Number.isFinite(WGS.lat)||!Number.isFinite(WGS.lng)){toast("当前坐标无效");return;}
  var def=$("q").value.trim()||(WGS.lat.toFixed(4)+","+WGS.lng.toFixed(4));
  var name=window.prompt("收藏名称",def);
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
  if(!loadFavs().length){toast("暂无收藏");return;}
  renderFavs();
}

function info(){
  if(!enabledState){
    $("info").innerHTML = "<b style='color:#ff9500'>已恢复真实定位 · 脚本放行不修改</b>　（关开定位后生效）";
    return;
  }
  var tag = saved ? "已保存 ✓" : "未保存 · 点“保存定位”生效";
  $("info").innerHTML = "<b style='color:"+(saved?"#34c759":"#ff9500")+"'>"+tag+"</b>　WGS-84 "+
    WGS.lat.toFixed(5)+", "+WGS.lng.toFixed(5)+"　海拔 "+($("alt").value||"?")+"m";
}

// 切换按钮外观：伪造中(灰按钮“恢复真实定位”) / 已恢复(橙按钮“重新开启伪造”)
function updateEnabledUI(){
  var b=$("restorebtn");
  if(enabledState){ b.textContent="恢复真实定位"; b.style.background="#8e8e93"; }
  else { b.textContent="● 重新开启伪造"; b.style.background="#ff9500"; }
  info();
}

// 一键切换 伪造/恢复真实
function toggleEnabled(){
  var want = !enabledState;
  fetch("/enable?token="+encodeURIComponent(token),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:want})})
    .then(function(r){
      if(r.ok){ enabledState=want; updateEnabledUI();
        toast(want ? "已开启伪造，记得关开定位生效" : "已恢复真实定位，记得关开定位生效"); }
      else toast("切换失败 "+r.status);
    })
    .catch(function(){ toast("网络错误"); });
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
    .then(function(r){ if(r.ok){ saved=true; enabledState=true; updateEnabledUI(); toast("已保存 ✓ Loon/小火箭约60秒内生效"); } else { toast("保存失败 "+r.status); } })
    .catch(function(){ toast("网络错误"); });
}

function locateCurrent(){
  if(enabledState){
    toast("请先恢复真实定位并刷新定位服务");
    return;
  }
  if(!navigator.geolocation){
    toast("当前浏览器不支持定位");
    return;
  }

  setLocateBusy(true);
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat=Number(pos&&pos.coords&&pos.coords.latitude);
      var lng=wrapLng(pos&&pos.coords&&pos.coords.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)){
        toast("获取当前位置失败");
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
      toast("已定位到当前位置，请确认后保存");
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
      if(!a||!a.length){ box.classList.remove("show"); toast("没找到"); return; }
      a.forEach(function(it){
        var row=document.createElement("div");
        row.className="rrow";
        row.textContent=it.display_name;
        row.addEventListener("click",function(){
          box.classList.remove("show"); box.innerHTML="";
          var la=+it.lat, lo=+it.lon;
          var p = datum==="gcj"?GCJ.wgs2gcj(la,lo):[la,lo];
          map.setView(p,15);
          toast("已定位视野，在地图上点一下放置图钉");
        });
        box.appendChild(row);
      });
      box.classList.add("show");
    })
    .catch(function(){toast("搜索失败");});
}

function load(){
  fetch("/loc.json?token="+encodeURIComponent(token)).then(function(r){return r.json();}).then(function(d){
    WGS={lat:d.latitude, lng:d.longitude};
    saved=true;
    enabledState=(d.enabled!==false);
    $("alt").value=(d.altitude!==undefined?d.altitude:"");
    $("hacc").value=(d.horizontalAccuracy!==undefined?d.horizontalAccuracy:39);
    $("vacc").value=(d.verticalAccuracy!==undefined?d.verticalAccuracy:1000);

    var amapVec=L.tileLayer("https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",{subdomains:"1234",maxZoom:18,attribution:"高德地图"});
    amapVec.datum="gcj";
    var amapSat=L.layerGroup([
      L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",{subdomains:"1234",maxZoom:18}),
      L.tileLayer("https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8",{subdomains:"1234",maxZoom:18})
    ]);
    amapSat.datum="gcj";
    var osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"});
    osm.datum="wgs";

    map=L.map("map");
    amapVec.addTo(map); datum="gcj";
    map.setView(dispPos(),13);
    L.control.layers({"高德地图":amapVec,"高德卫星":amapSat,"国外 OSM":osm},null,{collapsed:false}).addTo(map);

    marker=L.marker(dispPos(),{draggable:true}).addTo(map);
    updateEnabledUI();
    setLocateBusy(false);

    map.on("baselayerchange",function(e){datum=e.layer.datum||"wgs"; var p=dispPos(); marker.setLatLng(p); map.setView(p,map.getZoom()); info();});
    map.on("click",function(e){movePin(e.latlng.lat,e.latlng.lng);});
    marker.on("dragend",function(){var p=marker.getLatLng(); movePin(p.lat,p.lng);});
  }).catch(function(){$("info").textContent="加载失败，检查 token 是否正确";});
}

$("btn").addEventListener("click",search);
$("q").addEventListener("keydown",function(e){if(e.key==="Enter")search();});
$("locatebtn").addEventListener("click",locateCurrent);
$("savebtn").addEventListener("click",commit);
$("restorebtn").addEventListener("click",toggleEnabled);
$("favadd").addEventListener("click",addFavorite);
$("favlistbtn").addEventListener("click",toggleFavs);
$("themebtn").addEventListener("click",toggleTheme);
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
      const manifest = {
        name: "定位选点",
        short_name: "定位选点",
        start_url: "/?token=" + encodeURIComponent(t),
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
