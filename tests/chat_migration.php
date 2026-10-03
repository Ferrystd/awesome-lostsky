<?php
declare(strict_types=1);

use app\service\ChatMigration;
use think\facade\Db;

require dirname(__DIR__) . '/vendor/autoload.php';
(new think\App(dirname(__DIR__)))->initialize();
set_exception_handler(static function (Throwable $exception): void {
    fwrite(STDERR, $exception->getMessage() . PHP_EOL);
    exit(1);
});

$db = Db::connect();
$tables = [
    'chat_webhook_delivery', 'chat_event_outbox', 'chat_message', 'chat_participant',
    'chat_entity_block', 'chat_conversation_alias', 'chat_conversation', 'team_role_permission', 'entity', 'team',
];
$assert = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};

$definitions = [
    'team' => <<<'SQL'
CREATE TEMPORARY TABLE team (
 id INT UNSIGNED NOT NULL PRIMARY KEY, delete_time INT UNSIGNED NULL
) ENGINE=InnoDB
SQL,
    'entity' => <<<'SQL'
CREATE TEMPORARY TABLE entity (
 id INT UNSIGNED NOT NULL PRIMARY KEY, delete_time INT UNSIGNED NULL
) ENGINE=InnoDB
SQL,
    'chat_conversation' => <<<'SQL'
CREATE TEMPORARY TABLE chat_conversation (
 id BIGINT UNSIGNED NOT NULL PRIMARY KEY, team_id INT UNSIGNED NULL, uuid CHAR(36) NOT NULL,
 kind VARCHAR(20) NOT NULL, title VARCHAR(100) NULL, direct_key CHAR(64) NULL,
 is_temporary TINYINT NOT NULL DEFAULT 0, entity_id INT UNSIGNED NOT NULL,
 last_message_id BIGINT UNSIGNED NULL, last_message_at INT UNSIGNED NULL,
 expires_at INT UNSIGNED NULL, closed_at INT UNSIGNED NULL,
 create_time INT UNSIGNED NOT NULL, update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL,
 UNIQUE KEY uk_uuid (uuid), UNIQUE KEY uk_direct_key (direct_key)
) ENGINE=InnoDB
SQL,
    'chat_conversation_alias' => <<<'SQL'
CREATE TEMPORARY TABLE chat_conversation_alias (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, alias_uuid CHAR(36) NOT NULL,
 conversation_id BIGINT UNSIGNED NOT NULL, create_time INT UNSIGNED NOT NULL,
 update_time INT UNSIGNED NOT NULL, UNIQUE KEY uk_alias (alias_uuid)
) ENGINE=InnoDB
SQL,
    'chat_entity_block' => <<<'SQL'
CREATE TEMPORARY TABLE chat_entity_block (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 blocker_entity_id INT UNSIGNED NOT NULL, blocked_entity_id INT UNSIGNED NOT NULL,
 create_time INT UNSIGNED NOT NULL, update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL,
 UNIQUE KEY uk_block (blocker_entity_id, blocked_entity_id)
) ENGINE=InnoDB
SQL,
    'chat_participant' => <<<'SQL'
CREATE TEMPORARY TABLE chat_participant (
 id BIGINT UNSIGNED NOT NULL PRIMARY KEY, team_id INT UNSIGNED NULL,
 conversation_id BIGINT UNSIGNED NOT NULL, entity_id INT UNSIGNED NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'active', invited_by_entity_id INT UNSIGNED NULL,
 invited_at INT UNSIGNED NULL, responded_at INT UNSIGNED NULL, joined_at INT UNSIGNED NOT NULL,
 left_at INT UNSIGNED NULL, last_read_message_id BIGINT UNSIGNED NULL,
 create_time INT UNSIGNED NOT NULL, update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL,
 UNIQUE KEY uk_conversation_entity (conversation_id, entity_id)
) ENGINE=InnoDB
SQL,
    'chat_message' => <<<'SQL'
CREATE TEMPORARY TABLE chat_message (
 id BIGINT UNSIGNED NOT NULL PRIMARY KEY, team_id INT UNSIGNED NULL,
 conversation_id BIGINT UNSIGNED NOT NULL, entity_id INT UNSIGNED NOT NULL,
 reply_id BIGINT UNSIGNED NULL, origin_integration_id INT UNSIGNED NULL, content TEXT NULL,
 edited_at INT UNSIGNED NULL, revoked_at INT UNSIGNED NULL,
 create_time INT UNSIGNED NOT NULL, update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL
) ENGINE=InnoDB
SQL,
    'chat_event_outbox' => <<<'SQL'
CREATE TEMPORARY TABLE chat_event_outbox (
 id BIGINT UNSIGNED NOT NULL PRIMARY KEY, team_id INT UNSIGNED NULL, event_type VARCHAR(50) NOT NULL,
 aggregate_type VARCHAR(30) NOT NULL, aggregate_id BIGINT UNSIGNED NOT NULL, payload JSON NOT NULL,
 attempts INT UNSIGNED NOT NULL DEFAULT 0, available_at INT UNSIGNED NOT NULL DEFAULT 0,
 processing_token CHAR(32) NULL, processing_until INT UNSIGNED NULL, published_at INT UNSIGNED NULL,
 last_error VARCHAR(1000) NULL, create_time INT UNSIGNED NOT NULL,
 update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL
) ENGINE=InnoDB
SQL,
    'chat_webhook_delivery' => <<<'SQL'
CREATE TEMPORARY TABLE chat_webhook_delivery (
 id BIGINT UNSIGNED NOT NULL PRIMARY KEY, team_id INT UNSIGNED NOT NULL,
 outbox_id BIGINT UNSIGNED NOT NULL, integration_id INT UNSIGNED NOT NULL,
 status VARCHAR(20) NOT NULL, attempts INT UNSIGNED NOT NULL DEFAULT 0,
 available_at INT UNSIGNED NOT NULL DEFAULT 0, processing_token CHAR(32) NULL,
 processing_until INT UNSIGNED NULL, delivered_at INT UNSIGNED NULL,
 response_code SMALLINT UNSIGNED NULL, last_error VARCHAR(1000) NULL,
 create_time INT UNSIGNED NOT NULL, update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL
) ENGINE=InnoDB
SQL,
    'team_role_permission' => <<<'SQL'
CREATE TEMPORARY TABLE team_role_permission (
 id INT UNSIGNED NOT NULL PRIMARY KEY, team_id INT UNSIGNED NOT NULL,
 role_id INT UNSIGNED NOT NULL, permission_key VARCHAR(100) NOT NULL,
 create_time INT UNSIGNED NOT NULL, update_time INT UNSIGNED NOT NULL, delete_time INT UNSIGNED NULL
) ENGINE=InnoDB
SQL,
];

