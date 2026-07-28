-- MySQL DDL 会隐式提交。本补丁先修正一个历史哨兵值，再逐表增加可验证的实体外键。
-- 多态字段（entity_id、actor_id、documentable_id 等）以及允许 0 表示团队主体的字段不加伪外键。

UPDATE `team_customer_balance_log`
SET `trans_id` = NULL
WHERE `trans_id` = 0;

ALTER TABLE `team_customer_balance_log`
    MODIFY COLUMN `trans_id` INT UNSIGNED NULL DEFAULT NULL COMMENT '关联流水ID';

ALTER TABLE `user_profile`
    ADD CONSTRAINT `fk_user_profile_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `user_setting`
    ADD CONSTRAINT `fk_user_setting_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `user_device`
    ADD CONSTRAINT `fk_user_device_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `team`
    ADD CONSTRAINT `fk_team_owner_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `team_profile`
    ADD CONSTRAINT `fk_team_profile_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_domain`
    ADD CONSTRAINT `fk_team_domain_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_member`
    ADD CONSTRAINT `fk_team_member_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_team_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `team_member_profile`
    ADD CONSTRAINT `fk_member_profile_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`);
ALTER TABLE `team_member_post_type`
    ADD CONSTRAINT `fk_post_type_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_member_post`
    ADD CONSTRAINT `fk_member_post_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`),
    ADD CONSTRAINT `fk_member_post_type` FOREIGN KEY (`type_id`) REFERENCES `team_member_post_type` (`id`);
ALTER TABLE `team_ability`
    ADD CONSTRAINT `fk_team_ability_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_notice`
    ADD CONSTRAINT `fk_team_notice_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_customer`
    ADD CONSTRAINT `fk_team_customer_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_transaction`
    ADD CONSTRAINT `fk_transaction_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_transaction_sender` FOREIGN KEY (`sender_id`) REFERENCES `team_member` (`id`),
    ADD CONSTRAINT `fk_transaction_cs` FOREIGN KEY (`cs_id`) REFERENCES `team_member` (`id`),
    ADD CONSTRAINT `fk_transaction_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`);
ALTER TABLE `team_customer_balance`
    ADD CONSTRAINT `fk_balance_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`);
ALTER TABLE `team_customer_balance_log`
    ADD CONSTRAINT `fk_balance_log_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`),
    ADD CONSTRAINT `fk_balance_log_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `team_customer_sender`
    ADD CONSTRAINT `fk_customer_sender_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_customer_sender_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`),
    ADD CONSTRAINT `fk_customer_sender_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`);
ALTER TABLE `team_customer_profile`
    ADD CONSTRAINT `fk_customer_profile_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`);
ALTER TABLE `team_product`
    ADD CONSTRAINT `fk_product_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_product_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`);
ALTER TABLE `team_product_handler`
    ADD CONSTRAINT `fk_product_handler_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`),
    ADD CONSTRAINT `fk_product_handler_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`);
ALTER TABLE `team_order`
    ADD CONSTRAINT `fk_order_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `team_customer` (`id`),
    ADD CONSTRAINT `fk_order_sender` FOREIGN KEY (`sender_id`) REFERENCES `team_member` (`id`),
    ADD CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `team_product` (`id`),
    ADD CONSTRAINT `fk_order_transaction` FOREIGN KEY (`trans_id`) REFERENCES `team_transaction` (`id`);
ALTER TABLE `file`
    ADD CONSTRAINT `fk_file_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_file_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`);
ALTER TABLE `team_setting`
    ADD CONSTRAINT `fk_team_setting_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_member_field`
    ADD CONSTRAINT `fk_member_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_member_field_value`
    ADD CONSTRAINT `fk_member_field_value_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`),
    ADD CONSTRAINT `fk_member_field_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_member_field` (`id`);
ALTER TABLE `team_join_field`
    ADD CONSTRAINT `fk_join_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_join_field_member_field` FOREIGN KEY (`member_field_id`) REFERENCES `team_member_field` (`id`);
ALTER TABLE `team_join_application`
    ADD CONSTRAINT `fk_join_application_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_join_application_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    ADD CONSTRAINT `fk_join_application_member` FOREIGN KEY (`member_id`) REFERENCES `team_member` (`id`);
ALTER TABLE `team_join_field_value`
    ADD CONSTRAINT `fk_join_value_application` FOREIGN KEY (`application_id`) REFERENCES `team_join_application` (`id`),
    ADD CONSTRAINT `fk_join_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_join_field` (`id`);
ALTER TABLE `team_join_task`
    ADD CONSTRAINT `fk_join_task_application` FOREIGN KEY (`application_id`) REFERENCES `team_join_application` (`id`);
ALTER TABLE `team_role`
    ADD CONSTRAINT `fk_team_role_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_role_permission`
    ADD CONSTRAINT `fk_role_permission_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `team_role` (`id`);
ALTER TABLE `team_entity_role`
    ADD CONSTRAINT `fk_entity_role_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_entity_role_role` FOREIGN KEY (`role_id`) REFERENCES `team_role` (`id`);
ALTER TABLE `entity_session`
    ADD CONSTRAINT `fk_entity_session_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);
ALTER TABLE `markdown_reference`
    ADD CONSTRAINT `fk_markdown_identity` FOREIGN KEY (`entity_identity_id`) REFERENCES `entity_identity` (`id`);
ALTER TABLE `team_virtual`
    ADD CONSTRAINT `fk_team_virtual_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_virtual_integration`
    ADD CONSTRAINT `fk_virtual_integration_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_virtual_integration_virtual` FOREIGN KEY (`virtual_id`) REFERENCES `team_virtual` (`id`);
ALTER TABLE `team_entity_field`
    ADD CONSTRAINT `fk_entity_field_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `team_entity_field_value`
    ADD CONSTRAINT `fk_entity_field_value_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_entity_field_value_field` FOREIGN KEY (`field_id`) REFERENCES `team_entity_field` (`id`);
ALTER TABLE `chat_conversation`
    ADD CONSTRAINT `fk_chat_conversation_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `chat_participant`
    ADD CONSTRAINT `fk_chat_participant_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_chat_participant_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`),
    ADD CONSTRAINT `fk_chat_participant_last_read` FOREIGN KEY (`last_read_message_id`) REFERENCES `chat_message` (`id`);
ALTER TABLE `chat_message`
    ADD CONSTRAINT `fk_chat_message_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`),
    ADD CONSTRAINT `fk_chat_message_reply` FOREIGN KEY (`reply_id`) REFERENCES `chat_message` (`id`),
    ADD CONSTRAINT `fk_chat_message_integration` FOREIGN KEY (`origin_integration_id`) REFERENCES `team_virtual_integration` (`id`);
ALTER TABLE `chat_event_outbox`
    ADD CONSTRAINT `fk_chat_outbox_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`);
ALTER TABLE `chat_webhook_delivery`
    ADD CONSTRAINT `fk_webhook_delivery_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
    ADD CONSTRAINT `fk_webhook_delivery_outbox` FOREIGN KEY (`outbox_id`) REFERENCES `chat_event_outbox` (`id`),
    ADD CONSTRAINT `fk_webhook_delivery_integration` FOREIGN KEY (`integration_id`) REFERENCES `team_virtual_integration` (`id`);
