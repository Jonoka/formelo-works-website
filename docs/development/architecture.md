# 技术实施边界与目录

## 当前状态

PR #6 已由用户合并，main/base 为 11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0。十个内容页 + 404 的概念结构保持不变。DEV-05A 在根 workspaces / Astro 静态 / 独立 Studio 基础上实现受控文章 schema、只读查询和严格转换的离线链路；没有真实 Sanity 账号接入、工厂资料确认或部署。

## DEV-01 工程结构

采用根目录轻量 npm workspaces：`web/` 为 Astro + TypeScript 静态前端，`studio/` 为 Sanity Studio。
固定 Node 24.21.0 / npm 11.19.1，使用一种包管理器、精确直接依赖及单一根 lockfile。本地和 CI 执行 `npm ci` / `npm run verify`。版本取舍与实际检查记录见 [DEV-01 验证记录](../operations/dev-01-verification.md)。

Astro 的静态输出在构建期生成公开 HTML；Sanity 内容发布需要触发重建才能体现在静态站。[S4][S5] 不因为使用 CMS 就建设客户数据库或询盘 API。

```text
web/src/{pages,layouts,components,content,lib,styles}
studio/{schemaTypes,objects}
shared/content.ts       原始 CMS 类型与页面快照的明确边界
shared/editorial*.ts     本地/CMS共用正文渲染契约与纯校验
shared/cms-*.ts          不可信文章/引用/图片/正文的严格转换
web/src/lib/server/     独立 published-only 查询；普通页面未接入
studio/objects/editorial.ts  当前正文所需的受控复用 schema
config/runtime.ts       构建环境校验及禁止发布的早期门禁
config/                 空联系配置和完整首期计划路由
assets/reference/       不进入网站发布目录
docs/                   版本化需求与交接
scripts/                检查与本机初始化
```

## 内容来源与模式

预览用本地 mock，正式 Sanity provider 尚未实现。各路由只调用 loadContent；本地预览类型与正式 CMS 文档契约分开，避免把概念资料当成工厂审核记录。不在页面内部新建第二个数据源。
四类 CMS：siteSettings、page、category、article。samples、FAQ、MOQ、SEO 和 image 是嵌套对象；DEV-05A 再增七个受控正文复用类型，不增加主要文档或页面构建器。
概念模式与是否 private 是不同概念：mock 可以有占位，但预览仍必须是受控的。任何公网地址都要得到用户明确授权。

`site.example.json` 的临时品牌、空联系与空工厂字段由 mock 读取，不含真实联系账号或密钥。`web/src/lib/content.ts` 是统一内容入口，返回独立快照；Sanity provider 尚未实现，显式拒绝而非回退。DEV-05A 仅完成两篇文章的独立严格运行时转换，不宣称已完成全站 CMS 类型生成、provider 或生产校验。详见 [CMS 文章映射](cms-editorial-mapping.md)。

固定页采用带 pageKey / concept_only / unconfirmed / productionAllowed:false 的最小类型，Manufacturing/Factory/Contact 各自保留必要结构，不引入页面构建器。FactoryPhotographyPending 只验证 manifest 的 awaiting_factory 状态并渲染非照片图位；可选证书和案例无资料时没有模型数据或展示入口。Contact 只引用全局 null 账号、接待人、工作时间/时区及公开地址，不复制渠道资料到固定页数据。

config/page-context.ts 集中九个营销页面的稳定 referenceCode，Privacy / 404 为 null。BaseLayout 统一拼接品牌尾缀，Header/Footer 共享导航组件，当前页面用 aria-current 的不可点击文本避免自跳。详见 [路由说明](routes-and-navigation.md)。

`DEPLOY_ENV`、`CONCEPT_MODE`、`CONTENT_MODE`、`ANALYTICS_MODE` 在构建阶段校验。DEV-01 禁止任何 production 构建，所有本地 / preview HTML noindex，不带 canonical 或 sitemap。`preview` 只是一项构建模式，不授予公网访问或部署权限。

## DEV-05A 文章链路

只读 HTTP Query 模块固定 API 2025-02-19、published 视图、非 CDN 端点/no-store，按显式授权文档 ID 与既有 slug 参数化查询。未知块保留到校验后明确失败，重复 slug 用 count 检测，不以 `[0]` 掩盖；draft/release、坏引用、危险链接、未审核状态或缺作者/日期/许可均不能输出交付数据。

转换结果 `CmsArticleRenderData` 不等于本地 ArticlePreview；其 body 复用 EditorialBlock、EditorialBody 和目录算法，原数量表实现不变。元数据不补默认事实，技术发布/人审/网站发布单独表示。图片保留已验证资产元数据与裁切/热点，仅为转换交付，不宣称远程图片渲染已接入。字段和授权/失败契约见 [映射](cms-editorial-mapping.md)。

四类文档与十二个复用类型离线编译；groq-js 使用内存 dataset 验证真实查询投影；隔离 Astro 根目录实际渲染既有组件。夹具只能从 tests 引用，不能进入常规页面或被当作云端 seed。没有本地文章来源开关、全站 CMS 回退、云端写入或部署。平台、源码 SHA、截图与限制见 [DEV-05A 验证](../operations/cms-editorial-verification.md)。

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
