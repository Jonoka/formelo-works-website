# Journal / Article / Legal 设计衔接

## 基线与顺序

沿用选定 assets/reference/homepage-selected-v1.webp 与 PR #5 已验收 head 3600f9558465f247dceaa8234971dd9ca0c8a204；分支基于合并 main 4469a1735465435508a3e510fcb6602e848a5264。实际查看了选定参考和 PR #5 六页 1440/390 截图组合，不把 PR #4 比较图当成当前基线。CI before 现改为重新渲染 PR #5 六页。

先实现共用 Article 与完整 quote-guide-preview.ts，实际构建并捕获第一篇 1440/390 全页/首屏/表格/手动模板。通过 WebCodex 独立测试浏览器窗口实际查看后才加入第二篇 MOQ 草稿。检查点位于 .local/journal-privacy-review/quote-first，source.json 说明它是未提交检查点并绑定当时源文件 SHA-256；不能拿它冒充最终 PR head 截图。

## 共用视觉与阅读

不改选定的暖白、炭黑、砖红、细分割线、Georgia 编辑式标题和深色页脚；不增字体包。文章正文最大 760px，桌面左侧约 240px 非固定目录，1024px 以下排成单列目录/正文。手机长标题自然换行；段落/链接/模板/表格单元格允许长词换行。表格保留 caption、列/行表头和可键盘访问的区域；不改造成不可读图片。手动询价模板为 pre-wrap 的原生文本，无复制按钮或下载。

文章完整静态输出 H2/H3、段落、列表、表格、提示和手动模板。三个及以上 H2 提供目录；heading 文本生成 section- 前缀 slug，所有 H2/H3 共用去重集合，依次后缀避免冲突。目录只列 H2，按正文顺序；无运行时生成日期或 JS 才出现的正文。

文章面包屑 Home → Journal → 当前标题。Journal 父栏目只高亮链接，不使用 aria-current；真正当前项为不可点击文本。普通内页保留两级面包屑。

## 页面与来源码

| 类型 | 内容与状态 | 联系组件 |
|---|---|---|
| Journal | 两篇完整本地草稿卡；标题/摘要/概念封面/Editorial draft / Not published | WEB-BLOG，页首、页脚、移动三组 |
| Quote Article | 完整准备指导、数量/预算/未知项、手动询价模板及清单 | WEB-QUOTE-GUIDE，页脚、移动两组 |
| MOQ Article | 单位解释、混码、面辅料待问问题、明确假设数值 | WEB-MOQ-GUIDE，页脚、移动两组 |
| Privacy | Draft privacy notice — not in effect；当前事实与未来待补分开 | null；普通页脚，无营销区或固定条 |
| 404 | 原恢复路径保留 | null；无营销区或固定条 |

首页只更新原 #journal 区域为两篇草稿卡片；原六页结构/概念图保持。顶部和页脚 Journal 到 /blog/，Privacy 页脚有效。Legal 使用约 820px 单列文本，不加封面、插图、订阅或 Cookie 管理系统。

## 内容模型与来源边界

shared/editorial.ts 为本轮受控 local preview，不是任意页面编辑器或 Portable Text。loadContent 明确校验两篇 ArticlePreview 和 PrivacyPreview，正式 Sanity Article 列表仍为空；没有 _id/_type/假 asset._ref/假审核记录。两文 draftUpdatedAt:null，不显示作者、发布时间、审核时间；source allowlist 的 reviewedAt 只记录真实来源链接检查，不是文章审核通过日期。

只允许已规划且已实现的站内路径与明确锚点，以及 config/editorial-sources.json 的精确 HTTPS 来源。来源 a 元素含 nofollow/noreferrer/noopener，不加载其资源；脚本、iframe、HTML 节点、危险协议、额外事件字段均拒绝。普通字符串由 Astro 文本表达式转义，不用 set:html。

MOQ 定义引用 Shopify 自有解释页面，实际核对其 Definition 与 Simple/complex constraints 部分；不采用其中营销统计或把一般定义当工厂规则。其余文字为原创问题整理，算例假设每款每色 60、合计 180，仅说明算术和约束差别，不写入 factory.defaultMoq。报价草稿未把“无 Tech Pack 可开始讨论”写成设计服务保证。

## 素材台账

三张已有服装图及其 sourceImage、原尺寸、SHA-256、WebP/AVIF rendition 清单均保留。文章/首页/Journal 卡片复用 CAT-TS-001 和 CAT-HD-001，16:9 CSS 裁切；没有新二进制、假尺寸或假资产引用。manifest 的 JOURNAL-QUOTE-001 / JOURNAL-MOQ-001 仍 pending_generation、path:null、productionAllowed:false，conceptFallback 指向准确既有记录和用途。

两篇独立封面尚未制作/导入/审批，不把 ASSET-01 标完成。暂用图在页面同时标明复用和 dedicated cover pending。后续可制作独立无字无品牌静物，需真实来源、文件尺寸、哈希、响应式版本及替换记录；不虚构客户 Tech Pack、订单、证书或工厂证据。

## 审阅边界

[验证记录](../operations/journal-privacy-verification.md) 区分实际 Windows、Linux CI、截图检查与未做项目。200% 是 CSS 文字放大测试，不伪称真实浏览器菜单缩放或真机。已实现十页概念结构不代表生产上线；真实工厂资料、CMS、联系方式与实际 Privacy 另行审核。本轮后不扩栏目。
