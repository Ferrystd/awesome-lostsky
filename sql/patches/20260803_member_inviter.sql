ALTER TABLE `team_member`
    ADD COLUMN `inviter_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '邀请人实体ID，可来自其他团队' AFTER `user_id`,
    ADD KEY `idx_inviter_entity_id` (`inviter_entity_id`),
    ADD CONSTRAINT `fk_team_member_inviter_entity`
        FOREIGN KEY (`inviter_entity_id`) REFERENCES `entity` (`id`);

ALTER TABLE `team_join_application`
    ADD COLUMN `inviter_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '申请时确认的邀请人实体ID，可来自其他团队' AFTER `entity_id`,
    ADD KEY `idx_inviter_entity_id` (`inviter_entity_id`),
    ADD CONSTRAINT `fk_join_application_inviter_entity`
        FOREIGN KEY (`inviter_entity_id`) REFERENCES `entity` (`id`);
