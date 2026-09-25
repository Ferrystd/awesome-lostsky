ALTER TABLE `user`
    ADD COLUMN `member_join_code_hash` CHAR(64) NULL DEFAULT NULL COMMENT '个人一次性入队码 SHA-256' AFTER `is_banned`,
    ADD COLUMN `member_join_code_expires_at` INT UNSIGNED NULL DEFAULT NULL COMMENT '个人入队码过期时间' AFTER `member_join_code_hash`,
    ADD UNIQUE KEY `uk_member_join_code_hash` (`member_join_code_hash`);
