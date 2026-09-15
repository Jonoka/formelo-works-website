# PR #4 品类迭代验证记录

## 恢复与范围

PR #3 merged=true/draft=false，merge/main 为 `ef92f55955c2ab761d282c3c86fa8e663856424f`；不按旧 PR body 中的 Draft 判断。开始时 WebCodex 工作树干净，未发现目标分支或开放 PR，已从 origin/main 新建 feat/category-pages。后续只保留一个 PR #4。

WebCodex 工具在分支准备后变为不可用；通过已授权 GitHub 连接继续同一远端分支，在隔离 Linux 审阅工作区处理源码，不声称新提交已经同步到 Windows 工作树。中断恢复时远端 head 为 `638c4a36c5a95ebd40ae55b3b8490580190a1769`。下载其私有 source artifact `10336536194`，ZIP digest `90461d47de905f98666add41d012bb6288e773c26fc77fc1427f855949e79d90`，展开后的 Git tree 精确等于 `08bc0160e15eba4817496bfec2eb02aa0ad66600`。无覆盖、重置、force push、自动合并或部署。

## 第一品类检查点（历史，不冒充最终结果）

T-shirts 已先单独实现并审阅 1440/390 首屏与全页。检查点 CI `34816140050`，PR head `638c4a36c5a95ebd40ae55b3b8490580190a1769`，实际 checkout 为 PR 合成树 `b31aec7096925b5ef9d400287a6adcbc074be34f`，不是合并到 main。artifact `10336495988` / ZIP digest `323e3cc633529311015fa133ad8f091b278ab8ee0a74a70c3428f8b060da837a` 已下载读取 source/outcomes/verify 与实际截图。runtime/install/types/unit/build/Chromium/browser/verify/audit 均 success；浏览器 54 项通过。之后才复用到 Hoodies。

## 本轮实现及检查

首页三个有界体验调整、共享 Category 模板与两个差异化概念品类、跨页导航、共享禁用联系上下文、按页资产策略与回归。素材全部复用，源图/变体/哈希不变，不新增样品或工厂批准。详见 [设计衔接](../design/category-handoff.md)。

Windows 最后可读到的默认版本为 Node 24.12.0/npm 11.6.2；本次隔离审阅容器为 Node 22.16.0/npm 10.9.2，且无法解析 nodejs.org。没有用这些版本执行项目验收、没有关闭 engine-strict 或改 lockfile。固定 Node 24.21.0/npm 11.19.1 的 npm ci、verify、audit 和 Chromium 必须由当前 head 的 Linux CI 执行并记录。

隔离 Linux 审阅工作区已实际运行仓库/资产检查、Bash 语法和原有 20 项 Python 测试，均通过。此项不是 Windows 结果，也不能代替 CI 的 npm/浏览器验收。

当前完整实现的 CI 结果由本 PR 的最终核对评论和 artifact `review/source.json` / `review/outcomes.json` 绑定，未取得当前结果前不引用上面旧绿色检查点充数。CI 执行 npm ci、类型/tokens、unit/schema/真实 production 阻断、按页静态输出、dev+preview Chromium、完整 npm run verify、npm audit --audit-level=high；bootstrap 独立运行 Python/仓库/Bash 检查。已知 4 中危（uuid → typeid-js → @sanity/cli → sanity）继续记录，以当前实际 audit JSON 为准，不强制升级或掩盖。

## 审阅证据布局

私有 artifact `category-pages-review-<head SHA>` 保留 14 天：review/source.json 指明 base/head/实际 checkout；review/outcomes.json 包含跳过/失败状态；test-results 和 playwright-report 保留三个页面 1440/390 主截图、320/360/768/1024 回归及异常场景。review/before 内由 PR #3 精确 head `bc78d30e7497e764d585e3510f9c2a296e93017c` 重新构建的首页截图提供同一 Linux/Chromium 环境前后对照，不使用拼造示意图。该 checkout/构建仅作 loopback 私有 CI 审阅，不公开部署。

## 未执行与未完成

真实手机、Safari、Firefox、Edge、浏览器 UI 真缩放、真实服装/工厂素材验收、Email/WhatsApp 主动收发、CMS 发布/撤回和生产部署均未执行。200% 测试为 CSS 文字放大模拟。正式每品类至少三组授权样品、两篇文章与其封面、工厂资料和其他内页仍待办。ASSET-01、DEV-04、DEV-05 与全站验收不标完成。Windows 工作树后续需恢复 WebCodex 后先检查 dirty/status 再安全同步；不预写为已拉取。

## 完整迭代首次回归与修复

实现提交 `564b8e3442e924bde8d432bbcfd6bb4f53aa4eef` / CI `34821390019`：runtime、npm ci、类型/tokens、43 项单元/schema/生产阻断/静态策略、三页与 404 构建、audit、历史首页同环境渲染及 bootstrap 均通过；浏览器 **108 passed / 12 failed / 0 skipped**，因此 aggregate verify 未执行，不能记通过。失败范围是两个品类在 320/390px 下的 200% 文字重排，以及无 JS 文字放大夹具的异步样式注入超时。