try {
    foreach ($definitions as $sql) {
        $db->execute($sql);
    }
    $db->execute('ALTER TABLE chat_participant DROP COLUMN status, DROP COLUMN invited_by_entity_id, DROP COLUMN invited_at, DROP COLUMN responded_at');
    $migration = new ChatMigration($db);
    $oldSchema = $migration->inspect();
    $assert($oldSchema['schema_ready'] === false, '旧结构 dry-run 未报告 schema_ready=false');
    $assert(in_array('column:chat_participant.status', $oldSchema['schema_missing'], true), '旧结构 dry-run 未列出缺失字段');
    $applyRejected = false;
    try {
        $migration->apply();
    } catch (RuntimeException $exception) {
        $applyRejected = str_contains($exception->getMessage(), '结构补丁');
    }
    $assert($applyRejected, '旧结构允许执行 apply');
    $db->execute("ALTER TABLE chat_participant
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER entity_id,
        ADD COLUMN invited_by_entity_id INT UNSIGNED NULL AFTER status,
        ADD COLUMN invited_at INT UNSIGNED NULL AFTER invited_by_entity_id,
        ADD COLUMN responded_at INT UNSIGNED NULL AFTER invited_at");
    $db->execute('INSERT INTO team VALUES (1,NULL),(2,NULL)');
    $db->execute('INSERT INTO entity VALUES (11,NULL),(22,NULL),(33,NULL)');
    $db->execute("INSERT INTO chat_conversation VALUES
        (101,1,'00000000-0000-0000-0000-000000000101','direct',NULL,'old-team-1',0,11,NULL,NULL,NULL,NULL,10,30,NULL),
        (102,2,'00000000-0000-0000-0000-000000000102','direct',NULL,'old-team-2',0,22,1002,200,NULL,220,20,40,240),
        (103,1,'00000000-0000-0000-0000-000000000103','direct',NULL,NULL,1,11,1003,300,400,NULL,30,50,NULL),
        (104,1,'00000000-0000-0000-0000-000000000104','group','group',NULL,0,11,NULL,NULL,NULL,NULL,40,60,NULL)");
    $db->execute("INSERT INTO chat_participant VALUES
        (201,1,101,11,'active',NULL,NULL,NULL,10,150,1001,10,30,NULL),
        (202,1,101,22,'active',NULL,NULL,NULL,10,NULL,1001,10,30,NULL),
        (203,2,102,11,'pending',22,20,NULL,20,NULL,1004,20,40,NULL),
        (204,2,102,22,'active',NULL,NULL,NULL,20,230,1002,20,40,240),
        (205,1,103,11,'active',NULL,NULL,NULL,30,NULL,1003,30,50,NULL),
        (206,1,103,22,'active',NULL,NULL,NULL,30,NULL,NULL,30,50,NULL),
        (207,1,104,11,'active',NULL,NULL,NULL,40,NULL,NULL,40,60,NULL),
        (208,1,104,22,'pending',11,40,NULL,0,NULL,NULL,40,60,NULL),
        (209,1,104,33,'active',NULL,NULL,NULL,60,NULL,NULL,60,60,NULL)");
    $db->execute("INSERT INTO chat_message VALUES
        (1001,1,101,11,NULL,NULL,'first',NULL,NULL,100,101,NULL),
        (1002,2,102,22,1001,77,'second',180,NULL,200,201,NULL),
        (1004,2,102,11,NULL,NULL,'soft deleted latest',NULL,NULL,250,251,260),
        (1003,1,103,11,NULL,NULL,'temporary',NULL,NULL,300,301,NULL)");
    $db->execute("INSERT INTO chat_event_outbox VALUES
        (2001,2,'message.created','message',1002,JSON_OBJECT('conversation','00000000-0000-0000-0000-000000000102'),0,0,NULL,NULL,NULL,NULL,200,200,NULL),
        (2002,2,'conversation.closed','conversation',102,JSON_OBJECT('conversation','00000000-0000-0000-0000-000000000102'),0,0,NULL,NULL,250,NULL,220,220,NULL),
        (2003,1,'message.created','message',1003,JSON_OBJECT('conversation','00000000-0000-0000-0000-000000000103'),0,0,NULL,NULL,NULL,NULL,300,300,NULL),
        (2004,1,'conversation.updated','conversation',104,JSON_OBJECT('conversation','00000000-0000-0000-0000-000000000104'),0,0,NULL,NULL,NULL,NULL,50,50,NULL),
        (2005,1,'conversation.updated','conversation',104,JSON_OBJECT('conversation','00000000-0000-0000-0000-000000000104','recipient_entity_ids',JSON_ARRAY(999)),0,0,NULL,NULL,NULL,NULL,70,70,NULL),
        (2006,1,'conversation.updated','conversation',104,JSON_OBJECT('conversation','00000000-0000-0000-0000-000000000104'),0,0,NULL,NULL,80,NULL,80,80,NULL)");
    $db->execute("INSERT INTO chat_webhook_delivery VALUES
        (3001,2,2002,77,'pending',0,0,NULL,NULL,NULL,NULL,NULL,200,200,NULL)");
    $db->execute("INSERT INTO team_role_permission VALUES
        (1,1,1,'chat.virtual.*.act',1,1,NULL),
        (2,1,1,'chat.virtual.support_bot.act',1,1,NULL),
        (3,1,1,'identity.virtual.*.assume',1,1,NULL),
        (4,1,1,'chat.group.manage',1,1,NULL),
        (5,1,1,'chat.conversation.create',1,1,NULL),
        (6,1,1,'chat.temporary.create',1,1,NULL),
        (7,1,1,'chat.message.moderate',1,1,NULL),
        (8,1,1,'chat.virtual',1,1,NULL),
        (9,1,1,'chat.virtual.support_bot',1,1,NULL),
        (10,1,1,'chat.virtual.*',1,1,NULL),
        (11,1,1,'chat',1,1,NULL)");

    $dryRun = $migration->inspect();
    $assert($dryRun['duplicate_direct_sets'] === 1, 'dry-run 未识别重复单聊');
    $assert($dryRun['conversations_to_merge'] === 1, 'dry-run 归并数量错误');
    $assert($dryRun['aliases_to_create'] === 1, 'dry-run 别名数量错误');
    $assert($dryRun['inactive_direct_participants'] === [], '有效参与实体被误报失效');
    $assert($dryRun['legacy_chat_permissions_to_delete'] === 8, 'dry-run 权限清理数量错误');
    $assert($dryRun['outbox_recipient_snapshots_to_backfill'] === 4, 'dry-run 事件接收者快照数量错误');

    $result = $migration->apply();
    $assert($result['applied']['conversations_merged'] === 1, 'apply 结果未报告归并');
    $assert($result['applied']['outbox_recipient_snapshots_backfilled'] === 4, 'apply 未补齐事件接收者快照');
    $canonical = $db->table('chat_conversation')->where('id', 101)->find();
    $assert($canonical !== null && $canonical['team_id'] === null, 'canonical 单聊仍携带 team_id');
    $assert($canonical['direct_key'] === hash('sha256', '11|22'), 'direct_key 未按 Entity 对重算');
    $assert($canonical['closed_at'] === null && $canonical['delete_time'] === null, '活跃会话语义未保留');
    $assert((int) $canonical['last_message_id'] === 1002 && (int) $canonical['last_message_at'] === 200, '最后消息未重算');
    $assert($db->table('chat_conversation')->where('id', 102)->count() === 0, '重复会话未移除');
    $assert((int) $db->table('chat_conversation_alias')->where('alias_uuid', '00000000-0000-0000-0000-000000000102')->value('conversation_id') === 101, '旧 UUID 别名错误');

    $messages = $db->table('chat_message')->whereIn('id', [1001, 1002])->order('id')->select()->toArray();
    $assert(count($messages) === 2, '有效消息数量发生变化');
    $assert((int) $messages[1]['conversation_id'] === 101 && (int) $messages[1]['entity_id'] === 22, '消息归属或作者丢失');
    $assert((int) $messages[1]['reply_id'] === 1001 && (int) $messages[1]['create_time'] === 200, '消息回复或时间丢失');
    $assert($db->table('chat_message')->where('conversation_id', 101)->count() === 3, '软删除消息未随会话保留');
    $assert((int) $db->table('chat_message')->where('id', 1004)->value('delete_time') === 260, '消息软删除状态丢失');
    $participants = $db->table('chat_participant')->where('conversation_id', 101)->order('entity_id')->select()->toArray();
    $assert(count($participants) === 2, '参与者未按 Entity 合并');
    $assert((int) $participants[0]['last_read_message_id'] === 1001, '已读位置引用了软删除消息');
    $assert((int) $participants[1]['last_read_message_id'] === 1002, '已读位置未取有效最大值');
    $assert($participants[0]['status'] === 'pending' && $participants[0]['left_at'] === null, '参与状态由不同旧记录拼接并错误复活');
    $assert($participants[1]['left_at'] === null && $participants[1]['delete_time'] === null, '有效参与状态未保留');

    foreach ([2001, 2002] as $eventId) {
        $event = $db->table('chat_event_outbox')->where('id', $eventId)->find();
        $payload = json_decode((string) $event['payload'], true, 512, JSON_THROW_ON_ERROR);
        $assert($event['team_id'] === null, "事件 {$eventId} 仍携带 team_id");
        $assert($payload['conversation'] === '00000000-0000-0000-0000-000000000101', "事件 {$eventId} UUID 未改写");
        $assert($payload['recipient_entity_ids'] === [22], "事件 {$eventId} 接收者快照错误");
    }
    $assert((int) $db->table('chat_event_outbox')->where('id', 2002)->value('aggregate_id') === 101, '会话事件聚合对象未归并');
    $delivery = $db->table('chat_webhook_delivery')->where('id', 3001)->find();
    $assert((int) $delivery['outbox_id'] === 2002 && (int) $delivery['team_id'] === 2, 'Webhook 投递关联或所属团队被破坏');
    $temporaryPayload = json_decode((string) $db->table('chat_event_outbox')->where('id', 2003)->value('payload'), true, 512, JSON_THROW_ON_ERROR);
    $groupPayload = json_decode((string) $db->table('chat_event_outbox')->where('id', 2004)->value('payload'), true, 512, JSON_THROW_ON_ERROR);
    $preservedPayload = json_decode((string) $db->table('chat_event_outbox')->where('id', 2005)->value('payload'), true, 512, JSON_THROW_ON_ERROR);
    $untouchedPayload = json_decode((string) $db->table('chat_event_outbox')->where('id', 2006)->value('payload'), true, 512, JSON_THROW_ON_ERROR);
    $assert($temporaryPayload['recipient_entity_ids'] === [11, 22], '临时单聊事件快照错误');
    $assert($groupPayload['recipient_entity_ids'] === [11], '群聊快照包含待接受或事后加入者');
    $assert($preservedPayload['recipient_entity_ids'] === [999], '已有接收者快照被覆盖');
    $assert(!array_key_exists('recipient_entity_ids', $untouchedPayload), '无待处理投递的已发布事件被改写');
    $temporary = $db->table('chat_conversation')->where('id', 103)->find();
    $assert($temporary['team_id'] === null && $temporary['direct_key'] === null && (int) $temporary['expires_at'] === 400, '临时会话语义未保留');
    $assert((int) $db->table('chat_conversation')->where('id', 104)->value('team_id') === 1, '群聊所属团队被修改');
    $permissions = $db->table('team_role_permission')->order('id')->column('permission_key');
    $assert($permissions === ['identity.virtual.*.assume', 'chat.group.manage', 'chat'], '权限清理越界或不完整');

    $second = $migration->apply();
    $assert($second['applied']['conversations_merged'] === 0 && $second['aliases_to_create'] === 0, '迁移不能安全重复执行');
    $db->table('chat_conversation')->insert([
        'id' => 105, 'team_id' => 1, 'uuid' => '00000000-0000-0000-0000-000000000105',
        'kind' => 'direct', 'direct_key' => 'invalid', 'is_temporary' => 0, 'entity_id' => 11,
        'create_time' => 1, 'update_time' => 1,
    ]);
    $db->table('chat_participant')->insert([
        'id' => 210, 'team_id' => 1, 'conversation_id' => 105, 'entity_id' => 11,
        'status' => 'active', 'joined_at' => 1, 'create_time' => 1, 'update_time' => 1,
    ]);
    $rejected = false;
    try {
        $migration->apply();
    } catch (RuntimeException $exception) {
        $rejected = str_contains($exception->getMessage(), '恰好两个');
    }
    $assert($rejected, '异常永久单聊未阻止 apply');
    echo "Chat teamless migration tests passed (temporary tables only).\n";
} finally {
    foreach ($tables as $table) {
        $db->execute("DROP TEMPORARY TABLE IF EXISTS {$table}");
    }
}
