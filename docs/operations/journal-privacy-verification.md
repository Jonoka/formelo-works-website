# Journal / Privacy 增量验证记录

## 状态与范围

四个内容路由已补齐：/blog/、/blog/what-to-send-for-a-clothing-quote/、/blog/moq-per-style-per-color/、/privacy/。十内容 URL、八模板加工程 404 的概念结构；不是生产上线、正式 SEO、CMS 或全站验收。两篇完整英文草稿、受控 Article、Journal 卡片与 Legal 已实现；独立封面仍待补，当前明确复用登记概念图。PR 保留 Draft 待完整核验与人工审阅，不自动合并/部署。

## 实际 Git / Windows 前置

PR #5 实际 state=MERGED、mergedAt=2026-09-15T09:43:22Z，head=3600f9558465f247dceaa8234971dd9ca0c8a204，merge/base main=4469a1735465435508a3e510fcb6602e848a5264。读了最新评论/验收意见和开放 PR（开工时无其他开放 PR）。未用旧 Draft 正文判定状态。

真实 WebCodex Windows 项目 D:\独立站\formelo-works-website 在开工时干净；从当前 main 建立 feat/journal-privacy-pages，保留所有本轮修改和未跟踪文件。没有复用已合并 core-information/category/homepage 分支，没有 reset --hard、clean、force push 或自动合并。后续 Windows / 远端 head 和状态以本轮最终执行记录为准，不把 GitHub 推送当作 Windows 同步。

## 首篇和基线实际查看

实际查看已选参考与 PR #5 1440/390 六页基线。第一篇 Article 构建成功后，scripts/capture-article-checkpoint.mjs 捕获 1440/390 全页、首屏、表格和手动模板；通过独立 Playwright 测试窗口实际查看其截图，然后才写第二篇。该检查点输出 8 HTML（当时六页+第一文+404），仅是阶段证据，不是最终 11 HTML 结果。source.json 记录未提交状态及逐文件 SHA-256；后续不用新源码覆盖这个阶段记录。

## 当前执行结果

早期集成发现并修正 PrivacyPreview 类型导入遗漏及一个测试断言签名；早期失败日志保留，不能计作通过。2026-09-16 恢复后继续既有分支，重新确认 PR #5 已合并、main 未前移、无同名远端分支或开放 PR，并保留原未提交实现及未跟踪文件。

完整 Windows 复验保存于 `.local/journal-privacy-review/continued-20260916-101703/`，运行时间为 2026-09-16T02:47:35Z 至 02:54:47Z。沿用现有便携 Node 24.21.0 / npm 11.19.1，仅调整当前进程 PATH，未使用系统旧 Node 24.12.0，也未改全局环境、依赖或 lockfile。npm ci、npm run verify、npm audit --audit-level=high、仓库检查及显式 Git Bash 语法检查均返回 0。

本次 verify：Astro 55 files、类型检查无错误；73 项单元测试通过，11 HTML 静态/内链检查通过，368 项 Chromium dev/preview 测试通过（0 failed / skipped / flaky）。浏览器 JSON 的 startTime 为 2026-09-16T02:50:37.920Z。审计为 4 moderate / 0 high / 0 critical，仍是 Sanity CLI / typeid-js / UUID 依赖链风险；没有 force fix 或零漏洞声明。

Windows Python 3.14.2 另行重跑了全部 20 项，返回 1：`test_public_visibility_blocks_push` 与 `test_success_uses_private_and_verifies_real_local_push` 因 Bash 子进程命中缺少 /bin/bash 的系统 WSL 启动器失败。其余负例中的表面 ok 不能都解读为目标安全逻辑执行成功。原测试保留、不跳过、不改机器配置；完整 bootstrap 逻辑须以本 PR 当前 head 的 Linux CI 单独验证。该 Windows 套件明确不是通过。

source-before.json 记录实际分支、base HEAD 和全部非忽略源文件 SHA-256；验证完成后逐文件比较无差异。测试针对当时未提交工作树，不能把 base HEAD 说成包含新增页面的提交。旧 test-results / playwright-report 已在同目录以 prior-* 备份；本轮截图、报告、各命令日志及 outcomes.json 保留，不覆盖更早阶段证据。

Windows 本轮日志位于 .local/journal-privacy-review/ 下；初次集成记录 integration-first / integration-second，完整安装验证记录 windows-initial。同一套用例重复执行只记最终独立用例数，不相加。

## 已加入的检查策略

静态策略明确十路由/11 HTML，与 routes.previewPages 逐项校验，变更配置不能任意放行新路由。商业六页及 Journal 三联系组，Article 两组，Legal/404 零组。检查文章草稿状态、三级面包屑、目录与 H2 顺序、内链/锚点、素材/来源、空渠道与无营销 Legal；原脚本、资源、素材完整性、实际生产拒绝和 Sanity 不回退用例保留。

