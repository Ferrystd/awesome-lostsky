-- 开发期权限命名硬迁移：清理旧业务域与聊天代操作键，不保留运行时别名。

INSERT INTO `team_role_permission` (
    `team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`
)
SELECT
    `legacy`.`team_id`, `legacy`.`role_id`,
    CASE
        WHEN `legacy`.`permission_key` = 'chat.virtual.create' THEN 'team.entity.virtual.create'
        WHEN `legacy`.`permission_key` = 'chat.virtual' THEN 'team.entity.virtual'
        WHEN `legacy`.`permission_key` LIKE 'chat.virtual.%.operate'
            THEN CONCAT(
                'chat.virtual.',
                SUBSTRING(`legacy`.`permission_key`, LENGTH('chat.virtual.') + 1, LENGTH(`legacy`.`permission_key`) - LENGTH('chat.virtual.') - LENGTH('.operate')),
                '.act'
            )
        WHEN `legacy`.`permission_key` LIKE 'chat.virtual.%.manage'
            THEN REPLACE(`legacy`.`permission_key`, 'chat.virtual', 'team.entity.virtual')
        WHEN `legacy`.`permission_key` LIKE 'chat.virtual.%.field.manage'
            THEN REPLACE(`legacy`.`permission_key`, 'chat.virtual', 'team.entity.virtual')
        WHEN `legacy`.`permission_key` = 'team.entity_field' THEN 'team.entity.field'
        WHEN `legacy`.`permission_key` LIKE 'team.entity_field.%'
            THEN REPLACE(`legacy`.`permission_key`, 'team.entity_field', 'team.entity.field')
        WHEN `legacy`.`permission_key` = 'team.entity_profile.manage' THEN 'team.entity.profile.manage'
        ELSE REPLACE(`legacy`.`permission_key`, 'identity.virtual.', 'chat.virtual.')
    END,
    `legacy`.`create_time`, `legacy`.`update_time`, `legacy`.`delete_time`
FROM `team_role_permission` AS `legacy`
WHERE `legacy`.`permission_key` = 'chat.virtual.create'
   OR `legacy`.`permission_key` = 'chat.virtual'
   OR `legacy`.`permission_key` REGEXP '^chat\\.virtual\\.(\\*|[a-z0-9][a-z0-9_-]{0,49})\\.(operate|manage|field\\.manage)$'
   OR `legacy`.`permission_key` = 'team.entity_field'
   OR `legacy`.`permission_key` LIKE 'team.entity_field.%'
   OR `legacy`.`permission_key` = 'team.entity_profile.manage'
   OR `legacy`.`permission_key` = 'identity.virtual.*.act'
   OR `legacy`.`permission_key` REGEXP '^identity\\.virtual\\.[a-z0-9][a-z0-9_-]{0,49}\\.act$'
ON DUPLICATE KEY UPDATE
    `delete_time` = IF(`team_role_permission`.`delete_time` IS NULL OR VALUES(`delete_time`) IS NULL, NULL, VALUES(`delete_time`));

DELETE FROM `team_role_permission`
WHERE `permission_key` = 'chat.virtual.create'
   OR `permission_key` = 'chat.virtual'
   OR `permission_key` REGEXP '^chat\\.virtual\\.(\\*|[a-z0-9][a-z0-9_-]{0,49})\\.(operate|manage|field\\.manage)$'
   OR `permission_key` = 'team.entity_field'
   OR `permission_key` LIKE 'team.entity_field.%'
   OR `permission_key` = 'team.entity_profile.manage'
   OR `permission_key` = 'identity.virtual.*.act'
   OR `permission_key` REGEXP '^identity\\.virtual\\.[a-z0-9][a-z0-9_-]{0,49}\\.act$';
