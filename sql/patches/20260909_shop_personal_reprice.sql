-- 统一本人商品、服务和权益包调价权限；迁移旧叶子键及其专用父键。
-- 保留已有授权，重复执行不会重复新增；已撤销的授权不会被恢复。
INSERT INTO `team_role_permission`
    (`team_id`, `role_id`, `permission_key`, `create_time`, `update_time`, `delete_time`)
SELECT `team_id`, `role_id`, 'shop.product.self.reprice', MIN(`create_time`), UNIX_TIMESTAMP(), NULL
FROM `team_role_permission`
WHERE `permission_key` IN ('shop.product.self.package.reprice', 'shop.product.self.package')
  AND `delete_time` IS NULL
GROUP BY `team_id`, `role_id`
ON DUPLICATE KEY UPDATE `delete_time` = NULL, `update_time` = UNIX_TIMESTAMP();

DELETE FROM `team_role_permission`
WHERE `permission_key` IN ('shop.product.self.package.reprice', 'shop.product.self.package');
