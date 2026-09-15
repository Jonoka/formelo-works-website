# 核心信息内页验证记录

## 起点、分支与真实工作区

2026-09-15 读取 GitHub PR #4 的最新状态、head、review、普通/行内评论、开放 PR、main，以及 Windows git status / branch / HEAD。PR #4 state=MERGED，mergedAt=2026-09-14T17:37:38Z；head=4116c2c2d40c16abfb078fe4805089556595f569，merge/main/base=59ba085c25dc8ab412803b8b5afea7604d450756。最新验收评论认可概念增量，不是生产许可。

Windows 实际路径 D:\独立站\formelo-works-website，起始 feat/category-pages@4116c2c 工作树干净。目标分支及其关联 PR 不存在，开放 PR 为空。fetch 后本地 main 与 origin/main 的 ahead/behind 为 0/26；执行 switch main、merge --ff-only origin/main，再建立 feat/core-information-pages。未重置、清理、强推、替换分支、自动合并或部署。

本轮下载的私有审阅资料完整保留到 `.local/core-information-review/pr4-accepted`；此前生成的缩览保留到同目录 initial-inspection。移动前检查它们不包含 Git 跟踪文件，目标不存在，未覆盖用户文件。它们不是产品代码或公开产物。运行日志/首阶段截图也留在 .local，未提交到源代码仓库。

## 基线图与先实现 Manufacturing

选定参考图为 assets/reference/homepage-selected-v1.webp。PR #4 截图来自当前 head 对应 CI 34824464531 的 artifact 10340540050，ZIP SHA-256 为 6cc323e5672f282f2ad6a3d66e5c2c44f8a41d0cdbbb4eef4160f06e1967e89d。source.json 的实际 checkout 是 PR 合成提交 4106f4189aefa30e78ec10876731963dea207c2d，不是 merge/main；head 是已验收的 4116c2c。已读取 source/outcomes 并查看首页、两品类 1440/390 截图的衍生缩览，原始文件保留。

Manufacturing 先单独实现并通过 Windows 类型检查（Astro 35 files，0 errors/warnings/hints）、Astro 中间构建（当时为 5 HTML）与 Chromium 153.0.8010.12 首阶段捕获。1440/390 无横向溢出，六锚点、单 H1、WEB-MANUFACTURING 和无活跃联系方式断言通过。实际查看截图组合缩览后，才推进 Factory / Contact。该中间检查不是完整六页 verify；源绑定在 manufacturing-first/source.json 的工作树哈希，不把 base SHA 当成包含未提交修改的提交 SHA。

## Windows 执行过程与修复记录

沿用项目便携 Node 24.21.0 / npm 11.19.1，不使用全局旧版本、不升级依赖、不改 lockfile 或关闭 engine-strict。第一次 npm ci 因本项目 Astro dev 进程持有编译器 DLL 而 EPERM；实际核对 PID 45572 的命令、加载模块和 4321 监听后，仅停止该项目进程，未终止无关服务。重新 npm ci 成功，安装 1164 项并报告 4 moderate；原失败日志保留。

Windows 自动换行曾令生成的 tokens.css 字节检查失败：核实工作树有 CRLF、Git 原内容为 LF，归一化后完全相同。仅给该生成文件增加 eol=lf 并使用既有生成器重写，没有更改 tokens 数值。一个日志包装命令因 Python 默认 GBK 无法输出 ✓ 而中断；切换该命令输出为 UTF-8，重新完成类型/构建/截图，不把中断后的未执行阶段记作通过。

六页首次 npm run verify 的运行时与类型检查通过，单元检查 54 passed / 1 failed / 0 skipped：新空渠道按钮检查先命中旧 inline-handler 负例，错误分类与原断言不符。保留两项校验与原测试，调整检查顺序，并增加缺失来源码的负例；后续必须完整重跑，不以局部通过充数。

当前完整检查结果在后续追加记录及 PR 当前 head 的 CI 中确认；本节不预填尚未结束的测试。

## 当前实现与检查范围

六内容 URL + 404；明确路由/逐页图片策略；独立 title/description、单 H1、英文 lang、正确面包屑和当前导航；首页 → 品类 → 制造 MOQ/打样 → Factory → Contact → 返回品类；空渠道、来源码、未知路径/slug 404；桌面/手机菜单、键盘、无 JS、reduced-motion、图片失败、长文案、320/360/390/768/1024/1440 重排和 CSS 200% 文字。三张原图与变体哈希、AI 性质、factory awaiting、production 阻断和 Sanity 不回退继续检查。

