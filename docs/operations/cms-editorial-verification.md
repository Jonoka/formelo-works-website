# DEV-05A · CMS 文章离线链路验证

日期：2026-09-16。范围仅为既有两文的 schema → 只读查询 → 严格转换 → 原正文渲染契约。真实 CMS 未获授权，未联调；所有测试稿/作者/日期/许可值均只在离线夹具中，未导入、发布或上传。

## 前置与工作区

实时读取 PR #6 状态/评论/验收和 Windows 分支、HEAD、含未跟踪文件的状态后开始。PR #6 已由 **Jonoka**（非机器人）于 `2026-09-16T09:35:51Z` 合并；head `cfc1675b2ef364c361b03d6839b864723c194091`，main/base 为 `11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0`。不是按旧 PR 正文推断合并。

已读取最后数量表修复与验收记录。原 PR #6 评审中独立的最终截图像素复核曾有工具限制；用户随后合并，本轮不把该限制改写成历史上已完成的验证。数量表 CSS、EditorialBody、两文正文与资产未重做。

Windows 项目 `D:\独立站\formelo-works-website`，初始工作树干净，旧分支 head 为上述 PR #6 head。确认目标分支本地/远端不存在且没有开放 PR 后，执行 fetch → main → `merge --ff-only origin/main` → 新建 `feat/cms-editorial-foundation`。保留原分支及本地被忽略的历史材料；没有 reset、clean、force push、替代分支、自动合并或部署。

## 已实际执行的开发阶段检查

固定 Node **24.21.0** / npm **11.19.1**；Windows 使用项目外发布物来源已核实的现有便携目录 `.local/runtime-review-20260913/node-v24.21.0-win-x64`，只调整当前子进程 PATH。engine-strict、版本文件、npm override 和单一 lockfile 保持。新增根 devDependency 为锁图中已经存在的 groq-js 1.30.3，npm 正常更新只有一行 lock 根元数据，没有包版本变化。

| 检查 | Windows 实际结果 / 原始本机记录 |
|---|---|
| 首次 `npm ci` | 通过；`.local/cms-editorial/2026-09-16T11-31-14-058Z-ci/`；此检查在 groq-js 显式声明前执行，最终 lock 需再次 ci |
| `npm run check` | 通过；Astro 61 文件 0 errors / warnings / hints，Studio 和共享 TS 通过；`.local/cms-editorial/2026-09-16T11-42-39-879Z-check/` |
| `npm test` | **130 / 130 通过**，含原有 73 与新增 57；`.local/cms-editorial/2026-09-16T11-43-54-934Z-test/` |
| 安装时审计提示 | 仍有 **4 个中危**；不是零漏洞，独立最终 audit 结果以当前 head 记录为准 |
| 仓库检查 | 通过；`.local/cms-editorial/2026-09-16T11-51-37-955Z-repository/` |
| Windows 原生 Python | 首次 17/20（GBK 解码 1 error、WSL Bash 2 failures）；仅进程设置 PYTHONUTF8=1 后 **18/20**，仍两项 WSL Bash 失败，未改测试来绕过；`.local/cms-editorial/2026-09-16T11-53-01-434Z-python/` |
| 显式 Git Bash 语法 | `where.exe git` 定位 D:\Git，使用 `D:\Git\bin\bash.exe -n scripts/publish-github.sh` 通过；`.local/cms-editorial/2026-09-16T11-53-30-796Z-bash/`。这不等于原生 Python 的 Bash 子进程已修复 |
| 首次独立 audit | **未通过网络访问**，npm advisory TLS 建连中断，并非查到高危；保留 `.local/cms-editorial/2026-09-16T11-53-41-589Z-audit/`。最终重试/CI 审计分别核对，不把失败当安全通过 |

