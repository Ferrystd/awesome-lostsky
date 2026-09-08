-- 为既有团队 owner 角色补齐按归属实体管理文档的权限。
-- 新团队由 RolePermission::bootstrapOwner 自动取得权限字典中的全部固定权限。
INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`,
    `role`.`id`,
    `permission`.`permission_key`,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    NULL
FROM `team_role` AS `role`
CROSS JOIN (
    SELECT 'team.document.team.manage' AS `permission_key`
    UNION ALL SELECT 'team.document.member.*.manage'
    UNION ALL SELECT 'team.document.customer.*.manage'
    UNION ALL SELECT 'team.document.virtual.*.manage'
) AS `permission`
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `team_id` = VALUES(`team_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;
