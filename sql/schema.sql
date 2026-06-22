-- ============================================
-- LostSky Database Schema
-- Generated from app/model/ definitions
-- Engine: InnoDB  Charset: utf8mb4
-- ============================================

-- ----------------------------
-- Table: user
-- Model: app\model\User
-- ----------------------------
CREATE TABLE `user` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `phone`       VARCHAR(20)  NOT NULL DEFAULT '' COMMENT '手机号',
    `email`       VARCHAR(100) NOT NULL DEFAULT '' COMMENT '邮箱',
    `password`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '密码',
    `username`    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '用户名',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_phone` (`phone`),
    UNIQUE KEY `uk_email` (`email`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- Table: user_profile
-- Model: app\model\UserProfile
-- ----------------------------
CREATE TABLE `user_profile` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID',
    `nickname`    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '昵称',
    `avatar`      VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像',
    `gender`      TINYINT      NOT NULL DEFAULT 0 COMMENT '性别 0-未知 1-男 2-女',
    `birthday`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '生日(时间戳)',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料表';

-- ----------------------------
-- Table: user_setting
-- Model: app\model\UserSetting
-- ----------------------------
CREATE TABLE `user_setting` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID',
    `app_name`    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '应用名称',
    `key`         VARCHAR(100) NOT NULL DEFAULT '' COMMENT '配置键',
    `value`       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '配置值',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_app` (`user_id`, `app_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- ----------------------------
-- Table: user_device
-- Model: app\model\UserDevice
-- ----------------------------
CREATE TABLE `user_device` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID',
    `device_token`     VARCHAR(255) NOT NULL DEFAULT '' COMMENT '设备令牌',
    `device_name`      VARCHAR(100) NOT NULL DEFAULT '' COMMENT '设备名称',
    `ua`               VARCHAR(500) NOT NULL DEFAULT '' COMMENT 'User-Agent',
    `last_active_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最后活跃时间',
    `create_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`      INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_device_token` (`device_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备表';

-- ----------------------------
-- Table: team
-- Model: app\model\Team
-- ----------------------------
CREATE TABLE `team` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `slug`         VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '唯一标识(创建后不可改)',
    `display_name` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '展示名',
    `user_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建者用户ID',
    `is_banned`    TINYINT      NOT NULL DEFAULT 0 COMMENT '是否被封禁 0-否 1-是',
    `is_cancelled` TINYINT      NOT NULL DEFAULT 0 COMMENT '是否已注销 0-否 1-是',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队表';

-- ----------------------------
-- Table: team_profile
-- Model: app\model\TeamProfile
-- ----------------------------
CREATE TABLE `team_profile` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `title`        VARCHAR(100) NOT NULL DEFAULT '' COMMENT '标题',
    `introduction` TEXT         NULL     COMMENT '介绍',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队资料表';

-- ----------------------------
-- Table: team_domain
-- Model: app\model\TeamDomain
-- ----------------------------
CREATE TABLE `team_domain` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `domain`      VARCHAR(255) NOT NULL DEFAULT '' COMMENT '自定义域名',
    `app`         VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '绑定的应用名',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_domain` (`domain`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队域名绑定表';

-- ----------------------------
-- Table: team_member
-- Model: app\model\TeamMember
-- ----------------------------
CREATE TABLE `team_member` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `user_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户ID',
    `is_displayed` TINYINT      NOT NULL DEFAULT 1 COMMENT '是否在成员列表中展示 0-否 1-是',
    `is_blocked`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否被封禁 0-正常 1-封禁',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间(退出团队)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

-- ----------------------------
-- Table: team_member_profile
-- Model: app\model\TeamMemberProfile
-- ----------------------------
CREATE TABLE `team_member_profile` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `member_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队成员ID',
    `nickname`    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '昵称',
    `avatar`      VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员资料表';

-- ----------------------------
-- Table: team_member_post_type
-- Model: app\model\TeamMemberPostType
-- ----------------------------
CREATE TABLE `team_member_post_type` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`        VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '职务类型名称',
    `description` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '职务类型描述',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `post_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '职务ID(team内唯一)',
    `sort`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_post` (`team_id`, `post_id`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员职务类型表';

-- ----------------------------
-- Table: team_member_post
-- Model: app\model\TeamMemberPost
-- ----------------------------
CREATE TABLE `team_member_post` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `member_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队成员ID',
    `post_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '职务ID',
    `type_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '职务类型ID',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_member_post` (`member_id`, `post_id`),
    KEY `idx_type_id` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员职务表';

-- ----------------------------
-- Table: api_request_cache
-- Model: app\model\ApiRequestCache
-- ----------------------------
CREATE TABLE `api_request_cache` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `hash`        VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '请求MD5哈希',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_hash` (`hash`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API请求去重缓存表';

-- ----------------------------
-- Table: team_ability
-- Model: app\model\TeamAbility
-- ----------------------------
CREATE TABLE `team_ability` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `ability_key` VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '能力标识',
    `level`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '能力等级: 0=无 布尔型用0/1 多级用具体值',
    `expire_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '过期时间戳 0=永久',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '授予时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_ability` (`team_id`, `ability_key`),
    KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队能力表';

-- ----------------------------
-- Table: team_notice
-- Model: app\model\TeamNotice
-- ----------------------------
CREATE TABLE `team_notice` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `title`       VARCHAR(200) NOT NULL DEFAULT '' COMMENT '公告标题',
    `content`     TEXT         NULL     COMMENT '公告正文(Markdown)',
    `is_pinned`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否置顶 0-否 1-是',
    `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '团队已读 0-未读 1-已读',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队公告表';
