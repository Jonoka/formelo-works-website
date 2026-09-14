# Astro web · 首页与品类概念

静态输出、严格 TypeScript、本地 mock。当前实现首页 `/`、`/clothing/t-shirts/`、`/clothing/hoodies/`、工程 404 和 `robots.txt`。两品类复用一个模板，不代表完整十页或生产验收。

使用 Node 24.21.0 / npm 11.19.1，从仓库根目录执行；先用 `node --version`、`npm --version` 和 `npm run check:runtime` 核对，不能关闭 engine-strict：

```bash
npm ci
npm run dev
# 打开终端打印的本机地址，默认 http://127.0.0.1:4321
# 端口占用时 Astro 可能改用下一端口。
npm run check
npm test
npm run build
npm run preview
```

`npm run build` 生成 `web/dist/`，随后检查 HTML、内部链接与锚点、禁用渠道、noindex 和输出文件范围。浏览器检查方法见根 README；它会自行启动、关闭开发服务器和静态预览服务器。

## 内容边界

`src/lib/content.ts` 是页面唯一内容入口，`src/content/mock.ts` 使用 `shared/content.ts` 的类型。品牌与空联系配置来自 `config/site.example.json`；工厂名称、MOQ 和确认日期为空，正式品类与文章数组为空；独立的 categoryPreviews 只供概念模板与首页卡片映射。修改 mock 不等于工厂事实确认。

`config/runtime.ts` 在构建阶段校验环境。默认 `DEPLOY_ENV=local`、`CONTENT_MODE=mock`、`CONCEPT_MODE=true`、`ANALYTICS_MODE=off`。`DEPLOY_ENV=production` 一律失败；`CONTENT_MODE=sanity` 一律失败且不回退。根 `.env.local` / `.env` 可选，已有进程环境变量优先。正常本地开发无需创建任何环境文件。

整个站点 noindex、robots 禁抓，不生成规范域名或 sitemap。noindex 不是访问控制；监听地址仅本机回环，禁止将 dist 上传到公网。Astro CLI 遥测由进程包装器关闭，不修改用户全局设置。

参考图只保留在 `assets/reference/`；三张已登记的独立 AI 概念图用于首页与品类页，每张保留图注；工厂图仍待补。未复制参考图、外部图片或字体文件。真实照片、业务终稿、其余内页、CMS 与生产发布仍是后续任务。
