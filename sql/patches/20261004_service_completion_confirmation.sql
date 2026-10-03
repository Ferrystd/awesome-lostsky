-- 结单确认计时独立于接单时间；历史履约须由接单人主动请求。可重复执行。
SET @completion_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'team_service_instance' AND COLUMN_NAME = 'completion_requested_at'),
    'SELECT 1',
    'ALTER TABLE team_service_instance ADD COLUMN completion_requested_at INT UNSIGNED NULL DEFAULT NULL COMMENT ''接单人请求结单时间'' AFTER auto_complete_after_minutes'
);
PREPARE completion_stmt FROM @completion_ddl;
EXECUTE completion_stmt;
DEALLOCATE PREPARE completion_stmt;
SET @completion_ddl = IF(
    EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'team_service_instance' AND INDEX_NAME = 'idx_service_auto_complete'
        AND COLUMN_NAME = 'completion_requested_at'),
    'SELECT 1',
    IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_service_instance' AND INDEX_NAME = 'idx_service_auto_complete'),
        'ALTER TABLE team_service_instance DROP INDEX idx_service_auto_complete, ADD KEY idx_service_auto_complete (status, auto_complete_after_minutes, completion_requested_at, id)',
        'ALTER TABLE team_service_instance ADD KEY idx_service_auto_complete (status, auto_complete_after_minutes, completion_requested_at, id)')
);
PREPARE completion_stmt FROM @completion_ddl;
EXECUTE completion_stmt;
DEALLOCATE PREPARE completion_stmt;

ALTER TABLE team_service MODIFY auto_complete_after_minutes INT UNSIGNED NULL DEFAULT NULL COMMENT '请求结单后顾客确认分钟数 NULL=关闭';
ALTER TABLE team_service_instance MODIFY auto_complete_after_minutes INT UNSIGNED NULL DEFAULT NULL COMMENT '本次结单请求确认分钟数快照 NULL=关闭';
