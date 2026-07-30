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
    `is_banned`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否被平台封禁 0-否 1-是',
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
-- Table: user_refresh_token
-- Model: app\model\UserRefreshToken
-- ----------------------------
CREATE TABLE `user_refresh_token` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`        INT UNSIGNED NOT NULL COMMENT '真实用户ID',
    `device_id`      INT UNSIGNED NOT NULL COMMENT '登录设备ID',
    `family_id`      CHAR(32) NOT NULL COMMENT '轮换令牌族',
    `token_hash`     CHAR(64) NOT NULL COMMENT '刷新令牌SHA-256',
    `expires_at`     INT UNSIGNED NOT NULL COMMENT '过期时间',
    `used_at`        INT UNSIGNED NULL DEFAULT NULL COMMENT '轮换使用时间',
    `revoked_at`     INT UNSIGNED NULL DEFAULT NULL COMMENT '撤销时间',
    `replacement_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '后继令牌ID',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_refresh_token_hash` (`token_hash`),
    KEY `idx_refresh_family` (`family_id`, `revoked_at`),
    KEY `idx_refresh_device` (`device_id`, `expires_at`),
    KEY `idx_refresh_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户刷新令牌表';

-- ----------------------------
-- Table: external_compensation
-- Model: app\model\ExternalCompensation
-- ----------------------------
CREATE TABLE `external_compensation` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `provider`     VARCHAR(30) NOT NULL COMMENT '外部系统',
    `action`       VARCHAR(30) NOT NULL COMMENT '补偿动作',
    `resource_key` VARCHAR(255) NOT NULL COMMENT '幂等资源键',
    `attempts`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '重试次数',
    `available_at` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '下次重试时间',
    `completed_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '完成时间',
    `last_error`   VARCHAR(1000) NULL DEFAULT NULL COMMENT '最后错误',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_compensation_resource` (`provider`, `action`, `resource_key`),
    KEY `idx_compensation_pending` (`completed_at`, `available_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外部调用补偿任务表';

-- ----------------------------
-- Table: team
-- Model: app\model\Team
-- ----------------------------
CREATE TABLE `team` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `slug`         VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '唯一标识(创建后不可改)',
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
    `is_blocked`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否被封禁 0-正常 1-封禁',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间(退出团队)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

-- ----------------------------
-- Table: team_entity_profile
-- Model: app\model\TeamEntityProfile
-- ----------------------------
CREATE TABLE `team_entity_profile` (
    `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `entity_id`             INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '实体ID',
    `name`                  VARCHAR(100) NOT NULL DEFAULT '' COMMENT '展示名称',
    `avatar`                VARCHAR(500) NULL     DEFAULT NULL COMMENT '头像',
    `description`           VARCHAR(500) NULL     DEFAULT NULL COMMENT '简介',
    `intro_image`           VARCHAR(255) NULL     DEFAULT NULL COMMENT '自介图',
    `intro_video`           VARCHAR(255) NULL     DEFAULT NULL COMMENT '音介视频',
    `introduction_markdown` TEXT         NULL COMMENT 'Markdown介绍',
    `create_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`           INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_entity_id` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一实体公开资料表';

-- ----------------------------
-- Table: api_request_cache
-- Model: app\model\ApiRequestCache
-- ----------------------------
CREATE TABLE `api_request_cache` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `hash`        VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '请求SHA-256哈希',
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
    `team_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT 'LostSky通知的收件Team ID',
    `sender_team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '通知的发送Team ID',
    `entity_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '通知的收件Entity ID（可为Team实体）',
    `title`       VARCHAR(200) NOT NULL DEFAULT '' COMMENT '通知标题',
    `content`     TEXT         NULL     COMMENT '通知正文(Markdown)',
    `is_pinned`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否置顶 0-否 1-是',
    `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '收件Team或Entity共享已读 0-未读 1-已读',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_notice_team_inbox` (`team_id`, `is_read`, `is_pinned`, `id`),
    KEY `idx_notice_sender_team` (`sender_team_id`, `id`),
    KEY `idx_notice_entity_inbox` (`entity_id`, `is_read`, `is_pinned`, `id`),
    CONSTRAINT `chk_notice_recipient` CHECK (
        (`team_id` IS NOT NULL AND `entity_id` IS NULL)
        OR (`team_id` IS NULL AND `entity_id` IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='LostSky到Team的站内通知及Team到Entity的通知';

-- ----------------------------
-- Table: team_customer
-- Model: app\model\TeamCustomer
-- ----------------------------
CREATE TABLE `team_customer` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `user_id`     INT UNSIGNED NULL     DEFAULT NULL COMMENT '直接绑定用户ID',
    `owner_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '来源实体ID',
    `assignee_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '当前归属实体ID',
    `is_blocked`  TINYINT      NOT NULL DEFAULT 0 COMMENT '是否被封禁 0-否 1-是',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    UNIQUE KEY `uk_team_owner_entity` (`team_id`, `owner_entity_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_owner_entity_id` (`owner_entity_id`),
    KEY `idx_assignee_entity_id` (`assignee_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队客户表';

-- ----------------------------
-- Table: team_transaction
-- Model: app\model\TeamTransaction
-- ----------------------------
CREATE TABLE `team_transaction` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `handler_entity_id` INT UNSIGNED NOT NULL COMMENT '接单实体ID',
    `sender_entity_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '发单实体ID(NULL=未知)',
    `cs_entity_id`      INT UNSIGNED NULL DEFAULT NULL COMMENT '客服实体ID(NULL=未知)',
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
    KEY `idx_handler_entity_id` (`handler_entity_id`),
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
    `trans_id`      INT UNSIGNED NULL     DEFAULT NULL COMMENT '关联流水ID',
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
    `entity_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '发单实体ID',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间(解绑)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_customer_entity` (`customer_id`, `entity_id`),
    KEY `idx_entity_id` (`entity_id`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户-发单实体绑定表';

-- ----------------------------
-- Table: team_product
-- Model: app\model\TeamProduct
-- ----------------------------
CREATE TABLE `team_product` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `entity_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '专属实体ID(NULL=团队公用)',
    `name`        VARCHAR(100) NOT NULL DEFAULT '' COMMENT '商品名称',
    `description` TEXT         NULL     COMMENT '商品描述',
    `cover_image` VARCHAR(500) NULL     DEFAULT NULL COMMENT '商品封面',
    `introduction_markdown` TEXT NULL   COMMENT '商品 Markdown 详情',
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
    KEY `idx_entity_id` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ----------------------------
-- Table: team_product_handler
-- Model: app\model\TeamProductHandler
-- ----------------------------
CREATE TABLE `team_product_handler` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `product_id`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品ID',
    `entity_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接单实体ID',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_product_entity` (`product_id`, `entity_id`),
    KEY `idx_entity_id` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品接单人白名单';

-- ----------------------------
-- Table: team_order
-- Model: app\model\TeamOrder
-- ----------------------------
CREATE TABLE `team_order` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `customer_id` INT UNSIGNED NULL     DEFAULT NULL COMMENT '客户ID(NULL=匿名客户)',
    `handler_entity_id` INT UNSIGNED NOT NULL COMMENT '接单实体ID',
    `sender_entity_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '发单实体ID(NULL=未知)',
    `cs_entity_id`      INT UNSIGNED NULL DEFAULT NULL COMMENT '客服实体ID(NULL=未知)',
    `product_id`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品ID',
    `product_name` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '下单时商品名称',
    `product_cover_image` VARCHAR(500) NULL DEFAULT NULL COMMENT '下单时商品封面',
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
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '订单状态 1-处理中 2-已完成 3-已取消',
    `memo`        TEXT         NULL     COMMENT '备注',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_customer_id` (`customer_id`),
    KEY `idx_handler_entity_id` (`handler_entity_id`),
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
    `entity_id`         INT UNSIGNED NOT NULL COMMENT '归属实体ID',
    `manager_scope`     TINYINT      NOT NULL DEFAULT 1 COMMENT '管理范围 1-team 2-subject_team',
    `visibility`        TINYINT      NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 3-subject_team 4-团队人员 5-public 6-custom',
    `sort`              INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`       INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_entity_id` (`entity_id`),
    KEY `idx_entity_visibility` (`entity_id`, `visibility`, `sort`),
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
    `entity_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '实体身份ID，引用entity.id(NULL=无实体上传)',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_hash` (`team_id`, `hash`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_entity_id` (`entity_id`)
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
    `visibility`  TINYINT      NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 4-团队人员 5-public 6-custom',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_app_key` (`team_id`, `app_name`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队设置表';

-- ----------------------------
-- Table: visibility_target
-- Model: app\model\VisibilityTarget
-- ----------------------------
CREATE TABLE `visibility_target` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `visibleable_type` VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '可见性主体类型 document|teamSetting|entityField',
    `visibleable_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '可见性主体ID',
    `entity_id`        INT UNSIGNED NOT NULL COMMENT '指定实体ID',
    `create_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`      INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_visible_entity` (`visibleable_type`, `visibleable_id`, `entity_id`),
    KEY `idx_entity_id` (`entity_id`),
    KEY `idx_visibleable` (`visibleable_type`, `visibleable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指定可见对象表';

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
    `is_transfer_entity_field` TINYINT      NOT NULL DEFAULT 0 COMMENT '进入后自动转存人员实体字段值 0-否 1-是',
    `entity_field_id`          INT UNSIGNED NULL     DEFAULT NULL COMMENT '转存目标Entity字段ID',
    `is_active`                TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用 0-否 1-是',
    `sort`                     INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`              INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_field` (`team_id`, `field_key`),
    KEY `idx_team_active_sort` (`team_id`, `is_active`, `sort`),
    KEY `idx_entity_field_id` (`entity_field_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队加入申请字段定义表';

-- ----------------------------
-- Table: team_join_application
-- Model: app\model\TeamJoinApplication
-- ----------------------------
CREATE TABLE `team_join_application` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `user_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '申请用户ID',
    `entity_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '同意后实体ID',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 1-已申请 2-审核中 3-已取消 4-已加入 5-已拒绝',
    `memo`        VARCHAR(500) NULL     DEFAULT NULL COMMENT '备注/拒绝原因',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_status` (`team_id`, `status`, `id`),
    KEY `idx_team_user` (`team_id`, `user_id`),
    KEY `idx_entity_id` (`entity_id`)
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
    `is_displayed` TINYINT     NOT NULL DEFAULT 0 COMMENT '是否在公开实体资料展示 0-否 1-是',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_role_key` (`team_id`, `role_key`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_display` (`team_id`, `is_displayed`, `sort`, `id`)
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
-- Table: team_entity_role
-- Model: app\model\TeamEntityRole
-- ----------------------------
CREATE TABLE `team_entity_role` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `entity_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '实体ID',
    `role_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '角色ID',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_entity_role` (`team_id`, `entity_id`, `role_id`),
    KEY `idx_team_entity` (`team_id`, `entity_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队实体角色表';

-- ----------------------------
-- Table: entity_session
-- Model: app\model\EntitySession
-- ----------------------------
CREATE TABLE `entity_session` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`     INT UNSIGNED NOT NULL DEFAULT 0,
    `device_token` VARCHAR(64) NOT NULL DEFAULT '',
    `jti`         CHAR(48) NOT NULL DEFAULT '',
    `parent_session_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `entity_id`   INT UNSIGNED NOT NULL DEFAULT 0,
    `expires_at`  INT UNSIGNED NOT NULL DEFAULT 0,
    `superseded_at` INT UNSIGNED NULL DEFAULT NULL,
    `revoked_at`  INT UNSIGNED NULL DEFAULT NULL,
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0,
    `delete_time` INT UNSIGNED NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_jti` (`jti`),
    KEY `idx_parent_session` (`parent_session_id`),
    KEY `idx_user_device_active` (`user_id`, `device_token`, `revoked_at`, `superseded_at`),
    KEY `idx_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='可撤销实体身份会话';

-- ----------------------------
-- Table: entity
-- Model: app\model\Entity
-- ----------------------------
CREATE TABLE `entity` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `slug`              VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '全站唯一且永久保留的对象标识',
    `entityable_type`   VARCHAR(30)  NOT NULL DEFAULT '' COMMENT '对象类型 team/teamMember/teamCustomer/teamVirtual',
    `entityable_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '对象ID',
    `is_displayed`      TINYINT      NOT NULL DEFAULT 0 COMMENT '公开Display可见：是否进入团队公开主页；不影响团队后台目录或全局搜索 0-否 1-是',
    `is_internal_visible` TINYINT    NOT NULL DEFAULT 0 COMMENT 'Team内部目录可见：无team.entity.read时仅非Customer实体可按此字段进入工作空间目录；Customer始终需要全量读取权限 0-否 1-是',
    `search_override`   TINYINT      NULL     DEFAULT NULL COMMENT '全局实体搜索覆盖：NULL-继承Team策略 0-禁止 1-允许；不影响内部目录或Display',
    `create_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`       INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间（身份永久保留）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slug` (`slug`),
    UNIQUE KEY `uk_entityable` (`entityable_type`, `entityable_id`),
    KEY `idx_display` (`is_displayed`, `entityable_type`, `id`),
    KEY `idx_internal_visible` (`is_internal_visible`, `entityable_type`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队对象统一身份表';

-- ----------------------------
-- Table: markdown_reference
-- Model: app\model\MarkdownReference
-- ----------------------------
CREATE TABLE `markdown_reference` (
    `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `referenceable_type` VARCHAR(30)  NOT NULL DEFAULT '' COMMENT 'Markdown来源类型',
    `referenceable_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Markdown来源ID',
    `referenceable_field` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'Markdown字段名',
    `entity_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '引用身份ID',
    `create_time`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`        INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_source_entity` (`referenceable_type`, `referenceable_id`, `referenceable_field`, `entity_id`),
    KEY `idx_entity_id` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Markdown多态对象引用表';

-- ----------------------------
-- Table: team_virtual
-- Model: app\model\TeamVirtual
-- ----------------------------
CREATE TABLE `team_virtual` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `name`        VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '显示名称',
    `avatar`      VARCHAR(500) NULL     DEFAULT NULL COMMENT '头像',
    `description` VARCHAR(500) NULL     DEFAULT NULL COMMENT '简介',
    `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用 0-否 1-是',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_active` (`team_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队通用虚拟实体表';

-- ----------------------------
-- Table: team_virtual_integration
-- Model: app\model\TeamVirtualIntegration
-- ----------------------------
CREATE TABLE `team_virtual_integration` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `virtual_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '虚拟实体ID',
    `name`           VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '集成名称',
    `driver`         VARCHAR(20)  NOT NULL DEFAULT 'webhook' COMMENT '集成驱动',
    `endpoint_url`   VARCHAR(1000) NULL    DEFAULT NULL COMMENT 'Webhook地址',
    `events`         JSON         NULL COMMENT '订阅事件',
    `token_hash`     CHAR(64)     NOT NULL DEFAULT '' COMMENT '入站令牌SHA-256',
    `signing_secret` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '出站签名密钥',
    `is_active`      TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `last_error_at`  INT UNSIGNED NULL     DEFAULT NULL COMMENT '最近错误时间',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_virtual_active` (`virtual_id`, `is_active`),
    KEY `idx_team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='虚拟实体外部集成表';

-- ----------------------------
-- Table: team_entity_field
-- Model: app\model\TeamEntityField
-- ----------------------------
CREATE TABLE `team_entity_field` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `entity_type`   VARCHAR(20)  NOT NULL DEFAULT 'entity' COMMENT '对象类型 entity/customer/virtual',
    `field_key`     VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '字段标识',
    `name`          VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '字段名称',
    `source`        VARCHAR(20)  NOT NULL DEFAULT 'custom' COMMENT '字段来源 system/custom',
    `value_type`    VARCHAR(20)  NOT NULL DEFAULT 'string' COMMENT '值类型',
    `input_type`    VARCHAR(20)  NOT NULL DEFAULT 'text' COMMENT '输入控件',
    `options`       JSON         NULL COMMENT '字段选项',
    `default_value` VARCHAR(500) NULL DEFAULT NULL COMMENT '默认值',
    `manager_scope` TINYINT      NOT NULL DEFAULT 1 COMMENT '管理范围 1-team 2-subject_team',
    `visibility`    TINYINT      NOT NULL DEFAULT 1 COMMENT '可见范围 1-team 3-subject_team 4-entity 5-public 6-custom',
    `is_required`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否必填',
    `is_editable`   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否可编辑',
    `is_searchable` TINYINT      NOT NULL DEFAULT 0 COMMENT '是否可搜索（预留，当前未接入字段值搜索）',
    `is_system`     TINYINT      NOT NULL DEFAULT 0 COMMENT '是否系统字段',
    `sort`          INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_type_field` (`team_id`, `entity_type`, `field_key`),
    KEY `idx_team_type_sort` (`team_id`, `entity_type`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队对象统一字段定义表';

-- ----------------------------
-- Table: team_entity_field_value
-- Model: app\model\TeamEntityFieldValue
-- ----------------------------
CREATE TABLE `team_entity_field_value` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `field_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '字段ID',
    `entity_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '对象ID',
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
    UNIQUE KEY `uk_field_entity` (`field_id`, `entity_id`),
    KEY `idx_team_entity` (`team_id`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队对象统一字段值表';

-- ----------------------------
-- Table: chat_conversation
-- Model: app\model\ChatConversation
-- ----------------------------
CREATE TABLE `chat_conversation` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `uuid`            CHAR(36)     NOT NULL DEFAULT '' COMMENT '公开会话标识',
    `kind`            VARCHAR(20)  NOT NULL DEFAULT 'direct' COMMENT 'direct/group',
    `title`           VARCHAR(100) NULL     DEFAULT NULL COMMENT '群聊标题',
    `direct_key`      CHAR(64)     NULL     DEFAULT NULL COMMENT '永久单聊参与者摘要',
    `is_temporary`    TINYINT      NOT NULL DEFAULT 0 COMMENT '是否临时会话',
    `entity_id`       INT UNSIGNED NOT NULL COMMENT '创建实体ID',
    `last_message_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '最后消息ID',
    `last_message_at` INT UNSIGNED NULL     DEFAULT NULL COMMENT '最后消息时间',
    `expires_at`      INT UNSIGNED NULL     DEFAULT NULL COMMENT '到期时间',
    `closed_at`       INT UNSIGNED NULL     DEFAULT NULL COMMENT '关闭时间',
    `create_time`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`     INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_uuid` (`uuid`),
    UNIQUE KEY `uk_direct_key` (`direct_key`),
    KEY `idx_team_last` (`team_id`, `last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- ----------------------------
-- Table: chat_participant
-- Model: app\model\ChatParticipant
-- ----------------------------
CREATE TABLE `chat_participant` (
    `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `conversation_id`      BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '会话ID',
    `entity_id`            INT UNSIGNED NOT NULL COMMENT '参与实体ID',
    `joined_at`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '加入时间',
    `left_at`              INT UNSIGNED NULL     DEFAULT NULL COMMENT '退出时间',
    `last_read_message_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '已读消息ID',
    `create_time`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`          INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_conversation_entity` (`conversation_id`, `entity_id`),
    KEY `idx_team_entity` (`team_id`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天参与者表';

-- ----------------------------
-- Table: chat_message
-- Model: app\model\ChatMessage
-- ----------------------------
CREATE TABLE `chat_message` (
    `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`               INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `conversation_id`       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '会话ID',
    `entity_id`             INT UNSIGNED NOT NULL COMMENT '发送实体ID',
    `reply_id`              BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '回复消息ID',
    `origin_integration_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '来源集成ID',
    `content`               TEXT         NULL COMMENT '文本内容',
    `edited_at`             INT UNSIGNED NULL DEFAULT NULL COMMENT '编辑时间',
    `revoked_at`            INT UNSIGNED NULL DEFAULT NULL COMMENT '撤回时间',
    `create_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`           INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_conversation_id` (`conversation_id`, `id`),
    KEY `idx_team_entity` (`team_id`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- ----------------------------
-- Table: chat_event_outbox
-- Model: app\model\ChatEventOutbox
-- ----------------------------
CREATE TABLE `chat_event_outbox` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `event_type`     VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '事件类型',
    `aggregate_type` VARCHAR(30)  NOT NULL DEFAULT '' COMMENT '聚合类型',
    `aggregate_id`   BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '聚合ID',
    `payload`        JSON         NOT NULL COMMENT '事件负载',
    `attempts`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '发布尝试次数',
    `available_at`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '下次可处理时间',
    `processing_token` CHAR(32)    NULL     DEFAULT NULL COMMENT 'Worker领取令牌',
    `processing_until` INT UNSIGNED NULL    DEFAULT NULL COMMENT 'Worker租约到期时间',
    `published_at`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '实时发布完成时间',
    `last_error`     VARCHAR(1000) NULL    DEFAULT NULL COMMENT '最后错误',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_pending` (`published_at`, `available_at`, `processing_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天事务事件箱表';

-- ----------------------------
-- Table: chat_webhook_delivery
-- Model: app\model\ChatWebhookDelivery
-- ----------------------------
CREATE TABLE `chat_webhook_delivery` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `outbox_id`      BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '事件箱ID',
    `integration_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '集成ID',
    `status`         VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending/delivered/failed',
    `attempts`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '尝试次数',
    `available_at`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '下次可处理时间',
    `processing_token` CHAR(32)    NULL     DEFAULT NULL COMMENT 'Worker领取令牌',
    `processing_until` INT UNSIGNED NULL    DEFAULT NULL COMMENT 'Worker租约到期时间',
    `delivered_at`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '送达时间',
    `response_code`  SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT '响应状态码',
    `last_error`     VARCHAR(1000) NULL    DEFAULT NULL COMMENT '最后错误',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_outbox_integration` (`outbox_id`, `integration_id`),
    KEY `idx_pending` (`status`, `available_at`, `processing_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天Webhook投递表';

-- ----------------------------
-- Table: platform_admin_role
-- Model: app\model\PlatformAdminRole
-- ----------------------------
CREATE TABLE `platform_admin_role` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `role_key`    VARCHAR(50)  NOT NULL COMMENT '角色标识',
    `name`        VARCHAR(50)  NOT NULL COMMENT '角色名称',
    `description` VARCHAR(255) NULL DEFAULT NULL COMMENT '角色说明',
    `is_system`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否系统角色',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_platform_admin_role_key` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台管理员角色';

-- ----------------------------
-- Table: platform_admin_role_permission
-- Model: app\model\PlatformAdminRolePermission
-- ----------------------------
CREATE TABLE `platform_admin_role_permission` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `role_id`        INT UNSIGNED NOT NULL COMMENT '平台角色ID',
    `permission_key` VARCHAR(100) NOT NULL COMMENT '权限标识',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_platform_role_permission` (`role_id`, `permission_key`),
    KEY `idx_platform_permission_key` (`permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台角色权限';

-- ----------------------------
-- Table: platform_admin_user_role
-- Model: app\model\PlatformAdminUserRole
-- ----------------------------
CREATE TABLE `platform_admin_user_role` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`             INT UNSIGNED NOT NULL COMMENT '用户ID',
    `role_id`             INT UNSIGNED NOT NULL COMMENT '平台角色ID',
    `assigned_by_user_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '授予人用户ID，CLI为NULL',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_platform_admin_user_role` (`user_id`, `role_id`),
    KEY `idx_platform_admin_role_user` (`role_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台管理员角色绑定';

INSERT INTO `platform_admin_role`
    (`role_key`, `name`, `description`, `is_system`, `create_time`, `update_time`)
VALUES
    ('super_admin', '超级管理员', '拥有全部平台管理权限', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ----------------------------
-- Table: business_audit_event
-- Model: app\model\BusinessAuditEvent
-- ----------------------------
CREATE TABLE `business_audit_event` (
    `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`               INT UNSIGNED NULL DEFAULT NULL COMMENT '团队ID',
    `entity_id`             INT UNSIGNED NULL DEFAULT NULL COMMENT '执行操作的实体ID，平台或CLI操作为NULL',
    `authenticated_user_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '完成认证的用户ID，CLI操作为NULL',
    `application`           VARCHAR(30) NOT NULL COMMENT '业务应用',
    `action`                VARCHAR(50) NOT NULL COMMENT '业务动作',
    `resource_type`         VARCHAR(50) NOT NULL COMMENT '资源类型',
    `resource_id`           BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '资源ID',
    `request_id`            VARCHAR(100) NULL DEFAULT NULL COMMENT '请求ID',
    `context`               JSON NULL COMMENT '非敏感补充上下文',
    `create_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`           INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_audit_team_time` (`team_id`, `create_time`),
    KEY `idx_audit_entity_time` (`entity_id`, `create_time`),
    KEY `idx_audit_user_time` (`authenticated_user_id`, `create_time`),
    KEY `idx_audit_resource` (`resource_type`, `resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='集中业务审计事件';

-- ----------------------------
-- Foreign keys
-- ----------------------------
ALTER TABLE `user_profile` ADD CONSTRAINT `fk_user_profile_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `user_setting` ADD CONSTRAINT `fk_user_setting_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `user_device` ADD CONSTRAINT `fk_user_device_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `user_refresh_token` ADD CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_refresh_device` FOREIGN KEY (`device_id`) REFERENCES `user_device` (`id`);
ALTER TABLE `platform_admin_role_permission` ADD CONSTRAINT `fk_platform_permission_role` FOREIGN KEY (`role_id`) REFERENCES `platform_admin_role` (`id`);
ALTER TABLE `platform_admin_user_role` ADD CONSTRAINT `fk_platform_admin_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_platform_admin_role` FOREIGN KEY (`role_id`) REFERENCES `platform_admin_role` (`id`), ADD CONSTRAINT `fk_platform_admin_assigner` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `user` (`id`);
ALTER TABLE `team` ADD CONSTRAINT `fk_team_owner_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `team_domain` ADD CONSTRAINT `fk_team_domain_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_member` ADD CONSTRAINT `fk_team_member_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `team_entity_profile` ADD CONSTRAINT `fk_entity_profile_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_ability` ADD CONSTRAINT `fk_team_ability_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_notice` ADD CONSTRAINT `fk_team_notice_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_notice_sender_team` FOREIGN KEY (`sender_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_notice_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_customer` ADD CONSTRAINT `fk_team_customer_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_customer_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_team_customer_owner_entity` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_team_customer_assignee_entity` FOREIGN KEY (`assignee_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_transaction` ADD CONSTRAINT `fk_transaction_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_transaction_handler_entity` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_transaction_sender_entity` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_transaction_cs_entity` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_transaction_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`);
ALTER TABLE `team_customer_balance` ADD CONSTRAINT `fk_balance_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`);
ALTER TABLE `team_customer_balance_log` ADD CONSTRAINT `fk_balance_log_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_balance_log_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `team_customer_sender` ADD CONSTRAINT `fk_customer_sender_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_customer_sender_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_customer_sender_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_product` ADD CONSTRAINT `fk_product_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_product_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_product_handler` ADD CONSTRAINT `fk_product_handler_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_product_handler_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_order` ADD CONSTRAINT `fk_order_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_order_handler_entity` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_order_sender_entity` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_order_cs_entity` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_order_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `document` ADD CONSTRAINT `fk_document_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `file` ADD CONSTRAINT `fk_file_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_file_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_setting` ADD CONSTRAINT `fk_team_setting_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `visibility_target` ADD CONSTRAINT `fk_visibility_target_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_join_field` ADD CONSTRAINT `fk_join_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_join_field_entity_field` FOREIGN KEY (`entity_field_id`) REFERENCES `team_entity_field` (`id`);
ALTER TABLE `team_join_application` ADD CONSTRAINT `fk_join_application_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_join_application_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_join_application_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_join_field_value` ADD CONSTRAINT `fk_join_value_application` FOREIGN KEY (`application_id`) REFERENCES `team_join_application` (`id`), ADD CONSTRAINT `fk_join_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_join_field` (`id`);
ALTER TABLE `team_join_task` ADD CONSTRAINT `fk_join_task_application` FOREIGN KEY (`application_id`) REFERENCES `team_join_application` (`id`);
ALTER TABLE `team_role` ADD CONSTRAINT `fk_team_role_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_role_permission` ADD CONSTRAINT `fk_role_permission_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `team_role` (`id`);
ALTER TABLE `team_entity_role` ADD CONSTRAINT `fk_entity_role_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_entity_role_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_entity_role_role` FOREIGN KEY (`role_id`) REFERENCES `team_role` (`id`);
ALTER TABLE `entity_session` ADD CONSTRAINT `fk_entity_session_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_entity_session_parent` FOREIGN KEY (`parent_session_id`) REFERENCES `entity_session` (`id`), ADD CONSTRAINT `fk_entity_session_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `markdown_reference` ADD CONSTRAINT `fk_markdown_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_virtual` ADD CONSTRAINT `fk_team_virtual_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_virtual_integration` ADD CONSTRAINT `fk_virtual_integration_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_virtual_integration_virtual` FOREIGN KEY (`virtual_id`) REFERENCES `team_virtual` (`id`);
ALTER TABLE `team_entity_field` ADD CONSTRAINT `fk_entity_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_entity_field_value` ADD CONSTRAINT `fk_entity_field_value_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_entity_field_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_entity_field` (`id`), ADD CONSTRAINT `fk_entity_field_value_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_conversation` ADD CONSTRAINT `fk_chat_conversation_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_chat_conversation_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_participant` ADD CONSTRAINT `fk_chat_participant_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_chat_participant_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`), ADD CONSTRAINT `fk_chat_participant_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_chat_participant_last_read` FOREIGN KEY (`last_read_message_id`) REFERENCES `chat_message` (`id`);
ALTER TABLE `chat_message` ADD CONSTRAINT `fk_chat_message_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`), ADD CONSTRAINT `fk_chat_message_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_chat_message_reply` FOREIGN KEY (`reply_id`) REFERENCES `chat_message` (`id`), ADD CONSTRAINT `fk_chat_message_integration` FOREIGN KEY (`origin_integration_id`) REFERENCES `team_virtual_integration` (`id`);
ALTER TABLE `chat_event_outbox` ADD CONSTRAINT `fk_chat_outbox_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `chat_webhook_delivery` ADD CONSTRAINT `fk_webhook_delivery_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_webhook_delivery_outbox` FOREIGN KEY (`outbox_id`) REFERENCES `chat_event_outbox` (`id`), ADD CONSTRAINT `fk_webhook_delivery_integration` FOREIGN KEY (`integration_id`) REFERENCES `team_virtual_integration` (`id`);
ALTER TABLE `business_audit_event` ADD CONSTRAINT `fk_business_audit_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_business_audit_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_business_audit_user` FOREIGN KEY (`authenticated_user_id`) REFERENCES `user` (`id`);
