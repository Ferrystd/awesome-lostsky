-- 为既有团队的 owner 角色补齐统一实体目录与资料管理权限。
-- 新团队由 RolePermission::bootstrapOwner 自动取得完整权限。

DELETE legacy
FROM `team_role_permission` AS legacy
INNER JOIN `team_role_permission` AS current_permission
    ON current_permission.`team_id` = legacy.`team_id`
    AND current_permission.`role_id` = legacy.`role_id`
    AND current_permission.`permission_key` = 'team.entity.profile.manage'
WHERE legacy.`permission_key` = 'team.entity_profile.manage';

UPDATE `team_role_permission`
SET `permission_key` = 'team.entity.profile.manage'
WHERE `permission_key` = 'team.entity_profile.manage';

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
    SELECT 'team.entity.read' AS `permission_key`
    UNION ALL
    SELECT 'team.entity.profile.manage'
    UNION ALL
    SELECT 'team.document.read'
) AS `permission`
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `team_id` = VALUES(`team_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;
