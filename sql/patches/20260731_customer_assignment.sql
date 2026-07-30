ALTER TABLE `team_customer`
    ADD COLUMN `assignee_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '当前归属实体ID' AFTER `owner_entity_id`,
    ADD KEY `idx_assignee_entity_id` (`assignee_entity_id`),
    ADD CONSTRAINT `fk_team_customer_assignee_entity`
        FOREIGN KEY (`assignee_entity_id`) REFERENCES `entity` (`id`);
