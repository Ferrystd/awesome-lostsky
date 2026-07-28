<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Team;
use think\App;

(new App(dirname(__DIR__)))->initialize();

$connection = (new Team)->db()->getConnection();
$errors = [];

$tableExists = static function (string $table) use ($connection): bool {
    $row = $connection->query(
        'SELECT COUNT(*) AS total FROM information_schema.tables '
        . 'WHERE table_schema = DATABASE() AND table_name = :table',
        ['table' => $table]
    )[0];
    return (int) $row['total'] === 1;
};

if (!$tableExists('entity')) {
    $errors[] = 'entity table is missing';
}
if ($tableExists('entity_identity')) {
    $errors[] = 'legacy entity_identity table still exists';
}
foreach ([
    'team_member_field',
    'team_member_field_value',
    'team_member_profile',
    'team_member_post',
    'team_member_post_type',
    'team_customer_profile',
    'team_profile',
] as $legacyTable) {
    if ($tableExists($legacyTable)) {
        $errors[] = "legacy {$legacyTable} table still exists";
    }
}

$references = [
    'team_entity_profile' => ['entity_id'],
    'team_transaction' => ['handler_entity_id', 'sender_entity_id', 'cs_entity_id'],
    'team_customer_sender' => ['entity_id'],
    'team_product' => ['entity_id'],
    'team_product_handler' => ['entity_id'],
    'team_order' => ['handler_entity_id', 'sender_entity_id', 'cs_entity_id'],
    'document' => ['entity_id'],
    'file' => ['entity_id'],
    'visibility_target' => ['entity_id'],
    'team_join_application' => ['entity_id'],
    'team_entity_role' => ['entity_id'],
    'entity_session' => ['entity_id'],
    'markdown_reference' => ['entity_id'],
    'team_entity_field_value' => ['entity_id'],
    'chat_conversation' => ['entity_id'],
    'chat_participant' => ['entity_id'],
    'chat_message' => ['entity_id'],
];

foreach ($references as $table => $columns) {
    foreach ($columns as $column) {
        $row = $connection->query(
            'SELECT COUNT(*) AS total FROM information_schema.key_column_usage '
            . 'WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column '
            . "AND referenced_table_name = 'entity' AND referenced_column_name = 'id'",
            ['table' => $table, 'column' => $column]
        )[0];
        if ((int) $row['total'] !== 1) {
            $errors[] = "{$table}.{$column} does not reference entity.id";
        }
    }
}

$legacyColumns = [
    'team_transaction' => ['handler_id', 'sender_id', 'cs_id'],
    'team_customer_sender' => ['member_id'],
    'team_product' => ['member_id'],
    'team_product_handler' => ['member_id'],
    'team_order' => ['handler_id', 'sender_id', 'cs_id'],
    'document' => ['documentable_type', 'documentable_id'],
    'team_join_application' => ['member_id'],
    'visibility_target' => ['target_type', 'target_id'],
    'team_entity_role' => ['entity_type'],
    'entity_session' => ['entity_type'],
    'markdown_reference' => ['entity_identity_id'],
    'team_entity_field_value' => ['entity_type'],
    'chat_conversation' => ['created_by_type', 'created_by_id'],
    'chat_participant' => ['actor_type', 'actor_id'],
    'chat_message' => ['sender_type', 'sender_id'],
    'team_join_field' => ['is_transfer_member_field', 'member_field_id'],
];

foreach ($legacyColumns as $table => $columns) {
    foreach ($columns as $column) {
        $row = $connection->query(
            'SELECT COUNT(*) AS total FROM information_schema.columns '
            . 'WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column',
            ['table' => $table, 'column' => $column]
        )[0];
        if ((int) $row['total'] !== 0) {
            $errors[] = "legacy column {$table}.{$column} still exists";
        }
    }
}

$legacyFieldTypes = $connection->query(
    "SELECT COUNT(*) AS total FROM team_entity_field WHERE entity_type IN ('member', 'person')"
)[0];
if ((int) $legacyFieldTypes['total'] !== 0) {
    $errors[] = 'legacy member/person entity field types still exist';
}

$entityFieldTypeColumn = $connection->query(
    "SELECT column_default AS default_value FROM information_schema.columns "
    . "WHERE table_schema = DATABASE() AND table_name = 'team_entity_field' AND column_name = 'entity_type'"
)[0] ?? null;
if (($entityFieldTypeColumn['default_value'] ?? null) !== 'entity') {
    $errors[] = 'team_entity_field.entity_type does not default to entity';
}

$legacyFieldPermissions = $connection->query(
    "SELECT COUNT(*) AS total FROM team_role_permission WHERE permission_key IN ("
    . "'team.member_field.write', 'team.entity_field.member.manage', 'team.entity_field.person.manage')"
)[0];
if ((int) $legacyFieldPermissions['total'] !== 0) {
    $errors[] = 'legacy member/person entity field permissions still exist';
}

if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, 'Entity root verification passed (' . array_sum(array_map('count', $references)) . " references)\n");
