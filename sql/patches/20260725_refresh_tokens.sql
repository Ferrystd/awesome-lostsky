-- MySQL DDL implicitly commits; statements are intentionally standalone.

CREATE TABLE `user_refresh_token` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`        INT UNSIGNED NOT NULL COMMENT '真实用户ID',
    `device_id`      INT UNSIGNED NOT NULL COMMENT '登录设备ID',
    `family_id`      CHAR(32) NOT NULL COMMENT '轮换令牌族',
    `token_hash`     CHAR(64) NOT NULL COMMENT '刷新令牌SHA-256',
    `expires_at`     INT UNSIGNED NOT NULL COMMENT '过期时间',
    `used_at`        INT UNSIGNED NULL DEFAULT NULL COMMENT '轮换使用时间',
    `revoked_at`     INT UNSIGNED NULL DEFAULT NULL COMMENT '撤销时间',
    `replacement_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '后继令牌ID',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_refresh_token_hash` (`token_hash`),
    KEY `idx_refresh_family` (`family_id`, `revoked_at`),
    KEY `idx_refresh_device` (`device_id`, `expires_at`),
    KEY `idx_refresh_user` (`user_id`),
    CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_refresh_device` FOREIGN KEY (`device_id`) REFERENCES `user_device` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户刷新令牌表';
