ALTER TABLE `team_service_field_value`
    DROP INDEX `uk_service_field_value`,
    ADD COLUMN `resource_index` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '履约资源序号，从1开始' AFTER `field_id`,
    ADD UNIQUE KEY `uk_service_field_value` (`service_instance_id`, `field_id`, `resource_index`);