执行命令为 npm ci、npm run verify、npm audit --audit-level=high、Python 仓库检查/单元与 Bash 语法检查。Windows 与 Linux CI 分开记录；任一命令未执行、失败或被上游跳过必须保持其真实状态。

## 私有 CI 证据布局

Repository checks 保持 private、contents:read、无 secrets/部署动作。当前 head 的 `core-information-pages-review-<head SHA>` 保留 14 天：review/source.json 记录 PR head/base/实际 checkout/tree、comparison SHA；review/outcomes.json 记录每阶段状态；runtime/install/types/unit/build/browser/verify/audit 日志、Playwright JSON/HTML/trace、截图和静态产物保留。精确 source archive 亦保留 14 天。

review/before 从已验收 PR #4 head 4116c2c 的精确代码重新安装/构建并在同一 Linux Chromium 环境捕获首页和两品类 1440/390，不拿 PR #3 旧图或 base 缺失页面冒充新页的前后对照。新页没有虚构的旧版截图。最终新页原始截图位于 test-results 的 information 测试目录，名称为 manufacturing/factory/contact-1440 和 -390，另有 viewport 文件；其余宽度、异常状态及原首页/品类回归也随 artifact 保留。

CI 的直接浏览器测试与 aggregate verify 会重复执行同一套测试；报告单次套件数量，不累加为双倍。合成 PR checkout 是测试树，不代表 PR 已合并。

## 未完成与禁止扩大范围

真机、Safari/Firefox/Edge、浏览器 UI 真实缩放、真实邮件/WhatsApp 收发、复制真实地址、正式摄影、工厂能力审核、Sanity 发布/撤回、生产验收与部署未执行。CSS 放大与 Chromium 模拟视口不替代这些测试。保留 Sanity CLI / UUID 链的中危依赖说明，以实际 audit JSON 为准，不宣称零漏洞。

仅推进 DEV-04 的 Manufacturing / Factory / Contact 概念页面；Journal、两篇文章、Privacy 正文、正式 CMS、真实业务终稿与全站验收均保持开放。不自动合并、不公开部署、不扩大可见范围。

## 2026-09-15 连接恢复后的实际结果

恢复时旧 Job ID 已不可观察，先查 list_jobs、Windows 文件日志、Playwright JSON 与 Git 状态，没有直接重启未知结果的任务。分支仍是 feat/core-information-pages，HEAD 仍为 base，现有未提交内容和 .local 证据均保留；远端 main 未变化，尚无同名远端分支或开放 PR。

第三轮验证已经通过 57 项单元与七 HTML 静态检查，但 Playwright 在发现测试时被 Node ESM 的 JSON import attribute 要求阻断，0 项浏览器测试不算通过。给三个浏览器测试文件的 JSON 导入加上显式 `with { type: 'json' }`，未改依赖、关闭严格模式或跳过测试。

其后 Windows `resume-20260915-a` 完整 npm run verify 返回 0：运行时 24.21.0 / 11.19.1、类型检查（Astro 41 files、0 errors/warnings/hints）、57 项单元、七 HTML 静态检查和 **226 项 Chromium dev/preview 测试**通过，0 failed/skipped/flaky。浏览器 JSON 开始时间为 2026-09-15T03:45:27.968Z；source.json 的逐文件 SHA-256 绑定未提交工作树，不把 base HEAD 当成实现提交。审计返回 0：4 moderate、0 high、0 critical；仓库/资产检查与显式 Git Bash 语法检查也返回 0。

Windows Python 原生执行仍有环境限制：20 项执行记录中两项失败，Bash 子进程命中了系统 WSL 启动器，而该环境没有 /bin/bash。即使进程 PATH 加入 Git Bash，Python 的子进程解析仍命中 WSL；没有修改系统设置或删除/跳过测试。部分负例因早期环境错误而返回非零，不能把这些表面的 ok 都解释为安全逻辑已验证。完整 bootstrap 安全结果以 Linux CI 的独立执行为准；此 Windows 结果明确不是通过。

随后补充每个新页的桌面键盘菜单，以及全部六个 Manufacturing 锚点在桌面/手机、有/无 JS 下的标题可见性检查。新增后的完整重跑保存在 `.local/core-information-review/final-windows`；该目录保留 source、outcomes、npm ci、verify、audit、仓库/Bash 日志以及截图/报告。上面的 226 是已核验历史轮次，不自动当作新增测试后的数量。最终当前 head 的平台结果、截图审阅和 CI run/artifact 以本 PR 交付评论记录，不能累加重复执行数量。