上述三次记录各含 source.json、output.txt、outcome.json，文件哈希/分支/HEAD/状态被记录，检查期间 sourceUnchanged:true。它们来自未提交工作树的开发检查，不冒充最终提交或 Linux CI。最终 `npm ci` / `npm run verify` / audit / Python / Bash / 仓库检查、当前 head 与截图清单补充在本 PR 的精确 head 验证评论和 CI source.json；未实际执行的项目不得填“通过”。

Windows 原生 Python 的两个旧 bootstrap 用例仍由系统 Bash 入口触发缺少 WSL 发行版的错误；追加 Git Bash 到子进程 PATH 未解决该原生进程查找行为。不安装 WSL、不改全局 PATH、不修改旧用例的期望结果。Linux CI 全套结果独立观察和报告。

## 离线验证内容

新增测试对两篇现有全文做逐块/逐字符往返比较，覆盖 H2/H3、段落、两种一层列表、strong/em、内外链接、所有表格、纯文本模板、提示块和稳定目录。夹具逆向构造器只存在于 tests，不是云端 seed 或常规页面内容。

GROQ 在内存 dataset 真正 parse/evaluate，包括必要字段投影、引用解析、跨 ID 重复 slug、draft/release 排除和未知块保留后失败。不能把 groq-js 运行当成真实 Sanity 服务端权限验证。

隔离 Astro 根目录通过原 EditorialBody 实际输出两文及标记/转义样例，检查三张表、数量表原 colgroup/行标题/滚动提示、询价模板和 HTML 转义。输出仅在 `review/cms-render-offline/`，其中 summary.json 记录 HTML 哈希和假 token 泄漏检查，不是常规站点第三篇文章。

负例包含：缺配置/只读范围、401/403/其他错误、响应体和 fetch 超时、空/无效/超大响应、非法协议/fragment、缺/弱/草稿/版本/错误目标、错误来源码、重复 slug、无作者/日期/审核/素材许可、stale review、坏表格、未知块/标记以及不合规状态。错误只输出安全代码/固定字段路径，无完整私密数据或 cause；所有失败均不回退 mock。

## 最终回归与证据约定

沿用现有完整 browser 套件（dev + static preview），包括 Journal、两篇文章各 1440/390 的 full-page / viewport / table / long-text 截图和手机数量表专用回归。常规输出继续是十内容 URL + 404，空渠道、analytics off、noindex、未生效 Privacy、禁止生产构建、全站 sanity 未实现门禁均保留。

CI 检出实际 PR head，而不是混淆临时 merge SHA。`review/source.json` 记录 head/base/checkout/tree/run ID；私有 artifact `cms-editorial-foundation-review-<head>` 包含截图、结果、离线渲染证据、审计和本记录。Windows `.local/cms-editorial/<time>-verify/` 另保存当次快照及报告，旧截图/报告在本机保留，不覆盖成新证据。只有逐次实际检视的图才能称为人工复核。

截图文件名：`journal-1440.png` / `journal-390.png`、`quote-1440.png` / `quote-390.png`、`moq-1440.png` / `moq-390.png`；位于对应 `test-results/*-preview/` 目录，最终清单须由该次实际输出生成。还保留 MOQ 第二表、两列表及模板特写。不要使用 PR #6 的旧截图判断当前 head。

## DEV-05A 时仍开放 / 待授权（历史记录）

截至 DEV-05A 完成时，真实项目/数据集、最小只读 token、指定文档 ID 与必要读取许可尚未提供，因此当时的真实 CMS / Studio 均未验证。该段保留为历史基线；2026-09-17 的单篇授权与实际联调结果见下方 DEV-05B，不把后来授权反写成 DEV-05A 已完成。

两篇专用封面仍待完成，真实图片/工厂资料与署名、公开日期、事实审核、许可必须由责任方确认。真实 Safari/Firefox/Edge、真机、浏览器 UI 缩放、邮箱/WhatsApp 收发、生产 SEO、Privacy 上线政策、全站 CMS/重建/发布恢复和完整上线验收未关闭。已知中危依赖在真实 Studio 使用前应复核，不运行 audit fix --force。

## DEV-05B · 真实 Sanity 单篇 Draft 联调 / 2026-09-17

