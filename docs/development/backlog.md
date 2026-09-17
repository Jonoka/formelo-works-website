# 首轮任务与依赖

下表是版本化待办，**不是已在 GitHub 创建的 Issues**。状态仅依据实际提交、检查和审阅结果更新，不预填负责人或虚假完成证据。

| ID | 工作 | 依赖 | 完成证据 | 状态 |
|---|---|---|---|---|
| INIT-01 | 初始化资料入库并通过 PR 审阅 | 私有仓库及写入连接已验证 | PR #1；main 41a9e910ef42cd80f4d5540928bf6b307b8b0d2a | 已由用户合并 |
| DEV-01 | Astro + TypeScript / Sanity Studio 基础工程 | INIT-01；选择实际兼容版本 | 根 lockfile、运行说明、测试和 CI；见 [验证记录](../operations/dev-01-verification.md) | 已由用户合并 PR #2；main 4f6690124e1e0e9831214be40b6414435348ad84 |
| DESIGN-01 | 已选方向的手机与品类演绎 | 已选首页、PRD | 390px 手机 / 品类布局、状态、微调记录；不重新生成三方向 | PR #3 / #4 / #5 已合并；本轮补 Journal / Article / Legal 设计衔接，最终截图人工复核及正式素材仍不关闭 |
| ASSET-01 | 独立无字服装概念图与网页优化版本 | 已选图、manifest | Hero、两类、两文封面；来源 / 比例 / 审核状态 | Hero / T-shirt / Hoodie 三张独立首页概念图及 WebP/AVIF 已接入 PR #3；两文独立封面仍未做；显式复用已登记 CAT-TS-001 / CAT-HD-001，不标 ASSET-01 完成 |
| DEV-02 | 字体、设计变量、Header / Footer / CTA / 无 JS 导航 | DEV-01、DESIGN-01 | 1440 / 390 对照截图、空联系方式不外跳 | PR #4 / #5 已合并；本轮补十页导航、文章父栏目及按模板联系区规则；真实渠道未做，不整项关闭 |
| DEV-03 | Home 与 Category 模板 | DEV-02、ASSET-01 | 保留所选视觉与 PRD 信息，两类差异，手机可用 | 首页与三图已随 PR #3 合并；已合并 PR #4 的单一 Category 模板与两概念品类，正式样品/事实仍待补，不整项关闭 |
| DEV-04 | 制造、工厂、Journal、Article、Contact、Privacy、404 | DEV-03 | 十内容路由 + 404，不新增 Process 页 | 十页概念结构已实现：本轮补 Journal、两文完整草稿、未生效 Privacy；检查状态见本轮记录。正式事实、CMS、生产 SEO 与全站验收仍开放 |
| DEV-05 | 全站 Sanity 内容来源、真实内容与重建 | DEV-01；Sanity 授权 | 真实只读与另行授权的发布 / 撤回 / 重建验证 | 保持开放；DEV-05A/05B 都不代表全站 provider 完成 |
| DEV-05A | 两文 schema → 只读查询 → 严格转换 → 原正文契约 | 已合并 PR #6；不依赖真实账号的离线工程 | 实际对象/转换器/查询模块，GROQ 与原组件离线渲染测试；[映射](cms-editorial-mapping.md) / [验证](../operations/cms-editorial-verification.md) | 已随 PR #7 合并；published-only 严格链路与离线基础保留 |
| DEV-05B | 一篇真实 Draft：Studio 保存 → revisions → 服务器只读 → 本地既有正文呈现 | DEV-05A；用户授权真实项目/单篇 Draft/read token | Studio save 前后 revision、draft/published 隔离、本地 1440/390 证据、安全负例与最终回归 | 本地链路与最终 Windows 回归已完成：真实 Draft 从 `RyoTMv...RuB` 保存为 `41ad5f...b8a7`，读取/渲染/published 隔离已证明；提交后的 PR/CI 以当前 head 另行记录 |
| DEV-06 | SEO、联系逻辑、可访问性与完整检查 | DEV-04、DEV-05 | 对应 T / UI-V 测试日志；统计关闭 | 待开始 |
| CONTENT-01 | 正式品牌 / 能力 / 图片 / 联系 / 两文审核 | 工厂资料 | 审核记录、替换台账、真实设备收发 | 待工厂 |
| DEV-07 | 授权受控预览、正式发布与恢复 | 用户单独授权、CONTENT-01、质量验收 | 平台访问保护验证、部署 ID、回滚演练 | 未授权发布 |

第一开发任务只做工程底座和最小本地页面，不一次铺满十页。
DEV-01 已补充 `web/`、`studio/` 的命令与 CI 配置。最小 Header / Footer、静态首页及 404 只用于底座验证，不意味着 DEV-02 / DEV-03 / DEV-04 的完整视觉与业务模板完成。

PR #3 的 CI 修复、实际结果、首页微调和未执行范围见 [修复记录](../operations/pr-3-ci-repair.md)。该记录保留历史草稿状态；PR #3 实际已合并到 main@ef92f55955c2ab761d282c3c86fa8e663856424f。该段为历史记录；PR #4 随后已由用户合并，当前任务见下方 Journal / Article / Privacy 增量，不自动合并或发布。

