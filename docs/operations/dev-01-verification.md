# DEV-01 工程验证记录

日期：2026-09-12。工作分支：`feat/project-foundation`。
基线：实际 fetch 后的 `origin/main`，`41a9e910ef42cd80f4d5540928bf6b307b8b0d2a`（初始化 PR #1 已合并）。

## 验收边界

仅静态首页和 404；mock 没有工厂事实、MOQ、联系账号、品类样品或文章。无 Sanity 云端数据接入、部署、真实设备联系收发或完整十页验收。

测试覆盖类型、运行环境门禁、schema 编译、静态输出及内链、开发与预览服务的 Chromium 页面、六档屏宽、无 JavaScript FAQ / 键盘导航、404、robots 与禁用渠道。屏宽为 320、360、390、768、1024、1440px；这不等于 Safari / Firefox、全部可访问性或生产验收。

## 执行结果

### Linux CI：完整工程检查通过

在私有仓库功能分支上执行 `workflow_dispatch`，不是公开部署。已读取 [Actions 运行 34688447088](https://github.com/Jonoka/formelo-works-website/actions/runs/34688447088) 的完成状态和执行日志；验证代码提交为 `3e7f943db7605b7b0787dff64f9610e452822035`，`bootstrap` 与 `foundation` 两个 job 均为 success。

| 检查 | 实际结果 |
|---|---|
| Node / npm | v24.12.0 / 11.6.2 |
| `npm ci` | 成功安装提交的根 lockfile |
| `npm run check` | Astro：0 errors、0 warnings；Studio 和测试 TypeScript 检查退出 0 |
| `npm test` | 15 项通过，0 失败；包括实际生产构建阻断和全部九个 schema 类型离线编译 |
| `npm run build` | 首页、404 共 2 个 HTML；静态输出、内链和片段目标检查通过 |
| `npm run test:browser` | Chromium：18 项通过；开发与静态预览两个项目各 9 项 |
| `npm audit --audit-level=high` | 退出 0；0 高危 / 严重，仍有 4 个中危条目，见下文 |
| `python3 scripts/check_repository.py` | 通过，四份原始导入哈希保持不变 |
| `bash -n scripts/publish-github.sh` | 通过 |
| Python 离线安全回归 | 14 项通过 |

浏览器检查会在测试输出目录保存 390px / 1440px 截图，但没有把完整视觉稿逐像素验收、Safari / Firefox 或真实移动设备测试算作本轮完成。

### Windows WebCodex 项目：成功项与限制分别记录

实际完成 `npm ci`（1171 个安装包，审计 1174 个条目）、`npm run build`、静态输出检查、仓库文档 / 资产检查。对最终安装的 `adm-zip@0.6.1` 做了内存 ZIP 创建 / 读取往返，对 `js-yaml@3.15.2` 做了 `safeLoad` / `safeDump` 往返，均通过；这不是完整 Sanity CLI 的业务兼容性证明。

本机 `npm run check` 和包含 Sanity 导入的完整 `npm test` 曾因原生 / V8 内存分配失败中断。单次测试中前 10 项（包括真实 Astro 生产构建阻断）已通过，但该次整体仍记失败。`npm run test:browser` 在本机等待服务器就绪超时，没有据此宣称本机 18 项通过；完整通过证据来自上面的 Linux CI。

原有 Python 安全测试在 Windows 的 Bash / 默认文本编码环境中失败（14 项中 13 error、1 failure），Linux CI 的同一套 14 项全部通过；README 明确将该套检查放在 Linux / Bash 环境运行。本机一次独立 npm audit 请求因 TLS 连接中断失败，不能视作审计通过；锁定安装时和 Linux CI 的审计结果才是本轮依赖证据。

随后单独测试了无项目配置的 Studio CLI，原入口在本机启动阶段超时。为避免 CLI 在报缺失配置之前先加载或尝试初始化流程，启动包装器增加了配置前置检查，并补充对真实 `dev` / `build` 命令的负向测试。此后检查结果以最终 PR 的 CI 为准，不能把前一次 15 项记录冒充为新增测试已通过。

新增的 Studio 前置门禁已在本机执行 `node --import tsx --test --test-name-pattern="Studio dev" tests/foundation.test.ts`，1 项通过：真实 dev / build 子命令均以 `STUDIO_NOT_CONFIGURED` 提前失败。它未提供演示账号，也没有把预期失败当成 Studio 构建成功。

随后直接执行 `npm run dev`，按其实际打印地址探测首页，已获得 HTTP 200 和预期 mock 内容。本机 4321 被占用，Astro 自动选择 `127.0.0.1:4322`；此前只探测 4321 的就绪检查因此不能证明服务不可运行。没有终止不明端口持有者；本轮仅清理自己启动的进程树。固定双端口的完整 Windows Playwright 回归仍未通过，不用单页 HTTP 检查替代它。

## 依赖与环境原则

Node 24.12.0 / npm 11.6.2 与本机实际版本一致。直接依赖采用精确版本、根目录单一 lockfile，CI 使用 npm ci。依赖包安装、schema 离线编译、Sanity CLI 配置校验和真实账号联调是不同层次，不能混写为「CMS 已通过」。

最终直接版本：Astro 7.3.2、@astrojs/check 0.9.10、TypeScript 6.0.3、Sanity 与直接 @sanity/schema 5.31.2、React / React DOM 19.3.0、styled-components 6.5.3、Playwright 1.63.0、tsx 4.23.13。类型依赖也采用精确版本。CLI 的传递依赖可以包含其他 schema / TypeScript 版本，以 lockfile 为准，不宣称整棵树只有一版。

选择 TypeScript 6 而非注册表最新主版本，是为了满足 Astro 检查器声明的兼容范围。Sanity 6.13.2、5.14.1 和 5.31.2 均曾实际安装比较；最终保留通过完整检查的 5.31.2，没有使用 `npm audit fix --force`。

根 overrides 将 `adm-zip` 固定至 0.6.1、js-yaml 3 系列固定至 3.15.2，以处理实际审计发现的高危传递依赖。旧 lockfile 反复普通更新仍保留旧包，因此在忽略的本地临时目录中用相同 workspace manifests 重新解析 npm 图，再用根 `npm ci` 和 CI 验证。lockfile 来自 npm，不是手写或改写 integrity。

### 中危依赖风险尚未消除

npm 报告 4 个中危条目：`uuid@10.0.0` 及 `typeid-js`、`@sanity/cli`、`sanity` 的依赖传播。底层条目为 [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)。没有跨主版本强制替换其 UUID API，也没有把这些条目隐藏或标记为已修复。

当前 Astro 产物不含客户端 JavaScript 或 Sanity CLI，但这不代表整个开发依赖树没有风险。真实 Studio 接入、CLI 更新或生产准备前，应重新审计并验证上游兼容修复；本轮 CI 只阻断 high / critical，medium 的风险保留供 PR 审阅。

本机检查中出现 Windows 原生构建器内存分配失败；诊断时没有遗留的本项目 Node 进程，系统可用提交内存约 1 GiB。未终止其他应用或修改系统内存设置。失败记录保留，最终检查结果须明确区分本机与 Linux CI。

## 明确未执行

Sanity 项目创建、授权登录、CORS、云端 schema / 文档验证、内容发布 / 撤回 / 重建、Studio 公共托管、工厂事实审核、真实渠道收发、公共部署和 PR 合并均未执行。参考图不作为静态站资产，字体为系统回退栈。

---

## 2026-09-13 追加：PR #2 运行时安全基线修正

本节不替换上面的 2026-09-12 记录；旧 Node 24.12.0 / npm 11.6.2 的结果不能当作本次通过证据。依据 [PR #2 验收意见](https://github.com/Jonoka/formelo-works-website/pull/2#issuecomment-5645870626)，从原功能分支 head `ff799298ec7a58c439eaec4871c5ee26dea6c520` 继续，重新 fetch 后远端与本机一致，main 仍为 `41a9e910ef42cd80f4d5540928bf6b307b8b0d2a`。断线前的修改保留，没有新建替代分支或 PR。

### 精确版本与官方依据

采用 **Node 24.21.0 / npm 11.19.1**，保持 `engine-strict=true`。2026-09-13 再次读取 [Node 官方发行索引](https://nodejs.org/dist/index.json)：最新 24.x 为 24.21.0，LTS 代号 Krypton；该条 `security=false`，最近单独标记安全发布的版本为 24.18.1。选择的是包含其后累积更新的当前 LTS，不把普通 LTS 错称为独立安全公告。发行索引日期为 2026-09-07，[24.21.0 公告](https://nodejs.org/en/blog/release/v24.21.0)标题日期为 2026-09-08；两者日期口径分别保留。

[官方支持计划](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json)列明 24.x 于 2026-10-20 进入维护期、2028-04-30 结束支持；本次核对时仍处于 Active LTS。24.21.0 公告记录 OpenSSL 3.5.8、Undici 7.29.1 更新。版本选择不是零漏洞保证，后续仍需跟进官方安全发布。

官方 Node 包随附 npm 11.19.0；补充核对 [npm 11.19.1 官方发行说明](https://github.com/npm/cli/releases/tag/v11.19.1)后，将 npm 单独固定到补丁版 11.19.1，而不是照搬随附版本。说明列出 undici 6.28.0、ip-address 10.5.0、brace-expansion 5.0.9、tar 7.5.22 等依赖更新；本机安装后核对了这些随附版本。npm 11.19.1 声明 Node 范围 `^20.17.0 || >=22.9.0`，包含所选 Node。

Windows 使用 `.local/runtime-review-20260913/` 中的官方便携包，仅对子进程设置 PATH，不覆盖系统 Node/npm。下载 [官方 Windows x64 ZIP](https://nodejs.org/dist/v24.21.0/node-v24.21.0-win-x64.zip)，与同目录 `SHASUMS256.txt` 核对 SHA-256：`158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541`，一致后才解压执行。实际输出为 `v24.21.0`；随后使用该 Node 执行 `npm install --global --prefix <portable-directory> npm@11.19.1`，实际 npm 输出为 `11.19.1`。

### 单一锁文件与运行时校验

使用新 npm 正常执行 `npm install --package-lock-only`，没有手写 lockfile、删除锁文件重解依赖、修改完整性值或运行强制修复。与原提交逐记录比较：根 engines 更新；npm 规范化 33 个 peer 标记，并移除 `vite-tsconfig-paths` 下重复的 TypeScript 5.9.3 锁记录。所有保留包的版本、依赖约束、resolved 和 integrity 均未变化，没有新增包或应用依赖升级。最初要求全部非根记录完全相同的诊断断言因此失败，随后检查并明确记录上述实际差异，未把它隐藏为纯两行修改。

`.nvmrc`、`.node-version`、engines、packageManager、CI 与运行说明同步。新增 `npm run check:runtime` 核对真实 Node、npm user agent 和所有版本配置；它是 verify 的第一步，也在 CI 安装依赖前执行。实际新运行时校验通过；用系统旧 Node 24.12.0 执行该脚本则明确退出 1，错误指出必须切换版本，符合负向测试预期。

安装保留了 npm 对 esbuild 0.28.2 的 allowScripts 未覆盖提示及原有弃用告警，未用 `--ignore-scripts`、关闭 engine-strict、关闭 TLS 校验或忽略退出码使其通过。此提示不是本项目已完成安装脚本审计的声明。

### 新运行时 Windows 执行证据

干净 `npm ci --maxsockets=4 --fetch-retries=2 --fetch-timeout=30000` 已退出 0：安装 1164 个包、审计 1167 个条目；安装前后 lockfile SHA-256 不变。日志在忽略目录 `npm-ci.log` 与 `npm-ci-result.json`，不把本地忽略文件称为已提交的 CI artifacts。

本轮重新执行仓库检查退出 0；显式 Git Bash 的 `bash -n scripts/publish-github.sh` 退出 0。原有 Python 套件在 Windows 执行 14 项，整体退出 1（2 项失败）：夹具中的裸 `bash` 解析到不可用的 WSL，错误为 `execvpe(/bin/bash) failed`。其余负向用例的通过不能证明建仓脚本已经执行；Windows 套件不计通过，Linux CI 必须独立执行同一套测试。没有修改测试断言或系统 WSL 设置。

独立 `npm audit --audit-level=high --json` 及一次重试均因注册表 TLS 连接中断退出 1，没有取得可用审计结果，不能把安装时的审计摘要替代独立审计成功。四个中危 UUID / Sanity CLI 链条仍保留原说明，是否有新告警以实际 CI 审计为准。完整 verify 与对应提交的 Linux CI 结果在下面继续追加。
