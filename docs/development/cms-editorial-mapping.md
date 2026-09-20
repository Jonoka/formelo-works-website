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

## DEV-05D · 全站 published provider 基础

PR #9 已由用户合并至 `main@64e881acd04b4c7ae7269d111dd1d3ea51c22044`。DEV-05D 从该 main 建立 `feat/cms-site-provider`，只补全站 Sanity **published 读取的工程基础**；不把普通页面切换到 Sanity，也不调用真实全站 Content Lake。既有单篇 Draft 授权不能扩大解释为 siteSettings / page / category 的读取许可。

`web/src/lib/server/cms-site-query.ts` 使用固定 Query HTTP POST，一次只查询：
- 一个 published `siteSettings` singleton；
- `home / manufacturing / factory / contact / blogIndex / privacy` 六个固定 pageKey；
- `t-shirts / hoodies` 两个固定 category slug；
- 上述字段校验所需的强引用目标与公开图片最小资产元数据。

策略继续是 `apiVersion=2025-02-19`、`perspective=published`、非 CDN、`cache:no-store`、无重定向/自动重试；完整请求默认 8 秒，响应上限 2 MiB。reader 没有任意 ID 或 slug 参数，缺配置、401/403、其他 HTTP、transport、timeout、空/坏/超大响应都只返回受控错误，不回退 mock。

Query HTTP 成功响应按**协议 envelope / 业务 result** 两层处理。官方 Query API 的 GET/POST 200 响应包含业务 `result`，并正常带服务器处理时间 `ms`，还可带 `syncTags`；`returnQuery=false` 只控制是否返回提交的 `query`，不意味着响应只有 `result`。site reader 因此只在 envelope 层验证/忽略这些协议元数据并要求 `result` 存在，随后仍把 `result` 原样交给 strict `convertCmsSiteBundle`；协议 metadata 不进入页面数据或日志。`shared/cms-validation.record()` 与 settings/pages/categories 的未知业务字段拒绝规则没有放宽。

`shared/cms-site.ts` 产出 `CmsSiteBundle`，但每个对象仍明确 `websitePublication:not_verified` / `productionAllowed:false`。转换要求 singleton 与固定路由唯一且完整，siteSettings 联系格式和 MOQ 完整；Home/Manufacturing/Factory/Contact 等业务页必须有有效 factConfirmedAt，Blog Index / Privacy 可为空；Home 有获准公开的 hero，Home/Manufacturing 有至少三项 FAQ。两个 category 的 source code 正确、至少三组样品且 sampleCode 全站唯一、至少一项 capabilityRow 与一张 evidenceImage、customization/sampling notes 必填、MOQ inherit/override 自洽、relatedArticles 是已发布强引用。页面/品类 SEO title 在该 bundle 内不得重复。

公开图片校验抽到 `shared/cms-image.ts`，文章 cover 与 site/category 图片共用同一套 asset identity、项目/dataset CDN URL、metadata 尺寸、publicUseApproved、非装饰 alt、crop/hotspot 规则，防止两条 provider 产生不同许可标准。Studio 同步把 logo/defaultOgImage、恰好两个 featuredCategories、固定页 factConfirmedAt、Home hero、Home/Manufacturing FAQ 与 category FAQ 的缺项提前标出来；这些编辑器提示不替代服务器校验。

本阶段没有 `templateContent` 迁移。当前 Manufacturing、Factory、Contact、Privacy 与 Category 页面仍有本地 presentation 数据，不能用只有共同 CMS 字段的 bundle 直接替换；因此 `web/src/lib/content.ts` 继续只接受 mock，`CONTENT_MODE=sanity` 继续 fail closed，普通 build 也不会导入或调用 site reader。`siteReaderConfigFromEnvironment` 还要求额外 `SANITY_SITE_READ_ENABLED=1`，用来防止既有单篇 token 被误当成全站读取授权；本阶段不设置该开关。离线 fixture 中的工厂名、联系人、日期、MOQ、样品与图片许可仅为负例/转换测试，禁止上传或当成真实资料。

## DEV-05E · 首页和两品类的实际模板交付

PR #10 已合并；本轮 base 为 `a83a01822a4310597dc2e8106a1a0c04339506e1`。上方 DEV-05A–D 段落记录当时边界，不再解释为本轮禁止接模板。新增链路为：

