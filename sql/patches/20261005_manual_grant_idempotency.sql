-- 可重复执行；领取组互斥继续生效，移除未使用的次数配置。
SET @grant_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'redemption_campaign' AND COLUMN_NAME = 'per_target_limit'),
    'ALTER TABLE redemption_campaign DROP COLUMN per_target_limit',
    'SELECT 1'
);
PREPARE grant_stmt FROM @grant_ddl; EXECUTE grant_stmt; DEALLOCATE PREPARE grant_stmt;

CREATE TABLE IF NOT EXISTS `manual_entitlement_grant_operation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL COMMENT '目标团队',
    `actor_entity_id` INT UNSIGNED NOT NULL COMMENT '当前全局 Entity',
    `idempotency_key` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '业务提交 UUID',
    `request_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '规范化业务请求 SHA256',
    `result` JSON NULL COMMENT '成功结果；NULL 仅存在于未提交事务',
    `create_time` INT UNSIGNED NOT NULL,
    `update_time` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_manual_grant_operation` (`team_id`, `actor_entity_id`, `idempotency_key`),
    KEY `idx_manual_grant_actor` (`actor_entity_id`),
    CONSTRAINT `fk_manual_grant_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    CONSTRAINT `fk_manual_grant_actor` FOREIGN KEY (`actor_entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='手动发放持久幂等账本，无自动清理';
