-- 开发阶段不保留旧“人员本人可见”兼容列，统一使用 manager_scope 与 visibility。
ALTER TABLE `team_entity_field`
    DROP COLUMN `is_visible`;