```text
page.home.templateContent / existing category + siteSettings
  → fixed siteBundleQuery projection + normal Query envelope
  → createSiteReader / strict CmsSiteBundle (all 6 pages + 2 categories)
  → site-delivery / request locals / one-build snapshot
  → existing index.astro + clothing/[slug].astro + CategoryLayout
```

| 模块 | 本地来源 | CMS 来源 | 必填/缺省与状态 |
|---|---|---|---|
| 首页 H1/简介/SEO | home.title/intro/seo | page.title/intro/seo | 必填，不补旧 mock；titleLineHints 只有逐字等于当前 title 才使用 |
| 首页眉题/主图 | homepagePreview.eyebrow/heroImage | templateContent.eyebrow / page.heroImage | 必填；CMS 图必须通过共享许可与尺寸/URL转换 |
| 六个区块业务标题/介绍 | homepagePreview.sectionCopy（原模板业务文案） | templateContent.sections.*.eyebrow/title/description | 六组固定字段必填，不开放模块/CSS/HTML自由输入 |
| 能力项 | homepagePreview.capabilities | templateContent.capabilities | 2–4 项标题/说明；图标顺序为代码视觉规则，非编辑字段 |
| 制造摘要 | 原本无独立摘要 | templateContent.manufacturingSummary + siteSettings.defaultMoq | 定制/打样摘要必填；MOQ模式/数量/单位/依据/混码/条件完整呈现 |
| 首页品类卡 | categoryPreviews.cardSummary/name/image | 同批 Category.name/intro/heroImage/path | 不新增重复摘要字段；按 featuredCategories 有效顺序，不硬编码详情副本 |
| 工厂摘要/图片 | 原本 sectionCopy + FactoryPhotographyPending | templateContent.factorySummary/factoryImage | 摘要必填；图可缺，明确显示未提供，不补 AI/库存照片 |
| 合作流程 | homepagePreview.processSteps | templateContent.processSteps | 3–5 项标题/说明必填 |
| 首页 FAQ | home.faqItems | page.faqItems | 保留至少 3 条验证，使用现有 FAQ |
| 首页 Journal | PR #9 文章交付 | 同一 loadArticlePage | 页面/文章来源分别声明，不复制查询/卡片/正文 |
| 品类 H1/简介/主图/SEO | CategoryPreview | Category.title/intro/heroImage/seo | 必填；CMS 状态不改造成 concept_only/unconfirmed |
| 样品 | 原单张概念图 + 观察点 | samples[*].sampleCode/name/summary/images | 正式路径保留全部组和多图，编号/名称/简介全显示；概念路径效果保持 |
| 可选样品规格 | 本地不伪造参数 | fabric/weightGsm/fit/techniqueNotes | 有值才显示，无值不填演示数字 |
| 能力与限制 | discussion | capabilityRows.name/description/limitNote | 行必填；限制有值则显示，不丢字段 |
| 定制与打样 | moqNotes/samplingNotes | customizationNotes/samplingNotes | 必填，保留 Manufacturing 对应锚点 |
| MOQ | 本地未确认说明 | moqMode + effectiveMoq | inherit/override 已在转换层处理；显示计量依据/混码/限制；projectBased 无固定数字 |
| 证据图/FAQ | 概念路径无假证据 | evidenceImages / faqItems | 所有图片经共享许可检查；FAQ 保持至少 3 条 |
| 相关文章 | 本地无 published 替身 | relatedArticles → existing ArticleCollection | 无引用则隐藏；缺失/来源不兼容失败，不补本地/第三篇/死链接 |
| 品类互访/导航 | 本地类别映射 | 同一 CategoryCard 投影 | 面包屑、稳定来源码与固定 URL 不变 |
| 公共品牌与联系状态 | mock settings | bundle.siteSettings + contactReleasePolicy | 十页头/脚/SEO同品牌；CMS账号及开启位保持原值，网站阶段仍禁用且不输出测试账号 |

业务内容通过上表映射；导航动词、错误/来源/许可状态、样品字段标签和联系控件说明由代码管理。衬线、色彩、分隔线、网格、图标和图片展示尺寸为视觉配置，不是 CMS 可编辑 CSS。

