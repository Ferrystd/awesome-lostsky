DELETE FROM `team_setting`
WHERE `app_name` = 'service' AND `key` = 'default_quantity_scale';

ALTER TABLE `team_service`
    DROP COLUMN `quantity_scale`;

ALTER TABLE `team_service_entitlement`
    DROP COLUMN `quantity_scale`;
