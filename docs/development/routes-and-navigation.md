# 当前预览路由与导航

最终计划仍是 config/routes.json 中十个内容 URL、八种模板。当前只实现下列六页和工程 404；生成七个 HTML，不生成博客、文章、Privacy 正文、Clothing 汇总或独立 MOQ / Sampling / Quality / Process 页。

| 路由 | 来源码 | 图片策略 |
|---|---|---|
| / | WEB-HOME | 三张现有服装概念图，另有真实工厂摄影待补图位 |
| /clothing/t-shirts/ | WEB-TSHIRTS | 仅 CAT-TS-001 |
| /clothing/hoodies/ | WEB-HOODIES | 仅 CAT-HD-001 |
| /manufacturing/ | WEB-MANUFACTURING | 不需要图片 |
| /our-factory/ | WEB-FACTORY | 仅非摄影的 FACTORY-001 待补图位，不输出 img |
| /contact/ | WEB-CONTACT | 不需要图片 |
| 404.html | 不使用商业来源码 | 无图片和移动联系条 |

来源码的共享类型与值在 config/page-context.ts，必须和十页计划中的对应记录一致。HTML 构建检查对六条路由、资产 ID、图片策略、事实状态、渠道状态、模块脚本和生产阻断有明确限制；修改路由配置不能自动放开新页面。

## 导航行为

Logo 返回首页。Clothing 是原生展开控件，只有两条真实品类路径；不链接 /clothing/。Manufacturing / Our Factory / Contact 指向相应内页，当前页面显示 aria-current 文本而非自链接。页脚共享同一规则。

Process 只指向 /manufacturing/#production。Journal 当前指向 /#journal，那里明确尚未发布文章；正式计划 /blog/ 没有改名或取消。Privacy 显示不可用，不创建假链接。无真实社交账号时不显示图标链接。

面包屑为 Home → 当前品类/Manufacturing/Our Factory/Contact；当前项不可点击，没有虚构的父级。

## 稳定锚点与关联路径

Manufacturing 保留 #options、#moq、#prepare、#sampling、#production、#faq。原首页 #capabilities、#categories、#t-shirts、#hoodies、#factory、#production、#journal、#enquiry-guide 和页脚 #contact 均保留。

首页摘要进入制造/工厂及制造流程；两品类的 MOQ 与打样链接分别进入 /manufacturing/#moq 和 /manufacturing/#sampling。制造页关联两品类、Factory 和 Contact；Factory 关联资料准备和 Contact；Contact 可返回品类或 /manufacturing/#prepare，避免联系页自跳。

所有未知路径与 slug 返回真实 404。404 提供 Home / Manufacturing / Contact 的有效恢复路径，不回退为首页 200。

## 移动与降级

菜单仍是非模态原生 details；无 JS 可访问全部已实现页面。启用增强时 Escape 关闭并恢复触发点焦点，链接点击不被阻止。菜单展开隐藏底部联系条，安全区和末尾内容避让继续保留。空渠道只能看到禁用按钮和明确说明，任何页面都不会发送、复制或收集客户信息。
