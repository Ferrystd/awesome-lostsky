-- MySQL DDL implicitly commits; statements are intentionally standalone.

CREATE TABLE `external_compensation` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `provider`     VARCHAR(30) NOT NULL COMMENT '外部系统',
    `action`       VARCHAR(30) NOT NULL COMMENT '补偿动作',
    `resource_key` VARCHAR(255) NOT NULL COMMENT '幂等资源键',
    `attempts`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '重试次数',
    `available_at` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '下次重试时间',
    `completed_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '完成时间',
    `last_error`   VARCHAR(1000) NULL DEFAULT NULL COMMENT '最后错误',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_compensation_resource` (`provider`, `action`, `resource_key`),
    KEY `idx_compensation_pending` (`completed_at`, `available_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外部调用补偿任务表';
