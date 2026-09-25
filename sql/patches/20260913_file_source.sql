ALTER TABLE `file`
    ADD COLUMN `source` VARCHAR(20) NOT NULL DEFAULT 'unknown' COMMENT '首次入库来源: unknown/manual/markdown/attachment/join/command/system' AFTER `mime_type`;
