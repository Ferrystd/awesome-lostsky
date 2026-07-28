-- Canonicalize every persisted business subject reference on entity.id.
-- MySQL DDL statements implicitly commit; take a backup before applying in production.

ALTER TABLE `file` DROP FOREIGN KEY `fk_file_entity`;
ALTER TABLE `markdown_reference` DROP FOREIGN KEY `fk_markdown_identity`;

RENAME TABLE `entity_identity` TO `entity`;

ALTER TABLE `team_member_profile`
    DROP FOREIGN KEY `fk_member_profile_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_member_profile` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_member_profile`
    DROP KEY `uk_member_id`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID',
    ADD UNIQUE KEY `uk_entity_id` (`entity_id`);

ALTER TABLE `team_member_post`
    DROP FOREIGN KEY `fk_member_post_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_member_post` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_member_post`
    DROP KEY `uk_member_post`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID',
    ADD UNIQUE KEY `uk_entity_post` (`entity_id`, `post_id`);

ALTER TABLE `team_transaction`
    DROP FOREIGN KEY `fk_transaction_sender`,
    DROP FOREIGN KEY `fk_transaction_cs`,
    ADD COLUMN `handler_entity_id` INT UNSIGNED NULL AFTER `team_id`,
    ADD COLUMN `sender_entity_id` INT UNSIGNED NULL AFTER `handler_entity_id`,
    ADD COLUMN `cs_entity_id` INT UNSIGNED NULL AFTER `sender_entity_id`;
UPDATE `team_transaction` AS `target`
JOIN `entity` AS `entity`
  ON (`target`.`handler_id` = 0
      AND `entity`.`entityable_type` = 'team'
      AND `entity`.`entityable_id` = `target`.`team_id`)
  OR (`target`.`handler_id` > 0
      AND `entity`.`entityable_type` = 'teamMember'
      AND `entity`.`entityable_id` = `target`.`handler_id`)
SET `target`.`handler_entity_id` = `entity`.`id`;
UPDATE `team_transaction` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`sender_id`
SET `target`.`sender_entity_id` = `entity`.`id`
WHERE `target`.`sender_id` IS NOT NULL;
UPDATE `team_transaction` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`cs_id`
SET `target`.`cs_entity_id` = `entity`.`id`
WHERE `target`.`cs_id` IS NOT NULL;
ALTER TABLE `team_transaction`
    DROP KEY `idx_handler_id`,
    DROP COLUMN `handler_id`,
    DROP COLUMN `sender_id`,
    DROP COLUMN `cs_id`,
    MODIFY COLUMN `handler_entity_id` INT UNSIGNED NOT NULL COMMENT '接单实体ID',
    ADD KEY `idx_handler_entity_id` (`handler_entity_id`);

ALTER TABLE `team_customer_sender`
    DROP FOREIGN KEY `fk_customer_sender_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_customer_sender` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_customer_sender`
    DROP KEY `uk_customer_member`,
    DROP KEY `idx_member_id`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '发单实体ID',
    ADD UNIQUE KEY `uk_customer_entity` (`customer_id`, `entity_id`),
    ADD KEY `idx_entity_id` (`entity_id`);

ALTER TABLE `team_product`
    DROP FOREIGN KEY `fk_product_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_product` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`
WHERE `target`.`member_id` IS NOT NULL;
ALTER TABLE `team_product`
    DROP KEY `idx_member_id`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '专属实体ID(NULL=团队公用)',
    ADD KEY `idx_entity_id` (`entity_id`);

ALTER TABLE `team_product_handler`
    DROP FOREIGN KEY `fk_product_handler_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_product_handler` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_product_handler`
    DROP KEY `uk_product_member`,
    DROP KEY `idx_member_id`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '接单实体ID',
    ADD UNIQUE KEY `uk_product_entity` (`product_id`, `entity_id`),
    ADD KEY `idx_entity_id` (`entity_id`);

ALTER TABLE `team_order`
    DROP FOREIGN KEY `fk_order_sender`,
    ADD COLUMN `handler_entity_id` INT UNSIGNED NULL AFTER `customer_id`,
    ADD COLUMN `sender_entity_id` INT UNSIGNED NULL AFTER `handler_entity_id`,
    ADD COLUMN `cs_entity_id` INT UNSIGNED NULL AFTER `sender_entity_id`;
UPDATE `team_order` AS `target`
JOIN `entity` AS `entity`
  ON (`target`.`handler_id` = 0
      AND `entity`.`entityable_type` = 'team'
      AND `entity`.`entityable_id` = `target`.`team_id`)
  OR (`target`.`handler_id` > 0
      AND `entity`.`entityable_type` = 'teamMember'
      AND `entity`.`entityable_id` = `target`.`handler_id`)
SET `target`.`handler_entity_id` = `entity`.`id`;
UPDATE `team_order` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`sender_id`
SET `target`.`sender_entity_id` = `entity`.`id`
WHERE `target`.`sender_id` IS NOT NULL;
ALTER TABLE `team_order`
    DROP KEY `idx_handler_id`,
    DROP COLUMN `handler_id`,
    DROP COLUMN `sender_id`,
    MODIFY COLUMN `handler_entity_id` INT UNSIGNED NOT NULL COMMENT '接单实体ID',
    ADD KEY `idx_handler_entity_id` (`handler_entity_id`);

ALTER TABLE `team_member_field_value`
    DROP FOREIGN KEY `fk_member_field_value_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_member_field_value` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_member_field_value`
    DROP KEY `uk_member_field`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID',
    ADD UNIQUE KEY `uk_entity_field` (`entity_id`, `field_id`);

