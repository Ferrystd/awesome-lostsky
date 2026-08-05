1. `is_banned` 表示平台治理封禁，`TeamMember.status` 表示成员生命周期，`TeamCustomer.is_blocked` 表示商家客户封禁。
2. 关联方法命名沿用当前模型风格：`belongsTo()`、`hasOne()` 使用单数实体名，如 `team()`、`user()`、`profile()`；`hasMany()`、`hasManyThrough()`、`morphMany()` 使用复数集合名，如 `members()`、`posts()`、`files()`、`documents()`。如果方法名需要表达业务角色，可以使用复数业务名，如 `handledTransactions()`。
