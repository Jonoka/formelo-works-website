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

## 仍开放 / 待授权

真实项目/数据集、最小只读 token、指定文档 ID 与必要引用/资产读取许可未提供；**真实 CMS 读取、权限、数据集可见性及 Studio 启动/构建均未验证**。禁止据此创建/导入/迁移/写稿/上传/发布/撤回或部署。具体最小输入和字段约束见 [CMS 映射](../development/cms-editorial-mapping.md) 与 [工厂资料清单](../content/factory-materials-checklist.md)。

两篇专用封面仍待完成，真实图片/工厂资料与署名、公开日期、事实审核、许可必须由责任方确认。真实 Safari/Firefox/Edge、真机、浏览器 UI 缩放、邮箱/WhatsApp 收发、生产 SEO、Privacy 上线政策、全站 CMS/重建/发布恢复和完整上线验收未关闭。已知中危依赖在真实 Studio 使用前应复核，不运行 audit fix --force。