本轮从已合并 PR #7 的 main `accc4dcddaa3161a6fbae4c94ee9860d25739a49` 新建并继续 `feat/cms-editorial-integration`。恢复 WebCodex 后实际发现分支 HEAD 仍为该 SHA，但已有 4 个 modified + 4 个 untracked 的 DEV-05B 工作，因此全部保留并继续，没有 reset、clean、force push 或替代分支。远端当时没有该分支和关联 PR。

真实项目为 `iajvl7ka` / `production`，目标 Draft 基础 ID `1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae`。根 `.env.local` 与 `studio/.env.local` 均被 `.gitignore` 命中且未跟踪；只核对必要变量 present/non-empty，未输出 `SANITY_READ_TOKEN`。本地 Studio 仅监听 `127.0.0.1:3333`。首次启动暴露依赖解析冲突：Sanity CLI 6.7.2 的 Vite 7.3.6 与根部 Astro/Vite 8.3.0 混用导致 `Missing field moduleType`；通过在根 devDependencies 显式固定已存在的 `vite@7.3.6`，让 Astro 自己保留嵌套 `vite@8.3.0`，并用原有 `rolldown@1.2.8` override 防止无关补丁漂移后，Studio HTTP 由 500 恢复为 200。未升级 Sanity、Astro 或 Rolldown 版本。

Studio 登录由用户本人通过临时隔离浏览器选择 GitHub 完成；只验证本地认证状态存在，不输出 token 值，也不读取用户日常 Chrome 配置。真实 Draft 在 Studio 中可打开；正式字段缺失与 `factReviewStatus=pending` 保留。只修改 excerpt 技术标记：保存前 `_rev=RyoTMvUwfjfi4GD1LaCRuB`、`_updatedAt=2026-09-17T06:12:50Z`；Studio 编辑后服务器重新查询得到 `_rev=41ad5fd0-211a-4ea2-89e8-433c2906b8a7`、`_updatedAt=2026-09-17T08:43:58Z`，excerpt 变为 `DEV-05B integration draft — Studio save verification...`。没有填写 authorDisplay、publishedAt、contentUpdatedAt、factConfirmedAt、coverImage 或 publicUseApproved。

真实服务器预览脚本随后证明：drafts perspective 可读、published perspective 不可读、`productionAllowed:false`，本地询价文章页面显示新的真实 excerpt，并继续复用原 `EditorialBody`。证据位于忽略目录 `.local/cms-draft-live/`：1440 full-page 为 1440×4722 / SHA-256 `c91ffe30e44346abd80dabbbd728a2df6847979c84cbeb5aee7172a7fce790c9`；390 full-page 为 390×6980 / `856ed1ef5c68d9e2c28f72b4978494d88d11136fd07c530014aa2cb46ca9ad24`。另有 1440/390 viewport、table、template 共 8 张截图；manifest/evidence 记录浏览器 153.0.8010.12、Windows、Node 24.21.0 和测试时间 `2026-09-17T08:45:05.501Z`。生成截图不等同于正式视觉批准。

当前 Windows 最终工作树验证使用 Node **24.21.0** / npm **11.19.1**：干净 `npm ci` 通过并仍报告 4 个 moderate；`npm run verify` 完整通过，其中 `npm run check` 为 Astro 63 files / 0 errors / 0 warnings / 0 hints，`npm test` **148/148**，普通静态构建仍是 11 HTML 且 CMS boundary 通过，Chromium dev + preview 回归 **412/412** 通过（约 6.5 分钟）。`npm run studio:build` 也已在真实 Studio 配置下本地通过。`npm audit` 的已完成查询仍是 `uuid <11.1.1` 经 `typeid-js` / Sanity CLI 链带来的 **4 个 moderate**，修复建议需要 breaking `--force`，因此未执行；随后额外的 `--audit-level=high` 网络重试异常挂起后主动终止，不把它另算通过。`python scripts/check_repository.py` 通过；Windows Python bootstrap 套件再次复现 **18/20**，两项仅因系统 `C:\Windows\System32\bash.exe` 指向无 WSL 发行版而失败；显式 `D:\Git\bin\bash.exe -n scripts/publish-github.sh` 通过。`git diff --check` 通过。以上均来自当前未提交 DEV-05B 工作树；提交后的 GitHub CI 需单独观察，不能用本机结果代替。

