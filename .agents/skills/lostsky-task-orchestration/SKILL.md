---
name: lostsky-task-orchestration
description: 编排 LostSky 批量任务、多个独立写入步骤，以及任务隔离和集成；分派文件所有权并执行本地 Git 保全验证。不用于单纯问答或无独立交付的小修改。
---

# 日常任务编排

先读项目唯一规则正文 [任务编排](../../../docs/dev/development/contributing.md#task-orchestration)，同时遵循该页的工作区保护与 Git 生命周期。本文只提供执行入口；授权边界以用户本次任务与正文为准。

- 列出独立交付目标、依赖契约、文件 owner 和验证门禁；独立交付使用各自分支与 worktree。同一目标下文件互斥的子步骤可共享 worktree，跨步骤依赖先由上游明确契约再启动下游。
- 当前聊天用协作工具分派子代理，不为每个小步骤创建聊天。前端交 Astra，非前端实现交 Sol，只读检索/执行测试可交 Luna；角色与调用方式以正文为准。
- Git 变更统一交 `lostsky-git` 串行执行。日常本地分支、提交和通过门禁后的整合限于用户已授权范围；push、部署与删除各自核对授权，不由本地整合推导。
- 交接当前 owner、worktree、分支、验证对应 SHA 与尚未处理的现场；由 Git 代理按正文完成生命周期结论。

## 临时保全入口

脚本要求 Python 3.8+ 和可执行的 Git，仅使用 Python 标准库。

需要保全已有 dirty/untracked 时，Git 代理先核对本任务可控制的写入者已停止；其他聊天或代理仍在写入时等待其结束，或只停止整合，不擅自中断它们。随后使用 [worktree_snapshot.py](scripts/worktree_snapshot.py)。输出是保全证据，不替代 Git 代理的恢复与验收判断。

```powershell
python .agents/skills/lostsky-task-orchestration/scripts/worktree_snapshot.py snapshot --repo C:/awesome-lostsky --output C:/task-snapshots/unique-task
python .agents/skills/lostsky-task-orchestration/scripts/worktree_snapshot.py verify --snapshot C:/task-snapshots/unique-task
```

输出必须是绝对的新目录，父目录已存在，位于仓库全部 worktree 之外。脚本只读取 Git/原文件并写新快照，保存索引与 binary patches、dirty（含重命名源/目标、删除）及非 ignored 的 untracked 原始字节和 SHA-256；拒绝符号链接、junction、目录型 dirty 项、预存的 assume-unchanged/skip-worktree 标志及首尾不稳定状态。隐藏标志可能令 Git 漏报原文件改动，脚本保留现场并报告路径，不自动清除标志。失败目录保留，缺少有效 manifest 时不得用来声称保全成功。快照可能包含非 ignored 的敏感文件，不输出文件内容，也不把快照纳入提交。

`verify` 分别报告原文件、索引语义、状态/patch、HEAD 与分支差异；任一不匹配返回非零。它不因合并改变了某个路径而自动放行，也不提供忽略路径选项。HEAD 预期变化时，由 Git 代理另外逐项证明任务结果与原字节恢复，记录理由；不能把非零结果报告成全量通过。脚本不执行 stash、restore、merge 或 delete。

manifest 中的 `stash_ref` 仅是快照时已有的 `refs/stash` SHA。Git 代理若随后创建 stash，必须立即记录新 stash 的完整 SHA 和唯一 message 到任务记录；恢复与清理均先按 SHA 找到 selector，核对 message，再操作，不能猜 `stash@{0}`。新 stash SHA 不能由旧快照推断。

运行脚本回归：`python .agents/skills/lostsky-task-orchestration/scripts/test_worktree_snapshot.py`。格式检查使用 skill-creator 的 `quick_validate.py`。
