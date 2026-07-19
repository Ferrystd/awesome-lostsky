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
    `email`       VARCHAR(100) NULL     DEFAULT NULL COMMENT '邮箱',
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
    `description`  VARCHAR(255) NULL     DEFAULT NULL COMMENT '简介',
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
    `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `member_id`             INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队成员ID',
    `nickname`              VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '昵称',
    `avatar`                VARCHAR(255) NOT NULL DEFAULT '' COMMENT '头像',
    `description`           VARCHAR(255) NULL     DEFAULT NULL COMMENT '简介',
    `intro_image`           VARCHAR(255) NULL     DEFAULT NULL COMMENT '自介图',
    `intro_video`           VARCHAR(255) NULL     DEFAULT NULL COMMENT '音介视频',
    `introduction_markdown` TEXT         NULL COMMENT 'Markdown介绍',
    `create_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`           INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
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

-- ----------------------------
-- Table: team_customer
-- Model: app\model\TeamCustomer
-- ----------------------------
CREATE TABLE `team_customer` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `user_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '客户用户ID',
    `is_blocked`  TINYINT      NOT NULL DEFAULT 0 COMMENT '是否被封禁 0-否 1-是',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队客户表';

-- ----------------------------
-- Table: team_transaction
-- Model: app\model\TeamTransaction
-- ----------------------------
CREATE TABLE `team_transaction` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `handler_id`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接单人(0=团队主体,其他=成员ID)',
    `sender_id`     INT UNSIGNED NULL     DEFAULT NULL COMMENT '发单人(NULL=未知,0=团队主体,其他=成员ID)',
    `cs_id`         INT UNSIGNED NULL     DEFAULT NULL COMMENT '客服(NULL=未知,0=团队主体,其他=成员ID)',
    `customer_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '客户ID(NULL=匿名)',
    `type`          TINYINT      NOT NULL DEFAULT 1 COMMENT '交易类型: 1-商城下单 2-记账登记',
    `total_price`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总价',
    `cost`          DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '成本损耗',
    `cash`          DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '现款支付',
    `prepaid`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '预存款支付',
    `handler_cut`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '接单人抽成',
    `sender_cut`    DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '发单人抽成',
    `cs_cut`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '客服抽成',
    `team_cut`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '团队抽成',
    `trans_at`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '实际交易时间戳',
    `memo`          TEXT         NULL     COMMENT '备注',
    `create_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_handler_id` (`handler_id`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_team_create` (`team_id`, `create_time`),
    KEY `idx_team_trans` (`team_id`, `trans_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队流水记录表';

-- ----------------------------
-- Table: team_customer_balance
-- Model: app\model\TeamCustomerBalance
-- ----------------------------
CREATE TABLE `team_customer_balance` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `customer_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '客户ID',
    `balance`     DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '当前余额',
    `recharged`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值',
    `spent`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户预存款余额表';

-- ----------------------------
-- Table: team_customer_balance_log
-- Model: app\model\TeamCustomerBalanceLog
-- ----------------------------
CREATE TABLE `team_customer_balance_log` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `customer_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '客户ID',
    `type`          TINYINT      NOT NULL DEFAULT 0 COMMENT '变动类型: 1-充值 2-消费 3-退款 4-手动调整',
    `amount`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '变动金额(正=增加,负=减少)',
    `balance_after` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '变动后余额',
    `trans_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '关联流水ID',
    `memo`          VARCHAR(255) NOT NULL DEFAULT '' COMMENT '备注',
    `create_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_type` (`type`),
    KEY `idx_trans_id` (`trans_id`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_customer_type` (`customer_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预存款变动日志表';

-- ----------------------------
-- Table: team_customer_sender
-- Model: app\model\TeamCustomerSender
-- ----------------------------
CREATE TABLE `team_customer_sender` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID(冗余,加速查询)',
    `customer_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '客户ID',
    `member_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '发单人ID(团队成员)',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间(解绑)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_customer_member` (`customer_id`, `member_id`),
    KEY `idx_member_id` (`member_id`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户-发单人绑定表';

-- ----------------------------
-- Table: team_customer_profile
-- Model: app\model\TeamCustomerProfile
-- ----------------------------
CREATE TABLE `team_customer_profile` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `customer_id` INT UNSIGNED NOT NULL COMMENT '客户ID',
    `name`        VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '客户名称',
    `memo`        VARCHAR(255) NOT NULL DEFAULT '' COMMENT '备注',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户资料表';

-- ----------------------------
-- Table: team_product
-- Model: app\model\TeamProduct
-- ----------------------------
CREATE TABLE `team_product` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `member_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '专属成员ID(NULL=团队公用)',
    `name`        VARCHAR(100) NOT NULL DEFAULT '' COMMENT '商品名称',
    `description` TEXT         NULL     COMMENT '商品描述',
    `price`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单价',
    `cost`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '成本',
    `handler_cut` DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '接单人默认抽成',
    `sender_cut`  DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '发单人默认抽成',
    `cs_cut`      DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '客服默认抽成',
    `team_cut`    DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '团队默认抽成',
    `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否上架 0-下架 1-上架',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ----------------------------
-- Table: team_product_handler
-- Model: app\model\TeamProductHandler
-- ----------------------------
CREATE TABLE `team_product_handler` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `product_id`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品ID',
    `member_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接单人(团队成员ID)',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_product_member` (`product_id`, `member_id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品接单人白名单';

-- ----------------------------
-- Table: team_order
-- Model: app\model\TeamOrder
-- ----------------------------
CREATE TABLE `team_order` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `customer_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '客户ID',
    `handler_id`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接单人(0=团队主体)',
    `sender_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '发单人(NULL=未知,0=团队主体)',
    `product_id`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品ID',
    `quantity`    INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '数量',
    `unit_price`  DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '下单时单价',
    `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总价',
    `cost`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '成本',
    `handler_cut` DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '接单人抽成',
    `sender_cut`  DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '发单人抽成',
    `cs_cut`      DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '客服抽成',
    `team_cut`    DECIMAL(12,2) NULL     DEFAULT NULL COMMENT '团队抽成',
    `cash`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '现款支付(预留)',
    `prepaid`     DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '预存款支付',
    `trans_id`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '关联流水ID',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '订单状态 1-处理中 2-已完成',
    `memo`        TEXT         NULL     COMMENT '备注',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_handler_id` (`handler_id`),
    KEY `idx_trans_id` (`trans_id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ----------------------------
-- Table: document
-- Model: app\model\Document
-- ----------------------------
CREATE TABLE `document` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `title`             VARCHAR(255) NOT NULL DEFAULT '' COMMENT '文档标题',
    `content`           LONGTEXT     NULL COMMENT '文档内容',
    `documentable_type` VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '多态目标类型 team|teamMember',
    `documentable_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '多态目标ID',
    `manager_scope`     TINYINT      NOT NULL DEFAULT 1 COMMENT '管理范围 1-team 2-subject_team',
    `visibility`        TINYINT      NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 3-subject_team 4-member 5-public 6-custom',
    `sort`              INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`       INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_documentable` (`documentable_type`, `documentable_id`),
    KEY `idx_document_visibility` (`documentable_type`, `documentable_id`, `visibility`, `sort`),
    KEY `idx_manager_scope` (`manager_scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档表';

-- ----------------------------
-- Table: file
-- Model: app\model\File
-- ----------------------------
CREATE TABLE `file` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `hash`        VARCHAR(64)  NOT NULL DEFAULT '' COMMENT 'SHA256文件哈希，去重',
    `name`        VARCHAR(255) NOT NULL DEFAULT '' COMMENT '原始文件名',
    `path`        VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储路径',
    `size`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件大小(字节)',
    `mime_type`   VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'MIME类型',
    `team_id`     INT UNSIGNED NULL     DEFAULT NULL COMMENT 'team id (NULL=system file)',
    `member_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT 'member id (NULL=team upload or system file)',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_hash` (`team_id`, `hash`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';

-- ----------------------------
-- Table: team_setting
-- Model: app\model\TeamSetting
-- ----------------------------
CREATE TABLE `team_setting` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `app_name`    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '应用名称',
    `key`         VARCHAR(100) NOT NULL DEFAULT '' COMMENT '配置键',
    `value`       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '配置值',
    `visibility`  TINYINT      NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 4-member 5-public 6-custom',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_app_key` (`team_id`, `app_name`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队设置表';

-- ----------------------------
-- Table: team_member_field
-- Model: app\model\TeamMemberField
-- ----------------------------
CREATE TABLE `team_member_field` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `field_key`     VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '字段标识',
    `name`          VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '字段名称',
    `source`        VARCHAR(20)  NOT NULL DEFAULT 'custom' COMMENT '字段来源 system|custom',
    `value_type`    VARCHAR(20)  NOT NULL DEFAULT 'string' COMMENT '值类型 string|text|int|decimal|bool|date|datetime|select|multi_select|json',
    `input_type`    VARCHAR(20)  NOT NULL DEFAULT 'text' COMMENT '输入类型 text|textarea|radio|checkbox|select|date|datetime|upload',
    `options`       JSON         NULL COMMENT '字段选项',
    `default_value` VARCHAR(500) NULL     DEFAULT NULL COMMENT '默认值',
    `is_required`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否必填 0-否 1-是',
    `manager_scope` TINYINT      NOT NULL DEFAULT 1 COMMENT '管理范围 1-team 2-subject_team',
    `visibility`    TINYINT      NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 3-subject_team 4-member 5-public',
    `is_editable`   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否可编辑 0-否 1-是',
    `is_searchable` TINYINT      NOT NULL DEFAULT 0 COMMENT '是否可搜索 0-否 1-是',
    `is_system`     TINYINT      NOT NULL DEFAULT 0 COMMENT '是否系统字段 0-否 1-是',
    `sort`          INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_field` (`team_id`, `field_key`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_team_sort` (`team_id`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员字段定义表';

-- ----------------------------
-- Table: visibility_target
-- Model: app\model\VisibilityTarget
-- ----------------------------
CREATE TABLE `visibility_target` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `visibleable_type` VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '可见性主体类型 document|teamSetting|teamMemberField',
    `visibleable_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '可见性主体ID',
    `target_type`      VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '指定对象类型 team|teamMember',
    `target_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '指定对象ID',
    `create_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`      INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_visible_target` (`visibleable_type`, `visibleable_id`, `target_type`, `target_id`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_visibleable` (`visibleable_type`, `visibleable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指定可见对象表';

-- ----------------------------
-- Table: team_member_field_value
-- Model: app\model\TeamMemberFieldValue
-- ----------------------------
CREATE TABLE `team_member_field_value` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `member_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队成员ID',
    `field_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '字段ID',
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
    UNIQUE KEY `uk_member_field` (`member_id`, `field_id`),
    KEY `idx_field_id` (`field_id`),
    KEY `idx_field_string` (`field_id`, `value_string`),
    KEY `idx_field_int` (`field_id`, `value_int`),
    KEY `idx_field_decimal` (`field_id`, `value_decimal`),
    KEY `idx_field_datetime` (`field_id`, `value_datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员字段值表';

-- ----------------------------
-- Table: team_join_field
-- Model: app\model\TeamJoinField
-- ----------------------------
CREATE TABLE `team_join_field` (
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

-- ----------------------------
-- Table: team_join_application
-- Model: app\model\TeamJoinApplication
-- ----------------------------
CREATE TABLE `team_join_application` (
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

-- ----------------------------
-- Table: team_join_field_value
-- Model: app\model\TeamJoinFieldValue
-- ----------------------------
CREATE TABLE `team_join_field_value` (
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

-- ----------------------------
-- Table: team_join_task
-- Model: app\model\TeamJoinTask
-- ----------------------------
CREATE TABLE `team_join_task` (
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

-- ----------------------------
-- Table: team_role
-- Model: app\model\TeamRole
-- ----------------------------
CREATE TABLE `team_role` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `role_key`    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '角色标识',
    `name`        VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '角色名称',
    `description` VARCHAR(255) NULL     DEFAULT NULL COMMENT '角色说明',
    `sort`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_role_key` (`team_id`, `role_key`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队角色表';

-- ----------------------------
-- Table: team_role_permission
-- Model: app\model\TeamRolePermission
-- ----------------------------
CREATE TABLE `team_role_permission` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `role_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '角色ID',
    `permission_key` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '权限标识',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_key`),
    KEY `idx_team_permission` (`team_id`, `permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队角色权限表';

-- ----------------------------
-- Table: team_member_role
-- Model: app\model\TeamMemberRole
-- ----------------------------
CREATE TABLE `team_member_role` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `member_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队成员ID',
    `role_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '角色ID',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_member_role` (`member_id`, `role_id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员角色表';

-- ----------------------------
-- Table: entity_identity
-- Model: app\model\EntityIdentity
-- ----------------------------
CREATE TABLE `entity_identity` (
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

-- ----------------------------
-- Table: markdown_reference
-- Model: app\model\MarkdownReference
-- ----------------------------
CREATE TABLE `markdown_reference` (
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
