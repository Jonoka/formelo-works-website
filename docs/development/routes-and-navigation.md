# 当前预览路由与导航

config/routes.json 的十个内容 URL、八类模板已实现为本地概念结构，加工程 404 共 11 HTML。没有 Clothing 汇总、作者/标签/国家页、搜索、分页或独立 MOQ / Sampling / Quality / Process 页；不代表正式内容/CMS/生产 SEO 验收。

| 路由 | 来源码 | 图片策略 |
|---|---|---|
| / | WEB-HOME | 原三张服装概念图 + Journal 两张登记复用图；真实工厂摄影待补图位 |
| /clothing/t-shirts/ | WEB-TSHIRTS | 仅 CAT-TS-001 |
| /clothing/hoodies/ | WEB-HOODIES | 仅 CAT-HD-001 |
| /manufacturing/ | WEB-MANUFACTURING | 不需要图片 |
| /our-factory/ | WEB-FACTORY | 仅非摄影的 FACTORY-001 待补图位，不输出 img |
| /contact/ | WEB-CONTACT | 不需要图片 |
| /blog/ | WEB-BLOG | CAT-TS-001 / CAT-HD-001，两篇真实可访问草稿，独立封面待补 |
| /blog/what-to-send-for-a-clothing-quote/ | WEB-QUOTE-GUIDE | CAT-TS-001 登记复用，不是假 Tech Pack |
| /blog/moq-per-style-per-color/ | WEB-MOQ-GUIDE | CAT-HD-001 登记复用，不是 MOQ 证据 |
| /privacy/ | null | 无图片、营销联系区或移动联系条 |
| 404.html | 不使用商业来源码 | 无图片和移动联系条 |

来源码的共享类型与值在 config/page-context.ts，必须和十页计划中的对应记录一致。HTML 构建检查对十条路由、资产 ID、图片策略、文章/隐私状态、事实/渠道状态、模块脚本和生产阻断有明确限制；修改路由配置不能自动放开新页面。

## 导航行为

Logo 返回首页。Clothing 是原生展开控件，只有两条真实品类路径；不链接 /clothing/。Manufacturing / Our Factory / Contact 指向相应内页，当前页面显示 aria-current 文本而非自链接。页脚共享同一规则。

Process 只指向 /manufacturing/#production。顶部和页脚 Journal 指向 /blog/；原首页 #journal 保留，并提供两篇带草稿状态的文章入口。Privacy 页脚指向真实 /privacy/；该页自身用 aria-current 文本替代自链接。无真实社交账号时不显示图标链接。

普通内页面包屑为 Home → 当前页；文章为 Home → Journal → 当前文章。当前项不可点击并带 aria-current="page"。文章页导航中 Journal 是父栏目链接，data-section-parent="journal" 和视觉样式区分，不能错误标为当前页面。

## 稳定锚点与关联路径

Manufacturing 保留 #options、#moq、#prepare、#sampling、#production、#faq。原首页 #capabilities、#categories、#t-shirts、#hoodies、#factory、#production、#journal、#enquiry-guide 和页脚 #contact 均保留。

首页摘要进入制造/工厂及制造流程；两品类的 MOQ 与打样链接分别进入 /manufacturing/#moq 和 /manufacturing/#sampling。制造页关联两品类、Factory 和 Contact；Factory 关联资料准备和 Contact；Contact 可返回品类或 /manufacturing/#prepare，避免联系页自跳。

所有未知路径与 slug 返回真实 404。404 提供 Home / Manufacturing / Contact 的有效恢复路径，不回退为首页 200。

文章1进入 /manufacturing/#prepare，文章2进入 /manufacturing/#moq；都关联两品类和 Contact，可由面包屑或正文末尾返回 Journal。>=3 H2 的正文目录顺序对应 H2，固定前缀和去重后缀保证重建稳定。

商业六页和 Journal 有页首/页脚/移动三组禁用联系控件；Article 只有页脚/移动两组；Legal / 404 零组，不输出营销来源码或营销行。所有有效控件来源码与页面匹配，品牌后缀统一拼接。

## 移动与降级

菜单仍是非模态原生 details；无 JS 可访问全部已实现页面。启用增强时 Escape 关闭并恢复触发点焦点，链接点击不被阻止。菜单展开隐藏底部联系条，安全区和末尾内容避让继续保留。空渠道只能看到禁用按钮和明确说明，本站没有主动发送、自动复制或客户资料收集功能；手动选择文章模板是浏览器原生文本操作。不要把这一概念状态扩写成对所有浏览器/服务环境“从不处理数据”的政策承诺。
