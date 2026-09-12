-- 第一阶段：复用原明细行与ID，允许商品组成项；不改写任何历史权益。
-- MySQL 8，重复执行无副作用。必须在历史映射完成后才另行退役 service_id。
SET @shop_product_items_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'benefit_package_service' AND COLUMN_NAME = 'product_id'),
    'SELECT 1',
    'ALTER TABLE benefit_package_service MODIFY service_id INT UNSIGNED NULL DEFAULT NULL COMMENT ''历史服务ID，与商品ID二选一'', ADD COLUMN product_id INT UNSIGNED NULL DEFAULT NULL COMMENT ''组成商品ID，与历史服务ID二选一'' AFTER service_id, ADD KEY idx_package_item_product (product_id), ADD CONSTRAINT fk_package_item_product FOREIGN KEY (product_id) REFERENCES team_product (id), ADD CONSTRAINT chk_package_item_target CHECK ((service_id IS NULL) <> (product_id IS NULL))'
);
PREPARE shop_product_items_stmt FROM @shop_product_items_ddl;
EXECUTE shop_product_items_stmt;
DEALLOCATE PREPARE shop_product_items_stmt;

ALTER TABLE team_product MODIFY kind TINYINT NOT NULL DEFAULT 1 COMMENT '商品类型 1-普通 2-套餐 3-卡密 4-核销商品';

SET @shop_order_snapshot_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_order' AND COLUMN_NAME = 'fulfillment_snapshot'),
    'SELECT 1',
    'ALTER TABLE team_order ADD COLUMN fulfillment_snapshot JSON NULL COMMENT ''下单时履约配置快照，仅内部使用'' AFTER product_cover_image'
);
PREPARE shop_order_snapshot_stmt FROM @shop_order_snapshot_ddl;
EXECUTE shop_order_snapshot_stmt;
DEALLOCATE PREPARE shop_order_snapshot_stmt;

SET @shop_code_snapshot_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'redemption_code' AND COLUMN_NAME = 'source_claim_id'),
    'SELECT 1',
    'ALTER TABLE redemption_code ADD COLUMN source_claim_id INT UNSIGNED NULL DEFAULT NULL AFTER source_order_id, ADD COLUMN fulfillment_snapshot JSON NULL AFTER source_claim_id, ADD UNIQUE KEY uk_redemption_claim_ordinal (source_claim_id, ordinal), ADD CONSTRAINT fk_redemption_code_claim FOREIGN KEY (source_claim_id) REFERENCES redemption_claim (id)'
);
PREPARE shop_code_snapshot_stmt FROM @shop_code_snapshot_ddl;
EXECUTE shop_code_snapshot_stmt;
DEALLOCATE PREPARE shop_code_snapshot_stmt;

SET @shop_claim_order_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_order' AND COLUMN_NAME = 'source_claim_id'),
    'SELECT 1',
    'ALTER TABLE team_order ADD COLUMN source_claim_id INT UNSIGNED NULL DEFAULT NULL, ADD COLUMN claim_ordinal INT UNSIGNED NULL DEFAULT NULL, ADD UNIQUE KEY uk_order_claim_ordinal (source_claim_id, claim_ordinal), ADD CONSTRAINT fk_order_claim FOREIGN KEY (source_claim_id) REFERENCES redemption_claim (id)'
);
PREPARE shop_claim_order_stmt FROM @shop_claim_order_ddl;
EXECUTE shop_claim_order_stmt;
DEALLOCATE PREPARE shop_claim_order_stmt;
