# 首页独立素材交接（未完成接入）

## 当前实际状态

本轮会话的生图工具返回一张新的无字服装三联画，不是三张独立源图。没有裁切它来宣称完成独立图片任务，也没有使用旧网页截图代替图片。
尝试标准 `import_conversation_files_to_project` 后，WebCodex 返回 `requires an explicitly trusted OAuth MCP client`。这是附件导入信任校验拒绝；没有改用编码传输或下载脚本绕过该限制。
因此本轮 **接受的独立概念资产 0、导入仓库图片 0、已接入首页图片 0**。三个目标条目继续 `pending_generation` / `path: null`。新三联画只在会话中，不是仓库或浏览器验收证据。

## 待补的三个独立文件

以下全是交接规格，不是已经存在或已测性能的文件。不要创建空文件去满足台账。

| 目标 ID | 独立源图建议 | 本地网页图计划 | 用途与替换 |
|---|---|---|---|
| HERO-001 | `assets/concepts/source/hero.png`，至少 1600×1600 | `web/public/media/concepts/hero-{480,800,1200}.{webp,avif}`，默认 1200 WebP | 奶白 T-shirt 与炭黑 Hoodie 静物；真实授权服装图替换 |
| CAT-TS-001 | `assets/concepts/source/t-shirt.png`，至少 1280×960 | `web/public/media/concepts/t-shirt-{360,640,960}.{webp,avif}`，默认 960 WebP | 单独 T-shirt；真实授权品类图替换 |
| CAT-HD-001 | `assets/concepts/source/hoodie.png`，至少 1280×960 | `web/public/media/concepts/hoodie-{360,640,960}.{webp,avif}`，默认 960 WebP | 单独 Hoodie；真实授权品类图替换 |

三张分别生成、分别检查，无文字、品牌、网页 UI、人物主导或工厂真实性暗示。统一柔光、暖中性色温、灰阶衣物与朴素台面。不要用整页或拼版截图充当服装资产。工厂区域仍只允许明确占位，之后由工厂提供可公开使用的实拍。
建议源图保留 PNG；网页图从各自源图正常缩放编码，不能放大低分辨率图伪称高清。Hero 最大 WebP 建议不超过 250 KiB；最终编码尺寸、质量、AVIF 兼容性和裁切以实际检查为准。

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

`PreviewImage.astro` 已根据状态输出持续可见的概念/待生成图注、AVIF/WebP picture、sizes、宽高、Hero 优先加载和品类懒加载。错误增强脚本仍独立打包，图片失败时明确显示失败文字；无 JS 时保留原生 alt、图注和布局。没有接受新图，因此真实服装图片的视觉裁切、压缩质量及失败路径尚未验收。

## 恢复条件

由 WebCodex 管理端核实当前连接的 OAuth MCP 客户端信任配置，按其正常授权流程恢复附件导入，再传入三张合格的独立图片。不要关闭校验、扩大仓库授权或在聊天里提供令牌。工具错误没有说明具体管理界面，不能据此断言某个设置开关的位置。
接入后在同一 `feat/homepage-visual` / PR #3 继续，更新 manifest、运行完整验证、私有保存 1440 / 390 截图，再进行用户视觉确认。AI 概念图确认不等于工厂事实或正式发布许可。