新增受控正文单元测试涵盖 H2/H3/重复标题目录、危险协议/HTML/脚本/iframe/多余属性、错误来源码、伪发布/日期/署名、错误素材、数量算例与 factory MOQ 隔离、Privacy 待补状态。静态负例先验证合法夹具通过，再核对失败具体原因；来源 allowlist 不能让外部 CSS/预取/脚本/图片被放行。

浏览器覆盖四新页 320/360/390/768/1024/1440，首屏/全页/表格/长文截图，键盘/无 JS/reduced-motion/图片失败、200% CSS 文字和长标题/链接/单元格。回归 Home/Journal → 两文 → 对应 Manufacturing 锚点 → 品类/Contact → Journal、面包屑、旧锚点、直接访问及未知 slug 404。原六页测试保留并按新导航/首页两文升级断言。

## 私有 CI 证据与追溯

CI 保持只读权限、无 secrets/部署。检出 PR 的实际 head 作为测试与 source archive 源；review/source.json 同时记录 headSha、baseSha、checkoutSha/tree、runId。before comparison 固定重新渲染已验收 PR #5 head 3600f9558465f247dceaa8234971dd9ca0c8a204 的六页，不再误标 PR #4。

private-review-source-* 保存当前源，journal-privacy-pages-review-* 保存 review 日志/outcomes、Playwright HTML/JSON/trace/截图、web/dist、台账和交接；保留 14 天，仓库 private。这些是私有 CI artifacts，不是网站部署。最终 run/status 未取得前不可声称 Linux CI 通过。

最终 1440/390 首屏、全页、表格和长文状态由本次 Playwright 实际捕获，位于 test-results 的 editorial 测试目录。当前会话的 artifact export 只返回了元数据，没有可读取的图像内容，不能据此声称已逐张目视验收最终截图。上面的首篇与基线查看是之前阶段的记录，不替代当前最终截图人工复核；此项和两篇独立封面仍保留待审。PR 的实际 head、Linux run ID / 结果与私有 artifact 链接在提交后的 PR 交付评论中记录，避免在尚不存在的提交/CI 上预填通过。

## 未完成与明确不测试

真实工厂资料、两类真实能力、实际 MOQ、主体/隐私联系人/服务商/保留期限/生效日、真实渠道发送与收件、正式 CMS、正式 canonical/sitemap/Article 结构化数据和生产 SEO 均未完成。没有密钥、真实消息、表单/上传或公开部署。两篇独立概念封面未制作，ASSET-01 保持部分完成。

无真机、Safari/Firefox/Edge 或真实浏览器菜单 200% 缩放验收；当前浏览器范围为固定 Playwright Chromium。CSS 200% 文字与长文压力状态不冒充真机质量验收。全站 noindex 不是私有访问控制；不得公开托管 dist。PR #5 与更早日志保持历史，未改写成当前结果。

## PR #6 手机数量表修正 · 2026-09-16

### 起点与修复范围

重新读取了 PR #6 的 head、普通评论及 review，并检查实际 Windows 分支、HEAD、含未跟踪文件的 status 和远端引用。起点仍为 `feat/journal-privacy-pages@c02116e38b17f61323090b2ba5eaa8cf43c4db31`，工作树干净，远端相同；没有出现需要比较的新提交。main 仍为 `4469a1735465435508a3e510fcb6602e848a5264`。沿用原分支和原 Draft PR，不更改 Ready 状态、合并或部署。

仅修 `/blog/moq-per-style-per-color/` 中 caption 为 “Hypothetical proposal: two styles, three style–color lines, 180 pieces total” 的第二张五列表。原 390px 表格宽 350px、每列 70px；款式/颜色被拆成片段。实际重新构建该起点并保存 320/360/390/1440 的数量表、询价表及 Privacy 表截图，源记录在 `.local/pr6-moq-table-fix/before/source.json`，不是以旧第一张表截图判断。

`EditorialBody` 按既定五个列标题选择数量布局，使用原生 table/caption/colgroup/thead/tbody；行列 th 的 scope、全部数字、三行描述和假设说明不变。专用 CSS 给描述列较大空间，数值列右对齐、不拆行；正文从 15px 增至 16px，随 rem 放大。窄屏只滚动该表，原生横向滚动不依赖网站 JavaScript。可见说明和 aria-describedby 解释触控、滚轮及方向键；区域可聚焦且有焦点样式。caption 保留原生语义，其文字在左右滚动时仍按可见宽度完整换行。其他两列表维持原规则；未改算例、正文、图片、首页、内容模型、依赖或生产限制。

