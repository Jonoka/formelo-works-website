# Sanity Studio · configuration and schema skeleton

本目录已准备独立 Studio 配置、类型检查和离线 schema 编译测试，但没有创建或连接 Sanity 项目，没有发布内容或部署 Studio。前端本地运行不依赖本目录的账号配置。

## 模型

四类文档为 `siteSettings`、`page`、`category`、`article`；五个复用对象为 `seo`、`approvedImage`、`faq`、`moqPolicy`、`sample`。不创建线索、客户上传或业务订单模型。

固定页面使用 `home`、`manufacturing`、`factory`、`contact`、`blogIndex`、`privacy` 六个 pageKey。Studio 结构入口固定文档 ID，隐藏通用页面新建以及固定文档的删除 / 复制操作。此为编辑界面约束，不是数据库权限或服务端唯一性保障。

图片审核、alt、slug、MOQ 条件、确认日期和文章日期已有基础校验。页面特有的 templateContent、完整发布前校验、Sanity 到共享内容类型的映射、只读查询、真实内容验证与重建均留在 DEV-05；本地 mock 不是可直接发布的 Sanity seed。

## 不需要账号的检查

从仓库根目录：

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

未配置时命令会以 `STUDIO_NOT_CONFIGURED` 停止；不会猜测账号、自动创建数据集或静默使用演示项目。不要把密钥加入上述公开前缀的变量：Studio 变量会进入客户端代码。授权登录、CORS、编辑角色、数据集可见性和实际构建仍需账号持有人在 DEV-05 验证。

没有部署脚本或部署目标；禁止运行 `sanity deploy` / schema deploy 或对真实数据进行 seed、导入、迁移。CLI 包装器设置 `DO_NOT_TRACK=1`，不修改全局遥测配置。依赖选择与实际执行记录见 [DEV-01 验证记录](../docs/operations/dev-01-verification.md)。
