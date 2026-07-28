-- Entity 委托会话使用父子证明链。MySQL DDL 会隐式提交，因此本补丁不声明伪事务。

ALTER TABLE `entity_session`
    ADD COLUMN `parent_session_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `jti`,
    ADD COLUMN `superseded_at` INT UNSIGNED NULL DEFAULT NULL AFTER `expires_at`,
    ADD KEY `idx_parent_session` (`parent_session_id`),
    DROP KEY `idx_user_device_active`,
    ADD KEY `idx_user_device_active` (`user_id`, `device_token`, `revoked_at`, `superseded_at`);

-- 旧会话没有可验证的授权来源，升级后统一要求重新领取实体身份。
UPDATE `entity_session`
SET `revoked_at` = UNIX_TIMESTAMP()
WHERE `revoked_at` IS NULL;

ALTER TABLE `entity_session`
    ADD CONSTRAINT `fk_entity_session_parent`
    FOREIGN KEY (`parent_session_id`) REFERENCES `entity_session` (`id`);

-- 成员在加入团队时即拥有实体身份；为历史成员补齐可领取的全局 slug。
INSERT INTO `entity_identity`
    (`slug`, `entityable_type`, `entityable_id`, `search_override`, `create_time`, `update_time`, `delete_time`)
SELECT
    CONCAT('member-', `member`.`id`),
    'teamMember',
    `member`.`id`,
    NULL,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    NULL
FROM `team_member` AS `member`
LEFT JOIN `entity_identity` AS `identity`
    ON `identity`.`entityable_type` = 'teamMember'
    AND `identity`.`entityable_id` = `member`.`id`
LEFT JOIN `entity_identity` AS `slug_owner`
    ON `slug_owner`.`slug` = CONCAT('member-', `member`.`id`)
WHERE `member`.`delete_time` IS NULL
    AND `identity`.`id` IS NULL
    AND `slug_owner`.`id` IS NULL;

INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`,
    `role`.`id`,
    `permission`.`permission_key`,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    NULL
FROM `team_role` AS `role`
CROSS JOIN (
    SELECT 'identity.member.*.assume' AS `permission_key`
    UNION ALL SELECT 'identity.customer.*.assume'
) AS `permission`
WHERE `role`.`role_key` = 'owner'
    AND `role`.`delete_time` IS NULL
ON DUPLICATE KEY UPDATE
    `team_id` = VALUES(`team_id`),
    `update_time` = VALUES(`update_time`),
    `delete_time` = NULL;
