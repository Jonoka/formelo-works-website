# DEV-05A · CMS 文章契约与只读边界

## 交付范围

基于已由 Jonoka 合并的 PR #6 / main `11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0`，仅建立两个既有文章 URL 的离线工程链路。没有连接真实 Sanity 项目，没有写入测试稿、上传资产、发布/撤回、迁移或部署 Studio。

```text
Studio article + reusable editorial objects
    → parameterized published-only GROQ projection (unknown JSON)
    → convertCmsArticles / convertCmsBody (strict runtime validation)
    → CmsArticleRenderData.body: EditorialBlock[]
    → existing EditorialBody + EditorialInline / EditorialText
```

`tests/cms-render.test.ts` 在独立、用后删除的临时 Astro 根目录实际导入原 `EditorialBody.astro`，渲染两文转换结果并检查 HTML。该临时目录不在 `web/src/pages`，不是新页面或第二套文章模板。测试专用输出在 `review/cms-render-offline/`，不进入常规 `web/dist`。

**全站 `loadContent` 仍只接受 mock；`CONTENT_MODE=sanity` 和 production 门禁不解除。** 本轮没有文章局部来源开关、CMS 卡片切换、CMS 封面渲染、实时预览或重建触发器。查询失败不会读取 mock。即使独立读取/转换成功，也不能据此宣称全站 CMS 或网站上线完成。

## 三种数据必须分开

| 数据 | 用途与状态 |
|---|---|
| `ArticlePreview` | 当前常规页面的本地采购草稿，`editorial_draft`，本地概念图，没有作者/公开日期/工厂审核字段 |
| 原始 CMS `Article` / GROQ JSON | 不可信的存储或查询输入；`body: unknown[]` 不能直接交给组件，Studio 校验不是数据库权限保障 |
| `CmsArticleRenderData` | 严格通过后的独立交付契约，`kind: cms_article`、`cmsPerspective: published`、`websitePublication: not_verified`、`productionAllowed: false`；正文复用原契约，不变成本地草稿 |

Sanity `published` 是查询视图，不是工厂审核结果，也不是网站部署证据。`factReviewStatus` 只有 `pending` / `confirmed`，初始为 pending；技术发布不能自动更改它。作者和日期没有默认值，转换器不使用 `_createdAt`、`_updatedAt`、构建时间或代码提交时间补值。这里的 `now` 只用于拒绝未来日期，不写进内容。

## 字段与正文映射

四类主要文档继续为 `siteSettings`、`page`、`category`、`article`。原五个对象保留；增加七个可复用 schema 类型：`editorialBody`、`editorialTable`、`editorialTableRow`、`editorialCallout`、`editorialTemplate`、`editorialInternalLink`、`editorialExternalLink`。合计四类文档、十二个复用类型；没有作者文档、客户数据或页面构建器。

| CMS 输入 | 交付字段 / 约束 |
|---|---|
| `title`、`excerpt`、`seo.seoTitle/seoDescription` | 原值保留；非空、有长度边界，不加工厂宣传、不改写正文 |
| `slug.current`、`referenceCode` | 只接受 `what-to-send-for-a-clothing-quote` / `WEB-QUOTE-GUIDE` 与 `moq-per-style-per-color` / `WEB-MOQ-GUIDE` 的固定配对；不生成第三个 URL |
| Portable Text `block` normal/h2/h3 | paragraph / heading；H2/H3 仅纯文本，H3 不能先于 H2；文章至少三个 H2，沿用稳定去重目录算法 |
| `span`、strong/em、链接注解 | text/link 与可选 marks；保留词间空白。未支持标记、悬空/未使用注解、重复 key 直接失败，不把格式静默抹掉 |
| bullet/number list，level 1 | 连续同类型条目组成原 list；支持当前一层列表，不支持嵌套层级；上限 30 条 |
| `editorialTable` | caption / columns / rows；2–6 列、1–30 行，每行列数严格一致，纯文本单元格。原数量表第一列行标题、列组、横向滚动提示和 180 件算例保留 |
| `editorialCallout` | title + 一个 normal 段落的 inline；不是任意布局容器 |
| `editorialTemplate` | title / text；原样保留换行、括号提示与长文本，HTML 字符按文本转义，不增加发送或复制操作 |
| `authorDisplay` | 实际获准公开的署名，缺失/空白失败；离线夹具署名不进入普通页面 |
| `publishedAt`、`contentUpdatedAt` | 实际 UTC 日期时间，不能未来、不能更新早于发布；缺少公开日期时保留草稿，不编造历史 |
| `factReviewStatus`、`factConfirmedAt` | confirmed 且真实日期不早于实质内容更新日期；缺失、pending、无效/过期日期失败。填写字段不能替代实际核实 |
| `coverImage` | 复用 approvedImage。非装饰封面、非空 alt、明确 publicUseApproved:true、已解析的正确 imageAsset；保留 caption、crop、hotspot，不虚构许可 |
| `relatedCategories`、`relatedArticles` | 最多两个唯一、非自身、已解析且对应正确文档类型的目标；无值允许空数组，不伪造推荐 |
| `linkToManufacturing` | 可选明确布尔值；没有值不自动生成新 CTA 或页面行为 |

