# FORMELO WORKS · Factory Website

英文服装工厂 B2B 独立站：时尚编辑式视觉、SEO 内容、邮箱 / WhatsApp 直接联系。

> 当前仍为 **十个内容 URL + 工程 404 的非生产网站**。PR #14 已由用户于2026-09-27合并，实际main为 `4d6680ad2912e853f116704aecf20a211da1f27b`。用户明确批准后，按既有[英文稿字段表](docs/content/cms-launch-drafts.en.md)实际创建 **10个未发布Draft**，并仅修改原询价Draft的excerpt；11条已逐项读回，限定范围无published或重复逻辑记录。[保存记录](docs/operations/cms-editorial-verification.md)与Git交付独立；`content/cms-draft-entry`仅更新记录，不改文案方案或应用。真实工厂事实、MOQ、图片、样品、署名/日期及未就绪引用仍未设，待办继续使用同一[工厂清单](docs/content/factory-materials-checklist.md)。默认mock、禁用联系、Privacy未生效和生产门禁不变，不代表全站Draft预览或上线。历史CI检查与artifact失败分别记录，不能称CI全绿。

![用户选定的首页方向：压缩查看版](assets/reference/homepage-selected-v1.webp)

## 开始阅读

[当前决定](docs/decisions/0001-approved-direction.md) → [完整 PRD](docs/product/prd-v1.0.md) → [视觉基线](docs/design/visual-baseline.md) → [开发待办](docs/development/backlog.md)。
AI 辅助开发先读 [AGENTS.md](AGENTS.md)；完整索引见 [docs/README.md](docs/README.md)。

## 首期范围

10 个内容 URL、8 类模板：Home、Manufacturing、两个 Category、Our Factory、Journal 列表、两篇文章、Contact、Privacy。
Journal 使用 `/blog/`；Process 使用 `/manufacturing/#production`，不新增页面。
**无表单、客户上传、CRM、购物车、支付、订单或聊天 API。**

FORMELO WORKS 为临时品牌，T-shirts / Hoodies 为演示品类。工厂负责事实确认与实际业务，网站团队负责建站及 SEO。
邮箱 / WhatsApp 配置为空且禁用，分析关闭。概念图不构成工厂或生产证明，不虚构 MOQ、产能、认证或交期。

## 已入库与待完成

已整理：三个完整原始 Markdown 文档、选定首页的 WebP 查看版、当前设计决定与变量、页面和资产清单、协作规则、检查脚本、离线测试及仓库检查 CI。
**查看图为 768×1152，来自用户选定的 1024×1536 PNG，经过缩小及有损压缩。** PNG 原图和两份 Word 导出仍在原会话的 `formelo-works-website-bootstrap.zip`，未重复上传到 Git；原始及查看版哈希见 [导入清单](docs/reference/import-manifest.json)。Markdown 是后续维护依据。

`web/` 为可运行的 Astro + TypeScript 静态工程；`studio/` 保留四类主要文档及受控正文对象。DEV-05C 只统一两篇文章的交付：默认两篇本地 editorial draft；授权 Draft 模式下仅询价文章来自现有 `iajvl7ka/production` 草稿、MOQ 仍明确来自本地；strict published 模式复用原 published-only 查询和严格转换，缺文档/坏引用/缺作者日期审核封面等直接失败。真实 Draft 当前仍无 CMS 封面，因此三处统一显示无图状态，不冒用本地概念图。字段、状态、刷新与失败策略见 [CMS 映射](docs/development/cms-editorial-mapping.md)，真实 revision 与各阶段检查见 [CMS 验证](docs/operations/cms-editorial-verification.md)。
DEV-05D 新增的全站 provider 仍是**离线工程基础**：固定查询只接受 1 个 siteSettings、6 个规划 pageKey、2 个规划 category slug，严格检查 published 身份、日期、MOQ、样品、能力行、证据图、引用、联系方式与公开图片许可；共享图片转换同时供文章封面使用。DEV-05E 通过服务器交付层和 middleware 复用该 reader；默认 mock build/preview 不调用它。显式三页 published 读取仍要求单独的 `SANITY_SITE_READ_ENABLED=1`，当前单篇 Draft 授权不会自动扩大为读取真实全站内容的授权。

