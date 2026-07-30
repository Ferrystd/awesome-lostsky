-- 修正已提前执行 20260730_entity_internal_visibility.sql 的环境：
-- Team 与成员保留团队目录可见；公开展示的虚拟实体可见；
-- Customer 与未公开的虚拟实体默认隐藏，只有 team.entity.read 可以读取。
UPDATE `entity`
SET `is_internal_visible` = CASE
    WHEN `entityable_type` IN ('team', 'teamMember') THEN 1
    WHEN `entityable_type` = 'teamVirtual' AND `is_displayed` = 1 THEN 1
    ELSE 0
END;

ALTER TABLE `entity`
    MODIFY COLUMN `is_internal_visible` TINYINT NOT NULL DEFAULT 0
        COMMENT 'Team内部目录可见：无team.entity.read时仅非Customer实体可按此字段进入工作空间目录；Customer始终需要全量读取权限 0-否 1-是';
