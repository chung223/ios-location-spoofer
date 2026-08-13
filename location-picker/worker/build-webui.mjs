// 从 worker/src/{page.js,index.js} 生成两个产物，避免页面多份副本漂移：
//   1) cloudflare-webui/worker.js —— 单文件版（Cloudflare 网页后台复制粘贴，无需 npm/Wrangler/GitHub）
//   2) server.js 里 PAGE:BEGIN…PAGE:END 之间的 PAGE 常量 —— Node 自托管版
//
//   node build-webui.mjs      # 重新生成
//   npm run build:webui       # 同上
//
// render() / renderServerPage() 是纯函数，test/webui-in-sync.test.mjs 用它们校验产物没漂移。
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const HEADER = `// ⚠️ 自动生成，请勿手改：由 worker/src/page.js + worker/src/index.js 合并（npm run build:webui）。
//    要改逻辑请改 worker/src/ 再重新生成，避免多份副本漂移。
//    用途：Cloudflare 网页后台「复制粘贴单文件」部署（无需 npm / Wrangler / GitHub）。
`;

// 从 page.js 抠出 PAGE 模板字符串的内容（内部无反引号、无 ${} 插值，纯字符串拷贝）。
function extractPageInner(pageSrc) {
  const m = pageSrc.match(/export const PAGE = `([\s\S]*)`;/);
  if (!m) {
    throw new Error("page.js: 找不到 `export const PAGE = ` 模板字符串");
  }
  return m[1];
}

// 纯函数：合并成单文件 cloudflare-webui/worker.js 的内容。
export function render(pageSrc, indexSrc) {
  const pageBody = pageSrc.replace(/^\/\/[^\n]*\r?\n/, "").trimEnd();
  const indexBody = indexSrc
    .replace(/^[ \t]*import\s+\{\s*PAGE\s*\}\s+from\s+["']\.\/page\.js["'];?[ \t]*\r?\n/m, "")
    .trimStart();
  return `${HEADER}\n${pageBody}\n\n${indexBody}`;
}

// 纯函数：把 server.js 里 PAGE:BEGIN…PAGE:END 之间的 PAGE 常量换成 page.js 的内容。
export function renderServerPage(serverSrc, pageSrc) {
  const inner = extractPageInner(pageSrc);
  const block = "const PAGE = `" + inner + "`;";
  const re = /(\/\/ === PAGE:BEGIN[^\n]*\n)[\s\S]*?(\n\/\/ === PAGE:END ===)/;
  if (!re.test(serverSrc)) {
    throw new Error("server.js: 找不到 PAGE:BEGIN … PAGE:END 标记");
  }
  // 用替换函数（而非替换字符串），避免 PAGE 里的 $(...) 被当成 $1 之类特殊符号。
  return serverSrc.replace(re, (_, begin, end) => begin + block + end);
}

export async function build(dir = new URL("./", import.meta.url)) {
  const pageSrc = await readFile(new URL("src/page.js", dir), "utf8");
  const indexSrc = await readFile(new URL("src/index.js", dir), "utf8");

  const webui = render(pageSrc, indexSrc);
  const webuiOut = webui.endsWith("\n") ? webui : `${webui}\n`;
  await writeFile(new URL("../cloudflare-webui/worker.js", dir), webuiOut, "utf8");

  const serverPath = new URL("../server.js", dir);
  const serverSrc = await readFile(serverPath, "utf8");
  const serverOut = renderServerPage(serverSrc, pageSrc);
  await writeFile(serverPath, serverOut, "utf8");

  return { webui: webuiOut.length, server: serverOut.length };
}

// 直接 `node build-webui.mjs` 执行时才写文件；被 import（测试）时不写。
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sizes = await build();
  console.log(
    `regenerated: cloudflare-webui/worker.js (${sizes.webui} bytes), server.js PAGE (${sizes.server} bytes total)`,
  );
}
