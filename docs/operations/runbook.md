# 项目操作手册

## 当前状态

私有仓库 `Jonoka/formelo-works-website` 已建立。本次初始化在 `chore/project-bootstrap`，通过 PR 审阅；不要再次运行新建仓库脚本，不向 main 强制推送。
`web/` 与 `studio/` 只有职责说明，尚无 Node 依赖或应用启动命令。

## 本地获取与检查

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
git fetch origin
# 初始化 PR 尚未合并时：
git switch --track origin/chore/project-bootstrap
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
bash -n scripts/publish-github.sh
```

本机完成 GitHub 身份认证，凭证不要进入 remote URL、聊天、文档或提交。每次编辑前检查 git status；遇到未提交内容先保存，不自动覆盖。

## 同步异常

核对 owner / repo、当前分支和远端 SHA。没有写入权限时停止，请用户授权该仓库，不扩大到全部仓库。
non-fast-forward 时先 fetch 并比较双方历史，合并或另开分支解决，不 force push。失败不得报告为成功，不删除远端仓库来重试。
GitHub API 写入时读取最新 base commit / tree，叠加本次变化，创建 commit 后仅更新任务分支；不要用空 tree 覆盖未知文件。

## 旧建仓脚本

`scripts/publish-github.sh` 只为最初离线启动包保留：创建不存在的私有仓库、校验后上传、拒绝同名库 / 错账号 / 已有 remote。当前仓库已存在，所以正常协作不使用此脚本。
其离线测试用 mock gh 和本地裸 Git 库，不会创建真实远端，也不能代表远端权限或 CI 成功。

## DEV-01 后补齐的运行资料

记录 Node / 包管理器 / 框架实测版本、lockfile、npm ci、mock 开发、构建、类型和链接检查命令。没有跑通的命令不得标成已验证。
Sanity 授权后补充项目、数据集和只读构建权限，文档只写环境变量名，不写密钥值。

## 后续发布与恢复

公开部署必须单独获准；内容与真实渠道确认、隐私配置、SEO 和质量验收通过后才能上线。
记录 code SHA、CMS 修订 / 备份和 deployment ID。代码回滚不等于 CMS 回滚；先修正错误内容，再恢复构建，防止再次发布错误版本。
联系方式从一处更新并做全站和真机收发回归。素材替换同步来源、审核、图注、裁切与状态，不只覆盖文件名。