`loadContent('mock')` 仍是本地验证入口；server site-delivery 在明确 `HOME_CATEGORY_CONTENT_MODE=published` 时复用现有 reader，默认路径零 site transport。middleware 为全站布局传递一次请求内的来源，其他五个固定 page 正文仍本地并明示。完整 `CONTENT_MODE=sanity` 保持拒绝。两种文章来源组合均是预先声明：published 页面+published 文章；或 published 页面+local 文章且品类无 published 文章引用。任何查询失败都不改变预选组合。

同一次 Astro build 的非秘密 build ID 限定内容快照；构建中配置变化失败，新构建重新读取，dev 不跨请求缓存。无重试/旧成功内容/mock补齐；dev 脱敏 503，build 抛出明确失败。原 Query envelope 的 ms/syncTags兼容与严格业务白名单均保留。原始 bundle 只在服务器 locals，页面不序列化完整对象；凭证若误混入公开字段，在交付前拒绝。

HomePreview / CategoryPreview 从未强转为正式文档。`websitePublication:not_verified`、`productionAllowed:false`、CMS published、事实日期记录和图片 publicUseApproved 是分开的状态。独立网站阶段门禁继续拒绝联系/复制；不改写 CMS 账号或 channelStatus 来假装无配置。真实材料、全站读取、写入/发布/撤回、媒体和部署授权均未扩大。

本轮工程测试用假配置、内存 GROQ 和注入 Query HTTP transport。合成数据完整包含六页两品类，测试图请求只在本机拦截，PNG 为 TEST 检查图，不挪用三张服装概念图作 CMS 许可证明。隔离进程不读真实 dotenv；HTML/screenshot/脱敏日志位于专用目录。真实 PR #8/#9 Draft 目视已完成，不重新列为缺失。

## DEV-05F · 另外五个固定页的完整模板交付

PR #11 已由用户在 2026-09-20 合并；accepted `dd2690892826384548ab24a4dfb33e09c0290ba6`，实际 main/base `53604896f5a554231389455596489eb22d9fabb4`。上方 A–E 为对应时点历史，不能把“当时未迁移”误读为本轮结果。下表是当前实现的逐页技术映射；没有新 URL、第三篇文章或通用 builder。

```text
page.pageKey + page.templateContent: pageTemplateContent
  → existing siteBundleQuery (pageKey-controlled projection)
  → createSiteReader / convertCmsSiteBundle / convertCmsFixedTemplate
  → deliverPublishedFixedPages → same site-delivery snapshot → Astro.locals
  → manufacturing / our-factory / contact / blog/index / privacy
  → existing Information / Journal / Legal layouts and shared components
```

### 共用字段和来源

`page.title/intro/seo.seoTitle/seo.seoDescription` 都必填并进入页面 H1、简介和独立 SEO；根文档 identity、slug/pageKey、routeCount、contentUpdatedAt、事实日期规则延续 DEV-05D。`templateContent._type=pageTemplateContent` 且其 `pageKey` 必须与外层完全相符，未知业务字段失败。Studio 的 hidden 仅用于编辑体验，不能替代转换校验；切换 pageKey 后残留其他页字段会被拒绝。新 Studio 注册一个受控对象，不增加主要文档类型。旧 Home `homeTemplateContent` 仍通过 reader 转为同一 Home 契约；新 Home 对象使用 pageKey=home，未自动迁移云端文档或部署模型。

三个信息页的 `eyebrow/contextNote` 必填，前者进入页首眉题，后者进入事实/采购说明；正文为通用采购指南还是已确认工厂承诺必须由真实编辑资料区分，不由技术 published 判定。`sections` 中下列固定键的 eyebrow/title/description 必填，进入原 SectionHeading 与对应说明。行对象继续为有长度上限的 title/description，无任意 HTML/CSS/JS/iframe；站内链接为 label + strong page reference + 受控 fragment，错误引用/未知目标/重复链接失败，不接受任意 URL。

