# Slug

## 定义

Slug 是 Entity 的全局唯一、稳定且面向 URL 与权限表达的文本标识。

## 使用场景

Slug 用于精确查找实体、表达动态权限目标，并参与团队与应用路由解析。它不是业务表之间的外键。

## 相关概念

- [Entity](entity.md)以 slug 获得全局可识别身份。
- [Permission](permission.md)可以使用 `identity.member.<slug>.assume` 这样的精确规则。

## 来源与示例

规则见[实体身份与跨团队委托](../architecture/entity-authorization.md)。例如 `identity.member.bob.assume` 只允许领取 slug 为 `bob` 的指定成员，不能匹配其他成员。
