ALTER TABLE `team_service`
    ADD COLUMN `unit_name` VARCHAR(20) NOT NULL DEFAULT '次' COMMENT '计量单位名称' AFTER `description`,
    ADD COLUMN `quantity_step` DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '最小核销单位' AFTER `unit_name`;

ALTER TABLE `benefit_package_service`
    MODIFY COLUMN `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '授予服务额度';

CREATE TABLE `team_service_entitlement` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL,
    `service_id` INT UNSIGNED NOT NULL,
    `customer_id` INT UNSIGNED NOT NULL,
    `holder_entity_id` INT UNSIGNED NOT NULL,
    `sender_entity_id` INT UNSIGNED NULL,
    `cs_entity_id` INT UNSIGNED NULL,
    `source_product_id` INT UNSIGNED NULL,
    `source_order_id` INT UNSIGNED NULL,
    `source_claim_id` INT UNSIGNED NULL,
    `source_package_item_id` INT UNSIGNED NULL,
    `ordinal` INT UNSIGNED NOT NULL,
    `unit_name` VARCHAR(20) NOT NULL DEFAULT '次',
    `quantity_step` DECIMAL(18,4) NOT NULL DEFAULT 1.0000,
    `granted_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    `reserved_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    `consumed_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `sender_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `cs_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `team_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `expire_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_entitlement_order_ordinal` (`source_order_id`,`ordinal`),
    UNIQUE KEY `uk_entitlement_claim_ordinal` (`source_claim_id`,`ordinal`),
    KEY `idx_entitlement_customer` (`customer_id`,`id`),
    KEY `idx_entitlement_holder` (`holder_entity_id`,`id`),
    KEY `idx_entitlement_team_service` (`team_id`,`service_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entity持有的可计量服务权益';

ALTER TABLE `team_service_instance`
    ADD COLUMN `entitlement_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '服务权益ID' AFTER `holder_entity_id`,
    ADD COLUMN `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '本次履约数量' AFTER `ordinal`;

INSERT INTO `team_service_entitlement` (
    `id`,`team_id`,`service_id`,`customer_id`,`holder_entity_id`,`sender_entity_id`,`cs_entity_id`,`source_product_id`,`source_order_id`,
    `source_claim_id`,`ordinal`,`unit_name`,`quantity_step`,`granted_quantity`,
    `reserved_quantity`,`consumed_quantity`,`total_price`,`cost`,`handler_cut`,`sender_cut`,`cs_cut`,
    `team_cut`,`expire_time`,`create_time`,`update_time`,`delete_time`
)
SELECT
    instance.`id`,instance.`team_id`,instance.`service_id`,instance.`customer_id`,instance.`holder_entity_id`,instance.`sender_entity_id`,instance.`cs_entity_id`,
    instance.`source_product_id`,instance.`source_order_id`,instance.`source_claim_id`,instance.`ordinal`,
    service.`unit_name`,service.`quantity_step`,1.0000,
    IF(instance.`status` = 2,1.0000,0.0000),IF(instance.`status` = 3,1.0000,0.0000),
    instance.`total_price`,instance.`cost`,instance.`handler_cut`,instance.`sender_cut`,instance.`cs_cut`,
    instance.`team_cut`,instance.`expire_time`,instance.`create_time`,instance.`update_time`,instance.`delete_time`
FROM `team_service_instance` instance
INNER JOIN `team_service` service ON service.`id` = instance.`service_id`;

UPDATE `team_service_instance` SET `entitlement_id` = `id`;

ALTER TABLE `team_service_instance`
    MODIFY COLUMN `entitlement_id` INT UNSIGNED NOT NULL COMMENT '服务权益ID',
    DROP INDEX `uk_service_order_ordinal`,
    DROP INDEX `uk_service_claim_ordinal`,
    ADD UNIQUE KEY `uk_service_entitlement_ordinal` (`entitlement_id`,`ordinal`),
    ADD KEY `idx_service_order` (`source_order_id`,`id`),
    ADD KEY `idx_service_claim` (`source_claim_id`,`id`);

CREATE TABLE `team_service_adjustment` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL,
    `service_instance_id` INT UNSIGNED NOT NULL,
    `customer_id` INT UNSIGNED NOT NULL,
    `requested_by_entity_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL DEFAULT '',
    `quantity` DECIMAL(18,4) NOT NULL DEFAULT 1.0000,
    `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `sender_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `cs_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `team_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` TINYINT NOT NULL DEFAULT 1,
    `decided_by_entity_id` INT UNSIGNED NULL,
    `decided_at` INT UNSIGNED NULL,
    `receipt_trans_id` INT UNSIGNED NULL,
    `performance_trans_id` INT UNSIGNED NULL,
    `memo` VARCHAR(500) NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    KEY `idx_adjustment_instance_status` (`service_instance_id`,`status`,`id`),
    KEY `idx_adjustment_customer_status` (`customer_id`,`status`,`id`),
    UNIQUE KEY `uk_adjustment_receipt_trans` (`receipt_trans_id`),
    UNIQUE KEY `uk_adjustment_performance_trans` (`performance_trans_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='履约费用调整';

ALTER TABLE `team_transaction`
    MODIFY COLUMN `type` TINYINT NOT NULL DEFAULT 1 COMMENT '交易类型: 1-商城下单 2-记账登记 3-服务包收款 4-服务核销 5-履约加价收款 6-履约加价业绩',
    ADD COLUMN `service_adjustment_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '关联履约费用调整ID' AFTER `service_instance_id`,
    ADD KEY `idx_transaction_service_adjustment` (`service_adjustment_id`,`type`);

ALTER TABLE `team_service_entitlement`
    ADD CONSTRAINT `fk_entitlement_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_entitlement_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`),
    ADD CONSTRAINT `fk_entitlement_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`),
    ADD CONSTRAINT `fk_entitlement_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_entitlement_sender` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_entitlement_cs` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_entitlement_product` FOREIGN KEY (`source_product_id`) REFERENCES `team_product` (`id`),
    ADD CONSTRAINT `fk_entitlement_order` FOREIGN KEY (`source_order_id`) REFERENCES `team_order` (`id`),
    ADD CONSTRAINT `fk_entitlement_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`),
    ADD CONSTRAINT `fk_entitlement_package_item` FOREIGN KEY (`source_package_item_id`) REFERENCES `benefit_package_service` (`id`);

ALTER TABLE `team_service_instance`
    ADD CONSTRAINT `fk_service_instance_entitlement` FOREIGN KEY (`entitlement_id`) REFERENCES `team_service_entitlement` (`id`);

ALTER TABLE `team_service_adjustment`
    ADD CONSTRAINT `fk_adjustment_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_adjustment_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`),
    ADD CONSTRAINT `fk_adjustment_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`),
    ADD CONSTRAINT `fk_adjustment_requester` FOREIGN KEY (`requested_by_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_adjustment_decider` FOREIGN KEY (`decided_by_entity_id`) REFERENCES `entity` (`id`),
    ADD CONSTRAINT `fk_adjustment_receipt_trans` FOREIGN KEY (`receipt_trans_id`) REFERENCES `team_transaction` (`id`),
    ADD CONSTRAINT `fk_adjustment_performance_trans` FOREIGN KEY (`performance_trans_id`) REFERENCES `team_transaction` (`id`);

ALTER TABLE `team_transaction`
    ADD CONSTRAINT `fk_transaction_service_adjustment` FOREIGN KEY (`service_adjustment_id`) REFERENCES `team_service_adjustment` (`id`);
