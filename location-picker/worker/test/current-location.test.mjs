import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourcePath = new URL("../src/page.js", import.meta.url);
const webuiPath = new URL("../../cloudflare-webui/worker.js", import.meta.url);
const serverPath = new URL("../../server.js", import.meta.url);

const pages = [
  ["source page", await readFile(sourcePath, "utf8")],
  ["webui artifact", await readFile(webuiPath, "utf8")],
  ["node server page", await readFile(serverPath, "utf8")],
];

for (const [label, content] of pages) {
  test(`${label} exposes a guarded current-location control`, () => {
    assert.match(content, /<button id="locatebtn"[^>]*>目前位置<\/button>/);
    assert.match(content, /function locateCurrent\(\)/);
    assert.match(
      content,
      /if\s*\(enabledState\)\s*\{\s*toast\("請先恢復真實定位並刷新定位服務"\);\s*return;\s*\}/s,
    );
    assert.match(content, /navigator\.geolocation\.getCurrentPosition\(/);
  });

  test(`${label} requests fresh high-accuracy coordinates`, () => {
    assert.match(content, /enableHighAccuracy:\s*true/);
    assert.match(content, /maximumAge:\s*0/);
    assert.match(content, /timeout:\s*12000/);
  });

  test(`${label} moves the pin without saving automatically`, () => {
    assert.match(content, /WGS\s*=\s*\{\s*lat:\s*lat,\s*lng:\s*lng\s*\}/);
    assert.match(content, /saved\s*=\s*false/);
    assert.match(content, /marker\.setLatLng\(p\)/);
    assert.match(content, /map\.setView\(p,\s*16\)/);
    assert.doesNotMatch(content, /commit\(\);/);
  });

  test(`${label} maps Geolocation failures to user-facing messages`, () => {
    assert.match(content, /定位權限被拒絕，請在 Safari 設定中允許定位/);
    assert.match(content, /暫時無法取得目前位置/);
    assert.match(content, /取得目前位置逾時，請到空曠處重試/);
    assert.match(content, /目前瀏覽器不支援定位/);
  });
}
