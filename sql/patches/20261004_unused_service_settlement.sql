-- 未使用权益时限仅为新发放权益冻结；历史记录默认关闭。可重复执行。
SET @unused_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service' AND COLUMN_NAME = 'unused_auto_complete_after_minutes'),
    'SELECT 1',
    'ALTER TABLE team_service ADD COLUMN unused_auto_complete_after_minutes INT UNSIGNED NULL DEFAULT NULL COMMENT ''未使用权益结单分钟数 NULL=关闭'' AFTER auto_complete_after_minutes'
);
PREPARE unused_stmt FROM @unused_ddl; EXECUTE unused_stmt; DEALLOCATE PREPARE unused_stmt;
SET @unused_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service_entitlement' AND COLUMN_NAME = 'unused_auto_complete_due_at'),
    'SELECT 1',
    'ALTER TABLE team_service_entitlement ADD COLUMN unused_auto_complete_after_minutes INT UNSIGNED NULL DEFAULT NULL COMMENT ''未使用权益结单时长快照'', ADD COLUMN unused_auto_complete_due_at INT UNSIGNED NULL DEFAULT NULL COMMENT ''未使用权益结单期限'', ADD KEY idx_unused_auto_complete (unused_auto_complete_due_at, id)'
);
PREPARE unused_stmt FROM @unused_ddl; EXECUTE unused_stmt; DEALLOCATE PREPARE unused_stmt;
SET @unused_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service_instance' AND COLUMN_NAME = 'settlement_kind'),
    'SELECT 1',
    'ALTER TABLE team_service_instance ADD COLUMN settlement_kind VARCHAR(20) NOT NULL DEFAULT ''service'' COMMENT ''service=正常核销 unused=未使用权益结单'' AFTER auto_complete_after_minutes'
);
PREPARE unused_stmt FROM @unused_ddl; EXECUTE unused_stmt; DEALLOCATE PREPARE unused_stmt;

ALTER TABLE team_transaction MODIFY type TINYINT NOT NULL DEFAULT 1 COMMENT '交易类型: 1-商城下单 2-记账登记 3-服务包收款 4-服务核销 5-履约加价收款 6-履约加价业绩 7-未使用权益结单';
