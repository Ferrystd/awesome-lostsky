ALTER TABLE `team_member`
    ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '成员状态 1-正常 2-封禁 3-已离队' AFTER `inviter_entity_id`;

UPDATE `team_member` SET `status` = 2 WHERE `is_blocked` = 1;

ALTER TABLE `team_join_application`
    ADD COLUMN `purpose` TINYINT NOT NULL DEFAULT 1 COMMENT '目的 1-加入 2-复职' AFTER `inviter_entity_id`;

CREATE TABLE `team_member_departure` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id`             INT UNSIGNED NOT NULL DEFAULT 0,
    `member_id`           INT UNSIGNED NOT NULL DEFAULT 0,
    `requester_entity_id` INT UNSIGNED NOT NULL DEFAULT 0,
    `decision_entity_id`  INT UNSIGNED NULL DEFAULT NULL,
    `status`              TINYINT NOT NULL DEFAULT 1,
    `decided_at`          INT UNSIGNED NULL DEFAULT NULL,
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_team_status` (`team_id`, `status`, `id`),
    KEY `idx_member_status` (`member_id`, `status`, `id`),
    KEY `idx_requester_entity_id` (`requester_entity_id`),
    KEY `idx_decision_entity_id` (`decision_entity_id`),
    CONSTRAINT `fk_member_departure_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    CONSTRAINT `fk_member_departure_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`),
    CONSTRAINT `fk_member_departure_requester` FOREIGN KEY (`requester_entity_id`) REFERENCES `entity` (`id`),
    CONSTRAINT `fk_member_departure_decision` FOREIGN KEY (`decision_entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员离队申请表';

CREATE TABLE `team_member_tenure` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id`             INT UNSIGNED NOT NULL DEFAULT 0,
    `member_id`           INT UNSIGNED NOT NULL DEFAULT 0,
    `join_application_id` INT UNSIGNED NULL DEFAULT NULL,
    `joined_at`           INT UNSIGNED NOT NULL DEFAULT 0,
    `departed_at`         INT UNSIGNED NULL DEFAULT NULL,
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_member_joined` (`member_id`, `joined_at`, `id`),
    KEY `idx_team_departed` (`team_id`, `departed_at`, `id`),
    KEY `idx_join_application_id` (`join_application_id`),
    CONSTRAINT `fk_member_tenure_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    CONSTRAINT `fk_member_tenure_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`),
    CONSTRAINT `fk_member_tenure_join_application` FOREIGN KEY (`join_application_id`) REFERENCES `team_join_application` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员任期表';
