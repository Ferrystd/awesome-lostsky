# Team 权限列表实施计划

## 目标

集中维护团队业务权限 key，通过 `TeamMember -> TeamRole -> Permission` 判断成员权限。权限暂由代码约定，不新增权限字典表。

## 权限范围

- 团队成员：`team.member.read`、`team.member.invite`、`team.member.update`、`team.member.remove`
- 角色查看：`team.role.read`
- 商店：`shop.read`、`shop.update`
- 商品：`shop.product.read`、`shop.product.write`、`shop.product.delete`
- 订单：`shop.order.read`、`shop.order.write`
- 交易：`transaction.read`、`transaction.write`、`transaction.delete`
- 交易分类：`transaction.category.read`、`transaction.category.write`
- 交易报表：`transaction.report.read`
- 客户：`customer.read`、`customer.write`、`customer.delete`、`customer.export`
- 文件：`file.read`、`file.upload`、`file.delete`、`file.share`
- 团队设置：`team.setting.read`、`team.setting.update`

## 授权规则

- 多个角色绑定的权限取并集。
- 团队创建者不自动拥有普通业务权限；没有权限时通过角色给自己授权。
- RBAC 管理接口只校验 `team.user_id === request.user_id`，不使用 `team.role.manage`。

## 实施内容

1. 新增统一权限 key 常量或配置，作为业务代码的唯一引用来源。
2. 在需要保护的业务接口中接入普通权限校验。
3. 为默认角色配置所需权限，并补充成员多角色权限聚合测试。
4. 同步更新相关 OpenAPI 文档和权限说明文档。

