-- Team join application tables
-- Execute this patch on existing databases that were created before the join feature tables existed.

CREATE TABLE IF NOT EXISTS `team_join_field` (
    `id`                       INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`                  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `field_key`                VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '字段标识',
    `name`                     VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '字段名称',
    `value_type`               VARCHAR(20)  NOT NULL DEFAULT 'string' COMMENT '值类型 string|text|int|decimal|bool|date|datetime|select|multi_select|json',
    `input_type`               VARCHAR(20)  NOT NULL DEFAULT 'text' COMMENT '输入类型 text|textarea|radio|checkbox|select|date|datetime|upload',
    `options`                  JSON         NULL COMMENT '字段选项',
    `default_value`            VARCHAR(500) NULL     DEFAULT NULL COMMENT '默认值',
    `is_apply_fillable`        TINYINT      NOT NULL DEFAULT 1 COMMENT '申请加入表单可填写 0-否 1-是',
    `is_apply_required`        TINYINT      NOT NULL DEFAULT 0 COMMENT '申请加入表单必填 0-否 1-是',
    `is_transfer_member_field` TINYINT      NOT NULL DEFAULT 0 COMMENT '进入后自动转存成员字段值 0-否 1-是',
    `member_field_id`          INT UNSIGNED NULL     DEFAULT NULL COMMENT '转存目标成员字段ID',
    `is_active`                TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用 0-否 1-是',
    `sort`                     INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`              INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_field` (`team_id`, `field_key`),
    KEY `idx_team_active_sort` (`team_id`, `is_active`, `sort`),
    KEY `idx_member_field_id` (`member_field_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队加入申请字段定义表';

CREATE TABLE IF NOT EXISTS `team_join_application` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `user_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '申请用户ID',
    `member_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '同意后成员ID',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 1-已申请 2-审核中 3-已取消 4-已加入 5-已拒绝',
    `memo`        VARCHAR(500) NULL     DEFAULT NULL COMMENT '备注/拒绝原因',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_status` (`team_id`, `status`, `id`),
    KEY `idx_team_user` (`team_id`, `user_id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队加入申请表';

CREATE TABLE IF NOT EXISTS `team_join_field_value` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `application_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '加入申请ID',
    `field_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '申请字段ID',
    `value_string`   VARCHAR(500) NULL     DEFAULT NULL COMMENT '字符串值',
    `value_text`     TEXT         NULL COMMENT '文本值',
    `value_int`      INT          NULL     DEFAULT NULL COMMENT '整数值',
    `value_decimal`  DECIMAL(12,2) NULL   DEFAULT NULL COMMENT '小数值',
    `value_datetime` INT UNSIGNED NULL     DEFAULT NULL COMMENT '时间值',
    `value_json`     JSON         NULL COMMENT 'JSON值',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_application_field` (`application_id`, `field_id`),
    KEY `idx_field_id` (`field_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队加入申请字段值表';

CREATE TABLE IF NOT EXISTS `team_join_task` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `application_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '加入申请ID',
    `title`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '审核任务标题',
    `description`    VARCHAR(500) NULL     DEFAULT NULL COMMENT '审核任务说明',
    `is_passed`      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否通过 0-暂未通过 1-已通过',
    `sort`           INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_application_sort` (`application_id`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队加入审核任务表';
