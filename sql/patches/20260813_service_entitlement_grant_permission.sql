-- 为既有团队的 owner 角色补齐个人工作台赋予客户权益权限。
UPDATE `team_role_permission` AS `permission`
INNER JOIN `team_role` AS `role`
    ON `role`.`team_id` = `permission`.`team_id`
    AND `role`.`id` = `permission`.`role_id`
SET
    `permission`.`delete_time` = NULL,
    `permission`.`update_time` = UNIX_TIMESTAMP()
WHERE `role`.`role_key` = 'owner'
  AND `role`.`delete_time` IS NULL
  AND `permission`.`permission_key` = 'service.entitlement.grant'
  AND `permission`.`delete_time` IS NOT NULL;

INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`, `role`.`id`, 'service.entitlement.grant', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team_role` AS `role`
LEFT JOIN `team_role_permission` AS `permission`
    ON `permission`.`team_id` = `role`.`team_id`
    AND `permission`.`role_id` = `role`.`id`
    AND `permission`.`permission_key` = 'service.entitlement.grant'
WHERE `role`.`role_key` = 'owner'
  AND `role`.`delete_time` IS NULL
  AND `permission`.`id` IS NULL;