| 页面 / 原模块与渲染位置 | CMS 字段（templateContent 下，另注明根字段） | 必需/可选与校验 |
|---|---|---|
| Manufacturing 页首/目录 | eyebrow、contextNote、guideTitle；根 title/intro/seo | 全部必填；目录目的地由代码固定为六锚点，CMS 只编辑文案 |
| `#options` 定制方式 | sections.options、options | 标题/说明必填，2–6 行；不自动变成工厂承诺 |
| `#moq` MOQ 说明 | sections.moq、moqFactors；同一 siteSettings.defaultMoq | 2–12 因素行；实际 MOQ 只从统一规则派生，projectBased 无固定数量，品类 override 仍在各自 category 生效 |
| `#prepare` 资料准备 | sections.prepare、preparation、preparationLead、preparationNote | 3–12 行和两段说明必填；不新增表单，不要求必须具备 Tech Pack/注册品牌 |
| `#sampling` 打样 | sections.sampling、sampling | 2–6 行必填，不编造费用、交期、免费或轮次 |
| `#production` 流程 | sections.production、productionSteps | 3–6 行，原 process-grid；不生成订单状态 |
| `#faq` / 相关入口 | sections.faq、根 faqItems；sections.related、relatedLinks | FAQ 继续根规则至少3条；链接恰好 Factory 与 Contact 各一次；品类卡来自同批 category |
| Factory 页首 | eyebrow/contextNote；可选根 heroImage | 标题/事实说明必填；无图显示原非摄影待补状态，不使用 AI 车间或图库作证据 |
| 工厂介绍 | sections.overview、overview、overviewNote | 必填；缺介绍整个读取失败，不省略必需正文 |
| `#arrangements` 制造安排 | sections.arrangements、arrangements | 2–12 行必填，须说明实际厂内/外协范围，不默认全厂内 |
| `#quality` 质量说明 | sections.quality、qualityDiscussion | 2–6 行，保留不同卡片布局，不能自动认定为已获质量认证 |
| 可选图片/资质与相关入口 | gallery、credentials；sections.related、relatedLinks | gallery 缺省或空数组省略，最多4图且逐张原 approvedImage 校验；credentials 缺省/空数组省略、最多6说明行，不产生证书图片或 Logo。链接恰为 Manufacturing#prepare 与 Contact |
| Contact 页首/营业资料 | eyebrow/contextNote；同一 siteSettings | 身份、联系人、工作时段、时区、地址、email、whatsappDigits 不在 page 复制；未配置明确待补，已配置值仍被网站阶段门禁遮蔽，不生成可执行账号 |
| Contact `#your-brief` / 相关入口 | sections.prepare、preparation、preparationNote、relatedLinks；sections.related | 3–12 准备行及说明必填；强引用仅 Manufacturing#prepare；品类卡与 shell 同源，无表单/客户上传/发送复制状态 |
| Journal 栏目页首及说明 | eyebrow、columnNote；根 title/intro/seo | 必填；不包含 article 数组、分页、排序或作者字段 |
| Journal 两张文章卡片 | 原 loadArticlePage/loadArticleCollection | 标题/摘要/封面/顺序/状态/revision 继续来自既有 article-delivery；不是新的 CMS page 内容副本 |
| Privacy 页首/受控政策 | eyebrow、body；根 title/intro/seo | 必填；至少3个 H2 和实际段落，复用原 Portable Text → EditorialBlock → EditorialBody，支持原列表/表格/callout；拒绝任意 HTML/脚本/嵌入和 template 询盘模块 |
| Privacy 法律审核 | legalReviewStatus、legalReviewedAt | pending/reviewed 二选一；pending 不得带日期，reviewed 必须真实有效且不早于内容更新日，技术字段通过不等于工厂/法律责任人真实审核 |
| Privacy 生效与运营事实 | policyStatus、effectiveAt、legalEntity、privacyContact、providers、retention | 只允许 draft_not_in_effect；其余当前必须空，不生成日期/主体/邮箱/服务商/期限/承诺。正文中的实际事实仍需人工审核，转换器不声称可判定法律正确性 |

### 没有未迁移的选定业务正文

