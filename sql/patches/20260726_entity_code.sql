-- Replace the temporary person code with the canonical entity code.
-- This patch is safe after 20260726_member_field_to_entity.sql and is a no-op
-- for installations that already use the final entity value.
-- ALTER TABLE implicitly commits in MySQL.

UPDATE `team_entity_field`
SET `entity_type` = 'entity'
WHERE `entity_type` IN ('member', 'person');

ALTER TABLE `team_entity_field`
    MODIFY COLUMN `entity_type` VARCHAR(20) NOT NULL DEFAULT 'entity'
        COMMENT '对象类型 entity/customer/virtual';

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