在原六页基础上增加 `/blog/`、`/blog/what-to-send-for-a-clothing-quote/`、`/blog/moq-per-style-per-color/`、`/privacy/`；输出十内容 URL 加 404，共 11 个 HTML。三张服装概念图文件保持不变；两文暂复用已登记品类图，独立封面仍待完成。Privacy 为未生效草稿，没有营销联系区、移动联系条或假联系人。本轮见 [Journal / Privacy 验证](docs/operations/journal-privacy-verification.md)、[设计衔接](docs/design/journal-article-legal-handoff.md)、[路由说明](docs/development/routes-and-navigation.md) 与 [工厂资料清单](docs/content/factory-materials-checklist.md)。[PR #5 核心内页记录](docs/operations/core-information-verification.md)、[PR #4 记录](docs/operations/pr-4-category-review.md) 和更早日志保留为历史，不改成当前 head 的结果。

## 本地获取

先在本机完成 GitHub 身份认证，不把 token 发到聊天或写入仓库。

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
# 在新克隆中审阅 DEV-05H 内容分支；先确认远端分支存在：
git fetch origin
git switch --track origin/content/cms-launch-drafts
npm ci
npm run dev
# 打开终端打印的本机地址，默认 http://127.0.0.1:4321
# 端口被占用时可能自动使用下一端口；不要假定仍为 4321。
```

main 已包含 PR #13 的限定读取记录及此前全部模板接线、Query envelope 修复和 CI 顺序保护；本轮仅在 `content/cms-launch-drafts` 交付英文待审稿与对应文档，不复用已合并分支。已有工作区切换前先检查 git status（含未跟踪文件），目标分支存在时保留并继续；同步仅 fast-forward，分叉先报告，不 reset、clean 或 force push。运行时固定为 Node **24.21.0**、npm **11.19.1**（`.nvmrc` / `.node-version` / `packageManager`）；直接依赖用精确版本，只有根 `package-lock.json`。不要混用其他包管理器或编辑 lockfile。正常本地开发不需要环境文件、Sanity 凭证或任何真实联系资料。

使用版本管理器或 Node 官方发行包切换到上述精确版本后，先检查 `node --version` / `npm --version`。Node 24.21.0 官方包随附 npm 11.19.0；本项目改用含后续依赖修复的 npm 11.19.1，执行 `npm install --global npm@11.19.1` 后再运行 `npm ci`（便携版应指定自己的安装前缀）。不要通过关闭 `engine-strict` 绕过版本不符。`npm run check:runtime` 会核对实际运行版本、两个版本文件、engines、packageManager 与 lockfile 元数据，完整 `verify` 会先执行此检查。旧验证日志按对应运行时和提交保留；groq-js 1.30.3 在此前阶段已显式声明。DEV-05E 没有升级运行时、依赖或修改 lockfile。

## 检查与静态预览

先停止占用 4321 / 4322 端口的本项目开发服务器；测试不会借用现有服务。

```bash
npm exec -- playwright install chromium
npm run verify
npm audit --audit-level=high
# 单独检查：npm run check / npm test / npm run build / npm run test:browser
# 查看已构建静态产物：
npm run preview
```

`verify` 包含 Astro / Studio / 測試代码类型检查、单元与离线 schema 编译、实际 GROQ 内存查询/严格转换、隔离原组件渲染、Draft-build 隔离、实际 production 构建阻断、HTML/内链/服务器信息泄漏检查，以及开发 / 静态服务器的 Chromium 回归。Draft-build 隔离会用假 token + 本地 fetch canary 实际调用根 build、workspace build、直接 `astro build` 及 `astro build --mode development`，要求在任何 Draft fetch / HTML 输出前明确拒绝；该测试不接触 Sanity 云端。普通站点输出仅在 `web/dist/`；测试专用 HTML 证据在隔离目录，不是普通页面，Studio 不自动参与构建。

`loadContent` 保留本地内容契约；新增服务器 `site-delivery` / middleware 将所选来源传给既有 Home / Category，并为十页布局提供同一品牌、品类导航和网站阶段联系门禁。默认 `HOME_CATEGORY_CONTENT_MODE=mock` 不调用 site reader；显式 `published` 仍只切换这三个正文；五个固定正文由新增 `FIXED_PAGE_CONTENT_MODE` 成组选源，默认 mock，不会悄悄跟随三页切换。文章继续用 PR #9 的 `loadArticleCollection` / `loadArticlePage`，不重复查询；全站 `CONTENT_MODE=sanity` 仍拒绝。受控正文仅支持当前所需节点；>=3 个 H2 自动生成去重目录；允许有效站内链接及 `config/editorial-sources.json` 精确审核的 HTTPS 文本来源链接，不放开第三方资源。`config/page-context.ts` 集中九个营销来源码，Article 仅页脚/移动联系组，Privacy / 404 为 null 且无营销区。SEO 品牌尾缀统一生成；十页逐页图片策略固定。Journal 导航为 `/blog/`、Privacy 页脚有效；原 `/#journal` 与 Manufacturing 六锚点保留。

Windows 可使用现有 `.local/runtime-review-20260913/node-v24.21.0-win-x64` 便携运行时，并把该目录置于当前命令 PATH 前部；它不改变全局 Node。生成的 tokens.css 固定 LF，避免 Windows 换行转换造成字节一致性检查误报。真实浏览器 UI 缩放、真机和真实收发仍需另行授权验证。

检查结果按运行时版本和平台分别记录；旧运行时的绿色 CI 不代表新版本已通过。本轮平台差异、Node 24.21.0 / npm 11.19.1 的 Linux CI 对应 SHA / run ID 和剩余限制，见 [本轮验证记录](docs/operations/cms-editorial-verification.md) 与 PR 当前 head 的检查和审阅记录。PR #5 历史审计包含 Sanity CLI / UUID 链上的 **4 个中危依赖条目**；本轮实际审计另行记录，不宣称零漏洞；Node 二进制与 npm 依赖图的安全核查是两件事。

原文档和建仓安全测试仍保留；Python 3.9+、Git、Bash 为其前提，Linux CI 执行全套：

```bash
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
bash -n scripts/publish-github.sh
```

## 模式与安全边界

默认 `DEPLOY_ENV=local`、`CONTENT_MODE=mock`、`CONCEPT_MODE=true`、`ANALYTICS_MODE=off`。根 `.env.local` / `.env` 可选，已有进程环境变量优先。`DEPLOY_ENV=production`、`CONTENT_MODE=sanity`、关闭 concept 或开启 analytics 都会报错，而不是回退或输出假的生产内容。

所有 HTML 为 noindex，robots 禁抓；不生成假域名 canonical / sitemap。**这些措施不是公网访问控制：本轮没有任何部署，禁止上传 dist 到公共托管。**

文章来源由 `ARTICLE_CONTENT_MODE` 单独显式选择：默认 `mock`；`draft-preview` 只允许既有授权询价 Draft + 明确本地 MOQ；`published` 只接受 strict published 两文。Draft 模式仍要求 `DEV_CMS_DRAFT_PREVIEW=1`、`DEPLOY_ENV=local`、Astro **实际命令为 `dev`** 及 loopback，请求/查询/转换失败不回退 mock，也不保留上次成功结果。Draft/published dev 每次刷新重新 no-store 读取；单次静态 build 只共享一个来源快照。所有 `astro build` 草稿入口仍在网络和 HTML 输出前报 `CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN`，`--mode development` 不能绕过。不能用 Draft 保存或 Sanity 技术 publish 替代事实审核或网站上线，不能把离线夹具导入云端。

Sanity 必须由账号持有人提供真实授权的环境配置后才可启动，见 [Studio 说明](studio/README.md)。不要把 token 写入任何 `SANITY_STUDIO_` 前缀变量。完整架构见 [技术边界](docs/development/architecture.md)。

`scripts/publish-github.sh` 是旧启动包的新建仓库工具；**本仓库已经存在，不要再运行它建仓**。

## DEV-05G 真实内容就绪核对

2026-09-20 本会话“批准”明确允许 `iajvl7ka/production` 本站 settings、六 pageKey、两个 category slug、两篇既定 article slug 及必要引用/公开媒体元数据的只读盘点和既有本地路径核对。首轮先投影存在状态与元数据，之后只读取已找到询价稿的必要引用和既有 Draft 正文；不以已连接账号推定其他动作授权。

实际查到 1 个询价 Draft、0 个匹配的 published 记录；其余十个逻辑记录均未在限定凭证/选择器范围查到。询价稿仍 pending、无封面/署名/正式日期，可走原单篇 dev 预览而不能进入 published。其余九个内容 URL 的完整真实 CMS 呈现未完成；Home/Journal 如展示该稿，仅是一个真实 Draft 卡片，栏目/其余内容仍 mock。单篇现有预览不是新增全站成功。

本次不修改应用/schema/query/converter/测试、lockfile、真实 env 或默认 mock，不填假材料。资料齐备后另行授权创建缺失记录、编辑既有询价稿；媒体、技术发布/撤回、渠道与部署仍逐项授权。下方 DEV-05A–F 是工程基线或历史边界，不覆盖本节新增的有限只读批准；所有写入与生产门禁继续有效。

## DEV-05F 五页实际接线

五页共用 `page.templateContent` 的受控 `pageKey` 类型、既有 site query/reader 和一次构建快照，分别进入 Information、Journal、Legal 原模板，不是通用页面构建器。Manufacturing 的流程、FAQ、准备说明等都来自被校验的 CMS 字段；MOQ 来自同批 `siteSettings.defaultMoq`。Factory 缺图保留明确待补状态，可选图片/资质不造假。Contact 文案及准备事项可编辑，但账号启用仍由独立网站阶段门禁拒绝。Journal 只迁移栏目标题/简介/说明/SEO，不复制文章查询。Privacy 的受控正文和法律审核记录不自动使政策生效。

| HOME_CATEGORY_CONTENT_MODE | FIXED_PAGE_CONTENT_MODE | 结果 |
|---|---|---|
| mock（默认） | mock（默认） | 全部页面本地来源，零 site transport |
| published | mock | 保持 DEV-05E 旧三页切换语义；五个固定页正文明确本地 |
| published | published | 八个页面正文使用同一受校验 CMS bundle；文章仍独立选源 |
| mock | published | `SITE_SOURCE_CONFLICT`，网络前拒绝 |

`CONTENT_MODE=sanity` 仍拒绝。文章模式及 relatedArticles 兼容条件沿用原实现；不使用本地文章修补失败引用。六个 page 和两个 category 必须完整通过转换，即使只选择旧三页模式也不能省略另外五页受控内容。旧 `homeTemplateContent` 保持 reader 兼容，新 Studio 使用 pageKey 明确的 `pageTemplateContent`；没有自动修改真实文档或部署 schema。

当前**不要修改真实环境文件或启用真实全站读取**。测试进程注入假配置与真实形态 `{ms, syncTags?, result}`，使用正式 GROQ、reader、converter、模板；图片请求本机拦截。五页双修订构建与浏览器证据在 `review/fixed-delivery/`，精简前后对照由 CI 收集到 `review/fixed-integration/`，不是普通 `web/dist` 或真实工厂网站。结果以实际日志与 PR exact-head 检查为准，不能把代码存在、截图生成、人工批准和远端留存混为一项通过。

逐字段映射、代码保留常量与资料/授权缺口见 [CMS 映射](docs/development/cms-editorial-mapping.md)、[操作手册](docs/operations/runbook.md)、[验证记录](docs/operations/cms-editorial-verification.md) 和同一份 [工厂资料清单](docs/content/factory-materials-checklist.md)。旧 DEV-05A–E 日志仅为历史，不改成新 head 成绩。

## DEV-05E 三页接线与隔离检查（沿用的基线）

`HOME_CATEGORY_CONTENT_MODE` 与 `ARTICLE_CONTENT_MODE` 分别声明页面/文章来源。CMS 品类 `relatedArticles` 非空时必须能在 strict published 文章集合中解析；与本地/草稿来源不兼容就明确失败，不能补假卡片。首页卡片名称、摘要（已有 `intro`）、主图和路径来自同一 Category，按 `featuredCategories` 顺序排列。CMS 样品保留全部图片、编号与有值规格；MOQ 使用转换后的 `effectiveMoq`，不把 project-based 条件变成固定起订量。

**当前不要在真实环境文件设置三页 published 或 `SANITY_SITE_READ_ENABLED`。** 本轮只由 tests 中的隔离 harness 注入假配置与真实形态 `{ms, syncTags?, result}`，在内存执行正式 GROQ，经真实 reader/converter/路由/模板构建。`FORMELO_ENV_FILES=ignore` 同时禁用项目 dotenv 和 Vite envDir；合成图像是本机拦截的 TEST 检查图，非概念服装图、非真实授权照片。专用输出在 `.local/site-delivery-offline-*` / `review/site-delivery`，普通 `web/dist` 不受污染，普通 scanner 会拒绝合成输出。

一次实际 build 共享一个站点快照；新 build ID 重新读取，dev 每次请求重新读取。公开配置中的邮箱/号码及启用位保留原值，但独立 `contactReleasePolicy` 禁止本阶段生成联系链接或复制/发送反馈；Contact 只说明配置受网站阶段门禁限制，不输出测试账号。

完整 `npm run verify` 包含新增 unit、实际双修订构建、失败路径和三页响应式浏览器检查。当前运行结果与截图必须读取 [本轮验证记录](docs/operations/cms-editorial-verification.md) 和 exact-head CI；测试代码存在不等于执行通过。聚焦私有截图包区分 actual PR base / current mock / offline CMS，不能把离线画面写成真实 Sanity 全站联调。

## 协作与发布

每个任务使用短期分支，提交并推送后 PR 审阅再合并。切换设备前 push，另一端先 fetch；不要同时修改同一分支，不 force push，不用旧 ZIP 覆盖项目。
当前连接已验证 GitHub API 写入；新会话仍须读取当前分支、提交与权限。聊天输出、本地文件、远端提交、CI 和网站部署是不同状态，分别记录。

Git 保存代码、schema 与文档；Sanity 实际内容和图片另做备份。密钥只存安全环境。
仓库保持 private，不添加开源许可证，不启用 Pages，不部署网站。CI 以只读权限运行仓库检查和工程回归，不使用 secrets 或部署动作；它不代表完整 PRD、真实联络或生产验收通过。实际测试范围见 [验收说明](docs/quality/acceptance.md)。
