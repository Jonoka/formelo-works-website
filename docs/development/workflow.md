# ChatGPT / GitHub / 本地协作

## 当前实际边界

GitHub 是代码和文档的版本基准，不是聊天附件自动同步工具。当前连接已读取私有仓库并成功创建 `chore/project-bootstrap`，具备 GitHub API 写入工具；每次新会话仍要重新读取仓库、分支与权限，不能假设环境永远相同。
本容器不能直接联网 Git 推送，但连接器可创建 blob / tree / commit 并更新分支。两种路径产生的提交都应在 GitHub 核实。插件写入不等于已经执行浏览器测试、Sanity 发布或网站部署。

## 一个任务一条分支

```text
读取最新分支和 base SHA
→ 网页开发环境或本地编辑
→ 检查 / 截图（记录实际执行）
→ 提交到任务分支
→ 创建 PR
→ 用户审阅后合并 main
→ 另一端 fetch / pull 后继续
```

同一任务不要在两个环境同时编辑同一分支。开始前检查工作树，先保存未提交工作，不执行自动 reset --hard、clean 或 force push。用户未要求合并时停在 PR。

## 本地新任务

```bash
git status --short
git switch main
git pull --ff-only origin main
git switch -c feat/homepage-shell
```

`pull --ff-only` 失败表示历史需要比较，停止并处理分叉，不强推。完成时只 add 本次相关文件；push 后提交 PR。已共享分支要同步主线时，避免重写他人的提交。

## 接续网页端分支

```bash
git fetch origin
git switch --track origin/feat/homepage-shell
# 本地分支已经存在时使用 git switch feat/homepage-shell
```

确认远端 HEAD 与上一端交付的 SHA 一致，再开始修改。不要用旧 ZIP 全量覆盖仓库。
网页任务交付至少说明 branch、base SHA、head SHA、变更、实际检查、未完成项和 PR / 推送状态；聊天中的代码或本地文件不等于已同步。

## 内容、素材与凭证

Git 保存代码、Markdown、schema 与必要素材；Sanity 的实际文章和图片另做导出备份。schema 提交不等于 CMS 内容更新。
原始需求 Markdown 保留为快照，新决定单独记录。Word 导出件和 PNG 原图在原会话 ZIP，仓库保存 768×1152 WebP 参考查看版。正式摄影与客户私密文件不得混入参考目录。
密钥只在本机安全环境或平台 secrets 中配置，不贴到聊天、不写进 Git，不为了工作方便授权所有私人仓库。

## 部署单独批准

私有仓库、受控预览、正式公开站是独立的授权决定。合并 main 不等于授权公开部署。当前 CI 仅检查资料，不部署、不连接 Sanity、不使用业务密钥。
后续应用完成后，以实际验证过的命令更新 README 与 AGENTS，不填写不存在的 npm 脚本。
