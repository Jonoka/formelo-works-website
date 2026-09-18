# FORMELO WORKS · Factory Website

英文服装工厂 B2B 独立站：时尚编辑式视觉、SEO 内容、邮箱 / WhatsApp 直接联系。

> 当前为 **十个内容 URL、八类模板与工程 404 的本地概念结构**。PR #7 已由用户合并至 `main@accc4dcddaa3161a6fbae4c94ee9860d25739a49`。本轮 `feat/cms-editorial-integration` 做 DEV-05B：仅一篇已授权真实 Sanity Draft 的本地 Studio 保存 → revision → 服务器只读 → 既有正文组件本地呈现；不扩页面，不切换全站内容来源。全站 sanity 与 production 门禁保留，不自动合并或部署。

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

`web/` 为可运行的 Astro + TypeScript 静态工程；`studio/` 保留四类主要文档及受控正文对象。DEV-05B 已在本地连接真实 `iajvl7ka/production`，仅对授权询价 Draft 做保存/read/本地呈现；独立 published reader 仍保持严格，默认全站仍为 mock。字段、状态与失败策略见 [CMS 映射](docs/development/cms-editorial-mapping.md)，实际 revision/截图/检查证据见 [DEV-05A/05B 验证](docs/operations/cms-editorial-verification.md)。

在原六页基础上增加 `/blog/`、`/blog/what-to-send-for-a-clothing-quote/`、`/blog/moq-per-style-per-color/`、`/privacy/`；输出十内容 URL 加 404，共 11 个 HTML。三张服装概念图文件保持不变；两文暂复用已登记品类图，独立封面仍待完成。Privacy 为未生效草稿，没有营销联系区、移动联系条或假联系人。本轮见 [Journal / Privacy 验证](docs/operations/journal-privacy-verification.md)、[设计衔接](docs/design/journal-article-legal-handoff.md)、[路由说明](docs/development/routes-and-navigation.md) 与 [工厂资料清单](docs/content/factory-materials-checklist.md)。[PR #5 核心内页记录](docs/operations/core-information-verification.md)、[PR #4 记录](docs/operations/pr-4-category-review.md) 和更早日志保留为历史，不改成当前 head 的结果。

## 本地获取

先在本机完成 GitHub 身份认证，不把 token 发到聊天或写入仓库。

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
# 在新克隆中审阅本轮 DEV-05B 分支；先确认远端分支存在：
git fetch origin
git switch --track origin/feat/cms-editorial-integration
npm ci
npm run dev
# 打开终端打印的本机地址，默认 http://127.0.0.1:4321
# 端口被占用时可能自动使用下一端口；不要假定仍为 4321。
```

main 已包含 PR #7 的 DEV-05A 文章 CMS 基线；本轮 PR 合并前在 feat/cms-editorial-integration 审阅。已有工作区切换前先检查 git status（含未跟踪文件），目标分支存在时保留并继续；同步仅 fast-forward，分叉先报告，不 reset、clean 或 force push。运行时固定为 Node **24.21.0**、npm **11.19.1**（`.nvmrc` / `.node-version` / `packageManager`）；直接依赖用精确版本，只有根 `package-lock.json`。不要混用其他包管理器或编辑 lockfile。正常本地开发不需要环境文件、Sanity 凭证或任何真实联系资料。

使用版本管理器或 Node 官方发行包切换到上述精确版本后，先检查 `node --version` / `npm --version`。Node 24.21.0 官方包随附 npm 11.19.0；本项目改用含后续依赖修复的 npm 11.19.1，执行 `npm install --global npm@11.19.1` 后再运行 `npm ci`（便携版应指定自己的安装前缀）。不要通过关闭 `engine-strict` 绕过版本不符。`npm run check:runtime` 会核对实际运行版本、两个版本文件、engines、packageManager 与 lockfile 元数据，完整 `verify` 会先执行此检查。旧验证日志按对应运行时和提交保留；本轮没有升级运行时或包版本图，只将已锁定的 groq-js 1.30.3 显式声明为测试依赖，lockfile 由 npm 正常更新。

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

`verify` 包含 Astro / Studio / 测试代码类型检查、单元与离线 schema 编译、实际 GROQ 内存查询/严格转换、隔离原组件渲染、Draft-build 隔离、实际 production 构建阻断、HTML/内链/服务器信息泄漏检查，以及开发 / 静态服务器的 Chromium 回归。Draft-build 隔离会用假 token + 本地 fetch canary 实际调用根 build、workspace build、直接 `astro build` 及 `astro build --mode development`，要求在任何 Draft fetch / HTML 输出前明确拒绝；该测试不接触 Sanity 云端。普通站点输出仅在 `web/dist/`；测试专用 HTML 证据在隔离目录，不是普通页面，Studio 不自动参与构建。

`loadContent` 统一读取 Home / Category / 固定页、明确的 `article_preview` 和 `legal_preview`。正式 `articles` 仍为空，无假作者、公开发布日期或审核记录。受控正文仅支持当前所需节点；>=3 个 H2 自动生成去重目录；允许有效站内链接及 `config/editorial-sources.json` 精确审核的 HTTPS 文本来源链接，不放开第三方资源。`config/page-context.ts` 集中九个营销来源码，Article 仅页脚/移动联系组，Privacy / 404 为 null 且无营销区。SEO 品牌尾缀统一生成；十页逐页图片策略固定。Journal 导航为 `/blog/`、Privacy 页脚有效；原 `/#journal` 与 Manufacturing 六锚点保留。

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

正式 published 只读函数仍未接入 `loadContent`。DEV-05B 的真实 Draft reader 只对一个固定项目/数据集/文档 ID 开放；只有显式 `DEV_CMS_DRAFT_PREVIEW=1`、`DEPLOY_ENV=local` 且 Astro **实际命令为 `dev`** 时才替换询价文章。配置集成在 `astro:config:setup` 看到 `command=build` 时会立即报 `CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN`，早于路由、Draft fetch 和 HTML 输出；`--mode development` 不能绕过，路由还会再次核对实际命令。失败不回退 mock，普通构建的 CMS marker/secret 扫描只是第二道防线。不能用 Draft 保存或 Sanity 技术 publish 替代事实审核或网站上线，不能把离线夹具导入云端。

Sanity 必须由账号持有人提供真实授权的环境配置后才可启动，见 [Studio 说明](studio/README.md)。不要把 token 写入任何 `SANITY_STUDIO_` 前缀变量。完整架构见 [技术边界](docs/development/architecture.md)。

`scripts/publish-github.sh` 是旧启动包的新建仓库工具；**本仓库已经存在，不要再运行它建仓**。

## 协作与发布

每个任务使用短期分支，提交并推送后 PR 审阅再合并。切换设备前 push，另一端先 fetch；不要同时修改同一分支，不 force push，不用旧 ZIP 覆盖项目。
当前连接已验证 GitHub API 写入；新会话仍须读取当前分支、提交与权限。聊天输出、本地文件、远端提交、CI 和网站部署是不同状态，分别记录。

Git 保存代码、schema 与文档；Sanity 实际内容和图片另做备份。密钥只存安全环境。
仓库保持 private，不添加开源许可证，不启用 Pages，不部署网站。CI 以只读权限运行仓库检查和工程回归，不使用 secrets 或部署动作；它不代表完整 PRD、真实联络或生产验收通过。实际测试范围见 [验收说明](docs/quality/acceptance.md)。
