-- Replace Document ownership and custom visibility target type/id pairs with entity.id.
-- MySQL DDL statements implicitly commit; take a backup before applying in production.

ALTER TABLE `document`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `documentable_id`;
UPDATE `document` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = `target`.`documentable_type`
 AND `entity`.`entityable_id` = `target`.`documentable_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `document`
    DROP KEY `idx_documentable`,
    DROP KEY `idx_document_visibility`,
    DROP COLUMN `documentable_type`,
    DROP COLUMN `documentable_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '归属实体ID',
    ADD KEY `idx_entity_id` (`entity_id`),
    ADD KEY `idx_entity_visibility` (`entity_id`, `visibility`, `sort`),
    ADD CONSTRAINT `fk_document_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);

ALTER TABLE `visibility_target`
    ADD COLUMN `root_entity_id` INT UNSIGNED NULL AFTER `target_id`;
UPDATE `visibility_target` AS `target`
JOIN `entity` AS `entity`
  ON `entity`.`entityable_type` = `target`.`target_type`
 AND `entity`.`entityable_id` = `target`.`target_id`
SET `target`.`root_entity_id` = `entity`.`id`;
ALTER TABLE `visibility_target`
    DROP KEY `uk_visible_target`,
    DROP KEY `idx_target`,
    DROP COLUMN `target_type`,
    DROP COLUMN `target_id`,
    CHANGE COLUMN `root_entity_id` `entity_id` INT UNSIGNED NOT NULL COMMENT '指定实体ID',
    ADD UNIQUE KEY `uk_visible_entity` (`visibleable_type`, `visibleable_id`, `entity_id`),
    ADD KEY `idx_entity_id` (`entity_id`),
    ADD CONSTRAINT `fk_visibility_target_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
