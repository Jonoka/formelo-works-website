# 品类模板衔接 / PR #4

## 基线与先后顺序

PR #3 已合并；本轮 base/main 为 `ef92f55955c2ab761d282c3c86fa8e663856424f`，继续 `feat/category-pages`，只有 PR #4。实际查看选定 WebP 和 PR #3 最终私有 artifact `10332406114` 中 1440/390 截图。保留衬线编辑式、暖白/炭黑、砖红 CTA、细线及深色页脚。

先实现 T-shirts。检查点 `638c4a36c5a95ebd40ae55b3b8490580190a1769` / CI `34816140050` 的首屏和全页 1440/390 截图已实际查看，六个宽度与原首页回归通过后，才复用模板到 Hoodies。桌面为文案/图像双栏，手机为自然堆叠；概念观察、讨论清单、MOQ/打样、FAQ 和关联品类用相同模板，不开样品详情或空汇总页。

## 首页仅三个调整

1. 简述收敛为 fabric/fit/finish 一句；将小 MOQ 概念定位放在眉题，保留紧邻的未确认说明。去掉与简介重复的 Ideas/Materials/Fit/Finish 装饰行。手机仅调整 Hero 内部间距，正文仍为 16px，不设固定首屏高度、不裁正文。390x844 的定位、联系和可辨识服装部分以当前截图和 first-fold metrics 核对；320px 与文字放大允许自然增高。
2. 全局概念提示、每图 AI 图注和每组禁用联系说明继续存在；删除页脚同一区域重复的联系方式解释。工厂待补、概念非生产证据和 MOQ/打样未确认边界不变。
3. 所有移动联系入口统一 WhatsApp/Email、同一箭头、内边距与换行规则；能力区缩短描述。底条仍有安全区和菜单展开隐藏；JS 测量实际高度，CSS 的 rem 预留为空 JS 兜底。

## 两类差异与素材

T-shirts 讨论 jersey、领口、身体/袖长比例、图案位置及下摆；Hoodies 讨论帽型、叠穿空间、内里、口袋/拉链、罗纹与抽绳。FAQ、正文和 MOQ/打样讨论分别编写，不写已确认工艺、克重、起订量、交期或价格。T-shirt 的折叠图不能证明完整版型，文案明确要求另带全长参考。

不新增/重新生成图片。首页继续用 HERO-001/CAT-TS-001/CAT-HD-001；T-shirts 复用 CAT-TS-001，Hoodies 复用 CAT-HD-001。所有源图、响应式版本、尺寸、哈希和来源保持 assets/manifest.json 原登记；每页只有一个概念图，三个文字观察点不是三组样品，也没有不同裁切假称多组样品。工厂图仍待真实摄影。

## 内容与导航

loadContent 是单一入口；CategoryPreview 与正式 Sanity Category/Sample 分开，没有 fake asset._ref、工厂确认日期或生产批准。首页品类卡由同一组 preview 数据映射，两页共用 CategoryLayout/PreviewImage/PendingContact。联系上下文分别为 WEB-TSHIRTS/WEB-HOODIES，但联系方式仍 null/disabled。

面包屑只有 Home → 当前品类；两类互访、Logo 回首页。Clothing 和手机菜单进入实际品类；Manufacturing/Factory/Journal/Contact 仍为 /#capabilities、/#factory、/#journal、/#contact。未发布文章没有链接。概念页仍 noindex、无假 canonical/sitemap、production 阻断、CMS 不回退。

## 后续项，不在本輪无限打磨

正式字体授权及细小字形/图标/装饰统一留后续。正式工厂能力、每品类至少三组获准真实样品及编号、真实工厂摄影、MOQ/打样规则、渠道收发和其他内页仍是上线前待办。现有三张概念图的视觉认可不等于生产授权。Safari/Firefox/真机、真实浏览器 UI 缩放和真实渠道未测试，不标通过。
