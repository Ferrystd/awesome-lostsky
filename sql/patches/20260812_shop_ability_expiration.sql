ALTER TABLE `team_notice`
    ADD COLUMN `dedup_key` VARCHAR(191) NULL DEFAULT NULL COMMENT '内部幂等键，不对 API 输出' AFTER `content`,
    ADD UNIQUE KEY `uk_notice_dedup_key` (`dedup_key`);

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