未执行且仍未授权：Sanity publish / unpublish、媒体上传、远端 schema deploy、Studio deploy、网站/Cloudflare 部署、webhook、全站 `CONTENT_MODE=sanity`、正式 SEO/联系方式/Privacy、生产 release。DEV-05 全站 provider 与 DEV-07 发布恢复仍保持开放。

## PR #8 Review 收尾：build/dev 隔离与只读真实 Draft 证据 / 2026-09-17

本次验收从 PR #8 head `e2b80904b635f3804f3011430608ca10b6fdbcb3` 重新读取 Review、main、开放 PR 与 Windows 状态后继续；开始时本地/远端任务分支均为该 head，`main/origin/main=accc4dcddaa3161a6fbae4c94ee9860d25739a49`，工作树干净且没有未跟踪文件，因此无需同步。没有 reset、clean、force push、替代分支、自动合并或部署。

Review 指出的缺口先用**离线隔离复现**确认：给旧实现设置 `DEV_CMS_DRAFT_PREVIEW=1`、假 `SANITY_READ_TOKEN=OFFLINE_TEST_ONLY_TOKEN`，用 preload 替换 `fetch` 为本地计数后直接执行真实 `astro build`；结果为 `fetch_calls=1`、`html_files=0`，并因本地 canary 导致 `CMS_TRANSPORT`。这说明旧实现确实在 static build 中进入 Draft reader；该复现没有真实 Sanity 网络请求，输出只在被忽略的 `.local/dev05b-build-probe/`。

修复新增 actual-Astro-command 守卫：`astro:config:setup` 收到 `command=build` 且 Draft 开关开启时立即抛 `CMS_DRAFT_PREVIEW_BUILD_FORBIDDEN`；同时把实际 command 注入服务端路由，`[slug].astro` 在读取 token / Draft 前再次要求 `command=dev`。离线回归用假 token + fetch canary 实际覆盖根 `npm run build`、workspace build、直接 `astro build` 与 `astro build --mode development` 四个入口：全部得到明确 build-forbidden 错误，Draft/network 调用 **0 次**，正常 `web/dist` 未被改写。开关关闭后同一隔离目录直接 Astro mock build 通过，仍为 **11 HTML**、网络调用 0，HTML 不含 Draft/test marker，`check-cms-boundary.mjs` 通过。聚焦 Draft/build/render 套件为 **15/15**；这只是离线执行路径验证，不是 Sanity 云端验证。

真实 CMS 回归本轮保持**只读**，没有再次编辑 Studio/正文/审核字段。根与 Studio `.env.local` 均继续 Git-ignore 且未跟踪，只核对配置匹配/secret 非空，不输出值。服务器读取仍得到 revision `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`、Draft save time `2026-09-17T08:43:58Z`、`factReviewStatus=pending`；published perspective 仍为空。本地 loopback dev 页的 `data-cms-revision` 与服务器 revision 相同，标题/摘要/17 个正文块、1 张表、1 个纯文本模板正确；无 CMS cover、作者/发布日期/事实确认伪值，无 `mailto:` / `wa.me`，pending contact button 仍禁用。

