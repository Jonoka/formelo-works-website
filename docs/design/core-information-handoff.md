# 核心信息内页设计衔接

## 基线与先后顺序

本轮基于已合并 PR #4：验收 head `4116c2c2d40c16abfb078fe4805089556595f569`，实际 main/base `59ba085c25dc8ab412803b8b5afea7604d450756`。沿用 [视觉基线](visual-baseline.md) 和 [品类衔接](category-handoff.md)，不重新探索风格。

实际查看选定参考图及 PR #4 对应私有 artifact `10340540050` 的首页、T-shirts、Hoodies 1440/390 截图衍生缩览。缩览用于构图与断行判断，原始 PNG 留在私有审阅资料中，不宣称缩览可作原像素清晰度验收。

先实现 Manufacturing，再运行 Windows 类型检查、Astro 构建和 Chromium 1440/390 捕获。桌面首屏 1440×900、手机首屏 390×844；全页分别 1440×4029、390×8379。首阶段检查确认单 H1、六锚点、来源码、空渠道及无横向溢出，实际查看该捕获的组合缩览后才推进 Factory / Contact。源绑定在 `.local/core-information-review/manufacturing-first/source.json`：当时 HEAD 为 base，文件级哈希绑定未提交的工作树，不把它误写成最终提交截图。

## 共同视觉与页面差异

仍使用暖白、炭黑衬线标题、砖红禁用联系入口、细分隔线和深色页脚。没有新增字体、配色系统、AI 图或装饰性大图。公共 BaseLayout、SectionHeading、FAQ、Button/PendingContact 与导航增强继续使用。

Manufacturing 是有右侧目录的编辑式采购指南；手机目录自然落在介绍和双入口之后。六个分区区分方式讨论、数量影响、资料、打样、概念流程和 FAQ。不写示例业务数字，不把可讨论选项包装成已确认服务。

Factory 用介绍与待补实拍图位组成首屏，随后是制造责任说明和横向质检讨论框架；手机自然堆叠。图位沿用首页的清楚文字与朴素边框，由同一组件校验 FACTORY-001 的 awaiting_factory 状态。没有照片、证书或案例时不制造经营证据。

Contact 用简短邀请与渠道/人员/时间/地址状态面板作为首屏，随后给出准备清单和返回品类的路径。没有表单、必填输入、上传、复制假地址或成功状态。真实渠道未配置时不写随机号码、示例收件人或默认工作时区。

## 有限跨页整理

Header / Footer 的 Manufacturing、Our Factory、Contact 指向新内页；Process 指向制造页 production 锚点。当前导航项为带 aria-current 的文本，不跳转自身。Journal 仍指向首页真实区块；Privacy 保持不可用。共享面包屑只包含 Home 与当前页面，不创建 Clothing 汇总父页。

首页只补制造/工厂/流程摘要链接，并复用原工厂图位组件；原区块 ID 和首屏图文布局保留。品类只增加 MOQ、打样、工厂及联系内链，T-shirt 这个短词不再在连字符处拆行，整个标题仍可自然重排。没有删减真实性标记或改成样品目录。

六页来源码由 config/page-context.ts 集中，页首、页脚和手机条要求显式传入。标题品牌尾缀由 BaseLayout 拼接；不再在品类 SEO 文字中写死临时品牌。

## 审阅与未覆盖范围

最终截图、视口、异常状态和平台结果见 [验证记录](../operations/core-information-verification.md)。320/360/390/768/1024/1440 为布局检查范围；200% 测试是 CSS 文字放大，不等于浏览器 UI 真实缩放。真机、Safari/Firefox/Edge、真实渠道、真实图片、工厂事实与 CMS 审核仍是后续工作。