内部链接使用强 reference，必须解析到已发布、已知路由、唯一的 page/category/article；引用 ID 与投影 `_id` 不一致、weak、draft/version、无目标、无事实确认、文章审核 pending 均失败。目录采用正文标题生成；可编辑内部 fragment 仅接受当前已注册的锚点。外链只能是 `config/editorial-sources.json` 已审核的精确 HTTPS 文本链接，不授权远程资源、图片抓取或脚本加载。

封面仅查询资产 ID、URL、尺寸等必要字段，不投影 EXIF/GPS/原文件名。校验资产引用、URL 的项目/数据集、扩展名和尺寸一致；拒绝 SVG 或任意外部 URL。裁切与热点完整保留，但真实图片渲染、加载与许可证明仍待授权验证，不能将此接口说成已完成远程媒体管线。

## 只读模块与失败策略

入口：`web/src/lib/server/cms-article-query.ts`。使用锁定 Node 自带的 fetch 直接调用官方 Query HTTP API，不增加生产客户端依赖。根测试依赖显式声明已有锁图内的 `groq-js@1.30.3`，由 npm 正常更新 lockfile；不是手写 lock 或升级依赖图。

| 设置 | 固定策略 |
|---|---|
| API / 视图 | `apiVersion: 2025-02-19`，`perspective: published`；不接受 raw/drafts/release 视图 |
| 缓存 | 非 CDN 的 `api.sanity.io`；`useCdn:false` 的等价 HTTP 端点；fetch `cache:no-store`，不依赖默认值 |
| 请求 | 只允许 POST `/data/query/<dataset>`，GROQ 常量 + `params.id/slug`；ID 不插入查询字符串；`returnQuery:false`、`resultSourceMap:false` |
| 授权范围 | 显式 1–2 个文章文档 ID 白名单，以及其必要引用/资产元数据；不枚举项目、账号、数据集或其他文档正文 |
| 身份 / 重复 | `_id`、`_originalId` 防御校验；GROQ 同时排除 `drafts.**` / `versions.**`。published slugCount/routeCount 跨所选 ID 计算，不用 `[0]` 隐藏重复 |
| 网络边界 | 默认 8 秒完整截止时间，含响应正文读取；最大 1 MiB；禁止重定向、无自动重试；仅 Authorization header 持有 token |
| 可测试性 | transport / now 可注入，默认测试只读内存数据。GROQ 在 groq-js 中真实执行，但不冒充 Sanity 云端鉴权或服务端实现验收 |
| 错误 | 缺配置、未授权 ID、401、403、其他 HTTP 错误、超时、空/坏 JSON、空结果、错误文档、未知块和违规状态均抛明确错误码，调用者没有 mock 回退 |
| 日志 | 仅代码控制的错误码/字段路径；不保留原始 fetch error cause、header、token 或私密响应体 |

凭证只在服务器函数闭包内。模块未被 loadContent、路由或浏览器脚本引用，另有 Node 运行时边界。Studio 拒绝 `SANITY_STUDIO_*TOKEN/SECRET/PASSWORD/KEY` 形式的非空变量；这些公开前缀绝不能存 token。`scripts/check-cms-boundary.mjs` 对普通静态产物检查服务器标识、夹具标记和当前显式服务器 token；测试还验证随机假 token 不出现在隔离渲染产物/日志以及扫描器报错中。没有给 CI 配置真实 CMS 密钥。

