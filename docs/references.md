# 参考依据与核实范围

项目依据：当前对话、三个导入 Markdown 文档、用户选定的首页设计图。
本次远端初始化的实际依据是 GitHub 连接器返回的仓库 metadata、main 提交、初始 README 和分支创建结果，详见初始化记录。不能用一般帮助文档概括替代当前实际接口与权限验证。

以下链接从上一轮启动包保留，作为后续实施查阅入口；本次不声称重新核对所有页面、软件版本或套餐。选用依赖和上线前需重新确认相关官方文档。

- **S1 — OpenAI / Connecting GitHub to ChatGPT**：历史平台说明，不能据其概括断言当前写入工具不可用。https://help.openai.com/en/articles/11145903
- **S2 — OpenAI / Codex cloud**：网页开发环境说明。https://developers.openai.com/codex/cloud/
- **S3 — GitHub flow**：分支、提交、PR、审阅与合并。https://docs.github.com/en/get-started/using-github/github-flow
- **S4 — Astro / On-demand rendering**：静态与服务端输出。https://docs.astro.build/en/guides/on-demand-rendering/
- **S5 — Sanity / Static and server rendering in Astro**：静态内容更新与重建。https://www.sanity.io/docs/astro/static-and-server-rendering
- **S6 — GitHub CLI**：本地安装与身份认证。https://cli.github.com/manual/
- **S7 — actions/checkout v4 ref**：原包固定 commit 为 `11d5960a326750d5838078e36cf38b85af677262`，不声称为最新主版本。https://api.github.com/repos/actions/checkout/git/ref/tags/v4

原 PRD 和 UI 归档保留原引用日期。页面数量、视觉变量、素材状态和工作分工是项目决定，不是平台保证或竞品测量结果。
