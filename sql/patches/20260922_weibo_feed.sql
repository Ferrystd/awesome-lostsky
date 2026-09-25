CREATE TABLE `weibo_feed_post` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `status_id` VARCHAR(32) NOT NULL,
  `text` TEXT NOT NULL,
  `author_name` VARCHAR(100) NOT NULL DEFAULT '',
  `posted_at` INT UNSIGNED NOT NULL,
  `classification_status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `classification_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `classifier_model` VARCHAR(100) NULL,
  `intent_score` DECIMAL(6,5) NULL,
  `classification_error` VARCHAR(500) NULL,
  `classified_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_weibo_feed_status` (`status_id`),
  KEY `idx_weibo_feed_listing` (`classification_status`,`posted_at`),
  KEY `idx_weibo_feed_retry` (`classification_status`,`classification_attempts`,`posted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全局微博陪玩点单信息流';

CREATE TABLE `weibo_comment_preset` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `team_id` INT UNSIGNED NOT NULL,
  `entity_id` INT UNSIGNED NULL,
  `content` VARCHAR(500) NOT NULL,
  `sort` TINYINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_weibo_preset_scope_sort` (`team_id`,`entity_id`,`sort`),
  KEY `idx_weibo_preset_entity` (`entity_id`),
  CONSTRAINT `fk_weibo_preset_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
  CONSTRAINT `fk_weibo_preset_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队及个人微博评论预设';

CREATE TABLE `weibo_feed_poll_state` (
  `id` TINYINT UNSIGNED NOT NULL,
  `last_attempt_at` INT UNSIGNED NULL,
  `last_success_at` INT UNSIGNED NULL,
  `last_error` VARCHAR(500) NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博信息流轮询状态';
