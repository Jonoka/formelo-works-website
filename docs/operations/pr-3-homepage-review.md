# PR #3 首页继续开发记录

## 进入本轮时的前置核对

仓库 `Jonoka/formelo-works-website` 可访问且为 private。PR #2 已合并到 main；PR #3 为 open draft。
base/main：`4f6690124e1e0e9831214be40b6414435348ad84`。
进入本轮远端 feature head：`7d7cc14bcfd5b1edb9b25780bf78102dca560597`。
继续现有 `feat/homepage-visual`，本地原分支从 main 快进至远端 head 后再叠加改动；没有新分支、替代 PR、强制推送、自动合并或部署。

## 已保留的修复

[上一轮 CI 修复记录](pr-3-ci-repair.md) 保留为历史证据，不改写其通过结果。本轮保留 Page 与 HomePreview 分离、schema 对应测试、快照隔离、Astro `assetsInlineLimit: 0`、恰好一个本地外置增强模块、生产构建阻断和未实现 provider 不回退。

## 改动范围

首页英文客户文案和独立未确认说明；共享区块标题与导航；正文可读性；manifest 驱动本地图片状态与 fail-closed 接口；可见图片加载失败说明；素材 provenance / 文件哈希 / MIME 回归；新无 JS 图片失败浏览器用例和私有报告。
设计说明见 [首页衔接](../design/homepage-handoff.md)，素材状态与准确接口见 [素材交接](../design/homepage-asset-handoff.md)。

## 图片生成与接入

首次生图返回的无字三联画继续保持拒绝状态，没有裁切或冒充三张独立资产。随后分别生成 Hero、T-shirt、Hoodie 三张独立、无文字、无品牌概念图，用户选择厚实哑光的材质方向。
标准 ChatGPT → WebCodex 附件导入仍被 `requires an explicitly trusted OAuth MCP client` 拒绝；没有绕过该信任校验。改由用户把本会话生成的 `formelo-homepage-concept-assets.zip` 放入项目根目录。接入前验证 ZIP SHA-256 `a7bc678f02ee0552ff765352e0746b7c4ce30a88ae84f8f690160709068bd8c1`，并逐个核对 21 个图片文件的哈希、字节数、格式、尺寸和路径安全后，只提取约定资产，临时 ZIP 随后删除。
当前三个首页槽位均由本地 `generated_concept` 资产驱动，不是 Sanity 引用；`productionAllowed` 保持 false、`approval` 保持 `pending_user_review`、上线前必须替换。Hero 源图 1254×1254，最大 WebP/AVIF 1200×1200；T-shirt / Hoodie 源图 1448×1086，最大网页版本 960×720。工厂区域仍只等待真实授权实拍，不生成 AI 工厂图。

## 验证执行记录

当前 Windows runner 的默认运行时实际为 Node 24.12.0 / npm 11.6.2，与项目固定 Node 24.21.0 / npm 11.19.1 不同。没有用旧版本的运行结果冒充固定版本验收，也没有关闭 engine-strict 或修改 lockfile。固定运行时安装、类型、单测、构建、浏览器及审计交由现有 Linux 私有 CI 实际执行。

本地首次仓库检查失败：Windows 自动 CRLF 把已有 SVG 从已登记的 319 字节变为 323 字节。核对 git HEAD 的原始 blob 后，固定 `.gitattributes` 的 SVG 为 LF，并仅恢复该文件的原始换行。原 SVG 内容和 `a6b4d3cc...` 台账哈希不变；没有弱化哈希检查。AVIF/JPEG 也明确按二进制管理。

本轮首个实现提交 `0c0b372f5d22bd834ec0c03e0319f36f0fa6ab31` 的 [CI 34767628851](https://github.com/Jonoka/formelo-works-website/actions/runs/34767628851) 已完成，bootstrap / foundation 均 success。已实际下载 artifact 并读取 source/outcomes、单测、构建、浏览器和审计日志；不是沿用 7d7cc14 的旧绿色状态。该次实际 checkout 为 `40eac45ae74ee27030c32ffaa191c554afe92019`（PR 合成 merge，不是合并到 main）。

| 检查 | 该提交实际结果 |
|---|---|
| Node / npm | 24.21.0 / 11.19.1，固定版本核验通过 |
| npm ci / Chromium 安装 | 通过；单一 lockfile 不变 |
| 类型 / tokens | 通过；Astro 0 errors / warnings / hints |
| 单元、schema、生产阻断、静态策略 | 41 通过、0 失败、0 跳过 |
| Astro / 静态输出 | 通过；仅首页与 404，本地外置增强脚本 |
| Chromium dev + static preview | 40 通过、0 失败、0 跳过、0 flaky |
| npm run verify | 完整重跑通过（不把重复执行累加成测试数量） |
| Python / 文档资产 / Bash 语法 | 20 项 Python 测试通过，另两项检查通过 |
| npm audit --audit-level=high | 门禁通过；4 中危，0 高危，0 严重 |

[该次私有截图和报告](https://github.com/Jonoka/formelo-works-website/actions/runs/34767628851/artifacts/10320968530) 的 artifact 名为 `homepage-review-0c0b372f5d22bd834ec0c03e0319f36f0fa6ab31`；GitHub 返回 ZIP digest `sha256:010ad3b696ae2a4a83273364fbda30d8495707fe2f9fe18090c19b79e024fd6f`，有效至 2026-09-27 16:10 UTC。已实际查看其 1440 / 390 首屏的等比例预览。

后续补齐本记录，并将 Header 品牌链接触达高度接入现有 48px token、正文声明引用现有 body token，在六个视口测试中检查品牌链接高度；不改设计色彩、版式方向或工厂事实。最终 head 的 CI / artifact 由 PR #3 最新审阅摘要与 `review/source.json` 标识；本段历史结果只绑定上述 0c0b372，不能自动冒充后续提交的通过结果。
私有 artifact `homepage-review-<head SHA>` 保留 14 天，包含主视口和回归截图、Playwright HTML/JSON、日志、审计、静态构建输出与设计参考。截图不得仅留在 runner 临时目录。

审计的四个中危条目涉及现有 `sanity`、`@sanity/cli`、`typeid-js`、`uuid`；未用 force 修复或修改依赖图掩盖问题。CI 另报告既有 checkout/upload action 的 Node 20 元数据弃用警告（runner 强制以 Node 24 执行）；这是动作运行时提示，不等于项目使用了 Node 20，本轮未擅自升级动作版本。

未执行 / 不得冒称：真实手机、Safari、Firefox、Edge、真实浏览器 UI 200% 缩放、真实服装图片加载/裁切、邮箱与 WhatsApp 收发、真实 CMS、生产部署。Chromium 手机视口只是模拟。

## 剩余范围

DESIGN-01 首页待图片接入后的视觉审阅，品类演绎未做；ASSET-01 三张独立首页图与两文封面未完成；DEV-02 仅首页公共组件，跨页和真实渠道未做；DEV-03 Category 模板未做。最终十内容路由规划不变，本轮仍只有首页和既有工程 404。
