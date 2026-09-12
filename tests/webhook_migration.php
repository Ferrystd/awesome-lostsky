<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
(new think\App(dirname(__DIR__)))->initialize();
set_exception_handler(static function (Throwable $e): void { fwrite(STDERR, $e->getMessage() . PHP_EOL); exit(1); });
$db = think\facade\Db::connect();
// Connection-local temporary tables shadow the real names: the exact patch never
// touches application data, even though it contains its own COMMIT.
foreach (['team_virtual_integration', 'chat_webhook_delivery', 'chat_message'] as $table) {
    $schema = $db->query("SHOW CREATE TABLE {$table}")[0]['Create Table'];
    $schema = implode("\n", array_filter(explode("\n", $schema), static fn ($line) => !str_contains($line, 'CONSTRAINT')));
    $schema = preg_replace('/,\s*\)/', ')', $schema);
    $db->execute(str_replace('CREATE TABLE', 'CREATE TEMPORARY TABLE', $schema));
}
try {
    $db->execute("INSERT INTO team_virtual_integration (id, driver, signing_secret, delete_time) VALUES (1,'webhook','legacy',NULL),(2,'webhook','old-deleted',1),(3,'webhook','whsec_new',NULL),(4,'other','legacy',NULL)");
    $db->execute("INSERT INTO chat_webhook_delivery (id,integration_id) VALUES (1,1),(2,2),(3,3),(4,4)");
    $db->execute("INSERT INTO chat_message (id,entity_id,origin_integration_id,content) VALUES (1,1,1,'preserved'),(2,1,3,'standard')");
    $patch = file_get_contents(dirname(__DIR__) . '/sql/patches/20260908_standard_webhooks.sql');
    $patch = preg_replace('/^--.*$/m', '', $patch);
    foreach (explode(';', $patch) as $statement) {
        if (trim($statement) !== '') $db->execute(trim($statement));
    }
    foreach (['team_virtual_integration', 'chat_webhook_delivery'] as $table) {
        $ids = array_map('intval', array_column($db->query("SELECT id FROM {$table} ORDER BY id"), 'id'));
        if ($ids !== [3, 4]) throw new RuntimeException("Migration deletion boundary failed: {$table}");
    }
    $messages = $db->query('SELECT origin_integration_id,content FROM chat_message ORDER BY id');
    if ($messages[0]['origin_integration_id'] !== null || $messages[0]['content'] !== 'preserved' || (int) $messages[1]['origin_integration_id'] !== 3) throw new RuntimeException('Message preservation failed');
    echo "Webhook migration tests passed (temporary tables only).\n";
} finally {
    foreach (['chat_message', 'chat_webhook_delivery', 'team_virtual_integration'] as $table) {
        $db->execute("DROP TEMPORARY TABLE IF EXISTS {$table}");
    }
}
