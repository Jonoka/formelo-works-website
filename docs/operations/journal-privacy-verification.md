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
