# 项目操作手册

## 当前状态

PR #12 / DEV-05F 已由用户合并至 `main@15155608981d0c092de928e319e717dd7f7af731`。DEV-05G 在 `chore/cms-live-readiness` 做获准的限定真实只读盘点，当前已查到1个询价Draft、其余10个逻辑记录未查到；同一[工厂清单](../content/factory-materials-checklist.md)是逐页缺口来源。不向main直接提交，不自动Ready/合并/部署。
默认仍是十内容URL+404的mock站点；既有三页/五页/文章来源模式及全部校验保持。2026-09-20用户“批准”只增加指定settings/6pageKey/2category slug/2article slug及必要引用/媒体元数据的读权限，允许必要正文与现有loopback核对。真实写入/媒体上传/发布撤回/扩展草稿预览/渠道/政策生效/SEO/生产/部署均未获准。以下A–F说明保留历史含义，不能覆盖当前有限只读批准。

盘点先读受控元数据，不输出密钥/原始私密内容；使用本机既有服务器凭证不修改env，诊断结果与截图保存在ignored `.local/cms-live-readiness/`或`.local/cms-draft-review/`。正式reader不改为raw或宽松转换；不存在/仅草稿分别报告，不补mock。仅原询价Draft可临时以actual-dev/local/loopback运行，HOME_CATEGORY/FIXED仍mock，单篇卡片成功不等于全站CMS。具体查询范围、UTC时间、revision与证据口径见[验证](cms-editorial-verification.md)。文档变更只跑相应仓库/顺序检查，下面完整安装/verify命令用于需要它们的工程任务，不为只读盘点重复多套浏览器。

