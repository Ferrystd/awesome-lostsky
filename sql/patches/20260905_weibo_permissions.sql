-- 为既有团队 owner 角色补齐微博个人使用与团队管理权限。
INSERT INTO `team_role_permission` (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT `role`.`team_id`, `role`.`id`, `permission`.`permission_key`, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team_role` AS `role`
CROSS JOIN (
    SELECT 'weibo.personal.use' AS `permission_key`
    UNION ALL SELECT 'weibo.team.manage'
) AS `permission`
LEFT JOIN `team_role_permission` AS `existing`
    ON `existing`.`team_id` = `role`.`team_id`
    AND `existing`.`role_id` = `role`.`id`
    AND `existing`.`permission_key` = `permission`.`permission_key`
    AND `existing`.`delete_time` IS NULL
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
    AND `existing`.`id` IS NULL;

UPDATE `team_role_permission` AS `permission`
INNER JOIN `team_role` AS `role` ON `role`.`id` = `permission`.`role_id`
SET `permission`.`delete_time` = NULL, `permission`.`update_time` = UNIX_TIMESTAMP()
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
    AND `permission`.`permission_key` IN ('weibo.personal.use', 'weibo.team.manage')
    AND `permission`.`delete_time` IS NOT NULL;