本轮客户文案、组件与素材接口工作见 [首页继续开发记录](../operations/pr-3-homepage-review.md) 和 [素材阻塞/交接](../design/homepage-asset-handoff.md)。所有上述大任务仍是局部进展，不以接口测试代替真实图片接入或完整页面验收。

## 品类迭代历史 / PR #4

实际范围为首页三个体验调整、T-shirts/Hoodies 共用 Category 模板及相关导航/回归；实现三个内容 URL 和既有 404，最终十 URL 规划不变。第一品类截图与 CI 检查点通过后才复用到 Hoodie。见 [品类衔接](../design/category-handoff.md) 与 [本轮验证](../operations/pr-4-category-review.md)。ASSET-01 的两篇文章封面、正式产品与工厂素材仍待补；DEV-04 其余内页、DEV-05 CMS 和全站验收没有完成。旧日志不改写为本轮通过。

## 核心内页增量历史 / PR #5

PR #4 已合并至 main@59ba085c25dc8ab412803b8b5afea7604d450756，已审阅 head 为 4116c2c2d40c16abfb078fe4805089556595f569。本轮使用 feat/core-information-pages，Windows 实际工作树经检查后从 main 快进建立分支，不以远端提交冒充本地同步。

先实现并查看 Manufacturing 1440/390 实际渲染，再推进 Factory 与 Contact。增加六个内容 URL 的内链/来源码/元数据/空联系方式和按页图片策略检查，共七个 HTML；不改变最终十 URL 规划。见 [设计衔接](../design/core-information-handoff.md)、[验证记录](../operations/core-information-verification.md)、[资料缺口](../content/factory-materials-checklist.md)。

DEV-04 仅记录三页概念进展，真实内容审核、博客与文章、Privacy、CMS、真机/真实渠道、发布和全站验收保持开放。

## Journal / Article / Privacy 增量历史 / PR #6

PR #5 已于 2026-09-15 合并，head 3600f9558465f247dceaa8234971dd9ca0c8a204，main/base 4469a1735465435508a3e510fcb6602e848a5264。新分支 feat/journal-privacy-pages 不复用旧分支；开工时真实 Windows 工作树干净，后续本轮改动保留。以上日志为历史，不改写成当前测试成绩。

第一篇询价文章与共用 Article 在 1440/390 实际查看后才加入 MOQ 草稿。补 Journal 列表、Home 两文入口和 Legal，无新增栏目或业务系统。十内容 URL + 404 共 11 HTML；两文 editorial_draft / productionAllowed:false，Privacy draft_not_in_effect / referenceCode:null。来源链接是受控 HTTPS 文本导航，不是第三方加载许可。

[设计衔接](../design/journal-article-legal-handoff.md) 与 [本轮验证](../operations/journal-privacy-verification.md) 记录实际检查及限制。ASSET-01 两封面、CONTENT-01 真实材料/审核、DEV-05 CMS、DEV-06 正式 SEO/真实联系/全站验收、DEV-07 授权发布均保持开放。本轮后不扩栏目，转入工厂资料、CMS 与真实渠道联调准备。

## 当前 DEV-05A 文章 CMS 离线基础

PR #6 已于 2026-09-16 由 Jonoka 合并，最终数量表修复 head cfc1675b2ef364c361b03d6839b864723c194091，main/base 11ee7e633ee76f4cf23d3811bc93f9fdbaa2c9d0。feat/cms-editorial-foundation 从干净 Windows 工作区快进 main 后新建，不复用已合并分支。

只交付两文受控 CMS 模型、运行时转换、显式 published/no-store/参数化只读查询与离线验证；原 EditorialBody 与数量表布局保留，默认十页仍全部 mock。CONTENT_MODE=sanity 未实现保护、production 阻断、空渠道、analytics off、概念 noindex、未生效 Privacy 不解除。真实 CMS 未验证；没有写稿、上传、导入、迁移、发布/撤回或部署授权。

ASSET-01 两封面及真实摄影、CONTENT-01 工厂审核与真实字段、DEV-05 全站 CMS/真实联调/重建、DEV-06 生产 SEO/真渠道/全站验收、DEV-07 上线恢复继续开放。详见 [映射](cms-editorial-mapping.md)、[验证](../operations/cms-editorial-verification.md) 和同一份 [工厂资料清单](../content/factory-materials-checklist.md)。

## DEV-05B · 单篇真实 Sanity Draft 联调

PR #7 已由用户合并至 main `accc4dcddaa3161a6fbae4c94ee9860d25739a49`。`feat/cms-editorial-integration` 只接入 `iajvl7ka/production` 中授权的询价文章 Draft，新增独立 drafts/no-store reader、Draft converter 和本地 opt-in 页面替换；正式 published reader、`loadContent` mock 默认、production 阻断、十页范围与手机数量表修复均保留。

真实 Studio 已本地启动并通过用户 GitHub 登录打开目标 Draft。只修改 excerpt 技术标记后，Content Lake revision 从 `RyoTMvUwfjfi4GD1LaCRuB` 变为 `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`；只读服务器路径与本地 Article 页面读到变化，published perspective 仍不可见。当前没有 publish/unpublish、媒体、schema/Studio/site deploy、Cloudflare/webhook 或全站 CMS 授权；这些不能因 DEV-05B 单篇成功而关闭。
