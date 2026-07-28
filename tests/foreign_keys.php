<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Team;
use think\App;

(new App(dirname(__DIR__)))->initialize();

$patch = file_get_contents(dirname(__DIR__) . '/sql/patches/20260724_foreign_keys.sql')
    . PHP_EOL
    . file_get_contents(dirname(__DIR__) . '/sql/patches/20260726_entity_delegation.sql')
    . PHP_EOL
    . file_get_contents(dirname(__DIR__) . '/sql/patches/20260726_entity_root.sql')
    . PHP_EOL
    . file_get_contents(dirname(__DIR__) . '/sql/patches/20260726_document_entity.sql')
    . PHP_EOL
    . file_get_contents(dirname(__DIR__) . '/sql/patches/20260726_business_audit.sql')
    . PHP_EOL
    . file_get_contents(dirname(__DIR__) . '/sql/patches/20260726_member_field_to_entity.sql')
    . PHP_EOL
    . file_get_contents(dirname(__DIR__) . '/sql/patches/20260727_entity_profile_post.sql');
preg_match_all(
    '/ALTER TABLE `([^`]+)`\s+(.*?);/s',
    (string) $patch,
    $tables,
    PREG_SET_ORDER
);

$connection = (new Team)->db()->getConnection();
$errors = [];
$expected = 0;
$superseded = [
    'fk_file_member',
    'fk_markdown_identity',
    'fk_member_profile_member',
    'fk_member_post_member',
    'fk_transaction_sender',
    'fk_transaction_cs',
    'fk_customer_sender_member',
    'fk_product_member',
    'fk_product_handler_member',
    'fk_order_sender',
    'fk_member_field_value_member',
    'fk_member_field_team',
    'fk_member_field_value_field',
    'fk_member_field_value_entity',
    'fk_join_application_member',
    'fk_join_field_member_field',
    'fk_team_profile_team',
    'fk_customer_profile_customer',
    'fk_member_profile_entity',
    'fk_member_post_entity',
    'fk_member_post_type',
    'fk_post_type_team',
];

foreach ($tables as $tableMatch) {
    $table = $tableMatch[1];
    preg_match_all(
        '/ADD CONSTRAINT `([^`]+)` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/',
        $tableMatch[2],
        $constraints,
        PREG_SET_ORDER
    );

    foreach ($constraints as $constraint) {
        [, $name, $column, $parent, $parentColumn] = $constraint;
        if (in_array($name, $superseded, true)) {
            continue;
        }
        $expected++;
        $extra = $table === 'team_customer_balance_log' && $column === 'trans_id'
            ? " AND child.`trans_id` <> 0"
            : '';
        $row = $connection->query(
            "SELECT COUNT(*) AS total
             FROM `{$table}` AS child
             LEFT JOIN `{$parent}` AS parent
               ON parent.`{$parentColumn}` = child.`{$column}`
             WHERE child.`{$column}` IS NOT NULL
               AND parent.`{$parentColumn}` IS NULL{$extra}"
        )[0];
        if ((int) $row['total'] !== 0) {
            $errors[] = "{$name}: {$row['total']} orphan rows";
        }

        if (($argv[1] ?? '') !== '--preflight') {
            $exists = $connection->query(
                'SELECT COUNT(*) AS total FROM information_schema.referential_constraints '
                . 'WHERE constraint_schema = DATABASE() AND constraint_name = :name',
                ['name' => $name]
            )[0];
            if ((int) $exists['total'] !== 1) {
                $errors[] = "{$name}: constraint missing";
            }
        }
    }
}

$refreshConstraints = [
    ['fk_refresh_user', 'user_refresh_token', 'user_id', 'user', 'id'],
    ['fk_refresh_device', 'user_refresh_token', 'device_id', 'user_device', 'id'],
];
foreach ($refreshConstraints as [$name, $table, $column, $parent, $parentColumn]) {
    $expected++;
    $row = $connection->query(
        "SELECT COUNT(*) AS total
         FROM `{$table}` AS child
         LEFT JOIN `{$parent}` AS parent
           ON parent.`{$parentColumn}` = child.`{$column}`
         WHERE parent.`{$parentColumn}` IS NULL"
    )[0];
    if ((int) $row['total'] !== 0) {
        $errors[] = "{$name}: {$row['total']} orphan rows";
    }

    if (($argv[1] ?? '') !== '--preflight') {
        $exists = $connection->query(
            'SELECT COUNT(*) AS total FROM information_schema.referential_constraints '
            . 'WHERE constraint_schema = DATABASE() AND constraint_name = :name',
            ['name' => $name]
        )[0];
        if ((int) $exists['total'] !== 1) {
            $errors[] = "{$name}: constraint missing";
        }
    }
}

if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Foreign key verification passed ({$expected} constraints)\n");
