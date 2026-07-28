-- 将历史人员字段子系统合并到统一实体字段子系统。
-- MySQL DDL 会隐式提交；执行前应备份生产数据。

ALTER TABLE `team_entity_field`
    ADD COLUMN `source` VARCHAR(20) NOT NULL DEFAULT 'custom' COMMENT '字段来源 system/custom' AFTER `name`,
    ADD COLUMN `default_value` VARCHAR(500) NULL DEFAULT NULL COMMENT '默认值' AFTER `options`,
    ADD COLUMN `manager_scope` TINYINT NOT NULL DEFAULT 1 COMMENT '管理范围 1-team 2-subject_team' AFTER `default_value`,
    ADD COLUMN `visibility` TINYINT NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 3-subject_team 4-entity 5-public 6-custom' AFTER `manager_scope`;

UPDATE `team_entity_field`
SET `entity_type` = 'entity'
WHERE `entity_type` = 'member';

INSERT INTO `team_entity_field` (
    `team_id`, `entity_type`, `field_key`, `name`, `source`,
    `value_type`, `input_type`, `options`, `default_value`,
    `manager_scope`, `visibility`, `is_required`, `is_editable`,
    `is_searchable`, `is_visible`, `is_system`, `sort`,
    `create_time`, `update_time`, `delete_time`
)
SELECT
    `legacy`.`team_id`, 'entity', `legacy`.`field_key`, `legacy`.`name`, `legacy`.`source`,
    `legacy`.`value_type`, `legacy`.`input_type`, `legacy`.`options`, `legacy`.`default_value`,
    `legacy`.`manager_scope`, `legacy`.`visibility`, `legacy`.`is_required`, `legacy`.`is_editable`,
    `legacy`.`is_searchable`, IF(`legacy`.`visibility` IN (3, 4, 5), 1, 0),
    `legacy`.`is_system`, `legacy`.`sort`,
    `legacy`.`create_time`, `legacy`.`update_time`, `legacy`.`delete_time`
FROM `team_member_field` AS `legacy`
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `source` = VALUES(`source`),
    `value_type` = VALUES(`value_type`),
    `input_type` = VALUES(`input_type`),
    `options` = VALUES(`options`),
    `default_value` = VALUES(`default_value`),
    `manager_scope` = VALUES(`manager_scope`),
    `visibility` = VALUES(`visibility`),
    `is_required` = VALUES(`is_required`),
    `is_editable` = VALUES(`is_editable`),
    `is_searchable` = VALUES(`is_searchable`),
    `is_visible` = VALUES(`is_visible`),
    `is_system` = VALUES(`is_system`),
    `sort` = VALUES(`sort`),
    `delete_time` = VALUES(`delete_time`);

INSERT INTO `team_entity_field_value` (
    `team_id`, `field_id`, `entity_id`,
    `value_string`, `value_text`, `value_int`, `value_decimal`,
    `value_datetime`, `value_json`,
    `create_time`, `update_time`, `delete_time`
)
SELECT
    `legacy_field`.`team_id`, `entity_field`.`id`, `legacy_value`.`entity_id`,
    `legacy_value`.`value_string`, `legacy_value`.`value_text`, `legacy_value`.`value_int`,
    `legacy_value`.`value_decimal`, `legacy_value`.`value_datetime`, `legacy_value`.`value_json`,
    `legacy_value`.`create_time`, `legacy_value`.`update_time`, `legacy_value`.`delete_time`
FROM `team_member_field_value` AS `legacy_value`
JOIN `team_member_field` AS `legacy_field`
  ON `legacy_field`.`id` = `legacy_value`.`field_id`
JOIN `team_entity_field` AS `entity_field`
  ON `entity_field`.`team_id` = `legacy_field`.`team_id`
 AND `entity_field`.`entity_type` = 'entity'
 AND `entity_field`.`field_key` = `legacy_field`.`field_key`
ON DUPLICATE KEY UPDATE
    `value_string` = VALUES(`value_string`),
    `value_text` = VALUES(`value_text`),
    `value_int` = VALUES(`value_int`),
    `value_decimal` = VALUES(`value_decimal`),
    `value_datetime` = VALUES(`value_datetime`),
    `value_json` = VALUES(`value_json`),
    `delete_time` = VALUES(`delete_time`);

INSERT INTO `visibility_target` (
    `visibleable_type`, `visibleable_id`, `entity_id`,
    `create_time`, `update_time`, `delete_time`
)
SELECT
    'entityField', `entity_field`.`id`, `target`.`entity_id`,
    `target`.`create_time`, `target`.`update_time`, `target`.`delete_time`
FROM `visibility_target` AS `target`
JOIN `team_member_field` AS `legacy_field`
  ON `target`.`visibleable_type` = 'teamMemberField'
 AND `target`.`visibleable_id` = `legacy_field`.`id`
JOIN `team_entity_field` AS `entity_field`
  ON `entity_field`.`team_id` = `legacy_field`.`team_id`
 AND `entity_field`.`entity_type` = 'entity'
 AND `entity_field`.`field_key` = `legacy_field`.`field_key`
ON DUPLICATE KEY UPDATE
    `delete_time` = VALUES(`delete_time`);

DELETE FROM `visibility_target`
WHERE `visibleable_type` = 'teamMemberField';

ALTER TABLE `team_join_field`
    DROP FOREIGN KEY `fk_join_field_member_field`,
    ADD COLUMN `entity_field_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '转存目标实体字段ID' AFTER `member_field_id`;

UPDATE `team_join_field` AS `join_field`
LEFT JOIN `team_member_field` AS `legacy_field`
  ON `legacy_field`.`id` = `join_field`.`member_field_id`
 AND `legacy_field`.`team_id` = `join_field`.`team_id`
LEFT JOIN `team_entity_field` AS `entity_field`
  ON `entity_field`.`team_id` = `join_field`.`team_id`
 AND `entity_field`.`entity_type` = 'entity'
 AND (
      `entity_field`.`field_key` = `legacy_field`.`field_key`
      OR (`legacy_field`.`id` IS NULL AND `entity_field`.`id` = `join_field`.`member_field_id`)
 )
SET `join_field`.`entity_field_id` = `entity_field`.`id`
WHERE `join_field`.`member_field_id` IS NOT NULL;

ALTER TABLE `team_join_field`
    DROP KEY `idx_member_field_id`,
    DROP COLUMN `member_field_id`,
    CHANGE COLUMN `is_transfer_member_field` `is_transfer_entity_field`
        TINYINT NOT NULL DEFAULT 0 COMMENT '加入后自动转存实体字段值 0-否 1-是',
    ADD KEY `idx_entity_field_id` (`entity_field_id`),
    ADD CONSTRAINT `fk_join_field_entity_field`
        FOREIGN KEY (`entity_field_id`) REFERENCES `team_entity_field` (`id`);

INSERT INTO `team_role_permission` (
    `team_id`, `role_id`, `permission_key`,
    `create_time`, `update_time`, `delete_time`
)
SELECT
    `team_id`, `role_id`, 'team.entity_field.manage',
    `create_time`, `update_time`, `delete_time`
FROM `team_role_permission`
WHERE `permission_key` IN (
    'team.entity_field.member.manage',
    'team.entity_field.person.manage',
    'team.member_field.write'
)
ON DUPLICATE KEY UPDATE
    `delete_time` = VALUES(`delete_time`);

DELETE FROM `team_role_permission`
WHERE `permission_key` IN (
    'team.entity_field.member.manage',
    'team.entity_field.person.manage',
    'team.member_field.write'
);

DROP TABLE `team_member_field_value`;
DROP TABLE `team_member_field`;
