-- Chat 改为以 Entity 为主体的 teamless 应用。
-- 结构补丁按发布日期执行一次；历史数据归并使用 chat:migrate-teamless，可安全重复运行。

ALTER TABLE `chat_conversation`
    MODIFY `team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空';
ALTER TABLE `chat_participant`
    MODIFY `team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空',
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'pending/active/rejected' AFTER `entity_id`,
    ADD COLUMN `invited_by_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '邀请人实体ID' AFTER `status`,
    ADD COLUMN `invited_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '邀请时间' AFTER `invited_by_entity_id`,
    ADD COLUMN `responded_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '响应时间' AFTER `invited_at`,
    ADD KEY `idx_chat_participant_inviter` (`invited_by_entity_id`),
    ADD CONSTRAINT `fk_chat_participant_inviter` FOREIGN KEY (`invited_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_message`
    MODIFY `team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空';
ALTER TABLE `chat_event_outbox`
    MODIFY `team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空';

CREATE TABLE `chat_entity_block` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `blocker_entity_id` INT UNSIGNED NOT NULL,
    `blocked_entity_id` INT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_chat_block_pair` (`blocker_entity_id`, `blocked_entity_id`),
    KEY `idx_chat_blocked` (`blocked_entity_id`),
    CONSTRAINT `fk_chat_blocker_entity` FOREIGN KEY (`blocker_entity_id`) REFERENCES `entity` (`id`),
    CONSTRAINT `fk_chat_blocked_entity` FOREIGN KEY (`blocked_entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天实体屏蔽关系';

CREATE TABLE `chat_conversation_alias` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `alias_uuid` CHAR(36) NOT NULL,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_chat_alias_uuid` (`alias_uuid`),
    KEY `idx_chat_alias_conversation` (`conversation_id`),
    CONSTRAINT `fk_chat_alias_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='历史聊天会话别名';
