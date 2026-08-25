CREATE TABLE `weibo_account` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(32) NOT NULL, `uid` VARCHAR(32) NOT NULL,
  `gsid` TEXT NOT NULL, `from_value` VARCHAR(32) NOT NULL,
  `screen_name` VARCHAR(100) NOT NULL DEFAULT '', `oauth_token` TEXT NULL,
  `cookie_json` JSON NULL, `user_json` JSON NULL,
  `health` TINYINT UNSIGNED NOT NULL DEFAULT 0, `checked_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_account_phone` (`phone`), UNIQUE KEY `uk_weibo_account_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博账号明文凭据';

CREATE TABLE `weibo_account_binding` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL,
  `entity_id` INT UNSIGNED NOT NULL, `account_id` BIGINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_binding` (`entity_id`,`account_id`), KEY `idx_weibo_binding_team` (`team_id`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博账号实体绑定';

CREATE TABLE `weibo_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL, `owner_entity_id` INT UNSIGNED NOT NULL,
  `pid` VARCHAR(100) NOT NULL, `content_type` VARCHAR(100) NULL,
  `byte_count` INT UNSIGNED NULL, `variants` JSON NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_media_pid` (`team_id`,`owner_entity_id`,`pid`), KEY `idx_weibo_media_owner` (`team_id`,`owner_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博远端媒体元数据';

CREATE TABLE `weibo_task` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL,
  `owner_entity_id` INT UNSIGNED NULL, `creator_entity_id` INT UNSIGNED NOT NULL,
  `topic_name` VARCHAR(100) NOT NULL, `container_id` VARCHAR(100) NOT NULL, `topic_id` VARCHAR(100) NOT NULL, `display_tag` VARCHAR(130) NOT NULL,
  `content` TEXT NOT NULL, `start_at` INT UNSIGNED NOT NULL, `min_interval` INT UNSIGNED NOT NULL, `max_interval` INT UNSIGNED NOT NULL,
  `next_run_at` INT UNSIGNED NULL, `status` TINYINT UNSIGNED NOT NULL DEFAULT 1, `block_reason` VARCHAR(50) NULL, `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), KEY `idx_weibo_task_due` (`status`,`next_run_at`), KEY `idx_weibo_task_scope` (`team_id`,`owner_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博持续随机任务';

CREATE TABLE `weibo_task_account` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `task_id` BIGINT UNSIGNED NOT NULL, `account_id` BIGINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_task_account` (`task_id`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `weibo_task_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `task_id` BIGINT UNSIGNED NOT NULL, `media_id` BIGINT UNSIGNED NOT NULL, `sort` TINYINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_task_media` (`task_id`,`media_id`), KEY `idx_weibo_task_media_sort` (`task_id`,`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `weibo_operation_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `dispatch_key` VARCHAR(100) NOT NULL,
  `team_id` INT UNSIGNED NOT NULL, `owner_entity_id` INT UNSIGNED NULL, `actor_entity_id` INT UNSIGNED NULL,
  `account_id` BIGINT UNSIGNED NULL, `task_id` BIGINT UNSIGNED NULL, `task_version` INT UNSIGNED NULL,
  `operation_type` TINYINT UNSIGNED NOT NULL, `source` TINYINT UNSIGNED NOT NULL, `status` TINYINT UNSIGNED NOT NULL,
  `target_id` VARCHAR(32) NULL, `content_summary` VARCHAR(255) NULL, `media_summary` JSON NULL,
  `remote_status_id` VARCHAR(32) NULL, `remote_comment_id` VARCHAR(32) NULL,
  `reason` VARCHAR(64) NULL, `remote_code` VARCHAR(64) NULL, `remote_message` VARCHAR(255) NULL, `http_status` SMALLINT UNSIGNED NULL,
  `started_at` INT UNSIGNED NOT NULL, `finished_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_dispatch` (`dispatch_key`), KEY `idx_weibo_operation_scope` (`team_id`,`owner_entity_id`,`create_time`), KEY `idx_weibo_operation_task` (`task_id`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博最小结构化操作日志';

ALTER TABLE `weibo_account_binding` ADD CONSTRAINT `fk_weibo_binding_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_binding_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_binding_account` FOREIGN KEY (`account_id`) REFERENCES `weibo_account` (`id`);
ALTER TABLE `weibo_media` ADD CONSTRAINT `fk_weibo_media_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_media_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `weibo_task` ADD CONSTRAINT `fk_weibo_task_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_task_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_task_creator` FOREIGN KEY (`creator_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `weibo_task_account` ADD CONSTRAINT `fk_weibo_task_account_task` FOREIGN KEY (`task_id`) REFERENCES `weibo_task` (`id`), ADD CONSTRAINT `fk_weibo_task_account_account` FOREIGN KEY (`account_id`) REFERENCES `weibo_account` (`id`);
ALTER TABLE `weibo_task_media` ADD CONSTRAINT `fk_weibo_task_media_task` FOREIGN KEY (`task_id`) REFERENCES `weibo_task` (`id`), ADD CONSTRAINT `fk_weibo_task_media_media` FOREIGN KEY (`media_id`) REFERENCES `weibo_media` (`id`);
ALTER TABLE `weibo_operation_log` ADD CONSTRAINT `fk_weibo_operation_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_operation_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_operation_actor` FOREIGN KEY (`actor_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_operation_account` FOREIGN KEY (`account_id`) REFERENCES `weibo_account` (`id`), ADD CONSTRAINT `fk_weibo_operation_task` FOREIGN KEY (`task_id`) REFERENCES `weibo_task` (`id`);
