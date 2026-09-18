# 项目操作手册

## 当前状态

PR #8 已由用户合并至 `main@83dec3f23f264ac034d1b7775eff6ca2b71a8d27`（验收 head `5ef5ae3a7ca82c64ec238e7b329c78a0faebde5c`）。DEV-05C 使用 `feat/cms-editorial-delivery` / PR #9，把首页 Journal、Journal 列表和文章详情接到同一个受控文章交付入口；不向 main 直接写入、不强制推送、不自动合并或部署。
`web/` 默认仍是十页 mock 静态工程；文章局部可显式选择 mock、授权 Draft 预览或 strict published。全站 `CONTENT_MODE=sanity` 仍未实现，真实 Studio/CMS 没有 publish、媒体上传、schema/Studio/site deploy 或 Webhook。启动和检查命令见根 README。

## 本地获取与检查

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
git fetch origin
# 本轮 PR 尚未合并、且远端目标分支确实存在时：
git switch --track origin/feat/cms-editorial-delivery
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

## 后续发布与恢复

公开部署必须单独获准；内容与真实渠道确认、隐私配置、SEO 和质量验收通过后才能上线。
记录 code SHA、CMS 修订 / 备份和 deployment ID。代码回滚不等于 CMS 回滚；先修正错误内容，再恢复构建，防止再次发布错误版本。
联系方式从一处更新并做全站和真机收发回归。素材替换同步来源、审核、图注、裁切与状态，不只覆盖文件名。