ALTER TABLE `team_join_application`
    DROP FOREIGN KEY `fk_join_application_member`,
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `member_id`;
UPDATE `team_join_application` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `target`.`member_id`
SET `target`.`root_entity_id` = `entity`.`id`
WHERE `target`.`member_id` IS NOT NULL;
ALTER TABLE `team_join_application`
    DROP KEY `idx_member_id`,
    DROP COLUMN `member_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '同意后实体ID',
    ADD KEY `idx_entity_id` (`entity_id`);

ALTER TABLE `team_entity_role`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `entity_id`;
UPDATE `team_entity_role` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = `target`.`entity_type`
 AND `entity`.`entityable_id` = `target`.`entity_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_entity_role`
    DROP KEY `uk_team_entity_role`,
    DROP KEY `idx_team_entity`,
    DROP COLUMN `entity_type`,
    DROP COLUMN `entity_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID',
    ADD UNIQUE KEY `uk_team_entity_role` (`team_id`, `entity_id`, `role_id`),
    ADD KEY `idx_team_entity` (`team_id`, `entity_id`);

ALTER TABLE `entity_session`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `entity_id`;
UPDATE `entity_session` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = `target`.`entity_type`
 AND `entity`.`entityable_id` = `target`.`entity_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `entity_session`
    DROP COLUMN `entity_type`,
    DROP COLUMN `entity_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID';

ALTER TABLE `markdown_reference`
    DROP KEY `uk_source_entity`,
    DROP KEY `idx_entity_identity_id`,
    CHANGE COLUMN `entity_identity_id` `entity_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '引用实体ID',
    ADD UNIQUE KEY `uk_source_entity` (`referenceable_type`, `referenceable_id`, `referenceable_field`, `entity_id`),
    ADD KEY `idx_entity_id` (`entity_id`);

ALTER TABLE `team_entity_field_value`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `entity_id`;
UPDATE `team_entity_field_value` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = `target`.`entity_type`
 AND `entity`.`entityable_id` = `target`.`entity_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `team_entity_field_value`
    DROP KEY `uk_field_entity`,
    DROP KEY `idx_team_entity`,
    DROP COLUMN `entity_type`,
    DROP COLUMN `entity_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID',
    ADD UNIQUE KEY `uk_field_entity` (`field_id`, `entity_id`),
    ADD KEY `idx_team_entity` (`team_id`, `entity_id`);

ALTER TABLE `chat_conversation`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `created_by_id`;
UPDATE `chat_conversation` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = CASE `target`.`created_by_type`
      WHEN 'member' THEN 'teamMember'
      WHEN 'customer' THEN 'teamCustomer'
      WHEN 'virtual' THEN 'teamVirtual'
      ELSE 'team'
  END
 AND `entity`.`entityable_id` = `target`.`created_by_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `chat_conversation`
    DROP COLUMN `created_by_type`,
    DROP COLUMN `created_by_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '创建实体ID';

ALTER TABLE `chat_participant`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `actor_id`;
UPDATE `chat_participant` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = CASE `target`.`actor_type`
      WHEN 'member' THEN 'teamMember'
      WHEN 'customer' THEN 'teamCustomer'
      WHEN 'virtual' THEN 'teamVirtual'
      ELSE 'team'
  END
 AND `entity`.`entityable_id` = `target`.`actor_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `chat_participant`
    DROP KEY `uk_conversation_actor`,
    DROP KEY `idx_team_actor`,
    DROP COLUMN `actor_type`,
    DROP COLUMN `actor_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '参与实体ID',
    ADD UNIQUE KEY `uk_conversation_entity` (`conversation_id`, `entity_id`),
    ADD KEY `idx_team_entity` (`team_id`, `entity_id`);

ALTER TABLE `chat_message`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `sender_id`;
UPDATE `chat_message` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = CASE `target`.`sender_type`
      WHEN 'member' THEN 'teamMember'
      WHEN 'customer' THEN 'teamCustomer'
      WHEN 'virtual' THEN 'teamVirtual'
      ELSE 'team'
  END
 AND `entity`.`entityable_id` = `target`.`sender_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `chat_message`
    DROP KEY `idx_team_sender`,
    DROP COLUMN `sender_type`,
    DROP COLUMN `sender_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '发送实体ID',
    ADD KEY `idx_team_entity` (`team_id`, `entity_id`);

ALTER TABLE `team_member_profile`
    ADD CONSTRAINT `fk_member_profile_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_member_post`
    ADD CONSTRAINT `fk_member_post_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_transaction`
    ADD CONSTRAINT `fk_transaction_handler_entity` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_transaction_sender_entity` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_transaction_cs_entity` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_customer_sender`
    ADD CONSTRAINT `fk_customer_sender_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_product`
    ADD CONSTRAINT `fk_product_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_product_handler`
    ADD CONSTRAINT `fk_product_handler_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_order`
    ADD CONSTRAINT `fk_order_handler_entity` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_order_sender_entity` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_order_cs_entity` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `file`
    ADD CONSTRAINT `fk_file_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_member_field_value`
    ADD CONSTRAINT `fk_member_field_value_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_join_application`
    ADD CONSTRAINT `fk_join_application_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_entity_role`
    ADD CONSTRAINT `fk_entity_role_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `entity_session`
    ADD CONSTRAINT `fk_entity_session_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `markdown_reference`
    ADD CONSTRAINT `fk_markdown_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_entity_field_value`
    ADD CONSTRAINT `fk_entity_field_value_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_conversation`
    ADD CONSTRAINT `fk_chat_conversation_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_participant`
    ADD CONSTRAINT `fk_chat_participant_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_message`
    ADD CONSTRAINT `fk_chat_message_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
