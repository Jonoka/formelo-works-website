# Astro web · DEV-01

静态输出、严格 TypeScript、本地 mock。当前仅首页 `/`、工程 404 和 `robots.txt`；不是完整十页站点。首页用于验证工程与既定字体、配色、双栏及移动端布局，不代表 DEV-02 / DEV-03 已完成。

从仓库根目录执行：

```bash
npm ci
npm run dev
# 仅本机：http://127.0.0.1:4321
npm run check
npm test
npm run build
npm run preview
```

`npm run build` 生成 `web/dist/`，随后检查 HTML、内部链接与锚点、禁用渠道、noindex 和输出文件范围。浏览器检查方法见根 README；它会自行启动、关闭开发服务器和静态预览服务器。

## 内容边界

`src/lib/content.ts` 是页面唯一内容入口，`src/content/mock.ts` 使用 `shared/content.ts` 的类型。品牌与空联系配置来自 `config/site.example.json`；工厂名称、MOQ 和确认日期为空，品类与文章数组为空。修改 mock 不等于工厂事实确认。

`config/runtime.ts` 在构建阶段校验环境。默认 `DEPLOY_ENV=local`、`CONTENT_MODE=mock`、`CONCEPT_MODE=true`、`ANALYTICS_MODE=off`。`DEPLOY_ENV=production` 一律失败；`CONTENT_MODE=sanity` 一律失败且不回退。根 `.env.local` / `.env` 可选，已有进程环境变量优先。正常本地开发无需创建任何环境文件。

整个站点 noindex、robots 禁抓，不生成规范域名或 sitemap。noindex 不是访问控制；监听地址仅本机回环，禁止将 dist 上传到公网。Astro CLI 遥测由进程包装器关闭，不修改用户全局设置。

参考图只保留在 `assets/reference/`；页面使用明确的缺图框，未复制参考图、外部图片或字体文件。真实照片、最终业务文案、完整导航、CMS 查询及生产发布仍是后续任务。