本次真实 CMS 截图使用独立前缀 `cms-live-`，与 CI 默认 mock `quote-*` 等截图明确分开。首轮只读证据在 `.local/cms-draft-review/2026-09-17T10-21-34-671Z/`，manifest 不保存完整标题或摘要，只保存长度与 SHA-256。1440 full-page 为 **1440×4722** / `c91ffe30e44346abd80dabbbd728a2df6847979c84cbeb5aee7172a7fce790c9`，390 full-page 为 **390×6980** / `856ed1ef5c68d9e2c28f72b4978494d88d11136fd07c530014aa2cb46ca9ad24`；另有两端 viewport/table/template 共 8 张原始 PNG。实际目视 1440 页面/表格/模板与 390 首屏/表格/模板，未见明显横向溢出、内容重叠、伪封面或错误启用联系控件；派生审阅缩略图只供目视，不作为最终证据。由于该轮是在未提交修复工作树上运行，最终提交后会再生成 exact-head 的只读 manifest/PNG，并在 PR 评论记录，不把此 manifest 的旧 head 冒充最终提交。

普通 GitHub CI 继续**不含真实 Sanity secret，也不执行真实云端请求**。`review/source.json` 的 scope/cmsBoundary 明确把 CI 描述为 DEV-05B build 隔离、strict contract、默认 mock/browser 回归；本地授权单 Draft 的云端 read 与 `cms-live-*` 私有截图另行取证，不能用 CI mock 截图替代。

本次 Windows 收尾验证仍使用 Node **24.21.0** / npm **11.19.1**：干净 `npm ci` 通过并报告既有 **4 moderate**；完整 `npm run verify` 通过，当前 `npm test` 为 **150/150**，Playwright JSON 为 **412 expected / 0 unexpected / 0 skipped / 0 flaky**，普通 mock build 继续输出 11 HTML 且 CMS boundary 通过。`npm audit --audit-level=high` 完成并仍只报告 Sanity CLI / `typeid-js` / `uuid` 链的 4 moderate；没有 `audit fix --force`。`python scripts/check_repository.py` 通过；Windows 原生 bootstrap unittest 仍为 **18/20**，两项只因系统 WSL `bash.exe` 无发行版；显式 `D:\Git\bin\bash.exe -n scripts/publish-github.sh` 与 `git diff --check` 通过。以上 Windows 结果与后续 Linux GitHub CI 分开记录，不能互相代替。


## DEV-05C · 文章统一交付与编辑预览一致性 / 2026-09-18

PR #8 已由用户合并：验收 head `5ef5ae3a7ca82c64ec238e7b329c78a0faebde5c`，merge commit / 新 main 为 `83dec3f23f264ac034d1b7775eff6ca2b71a8d27`。开工时已通过 WebCodex 实际看到 Windows 工作区仍在旧 `feat/cms-editorial-integration@5ef5ae3` 且 tracked/untracked 都干净；fetch 后将本地 main 仅以 fast-forward 同步到 `83dec3f`，再新建 `feat/cms-editorial-delivery`。随后 WebCodex 工具面不可用，因此本节后续远端提交**没有再次同步或验证 Windows**；被忽略的 `.env.local`、`.local` 与历史证据未被读取、删除或上传，不能把远端 GitHub 结果写成 Windows 已完成。

本轮新增 `shared/article-delivery.ts` 与 `web/src/lib/server/article-delivery.ts`。首页 Journal、`/blog/` 和 `/blog/[slug]/` 现在从同一个文章集合/详情入口读取；`JournalCard` 的 title/excerpt/slug/reference/source/status/revision/coverState 都由同一个 `ArticleDelivery` 记录派生，详情继续走原 `ArticleLayout` / `EditorialBody`。默认 `ARTICLE_CONTENT_MODE=mock` 保留两篇本地 editorial draft 与原 10 URL + 404；`CONTENT_MODE=sanity`、production、analytics、真实联系、Privacy 和全站 CMS 门禁未解除。

授权 Draft 模式是**预声明混合来源**，不是失败回退：询价文章只读既有 `iajvl7ka/production` 基础 ID `1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae`，MOQ 文章继续是本地 editorial draft。真实 Draft 的已知 revision 仍是 `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`，published perspective 仍无对应文章，作者/公开日期/事实确认日期/封面/许可仍未填写；本轮没有再次修改云端摘要。真实 Draft 无 cover 时三处统一显示 text-only / no-cover 状态，不复用品类概念图冒充 CMS 封面。

