# PR #3 · CI 修复与首页排版回归

日期：2026-09-13。范围：原 `feat/homepage-visual` / PR #3；不合并、不部署、不连接 CMS。运行时保持 Node 24.21.0 / npm 11.19.1，依赖版本和根 lockfile 不变。

## 重新核验的基线

- main/base：`4f6690124e1e0e9831214be40b6414435348ad84`。
- 本轮开始时实际远端 head：`d3f162eebcacf1034a77fc4fbf0bd92e640f651a`。此前对话中的 `155840d...` 不作为远端提交或测试证据。
- 已下载并校验 CI 源码包；恢复后的 Git tree `a9f3a8437c3fe5aeae7f22db0b658756a806e2de` 与上述 head 完全一致。
- 旧失败运行 34749327759：运行时、安装、类型通过；实际为 22 项单元测试中 21 通过、1 失败；Astro 生成成功，后置检查拒绝内联脚本；浏览器步骤未执行。不能沿用此前不准确的测试计数或“零漏洞”表述。

## 修复方案复核与实施

**模型修复不是测试白名单。** `home: Page` 保留 CMS-shaped 的最小页面字段；`homepagePreview: HomePreview` 单独承载首页展示状态、服装占位图、演示品类和未发布选题。原来的逐字段 Sanity schema 对照测试保留，没有跳过未知字段，也没有为通过测试扩建 Studio。可选 `Page.heroImage` 仍为 `ApprovedImage`，本地 mock 不填假引用。新增预览字段隔离与快照独立性回归。

**脚本外置不等于允许第三方脚本。** 在既有 Astro 配置内添加 `vite.build.assetsInlineLimit: 0`，保留 `loadLocalEnvironment()`、`readRuntime()`、静态输出和 loopback。该配置也影响小 CSS / 图片自动内联；实际生成的资源继续接受本地路径检查。保留禁止内联脚本、内联事件和网络/API 调用的规则，新增“恰好一个站内增强模块”约束，防止删除脚本蒙混通过。11 项合成产物测试直接运行现有检查器，覆盖有效外置模块及内联、远端、伪 data-src、缺文件等拒绝场景；合成测试不是浏览器证据。

## 已核验的第一轮修复证据

模型提交：`03b41a437bda236d7e09d6617e25b2f706de8f86`。
脚本提交 / 本表测试 head：`c91cf7df2c58fb20345f4aa1cfa42f54f1bb8d21`。

[CI 34755125290](https://github.com/Jonoka/formelo-works-website/actions/runs/34755125290) 全部通过；测试 checkout 为 GitHub 合成 merge `606efdc850ed3bf7942634a0b55779922d5b8133`，不是向 main 合并。

| 检查 | 实际结果 |
|---|---|
| 固定运行时、npm ci、类型及 tokens | 通过 |
| 单元 / schema / 静态策略 fixture | 35 通过、0 失败、0 跳过 |
| Astro 构建及静态检查 | 通过；仅首页和 404；站内外置 module |
| Chromium：dev + static preview | 34 通过、0 失败、0 跳过 |
| npm run verify | 完整重跑通过 |
| 依赖审计高危门禁 | 通过；4 中危、0 高危、0 严重，不是零漏洞 |
| Python 安全回归 / 文档资产 / Bash 语法 | 14 项通过；文档资产和语法检查通过 |

中危链为 Sanity CLI → typeid-js → uuid；没有使用 audit fix --force、改变依赖或关闭 engine-strict。本轮执行宿主为私有 Linux CI；工作容器仅作源码处理、Python/Bash 检查和报告查看，没有用容器 Node 22 代替固定运行时做项目验收。WebCodex 工作区本轮未操作或验证同步。

## 首页排版衔接

实际查看已选参考图和 c91cf7d 的 1440 / 390 / 768 截图后，再单独修正：

- 首屏三段语义分行；提示放在本地展示模型，须与统一 title 相符。文案变化时以真实 `home.title` 为准，不显示过期分行副本。
- 桌面字号微调为 `clamp(4rem, 5vw, 4.6875rem)`；手机取消 14ch 人为限宽，保留自然换行与既有字体、色彩、双栏 / 堆叠规则。
- 给隐藏 `<br>` 的标题补真实空格，修复 768px 的 `Apparelcategories` 等粘连；增加读取渲染文本的回归，不删除原检查。
- 1440px / 390px 除全页截图外另留 viewport 截图；其他宽度和所有异常场景继续保留。

此后排版提交不借用 c91cf7d 的绿色状态。每个最终 head 必须重跑 CI；对应结果和 head/base/checkout SHA 存在私有 artifact 的 `review/source.json`、`outcomes.json`、`verify.txt`、浏览器 JSON/HTML 报告，并在 [PR #3](https://github.com/Jonoka/formelo-works-website/pull/3) 更新最终审阅记录。artifact 保留 14 天；浏览器截图也作为审阅附件交付。

## 未完成与边界

三张独立服装图依然 pending_generation，工厂图 awaiting_factory；没有本轮生图或真实产品/生产摄影验收。只检查现有 SVG 占位资源的加载/失败状态。DESIGN-01、ASSET-01、DEV-02、DEV-03 均不整项关闭。

浏览器范围仅固定 Playwright Chromium 的 Linux dev / preview：320、360、390、768、1024、1440px、键盘、无 JS、减少动态效果、图像失败、长文案与 200% 文本放大。后者不是浏览器 UI 真缩放。真机、Safari、Firefox、Edge、真实联系收发、CMS 联调、生产发布均未执行。绿色 CI 不代表首页视觉最终验收或可上线。
