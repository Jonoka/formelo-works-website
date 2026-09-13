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

## 图片阻塞

生图实际返回一张新的无字三联画，不是三张独立源图。标准附件导入被 WebCodex 拒绝：`requires an explicitly trusted OAuth MCP client`。没有绕过信任限制；没有裁切该图或旧网页截图冒充三张正式资产；没有把图片写成假的 Sanity 引用。
独立图片接受数 0，仓库图片导入数 0。三个首页槽位继续明确 pending，工厂区域仍等待真实授权实拍。因此这不是完整首页视觉验收。

## 验证执行记录

当前 Windows runner 的默认运行时实际为 Node 24.12.0 / npm 11.6.2，与项目固定 Node 24.21.0 / npm 11.19.1 不同。没有用旧版本的运行结果冒充固定版本验收，也没有关闭 engine-strict 或修改 lockfile。固定运行时安装、类型、单测、构建、浏览器及审计交由现有 Linux 私有 CI 实际执行。

本地首次仓库检查失败：Windows 自动 CRLF 把已有 SVG 从已登记的 319 字节变为 323 字节。核对 git HEAD 的原始 blob 后，固定 `.gitattributes` 的 SVG 为 LF，并仅恢复该文件的原始换行。原 SVG 内容和 `a6b4d3cc...` 台账哈希不变；没有弱化哈希检查。AVIF/JPEG 也明确按二进制管理。

本文件首次提交时 CI 尚待执行；通过结果必须以本轮 PR #3 后续审阅评论和 artifact 中 `review/source.json`、`review/outcomes.json`、完整日志为准。source 记录 head/base/实际 checkout SHA，不能把旧 CI 结果当成本轮结果。
私有 artifact `homepage-review-<head SHA>` 保留 14 天，包含主视口和回归截图、Playwright HTML/JSON、日志、审计、静态构建输出与设计参考。截图不得仅留在 runner 临时目录。

未执行 / 不得冒称：真实手机、Safari、Firefox、Edge、真实浏览器 UI 200% 缩放、真实服装图片加载/裁切、邮箱与 WhatsApp 收发、真实 CMS、生产部署。Chromium 手机视口只是模拟。

## 剩余范围

DESIGN-01 首页待图片接入后的视觉审阅，品类演绎未做；ASSET-01 三张独立首页图与两文封面未完成；DEV-02 仅首页公共组件，跨页和真实渠道未做；DEV-03 Category 模板未做。最终十内容路由规划不变，本轮仍只有首页和既有工程 404。