刷新规则：Draft / published dev 每个请求执行新的 no-store read；同一 Astro dev 不需要重启即可在下一次刷新观察新 revision。成功结果不跨请求长期缓存，后续 auth/query/timeout/转换错误不能返回上次成功记录。单次静态 build 只共享一个来源快照，使 Home / Journal / detail 在同一 build 内一致；若 build 中文章来源配置改变，直接 `ARTICLE_BUILD_SOURCE_CHANGED`。未引入订阅、Visual Editing、客户端 token 或外部缓存平台。

strict published 模式复用已有 published-only GROQ 与严格 converter，并增加集合读取；要求两篇 allowlist 文章全部存在、唯一且通过原作者、发布时间/更新时间、事实确认、封面许可、资产身份和引用校验。空集合、只返回一篇、缺字段、坏引用、重复 slug、draft identity、未授权封面等都失败；不丢掉坏条目、不补本地文章、不改用 drafts perspective。离线 published build 只写专用测试输出，普通 `web/dist` 与默认站仍为 mock。

开发阶段 GitHub CI 在中间 head `69928ce6f06d6eb75e4dde294cdb31748cabe614` 已证明：类型检查通过、`npm test` **178/178** 通过、默认 build 11 HTML 与 CMS boundary 通过；普通 dev/preview Chromium 用例 **420** 项已通过。该次 CI 最后因新增离线 CMS browser fixture 与同一 `web` 项目的默认 Astro dev server 触发 Astro 7 dev-server lock 而失败：2 项启动失败、8 项未运行；不是文章业务断言失败。修复后测试专用离线 Astro dev 显式使用官方 `--ignore-lock`，仍绑定随机 loopback 端口；这只允许同项目测试服务器共存，不放宽真实 Draft 的 actual-command / loopback / build guard。

DEV-05C 浏览器套件现为 **430** 项目标，包含既有 412 项、默认 mock 三位置一致性/路径用例，以及隔离的 synthetic draft-preview / published 三位置、刷新、失败、无 JS/窄屏回归。证据门禁已同步要求 430 expected / 0 unexpected / 0 skipped / 0 flaky；默认 mock 的 22 张既有 focused screenshot 仍单独收集，synthetic CMS 证据写入 `review/cms-delivery/` 并明确标记 `OFFLINE SYNTHETIC RESPONSE; NOT REAL SANITY CONTENT`，不能当真实 Sanity 截图。

本节最终 exact-head 的 `npm ci`、完整 `npm run verify`、audit、Linux CI run、默认 mock 截图、offline fixture 截图，以及真实 CMS 只读三位置截图/最小脱敏证据，只在实际执行成功后追加。PR #8 已完成的两张真实 Draft 整页图目视补核是历史已验收项，本轮不重新列为缺失。Windows 当前是否同步到 PR #9 远端 head 仍需 WebCodex 恢复后重新核验；旧 150/412 或 Windows 18/20 仅作历史，不代表 DEV-05C 新 head。

WebCodex 恢复后，Windows 实际工作区在 `feat/cms-editorial-delivery@83dec3f23f264ac034d1b7775eff6ca2b71a8d27`、tracked/untracked 均干净；fetch 后确认远端任务分支为 `dddcd3295ea819a87151ca5aecd7eb97e5d3993e`，本地相对远端 0 ahead / 14 behind，因此仅执行 `merge --ff-only origin/feat/cms-editorial-delivery`。根 `.env.local` 与 `studio/.env.local` 仍由 `.gitignore` 命中；没有读取或输出 `SANITY_READ_TOKEN`，没有 reset、clean、force push、替代分支、Sanity mutation、publish/unpublish、媒体上传或部署。