## 本地获取与检查

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
git fetch origin
# 本轮 PR 尚未合并、且远端目标分支确实存在时：
git switch --track origin/chore/cms-live-readiness
npm ci
npm exec -- playwright install chromium
npm run verify
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
bash -n scripts/publish-github.sh
```

本机完成 GitHub 身份认证，凭证不要进入 remote URL、聊天、文档或提交。每次编辑前检查 git status；遇到未提交内容先保存，不自动覆盖。

## 同步异常

核对 owner / repo、当前分支和远端 SHA。没有写入权限时停止，请用户授权该仓库，不扩大到全部仓库。
non-fast-forward 时先 fetch 并比较双方历史，报告分叉后等待用户决定；不 reset/clean/force push，不另建替代分支绕过已有工作，不自动合并。失败不得报告为成功，不删除远端仓库来重试。
GitHub API 写入时读取最新 base commit / tree，叠加本次变化，创建 commit 后仅更新任务分支；不要用空 tree 覆盖未知文件。

## 旧建仓脚本

`scripts/publish-github.sh` 只为最初离线启动包保留：创建不存在的私有仓库、校验后上传、拒绝同名库 / 错账号 / 已有 remote。当前仓库已存在，所以正常协作不使用此脚本。
其离线测试用 mock gh 和本地裸 Git 库，不会创建真实远端，也不能代表远端权限或 CI 成功。

## DEV-01 运行与验证

运行时、依赖取舍、实际命令结果及环境限制记录在 [DEV-01 验证记录](dev-01-verification.md)。Node 24.21.0 / npm 11.19.1；不使用其他包管理器，不手写 lockfile。升级依赖必须重新执行 npm ci、审计及完整工程回归，不能仅修改版本号。

先用版本管理器切换至 `.nvmrc` / `.node-version` 指定的精确版本，或使用经官方 SHA-256 校验的对应发行包。官方 Node 24.21.0 包随附 npm 11.19.0；先明确升级到 npm 11.19.1：`npm install --global npm@11.19.1`，便携版另加 `--prefix` 指向该便携目录，不覆盖系统 npm。`node --version`、`npm --version` 和 `npm run check:runtime` 必须一致。Windows 可使用项目外或 Git 忽略目录中的便携版，只调整当前终端 PATH，不覆盖系统安装；子进程的 Node/npm 也必须来自同一目录。保持 `engine-strict=true`。运行时更新只通过 npm 正常生成 lockfile 必要元数据，不删除或重解现有依赖图以掩盖问题。Node 二进制安全与 npm 包审计分别核查，旧记录不改写为新版本的通过证据。

本地开发仅监听 127.0.0.1。浏览器测试需 4321 / 4322 空闲；先停止自己启动的本项目服务器，不强行杀死不明进程。遇到内存分配失败应记录环境和失败日志，不把未执行的后续步骤算作通过；Linux CI 结果单独记录。

Sanity 授权后补充真实项目、数据集和只读构建权限，文档只写环境变量名，不写密钥值。未配置的 Studio 应明确失败，而不是填入演示账号以制造构建成功。

## DEV-05A 离线文章检查与只读联调门禁

常规 `npm ci` / `npm run verify` 不需要 Sanity 配置；新增测试与最终产物边界检查由现有命令执行。`groq-js@1.30.3` 是原锁图内版本的显式 devDependency，Query HTTP 模块使用 Node 原生 fetch，不新增生产客户端。锁图仍有已知中危链条，真实 Studio 使用前必须查看当前 audit，禁止用 audit fix --force 隐藏风险。

Windows 先用 `where.exe git` 定位实际 Git Bash，本机为 `D:\Git\bin\bash.exe`；可显式执行 Bash 语法检查，PYTHONUTF8=1 只对当前验证进程启用。本轮向子进程 PATH 加 Git Bash 仍未解决原生 Python 调用系统 WSL Bash 的两个旧 bootstrap 用例，因此只记录 18/20，不冒充全套通过。不为测试修改全局 PATH、安装 WSL、修改期望结果或终止未知服务。Linux CI 与 Windows 结果分别记录。

服务器只读入口与环境变量见 [CMS 映射](../development/cms-editorial-mapping.md)。没有授权时不调用网络默认 transport，不读取无关账号/配置文件、不猜 token。取得项目/数据集、最小 token、指定文档及必要引用/资产读取授权后，才单独执行一篇的 read，输出脱敏状态和修订；不改变 CONTENT_MODE，不启动 Studio，不写入/上传/发布/撤回。只读成功也不是网站上线成功。

当前平台与 head 证据见 [DEV-05A 验证](cms-editorial-verification.md) 及 PR 精确 head 评论；原 [PR #6 记录](journal-privacy-verification.md) 仅作历史。保留旧报告，本轮截图文件按实际生成目录列出，不借旧截图作当前证据。

## DEV-05B 单篇真实 Draft 操作

根 `.env.local` 仅服务器使用：`SANITY_PROJECT_ID`、`SANITY_DATASET`、`SANITY_READ_TOKEN`、`SANITY_ARTICLE_READ_IDS`、固定 `SANITY_API_VERSION=2025-02-19`；`studio/.env.local` 只放 `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`。两者都必须保持 Git 忽略，禁止打印 token 或放入 `SANITY_STUDIO_` 公开变量。

本地 Studio 用 `npm run studio:dev`，只监听 `127.0.0.1:3333`；本项目当前依赖图要求根 `vite@7.3.6` 供 Sanity CLI/plugin-react，Astro 7.3.2 自己保留嵌套 Vite 8.3.0，Rolldown 继续固定 1.2.8。不要删除这一拆分后再让 npm 自动提升到单一 Vite 8，也不要以升级 Sanity 主版本作为修复。

真实 Draft 预览不是 `CONTENT_MODE=sanity`。只有本地显式设置 `DEV_CMS_DRAFT_PREVIEW=1` 且实际执行 `astro dev` 时，既有 `/blog/what-to-send-for-a-clothing-quote/` 才由服务器读取授权 ID；失败直接报错，不 fallback mock。任何 `astro build`（根/workspace/直接入口，包含 `--mode development`）若带该开关，必须在配置阶段以 `CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN` 拒绝，早于 token/Draft 网络读取与 HTML 输出；路由还会再次要求实际 command 为 `dev`。普通 build 的 CMS boundary marker/secret 扫描只是第二道防线。当前真实 Draft 的只读审阅可运行 `npm run verify:cms-draft-live`，脚本先独立读取 revision，再验证 published 为空、loopback 页面 revision 一致，并在 `.local/cms-draft-review/<time>/` 生成 `cms-live-*` PNG 与只含哈希/长度/修订的脱敏 evidence；它不修改 Draft。

Studio 保存 Draft、Sanity publish、网站发布继续是三件事。当前测试 Draft 缺作者/发布日期/事实确认/封面许可是有意状态；不要为消除编辑器 validation 填假数据。除非用户另行明确授权，不得 Publish / Unpublish、上传媒体、deploy schema、`sanity deploy`、部署网站、配置 Cloudflare 或 webhook。

## DEV-05C 文章统一交付操作

文章来源由 `ARTICLE_CONTENT_MODE` 显式控制，默认值是 `mock`；它只影响两篇文章，不改变全站 `CONTENT_MODE=mock`。

- 默认开发 / 构建：不设置 `ARTICLE_CONTENT_MODE`，首页、Journal 和详情都使用两篇本地 editorial draft。
- 授权 Draft 预览：设置 `ARTICLE_CONTENT_MODE=draft-preview` 与 `DEV_CMS_DRAFT_PREVIEW=1`，并使用现有根 `.env.local` 的只读配置。只能运行 loopback `astro dev`；询价文章从现有授权 Draft 读取，MOQ 仍是明确标注的本地 draft。
- strict published 验证：`ARTICLE_CONTENT_MODE=published` 只接受 allowlist 中完整 published 文档。当前真实云端没有合规 published 两文，不能把 Draft 改成 published 视图来制造成功；离线夹具只用于专用测试目录。

Draft / published dev 都按页面请求重新读取并使用 `cache:no-store`；保存后刷新页面即可读取下一 revision，不需要重启 Astro，也不保留上次成功结果。静态 build 内只共享一次文章来源快照，以保证首页、列表、详情来自同一记录；来源配置在同一 build 中变化会直接失败。

真实 Draft 无封面时，三个位置都显示 text-only 无图状态，不复用本地概念图。只有 strict published converter 已验证公开许可、alt、资产身份/尺寸等字段后，CMS 封面才进入 approved 状态。不要补假作者、日期、审核或图片许可来通过正式校验。

Draft 预览的 build 隔离继续执行：根 build、workspace build、直接 Astro build、`--mode development` 都必须在网络访问和 HTML 输出前拒绝。离线浏览器回归为了与 Playwright 已启动的默认 dev server 共存，额外 Astro dev 使用 Astro 7 的 `--ignore-lock`，仍绑定随机 loopback 端口；这只是测试进程隔离，不是放宽 Draft 的 loopback/actual-command 门禁。

## DEV-05D 全站 published provider 基础

`web/src/lib/server/cms-site-query.ts` 是 server-only、published-only、no-store 的固定 bundle reader，只查询一个 siteSettings singleton、`pageKeys` 中六个固定 page 和 `t-shirts / hoodies` 两个 category。它没有任意文档 ID/slug 输入，不接受 drafts/release 视图，不执行 mutation，不自动重试；默认完整请求截止 8 秒、响应上限 2 MiB。token 仍只来自服务器环境，普通页面、浏览器 bundle 和默认 CI 不应包含它。

`shared/cms-site.ts` 对查询结果做严格转换：singleton/route 唯一性、完整集合、公开联系人格式、MOQ 模式/日期、业务页事实日期、Home hero、Home/Manufacturing FAQ、category referenceCode/categoryCode、至少三组样品及全站唯一 sampleCode、至少一项能力行和一张证据图、必填 customization/sampling notes、related article 引用、SEO title 唯一性都失败关闭。Blog Index / Privacy 的 `factConfirmedAt` 可为空；业务页必须填写。公开图片统一走 `shared/cms-image.ts`，与文章封面共享 asset ID、项目/dataset CDN URL、尺寸、alt、publicUseApproved、crop/hotspot 校验。

这一阶段**不启用** `CONTENT_MODE=sanity`。Manufacturing / Factory / Contact / Privacy 等现有模板仍依赖本地 presentation/template 数据，尚未建成完整 CMS templateContent 映射；把共同元数据 query 成功不能当成这些页面已迁移。普通 `loadContent('mock')`、十内容 URL + 404、production block、concept/noindex、空联系方式和 analytics off 必须保持。

所有 DEV-05D 自动测试使用 OFFLINE synthetic fixture 与 groq-js 内存 dataset；不得把这些假品牌、联系人、日期、MOQ、样品或许可写入 Sanity。既有单篇 `SANITY_READ_TOKEN` 授权也不能自动推定为 siteSettings/page/category 的真实读取许可；环境 helper 还要求显式 `SANITY_SITE_READ_ENABLED=1`。该开关当前保持未启用，真实全站读取须另行明确授权范围后再做。

## DEV-05F 五页来源与离线验证

合法 `HOME_CATEGORY_CONTENT_MODE` / `FIXED_PAGE_CONTENT_MODE` 组合只有 `mock/mock`（默认）、`published/mock`（旧三页模式）、`published/published`（三页及五页都读取同一 bundle）。`mock/published` 是 `SITE_SOURCE_CONFLICT`，在读取任何 token/网络前拒绝。`ARTICLE_CONTENT_MODE` 继续独立；CMS 品类有 relatedArticles 时必须匹配 strict published 文章，不因新开关建立另一套文章查询。

正常 mock 不请求全站 CMS，也不需要环境文件。只有测试 harness 可为本轮注入 `FORMELO_ENV_FILES=ignore`、假 project/dataset/token、fake SANITY_SITE_READ_ENABLED 和全拦截 transport；它们不改变本机配置。禁止把这些设置抄入 `.env.local`，也不得执行 `verify:cms-draft-live` 冒充五页验证。单次 build 使用受保护快照，新 build ID 和 dev 刷新重新读取；缺字段、坏引用、无许可媒体、危险正文、401/403/timeout/转换失败必须明确报错，无旧结果或 mock 回退。

先确认运行时及本项目端口/进程，再串行执行 `npm ci`、完整 `npm run verify`、`npm audit --audit-level=high`、仓库/Python/Bash检查。不要同时启动第二套 build/verify，也不结束不明进程。五页聚焦用例是 `tests/fixed-delivery.test.ts`、`tests/fixed-delivery-build.test.ts`、`tests/browser/fixed-delivery-offline.spec.ts`；隔离构建写入新建 `.local/site-delivery-offline-*`，review/fixed-delivery 保存专用合成证据，普通 web/dist 仍是 mock。

截图对照绑定实际 base/head，分 before/mock/offline 三组。CI 必要检查继续先于附件上传；上传失败照实报告，不使用 continue-on-error、删除历史证据或修改账单/保护。自动截图或 collector 通过不等于人工目视或文件已交付。Windows 原生 Python 的 WSL 两项历史限制与 Linux 全套独立记录。最小材料与分级授权见同一份 [工厂资料清单](../content/factory-materials-checklist.md)。

## 后续发布与恢复

公开部署必须单独获准；内容与真实渠道确认、隐私配置、SEO 和质量验收通过后才能上线。
记录 code SHA、CMS 修订 / 备份和 deployment ID。代码回滚不等于 CMS 回滚；先修正错误内容，再恢复构建，防止再次发布错误版本。
联系方式从一处更新并做全站和真机收发回归。素材替换同步来源、审核、图注、裁切与状态，不只覆盖文件名。
