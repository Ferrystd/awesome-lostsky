-- 隐藏规格复用 team_product；保留既有商品、订单和权益 ID。可重复执行。
SET @shop_variants_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_product' AND COLUMN_NAME = 'parent_product_id'),
    'SELECT 1',
    'ALTER TABLE team_product ADD COLUMN parent_product_id INT UNSIGNED NULL DEFAULT NULL COMMENT ''所属多规格主商品，非空为隐藏规格'' AFTER id, ADD COLUMN variant_sort INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''规格排序'' AFTER parent_product_id, ADD KEY idx_product_parent_sort (parent_product_id, variant_sort), ADD CONSTRAINT fk_product_parent FOREIGN KEY (parent_product_id) REFERENCES team_product (id), ADD CONSTRAINT chk_product_variant_parent CHECK (parent_product_id IS NULL OR kind <> 5)'
);
PREPARE shop_variants_stmt FROM @shop_variants_ddl;
EXECUTE shop_variants_stmt;
DEALLOCATE PREPARE shop_variants_stmt;
ALTER TABLE team_product MODIFY kind TINYINT NOT NULL DEFAULT 1 COMMENT '商品类型 1-普通 2-套餐 3-卡密 4-核销商品 5-多规格商品';

SET @shop_purchase_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_product' AND COLUMN_NAME = 'purchase_fields'),
    'SELECT 1', 'ALTER TABLE team_product ADD COLUMN purchase_fields JSON NULL COMMENT ''购买资料字段定义'''
);
PREPARE shop_purchase_stmt FROM @shop_purchase_ddl;
EXECUTE shop_purchase_stmt;
DEALLOCATE PREPARE shop_purchase_stmt;
SET @shop_purchase_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_order' AND COLUMN_NAME = 'purchase_fields'),
    'SELECT 1', 'ALTER TABLE team_order ADD COLUMN purchase_fields JSON NULL COMMENT ''下单时购买资料定义和值的快照'''
);
PREPARE shop_purchase_stmt FROM @shop_purchase_ddl;
EXECUTE shop_purchase_stmt;
DEALLOCATE PREPARE shop_purchase_stmt;