为补 DEV-05C 的真实三位置证据，`scripts/capture-live-cms-draft.ts` 扩展为同一次 loopback Draft 会话实际检查 Home Journal、`/blog/`、询价文章详情三处：三处必须同为 `source=sanity`、`cms_draft_preview`、`perspective=drafts`、相同 revision、`coverState=missing`，并验证 no-store、noindex、无 mailto/WhatsApp/form/iframe、无横向溢出；Home/Journal 同时确认 MOQ 仍是本地 editorial draft。脚本只读既有授权 Draft，并新增 clean-worktree 与 Node **24.21.0** 门禁，避免把错误运行时的截图误记为最终证据。

最终真实只读证据在提交 `e2c5af6273d7fbb9058dd46fa4311ffd60d3c600` 上使用 Windows / Node **24.21.0** / Chromium **153.0.8010.12** 运行。目标文档仍是 `1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae`，revision 仍为 `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`，`factReviewStatus=pending`，17 个正文块、1 表格、1 template；drafts perspective 可读，published perspective 不可读，`productionAllowed=false`。证据位于忽略目录 `.local/cms-draft-review/2026-09-18T06-27-46-376Z/`，共 6 张 full-page：Home Journal 1440×4101 / `2aeea186adcc11670e9db6fd99d19755b18cbf4d7490a5ed40184c77a5485c6b`，Journal 1440×1830 / `0a6ab8b0ce79caca1a34d13022ef102be0ae964a023ae6b7abf971afc6456f9f`，quote 1440×4960 / `7c82c85874d293c7191ea472c0bdc4bfb6ea65cee9038450d30edb48c7d4f3d6`；Home Journal 390×7597 / `e9872d0686f8cc4c277b82a615ff49e774084da40d50c0e8034e787eb92b6fc2`，Journal 390×2530 / `7000af72da810fb339ee3b39df19e9424bc8ac18b0530a655065a75fde28a8b0`，quote 390×7217 / `d14d59f7529bd2c269dd6219c22165af4a8c8ca50cb3245b89e9eb8a02f6c54a`。两次较早的同内容截图因进程实际为 Node 24.12.0 而被明确废弃，不作为最终运行时证据。

当前 WebCodex artifact 出口能校验 PNG 二进制、尺寸与 SHA-256，但本会话宿主没有把导出的 Windows PNG 回挂为可供模型视觉读取的会话附件，因此助手没有把工具能力冒充成人工目视。用户随后于 **2026-09-18** 在 Windows 本地实际打开并逐张检查上述 6 张 full-page PNG，明确确认“6 张截图目视通过”。因此 DEV-05C 的真实 Draft 三位置 1440/390 人工目视项现已由用户完成；结构/内容/溢出/图片加载的浏览器断言与相同文件的尺寸、SHA-256 证据也均已通过。该确认只覆盖这 6 张本地真实 Draft 截图，不代表生产发布、真实设备或全站视觉验收。

Windows 收尾使用项目外既有便携 Node **24.21.0** / npm **11.19.1**，只为当前子进程把其目录置于 PATH 首位，不修改系统 PATH。最终完整 `npm run verify` exit 0，包含 68 个 Astro 文件 0 errors / warnings / hints、既有单元/schema/CMS/build 隔离、默认静态构建与 **430/430** Chromium（约 6.9 分钟）；随后 `npm ci` 在同一精确运行时完成，安装 1160 packages，并继续报告既有 4 moderate。独立 `npm audit --audit-level=high` exit 0，仍是 Sanity CLI → typeid-js → uuid `<11.1.1` 的 4 moderate，修复建议要求 breaking `--force`，未执行。`python scripts/check_repository.py` 通过；Windows Python 默认编码复现 17/20（额外 GBK decode error），`python -X utf8 -m unittest ...` 为 **18/20**，剩余两项仍只因系统 WSL `bash.exe` 没有发行版；显式 `D:\Git\bin\bash.exe -n scripts/publish-github.sh` 通过。最终远端 CI 仍需在推送后的 exact head 独立确认，不能用本机结果替代。

## DEV-05D · 全站 published provider 基础 / 2026-09-18

