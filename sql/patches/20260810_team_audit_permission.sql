INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`, `role`.`id`, 'team.audit.read', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team_role` AS `role`
WHERE `role`.`role_key` = 'owner'
  AND `role`.`delete_time` IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM `team_role_permission` AS `permission`
      WHERE `permission`.`team_id` = `role`.`team_id`
        AND `permission`.`role_id` = `role`.`id`
        AND `permission`.`permission_key` = 'team.audit.read'
        AND `permission`.`delete_time` IS NULL
  );
