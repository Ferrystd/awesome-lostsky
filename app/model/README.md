1. 'is_banned'字段为官方封禁，'is_blocked'字段为管理员封禁
2. 关联方法命名沿用当前模型风格：`belongsTo()`、`hasOne()` 使用单数实体名，如 `team()`、`user()`、`profile()`；`hasMany()`、`hasManyThrough()`、`morphMany()` 使用复数集合名，如 `members()`、`posts()`、`files()`、`documents()`。如果方法名需要表达业务角色，可以使用复数业务名，如 `handledTransactions()`。
