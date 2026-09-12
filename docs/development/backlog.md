# 首轮任务与依赖

下表是版本化待办，**不是已在 GitHub 创建的 Issues**。不预填负责人姓名、日期或完成状态。

| ID | 工作 | 依赖 | 完成证据 | 状态 |
|---|---|---|---|---|
| INIT-01 | 初始化资料入库并通过 PR 审阅 | 私有仓库及写入连接已验证 | 分支 / commit / PR、文件核对、检查结果 | 当前初始化分支；待用户审阅合并 |
| DEV-01 | Astro + TypeScript / Sanity Studio 基础工程 | INIT-01；选择实际兼容版本 | lockfile、Node / npm 版本、npm ci / check / build 记录；本地 mock 可运行 | 待开始 |
| DESIGN-01 | 已选方向的手机与品类演绎 | 已选首页、PRD | 390px 手机 / 品类布局、状态、微调记录；不重新生成三方向 | 待开始 |
| ASSET-01 | 独立无字服装概念图与网页优化版本 | 已选图、manifest | Hero、两类、两文封面；来源 / 比例 / 审核状态 | 待生成 |
| DEV-02 | 字体、设计变量、Header / Footer / CTA / 无 JS 导航 | DEV-01、DESIGN-01 | 1440 / 390 对照截图、空联系方式不外跳 | 待开始 |
| DEV-03 | Home 与 Category 模板 | DEV-02、ASSET-01 | 保留所选视觉与 PRD 信息，两类差异，手机可用 | 待开始 |
| DEV-04 | 制造、工厂、Journal、Article、Contact、Privacy、404 | DEV-03 | 十内容路由 + 404，不新增 Process 页 | 待开始 |
| DEV-05 | Sanity schema、查询、published 内容与重建 | DEV-01；Sanity 授权 | 一条内容发布 / 撤回链路；schema 与 mock 对齐 | 待账号和实现 |
| DEV-06 | SEO、联系逻辑、可访问性与完整检查 | DEV-04、DEV-05 | 对应 T / UI-V 测试日志；统计关闭 | 待开始 |
| CONTENT-01 | 正式品牌 / 能力 / 图片 / 联系 / 两文审核 | 工厂资料 | 审核记录、替换台账、真实设备收发 | 待工厂 |
| DEV-07 | 授权受控预览、正式发布与恢复 | 用户单独授权、CONTENT-01、质量验收 | 平台访问保护验证、部署 ID、回滚演练 | 未授权发布 |

第一开发任务只做工程底座和最小本地页面，不一次铺满十页。
应用实现后才将 `web/`、`studio/` 中说明替换为实际启动命令，并升级 CI 为类型 / 构建 / 链接检查。