| 固定页 | 技术接线路径 | 在 published 模式下仍使用本地业务正文？ |
|---|---|---|
| Manufacturing | 受控页字段 + 同批 MOQ → Information 原模板 | 否 |
| Our Factory | 受控页字段 + 可选许可图片 → Factory 原分区 | 否 |
| Contact | 受控页字段 + 同一 siteSettings → Contact 原分区 | 否 |
| Journal | 栏目字段 → 原列表；文章另由既有 article-delivery | 否；文章不是列表页的待迁移正文 |
| Privacy | 受控政策及独立状态 → Legal / EditorialBody | 否 |

**有意保留的本地代码**：`shared/fixed-page-copy.ts` 只保存默认 mock 的原文案；`web/src/content/*-preview` 为 mock 原业务记录。published 固定页不从它们取缺省内容。导航动作/面包屑标签、错误及来源说明、联系门禁文案、FAQ 展开行为、字段/图片/资质通用标签、卡片编号/图标、法律未生效提示、锚点/来源码、模板 CSS/视觉变量由代码管理，不是另一套工厂事实。FactoryPhotographyPending 根据 unchanged manifest 展示明确无真实图状态。品类公共卡片和品牌/导航来自同一 bundle，不在五页维护副本。

### 最小来源配置与失败规则

`HOME_CATEGORY_CONTENT_MODE` 仍只负责 Home/两 Category。`FIXED_PAGE_CONTENT_MODE`（默认 mock）只负责上述五页，不加逐页/逐模块开关。合法组合只有 mock/mock、published/mock、published/published；mock/published 在网络前 `SITE_SOURCE_CONFLICT`。旧三页模式中五页正文明确本地；但 published bundle 完整性始终要求六页两品类全部有效。`CONTENT_MODE=sanity` 仍拒绝，`ARTICLE_CONTENT_MODE` 及文章引用兼容规则不变。

来源、技术 published、事实日期记录、图片许可、法律审核、政策生效和网站发布分别记录。FixedPageDelivery 不强转 concept；CMS 状态为 cms_published / recorded_not_verified / productionAllowed:false。同次 build 的受保护快照包含模式，变更模式失败；新 build ID 重新读，dev 每请求新读。缺必需字段、pageKey/type 错配、重复路由、坏引用、未许可图、危险正文/协议、401/403/timeout、非法 envelope 或转换错误：dev 安全503，build失败，不丢条目、不返回上次数据、不回退 mock。

实际离线验证通过真实 GROQ、HTTP envelope（含 ms/可选syncTags）、reader、converter、原路由/模板，双修订修改标题之外的正文；不是把测试 HTML 塞到页面。测试审批字段仅为 synthetic，真实请求为零，图片本机拦截。所有真实文档和发布授权仍待另行明确，当前不能由技术接线自动解除生产门禁。

## 官方依据 / 2026-09-16 核对

本仓库安装 Sanity / @sanity/schema **5.31.2**，锁图内 @sanity/client **7.27.0**，groq-js **1.30.3**。客户端仅是 Studio 的既有间接依赖，本轮 HTTP 读取不使用它。

- [Query HTTP API](https://www.sanity.io/docs/http-reference/query)：POST/参数、视图、空结果、returnQuery 与 resultSourceMap。
- [Perspectives](https://www.sanity.io/docs/content-lake/perspectives)：published 与 drafts / Content Releases 的区别；显式 API 日期和视图，不依赖版本默认。
- [API CDN](https://www.sanity.io/docs/content-lake/api-cdn)：静态构建采用非 CDN API，明确缓存边界。
- [Block type](https://www.sanity.io/docs/studio/block-type) 与 [Portable Text editor configuration](https://www.sanity.io/docs/studio/portable-text-editor-configuration)：显式 styles/lists/marks/annotations 和自定义对象。新版内置表格编辑器需要 Studio 6.6.0，本项目不升主版本，采用 v5 可用的受控对象。
- [GROQ-JS](https://github.com/sanity-io/groq-js)：对内存 dataset parse/evaluate，作为离线查询投影测试，不连接 Content Lake。
- [Image type](https://www.sanity.io/docs/studio/image-type) 与 [Image URLs](https://www.sanity.io/docs/apis-and-sdks/image-urls)：资产引用、URL 与字段上的 crop/hotspot；许可仍需由权利人确认。

官方文档为滚动更新资料；本轮采用的结构已在锁定 v5.31.2 schema 编译及现有 Astro 组件中实际测试，不把新版 API 示例当作已安装功能。
