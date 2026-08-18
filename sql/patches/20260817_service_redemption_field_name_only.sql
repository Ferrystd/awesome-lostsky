SET @drop_service_field_key_index = IF(
    EXISTS(
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'team_service_redemption_field'
          AND index_name = 'uk_service_redemption_field'
    ),
    'ALTER TABLE `team_service_redemption_field` DROP INDEX `uk_service_redemption_field`',
    'SELECT 1'
);

PREPARE drop_service_field_key_index_statement FROM @drop_service_field_key_index;
EXECUTE drop_service_field_key_index_statement;
DEALLOCATE PREPARE drop_service_field_key_index_statement;

SET @drop_service_field_key_column = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'team_service_redemption_field'
          AND column_name = 'field_key'
    ),
    'ALTER TABLE `team_service_redemption_field` DROP COLUMN `field_key`',
    'SELECT 1'
);

PREPARE drop_service_field_key_column_statement FROM @drop_service_field_key_column;
EXECUTE drop_service_field_key_column_statement;
DEALLOCATE PREPARE drop_service_field_key_column_statement;
