# 技术实施边界与目录

## 当前状态

本仓库包仅包含开工资料、参考资产、配置样例和检查脚本。
`web/`、`studio/` 目前只有 README，不是已初始化应用；无 package.json、lockfile、Sanity 项目或部署配置。

## 首个工程任务的建议

采用根目录轻量 npm workspaces：`web/` 为 Astro + TypeScript 静态前端，`studio/` 为 Sanity Studio。
使用一种包管理器；实际选兼容稳定版本后固定 Node、npm、依赖与根 lockfile，在本地和云环境执行同样的 `npm ci` / 构建 / 检查。
这里不预写未经安装验证的版本号或假的 lockfile。采用 workspaces 是实施建议，不是已确认新功能。

Astro 的静态输出在构建期生成公开 HTML；Sanity 内容发布需要触发重建才能体现在静态站。[S4][S5] 不因为使用 CMS 就建设客户数据库或询盘 API。

```text
web/src/{pages,layouts,components,lib,styles,types}
studio/{schemaTypes,objects}
config/                 当前示例和计划路由，后续构建读取需实现
assets/reference/       不进入网站发布目录
docs/                   版本化需求与交接
scripts/                检查与本机初始化
```

## 内容来源与模式

原型用本地 mock 内容；正式使用 Sanity。两者映射到同一个 TypeScript 内容结构，不在每个页面写一套不同数据源。
四类 CMS：siteSettings、page、category、article。samples、FAQ、MOQ、SEO 和 image 是嵌套对象，按 PRD 定义。
概念模式与是否 private 是不同概念：mock 可以有占位，但预览仍必须是受控的。任何公网地址都要得到用户明确授权。

`site.example.json` 只做格式演示，不放真实联系账号 / 密钥；代码实现后 mock config 与 CMS settings 保持同一字段语义。
用 `CONCEPT_MODE` / `CONTENT_MODE` 在构建期决定来源及发布检查，不能只靠浏览器端隐藏占位。生产模式禁止静默回退到 mock。

## 可替换品牌与媒体

文字 Logo 从配置渲染。参考图不放 `web/public`；图片资产要有角色、审核与替换状态。
不复制字体文件；字体选择、合法来源和网络加载预算在 DEV-02 实现时决定。
独立图片交付前可用明确占位框，不从网页截图自动裁切带字图。

## 发布、内容同步与备份

Git 存代码、schema、seed / mock、必要媒体和文档；Sanity Content Lake 内容不是 Git 自动同步的一部分。
正式运营需要内容导出、图片资产管理、构建触发与部署记录；不要把数据库导出、客户资料、部署 token 直接进仓库。
`Git commit`、`CMS publish`、`site deployment` 三个状态分别记录。
本包 CI 只检查文档 / 配置 / 初始化脚本，不连接 Sanity、不传 secrets、不部署。
框架和托管部署见任务 DEV-01 / DEV-07；具体商用许可、账号及费用上线前单独核实。

来源：[S4][S5] 见 [references.md](../references.md)。
