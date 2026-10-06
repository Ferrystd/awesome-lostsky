CREATE TABLE IF NOT EXISTS `site_content` (
    `id` TINYINT UNSIGNED NOT NULL COMMENT '官网内容单例，固定为 1',
    `content` JSON NOT NULL COMMENT 'ICP备案号、核心人员和团队优势指标',
    `update_time` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='官网公开内容配置';
