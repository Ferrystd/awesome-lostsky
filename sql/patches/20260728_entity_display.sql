-- Move public Display visibility from team members to the global entity root.
-- Run after 20260727_entity_profile_post.sql. MySQL DDL implicitly commits.
ALTER TABLE `entity`
    ADD COLUMN `is_displayed` TINYINT NOT NULL DEFAULT 0
        COMMENT '是否在团队公开主页展示 0-否 1-是'
        AFTER `entityable_id`,
    ADD KEY `idx_display` (`is_displayed`, `entityable_type`, `id`);

UPDATE `entity`
JOIN `team_member`
  ON `entity`.`entityable_type` = 'teamMember'
 AND `entity`.`entityable_id` = `team_member`.`id`
SET `entity`.`is_displayed` = `team_member`.`is_displayed`;

ALTER TABLE `team_member` DROP COLUMN `is_displayed`;
