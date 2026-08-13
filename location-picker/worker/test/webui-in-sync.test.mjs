import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { render, renderServerPage } from "../build-webui.mjs";

// worker/ 目录
const dir = new URL("../", import.meta.url);
const pageSrc = await readFile(new URL("src/page.js", dir), "utf8");
const indexSrc = await readFile(new URL("src/index.js", dir), "utf8");
const committedWebui = await readFile(new URL("../cloudflare-webui/worker.js", dir), "utf8");
const committedServer = await readFile(new URL("../server.js", dir), "utf8");

const normalize = (s) => s.replace(/\r\n/g, "\n").replace(/\n+$/, "\n");

test("cloudflare-webui/worker.js 与 worker/src 保持同步（漂移了就跑 npm run build:webui）", () => {
  assert.equal(
    normalize(committedWebui),
    normalize(render(pageSrc, indexSrc)),
    "cloudflare-webui/worker.js 已与 worker/src 漂移，请运行 `npm run build:webui` 重新生成后再提交。",
  );
});

test("server.js 的 PAGE 与 worker/src/page.js 保持同步（漂移了就跑 npm run build:webui）", () => {
  // renderServerPage 幂等 = server.js 的 PAGE 已是 page.js 生成的最新内容
  assert.equal(
    normalize(committedServer),
    normalize(renderServerPage(committedServer, pageSrc)),
    "server.js 的 PAGE 已与 worker/src/page.js 漂移，请运行 `npm run build:webui` 重新生成后再提交。",
  );
});