诊断提交 `459b3d020781d15c90d1f20e2562beb1a202f84f` / CI `34822434341` 保留原重排断言，增加溢出位置和截图附件，并将无 JS 测试的样式注入改为同步的测试工具 DOM 操作，不启用网页脚本。超时消除后，同一组 12 项均给出可读的重排失败：320px 文档宽 326px，390px 文档宽 391px。实际检查 320px 全页截图右缘，溢出来自相关品类入口的装饰箭头，而非正文。箭头 flex 槽位被压缩，字形超出自身盒子；修复为该箭头 `flex: 0 0 auto`，正文仍可收缩换行，不隐藏横向溢出、不缩小字号或删掉断言。

上述两次失败 artifact（`10338254160`、`10338293654`）保留，后续当前-head 完整重跑才可证明修复通过。隔离容器尝试用系统 Chromium 查看 CI 静态产物时受到管理员的回环访问限制，没有修改或绕过该策略；实际定位依据是已授权私有 CI 的 trace、JSON 和截图，不把该容器浏览器算作通过。

首页 390x844 的实际截图已看到业务定位、双入口和可辨识的卫衣轮廓：该实现的图片顶部约 583.55px，底条上方可见图像约 162.67px；PR #3 对照由原始精确代码重新渲染。最终头提交的对应数字与截图以其 artifact 为准，而非自动沿用本段。

## 2026-09-14 追加：完整实现的通过证据

新增首页 320/390px 的 200% 文字回归提交 `cf68e5543bd964bab1328b60b5ec65a37bb6d895` 的 CI `34823275348` 随后因新提交被取消，不计为通过。已核对并保留其后的箭头修复提交 `dca6acbd0d0ff4afa300b8c82a00f8cbc1061898`，没有覆盖新出现的远端工作。

[实现验证 CI 34823532596](https://github.com/Jonoka/formelo-works-website/actions/runs/34823532596) 的完整检查已通过。PR head 为 `dca6acbd0d0ff4afa300b8c82a00f8cbc1061898`；实际 checkout 为 `1bb4d46fc94ac38f16261e62b25e003bcdfe6d6e`（PR 合成 merge，不是合并 main）；源 tree 为 `52ca2405aa75309d1d008af597cf9ea080811327`。下载的 source ZIP 已核对 SHA-256，并在隔离工作区重新计算 Git tree 一致。

| 检查 | 该实现提交的实际结果 |
|---|---|
| Node / npm | 24.21.0 / 11.19.1；运行时门禁通过 |
| npm ci | 成功；运行时、依赖版本和单一 lockfile 未升级 |
| 类型 / tokens | 通过；Astro 0 errors / 0 warnings / 0 hints |
| 单元 / schema / production 阻断 / 静态策略 | 43 passed，0 failed / skipped |
| 静态输出与内链 | 4 HTML：首页、两个品类、404；链接和片段全部解析 |
| Chromium dev + preview | 124 passed，0 failed / skipped / flaky；不是重复运行数量相加 |
| npm run verify | 完整重跑通过，包含上述浏览器回归 |
| npm audit --audit-level=high | 通过；4 moderate / 0 high / 0 critical，风险未消除 |
| Linux CI 仓库 / Bash / Python | bootstrap 通过；隔离 Linux 工作区另行重跑仓库、Bash 及 20 项 Python 测试也通过 |
| PR #3 同环境对照 | 精确旧代码本地构建、1440/390 截图成功，无部署 |

已下载并检查 [私有审阅 artifact 10339640067](https://github.com/Jonoka/formelo-works-website/actions/runs/34823532596/artifacts/10339640067)：`category-pages-review-dca6acbd0d0ff4afa300b8c82a00f8cbc1061898`，ZIP SHA-256 `b487069ae5477f8eb3a902493d9277e252e4bee48e400e2b5725b96a0e79fd4a`，保留至 2026-09-28 08:41 UTC。source/outcomes、runtime、unit、verify、audit 与 Playwright JSON 的提交和结果一致。浏览器安装日志为 Chrome/Headless Shell 153.0.8010.12、Playwright Chromium build 1243；不冒称真机或其他浏览器已测。

390x844 下，原 PR #3 主图顶部为 851.80px，本轮为 583.55px，提前约 268.25px；主 CTA 底部为 481.16px，底条顶部为 746.22px，其上可见服装图约 162.67px。是自然内容与间距调整，不是固定首屏高度或裁切正文。完整截图、其余宽度、失败状态和文字放大证据均随该 artifact 保存。

本段只绑定上述实现提交。保存验证记录的后续文档提交仍需自己的 CI；最终 PR head、对应运行和 artifact 在 PR #4 最终审阅摘要中核对，不把此处旧 head 的结果自动改写成后续通过。未执行范围及上线前资料要求不变。

## 2026-09-15 追加：合并与下一增量

GitHub 实际 state=MERGED，mergedAt=2026-09-14T17:37:38Z；head=4116c2c2d40c16abfb078fe4805089556595f569，merge/main=59ba085c25dc8ab412803b8b5afea7604d450756。最新验收 review 已读取；不是根据旧 PR 正文判断。上述日志保留其当时的运行时、平台与未执行项。

本轮实际核对 Windows：原 feat/category-pages@4116c2c 工作树干净，main 可快进；仅执行 fast-forward 后从最新 main 建立 feat/core-information-pages。后续三核心内页的实现、结果与本地状态单独记录在 [核心内页验证](core-information-verification.md)，不把旧 PR #4 的通过结果自动算作新 head 的通过。
