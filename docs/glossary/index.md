# 术语索引

本索引解释 LostSky 的共享语言。每个专有名词必须对应一个独立术语页；术语页说明概念本身，不替代代码、OpenAPI 或权限字典。

新增术语前先在[术语登记表](registry.md)登记，再从[单页模板](template.md)创建页面、补入本索引与文档导航。尚未完成页面的术语不得作为正式产品术语对外使用。

## 核心主体与标识

- [Entity](entity.md)：团队业务中的当前执行主体。
- [Slug](slug.md)：实体的全局唯一、面向人阅读的标识。
- [团队成员](team-member.md)：与真实用户关联的团队内成员实体。
- [团队顾客](team-customer.md)：团队的顾客实体，可关联真实用户。
- [团队（Team）](team.md)、[顾客（Customer）](customer.md)与[虚拟实体（Virtual）](Virtual.md)：待人工补充。

## 访问控制
- [Permission](permission.md)：团队角色授予的细粒度授权键。
- [Ability](ability.md)：应用级功能边界与路由访问能力。
- [Context](context.md)：由当前身份补充到请求的可信业务上下文。
- [角色（Role）](role.md)：待人工补充。

## 系统与通信
- [Service](service.md)：由代码生成的 Service public 方法字典。
- [团队域名](team-domain.md)：用于将自定义域名解析到团队的记录。
- [通知](notice.md)：区分实体收件箱中的“通知”和 Team 共享收件箱中的“站内通知”。
