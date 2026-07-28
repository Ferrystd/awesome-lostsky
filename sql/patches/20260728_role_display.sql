-- 团队角色可独立决定是否出现在 Display 公开实体资料中。
-- DDL 在 MySQL 5.7 / MariaDB 10.3 中会隐式提交，因此本补丁不声明事务。

ALTER TABLE `team_role`
    ADD COLUMN `is_displayed` TINYINT NOT NULL DEFAULT 0
        COMMENT '是否在公开实体资料展示 0-否 1-是'
        AFTER `sort`,
    ADD KEY `idx_display` (`team_id`, `is_displayed`, `sort`, `id`);
