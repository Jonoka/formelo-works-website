# PR #7 · DEV-05A 取证修正记录

## 已核对的起点

继续原 `feat/cms-editorial-foundation` 与 Draft PR #7，不新建替代分支。起点 head `dfd57d42a8bb32ac61e769b2ecdcddb1b09e6fd7`，tree `1a021cbf4de616d90b91907a2936408496c2f9a5`；base/main `11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0`。PR #6 已由用户合并，数量表修复保持。

已读取 [CI 35093167677](https://github.com/Jonoka/formelo-works-website/actions/runs/35093167677) 的最终 job/step 状态和 foundation 原始日志。Linux bootstrap 成功；foundation 的 npm ci、类型检查、130 项测试、11 HTML 静态构建、412 项 Chromium、完整 npm run verify 及 audit 高危门禁成功，最后的 evidence collector 失败。重复执行不累加测试数量。整个 workflow 结论为 failure，不能因为 verify 成功就报告整条 CI 通过。

日志在 2026-09-16T12:14:06Z 报 `CMS_EVIDENCE: screenshot viewport does not match its label`，位置 `scripts/collect-cms-review.mjs:41`。代码审阅确认宽泛的附件名称正则把 quantity-table.spec.ts 的 `quote-1440-text-100-js-false` 等元素裁剪图纳入了 viewport 集合；这些图来自 Locator.screenshot，不应按整页 1440px 宽校验。截图原件保留在完整私有 artifact，不删除或伪称已通过像素审阅。

## 本次修正

只调整取证脚本、其七项离线回归测试、npm test 接入及 CI 结果/附件整理，不改正文、页面、CSS、数量表组件、素材、CMS 转换/查询逻辑或依赖锁图。

收集器现在精确列出 22 个原 editorial.spec.ts 的 page.screenshot 附件：Journal/Quote/MOQ 的 1440/390 六张整页图，以及十六张首屏/表格/模板视口细节。所有入选图片必须严格匹配其 CSS 视口宽度，表格视口图也不再有名称豁免。数量表专用元素裁剪、200% 文字和触控图继续留在完整 artifact，不混标为整页图。

缺图、重复/坏附件、PNG 头或尺寸错误、412 浏览器用例未全部通过均继续失败；只有验证完整集合后才复制。附件实际路径限制在本轮 test-results；CI source/head/tree/run ID 必须一致。manifest 记录 PNG 尺寸/哈希、报告哈希/开始时间、head/tree/平台/run ID，不把截图生成当作人工视觉批准。

新增测试用合成 PNG 头验证分类和尺寸门禁，不伪装成浏览器截图。CI 在 collector 后写 outcomes，包含 evidence 成功/失败/跳过；原失败运行 outcomes 未包含这一后置步骤，不能单独据该旧文件断言全部成功。增加单独的 `cms-editorial-screenshots-<head>` 私有小型截图包，完整截图/日志/HTML 包仍保留。

## 当前执行环境与边界

本次继续时 WebCodex 工具不在可用连接中，发现尝试未取得该工具；**Windows 当前分支、HEAD、status 与完整 verify 最终结果未重新核验**。此前 Windows 在 dfd57d4 上 clean/ahead0/behind0 的实际观察仅作历史。本次通过 GitHub 在同一分支叠加普通快进提交，不能说 Windows 已同步新提交；恢复连接后必须先检查全部本地/未跟踪内容，仅 fast-forward，不 reset、clean 或 force push。

本次容器与 Python 返回 TransportTimeout，虽然旧源码/完整证据 ZIP 导出成功，尚未在该环境独立复算 ZIP 哈希或逐张打开 PNG。新提交的实际测试、截图和 CI 结论在对应 run 及 PR 交付评论中补充，未执行项目不预填通过。

[DEV-05A 主验证记录](cms-editorial-verification.md) 与 [CMS 映射](../development/cms-editorial-mapping.md) 继续适用。真实 CMS 未授权/未验证，已知四项 moderate 仍须在真实 Studio 使用前复核；无写稿、上传、导入、发布/撤回、真实消息、合并或部署。默认十页 mock、全站 Sanity 未实现保护、空渠道、analytics off、noindex、未生效 Privacy 和生产阻断不变。
