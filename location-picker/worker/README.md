# Location Picker — Cloudflare Worker

与 `../server.js` API 完全兼容，免 VPS、自带 HTTPS，支持 **Loon / Shadowrocket / Surge** 的 `configUrl`。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chung223/ios-location-spoofer/tree/main/location-picker/worker)

> 点上面的按钮可一键把本目录部署到你自己的 Cloudflare（会引导你连接 GitHub、建 Worker）。部署后仍需按下文建 KV `LOC_KV` 并设 `TOKEN` 机密。想手动/命令行部署或配自动部署，见下文。

## 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 地图选点网页（URL 加 `?token=` 才能保存） |
| `/loc.json?token=` | GET | 读取坐标 JSON |
| `/set?token=` | POST | 保存坐标 |
| `/enable` | POST | 回到真实位置（再点一下恢复伪造） |
| `/health` | GET | 健康检查（无需 token） |

## 部署

> 只想用 Cloudflare 网页后台复制粘贴、不想装 npm / Wrangler 的用户，看这里：[`../cloudflare-webui/`](../cloudflare-webui/)。

### 1. 安装依赖

```bash
cd location-picker/worker
npm install
```

### 2. 创建 KV 命名空间

```bash
npx wrangler kv namespace create LOC_KV
npx wrangler kv namespace create LOC_KV --preview
```

把输出的 `id` 填进 `wrangler.jsonc` 的 `id` 和 `preview_id`。

### 3. 设置访问口令

```bash
npx wrangler secret put TOKEN
# 输入随机字符串，例如 openssl rand -hex 24 生成的值
```

本地开发可复制 `.dev.vars.example` 为 `.dev.vars` 并填写 `TOKEN=...`。

### 4. 部署

```bash
npm run deploy
```

记下输出的地址，例如 `https://ios-location-picker.你的账号.workers.dev`。

## GitHub Actions 自动部署（可选，push 即部署）

配好后，往 `main` 推送、只要改动了 `location-picker/worker/**`，就会自动 `wrangler deploy` 到 Cloudflare。工作流文件在 [`.github/workflows/deploy-picker.yml`](../../.github/workflows/deploy-picker.yml)。

**一次性设置：**

1. **拿 Cloudflare API Token**：Cloudflare 仪表盘 → 右上头像 → **My Profile → API Tokens → Create Token** → 用 **「Edit Cloudflare Workers」** 模板（已含 Workers 脚本 + KV 权限），账号选你自己的 → 创建后**复制那串 token（只显示一次）**。
2. **存进 GitHub**：你的仓库 → **Settings → Secrets and variables → Actions → New repository secret**，名称填 `CLOUDFLARE_API_TOKEN`，值粘上一步的 token。
3. **确认 KV 与口令**（各一次）：
   - `wrangler.jsonc` 里的 KV `id` 必须是**你自己账号**建的 namespace（`npx wrangler kv namespace create LOC_KV` 拿到 id 填进去）。
   - 设一次 Worker 访问口令：`npx wrangler secret put TOKEN`（**部署不会覆盖**已存的机密和 KV 数据，所以只需设一次）。

**之后：** push 到 `main` 自动部署；也能到仓库 **Actions** 页点 **Run workflow** 手动触发。

> ⚠️ 说明：
> - 这个 Action 部署的是 **Wrangler 版**（`worker/src/`）到 Worker 名 `ios-location-picker`。启用后请**统一用 git 管理**，别再去 Cloudflare 后台手改代码——下次 push 会覆盖掉。想改逻辑就改 `worker/src/` 再 push。
> - 只有**多个 Cloudflare 账号**时才需要额外指定账号：在 `wrangler.jsonc` 里加 `"account_id": "你的账号ID"`。单账号免。
> - 本工作流跑在 GitHub Actions 上，与「GitHub Pages」无关；公开仓库免费。

## Loon 插件配置

Loon → 设置 → 插件 → iOS Location Spoofer → **远程配置 URL**：

```
https://ios-location-picker.你的账号.workers.dev/loc.json?token=你的TOKEN
```

保存后，在 iPhone 浏览器打开地图页：

```
https://ios-location-picker.你的账号.workers.dev/?token=你的TOKEN
```

点地图 → **保存定位** → 关开 iPhone 定位服务生效（Loon 约 60 秒内刷新缓存）。

## Shadowrocket 配置

模块 `argument=` 末尾追加：

```
&configUrl=https://ios-location-picker.你的账号.workers.dev/loc.json?token=你的TOKEN
```

## 自定义域名（可选）

在 Cloudflare Dashboard → Workers → 你的 Worker → Settings → Domains 绑定子域即可，例如 `loc.example.com`。

## 当 App 用 & 一键改定位

- 用 iPhone 浏览器打开 `https://.../?token=你的TOKEN`，Safari 分享 →「添加到主屏幕」，即可全屏独立打开（已内置 PWA 图标 `/icon-180.png` 与 apple 元信息，无需额外配置）。
- 想做到「主屏幕点一下 / 轻点手机背面」就切定位，见 [`../快捷指令一键改定位.md`](../快捷指令一键改定位.md)（iOS 快捷指令直接打 `POST /set`，再切 Wi-Fi/飞行模式触发生效）。

## 与 Node 版差异

- 数据存在 **KV**（非本地文件），个人用量免费额度足够
- KV 有秒级最终一致性，保存后 Loon 最多等约 60 秒缓存刷新
- 无需自行管理 HTTPS 证书
