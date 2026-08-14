DELETE FROM `team_setting`
WHERE `app_name` = 'service' AND `key` = 'assignment_offer_timeout_minutes';

ALTER TABLE `team_service_assignment_offer`
    DROP INDEX `idx_assignment_offer_target`,
    DROP COLUMN `expire_time`,
    ADD KEY `idx_assignment_offer_target` (`team_id`, `target_handler_entity_id`, `status`, `id`);
