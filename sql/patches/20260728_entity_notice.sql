-- 保留 LostSky -> Team 原有通知，并新增 Team -> Entity 通知。
-- team_id 继续表示原有收件 Team；sender_team_id 与 entity_id 只用于新通道。
-- DDL 在 MySQL 中隐式提交，不能与权限回填伪装为单一事务。

ALTER TABLE `team_notice`
    MODIFY COLUMN `team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'LostSky通知的收件Team ID',
    ADD COLUMN `sender_team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Entity通知的发送Team ID' AFTER `team_id`,
    ADD COLUMN `entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Team通知的收件Entity ID' AFTER `sender_team_id`,
    DROP INDEX `idx_team_id`,
    ADD KEY `idx_notice_team_inbox` (`team_id`, `is_read`, `is_pinned`, `id`),
    ADD KEY `idx_notice_sender_team` (`sender_team_id`, `id`),
    ADD KEY `idx_notice_entity_inbox` (`entity_id`, `is_read`, `is_pinned`, `id`),
    ADD CONSTRAINT `fk_team_notice_sender_team`
        FOREIGN KEY (`sender_team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_team_notice_entity`
        FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `chk_notice_recipient` CHECK (
        (`team_id` IS NOT NULL AND `entity_id` IS NULL)
        OR (`team_id` IS NULL AND `entity_id` IS NOT NULL)
    );

-- 新团队由 RolePermission::bootstrapOwner 自动取得完整权限；
-- 为既有团队的 owner 角色补齐通知发送权限。
INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`,
    `role`.`id`,
    'team.notice.send',
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
