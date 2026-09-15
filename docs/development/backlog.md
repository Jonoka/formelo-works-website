# 首轮任务与依赖

下表是版本化待办，**不是已在 GitHub 创建的 Issues**。状态仅依据实际提交、检查和审阅结果更新，不预填负责人或虚假完成证据。

| ID | 工作 | 依赖 | 完成证据 | 状态 |
|---|---|---|---|---|
| INIT-01 | 初始化资料入库并通过 PR 审阅 | 私有仓库及写入连接已验证 | PR #1；main 41a9e910ef42cd80f4d5540928bf6b307b8b0d2a | 已由用户合并 |
| DEV-01 | Astro + TypeScript / Sanity Studio 基础工程 | INIT-01；选择实际兼容版本 | 根 lockfile、运行说明、测试和 CI；见 [验证记录](../operations/dev-01-verification.md) | 已由用户合并 PR #2；main 4f6690124e1e0e9831214be40b6414435348ad84 |
| DESIGN-01 | 已选方向的手机与品类演绎 | 已选首页、PRD | 390px 手机 / 品类布局、状态、微调记录；不重新生成三方向 | PR #3 / #4 已合并；本轮三核心内页沿用视觉并补有限品类断行整理，整体设计与正式素材仍不关闭 |
| ASSET-01 | 独立无字服装概念图与网页优化版本 | 已选图、manifest | Hero、两类、两文封面；来源 / 比例 / 审核状态 | Hero / T-shirt / Hoodie 三张独立首页概念图及 WebP/AVIF 已接入 PR #3；两文封面未做，不标完成 |
| DEV-02 | 字体、设计变量、Header / Footer / CTA / 无 JS 导航 | DEV-01、DESIGN-01 | 1440 / 390 对照截图、空联系方式不外跳 | PR #4 已合并；本轮统一六页导航/来源码及空渠道状态；真实渠道未做，不整项关闭 |
| DEV-03 | Home 与 Category 模板 | DEV-02、ASSET-01 | 保留所选视觉与 PRD 信息，两类差异，手机可用 | 首页与三图已随 PR #3 合并；已合并 PR #4 的单一 Category 模板与两概念品类，正式样品/事实仍待补，不整项关闭 |
| DEV-04 | 制造、工厂、Journal、Article、Contact、Privacy、404 | DEV-03 | 十内容路由 + 404，不新增 Process 页 | 本轮仅 Manufacturing / Factory / Contact 概念实现与既有 404 导航推进；Journal / Article / Privacy 正文、正式事实与全站验收未完成 |
| DEV-05 | Sanity schema、查询、published 内容与重建 | DEV-01；Sanity 授权 | 一条内容发布 / 撤回链路；schema 与 mock 对齐 | 待账号和实现 |
| DEV-06 | SEO、联系逻辑、可访问性与完整检查 | DEV-04、DEV-05 | 对应 T / UI-V 测试日志；统计关闭 | 待开始 |
| CONTENT-01 | 正式品牌 / 能力 / 图片 / 联系 / 两文审核 | 工厂资料 | 审核记录、替换台账、真实设备收发 | 待工厂 |
| DEV-07 | 授权受控预览、正式发布与恢复 | 用户单独授权、CONTENT-01、质量验收 | 平台访问保护验证、部署 ID、回滚演练 | 未授权发布 |

第一开发任务只做工程底座和最小本地页面，不一次铺满十页。
DEV-01 已补充 `web/`、`studio/` 的命令与 CI 配置。最小 Header / Footer、静态首页及 404 只用于底座验证，不意味着 DEV-02 / DEV-03 / DEV-04 的完整视觉与业务模板完成。

PR #3 的 CI 修复、实际结果、首页微调和未执行范围见 [修复记录](../operations/pr-3-ci-repair.md)。该记录保留历史草稿状态；PR #3 实际已合并到 main@ef92f55955c2ab761d282c3c86fa8e663856424f。该段为历史记录；PR #4 随后已由用户合并，当前任务见下方核心内页增量，不自动合并或发布。

本轮客户文案、组件与素材接口工作见 [首页继续开发记录](../operations/pr-3-homepage-review.md) 和 [素材阻塞/交接](../design/homepage-asset-handoff.md)。所有上述大任务仍是局部进展，不以接口测试代替真实图片接入或完整页面验收。

## 品类迭代历史 / PR #4

实际范围为首页三个体验调整、T-shirts/Hoodies 共用 Category 模板及相关导航/回归；实现三个内容 URL 和既有 404，最终十 URL 规划不变。第一品类截图与 CI 检查点通过后才复用到 Hoodie。见 [品类衔接](../design/category-handoff.md) 与 [本轮验证](../operations/pr-4-category-review.md)。ASSET-01 的两篇文章封面、正式产品与工厂素材仍待补；DEV-04 其余内页、DEV-05 CMS 和全站验收没有完成。旧日志不改写为本轮通过。

## 当前核心内页增量

PR #4 已合并至 main@59ba085c25dc8ab412803b8b5afea7604d450756，已审阅 head 为 4116c2c2d40c16abfb078fe4805089556595f569。本轮使用 feat/core-information-pages，Windows 实际工作树经检查后从 main 快进建立分支，不以远端提交冒充本地同步。

先实现并查看 Manufacturing 1440/390 实际渲染，再推进 Factory 与 Contact。增加六个内容 URL 的内链/来源码/元数据/空联系方式和按页图片策略检查，共七个 HTML；不改变最终十 URL 规划。见 [设计衔接](../design/core-information-handoff.md)、[验证记录](../operations/core-information-verification.md)、[资料缺口](../content/factory-materials-checklist.md)。

DEV-04 仅记录三页概念进展，真实内容审核、博客与文章、Privacy、CMS、真机/真实渠道、发布和全站验收保持开放。
