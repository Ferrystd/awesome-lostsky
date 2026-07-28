-- Shop 展示型商城：客户绑定、商品媒体与订单快照
-- MySQL DDL 会隐式提交；执行前必须备份并逐段核验。

ALTER TABLE `team_customer`
    MODIFY `user_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '直接绑定用户ID',
    ADD COLUMN `owner_entity_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '来源实体ID' AFTER `user_id`,
    ADD UNIQUE KEY `uk_team_owner_entity` (`team_id`, `owner_entity_id`),
    ADD KEY `idx_owner_entity_id` (`owner_entity_id`),
    ADD CONSTRAINT `fk_team_customer_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    ADD CONSTRAINT `fk_team_customer_owner_entity` FOREIGN KEY (`owner_entity_id`) REFERENCES `entity` (`id`);

ALTER TABLE `team_product`
    ADD COLUMN `cover_image` VARCHAR(500) NULL DEFAULT NULL COMMENT '商品封面' AFTER `description`,
    ADD COLUMN `introduction_markdown` TEXT NULL COMMENT '商品 Markdown 详情' AFTER `cover_image`;

ALTER TABLE `team_order`
    ADD COLUMN `product_name` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '下单时商品名称' AFTER `product_id`,
    ADD COLUMN `product_cover_image` VARCHAR(500) NULL DEFAULT NULL COMMENT '下单时商品封面' AFTER `product_name`,
    MODIFY `status` TINYINT NOT NULL DEFAULT 1 COMMENT '订单状态 1-处理中 2-已完成 3-已取消';

UPDATE `team_order` AS o
INNER JOIN `team_product` AS p ON p.id = o.product_id
SET o.product_name = p.name,
    o.product_cover_image = p.cover_image
WHERE o.product_name = '';
