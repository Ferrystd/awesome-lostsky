-- Consolidate every public entity profile and post relation on entity.id.
-- Run after 20260726_entity_root.sql. DDL implicitly commits in MySQL.
RENAME TABLE `team_member_profile` TO `team_entity_profile`;
ALTER TABLE `team_entity_profile` DROP FOREIGN KEY `fk_member_profile_entity`;
INSERT INTO `team_entity_profile` (`entity_id`, `nickname`, `avatar`, `description`, `create_time`, `update_time`, `delete_time`)
SELECT `entity`.`id`, `profile`.`nickname`, COALESCE(`profile`.`avatar`, ''), `profile`.`description`, `profile`.`create_time`, `profile`.`update_time`, `profile`.`delete_time`
FROM `team_customer_profile` AS `profile` JOIN `entity` ON `entity`.`entityable_type` = 'teamCustomer' AND `entity`.`entityable_id` = `profile`.`customer_id`;
INSERT INTO `team_entity_profile` (`entity_id`, `nickname`, `avatar`, `description`, `create_time`, `update_time`, `delete_time`)
SELECT `entity`.`id`, `virtual`.`name`, COALESCE(`virtual`.`avatar`, ''), `virtual`.`description`, `virtual`.`create_time`, `virtual`.`update_time`, `virtual`.`delete_time`
FROM `team_virtual` AS `virtual` JOIN `entity` ON `entity`.`entityable_type` = 'teamVirtual' AND `entity`.`entityable_id` = `virtual`.`id`;
INSERT INTO `team_entity_profile` (`entity_id`, `nickname`, `description`, `introduction_markdown`, `create_time`, `update_time`, `delete_time`)
SELECT `entity`.`id`, COALESCE(NULLIF(`team`.`display_name`, ''), `profile`.`title`), `profile`.`description`, `profile`.`introduction`, `profile`.`create_time`, `profile`.`update_time`, `profile`.`delete_time`
FROM `team_profile` AS `profile` JOIN `team` ON `team`.`id` = `profile`.`team_id` JOIN `entity` ON `entity`.`entityable_type` = 'team' AND `entity`.`entityable_id` = `team`.`id`;
ALTER TABLE `team_entity_profile`
    CHANGE COLUMN `nickname` `name` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '展示名称',
    MODIFY COLUMN `avatar` VARCHAR(500) NULL DEFAULT NULL COMMENT '头像',
    MODIFY COLUMN `description` VARCHAR(500) NULL DEFAULT NULL COMMENT '简介',
    ADD CONSTRAINT `fk_entity_profile_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_member_post` DROP FOREIGN KEY `fk_member_post_entity`, DROP FOREIGN KEY `fk_member_post_type`;
DROP TABLE `team_member_post`;
DROP TABLE `team_member_post_type`;
DROP TABLE `team_customer_profile`;
DROP TABLE `team_profile`;
ALTER TABLE `team_virtual` DROP COLUMN `name`, DROP COLUMN `avatar`, DROP COLUMN `description`;
ALTER TABLE `team` DROP COLUMN `display_name`;
UPDATE `markdown_reference` SET `referenceable_type` = 'teamEntityProfile' WHERE `referenceable_type` = 'teamMemberProfile';
