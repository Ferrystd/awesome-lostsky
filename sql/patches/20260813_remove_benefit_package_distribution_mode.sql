UPDATE `benefit_package_service`
SET
    `unit_handler_cut` = FLOOR(GREATEST((`unit_price` - `unit_cost`) * 100, 0) * `handler_rate_bp` / 10000) / 100,
    `unit_sender_cut` = FLOOR(GREATEST((`unit_price` - `unit_cost`) * 100, 0) * `sender_rate_bp` / 10000) / 100,
    `unit_cs_cut` = FLOOR(GREATEST((`unit_price` - `unit_cost`) * 100, 0) * `cs_rate_bp` / 10000) / 100
WHERE `distribution_mode` = 2;

ALTER TABLE `benefit_package_service`
    DROP COLUMN `distribution_mode`,
    DROP COLUMN `handler_rate_bp`,
    DROP COLUMN `sender_rate_bp`,
    DROP COLUMN `cs_rate_bp`;
