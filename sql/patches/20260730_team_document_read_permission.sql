-- 为既有团队 owner 角色补齐文档全量读取权限。
-- 新团队由 RolePermission::bootstrapOwner 自动取得权限字典中的全部权限。
INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`,
    `role`.`id`,
    'team.document.read',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    NULL
FROM `team_role` AS `role`
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `team_id` = VALUES(`team_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;
