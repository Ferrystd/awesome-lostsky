ALTER TABLE `team_service_field_value`
    DROP FOREIGN KEY `fk_service_field_value_field`;

CREATE TABLE `team_service_redemption_field` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`             INT UNSIGNED NOT NULL COMMENT '团队ID',
    `service_id`          INT UNSIGNED NOT NULL COMMENT '服务ID',
    `legacy_field_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '迁移来源字段ID，迁移后删除',
    `name`                VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '字段名称',
    `value_type`          VARCHAR(20)  NOT NULL DEFAULT 'string' COMMENT '值类型',
    `input_type`          VARCHAR(20)  NOT NULL DEFAULT 'text' COMMENT '输入控件',
    `options`             JSON         NULL COMMENT '字段选项',
    `default_value`       VARCHAR(500) NULL DEFAULT NULL COMMENT '默认值',
    `fill_stage`          VARCHAR(20)  NOT NULL DEFAULT 'customer' COMMENT '填写阶段 customer|manager',
    `is_customer_visible` TINYINT      NOT NULL DEFAULT 1 COMMENT 'Customer是否可见',
    `is_required`         TINYINT      NOT NULL DEFAULT 0 COMMENT '该阶段是否必填',
    `is_active`           TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `sort`                INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_service_redemption_sort` (`service_id`, `is_active`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务核销自定义字段';

CREATE TEMPORARY TABLE `_service_redemption_field_source` AS
SELECT DISTINCT
    old_field.id AS old_field_id,
    old_field.team_id,
    association.service_id,
    old_field.name,
    old_field.value_type,
    old_field.input_type,
    old_field.options,
    old_field.default_value,
    old_field.fill_stage,
    old_field.is_customer_visible,
    old_field.is_required,
    old_field.is_active,
    old_field.sort,
    old_field.create_time,
    old_field.update_time,
    old_field.delete_time
FROM `team_product_redemption_field` old_field
INNER JOIN (
    SELECT product.id AS product_id, package_service.service_id
    FROM `team_product` product
    LEFT JOIN `redemption_campaign` campaign ON campaign.id = product.redemption_campaign_id
    INNER JOIN `benefit_package_service` package_service
        ON package_service.package_id = COALESCE(product.benefit_package_id, campaign.package_id)
    UNION
    SELECT instance.source_product_id AS product_id, instance.service_id
    FROM `team_service_instance` instance
    WHERE instance.source_product_id IS NOT NULL
) association ON association.product_id = old_field.product_id;

INSERT INTO `team_service_redemption_field` (
    `team_id`, `service_id`, `legacy_field_id`, `name`, `value_type`, `input_type`, `options`,
    `default_value`, `fill_stage`, `is_customer_visible`, `is_required`, `is_active`, `sort`,
    `create_time`, `update_time`, `delete_time`
)
SELECT
    `team_id`, `service_id`, `old_field_id`, `name`, `value_type`, `input_type`, `options`,
    `default_value`, `fill_stage`, `is_customer_visible`, `is_required`, `is_active`, `sort`,
    `create_time`, `update_time`, `delete_time`
FROM `_service_redemption_field_source`;

UPDATE `team_service_field_value` field_value
INNER JOIN `team_service_instance` instance ON instance.id = field_value.service_instance_id
INNER JOIN `_service_redemption_field_source` source
    ON source.old_field_id = field_value.field_id AND source.service_id = instance.service_id
INNER JOIN `team_service_redemption_field` new_field
    ON new_field.service_id = source.service_id AND new_field.legacy_field_id = source.old_field_id
SET field_value.field_id = new_field.id;

DROP TABLE `team_product_redemption_field`;

ALTER TABLE `team_service_redemption_field`
    ADD CONSTRAINT `fk_service_redemption_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_service_redemption_field_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`);

ALTER TABLE `team_service_field_value`
    ADD CONSTRAINT `fk_service_field_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_service_redemption_field` (`id`);

ALTER TABLE `team_service_redemption_field`
    DROP COLUMN `legacy_field_id`;

DROP TEMPORARY TABLE `_service_redemption_field_source`;
