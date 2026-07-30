-- LostSky 平台 Admin 应用：用户封禁、平台 RBAC 与无实体审计。

ALTER TABLE `user`
    ADD COLUMN `is_banned` TINYINT NOT NULL DEFAULT 0 COMMENT '是否被平台封禁 0-否 1-是' AFTER `username`;

CREATE TABLE `platform_admin_role` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_key` VARCHAR(50) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL DEFAULT NULL,
    `is_system` TINYINT NOT NULL DEFAULT 0,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_platform_admin_role_key` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台管理员角色';

CREATE TABLE `platform_admin_role_permission` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_id` INT UNSIGNED NOT NULL,
    `permission_key` VARCHAR(100) NOT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_platform_role_permission` (`role_id`, `permission_key`),
    KEY `idx_platform_permission_key` (`permission_key`),
    CONSTRAINT `fk_platform_permission_role`
        FOREIGN KEY (`role_id`) REFERENCES `platform_admin_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台角色权限';

CREATE TABLE `platform_admin_user_role` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `role_id` INT UNSIGNED NOT NULL,
    `assigned_by_user_id` INT UNSIGNED NULL DEFAULT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_platform_admin_user_role` (`user_id`, `role_id`),
    KEY `idx_platform_admin_role_user` (`role_id`, `user_id`),
    CONSTRAINT `fk_platform_admin_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_platform_admin_role` FOREIGN KEY (`role_id`) REFERENCES `platform_admin_role` (`id`),
    CONSTRAINT `fk_platform_admin_assigner` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台管理员角色绑定';

INSERT INTO `platform_admin_role`
    (`role_key`, `name`, `description`, `is_system`, `create_time`, `update_time`)
VALUES
    ('super_admin', '超级管理员', '拥有全部平台管理权限', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

ALTER TABLE `business_audit_event`
    MODIFY COLUMN `entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '执行操作的实体ID，平台或CLI操作为NULL',
    MODIFY COLUMN `authenticated_user_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '完成认证的用户ID，CLI操作为NULL';
