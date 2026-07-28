START TRANSACTION;

INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`, `role`.`id`, `permissions`.`permission_key`, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team_role` AS `role`
CROSS JOIN (
    SELECT 'team.member_field.write' AS `permission_key`
    UNION ALL SELECT 'team.post_type.write'
    UNION ALL SELECT 'team.join_field.read'
    UNION ALL SELECT 'team.join_field.write'
    UNION ALL SELECT 'team.join_review.read'
    UNION ALL SELECT 'team.join_review.write'
) AS `permissions`
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `team_id` = VALUES(`team_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;

COMMIT;
