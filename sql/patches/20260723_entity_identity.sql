START TRANSACTION;

RENAME TABLE `team_member_role` TO `team_entity_role`;
ALTER TABLE `team_entity_role`
    CHANGE COLUMN `member_id` `entity_id` INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `entity_type` VARCHAR(30) NOT NULL DEFAULT 'teamMember' AFTER `team_id`,
    DROP INDEX `uk_member_role`,
    DROP INDEX `idx_team_id`,
    ADD UNIQUE KEY `uk_team_entity_role` (`team_id`, `entity_type`, `entity_id`, `role_id`),
    ADD KEY `idx_team_entity` (`team_id`, `entity_type`, `entity_id`);

CREATE TABLE `entity_session` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `device_token` VARCHAR(64) NOT NULL DEFAULT '',
    `jti` CHAR(48) NOT NULL DEFAULT '',
    `entity_type` VARCHAR(30) NOT NULL DEFAULT '',
    `entity_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `expires_at` INT UNSIGNED NOT NULL DEFAULT 0,
    `revoked_at` INT UNSIGNED NULL DEFAULT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`), UNIQUE KEY `uk_jti` (`jti`),
    KEY `idx_user_device_active` (`user_id`, `device_token`, `revoked_at`), KEY `idx_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
