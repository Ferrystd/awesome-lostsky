-- DDL statements are intentionally standalone because MySQL implicitly commits DDL.

DELETE FROM `api_request_cache`;
ALTER TABLE `api_request_cache`
    MODIFY COLUMN `hash` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '请求SHA-256哈希';

ALTER TABLE `team_order`
    MODIFY COLUMN `customer_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '客户ID(NULL=匿名客户)';

ALTER TABLE `chat_event_outbox`
    ADD COLUMN `processing_token` CHAR(32) NULL DEFAULT NULL COMMENT 'Worker领取令牌' AFTER `available_at`,
    ADD COLUMN `processing_until` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Worker租约到期时间' AFTER `processing_token`,
    DROP INDEX `idx_pending`,
    ADD KEY `idx_pending` (`published_at`, `available_at`, `processing_until`);

ALTER TABLE `chat_webhook_delivery`
    ADD COLUMN `processing_token` CHAR(32) NULL DEFAULT NULL COMMENT 'Worker领取令牌' AFTER `available_at`,
    ADD COLUMN `processing_until` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Worker租约到期时间' AFTER `processing_token`,
    DROP INDEX `idx_pending`,
    ADD KEY `idx_pending` (`status`, `available_at`, `processing_until`);

START TRANSACTION;

INSERT INTO `team_role`
    (`team_id`, `role_key`, `name`, `description`, `sort`, `create_time`, `update_time`, `delete_time`)
SELECT
    `id`, 'owner', '所有者', '团队创建时自动生成的完整管理角色', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team`
WHERE `delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;

INSERT INTO `team_entity_role`
    (`team_id`, `entity_type`, `entity_id`, `role_id`, `create_time`, `update_time`, `delete_time`)
SELECT
    `team`.`id`, 'teamMember', `member`.`id`, `role`.`id`, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team`
INNER JOIN `team_member` AS `member`
    ON `member`.`team_id` = `team`.`id`
    AND `member`.`user_id` = `team`.`user_id`
    AND `member`.`delete_time` IS NULL
INNER JOIN `team_role` AS `role`
    ON `role`.`team_id` = `team`.`id`
    AND `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
WHERE `team`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `role_id` = VALUES(`role_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;

INSERT INTO `team_entity_role`
    (`team_id`, `entity_type`, `entity_id`, `role_id`, `create_time`, `update_time`, `delete_time`)
SELECT
    `team`.`id`, 'team', `team`.`id`, `role`.`id`, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team`
INNER JOIN `team_role` AS `role`
    ON `role`.`team_id` = `team`.`id`
    AND `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
WHERE `team`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `role_id` = VALUES(`role_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;

INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`, `role`.`id`, `permissions`.`permission_key`, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team_role` AS `role`
CROSS JOIN (
    SELECT 'team.member.read' AS `permission_key`
    UNION ALL SELECT 'team.member.invite'
    UNION ALL SELECT 'team.member.update'
    UNION ALL SELECT 'team.member.remove'
    UNION ALL SELECT 'team.role.read'
    UNION ALL SELECT 'team.role.write'
    UNION ALL SELECT 'shop.product.read'
    UNION ALL SELECT 'shop.product.write'
    UNION ALL SELECT 'shop.product.delete'
    UNION ALL SELECT 'shop.order.read'
    UNION ALL SELECT 'shop.order.write'
    UNION ALL SELECT 'transaction.read'
    UNION ALL SELECT 'transaction.write'
    UNION ALL SELECT 'transaction.delete'
    UNION ALL SELECT 'transaction.report.read'
    UNION ALL SELECT 'file.read'
    UNION ALL SELECT 'file.upload'
    UNION ALL SELECT 'file.delete'
    UNION ALL SELECT 'team.setting.read'
    UNION ALL SELECT 'team.setting.update'
    UNION ALL SELECT 'identity.team.assume'
    UNION ALL SELECT 'identity.virtual.*.assume'
    UNION ALL SELECT 'chat.conversation.create'
    UNION ALL SELECT 'chat.group.manage'
    UNION ALL SELECT 'chat.temporary.create'
    UNION ALL SELECT 'chat.message.moderate'
    UNION ALL SELECT 'chat.virtual.create'
    UNION ALL SELECT 'chat.virtual.*.manage'
    UNION ALL SELECT 'chat.virtual.*.operate'
    UNION ALL SELECT 'chat.virtual.*.field.manage'
    UNION ALL SELECT 'team.entity_field.member.manage'
    UNION ALL SELECT 'team.entity_field.customer.manage'
) AS `permissions`
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `team_id` = VALUES(`team_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;

COMMIT;
