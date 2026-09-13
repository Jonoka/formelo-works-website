# 技术实施边界与目录

## 当前状态

DEV-01 已建立根 npm workspaces、Astro 静态首页 / 404 和独立 Studio schema/config 骨架。默认本地 mock；没有真实 Sanity 项目、正式网站内容或部署配置。

## DEV-01 工程结构

采用根目录轻量 npm workspaces：`web/` 为 Astro + TypeScript 静态前端，`studio/` 为 Sanity Studio。
固定 Node 24.21.0 / npm 11.19.1，使用一种包管理器、精确直接依赖及单一根 lockfile。本地和 CI 执行 `npm ci` / `npm run verify`。版本取舍与实际检查记录见 [DEV-01 验证记录](../operations/dev-01-verification.md)。

Astro 的静态输出在构建期生成公开 HTML；Sanity 内容发布需要触发重建才能体现在静态站。[S4][S5] 不因为使用 CMS 就建设客户数据库或询盘 API。

```text
web/src/{pages,layouts,components,content,lib,styles}
studio/{schemaTypes,objects}
shared/content.ts       页面与本地 mock 的最小内容契约
config/runtime.ts       构建环境校验及禁止发布的早期门禁
config/                 空联系配置和完整首期计划路由
assets/reference/       不进入网站发布目录
docs/                   版本化需求与交接
scripts/                检查与本机初始化
```

## 内容来源与模式

原型用本地 mock 内容；正式使用 Sanity。两者映射到同一个 TypeScript 内容结构，不在每个页面写一套不同数据源。
四类 CMS：siteSettings、page、category、article。samples、FAQ、MOQ、SEO 和 image 是嵌套对象，按 PRD 定义。
概念模式与是否 private 是不同概念：mock 可以有占位，但预览仍必须是受控的。任何公网地址都要得到用户明确授权。

`site.example.json` 的临时品牌、空联系与空工厂字段由 mock 读取，不含真实联系账号或密钥。`web/src/lib/content.ts` 是统一内容入口，返回独立快照；Sanity provider 尚未实现，显式拒绝而非回退。类型和字段名称为后续映射提供边界，不宣称已完成 CMS 类型生成或生产运行时校验。

`DEPLOY_ENV`、`CONCEPT_MODE`、`CONTENT_MODE`、`ANALYTICS_MODE` 在构建阶段校验。DEV-01 禁止任何 production 构建，所有本地 / preview HTML noindex，不带 canonical 或 sitemap。`preview` 只是一项构建模式，不授予公网访问或部署权限。

## 可替换品牌与媒体

文字 Logo 从配置渲染。参考图不放 `web/public`；图片资产要有角色、审核与替换状态。
不复制字体文件；字体选择、合法来源和网络加载预算在 DEV-02 实现时决定。
独立图片交付前可用明确占位框，不从网页截图自动裁切带字图。

## 发布、内容同步与备份

Git 存代码、schema、seed / mock、必要媒体和文档；Sanity Content Lake 内容不是 Git 自动同步的一部分。
正式运营需要内容导出、图片资产管理、构建触发与部署记录；不要把数据库导出、客户资料、部署 token 直接进仓库。
`Git commit`、`CMS publish`、`site deployment` 三个状态分别记录。
CI 保留文档 / 配置 / 初始化脚本检查，并执行锁定依赖安装、高危审计阻断、TypeScript / schema / 静态产物 / 浏览器回归。不连接 Sanity、不传 secrets、不部署。
框架和托管部署见任务 DEV-01 / DEV-07；具体商用许可、账号及费用上线前单独核实。

来源：[S4][S5] 见 [references.md](../references.md)。
