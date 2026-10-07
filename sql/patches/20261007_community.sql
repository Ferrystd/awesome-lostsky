-- Community history retained, removable unique relations.
CREATE TABLE `community` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `owner_type` TINYINT UNSIGNED NOT NULL,
    `team_id` INT UNSIGNED NULL,
    `is_official` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_team_id` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    UNIQUE KEY `uk_community_slug` (`slug`),
    CONSTRAINT `ck_community_owner` CHECK ((`owner_type`=1 AND `team_id` IS NULL) OR (`owner_type`=2 AND `team_id` IS NOT NULL AND `is_official`=0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_board` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `sort` INT UNSIGNED NOT NULL DEFAULT 0,
    `enabled` TINYINT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_board_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_announcement` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `pinned` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `attachment_team_id` INT UNSIGNED NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_announcement_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_announcement_attachment_team_id` FOREIGN KEY (`attachment_team_id`) REFERENCES `team` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_post` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `board_id` INT UNSIGNED NOT NULL,
    `author_entity_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `pinned` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL,
    `hidden_reason` VARCHAR(500) NOT NULL DEFAULT '',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_post_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_post_board_id` FOREIGN KEY (`board_id`) REFERENCES `community_board` (`id`),
    CONSTRAINT `fk_community_post_author_entity_id` FOREIGN KEY (`author_entity_id`) REFERENCES `entity` (`id`),
    KEY `idx_community_post_feed` (`community_id`,`status`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_comment` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `post_id` INT UNSIGNED NOT NULL,
    `author_entity_id` INT UNSIGNED NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `status` TINYINT UNSIGNED NOT NULL,
    `hidden_reason` VARCHAR(500) NOT NULL DEFAULT '',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_comment_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_comment_post_id` FOREIGN KEY (`post_id`) REFERENCES `community_post` (`id`),
    CONSTRAINT `fk_community_comment_author_entity_id` FOREIGN KEY (`author_entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_member` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `entity_id` INT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_member_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_member_entity_id` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`),
    UNIQUE KEY `uk_community_member` (`community_id`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_administrator` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `entity_id` INT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_administrator_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_administrator_entity_id` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`),
    UNIQUE KEY `uk_community_administrator` (`community_id`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_mute` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `entity_id` INT UNSIGNED NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_mute_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_mute_entity_id` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`),
    UNIQUE KEY `uk_community_mute` (`community_id`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `community_like` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `community_id` INT UNSIGNED NOT NULL,
    `post_id` INT UNSIGNED NOT NULL,
    `entity_id` INT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_community_like_community_id` FOREIGN KEY (`community_id`) REFERENCES `community` (`id`),
    CONSTRAINT `fk_community_like_post_id` FOREIGN KEY (`post_id`) REFERENCES `community_post` (`id`),
    CONSTRAINT `fk_community_like_entity_id` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`),
    UNIQUE KEY `uk_community_like` (`post_id`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
