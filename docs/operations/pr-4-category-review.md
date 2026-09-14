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
