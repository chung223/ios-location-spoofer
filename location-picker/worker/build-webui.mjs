// 由 worker/src/{page.js,index.js} 生成单文件 cloudflare-webui/worker.js
// （给「Cloudflare 网页后台复制粘贴、不装 npm/Wrangler」的用户用）。
//
//   node build-webui.mjs      # 重新生成
//   npm run build:webui       # 同上
//
// render() 是纯函数，test/webui-in-sync.test.mjs 会用它校验产物没漂移。
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const HEADER = `// ⚠️ 自动生成，请勿手改：由 worker/src/page.js + worker/src/index.js 合并（npm run build:webui）。
//    要改逻辑请改 worker/src/ 再重新生成，避免多份副本漂移。
//    用途：Cloudflare 网页后台「复制粘贴单文件」部署（无需 npm / Wrangler / GitHub）。
`;

// 纯函数：吃两份源码字符串，吐出合并后的单文件内容。
export function render(pageSrc, indexSrc) {
  // 去掉 page.js 顶部的单行注释（合并后由 HEADER 取代）
  const pageBody = pageSrc.replace(/^\/\/[^\n]*\r?\n/, "").trimEnd();
  // 去掉 index.js 里对 PAGE 的 ESM import（此处已内联）
  const indexBody = indexSrc
    .replace(/^[ \t]*import\s+\{\s*PAGE\s*\}\s+from\s+["']\.\/page\.js["'];?[ \t]*\r?\n/m, "")
    .trimStart();
  return `${HEADER}\n${pageBody}\n\n${indexBody}`;
}

export async function build(dir = new URL("./", import.meta.url)) {
  const pageSrc = await readFile(new URL("src/page.js", dir), "utf8");
  const indexSrc = await readFile(new URL("src/index.js", dir), "utf8");
  const out = render(pageSrc, indexSrc);
  const target = new URL("../cloudflare-webui/worker.js", dir);
  await writeFile(target, out.endsWith("\n") ? out : `${out}\n`, "utf8");
  return out.length;
}

// 直接 `node build-webui.mjs` 执行时才写文件；被 import（测试）时不写。
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bytes = await build();
  console.log(`cloudflare-webui/worker.js regenerated (${bytes} bytes)`);
}
