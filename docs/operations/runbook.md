# 项目操作手册

## 当前状态

私有仓库 `Jonoka/formelo-works-website` 的初始化 PR #1 已合并。DEV-01 在 `feat/project-foundation` 开发工程底座，不向 main 直接写入或强制推送。
`web/` 为本地 mock 静态工程，`studio/` 为独立配置与模型骨架；没有账号接入或部署。启动和检查命令见根 README。

## 本地获取与检查

```bash
git clone https://github.com/Jonoka/formelo-works-website.git
cd formelo-works-website
git fetch origin
# DEV-01 PR 尚未合并时：
git switch --track origin/feat/project-foundation
npm ci
npm exec -- playwright install chromium
npm run verify
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

## DEV-01 运行与验证

运行时、依赖取舍、实际命令结果及环境限制记录在 [DEV-01 验证记录](dev-01-verification.md)。Node 24.12.0 / npm 11.6.2；不使用其他包管理器，不手写 lockfile。升级依赖必须重新执行 npm ci、审计及完整工程回归，不能仅修改版本号。

本地开发仅监听 127.0.0.1。浏览器测试需 4321 / 4322 空闲；先停止自己启动的本项目服务器，不强行杀死不明进程。遇到内存分配失败应记录环境和失败日志，不把未执行的后续步骤算作通过；Linux CI 结果单独记录。

Sanity 授权后补充真实项目、数据集和只读构建权限，文档只写环境变量名，不写密钥值。未配置的 Studio 应明确失败，而不是填入演示账号以制造构建成功。

## 后续发布与恢复

公开部署必须单独获准；内容与真实渠道确认、隐私配置、SEO 和质量验收通过后才能上线。
记录 code SHA、CMS 修订 / 备份和 deployment ID。代码回滚不等于 CMS 回滚；先修正错误内容，再恢复构建，防止再次发布错误版本。
联系方式从一处更新并做全站和真机收发回归。素材替换同步来源、审核、图注、裁切与状态，不只覆盖文件名。
