ALTER TABLE `benefit_package`
    ADD COLUMN `pricing_mode` TINYINT NOT NULL DEFAULT 1 COMMENT '计价方式 1-历史均摊 2-分项计价' AFTER `name`;

ALTER TABLE `benefit_package_service`
    ADD COLUMN `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例价格' AFTER `valid_days`,
    ADD COLUMN `unit_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例成本' AFTER `unit_price`,
    ADD COLUMN `distribution_mode` TINYINT NOT NULL DEFAULT 1 COMMENT '分成方式 1-固定金额 2-按比例' AFTER `unit_cost`,
    ADD COLUMN `unit_handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例接单固定分成' AFTER `distribution_mode`,
    ADD COLUMN `unit_sender_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例发单固定分成' AFTER `unit_handler_cut`,
    ADD COLUMN `unit_cs_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例客服固定分成' AFTER `unit_sender_cut`,
    ADD COLUMN `handler_rate_bp` SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接单分成基点 10000=100%' AFTER `unit_cs_cut`,
    ADD COLUMN `sender_rate_bp` SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '发单分成基点 10000=100%' AFTER `handler_rate_bp`,
    ADD COLUMN `cs_rate_bp` SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '客服分成基点 10000=100%' AFTER `sender_rate_bp`,
    ADD COLUMN `sort` INT NOT NULL DEFAULT 0 COMMENT '套餐内顺序' AFTER `cs_rate_bp`;
