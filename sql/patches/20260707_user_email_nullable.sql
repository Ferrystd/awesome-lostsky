-- Allow phone-only users to register without occupying the unique email value ''.
-- MySQL unique indexes allow multiple NULL values, so real emails remain unique.

ALTER TABLE `user`
    MODIFY `email` VARCHAR(100) NULL DEFAULT NULL COMMENT '邮箱';

UPDATE `user`
SET `email` = NULL
WHERE `email` = '';
