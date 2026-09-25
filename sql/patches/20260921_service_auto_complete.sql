-- 核销服务保存配置，核销实例保存开始时快照；允许系统自动事件没有人员操作者。可重复执行。
SET @service_auto_complete_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service' AND COLUMN_NAME = 'auto_complete_after_minutes'),
    'SELECT 1',
    'ALTER TABLE team_service ADD COLUMN auto_complete_after_minutes INT UNSIGNED NULL DEFAULT NULL COMMENT ''开始核销后自动结单分钟数 NULL=关闭'' AFTER quantity_step'
);
PREPARE service_auto_complete_stmt FROM @service_auto_complete_ddl;
EXECUTE service_auto_complete_stmt;
DEALLOCATE PREPARE service_auto_complete_stmt;

SET @service_auto_complete_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service_instance' AND COLUMN_NAME = 'auto_complete_after_minutes'),
    'SELECT 1',
    'ALTER TABLE team_service_instance ADD COLUMN auto_complete_after_minutes INT UNSIGNED NULL DEFAULT NULL COMMENT ''本次核销自动结单分钟数快照 NULL=关闭'' AFTER started_at'
);
PREPARE service_auto_complete_stmt FROM @service_auto_complete_ddl;
EXECUTE service_auto_complete_stmt;
DEALLOCATE PREPARE service_auto_complete_stmt;

SET @service_auto_complete_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service_instance' AND INDEX_NAME = 'idx_service_auto_complete'),
    'SELECT 1',
    'ALTER TABLE team_service_instance ADD KEY idx_service_auto_complete (status, auto_complete_after_minutes, started_at, id)'
);
PREPARE service_auto_complete_stmt FROM @service_auto_complete_ddl;
EXECUTE service_auto_complete_stmt;
DEALLOCATE PREPARE service_auto_complete_stmt;

SET @service_auto_complete_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service_event' AND COLUMN_NAME = 'actor_entity_id' AND IS_NULLABLE = 'YES'),
    'SELECT 1',
    'ALTER TABLE team_service_event MODIFY actor_entity_id INT UNSIGNED NULL DEFAULT NULL COMMENT ''操作Entity ID NULL=系统自动操作'''
);
PREPARE service_auto_complete_stmt FROM @service_auto_complete_ddl;
EXECUTE service_auto_complete_stmt;
DEALLOCATE PREPARE service_auto_complete_stmt;
