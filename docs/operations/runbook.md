# 项目操作手册

## 当前状态

私有仓库 `Jonoka/formelo-works-website` 的 PR #7 已由用户合并；DEV-05B 基于 main `accc4dcddaa3161a6fbae4c94ee9860d25739a49`，在 `feat/cms-editorial-integration` 继续单篇真实 Sanity Draft 联调，不向 main 直接写入或强制推送。
`web/` 默认仍是十页 mock 静态工程；真实 CMS 只接入一个显式、本地、服务器端 Draft preview 路径，不成为全站 provider。真实 Studio 已本地连接账号，但没有 publish、媒体上传或任何部署。启动和检查命令见根 README。

## 本地获取与检查

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
git fetch origin
# 本轮 PR 尚未合并、且远端目标分支确实存在时：
git switch --track origin/feat/cms-editorial-integration
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

真实 Draft 预览不是 `CONTENT_MODE=sanity`。只在本地显式设置 `DEV_CMS_DRAFT_PREVIEW=1` 后，既有 `/blog/what-to-send-for-a-clothing-quote/` 才由服务器读取授权 ID；失败直接报错，不 fallback mock。验证可运行 `npm run verify:cms-draft-live -- "<exact expected excerpt>"`，输出只应包含文档 ID/revision/截图计数等脱敏证据。普通 `npm run build` 不设置该变量，并必须继续通过 CMS boundary / secret 扫描。

Studio 保存 Draft、Sanity publish、网站发布继续是三件事。当前测试 Draft 缺作者/发布日期/事实确认/封面许可是有意状态；不要为消除编辑器 validation 填假数据。除非用户另行明确授权，不得 Publish / Unpublish、上传媒体、deploy schema、`sanity deploy`、部署网站、配置 Cloudflare 或 webhook。

## 后续发布与恢复

公开部署必须单独获准；内容与真实渠道确认、隐私配置、SEO 和质量验收通过后才能上线。
记录 code SHA、CMS 修订 / 备份和 deployment ID。代码回滚不等于 CMS 回滚；先修正错误内容，再恢复构建，防止再次发布错误版本。
联系方式从一处更新并做全站和真机收发回归。素材替换同步来源、审核、图注、裁切与状态，不只覆盖文件名。