## DEV-05B · 单篇真实 Draft 预览边界

2026-09-17 已在用户明确授权下连接真实 Sanity 项目 `iajvl7ka` / dataset `production`，范围仅限文档 `1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae`（`what-to-send-for-a-clothing-quote`）。根 `.env.local` 只保存服务器读取配置；`studio/.env.local` 只保存 `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`，不放 token。两文件均被 Git 忽略，检查只确认必要变量存在，不打印值。

正式 `web/src/lib/server/cms-article-query.ts` 继续固定 `perspective: published` 和完整发布校验。DEV-05B 另建 `web/src/lib/server/cms-draft-preview-query.ts` 与 `shared/cms-draft-preview.ts`：只允许上述一个 project / dataset / document ID / slug，使用 `perspective: drafts`、`cache:no-store`、最大 1 MiB、完整截止时间、无重试、无 mock fallback；converter 返回 `kind: cms_article_draft_preview`、`websitePublication:not_published`、`productionAllowed:false`，不生成作者、发布日期、事实确认日期或封面许可字段。正文仍经 `convertCmsBody` → `EditorialBlock[]` → 既有 `EditorialBody`，未知块、危险协议、坏表格和未授权内部引用继续失败。

本地页面的 Draft 替换需要三层条件：显式 `DEV_CMS_DRAFT_PREVIEW=1`、`DEPLOY_ENV=local`，以及 Astro **实际命令为 `dev`**。`web/astro.config.ts` 的 `astro:config:setup` 读取 Astro 提供的 `command`；只要该开关遇到 `command=build`，立即抛 `CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN`，早于路由执行、Draft HTTP 请求和 HTML 输出。该判断不依赖 npm 脚本名、`NODE_ENV` 或 Vite `mode`，所以 `astro build --mode development` 仍被拒绝。配置阶段同时把实际 command 注入服务端路由，`[slug].astro` 在读取 token / Draft 前再次要求 `dev`。普通 `loadContent` 仍仅接受 mock，默认 build 仍输出原十内容 URL + 404；`CONTENT_MODE=sanity` 和 production 门禁不解除。`check-cms-boundary.mjs` 另扫描 Draft provider / 状态 / 开关标记，但只是第二道防线，不能替代前置拒绝。此预览不是通用 CMS provider、不是公开预览地址，也不允许枚举其他文档。

真实 Studio 已打开该测试 Draft，并只修改技术联调 excerpt。保存前 `_rev` 为 `RyoTMvUwfjfi4GD1LaCRuB`，保存后为 `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`；`factReviewStatus` 仍为 `pending`，作者、公开日期、事实确认、封面与素材许可仍未填写。随后服务器只读 token 实际读到新 revision 和新 excerpt，而正式 published reader 仍得到空结果。没有 publish、unpublish、媒体上传、schema deploy、Studio deploy、网站部署或 Cloudflare 操作。

## DEV-05C · 统一文章交付与刷新语义

PR #8 已由用户合并至 `main@83dec3f23f264ac034d1b7775eff6ca2b71a8d27`，验收 head 为 `5ef5ae3a7ca82c64ec238e7b329c78a0faebde5c`。DEV-05C 在 `feat/cms-editorial-delivery` / PR #9 上新增 `shared/article-delivery.ts` 与 `web/src/lib/server/article-delivery.ts`，只负责两篇既有文章的交付选择，不把全站 `loadContent` 切换为 Sanity。

三个展示位置——首页 Journal 区、`/blog/` 和 `/blog/[slug]/`——都调用同一个文章集合入口；标题、摘要、slug、referenceCode、来源、状态、revision 与封面状态来自同一已验证记录，`JournalCard` 只是 `articleCardData()` 的投影，详情继续使用原 `ArticleLayout` / `EditorialBody`。没有第二套正文模板，也没有第三套卡片查询。

| 文章模式 | 允许来源 | 当前行为 |
|---|---|---|
| `mock` | 两篇本地 `ArticlePreview` | 默认；两篇都标记 `source:local` / `editorial_draft`，沿用登记概念图并明确 dedicated cover pending |
| `draft-preview` | 授权询价 Draft + 本地 MOQ draft | 仅本地 loopback `astro dev`；询价文章每次请求重新读现有单篇 Sanity Draft，MOQ 是预先声明的本地来源，不是错误回退 |
| `published` | strict published Sanity records only | 复用已有 published query / converter；两篇必须完整、唯一、通过作者/日期/事实审核/封面许可/引用校验，否则整个集合失败 |

