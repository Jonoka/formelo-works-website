# 首页独立素材交接与接入

## 当前实际状态

首次返回的无字服装三联画仍被拒绝，没有裁切或当成三张独立资产。随后分别生成 Hero、T-shirt、Hoodie 三张独立、无文字、无品牌概念图，材质方向为用户选择的厚实哑光，并保持统一暖色温和静物语言。
标准 `import_conversation_files_to_project` 仍因 `requires an explicitly trusted OAuth MCP client` 被拒绝，没有绕过信任校验。用户把本会话生成的 `formelo-homepage-concept-assets.zip` 放入项目根目录；接入前验证 ZIP SHA-256 `a7bc678f02ee0552ff765352e0746b7c4ce30a88ae84f8f690160709068bd8c1`，并逐项核对包内 21 个图片文件的哈希、字节数、格式、尺寸和路径安全。只提取约定资产后删除临时 ZIP。
当前 **接受的独立概念资产 3、仓库图片文件 21、首页已接入图片 3**。三个目标条目均为 `generated_concept`，`productionAllowed: false`、`approval: pending_user_review`、`replacementRequiredBeforeLaunch: true`。它们不是 Sanity asset、工厂样品或生产证据。

## 已接入的三个独立文件

| 目标 ID | 独立源图 | 本地网页版本 | 当前用途与替换 |
|---|---|---|---|
| HERO-001 | `assets/concepts/source/hero.png`，1254×1254 PNG | `hero-{480,800,1200}.{webp,avif}`；默认 1200 WebP 85,198 bytes | 奶白 T-shirt + 炭黑 Hoodie 静物；上线前替换真实授权服装图 |
| CAT-TS-001 | `assets/concepts/source/t-shirt.png`，1448×1086 PNG | `t-shirt-{360,640,960}.{webp,avif}`；默认 960 WebP | 单独 T-shirt；上线前替换真实授权品类图 |
| CAT-HD-001 | `assets/concepts/source/hoodie.png`，1448×1086 PNG | `hoodie-{360,640,960}.{webp,avif}`；默认 960 WebP | 单独 Hoodie；上线前替换真实授权品类图 |

三张源图分别保留，网页版本均从各自源图正常缩小编码，没有把参考截图或拼版图裁成正式素材。Hero 源图低于早期建议的 1600×1600，但最大网页版本为 1200×1200，仍低于源尺寸，没有放大伪称高清；最大 WebP 约 83 KiB，低于 250 KiB 的建议预算。工厂区域仍只允许明确占位，之后由工厂提供可公开使用的实拍。

## 已实现的本地接口

`web/src/content/local-media.ts` 的 `localPreviewFromManifest` 是首页三个槽位的单一入口。它只读取本地台账，不构造 Sanity `asset._ref`。

待生成态必须明确 `status: pending_generation`、`path: null`、`productionAllowed: false`、`replacementRequiredBeforeLaunch: true`，才可返回已登记的 UI 占位。
准备好真实文件后，单个目标记录转为 `generated_concept`，必须同时填写：

- `source: AI-generated concept`、`conceptStatus: concept_only`、`generationOutput: independent_image`、`approval: pending_user_review`。这不是生产授权。
- `path` 为默认本地 WebP 的仓库路径，`dimensions` 含实际宽高，`format`、`sizeBytes`、`sha256` 均对应这个文件。
- `sourceImage` 含独立源文件的 `path`、`width`、`height`、`format`、`sizeBytes`、`sha256`。
- `renditions` 中每项为 `path`、`width`、`height`、`format`、`sizeBytes`、`sha256`；至少 WebP，并按实际生成情况提供 AVIF。宽高比匹配默认图，不超过源图，不登记未生成的格式。
- 保留 `role` 和发布前真实图片替换要求，以及 `productionAllowed: false`。

台账状态未知、来源不正确、路径越界、源图来自参考区、混淆 MIME/扩展名、重复尺寸或 ready 条目缺图，均不能静默回退。仓库检查验证源文件和所有网页版本的存在、字节数、哈希、文件头及元数据；浏览器检查验证实际加载与图像宽高比。单元测试中的内存元数据和文件头桩只用于负面回归，不是生成资产。

`PreviewImage.astro` 根据状态输出持续可见的 `AI-generated garment concept — not a factory sample.` 图注、AVIF/WebP `picture`、`sizes`、宽高、Hero 优先加载和品类懒加载。错误增强脚本仍独立打包，图片失败时明确显示失败文字；无 JS 时保留原生 alt、图注和布局。浏览器回归必须同时验证三张概念图正常解码与普通 / 无 JS 图片失败场景。

## 后续替换与传输限制

WebCodex 的 ChatGPT 附件导入 OAuth 信任问题仍存在，但不再阻塞当前三张图片接入；本次通过用户放入经验证的本会话 ZIP 完成了有限、可审计的传输。不要因此关闭附件信任校验、扩大仓库授权或在聊天里提供令牌。
三张 AI 概念图仍需用户在实际 1440 / 390 浏览器截图中做视觉确认；确认概念方向也不等于工厂事实或生产授权。正式上线前仍必须用真实、获授权的产品 / 工厂素材替换相应概念和占位，并重新执行图片与页面验收。
