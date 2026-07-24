# 待办事项

## 实体主体后续迁移

- 将 Transaction、Shop、File、Document 等现有业务表中语义为“操作人”的 `member_id` 逐项迁移为 `actor_type + actor_id`，并记录 `authenticated_user_id` 审计；保留真正代表人工处理人或归属人的成员外键。

## 动态资源权限后续迁移

- Chat 已使用 `资源.*.动作 / 资源.{slug}.动作` 的授权并集。后续按应用逐个评估 `shop.product`、交易分类等资源是否值得迁移，不要求所有业务表增加 slug，也不在一次变更中批量重命名现有权限。
- 若未来确实需要“除某个实体外全部允许”，再设计显式 deny 规则；当前保持纯加法授权，避免隐式优先级和难以审计的覆盖关系。

## 其他计划

- [Markdown 编辑器：启用 AI](./plans/markdown-ai.md)
