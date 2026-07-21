ALTER TABLE `team_customer_profile`
    CHANGE COLUMN `name` `nickname` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '客户公开昵称',
    CHANGE COLUMN `memo` `description` VARCHAR(500) NULL DEFAULT NULL COMMENT '客户公开简介',
    ADD COLUMN `avatar` VARCHAR(500) NULL DEFAULT NULL COMMENT '客户公开头像' AFTER `nickname`;

CREATE TABLE IF NOT EXISTS `team_virtual` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `name` VARCHAR(50) NOT NULL DEFAULT '', `avatar` VARCHAR(500) NULL, `description` VARCHAR(500) NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`), KEY `idx_team_active` (`team_id`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_virtual_integration` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `virtual_id` INT UNSIGNED NOT NULL DEFAULT 0, `name` VARCHAR(50) NOT NULL DEFAULT '',
    `driver` VARCHAR(20) NOT NULL DEFAULT 'webhook', `endpoint_url` VARCHAR(1000) NULL,
    `events` JSON NULL, `token_hash` CHAR(64) NOT NULL DEFAULT '', `signing_secret` VARCHAR(255) NOT NULL DEFAULT '',
    `is_active` TINYINT NOT NULL DEFAULT 1, `last_error_at` INT UNSIGNED NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL, PRIMARY KEY (`id`),
    KEY `idx_virtual_active` (`virtual_id`,`is_active`), KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_entity_field` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `entity_type` VARCHAR(20) NOT NULL DEFAULT 'member', `field_key` VARCHAR(64) NOT NULL DEFAULT '',
    `name` VARCHAR(50) NOT NULL DEFAULT '', `value_type` VARCHAR(20) NOT NULL DEFAULT 'string',
    `input_type` VARCHAR(20) NOT NULL DEFAULT 'text', `options` JSON NULL,
    `is_required` TINYINT NOT NULL DEFAULT 0, `is_editable` TINYINT NOT NULL DEFAULT 1,
    `is_searchable` TINYINT NOT NULL DEFAULT 0, `is_visible` TINYINT NOT NULL DEFAULT 0,
    `is_system` TINYINT NOT NULL DEFAULT 0, `sort` INT NOT NULL DEFAULT 0,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL, PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_type_field` (`team_id`,`entity_type`,`field_key`),
    KEY `idx_team_type_sort` (`team_id`,`entity_type`,`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_entity_field_value` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `field_id` INT UNSIGNED NOT NULL DEFAULT 0, `entity_type` VARCHAR(20) NOT NULL DEFAULT '',
    `entity_id` INT UNSIGNED NOT NULL DEFAULT 0, `value_string` VARCHAR(500) NULL, `value_text` TEXT NULL,
    `value_int` INT NULL, `value_decimal` DECIMAL(12,2) NULL, `value_datetime` INT UNSIGNED NULL,
    `value_json` JSON NULL, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`), UNIQUE KEY `uk_field_entity` (`field_id`,`entity_type`,`entity_id`),
    KEY `idx_team_entity` (`team_id`,`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `team_entity_field`
(`id`,`team_id`,`entity_type`,`field_key`,`name`,`value_type`,`input_type`,`options`,`is_required`,`is_editable`,`is_searchable`,`is_visible`,`is_system`,`sort`,`create_time`,`update_time`,`delete_time`)
SELECT `id`,`team_id`,'member',`field_key`,`name`,`value_type`,`input_type`,`options`,`is_required`,`is_editable`,`is_searchable`,
       IF(`visibility` IN (4,5),1,0),`is_system`,`sort`,`create_time`,`update_time`,`delete_time`
FROM `team_member_field`;

INSERT IGNORE INTO `team_entity_field_value`
(`id`,`team_id`,`field_id`,`entity_type`,`entity_id`,`value_string`,`value_text`,`value_int`,`value_decimal`,`value_datetime`,`value_json`,`create_time`,`update_time`,`delete_time`)
SELECT field_value.`id`,member.`team_id`,field_value.`field_id`,'member',field_value.`member_id`,field_value.`value_string`,field_value.`value_text`,
       field_value.`value_int`,field_value.`value_decimal`,field_value.`value_datetime`,field_value.`value_json`,
       field_value.`create_time`,field_value.`update_time`,field_value.`delete_time`
FROM `team_member_field_value` field_value
INNER JOIN `team_member` member ON member.`id`=field_value.`member_id`;

CREATE TABLE IF NOT EXISTS `chat_conversation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `uuid` CHAR(36) NOT NULL DEFAULT '', `kind` VARCHAR(20) NOT NULL DEFAULT 'direct',
    `title` VARCHAR(100) NULL, `direct_key` CHAR(64) NULL, `is_temporary` TINYINT NOT NULL DEFAULT 0,
    `created_by_type` VARCHAR(20) NOT NULL DEFAULT '', `created_by_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `last_message_id` BIGINT UNSIGNED NULL, `last_message_at` INT UNSIGNED NULL,
    `expires_at` INT UNSIGNED NULL, `closed_at` INT UNSIGNED NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL, PRIMARY KEY (`id`), UNIQUE KEY `uk_uuid` (`uuid`),
    UNIQUE KEY `uk_direct_key` (`direct_key`), KEY `idx_team_last` (`team_id`,`last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_participant` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `conversation_id` BIGINT UNSIGNED NOT NULL DEFAULT 0, `actor_type` VARCHAR(20) NOT NULL DEFAULT '',
    `actor_id` INT UNSIGNED NOT NULL DEFAULT 0, `joined_at` INT UNSIGNED NOT NULL DEFAULT 0,
    `left_at` INT UNSIGNED NULL, `last_read_message_id` BIGINT UNSIGNED NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL, PRIMARY KEY (`id`),
    UNIQUE KEY `uk_conversation_actor` (`conversation_id`,`actor_type`,`actor_id`),
    KEY `idx_team_actor` (`team_id`,`actor_type`,`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_message` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `conversation_id` BIGINT UNSIGNED NOT NULL DEFAULT 0, `sender_type` VARCHAR(20) NOT NULL DEFAULT '',
    `sender_id` INT UNSIGNED NOT NULL DEFAULT 0, `reply_id` BIGINT UNSIGNED NULL,
    `origin_integration_id` INT UNSIGNED NULL, `content` TEXT NULL, `edited_at` INT UNSIGNED NULL,
    `revoked_at` INT UNSIGNED NULL, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`), KEY `idx_conversation_id` (`conversation_id`,`id`),
    KEY `idx_team_sender` (`team_id`,`sender_type`,`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_event_outbox` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `event_type` VARCHAR(50) NOT NULL DEFAULT '', `aggregate_type` VARCHAR(30) NOT NULL DEFAULT '',
    `aggregate_id` BIGINT UNSIGNED NOT NULL DEFAULT 0, `payload` JSON NOT NULL, `attempts` INT UNSIGNED NOT NULL DEFAULT 0,
    `available_at` INT UNSIGNED NOT NULL DEFAULT 0, `published_at` INT UNSIGNED NULL,
    `last_error` VARCHAR(1000) NULL, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`), KEY `idx_pending` (`published_at`,`available_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_webhook_delivery` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `outbox_id` BIGINT UNSIGNED NOT NULL DEFAULT 0, `integration_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending', `attempts` INT UNSIGNED NOT NULL DEFAULT 0,
    `available_at` INT UNSIGNED NOT NULL DEFAULT 0, `delivered_at` INT UNSIGNED NULL,
    `response_code` SMALLINT UNSIGNED NULL, `last_error` VARCHAR(1000) NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL, PRIMARY KEY (`id`),
    UNIQUE KEY `uk_outbox_integration` (`outbox_id`,`integration_id`),
    KEY `idx_pending` (`status`,`available_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
