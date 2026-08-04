ALTER TABLE `team_transaction`
    MODIFY `handler_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '接单实体ID，服务包收款可为空',
    ADD COLUMN `service_credit` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '服务权益核销金额' AFTER `prepaid`,
    ADD COLUMN `service_instance_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '关联服务实例ID' AFTER `team_cut`,
    MODIFY `type` TINYINT NOT NULL DEFAULT 1 COMMENT '交易类型: 1-商城下单 2-记账登记 3-服务包收款 4-服务核销';

ALTER TABLE `team_product`
    ADD COLUMN `kind` TINYINT NOT NULL DEFAULT 1 COMMENT '商品类型 1-普通 2-服务套餐 3-权益卡密' AFTER `team_cut`,
    ADD COLUMN `benefit_package_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '服务套餐权益ID' AFTER `kind`,
    ADD COLUMN `redemption_campaign_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '卡密活动ID' AFTER `benefit_package_id`;

ALTER TABLE `team_order`
    MODIFY `handler_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '接单实体ID，服务套餐/卡密可为空';

CREATE TABLE `benefit_package` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `issuer_team_id` INT UNSIGNED NULL,
  `name` VARCHAR(100) NOT NULL DEFAULT '', `is_active` TINYINT NOT NULL DEFAULT 1,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `delete_time` INT UNSIGNED NULL, PRIMARY KEY (`id`), KEY `idx_benefit_package_issuer` (`issuer_team_id`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `benefit_package_ability` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `package_id` INT UNSIGNED NOT NULL,
  `ability_key` VARCHAR(50) NOT NULL DEFAULT '', `level` INT UNSIGNED NOT NULL DEFAULT 1,
  `duration_days` INT UNSIGNED NOT NULL DEFAULT 0, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_package_ability` (`package_id`,`ability_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_service` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL DEFAULT '', `description` TEXT NULL,
  `default_total_price` DECIMAL(12,2) NOT NULL DEFAULT 0, `default_cost` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `default_handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0, `default_sender_cut` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `default_cs_cut` DECIMAL(12,2) NOT NULL DEFAULT 0, `default_team_cut` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `is_active` TINYINT NOT NULL DEFAULT 1, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), KEY `idx_team_service` (`team_id`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_service_handler` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `service_id` INT UNSIGNED NOT NULL, `entity_id` INT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_service_handler` (`service_id`,`entity_id`), KEY `idx_service_handler_entity` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `benefit_package_service` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `package_id` INT UNSIGNED NOT NULL, `service_id` INT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1, `valid_days` INT UNSIGNED NOT NULL DEFAULT 0,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_package_service` (`package_id`,`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redemption_campaign` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `package_id` INT UNSIGNED NOT NULL, `issuer_team_id` INT UNSIGNED NULL,
  `name` VARCHAR(100) NOT NULL DEFAULT '', `claim_group` VARCHAR(100) NOT NULL DEFAULT '', `mode` TINYINT NOT NULL DEFAULT 1,
  `total_limit` INT UNSIGNED NULL, `per_target_limit` INT UNSIGNED NOT NULL DEFAULT 1,
  `redeem_starts_at` INT UNSIGNED NOT NULL DEFAULT 0, `redeem_ends_at` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT NOT NULL DEFAULT 1, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), KEY `idx_redemption_campaign` (`issuer_team_id`,`is_active`), KEY `idx_redemption_claim_group` (`claim_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redemption_code` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `campaign_id` INT UNSIGNED NOT NULL,
  `source_order_id` INT UNSIGNED NULL, `ordinal` INT UNSIGNED NOT NULL DEFAULT 1,
  `holder_entity_id` INT UNSIGNED NULL, `target_team_id` INT UNSIGNED NULL, `target_entity_id` INT UNSIGNED NULL,
  `code_hint` VARCHAR(20) NOT NULL DEFAULT '', `code_hash` CHAR(64) NOT NULL, `code_ciphertext` TEXT NOT NULL,
  `max_uses` INT UNSIGNED NULL DEFAULT 1, `use_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `expire_time` INT UNSIGNED NOT NULL DEFAULT 0, `is_active` TINYINT NOT NULL DEFAULT 1,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_redemption_code_hash` (`code_hash`),
  UNIQUE KEY `uk_redemption_order_ordinal` (`source_order_id`,`ordinal`), KEY `idx_redemption_holder` (`holder_entity_id`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `redemption_claim` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `campaign_id` INT UNSIGNED NOT NULL, `code_id` INT UNSIGNED NOT NULL,
  `claim_key` VARCHAR(191) NOT NULL DEFAULT '', `target_team_id` INT UNSIGNED NULL, `target_entity_id` INT UNSIGNED NULL,
  `claimed_by_entity_id` INT UNSIGNED NOT NULL, `claimed_at` INT UNSIGNED NOT NULL DEFAULT 0,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_redemption_claim_key` (`claim_key`), KEY `idx_redemption_claim_code` (`code_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_ability_grant` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL, `ability_key` VARCHAR(50) NOT NULL DEFAULT '',
  `level` INT UNSIGNED NOT NULL DEFAULT 1, `starts_at` INT UNSIGNED NOT NULL DEFAULT 0, `ends_at` INT UNSIGNED NOT NULL DEFAULT 0,
  `source_type` VARCHAR(30) NOT NULL DEFAULT 'manual', `source_claim_id` INT UNSIGNED NULL,
  `revoked_at` INT UNSIGNED NULL, `revoke_reason` VARCHAR(500) NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_ability_grant_claim` (`source_claim_id`,`ability_key`),
  KEY `idx_ability_grant_active` (`team_id`,`ability_key`,`starts_at`,`ends_at`,`revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `team_ability_grant`
  (`team_id`,`ability_key`,`level`,`starts_at`,`ends_at`,`source_type`,`create_time`,`update_time`)
SELECT `team_id`,`ability_key`,`level`,`create_time`,`expire_time`,'legacy',`create_time`,`update_time`
FROM `team_ability` WHERE `delete_time` IS NULL;

CREATE TABLE `team_product_redemption_field` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL, `product_id` INT UNSIGNED NOT NULL,
  `field_key` VARCHAR(64) NOT NULL DEFAULT '', `name` VARCHAR(50) NOT NULL DEFAULT '',
  `value_type` VARCHAR(20) NOT NULL DEFAULT 'string', `input_type` VARCHAR(20) NOT NULL DEFAULT 'text',
  `options` JSON NULL, `default_value` VARCHAR(500) NULL, `fill_stage` VARCHAR(20) NOT NULL DEFAULT 'customer',
  `is_customer_visible` TINYINT NOT NULL DEFAULT 1, `is_required` TINYINT NOT NULL DEFAULT 0,
  `is_active` TINYINT NOT NULL DEFAULT 1, `sort` INT NOT NULL DEFAULT 0,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_product_redemption_field` (`product_id`,`field_key`),
  KEY `idx_product_redemption_sort` (`product_id`,`is_active`,`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_service_instance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL, `service_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL, `holder_entity_id` INT UNSIGNED NOT NULL, `source_product_id` INT UNSIGNED NULL,
  `source_order_id` INT UNSIGNED NULL, `source_claim_id` INT UNSIGNED NULL, `ordinal` INT UNSIGNED NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1, `handler_entity_id` INT UNSIGNED NULL, `sender_entity_id` INT UNSIGNED NULL,
  `cs_entity_id` INT UNSIGNED NULL, `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0, `cost` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0, `sender_cut` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `cs_cut` DECIMAL(12,2) NOT NULL DEFAULT 0, `team_cut` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `expire_time` INT UNSIGNED NOT NULL DEFAULT 0, `started_at` INT UNSIGNED NULL, `completed_at` INT UNSIGNED NULL,
  `trans_id` INT UNSIGNED NULL, `memo` TEXT NULL, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_service_order_ordinal` (`source_order_id`,`ordinal`),
  UNIQUE KEY `uk_service_claim_ordinal` (`source_claim_id`,`ordinal`), UNIQUE KEY `uk_service_instance_trans` (`trans_id`),
  KEY `idx_service_customer_status` (`customer_id`,`status`,`id`), KEY `idx_service_handler_status` (`handler_entity_id`,`status`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_service_field_value` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `service_instance_id` INT UNSIGNED NOT NULL, `field_id` INT UNSIGNED NOT NULL,
  `value_string` VARCHAR(500) NULL, `value_text` TEXT NULL, `value_int` INT NULL, `value_decimal` DECIMAL(12,2) NULL,
  `value_datetime` INT UNSIGNED NULL, `value_json` JSON NULL, `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
  `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_service_field_value` (`service_instance_id`,`field_id`), KEY `idx_service_field` (`field_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_service_cancel_request` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `service_instance_id` INT UNSIGNED NOT NULL,
  `requested_by_entity_id` INT UNSIGNED NOT NULL, `status` TINYINT NOT NULL DEFAULT 1,
  `reason` VARCHAR(500) NOT NULL DEFAULT '', `decided_by_entity_id` INT UNSIGNED NULL,
  `decision_reason` VARCHAR(500) NULL, `decided_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), KEY `idx_service_cancel_open` (`service_instance_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_service_event` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `service_instance_id` INT UNSIGNED NOT NULL,
  `actor_entity_id` INT UNSIGNED NOT NULL, `event_type` VARCHAR(30) NOT NULL DEFAULT '',
  `from_handler_entity_id` INT UNSIGNED NULL, `to_handler_entity_id` INT UNSIGNED NULL, `detail` JSON NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), KEY `idx_service_event_instance` (`service_instance_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `team_transaction` ADD UNIQUE KEY `uk_transaction_service_instance` (`service_instance_id`);
ALTER TABLE `benefit_package` ADD CONSTRAINT `fk_benefit_package_issuer` FOREIGN KEY (`issuer_team_id`) REFERENCES `team` (`id`);
ALTER TABLE `benefit_package_ability` ADD CONSTRAINT `fk_package_ability_package` FOREIGN KEY (`package_id`) REFERENCES `benefit_package` (`id`);
ALTER TABLE `team_service` ADD CONSTRAINT `fk_team_service_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_service_handler` ADD CONSTRAINT `fk_service_handler_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_service_handler_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `benefit_package_service` ADD CONSTRAINT `fk_package_service_package` FOREIGN KEY (`package_id`) REFERENCES `benefit_package` (`id`), ADD CONSTRAINT `fk_package_service_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`);
ALTER TABLE `redemption_campaign` ADD CONSTRAINT `fk_redemption_campaign_package` FOREIGN KEY (`package_id`) REFERENCES `benefit_package` (`id`), ADD CONSTRAINT `fk_redemption_campaign_issuer` FOREIGN KEY (`issuer_team_id`) REFERENCES `team` (`id`);
ALTER TABLE `redemption_code` ADD CONSTRAINT `fk_redemption_code_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `redemption_campaign` (`id`), ADD CONSTRAINT `fk_redemption_code_order` FOREIGN KEY (`source_order_id`) REFERENCES `team_order` (`id`), ADD CONSTRAINT `fk_redemption_code_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_redemption_code_target_team` FOREIGN KEY (`target_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_redemption_code_target_entity` FOREIGN KEY (`target_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `redemption_claim` ADD CONSTRAINT `fk_redemption_claim_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `redemption_campaign` (`id`), ADD CONSTRAINT `fk_redemption_claim_code` FOREIGN KEY (`code_id`) REFERENCES `redemption_code` (`id`), ADD CONSTRAINT `fk_redemption_claim_target_team` FOREIGN KEY (`target_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_redemption_claim_target_entity` FOREIGN KEY (`target_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_redemption_claim_actor` FOREIGN KEY (`claimed_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_ability_grant` ADD CONSTRAINT `fk_ability_grant_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_ability_grant_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`);
ALTER TABLE `team_product` ADD CONSTRAINT `fk_product_benefit_package` FOREIGN KEY (`benefit_package_id`) REFERENCES `benefit_package` (`id`), ADD CONSTRAINT `fk_product_redemption_campaign` FOREIGN KEY (`redemption_campaign_id`) REFERENCES `redemption_campaign` (`id`);
ALTER TABLE `team_product_redemption_field` ADD CONSTRAINT `fk_product_redemption_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_product_redemption_field_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`);
ALTER TABLE `team_service_instance` ADD CONSTRAINT `fk_service_instance_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_service_instance_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_service_instance_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_service_instance_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_product` FOREIGN KEY (`source_product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_service_instance_order` FOREIGN KEY (`source_order_id`) REFERENCES `team_order` (`id`), ADD CONSTRAINT `fk_service_instance_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`), ADD CONSTRAINT `fk_service_instance_handler` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_sender` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_cs` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `team_transaction` ADD CONSTRAINT `fk_transaction_service_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`);
ALTER TABLE `team_service_field_value` ADD CONSTRAINT `fk_service_field_value_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_service_field_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_product_redemption_field` (`id`);
ALTER TABLE `team_service_cancel_request` ADD CONSTRAINT `fk_service_cancel_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_service_cancel_requester` FOREIGN KEY (`requested_by_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_cancel_decider` FOREIGN KEY (`decided_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_service_event` ADD CONSTRAINT `fk_service_event_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_service_event_actor` FOREIGN KEY (`actor_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_event_from_handler` FOREIGN KEY (`from_handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_event_to_handler` FOREIGN KEY (`to_handler_entity_id`) REFERENCES `entity` (`id`);
