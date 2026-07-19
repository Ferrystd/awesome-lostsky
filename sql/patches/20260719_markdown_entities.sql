CREATE TABLE IF NOT EXISTS `entity_identity` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `slug`              VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '全站唯一且永久保留的对象标识',
    `entityable_type`   VARCHAR(30)  NOT NULL DEFAULT '' COMMENT '对象类型 team/teamMember',
    `entityable_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '对象ID',
    `search_override`   TINYINT      NULL     DEFAULT NULL COMMENT '成员搜索覆盖 NULL-继承 0-禁止 1-允许',
    `create_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`       INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间（身份永久保留）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`),
    UNIQUE KEY `uk_entityable` (`entityable_type`, `entityable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队与成员统一身份表';

INSERT INTO `entity_identity` (`slug`, `entityable_type`, `entityable_id`, `search_override`, `create_time`, `update_time`)
SELECT LOWER(`slug`), 'team', `id`, NULL, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM `team` AS `source_team`
WHERE NOT EXISTS (
    SELECT 1
    FROM `entity_identity` AS `existing_identity`
    WHERE `existing_identity`.`entityable_type` = 'team'
      AND `existing_identity`.`entityable_id` = `source_team`.`id`
);

CREATE TABLE IF NOT EXISTS `markdown_reference` (
    `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `referenceable_type` VARCHAR(30)  NOT NULL DEFAULT '' COMMENT 'Markdown来源类型',
    `referenceable_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Markdown来源ID',
    `referenceable_field` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'Markdown字段名',
    `entity_identity_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '引用身份ID',
    `create_time`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`        INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_source_entity` (`referenceable_type`, `referenceable_id`, `referenceable_field`, `entity_identity_id`),
    KEY `idx_entity_identity_id` (`entity_identity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Markdown多态对象引用表';
