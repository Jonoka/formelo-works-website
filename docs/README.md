# 文档索引与优先级

| 文件 | 用途 | 状态 |
|---|---|---|
| [当前决定](decisions/0001-approved-direction.md) | 用户选图、临时品牌、AI 占位、冲突处理 | 当前基准；技术细节为实施建议 |
| [PRD](product/prd-v1.0.md) | 需求、字段、45 项功能验收 | 原版保留；与决定记录一起阅读 |
| [视觉基线](design/visual-baseline.md) | 已选画面的设计拆解、允许微调 | 用户选择方向；具体 tokens 为候选 |
| [设计变量](design/tokens.json) | 单一 CSS 变量来源 | 首页/品类沿用；不作为原截图精确取样 |
| [内容任务](content/page-inventory.md) | 十页的文案、素材与审核需求 | 待填真实工厂资料 |
| [技术边界](development/architecture.md) | Astro / Sanity / 内容 / 环境关系 | 保留架构规划；当前已实现十个内容预览与 404 |
| [首发英文待审稿](content/cms-launch-drafts.en.md) | DEV-05H六页、两品类、MOQ全文、询价摘要及字段级拟写表 | 已拟稿；未获本批云端写入授权，未发布 |
| [工厂确认问题](content/factory-materials-checklist.md) | 同一事实台账；中文可直接回答的问题 | 工厂专属信息和图片待确认，不要求英文终稿 |
| [CMS 映射](development/cms-editorial-mapping.md) | 现有schema/转换/只读查询、状态、授权和失败边界 | 限定真实读取已获准；默认mock，批量Draft写入未获准 |
| [CMS 验证](operations/cms-editorial-verification.md) | Windows / Linux CI / 夹具 / 真实 CMS 分开记录 | 按当前head核对，Draft和Git交付分开 |
| [工作流](development/workflow.md) | ChatGPT / Codex / GitHub / 本地协作 | 协作约定与实际能力说明 |
| [任务列表](development/backlog.md) | 按依赖实现的第一轮任务 | 未创建在线 Issues |
| [验收说明](quality/acceptance.md) | 原型与生产测试差异 | 完整生产验收未完成；增量测试见 Journal / Privacy 记录 |
| [初始化记录](operations/initialization-status.md) | 做了什么、没做什么、检查范围 | 初始化时状态快照 |
| [操作手册](operations/runbook.md) | 建仓脚本、失败恢复、后续发布 | 既有仓库协作、检查与恢复 |
| [来源记录](references.md) | 历史官方参考及核实边界 | 官方查阅入口；以当前实际调用为准 |

`reference/` 中的 UI v1.0 颜色 / 字体是历史建议，不能覆盖已选截图。Word 导出件保留在原会话 ZIP，不作为日常并行编辑稿。
导入文件清单及哈希见 [import-manifest.json](reference/import-manifest.json)。旧方案 v1.0 因边界已被替代，不导入本项目。

当前增量见 [首发英文待审稿](content/cms-launch-drafts.en.md)、[CMS 映射](development/cms-editorial-mapping.md) 与 [CMS 验证](operations/cms-editorial-verification.md)。PR #6 基线见 [Journal / Article / Legal 衔接](design/journal-article-legal-handoff.md)、[本轮验证](operations/journal-privacy-verification.md)、[路由与导航](development/routes-and-navigation.md) 及 [工厂资料清单](content/factory-materials-checklist.md)。[核心内页衔接](design/core-information-handoff.md) 和 [PR #5 验证](operations/core-information-verification.md) 保留为历史。[品类衔接](design/category-handoff.md) 和 [PR #4 验证](operations/pr-4-category-review.md) 保留为已合并历史；索引中的规划/初始化文档不代表当前代码仍为空。
