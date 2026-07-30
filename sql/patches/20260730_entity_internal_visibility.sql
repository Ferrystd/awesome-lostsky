-- 将 Team 工作空间目录可见性从全局搜索和公开 Display 中独立出来。
-- 既有实体默认内部可见，避免升级后普通目录突然清空。

ALTER TABLE `entity`
    ADD COLUMN `is_internal_visible` TINYINT NOT NULL DEFAULT 0
        COMMENT 'Team内部目录可见：无team.entity.read时仅非Customer实体可按此字段进入工作空间目录；Customer始终需要全量读取权限 0-否 1-是'
        AFTER `is_displayed`,
    ADD KEY `idx_internal_visible` (`is_internal_visible`, `entityable_type`, `id`);

UPDATE `entity`
SET `is_internal_visible` = CASE
    WHEN `entityable_type` IN ('team', 'teamMember') THEN 1
    WHEN `entityable_type` = 'teamVirtual' AND `is_displayed` = 1 THEN 1
    ELSE 0
END;
