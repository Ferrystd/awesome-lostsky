ALTER TABLE `weibo_task`
  ADD COLUMN `operation_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `creator_entity_id`;
