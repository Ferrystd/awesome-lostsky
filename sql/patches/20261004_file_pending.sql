ALTER TABLE `file` ADD COLUMN `pending_until` INT UNSIGNED NULL DEFAULT NULL COMMENT '待使用截止时间(NULL=已生效)' AFTER `source`, ADD KEY `idx_file_pending` (`pending_until`);
