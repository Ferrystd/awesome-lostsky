-- MySQL DDL 会隐式提交；本补丁必须按语句顺序执行，不声明伪事务。
-- file.entity_id 指向全局唯一的 entity_identity.id，不是业务实体表的本地 ID。

ALTER TABLE `file`
    ADD COLUMN `entity_id` INT UNSIGNED NULL DEFAULT NULL
        COMMENT '实体身份ID，引用entity_identity.id(NULL=无实体上传)' AFTER `team_id`,
    ADD KEY `idx_entity_id` (`entity_id`);

UPDATE `file` AS `file_record`
LEFT JOIN `entity_identity` AS `identity`
    ON `identity`.`entityable_type` = 'teamMember'
    AND `identity`.`entityable_id` = `file_record`.`member_id`
SET `file_record`.`entity_id` = `identity`.`id`
WHERE `file_record`.`member_id` IS NOT NULL;

ALTER TABLE `file`
    DROP FOREIGN KEY `fk_file_member`,
    DROP KEY `idx_member_id`,
    DROP COLUMN `member_id`,
    ADD CONSTRAINT `fk_file_entity`
        FOREIGN KEY (`entity_id`) REFERENCES `entity_identity` (`id`);
