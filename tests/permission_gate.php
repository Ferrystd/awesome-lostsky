<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\service\PermissionGate;
use app\service\PermissionDictionary;
use think\exception\HttpException;
use think\Request;

$gate = new PermissionGate;
$failures = [];

$assertSame = static function (array $expected, array $actual, string $case) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = "{$case}: expected " . json_encode($expected) . ', got ' . json_encode($actual);
    }
};
$assertThrows = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HttpException {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: expected {$status}, got {$exception->getStatusCode()}";
        }
    }
};

$assertSame(
    ['chat.virtual.sales-assistant.manage', 'chat.virtual.*.manage'],
    $gate->candidates(
        (new Request)->withPost(['slug' => 'Sales-Assistant']),
        PermissionDictionary::CHAT_VIRTUAL_MANAGE_TEMPLATE
    ),
    'request body slug and wildcard union'
);
$assertSame(
    ['chat.virtual.support_bot.operate', 'chat.virtual.*.operate'],
    $gate->candidates((new Request)->withRoute(['slug' => 'support_bot']), 'chat.virtual.<slug>.operate'),
    'route slug and wildcard union'
);
$assertSame(
    ['chat.virtual.create'],
    $gate->candidates(new Request, 'chat.virtual.create'),
    'static permission remains exact'
);
$assertSame(
    ['chat.group.manage', 'chat.message.moderate'],
    $gate->candidates(new Request, 'chat.group.manage,chat.message.moderate'),
    'comma-separated permission arguments form an OR candidate set'
);
$assertSame(
    ['chat.virtual.sales-assistant.manage', 'chat.virtual.*.manage', 'chat.group.manage'],
    $gate->candidates(
        (new Request)->withPost(['slug' => 'Sales-Assistant']),
        'chat.virtual.<slug>.manage',
        'chat.group.manage'
    ),
    'dynamic and static permission arguments share an OR candidate set'
);
$assertSame(
    ['chat.group.manage', 'chat.message.moderate'],
    $gate->candidates(new Request, 'chat.group.manage', 'chat.message.moderate'),
    'array middleware arguments form the same OR candidate set'
);
$assertThrows(
    fn () => $gate->candidates(new Request, 'chat.virtual.<slug>.manage'),
    422,
    'missing dynamic parameter'
);
$assertThrows(
    fn () => $gate->candidates(
        (new Request)->withGet(['slug' => 'one'])->withPost(['slug' => 'two']),
        'chat.virtual.<slug>.manage'
    ),
    422,
    'conflicting parameter sources'
);
$assertThrows(
    fn () => $gate->candidates((new Request)->withPost(['slug' => '*']), 'chat.virtual.<slug>.manage'),
    422,
    'wildcard cannot be submitted as slug'
);
$assertThrows(
    fn () => $gate->candidates(new Request),
    500,
    'permission middleware requires at least one argument'
);
$assertThrows(
    fn () => $gate->candidates(new Request, 'chat.group.manage,,chat.message.moderate'),
    500,
    'empty comma-separated permission argument is rejected'
);
$assertThrows(
    fn () => $gate->assertKey('chat.virtual.foo*.manage'),
    500,
    'partial wildcard is rejected'
);
$assertThrows(
    fn () => $gate->assertKey('chat.*.*.manage'),
    500,
    'multiple wildcard segments are rejected'
);
$assertThrows(
    fn () => $gate->assertKey('team.unknown.read'),
    500,
    'syntactically valid keys outside the dictionary are rejected'
);
$assertSame(
    PermissionDictionary::keys(),
    array_values(array_unique(PermissionDictionary::keys())),
    'fixed dictionary keys are unique'
);
$assertSame(
    ['chat.virtual.support_bot.operate'],
    [PermissionDictionary::virtual('support_bot', 'operate')],
    'dynamic virtual keys are built by the dictionary'
);
$assertSame(
    [PermissionDictionary::TEAM_ENTITY_FIELD_MANAGE],
    [PermissionDictionary::entityField('entity')],
    'person-facing fields use the canonical entity permission'
);
$assertSame(
    [PermissionDictionary::TEAM_ENTITY_FIELD_CUSTOMER_MANAGE],
    [PermissionDictionary::entityField('customer')],
    'customer fields use the customer entity permission'
);
$assertSame(
    [PermissionDictionary::TEAM_NOTICE_SEND],
    array_values(array_filter(
        PermissionDictionary::keys(),
        static fn (string $key): bool => $key === PermissionDictionary::TEAM_NOTICE_SEND
    )),
    'notice send permission is part of the fixed dictionary'
);

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "PermissionGate tests passed." . PHP_EOL);