### 测试与截图取证方法

新增 `tests/browser/quantity-table.spec.ts`：精确 caption 定位第二张表，核对三行全部数据与 scope，使用文本 Range 验证 cream/charcoal/hoodie 不碎裂，检查描述/数字列宽、字号、数字不溢出、完整 caption、全部列可达和整页不横向滚动。矩阵为 320/360/390/1440 × 100%/200% CSS 文字 × 有/无 JS；额外以 Chromium 原生模拟触控事件覆盖三种手机宽度的有/无 JS 滑动。预览/开发两个项目合计 44 个新增用例，不把重复执行累加。

同时检查 MOQ 第一张两列表、询价表与 Privacy 表的语义、原等宽布局、字号及溢出。新增普通测试视口内逐行滚动/命中检查，验证末行能读到且不被固定联系条遮挡。整块证据截图过高时只增大捕获视口的高度，保持宽度、文字比例和所有 UI，避免截图本身混入固定条；每张附件记录测试与捕获视口，另保留原高度的末行视口图。不隐藏条、不裁掉数据，也不将 CSS 文字放大称为浏览器菜单缩放或真机。

既有 editorial 截图逻辑改为按 caption 明确捕获两张 MOQ 表，不再只拍 `.editorial-table.first()`。原套件与安全门禁保留；新套件总量应由新提交的完整执行结果确认，旧 73/368 仅作上方历史记录。

早期专项执行发现无 JS 下 addStyleTag 的事件等待超时，现改为测试层在导航 HTML 中加入文字放大样式，仍完整执行无 JS 用例。之后的专项轮次实跑 44 项通过，日志为 `.local/pr6-moq-table-fix/focused-second.txt`。目视复核又发现早期高图截图被固定联系条覆盖末行，故补充上述逐行可见性及取景机制；辅助捕获曾等待 Privacy 本不存在的联系条，已改为先检查元素是否存在。失败/停止日志保留，不列为通过，最终仍须对修正后精确提交完整重跑。

最终专项第四轮 `.local/pr6-moq-table-fix/focused-fourth.txt` 已返回 0，44 项全部通过（约 2.1 分钟），包含新增末行可见性与完整捕获机制。它是提交前的专项证据，不替代下述最终精确 head 的完整 verify / CI。

### 视觉证据与最终提交绑定

已通过独立测试浏览器实际查看修复前 320/360/390 的碎词现象、1440 前后对比，以及修复后窄屏左右滚动视图。随后实际查看 `visual-final/text200-left.png`、`text200-right.png` 和 `regression-and-last-row.png`：320/360/390 的 200%/无 JS 文字保持可读，三行描述与右端数量可通过局部滚动读取；390px 原测试高度的末行位于未隐藏的固定联系条上方；询价/Privacy 两列表保留原生语义、原列宽与正常换行。整块图片的捕获高度与合成图缩放在附件中单独说明，不冒充真机或浏览器菜单缩放，也不扩大为全站最终视觉验收。

Windows 原始过程在 `.local/pr6-moq-table-fix/`；最终完整检查须绑定提交 HEAD/tree 并记录各命令退出码。Linux CI 新增独立的 `c02116e...` 表格基线 checkout/build/capture，产物 `review/moq-table-before/` 明确是修复前；保留原 PR #5 六页比较，不混淆二者。新 head 的截图在 quantity-table 测试目录，source/outcomes 与原始日志保存在私有 CI artifact，包含 `moqTableBeforeSha` 和 `moq_baseline` 结果。

最终 SHA、Windows 完整 verify/仓库/Bash/Python/audit 的实际结果、新 CI run 及修复前后图片入口追加到原 PR #6 的本修复交付评论，并按该精确 head 核查。这样不在提交尚未产生时预填 SHA/CI，也不把旧绿色结果当成本修复通过。Windows Python 的 WSL/Bash 限制仍须如实记录；Linux 成功不等于 Windows 已修好。PR 保持 Draft，等待用户复核；十页概念状态、真实内容/CMS/渠道/生产 SEO 与发布限制均不变。

## 后续已观察状态 / 2026-09-16

以上 Draft 和等待验收为当时历史，不能用于判断当前 PR 状态。DEV-05A 开工前通过 GitHub 和 Windows gh 实时确认：PR #6 已由 Jonoka 于 2026-09-16T09:35:51Z 合并；最终修复 head cfc1675b2ef364c361b03d6839b864723c194091，main 为 11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0。后续使用 feat/cms-editorial-foundation，不复用已合并分支。当前回归、截图和离线 CMS 限制见 [DEV-05A 验证](cms-editorial-verification.md)，不改写本页旧测试结果。