PR #9 已由用户合并至 `main@64e881acd04b4c7ae7269d111dd1d3ea51c22044`；Windows main 经 fetch 后只用 fast-forward 同步到该 merge commit，工作树干净、开放 PR 为零，再新建 `feat/cms-site-provider`。本轮不沿用已合并分支，不 reset/clean/force push，也不读取、修改或上传被忽略的环境文件。

开发阶段新增共享公开图片 converter、strict `CmsSiteBundle` 与 server-only fixed published query/reader；Studio 只收紧与服务器一致的缺项提示。普通 `loadContent` 仍 mock-only，`CONTENT_MODE=sanity` 仍显式失败；没有真实 siteSettings/page/category 读取，没有 Sanity mutation、publish/unpublish、媒体、schema/Studio/site deploy、Webhook 或 Cloudflare。

当前聚焦验证：文章 CMS + article delivery 回归 **78/78** 通过；首轮 site provider **23/23** 与根测试 **201/201** 通过。随后对照 PRD 补齐 category capabilityRows/evidenceImages、必填 customization/sampling notes，并把 fixed-page factConfirmedAt 改为业务页条件必填；再加入独立 `SANITY_SITE_READ_ENABLED=1` 环境授权门禁。最新 site provider + schema 聚焦 **35/35**、PRD 对齐后的 CMS 组合 **112/112** 通过；`npm run check` 为 Astro **71 files / 0 errors / 0 warnings / 0 hints**，Studio 与共享 TypeScript 通过。离线 GROQ 使用 synthetic in-memory dataset，实际 parse/evaluate 固定 bundle query，并验证 draft/release 防御、private canary 不被投影；网络测试只用注入 transport 与假 token。以上是未提交开发工作树的聚焦结果，不代替最终 exact-head `npm ci` / `npm run verify` / audit / GitHub CI；最终结果待本轮提交后追加。

Windows 提交前收尾固定使用项目外既有便携 Node **24.21.0** / npm **11.19.1**，只对子进程调整 PATH。`npm ci` 通过并安装 1160 packages；最终根 `npm test` **207/207** 通过；完整 `npm run verify` exit 0，包含运行时门禁、Astro/Studio/shared 类型检查、207 项单元/schema/CMS/build-isolation、普通 mock build/CMS boundary 和 Chromium **430/430**（约 7.4 分钟）。`npm run studio:build` 在本地 Studio 配置下通过，仅将 `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` 纳入 Studio bundle，没有服务器 token。`npm audit --audit-level=high` exit 0，仍报告 Sanity CLI → typeid-js → uuid `<11.1.1` 的 **4 moderate**，修复建议要求 breaking `--force`，未执行。`python scripts/check_repository.py` 通过；`python -X utf8 -m unittest ...` 为 **18/20**，剩余两项仍仅因 Windows 系统 WSL `bash.exe` 没有已安装发行版；显式 `D:\Git\bin\bash.exe -n scripts/publish-github.sh` 通过。以上仍是提交前同一工作树的本机结果；推送后的 GitHub CI 必须单独核对 actual PR head。

PR #10 首个 head `f22e913e32ebaeb3d8b10125136f379ee8f560d9` 的 GitHub `bootstrap` / `foundation` 已双绿。随后独立审阅发现一项非运行时缺陷：`scripts/check-cms-boundary.mjs` 仍只列旧 article/Draft provider 标识，尚未把 DEV-05D 的 `SANITY_SITE_READ_ENABLED`、`cms-site-query` 与 `cms_site_* / cms_category / cms_page` server-contract markers 纳入浏览器产物泄漏黑名单。当前 mock build 本身没有泄漏，但未来误接线时这道防线会漏报，因此在 PR 合并前补齐。对应 scanner 负例测试 **2/2** 通过，固定 Node 24.21.0 下普通 `npm run build` 仍生成 11 HTML，CMS boundary 扫描 19 个浏览器文本产物通过。该修复只加固泄漏检测，不启用全站 Sanity、不中断现有页面数据源。