`ARTICLE_CONTENT_MODE` 是文章局部的显式来源选择，不改变 `CONTENT_MODE=mock` 的全站门禁。Draft 模式仍要求 `DEV_CMS_DRAFT_PREVIEW=1`、`DEPLOY_ENV=local`、Astro actual command=`dev`、请求 hostname 为 loopback；build 守卫继续在配置阶段阻断 Draft 网络访问与输出。Published 模式不接受 draft perspective，也不以本地文章补齐空结果或失败条目。

刷新/缓存规则：
- mock 没有远端读取；
- Draft dev 每个页面请求重新执行 no-store 读取，因此 Studio 保存后的下一次刷新可看到新 revision；成功结果不跨请求长期缓存；
- published dev 同样按请求重新读取；
- 单次实际静态 build 只允许共享一个来源快照，保证 Home / Journal / detail 在该 build 内一致；若同一 build 中来源配置变化则 `ARTICLE_BUILD_SOURCE_CHANGED` 明确失败；
- 不引入订阅、Visual Editing、客户端 token、实时监听或外部缓存平台。

封面状态也属于同一交付契约。授权真实 Draft 当前没有 `coverImage`，所以三处都显示有意设计的 text-only / no-cover 状态，不能拿本地 T-shirt 概念图冒充 CMS 封面。Published 文章只有 `publicUseApproved:true`、非装饰、alt、资产身份/URL/尺寸、crop/hotspot 等严格校验全部通过后才标记 `coverState:approved`。本地 editorial draft 的概念图继续标记 `local_concept`，三种状态不能互换。

错误处理：缺配置、401/403、其他 HTTP、超时、空结果、不完整 published 集合、重复 slug、缺作者/日期/事实确认/封面、坏引用、未知正文块等都抛受控错误。dev 页面返回明确 503 / 安全错误码；build 直接失败。调用者不返回上一次成功记录，不丢掉失败文章，也不静默改成 mock。

离线 published/draft 浏览器测试使用假 token 和预加载 transport，所有网络请求都在本机拦截，证据目录明确写 `OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT`。它们只证明查询、转换、三处一致性、刷新和失败路径，不代表真实云端 published 内容存在。当前真实云端仍只有已授权询价 Draft；本轮没有发布、撤回、上传媒体、部署或 Webhook。

## 官方依据 / 2026-09-16 核对

本仓库安装 Sanity / @sanity/schema **5.31.2**，锁图内 @sanity/client **7.27.0**，groq-js **1.30.3**。客户端仅是 Studio 的既有间接依赖，本轮 HTTP 读取不使用它。

- [Query HTTP API](https://www.sanity.io/docs/http-reference/query)：POST/参数、视图、空结果、returnQuery 与 resultSourceMap。
- [Perspectives](https://www.sanity.io/docs/content-lake/perspectives)：published 与 drafts / Content Releases 的区别；显式 API 日期和视图，不依赖版本默认。
- [API CDN](https://www.sanity.io/docs/content-lake/api-cdn)：静态构建采用非 CDN API，明确缓存边界。
- [Block type](https://www.sanity.io/docs/studio/block-type) 与 [Portable Text editor configuration](https://www.sanity.io/docs/studio/portable-text-editor-configuration)：显式 styles/lists/marks/annotations 和自定义对象。新版内置表格编辑器需要 Studio 6.6.0，本项目不升主版本，采用 v5 可用的受控对象。
- [GROQ-JS](https://github.com/sanity-io/groq-js)：对内存 dataset parse/evaluate，作为离线查询投影测试，不连接 Content Lake。
- [Image type](https://www.sanity.io/docs/studio/image-type) 与 [Image URLs](https://www.sanity.io/docs/apis-and-sdks/image-urls)：资产引用、URL 与字段上的 crop/hotspot；许可仍需由权利人确认。

官方文档为滚动更新资料；本轮采用的结构已在锁定 v5.31.2 schema 编译及现有 Astro 组件中实际测试，不把新版 API 示例当作已安装功能。
