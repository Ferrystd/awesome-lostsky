ALTER TABLE `team_service`
    ADD COLUMN `owner_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '归属Entity ID NULL=团队公用' AFTER `team_id`,
    ADD KEY `idx_team_service_owner` (`team_id`, `owner_entity_id`, `is_active`),
    ADD CONSTRAINT `fk_team_service_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);

ALTER TABLE `benefit_package`
    ADD COLUMN `owner_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '归属Entity ID NULL=团队公用或平台' AFTER `issuer_team_id`,
    ADD KEY `idx_benefit_package_owner` (`issuer_team_id`, `owner_entity_id`, `is_active`),
    ADD CONSTRAINT `fk_benefit_package_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);

ALTER TABLE `redemption_campaign`
    ADD COLUMN `owner_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '归属Entity ID NULL=团队公用或平台' AFTER `issuer_team_id`,
    ADD KEY `idx_redemption_campaign_owner` (`issuer_team_id`, `owner_entity_id`, `is_active`),
    ADD CONSTRAINT `fk_redemption_campaign_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);

UPDATE `team_role_permission` AS `permission`
INNER JOIN `team_role` AS `role`
    ON `role`.`team_id` = `permission`.`team_id`
    AND `role`.`id` = `permission`.`role_id`
SET
    `permission`.`delete_time` = NULL,
    `permission`.`update_time` = UNIX_TIMESTAMP()
WHERE `role`.`role_key` = 'owner'
  AND `role`.`delete_time` IS NULL
  AND `permission`.`permission_key` = 'shop.product.self.package.reprice'
  AND `permission`.`delete_time` IS NOT NULL;

INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT
    `role`.`team_id`, `role`.`id`, 'shop.product.self.package.reprice', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), NULL
FROM `team_role` AS `role`
LEFT JOIN `team_role_permission` AS `permission`
    ON `permission`.`team_id` = `role`.`team_id`
    AND `permission`.`role_id` = `role`.`id`
    AND `permission`.`permission_key` = 'shop.product.self.package.reprice'
WHERE `role`.`role_key` = 'owner'
  AND `role`.`delete_time` IS NULL
  AND `permission`.`id` IS NULL;
