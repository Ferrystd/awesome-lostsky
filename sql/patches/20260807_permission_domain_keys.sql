-- 开发期权限命名硬迁移：写入新键后删除旧键，不保留运行时别名。

-- 历史 chat 根权限曾同时覆盖 Chat 与虚拟实体能力，先显式展开。
INSERT INTO `team_role_permission` (
    `team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`
)
SELECT
    `legacy`.`team_id`, `legacy`.`role_id`, `mapping`.`permission_key`,
    `legacy`.`create_time`, `legacy`.`update_time`, `legacy`.`delete_time`
FROM `team_role_permission` AS `legacy`
JOIN (
    SELECT 'chat.conversation.create' AS `permission_key`
    UNION ALL SELECT 'chat.group.manage'
    UNION ALL SELECT 'chat.temporary.create'
    UNION ALL SELECT 'chat.message.moderate'
    UNION ALL SELECT 'team.entity.virtual'
    UNION ALL SELECT 'identity.virtual.*.act'
) AS `mapping`
WHERE `legacy`.`permission_key` = 'chat'
ON DUPLICATE KEY UPDATE
    `delete_time` = IF(`team_role_permission`.`delete_time` IS NULL OR VALUES(`delete_time`) IS NULL, NULL, VALUES(`delete_time`));

-- 虚拟实体父键同时拆分为管理范围和代执行范围。
INSERT INTO `team_role_permission` (
    `team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`
)
SELECT
    `team_id`, `role_id`,
    CASE
        WHEN `permission_key` = 'chat.virtual' THEN 'identity.virtual.*.act'
        ELSE CONCAT(
            'identity.virtual.',
            SUBSTRING_INDEX(SUBSTRING(`permission_key`, LENGTH('chat.virtual.') + 1), '.', 1),
            '.act'
        )
    END,
    `create_time`, `update_time`, `delete_time`
FROM `team_role_permission`
WHERE `permission_key` = 'chat.virtual'
   OR `permission_key` REGEXP '^chat\\.virtual\\.(\\*|[a-z0-9][a-z0-9_-]{0,49})$'
ON DUPLICATE KEY UPDATE
    `delete_time` = IF(`team_role_permission`.`delete_time` IS NULL OR VALUES(`delete_time`) IS NULL, NULL, VALUES(`delete_time`));

-- 其余旧键一对一迁移到新的业务域。
INSERT INTO `team_role_permission` (
    `team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`
)
SELECT
    `team_id`, `role_id`,
    CASE
        WHEN `permission_key` = 'chat.virtual.create' THEN 'team.entity.virtual.create'
        WHEN `permission_key` LIKE 'chat.virtual.%' AND `permission_key` LIKE '%.operate'
            THEN CONCAT(
                'identity.virtual.',
                SUBSTRING(`permission_key`, LENGTH('chat.virtual.') + 1, LENGTH(`permission_key`) - LENGTH('chat.virtual.') - LENGTH('.operate')),
                '.act'
            )
        WHEN `permission_key` = 'chat.virtual' THEN 'team.entity.virtual'
        WHEN `permission_key` LIKE 'chat.virtual.%'
            THEN REPLACE(`permission_key`, 'chat.virtual', 'team.entity.virtual')
        ELSE REPLACE(`permission_key`, 'team.entity_field', 'team.entity.field')
    END,
    `create_time`, `update_time`, `delete_time`
FROM `team_role_permission`
WHERE `permission_key` = 'chat.virtual'
   OR `permission_key` LIKE 'chat.virtual.%'
   OR `permission_key` = 'team.entity_field'
   OR `permission_key` LIKE 'team.entity_field.%'
ON DUPLICATE KEY UPDATE
    `delete_time` = IF(`team_role_permission`.`delete_time` IS NULL OR VALUES(`delete_time`) IS NULL, NULL, VALUES(`delete_time`));

DELETE FROM `team_role_permission`
WHERE `permission_key` = 'chat'
   OR `permission_key` = 'chat.virtual'
   OR `permission_key` LIKE 'chat.virtual.%'
   OR `permission_key` = 'team.entity_field'
   OR `permission_key` LIKE 'team.entity_field.%';
