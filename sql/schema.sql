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
    `member_join_code_hash` CHAR(64) NULL DEFAULT NULL COMMENT '个人一次性入队码 SHA-256',
    `member_join_code_expires_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '个人入队码过期时间',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_phone` (`phone`),
    UNIQUE KEY `uk_email` (`email`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_member_join_code_hash` (`member_join_code_hash`)
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
    `inviter_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '邀请人实体ID，可来自其他团队',
    `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '成员状态 1-正常 2-封禁 3-已离队',
    `create_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`  INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_inviter_entity_id` (`inviter_entity_id`),
    CONSTRAINT `chk_team_member_status` CHECK (`status` IN (1, 2, 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

-- ----------------------------
-- Table: team_entity_profile
-- Model: app\model\TeamEntityProfile
-- ----------------------------
CREATE TABLE `team_entity_profile` (
    `document_tags`         JSON         NULL COMMENT '文档展示标签',
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
-- Table: team_ability_grant
-- Model: app\model\TeamAbilityGrant
-- ----------------------------
CREATE TABLE `team_ability_grant` (
    `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`         INT UNSIGNED NOT NULL COMMENT '受益团队ID',
    `ability_key`     VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '能力标识',
    `level`           INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '能力等级',
    `starts_at`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '生效时间',
    `ends_at`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '结束时间 0=永久',
    `source_type`     VARCHAR(30)  NOT NULL DEFAULT 'manual' COMMENT '来源 manual|redemption|legacy',
    `source_claim_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '兑换领取ID',
    `revoked_at`      INT UNSIGNED NULL DEFAULT NULL COMMENT '撤销时间',
    `revoke_reason`   VARCHAR(500) NULL DEFAULT NULL COMMENT '撤销原因',
    `create_time`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`     INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ability_grant_claim` (`source_claim_id`, `ability_key`),
    KEY `idx_ability_grant_active` (`team_id`, `ability_key`, `starts_at`, `ends_at`, `revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队能力授予账本';

-- ----------------------------
-- Table: benefit_package
-- Model: app\model\BenefitPackage
-- ----------------------------
CREATE TABLE `benefit_package` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `issuer_team_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '发行团队ID NULL=平台',
    `owner_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '归属Entity ID NULL=团队公用或平台',
    `name`           VARCHAR(100) NOT NULL DEFAULT '' COMMENT '权益套餐名称',
    `pricing_mode`   TINYINT      NOT NULL DEFAULT 1 COMMENT '计价方式 1-历史均摊 2-分项计价',
    `is_active`      TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `create_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`    INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_benefit_package_issuer` (`issuer_team_id`, `is_active`),
    KEY `idx_benefit_package_owner` (`issuer_team_id`, `owner_entity_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='可复用权益套餐';

-- ----------------------------
-- Table: benefit_package_ability
-- Model: app\model\BenefitPackageAbility
-- ----------------------------
CREATE TABLE `benefit_package_ability` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `package_id`    INT UNSIGNED NOT NULL COMMENT '权益套餐ID',
    `ability_key`   VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '能力标识',
    `level`         INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '能力等级',
    `duration_days` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '持续天数 0=永久',
    `create_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`   INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_package_ability` (`package_id`, `ability_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权益套餐Ability项';

-- ----------------------------
-- Table: team_service
-- Model: app\model\TeamService
-- ----------------------------
CREATE TABLE `team_service` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`             INT UNSIGNED NOT NULL COMMENT '服务提供团队ID',
    `owner_entity_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '归属Entity ID NULL=团队公用',
    `name`                VARCHAR(100) NOT NULL DEFAULT '' COMMENT '服务名称',
    `description`         TEXT         NULL COMMENT '服务说明',
    `unit_name`           VARCHAR(20)  NOT NULL DEFAULT '次' COMMENT '计量单位名称',
    `quantity_step`       DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '最小核销单位',
    `auto_complete_after_minutes` INT UNSIGNED NULL DEFAULT NULL COMMENT '请求结单后顾客确认分钟数 NULL=关闭',
    `unused_auto_complete_after_minutes` INT UNSIGNED NULL DEFAULT NULL COMMENT '未使用权益结单分钟数 NULL=关闭',
    `default_total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '卡密领取时单次默认价值',
    `default_cost`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单次默认成本',
    `default_handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单次默认接单分成',
    `default_sender_cut`  DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单次默认发单分成',
    `default_cs_cut`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单次默认客服分成',
    `default_team_cut`    DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单次默认团队分成',
    `is_active`           TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_service` (`team_id`, `is_active`),
    KEY `idx_team_service_owner` (`team_id`, `owner_entity_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队可核销服务定义';

-- ----------------------------
-- Table: team_service_handler
-- Model: app\model\TeamServiceHandler
-- ----------------------------
CREATE TABLE `team_service_handler` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `service_id`  INT UNSIGNED NOT NULL COMMENT '服务ID',
    `entity_id`   INT UNSIGNED NOT NULL COMMENT '可接单Entity ID',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_service_handler` (`service_id`, `entity_id`),
    KEY `idx_service_handler_entity` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务接单Entity池';

-- ----------------------------
-- Table: benefit_package_service
-- Model: app\model\BenefitPackageService
-- ----------------------------
CREATE TABLE `benefit_package_service` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `package_id`  INT UNSIGNED NOT NULL COMMENT '权益套餐ID',
    `service_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '历史服务ID，与商品ID二选一',
    `product_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '组成商品ID，与历史服务ID二选一',
    `quantity`    DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '授予服务额度',
    `valid_days`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '领取后有效天数 0=永久',
    `unit_price`  DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例价格',
    `unit_cost`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例成本',
    `unit_handler_cut` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例接单固定分成',
    `unit_sender_cut`  DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例发单固定分成',
    `unit_cs_cut`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单实例客服固定分成',
    `sort`             INT NOT NULL DEFAULT 0 COMMENT '套餐内顺序',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_package_service` (`package_id`, `service_id`),
    KEY `idx_package_item_product` (`product_id`),
    CONSTRAINT `chk_package_item_target` CHECK ((`service_id` IS NULL) <> (`product_id` IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权益套餐服务项';

-- ----------------------------
-- Table: redemption_campaign
-- Model: app\model\RedemptionCampaign
-- ----------------------------
CREATE TABLE `redemption_campaign` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `package_id`       INT UNSIGNED NOT NULL COMMENT '权益套餐ID',
    `issuer_team_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '发行团队ID NULL=平台',
    `owner_entity_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '归属Entity ID NULL=团队公用或平台',
    `name`             VARCHAR(100) NOT NULL DEFAULT '' COMMENT '活动名称',
    `claim_group`      VARCHAR(100) NOT NULL DEFAULT '' COMMENT '领取互斥组',
    `mode`             TINYINT      NOT NULL DEFAULT 1 COMMENT '1-独立卡 2-公共活动码 3-定向卡',
    `total_limit`      INT UNSIGNED NULL DEFAULT NULL COMMENT '活动领取总上限 NULL=不限',
    `redeem_starts_at` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '领取开始时间 0=不限',
    `redeem_ends_at`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '领取结束时间 0=不限',
    `is_active`        TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `create_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`      INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_redemption_campaign` (`issuer_team_id`, `is_active`),
    KEY `idx_redemption_campaign_owner` (`issuer_team_id`, `owner_entity_id`, `is_active`),
    KEY `idx_redemption_claim_group` (`claim_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡密领取活动';

-- ----------------------------
-- Table: redemption_code
-- Model: app\model\RedemptionCode
-- ----------------------------
CREATE TABLE `redemption_code` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `campaign_id`      INT UNSIGNED NOT NULL COMMENT '活动ID',
    `source_order_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '来源订单ID',
    `source_claim_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '来源兑换记录ID',
    `fulfillment_snapshot` JSON NULL COMMENT '发行时目标快照，仅内部使用',
    `ordinal`          INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '订单内序号',
    `holder_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '持有Entity ID',
    `target_team_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '定向Team ID',
    `target_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '定向Entity ID',
    `code_hint`        VARCHAR(20)  NOT NULL DEFAULT '' COMMENT '脱敏展示片段',
    `code_hash`        CHAR(64)     NOT NULL COMMENT '卡密HMAC-SHA256',
    `code_ciphertext`  TEXT         NOT NULL COMMENT '加密卡密',
    `max_uses`         INT UNSIGNED NULL DEFAULT 1 COMMENT '最大使用次数 NULL=不限',
    `use_count`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已使用次数',
    `expire_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '卡密到期时间 0=永久',
    `is_active`        TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `create_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`      INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_redemption_code_hash` (`code_hash`),
    UNIQUE KEY `uk_redemption_order_ordinal` (`source_order_id`, `ordinal`),
    UNIQUE KEY `uk_redemption_claim_ordinal` (`source_claim_id`, `ordinal`),
    KEY `idx_redemption_holder` (`holder_entity_id`, `is_active`),
    KEY `idx_redemption_campaign_code` (`campaign_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡密';

-- ----------------------------
-- Table: redemption_claim
-- Model: app\model\RedemptionClaim
-- ----------------------------
CREATE TABLE `redemption_claim` (
    `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `campaign_id`          INT UNSIGNED NOT NULL COMMENT '活动ID',
    `code_id`              INT UNSIGNED NOT NULL COMMENT '卡密ID',
    `claim_key`            VARCHAR(191) NOT NULL DEFAULT '' COMMENT '领取互斥键',
    `target_team_id`       INT UNSIGNED NULL DEFAULT NULL COMMENT '受益Team ID',
    `target_entity_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '受益Entity ID',
    `claimed_by_entity_id` INT UNSIGNED NOT NULL COMMENT '操作Entity ID',
    `claimed_at`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '领取时间',
    `create_time`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`          INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_redemption_claim_key` (`claim_key`),
    KEY `idx_redemption_claim_code` (`code_id`),
    KEY `idx_redemption_claim_target_team` (`target_team_id`),
    KEY `idx_redemption_claim_target_entity` (`target_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡密领取记录';

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
    `dedup_key`   VARCHAR(191) NULL DEFAULT NULL COMMENT '内部幂等键，不对 API 输出',
    `is_pinned`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否置顶 0-否 1-是',
    `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '收件Team或Entity共享已读 0-未读 1-已读',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_notice_dedup_key` (`dedup_key`),
    KEY `idx_notice_team_inbox` (`team_id`, `is_read`, `is_pinned`, `id`),
    KEY `idx_notice_sender_team` (`sender_team_id`, `id`),
    KEY `idx_notice_entity_inbox` (`entity_id`, `is_read`, `is_pinned`, `id`),
    CONSTRAINT `chk_notice_recipient` CHECK (
        (`team_id` IS NOT NULL AND `entity_id` IS NULL)
        OR (`team_id` IS NULL AND `entity_id` IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='LostSky到Team的站内通知及Team到Entity的通知';

-- ----------------------------
-- Table: jobs
-- think-queue Database driver
-- ----------------------------
CREATE TABLE `jobs` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `queue`          VARCHAR(255) NOT NULL,
    `payload`        LONGTEXT NOT NULL,
    `attempts`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `reserve_time`   INT UNSIGNED NULL DEFAULT NULL,
    `available_time` INT UNSIGNED NOT NULL,
    `create_time`    INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_jobs_queue` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='think-queue数据库任务';

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
    `handler_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '接单实体ID，服务包收款可为空',
    `sender_entity_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '发单实体ID(NULL=未知)',
    `cs_entity_id`      INT UNSIGNED NULL DEFAULT NULL COMMENT '客服实体ID(NULL=未知)',
    `customer_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '客户ID(NULL=匿名)',
    `type`          TINYINT      NOT NULL DEFAULT 1 COMMENT '交易类型: 1-商城下单 2-记账登记 3-服务包收款 4-服务核销 5-履约加价收款 6-履约加价业绩 7-未使用权益结单',
    `total_price`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总价',
    `cost`          DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '成本损耗',
    `cash`          DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '现款支付',
    `prepaid`       DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '预存款支付',
    `service_credit` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '服务权益核销金额',
    `handler_cut`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '接单人抽成',
    `sender_cut`    DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '发单人抽成',
    `cs_cut`        DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '客服抽成',
    `team_cut`      DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '团队抽成',
    `service_instance_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '关联服务实例ID',
    `service_adjustment_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '关联履约费用调整ID',
    `trans_at`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '实际交易时间戳',
    `memo`          TEXT         NULL     COMMENT '备注',
    `create_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_handler_entity_id` (`handler_entity_id`),
    KEY `idx_customer_id` (`customer_id`),
    UNIQUE KEY `uk_transaction_service_instance` (`service_instance_id`),
    KEY `idx_transaction_service_adjustment` (`service_adjustment_id`, `type`),
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
    `parent_product_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '所属多规格主商品，非空为隐藏规格',
    `variant_sort` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '规格排序',
    `purchase_fields` JSON NULL COMMENT '购买资料字段定义',
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
    `kind`        TINYINT      NOT NULL DEFAULT 1 COMMENT '商品类型 1-普通 2-套餐 3-卡密 4-核销商品 5-多规格商品',
    `benefit_package_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '服务套餐权益ID',
    `redemption_campaign_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '卡密活动ID',
    `is_active`   TINYINT      NOT NULL DEFAULT 1 COMMENT '是否上架 0-下架 1-上架',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_id` (`team_id`),
    KEY `idx_entity_id` (`entity_id`),
    KEY `idx_product_parent_sort` (`parent_product_id`, `variant_sort`),
    CONSTRAINT `fk_product_parent` FOREIGN KEY (`parent_product_id`) REFERENCES `team_product` (`id`),
    CONSTRAINT `chk_product_variant_parent` CHECK (`parent_product_id` IS NULL OR `kind` <> 5)
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
-- Table: team_service_redemption_field
-- Model: app\model\TeamServiceRedemptionField
-- ----------------------------
CREATE TABLE `team_service_redemption_field` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`             INT UNSIGNED NOT NULL COMMENT '团队ID',
    `service_id`          INT UNSIGNED NOT NULL COMMENT '服务ID',
    `name`                VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '字段名称',
    `value_type`          VARCHAR(20)  NOT NULL DEFAULT 'string' COMMENT '值类型',
    `input_type`          VARCHAR(20)  NOT NULL DEFAULT 'text' COMMENT '输入控件',
    `options`             JSON         NULL COMMENT '字段选项',
    `default_value`       VARCHAR(500) NULL DEFAULT NULL COMMENT '默认值',
    `fill_stage`          VARCHAR(20)  NOT NULL DEFAULT 'customer' COMMENT '填写阶段 customer|manager',
    `is_customer_visible` TINYINT      NOT NULL DEFAULT 1 COMMENT 'Customer是否可见',
    `is_required`         TINYINT      NOT NULL DEFAULT 0 COMMENT '该阶段是否必填',
    `is_active`           TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `sort`                INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_service_redemption_sort` (`service_id`, `is_active`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务核销自定义字段';

-- ----------------------------
-- Table: team_order
-- Model: app\model\TeamOrder
-- ----------------------------
CREATE TABLE `team_order` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `source_claim_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '来源卡密兑换',
    `claim_ordinal` INT UNSIGNED NULL DEFAULT NULL COMMENT '兑换交付序号',
    UNIQUE KEY `uk_order_claim_ordinal` (`source_claim_id`, `claim_ordinal`),
    `team_id`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `customer_id` INT UNSIGNED NULL     DEFAULT NULL COMMENT '客户ID(NULL=匿名客户)',
    `handler_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '接单实体ID，服务套餐/卡密可为空',
    `sender_entity_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '发单实体ID(NULL=未知)',
    `cs_entity_id`      INT UNSIGNED NULL DEFAULT NULL COMMENT '客服实体ID(NULL=未知)',
    `product_id`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品ID',
    `product_name` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '下单时商品名称',
    `purchase_fields` JSON NULL COMMENT '下单时购买资料定义和值的快照',
    `product_cover_image` VARCHAR(500) NULL DEFAULT NULL COMMENT '下单时商品封面',
    `fulfillment_snapshot` JSON NULL COMMENT '下单时履约配置快照，仅内部使用',
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
-- Table: team_service_entitlement
-- Model: app\model\TeamServiceEntitlement
-- ----------------------------
CREATE TABLE `team_service_entitlement` (
    `id`                     INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`                INT UNSIGNED NOT NULL COMMENT '服务提供团队ID',
    `service_id`             INT UNSIGNED NOT NULL COMMENT '服务定义ID',
    `customer_id`            INT UNSIGNED NOT NULL COMMENT '持有Customer ID',
    `holder_entity_id`       INT UNSIGNED NOT NULL COMMENT '持有Customer根Entity ID',
    `sender_entity_id`       INT UNSIGNED NULL DEFAULT NULL COMMENT '冻结发单Entity ID',
    `cs_entity_id`           INT UNSIGNED NULL DEFAULT NULL COMMENT '冻结客服Entity ID',
    `source_product_id`      INT UNSIGNED NULL DEFAULT NULL COMMENT '来源商品ID',
    `source_order_id`        INT UNSIGNED NULL DEFAULT NULL COMMENT '来源订单ID',
    `source_claim_id`        INT UNSIGNED NULL DEFAULT NULL COMMENT '来源卡密领取ID',
    `source_package_item_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '来源权益服务项ID',
    `ordinal`                INT UNSIGNED NOT NULL COMMENT '来源内序号',
    `unit_name`              VARCHAR(20) NOT NULL DEFAULT '次' COMMENT '冻结计量单位',
    `quantity_step`          DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '冻结最小核销单位',
    `granted_quantity`       DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '授予额度',
    `reserved_quantity`      DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '待确认邀请与核销中实例预占额度',
    `consumed_quantity`      DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '已核销额度',
    `total_price`            DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '权益总价值',
    `cost`                   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '权益总成本',
    `handler_cut`            DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '权益总接单分成',
    `sender_cut`             DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '权益总发单分成',
    `cs_cut`                 DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '权益总客服分成',
    `team_cut`               DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '权益总团队分成',
    `expire_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '到期时间 0=永久',
    `create_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`            INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    `unused_auto_complete_after_minutes` INT UNSIGNED NULL DEFAULT NULL COMMENT '未使用权益结单时长快照',
    `unused_auto_complete_due_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '未使用权益结单期限',
    PRIMARY KEY (`id`),
    KEY `idx_unused_auto_complete` (`unused_auto_complete_due_at`, `id`),
    UNIQUE KEY `uk_entitlement_order_ordinal` (`source_order_id`, `ordinal`),
    UNIQUE KEY `uk_entitlement_claim_ordinal` (`source_claim_id`, `ordinal`),
    KEY `idx_entitlement_customer` (`customer_id`, `id`),
    KEY `idx_entitlement_holder` (`holder_entity_id`, `id`),
    KEY `idx_entitlement_team_service` (`team_id`, `service_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entity持有的可计量服务权益';

-- ----------------------------
-- Table: team_service_assignment_offer
-- Model: app\model\TeamServiceAssignmentOffer
-- ----------------------------
CREATE TABLE `team_service_assignment_offer` (
    `id`                       INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`                  INT UNSIGNED NOT NULL COMMENT '服务提供团队ID',
    `service_id`               INT UNSIGNED NOT NULL COMMENT '服务定义ID',
    `customer_id`              INT UNSIGNED NOT NULL COMMENT '发起邀请的Customer ID',
    `holder_entity_id`         INT UNSIGNED NOT NULL COMMENT '持有Customer根Entity ID',
    `entitlement_id`           INT UNSIGNED NOT NULL COMMENT '服务权益ID',
    `target_handler_entity_id` INT UNSIGNED NOT NULL COMMENT '被邀请接单Entity ID',
    `quantity`                 DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '邀请履约数量',
    `status`                   TINYINT NOT NULL DEFAULT 1 COMMENT '1-待确认 2-已接受 3-已拒绝 4-已取消 5-已失效',
    `memo`                     TEXT NULL COMMENT 'Customer备注',
    `field_values`             JSON NULL COMMENT 'Customer核销字段原始快照',
    `total_price`              DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '冻结履约价值',
    `cost`                     DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '冻结成本',
    `handler_cut`              DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '冻结接单分成',
    `sender_cut`               DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '冻结发单分成',
    `cs_cut`                   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '冻结客服分成',
    `team_cut`                 DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '冻结团队分成',
    `service_instance_id`      INT UNSIGNED NULL DEFAULT NULL COMMENT '接受后生成的履约切片ID',
    `decided_by_entity_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '处理邀请Entity ID',
    `decision_reason`          VARCHAR(500) NULL DEFAULT NULL COMMENT '拒绝或撤回原因',
    `decided_at`               INT UNSIGNED NULL DEFAULT NULL COMMENT '处理时间',
    `idempotency_key`          VARCHAR(100) NULL DEFAULT NULL COMMENT '创建邀请幂等键',
    `create_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`              INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_assignment_offer_instance` (`service_instance_id`),
    UNIQUE KEY `uk_assignment_offer_idempotency` (`team_id`, `holder_entity_id`, `idempotency_key`),
    KEY `idx_assignment_offer_target` (`team_id`, `target_handler_entity_id`, `status`, `id`),
    KEY `idx_assignment_offer_customer` (`customer_id`, `entitlement_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Customer指定接单邀请';

-- ----------------------------
-- Table: team_service_instance
-- Model: app\model\TeamServiceInstance
-- ----------------------------
CREATE TABLE `team_service_instance` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`             INT UNSIGNED NOT NULL COMMENT '服务提供团队ID',
    `service_id`          INT UNSIGNED NOT NULL COMMENT '服务定义ID',
    `customer_id`         INT UNSIGNED NOT NULL COMMENT '持有Customer ID',
    `holder_entity_id`    INT UNSIGNED NOT NULL COMMENT '持有Customer根Entity ID',
    `entitlement_id`      INT UNSIGNED NOT NULL COMMENT '服务权益ID',
    `source_product_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '来源商品ID',
    `source_order_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '来源订单ID',
    `source_claim_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '来源卡密领取ID',
    `ordinal`             INT UNSIGNED NOT NULL COMMENT '来源内序号',
    `quantity`            DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '本次履约数量',
    `status`              TINYINT      NOT NULL DEFAULT 1 COMMENT '1-未核销 2-核销中 3-已核销',
    `handler_entity_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '当前接单Entity ID',
    `sender_entity_id`    INT UNSIGNED NULL DEFAULT NULL COMMENT '冻结发单Entity ID',
    `cs_entity_id`        INT UNSIGNED NULL DEFAULT NULL COMMENT '冻结客服Entity ID',
    `total_price`         DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '该次履约价值',
    `cost`                DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '该次成本',
    `handler_cut`         DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '该次接单分成',
    `sender_cut`          DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '该次发单分成',
    `cs_cut`              DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '该次客服分成',
    `team_cut`            DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '该次团队分成',
    `expire_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '到期时间 0=永久',
    `started_at`          INT UNSIGNED NULL DEFAULT NULL COMMENT '开始核销时间',
    `auto_complete_after_minutes` INT UNSIGNED NULL DEFAULT NULL COMMENT '本次结单请求确认分钟数快照 NULL=关闭',
    `settlement_kind` VARCHAR(20) NOT NULL DEFAULT 'service' COMMENT 'service=正常核销 unused=未使用权益结单',
    `completion_requested_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '接单人请求结单时间',
    `completed_at`        INT UNSIGNED NULL DEFAULT NULL COMMENT '完成核销时间',
    `trans_id`            INT UNSIGNED NULL DEFAULT NULL COMMENT '核销流水ID',
    `memo`                TEXT         NULL COMMENT '客户备注',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_service_entitlement_ordinal` (`entitlement_id`, `ordinal`),
    KEY `idx_service_order` (`source_order_id`,`id`),
    KEY `idx_service_claim` (`source_claim_id`,`id`),
    KEY `idx_service_customer_status` (`customer_id`, `status`, `id`),
    KEY `idx_service_handler_status` (`handler_entity_id`, `status`, `id`),
    KEY `idx_service_team_status` (`team_id`, `status`, `id`),
    KEY `idx_service_auto_complete` (`status`, `auto_complete_after_minutes`, `completion_requested_at`, `id`),
    UNIQUE KEY `uk_service_instance_trans` (`trans_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='独立可核销服务实例';

-- ----------------------------
-- Table: team_service_field_value
-- Model: app\model\TeamServiceFieldValue
-- ----------------------------
CREATE TABLE `team_service_field_value` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `service_instance_id` INT UNSIGNED NOT NULL COMMENT '服务实例ID',
    `field_id`            INT UNSIGNED NOT NULL COMMENT '服务核销字段ID',
    `resource_index`      INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '履约资源序号，从1开始',
    `value_string`        VARCHAR(500) NULL DEFAULT NULL COMMENT '字符串值',
    `value_text`          TEXT         NULL COMMENT '文本值',
    `value_int`           INT          NULL DEFAULT NULL COMMENT '整数值',
    `value_decimal`       DECIMAL(12,2) NULL DEFAULT NULL COMMENT '小数值',
    `value_datetime`      INT UNSIGNED NULL DEFAULT NULL COMMENT '时间值',
    `value_json`          JSON         NULL COMMENT 'JSON值',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_service_field_value` (`service_instance_id`, `field_id`, `resource_index`),
    KEY `idx_service_field` (`field_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务核销字段值';

-- ----------------------------
-- Table: team_service_cancel_request
-- Model: app\model\TeamServiceCancelRequest
-- ----------------------------
CREATE TABLE `team_service_cancel_request` (
    `id`                     INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `service_instance_id`    INT UNSIGNED NOT NULL COMMENT '服务实例ID',
    `requested_by_entity_id` INT UNSIGNED NOT NULL COMMENT '申请Entity ID',
    `status`                 TINYINT      NOT NULL DEFAULT 1 COMMENT '1-待处理 2-已同意 3-已拒绝',
    `reason`                 VARCHAR(500) NOT NULL DEFAULT '' COMMENT '申请原因',
    `decided_by_entity_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '裁决Entity ID',
    `decision_reason`        VARCHAR(500) NULL DEFAULT NULL COMMENT '拒绝原因',
    `decided_at`             INT UNSIGNED NULL DEFAULT NULL COMMENT '裁决时间',
    `create_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`            INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_service_cancel_open` (`service_instance_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务取消核销申请';

-- ----------------------------
-- Table: team_service_event
-- Model: app\model\TeamServiceEvent
-- ----------------------------
CREATE TABLE `team_service_event` (
    `id`                     INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `service_instance_id`    INT UNSIGNED NOT NULL COMMENT '服务实例ID',
    `actor_entity_id`        INT UNSIGNED NULL DEFAULT NULL COMMENT '操作Entity ID NULL=系统自动操作',
    `event_type`             VARCHAR(30)  NOT NULL DEFAULT '' COMMENT '事件类型',
    `from_handler_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '原接单Entity ID',
    `to_handler_entity_id`   INT UNSIGNED NULL DEFAULT NULL COMMENT '新接单Entity ID',
    `detail`                 JSON         NULL COMMENT '事件详情',
    `create_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`            INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_service_event_instance` (`service_instance_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务核销事件';

-- ----------------------------
-- Table: team_service_adjustment
-- Model: app\model\TeamServiceAdjustment
-- ----------------------------
CREATE TABLE `team_service_adjustment` (
    `id`                       INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`                  INT UNSIGNED NOT NULL COMMENT '团队ID',
    `service_instance_id`      INT UNSIGNED NOT NULL COMMENT '履约切片ID',
    `customer_id`              INT UNSIGNED NOT NULL COMMENT '付款Customer ID',
    `requested_by_entity_id`   INT UNSIGNED NOT NULL COMMENT '提出费用的Entity ID',
    `name`                     VARCHAR(100) NOT NULL DEFAULT '' COMMENT '费用名称',
    `quantity`                 DECIMAL(18,4) NOT NULL DEFAULT 1.0000 COMMENT '费用数量',
    `unit_price`               DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '费用单价',
    `total_price`              DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '费用总价',
    `cost`                     DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '费用成本',
    `handler_cut`              DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '接单分成',
    `sender_cut`               DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '发单分成',
    `cs_cut`                   DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '客服分成',
    `team_cut`                 DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '团队分成',
    `status`                   TINYINT NOT NULL DEFAULT 1 COMMENT '1-待客户确认 2-已确认 3-已取消',
    `decided_by_entity_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT 'Customer决策Entity ID',
    `decided_at`               INT UNSIGNED NULL DEFAULT NULL COMMENT '决策时间',
    `receipt_trans_id`         INT UNSIGNED NULL DEFAULT NULL COMMENT '费用收款流水ID',
    `performance_trans_id`     INT UNSIGNED NULL DEFAULT NULL COMMENT '费用履约流水ID',
    `memo`                     VARCHAR(500) NULL DEFAULT NULL COMMENT '费用说明',
    `create_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`              INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`              INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_adjustment_instance_status` (`service_instance_id`, `status`, `id`),
    KEY `idx_adjustment_customer_status` (`customer_id`, `status`, `id`),
    UNIQUE KEY `uk_adjustment_receipt_trans` (`receipt_trans_id`),
    UNIQUE KEY `uk_adjustment_performance_trans` (`performance_trans_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='履约费用调整';

-- ----------------------------
-- Table: document
-- Model: app\model\Document
-- ----------------------------
CREATE TABLE `document` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `title`             VARCHAR(255) NOT NULL DEFAULT '' COMMENT '文档标题',
    `content`           LONGTEXT     NULL COMMENT '文档内容',
    `tags`              JSON         NULL COMMENT '文档标签',
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
    `source`      VARCHAR(20) NOT NULL DEFAULT 'unknown' COMMENT '首次入库来源: unknown/manual/markdown/attachment/join/command/system',
    `pending_until` INT UNSIGNED NULL DEFAULT NULL COMMENT '待使用截止时间(NULL=已生效)',
    `team_id`     INT UNSIGNED NULL     DEFAULT NULL COMMENT 'team id (NULL=system file)',
    `entity_id`   INT UNSIGNED NULL     DEFAULT NULL COMMENT '实体身份ID，引用entity.id(NULL=无实体上传)',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_hash` (`team_id`, `hash`),
    KEY `idx_file_pending` (`pending_until`),
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
    `inviter_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '申请时确认的邀请人实体ID，可来自其他团队',
    `purpose`     TINYINT      NOT NULL DEFAULT 1 COMMENT '目的 1-加入 2-复职',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 1-已申请 2-审核中 3-已取消 4-已加入 5-已拒绝',
    `memo`        VARCHAR(500) NULL     DEFAULT NULL COMMENT '备注/拒绝原因',
    `create_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time` INT UNSIGNED NULL     DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_status` (`team_id`, `status`, `id`),
    KEY `idx_team_user` (`team_id`, `user_id`),
    KEY `idx_entity_id` (`entity_id`),
    KEY `idx_inviter_entity_id` (`inviter_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队加入申请表';

-- ----------------------------
-- Table: team_member_departure
-- Model: app\model\TeamMemberDeparture
-- ----------------------------
CREATE TABLE `team_member_departure` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`             INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `member_id`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '目标成员ID',
    `requester_entity_id` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '发起实体ID',
    `decision_entity_id`  INT UNSIGNED NULL DEFAULT NULL COMMENT '决定实体ID',
    `status`              TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 1-申请中 2-已取消 3-已批准 4-已拒绝',
    `decided_at`          INT UNSIGNED NULL DEFAULT NULL COMMENT '决定时间',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_team_status` (`team_id`, `status`, `id`),
    KEY `idx_member_status` (`member_id`, `status`, `id`),
    KEY `idx_requester_entity_id` (`requester_entity_id`),
    KEY `idx_decision_entity_id` (`decision_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员离队申请表';

-- ----------------------------
-- Table: team_member_tenure
-- Model: app\model\TeamMemberTenure
-- ----------------------------
CREATE TABLE `team_member_tenure` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`             INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '团队ID',
    `member_id`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '成员ID',
    `join_application_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '加入或复职申请ID',
    `joined_at`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '本次入队时间',
    `departed_at`         INT UNSIGNED NULL DEFAULT NULL COMMENT '本次离队时间',
    `create_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`         INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_member_joined` (`member_id`, `joined_at`, `id`),
    KEY `idx_team_departed` (`team_id`, `departed_at`, `id`),
    KEY `idx_join_application_id` (`join_application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员任期表';

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
    `signing_secret` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Standard Webhooks whsec_ Base64出站签名密钥',
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
    `team_id`         INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空',
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
    `team_id`              INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空',
    `conversation_id`      BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '会话ID',
    `entity_id`            INT UNSIGNED NOT NULL COMMENT '参与实体ID',
    `status`               VARCHAR(20)  NOT NULL DEFAULT 'active' COMMENT 'pending/active/rejected',
    `invited_by_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '邀请人实体ID',
    `invited_at`           INT UNSIGNED NULL DEFAULT NULL COMMENT '邀请时间',
    `responded_at`         INT UNSIGNED NULL DEFAULT NULL COMMENT '响应时间',
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

CREATE TABLE `chat_entity_block` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `blocker_entity_id` INT UNSIGNED NOT NULL COMMENT '发起屏蔽的实体ID',
    `blocked_entity_id` INT UNSIGNED NOT NULL COMMENT '被屏蔽的实体ID',
    `create_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`       INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_chat_block_pair` (`blocker_entity_id`, `blocked_entity_id`),
    KEY `idx_chat_blocked` (`blocked_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天实体屏蔽关系';

CREATE TABLE `chat_conversation_alias` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `alias_uuid`      CHAR(36) NOT NULL COMMENT '历史会话UUID',
    `conversation_id` BIGINT UNSIGNED NOT NULL COMMENT '归并后的会话ID',
    `create_time`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新时间',
    `delete_time`     INT UNSIGNED NULL DEFAULT NULL COMMENT '软删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_chat_alias_uuid` (`alias_uuid`),
    KEY `idx_chat_alias_conversation` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='历史聊天会话别名';

-- ----------------------------
-- Table: chat_message
-- Model: app\model\ChatMessage
-- ----------------------------
CREATE TABLE `chat_message` (
    `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `team_id`               INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空',
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
    `team_id`        INT UNSIGNED NULL DEFAULT NULL COMMENT '群聊所属团队ID；单聊为空',
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
ALTER TABLE `team_member` ADD CONSTRAINT `fk_team_member_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_team_member_inviter_entity` FOREIGN KEY (`inviter_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_entity_profile` ADD CONSTRAINT `fk_entity_profile_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_ability` ADD CONSTRAINT `fk_team_ability_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_ability_grant` ADD CONSTRAINT `fk_ability_grant_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_ability_grant_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`);
ALTER TABLE `benefit_package` ADD CONSTRAINT `fk_benefit_package_issuer` FOREIGN KEY (`issuer_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_benefit_package_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `benefit_package_ability` ADD CONSTRAINT `fk_package_ability_package` FOREIGN KEY (`package_id`) REFERENCES `benefit_package` (`id`);
ALTER TABLE `team_service` ADD CONSTRAINT `fk_team_service_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_service_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_service_handler` ADD CONSTRAINT `fk_service_handler_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_service_handler_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `benefit_package_service` ADD CONSTRAINT `fk_package_service_package` FOREIGN KEY (`package_id`) REFERENCES `benefit_package` (`id`), ADD CONSTRAINT `fk_package_service_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_package_item_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`);
ALTER TABLE `redemption_code` ADD CONSTRAINT `fk_redemption_code_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`);
ALTER TABLE `team_order` ADD CONSTRAINT `fk_order_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`);
ALTER TABLE `redemption_campaign` ADD CONSTRAINT `fk_redemption_campaign_package` FOREIGN KEY (`package_id`) REFERENCES `benefit_package` (`id`), ADD CONSTRAINT `fk_redemption_campaign_issuer` FOREIGN KEY (`issuer_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_redemption_campaign_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `redemption_code` ADD CONSTRAINT `fk_redemption_code_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `redemption_campaign` (`id`), ADD CONSTRAINT `fk_redemption_code_order` FOREIGN KEY (`source_order_id`) REFERENCES `team_order` (`id`), ADD CONSTRAINT `fk_redemption_code_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_redemption_code_target_team` FOREIGN KEY (`target_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_redemption_code_target_entity` FOREIGN KEY (`target_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `redemption_claim` ADD CONSTRAINT `fk_redemption_claim_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `redemption_campaign` (`id`), ADD CONSTRAINT `fk_redemption_claim_code` FOREIGN KEY (`code_id`) REFERENCES `redemption_code` (`id`), ADD CONSTRAINT `fk_redemption_claim_target_team` FOREIGN KEY (`target_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_redemption_claim_target_entity` FOREIGN KEY (`target_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_redemption_claim_actor` FOREIGN KEY (`claimed_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_notice` ADD CONSTRAINT `fk_team_notice_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_notice_sender_team` FOREIGN KEY (`sender_team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_notice_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_customer` ADD CONSTRAINT `fk_team_customer_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_team_customer_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_team_customer_owner_entity` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_team_customer_assignee_entity` FOREIGN KEY (`assignee_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_transaction` ADD CONSTRAINT `fk_transaction_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_transaction_handler_entity` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_transaction_sender_entity` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_transaction_cs_entity` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_transaction_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_transaction_service_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_transaction_service_adjustment` FOREIGN KEY (`service_adjustment_id`) REFERENCES `team_service_adjustment` (`id`);
ALTER TABLE `team_customer_balance` ADD CONSTRAINT `fk_balance_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`);
ALTER TABLE `team_customer_balance_log` ADD CONSTRAINT `fk_balance_log_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_balance_log_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `team_customer_sender` ADD CONSTRAINT `fk_customer_sender_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_customer_sender_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_customer_sender_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_product` ADD CONSTRAINT `fk_product_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_product_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_product_benefit_package` FOREIGN KEY (`benefit_package_id`) REFERENCES `benefit_package` (`id`), ADD CONSTRAINT `fk_product_redemption_campaign` FOREIGN KEY (`redemption_campaign_id`) REFERENCES `redemption_campaign` (`id`);
ALTER TABLE `team_product_handler` ADD CONSTRAINT `fk_product_handler_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_product_handler_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_service_redemption_field` ADD CONSTRAINT `fk_service_redemption_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_service_redemption_field_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`);
ALTER TABLE `team_order` ADD CONSTRAINT `fk_order_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_order_handler_entity` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_order_sender_entity` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_order_cs_entity` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_order_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `team_service_entitlement` ADD CONSTRAINT `fk_entitlement_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_entitlement_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_entitlement_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_entitlement_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_entitlement_sender` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_entitlement_cs` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_entitlement_product` FOREIGN KEY (`source_product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_entitlement_order` FOREIGN KEY (`source_order_id`) REFERENCES `team_order` (`id`), ADD CONSTRAINT `fk_entitlement_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`), ADD CONSTRAINT `fk_entitlement_package_item` FOREIGN KEY (`source_package_item_id`) REFERENCES `benefit_package_service` (`id`);
ALTER TABLE `team_service_assignment_offer` ADD CONSTRAINT `fk_assignment_offer_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_assignment_offer_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_assignment_offer_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_assignment_offer_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_assignment_offer_entitlement` FOREIGN KEY (`entitlement_id`) REFERENCES `team_service_entitlement` (`id`), ADD CONSTRAINT `fk_assignment_offer_target` FOREIGN KEY (`target_handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_assignment_offer_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_assignment_offer_decider` FOREIGN KEY (`decided_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_service_instance` ADD CONSTRAINT `fk_service_instance_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_service_instance_service` FOREIGN KEY (`service_id`) REFERENCES `team_service` (`id`), ADD CONSTRAINT `fk_service_instance_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_service_instance_holder` FOREIGN KEY (`holder_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_entitlement` FOREIGN KEY (`entitlement_id`) REFERENCES `team_service_entitlement` (`id`), ADD CONSTRAINT `fk_service_instance_product` FOREIGN KEY (`source_product_id`) REFERENCES `team_product` (`id`), ADD CONSTRAINT `fk_service_instance_order` FOREIGN KEY (`source_order_id`) REFERENCES `team_order` (`id`), ADD CONSTRAINT `fk_service_instance_claim` FOREIGN KEY (`source_claim_id`) REFERENCES `redemption_claim` (`id`), ADD CONSTRAINT `fk_service_instance_handler` FOREIGN KEY (`handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_sender` FOREIGN KEY (`sender_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_cs` FOREIGN KEY (`cs_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_instance_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `team_service_field_value` ADD CONSTRAINT `fk_service_field_value_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_service_field_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_service_redemption_field` (`id`);
ALTER TABLE `team_service_cancel_request` ADD CONSTRAINT `fk_service_cancel_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_service_cancel_requester` FOREIGN KEY (`requested_by_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_cancel_decider` FOREIGN KEY (`decided_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_service_event` ADD CONSTRAINT `fk_service_event_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_service_event_actor` FOREIGN KEY (`actor_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_event_from_handler` FOREIGN KEY (`from_handler_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_service_event_to_handler` FOREIGN KEY (`to_handler_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_service_adjustment` ADD CONSTRAINT `fk_adjustment_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_adjustment_instance` FOREIGN KEY (`service_instance_id`) REFERENCES `team_service_instance` (`id`), ADD CONSTRAINT `fk_adjustment_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`), ADD CONSTRAINT `fk_adjustment_requester` FOREIGN KEY (`requested_by_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_adjustment_decider` FOREIGN KEY (`decided_by_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_adjustment_receipt_trans` FOREIGN KEY (`receipt_trans_id`) REFERENCES `team_transaction` (`id`), ADD CONSTRAINT `fk_adjustment_performance_trans` FOREIGN KEY (`performance_trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `document` ADD CONSTRAINT `fk_document_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `file` ADD CONSTRAINT `fk_file_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_file_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_setting` ADD CONSTRAINT `fk_team_setting_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `visibility_target` ADD CONSTRAINT `fk_visibility_target_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_join_field` ADD CONSTRAINT `fk_join_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_join_field_entity_field` FOREIGN KEY (`entity_field_id`) REFERENCES `team_entity_field` (`id`);
ALTER TABLE `team_join_application` ADD CONSTRAINT `fk_join_application_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_join_application_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`), ADD CONSTRAINT `fk_join_application_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_join_application_inviter_entity` FOREIGN KEY (`inviter_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_member_departure` ADD CONSTRAINT `fk_member_departure_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_member_departure_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`), ADD CONSTRAINT `fk_member_departure_requester` FOREIGN KEY (`requester_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_member_departure_decision` FOREIGN KEY (`decision_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `team_member_tenure` ADD CONSTRAINT `fk_member_tenure_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_member_tenure_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`), ADD CONSTRAINT `fk_member_tenure_join_application` FOREIGN KEY (`join_application_id`) REFERENCES `team_join_application` (`id`);
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
ALTER TABLE `chat_participant` ADD CONSTRAINT `fk_chat_participant_inviter` FOREIGN KEY (`invited_by_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_entity_block` ADD CONSTRAINT `fk_chat_blocker_entity` FOREIGN KEY (`blocker_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_chat_blocked_entity` FOREIGN KEY (`blocked_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `chat_conversation_alias` ADD CONSTRAINT `fk_chat_alias_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`);
ALTER TABLE `chat_message` ADD CONSTRAINT `fk_chat_message_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`), ADD CONSTRAINT `fk_chat_message_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_chat_message_reply` FOREIGN KEY (`reply_id`) REFERENCES `chat_message` (`id`), ADD CONSTRAINT `fk_chat_message_integration` FOREIGN KEY (`origin_integration_id`) REFERENCES `team_virtual_integration` (`id`);
ALTER TABLE `chat_event_outbox` ADD CONSTRAINT `fk_chat_outbox_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `chat_webhook_delivery` ADD CONSTRAINT `fk_webhook_delivery_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_webhook_delivery_outbox` FOREIGN KEY (`outbox_id`) REFERENCES `chat_event_outbox` (`id`), ADD CONSTRAINT `fk_webhook_delivery_integration` FOREIGN KEY (`integration_id`) REFERENCES `team_virtual_integration` (`id`);
ALTER TABLE `business_audit_event` ADD CONSTRAINT `fk_business_audit_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_business_audit_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_business_audit_user` FOREIGN KEY (`authenticated_user_id`) REFERENCES `user` (`id`);

-- Weibo application tables (development credentials are intentionally plaintext).
CREATE TABLE `weibo_account` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(32) NOT NULL, `uid` VARCHAR(32) NOT NULL,
  `gsid` TEXT NOT NULL, `from_value` VARCHAR(32) NOT NULL,
  `screen_name` VARCHAR(100) NOT NULL DEFAULT '', `oauth_token` TEXT NULL,
  `cookie_json` JSON NULL, `user_json` JSON NULL,
  `health` TINYINT UNSIGNED NOT NULL DEFAULT 0, `checked_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_account_phone` (`phone`), UNIQUE KEY `uk_weibo_account_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='寰崥璐﹀彿鏄庢枃鍑嵁';

CREATE TABLE `weibo_account_binding` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL,
  `entity_id` INT UNSIGNED NOT NULL, `account_id` BIGINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_binding` (`entity_id`,`account_id`), KEY `idx_weibo_binding_team` (`team_id`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='寰崥璐﹀彿瀹炰綋缁戝畾';

CREATE TABLE `weibo_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL, `owner_entity_id` INT UNSIGNED NOT NULL,
  `pid` VARCHAR(100) NOT NULL, `content_type` VARCHAR(100) NULL,
  `byte_count` INT UNSIGNED NULL, `variants` JSON NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_media_pid` (`team_id`,`owner_entity_id`,`pid`), KEY `idx_weibo_media_owner` (`team_id`,`owner_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='寰崥杩滅濯掍綋鍏冩暟鎹?;

CREATE TABLE `weibo_task` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL,
  `owner_entity_id` INT UNSIGNED NULL, `creator_entity_id` INT UNSIGNED NOT NULL, `operation_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `topic_name` VARCHAR(100) NOT NULL, `container_id` VARCHAR(100) NOT NULL, `topic_id` VARCHAR(100) NOT NULL, `display_tag` VARCHAR(130) NOT NULL,
  `content` TEXT NOT NULL, `start_at` INT UNSIGNED NOT NULL, `min_interval` INT UNSIGNED NOT NULL, `max_interval` INT UNSIGNED NOT NULL,
  `next_run_at` INT UNSIGNED NULL, `status` TINYINT UNSIGNED NOT NULL DEFAULT 1, `block_reason` VARCHAR(50) NULL, `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), KEY `idx_weibo_task_due` (`status`,`next_run_at`), KEY `idx_weibo_task_scope` (`team_id`,`owner_entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='寰崥鎸佺画闅忔満浠诲姟';

CREATE TABLE `weibo_task_account` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `task_id` BIGINT UNSIGNED NOT NULL, `account_id` BIGINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_task_account` (`task_id`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `weibo_task_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `task_id` BIGINT UNSIGNED NOT NULL, `media_id` BIGINT UNSIGNED NOT NULL, `sort` TINYINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_task_media` (`task_id`,`media_id`), KEY `idx_weibo_task_media_sort` (`task_id`,`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `weibo_operation_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `dispatch_key` VARCHAR(100) NOT NULL,
  `team_id` INT UNSIGNED NOT NULL, `owner_entity_id` INT UNSIGNED NULL, `actor_entity_id` INT UNSIGNED NULL,
  `account_id` BIGINT UNSIGNED NULL, `task_id` BIGINT UNSIGNED NULL, `task_version` INT UNSIGNED NULL,
  `operation_type` TINYINT UNSIGNED NOT NULL, `source` TINYINT UNSIGNED NOT NULL, `status` TINYINT UNSIGNED NOT NULL,
  `target_id` VARCHAR(32) NULL, `content_summary` VARCHAR(255) NULL, `media_summary` JSON NULL,
  `remote_status_id` VARCHAR(32) NULL, `remote_comment_id` VARCHAR(32) NULL,
  `reason` VARCHAR(64) NULL, `remote_code` VARCHAR(64) NULL, `remote_message` VARCHAR(255) NULL, `http_status` SMALLINT UNSIGNED NULL,
  `started_at` INT UNSIGNED NOT NULL, `finished_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_dispatch` (`dispatch_key`), KEY `idx_weibo_operation_scope` (`team_id`,`owner_entity_id`,`create_time`), KEY `idx_weibo_operation_task` (`task_id`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='寰崥鏈€灏忕粨鏋勫寲鎿嶄綔鏃ュ織';

CREATE TABLE `weibo_feed_post` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `status_id` VARCHAR(32) NOT NULL, `text` TEXT NOT NULL, `author_name` VARCHAR(100) NOT NULL DEFAULT '',
  `posted_at` INT UNSIGNED NOT NULL, `classification_status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `classification_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0, `classifier_model` VARCHAR(100) NULL,
  `intent_score` DECIMAL(6,5) NULL, `classification_error` VARCHAR(500) NULL, `classified_at` INT UNSIGNED NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_feed_status` (`status_id`),
  KEY `idx_weibo_feed_listing` (`classification_status`,`posted_at`),
  KEY `idx_weibo_feed_retry` (`classification_status`,`classification_attempts`,`posted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全局微博陪玩点单信息流';

CREATE TABLE `weibo_comment_preset` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `team_id` INT UNSIGNED NOT NULL, `entity_id` INT UNSIGNED NULL,
  `content` VARCHAR(500) NOT NULL, `sort` TINYINT UNSIGNED NOT NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_weibo_preset_scope_sort` (`team_id`,`entity_id`,`sort`), KEY `idx_weibo_preset_entity` (`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队及个人微博评论预设';

CREATE TABLE `weibo_feed_poll_state` (
  `id` TINYINT UNSIGNED NOT NULL, `last_attempt_at` INT UNSIGNED NULL, `last_success_at` INT UNSIGNED NULL, `last_error` VARCHAR(500) NULL,
  `create_time` INT UNSIGNED NOT NULL DEFAULT 0, `update_time` INT UNSIGNED NOT NULL DEFAULT 0, `delete_time` INT UNSIGNED NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微博信息流轮询状态';

ALTER TABLE `weibo_account_binding` ADD CONSTRAINT `fk_weibo_binding_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_binding_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_binding_account` FOREIGN KEY (`account_id`) REFERENCES `weibo_account` (`id`);
ALTER TABLE `weibo_media` ADD CONSTRAINT `fk_weibo_media_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_media_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `weibo_task` ADD CONSTRAINT `fk_weibo_task_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_task_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_task_creator` FOREIGN KEY (`creator_entity_id`) REFERENCES `entity` (`id`);
ALTER TABLE `weibo_task_account` ADD CONSTRAINT `fk_weibo_task_account_task` FOREIGN KEY (`task_id`) REFERENCES `weibo_task` (`id`), ADD CONSTRAINT `fk_weibo_task_account_account` FOREIGN KEY (`account_id`) REFERENCES `weibo_account` (`id`);
ALTER TABLE `weibo_task_media` ADD CONSTRAINT `fk_weibo_task_media_task` FOREIGN KEY (`task_id`) REFERENCES `weibo_task` (`id`), ADD CONSTRAINT `fk_weibo_task_media_media` FOREIGN KEY (`media_id`) REFERENCES `weibo_media` (`id`);
ALTER TABLE `weibo_operation_log` ADD CONSTRAINT `fk_weibo_operation_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_operation_owner` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_operation_actor` FOREIGN KEY (`actor_entity_id`) REFERENCES `entity` (`id`), ADD CONSTRAINT `fk_weibo_operation_account` FOREIGN KEY (`account_id`) REFERENCES `weibo_account` (`id`), ADD CONSTRAINT `fk_weibo_operation_task` FOREIGN KEY (`task_id`) REFERENCES `weibo_task` (`id`);
ALTER TABLE `weibo_comment_preset` ADD CONSTRAINT `fk_weibo_preset_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`), ADD CONSTRAINT `fk_weibo_preset_entity` FOREIGN KEY (`entity_id`) REFERENCES `entity` (`id`);

CREATE TABLE IF NOT EXISTS `manual_entitlement_grant_operation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `team_id` INT UNSIGNED NOT NULL COMMENT '目标团队',
    `actor_entity_id` INT UNSIGNED NOT NULL COMMENT '当前全局 Entity',
    `idempotency_key` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '业务提交 UUID',
    `request_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT '规范化业务请求 SHA256',
    `result` JSON NULL COMMENT '成功结果；NULL 仅存在于未提交事务',
    `create_time` INT UNSIGNED NOT NULL,
    `update_time` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_manual_grant_operation` (`team_id`, `actor_entity_id`, `idempotency_key`),
    KEY `idx_manual_grant_actor` (`actor_entity_id`),
    CONSTRAINT `fk_manual_grant_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    CONSTRAINT `fk_manual_grant_actor` FOREIGN KEY (`actor_entity_id`) REFERENCES `entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='手动发放持久幂等账本，无自动清理';

CREATE TABLE IF NOT EXISTS `site_content` (
    `id` TINYINT UNSIGNED NOT NULL COMMENT '官网内容单例，固定为 1',
    `content` JSON NOT NULL COMMENT 'ICP备案号、核心人员和团队优势指标',
    `update_time` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='官网公开内容配置';
