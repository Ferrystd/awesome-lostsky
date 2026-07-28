# Ability

## 定义

Team功能边界的能力标识

## 使用场景

校验Team是否开通了某能力，或是否达到一定等级

## 相关概念

- [Permission](permission.md)处理团队角色的细粒度业务授权。
- [Context](context.md)提供 Ability 检查所需的当前实体与团队语境。

## 来源与示例

中间件组合与路由责任见[请求路由与应用解析](../architecture/routing.md)。例如交易应用可在路由上要求对应 Ability，再由后续授权检查约束具体操作。
