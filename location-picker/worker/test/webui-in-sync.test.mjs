import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { render } from "../build-webui.mjs";

// worker/ 目录
const dir = new URL("../", import.meta.url);
const pageSrc = await readFile(new URL("src/page.js", dir), "utf8");
const indexSrc = await readFile(new URL("src/index.js", dir), "utf8");
const committed = await readFile(new URL("../cloudflare-webui/worker.js", dir), "utf8");

const normalize = (s) => s.replace(/\r\n/g, "\n").replace(/\n+$/, "\n");

test("cloudflare-webui/worker.js 与 worker/src 保持同步（漂移了就跑 npm run build:webui）", () => {
  const expected = render(pageSrc, indexSrc);
  assert.equal(
    normalize(committed),
    normalize(expected),
    "cloudflare-webui/worker.js 已与 worker/src 漂移，请运行 `npm run build:webui` 重新生成后再提交。",
  );
});
