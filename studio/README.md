# Sanity Studio · offline editorial foundation

本目录已准备独立 Studio 配置、类型检查和离线 schema 编译测试，但没有创建或连接 Sanity 项目，没有发布内容或部署 Studio。前端本地运行不依赖本目录的账号配置。

## 模型

四类文档为 `siteSettings`、`page`、`category`、`article`；原五个复用对象为 `seo`、`approvedImage`、`faq`、`moqPolicy`、`sample`。DEV-05A 新增七个复用 schema 类型（正文数组、表格/行、提示块、纯文本模板、内外链注解），共十六个类型，不创建作者文档、线索、客户上传、订单或页面构建器。

固定页面使用 `home`、`manufacturing`、`factory`、`contact`、`blogIndex`、`privacy` 六个 pageKey。Studio 结构入口固定文档 ID，隐藏通用页面新建以及固定文档的删除 / 复制操作。此为编辑界面约束，不是数据库权限或服务端唯一性保障。

当前两文的 H2/H3、段落、列表、strong/em、内外链接、简单表格、提示块与纯文本模板已有实际 schema、严格转换器和独立只读查询模块；映射及边界见 [CMS 文章映射](../docs/development/cms-editorial-mapping.md)。只接受两个既有 slug/来源码配对。作者/日期/人工事实审核/素材许可无生成默认值；Sanity 技术发布不能自动批准这些字段，更不代表网站已上线。Studio 仅离线编译，实际云端内容仍未验证。

固定页 templateContent、全站 loadContent 的 Sanity provider、真实内容/媒体与重建仍属未完成 DEV-05。当前普通页面全为 mock，CONTENT_MODE=sanity 继续失败；本地 ArticlePreview 与 tests 夹具都不是可发布的 Sanity seed。

## 不需要账号的检查

统一使用 Node 24.21.0 / npm 11.19.1，从仓库根目录运行；版本与根 lockfile 的一致性由 `npm run check:runtime` 检查：

```bash
npm ci
npm run check
npm test
```

类型检查和 schema 编译不读取云端数据，不需要假的项目 ID、token 或示例工厂文档。

## 取得授权后才运行 Studio

在启动进程环境或本目录被 Git 忽略的 `.env.local` 中填写实际授权的 `SANITY_STUDIO_PROJECT_ID` 与 `SANITY_STUDIO_DATASET`，然后从仓库根目录运行：

```bash
npm run studio:dev
# 仅本机：http://127.0.0.1:3333
npm run studio:build
```

未配置时命令会以 `STUDIO_NOT_CONFIGURED` 停止；公开前缀下发现凭证变量则以 `STUDIO_PUBLIC_SECRET_FORBIDDEN` 停止，错误不回显值。不会猜测账号、自动创建数据集或静默使用演示项目。不要把密钥加入上述公开前缀的变量：Studio 变量会进入客户端代码。授权登录、CORS、编辑角色、数据集可见性和实际构建仍需账号持有人在 DEV-05 验证。

没有部署脚本或部署目标；禁止运行 `sanity deploy` / schema deploy 或对真实数据进行 seed、导入、迁移。CLI 包装器设置 `DO_NOT_TRACK=1`，不修改全局遥测配置。依赖选择与实际执行记录见 [DEV-01 验证记录](../docs/operations/dev-01-verification.md)。

本轮安装版本 Sanity/@sanity/schema 5.31.2，未升级主版本；新增表格用兼容对象，而非要求 v6.6.0 的新版内置编辑器。四个中危依赖条目的当前审计必须在真实 Studio 使用前复核，不宣称零漏洞。离线 130 项测试、平台和最终 head 记录见 [DEV-05A 验证](../docs/operations/cms-editorial-verification.md)。只读联调同样需要明确项目/数据集、指定文档与引用/资产权限；写入测试稿、媒体上传或发布/撤回必须另外获准。
