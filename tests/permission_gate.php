<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\service\PermissionGate;
use app\service\PermissionDictionary;
use app\exception\AccessDeniedException;
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
    ['team.entity.virtual.sales-assistant.manage', 'team.entity.virtual.*.manage'],
    $gate->candidates(
        (new Request)->withPost(['slug' => 'Sales-Assistant']),
        PermissionDictionary::TEAM_ENTITY_VIRTUAL_MANAGE_TEMPLATE
    ),
    'request body slug and wildcard union'
);
$assertThrows(
    fn () => $gate->candidates((new Request)->withRoute(['slug' => 'support_bot']), 'chat.virtual.<slug>.act'),
    500,
    'removed virtual act permission is rejected'
);
$assertSame(
    ['team.entity.virtual.create'],
    $gate->candidates(new Request, 'team.entity.virtual.create'),
    'static permission remains exact'
);
$assertSame(
    [true, true, false],
    [
        PermissionDictionary::isFixedKeyOrParent('team'),
        PermissionDictionary::isFixedKeyOrParent('team.ability'),
        PermissionDictionary::isFixedKeyOrParent('team.unknown'),
    ],
    'only known fixed permission parents can be assigned'
);
$assertSame(
    ['kind' => 'virtual', 'slug' => 'support_bot', 'action' => 'field.manage'],
    PermissionDictionary::dynamicDescendant('team.entity.virtual.support_bot.field'),
    'dynamic permission parents resolve to their leaf permission'
);
$assertSame(
    ['kind' => 'document', 'type' => 'customer', 'slug' => 'customer-one'],
    PermissionDictionary::dynamic('team.document.customer.customer-one.manage'),
    'specific document management permissions resolve their entity type and slug'
);
$assertSame(
    ['kind' => 'document', 'type' => 'member', 'slug' => 'alice'],
    PermissionDictionary::dynamicDescendant('team.document.member.alice'),
    'specific document management parents resolve to their leaf permission'
);
$assertSame(
    ['chat.group.manage', 'team.role.read'],
    $gate->candidates(new Request, 'chat.group.manage,team.role.read'),
    'comma-separated permission arguments form an OR candidate set'
);
$assertSame(
    ['team.entity.virtual.sales-assistant.manage', 'team.entity.virtual.*.manage', 'chat.group.manage'],
    $gate->candidates(
        (new Request)->withPost(['slug' => 'Sales-Assistant']),
        'team.entity.virtual.<slug>.manage',
        'chat.group.manage'
    ),
    'dynamic and static permission arguments share an OR candidate set'
);
$assertSame(
    ['chat.group.manage', 'team.role.read'],
    $gate->candidates(new Request, 'chat.group.manage', 'team.role.read'),
    'array middleware arguments form the same OR candidate set'
);
$assertThrows(
    fn () => $gate->candidates(new Request, 'team.entity.virtual.<slug>.manage'),
    422,
    'missing dynamic parameter'
);
$assertThrows(
    fn () => $gate->candidates(
        (new Request)->withGet(['slug' => 'one'])->withPost(['slug' => 'two']),
        'team.entity.virtual.<slug>.manage'
    ),
    422,
    'conflicting parameter sources'
);
$assertThrows(
    fn () => $gate->candidates((new Request)->withPost(['slug' => '*']), 'team.entity.virtual.<slug>.manage'),
    422,
    'wildcard cannot be submitted as slug'
);
$assertThrows(
    fn () => $gate->candidates(new Request),
    500,
    'permission middleware requires at least one argument'
);
$assertThrows(
    fn () => $gate->candidates(new Request, 'chat.group.manage,,team.role.read'),
    500,
    'empty comma-separated permission argument is rejected'
);
$assertThrows(
    fn () => $gate->assertKey('team.entity.virtual.foo*.manage'),
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
$assertThrows(
    fn () => $gate->assertKey('chat.virtual.create'),
    500,
    'legacy chat virtual keys are not authorization aliases'
);
$assertThrows(
    fn () => $gate->assertKey('identity.virtual.support_bot.act'),
    500,
    'legacy identity virtual act keys are not authorization aliases'
);
$assertThrows(
    fn () => $gate->assertKey('team.entity_field.manage'),
    500,
    'legacy entity field keys are not authorization aliases'
);
$assertSame(
    PermissionDictionary::keys(),
    array_values(array_unique(PermissionDictionary::keys())),
    'fixed dictionary keys are unique'
);
$assertSame(
    PermissionDictionary::adminKeys(),
    array_values(array_unique(PermissionDictionary::adminKeys())),
    'platform administrator dictionary keys are unique'
);
$assertSame(
    [],
    array_values(array_intersect(PermissionDictionary::keys(), PermissionDictionary::adminKeys())),
    'platform administrator permissions are not exposed to team roles'
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
    [PermissionDictionary::TEAM_NOTICE_READ, PermissionDictionary::TEAM_NOTICE_SEND],
    array_values(array_filter(
        PermissionDictionary::keys(),
        static fn (string $key): bool => in_array(
            $key,
            [PermissionDictionary::TEAM_NOTICE_READ, PermissionDictionary::TEAM_NOTICE_SEND],
            true
        )
    )),
    'notice read and send permissions are part of the fixed dictionary'
);
$permissionError = AccessDeniedException::permission([
    PermissionDictionary::TEAM_ENTITY_PROFILE_MANAGE,
]);
$assertSame(
    [
        'kind' => 'permission',
        'required_any' => [PermissionDictionary::TEAM_ENTITY_PROFILE_MANAGE],
    ],
    $permissionError->data(),
    'permission rejection exposes a structured reason'
);
$assertSame(
    ['team.entity.profile.manage'],
    [PermissionDictionary::TEAM_ENTITY_PROFILE_MANAGE],
    'entity profile permission uses the documented dotted key'
);
$assertSame(
    ['team.document.read'],
    [PermissionDictionary::TEAM_DOCUMENT_READ],
    'document read permission uses the documented dotted key'
);
$assertSame(
    [
        'team.document.team.manage',
        'team.document.member.*.manage',
        'team.document.customer.*.manage',
        'team.document.virtual.*.manage',
    ],
    [
        PermissionDictionary::TEAM_DOCUMENT_TEAM_MANAGE,
        PermissionDictionary::TEAM_DOCUMENT_MEMBER_ALL_MANAGE,
        PermissionDictionary::TEAM_DOCUMENT_CUSTOMER_ALL_MANAGE,
        PermissionDictionary::TEAM_DOCUMENT_VIRTUAL_ALL_MANAGE,
    ],
    'document management permissions cover the Team entity and every non-Team entity type'
);
$assertSame(
    [
        'team.document.member.alice.manage',
        'team.document.customer.*.manage',
        'team.document.virtual.helper.manage',
    ],
    [
        PermissionDictionary::documentManage('teamMember', 'alice'),
        PermissionDictionary::documentManage('teamCustomer'),
        PermissionDictionary::documentManage('teamVirtual', 'helper'),
    ],
    'document management candidates use canonical type aliases'
);
$assertSame(
    ['team.customer.read', 'team.customer.manage'],
    [PermissionDictionary::TEAM_CUSTOMER_READ, PermissionDictionary::TEAM_CUSTOMER_MANAGE],
    'customer read and manage permissions use documented dotted keys'
);
$assertSame(
    ['shop.product.self.manage', 'shop.product.self.reprice'],
    [PermissionDictionary::SHOP_PRODUCT_SELF_MANAGE, PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE],
    'self resource management and unified personal repricing use independent documented keys'
);
$assertSame(
    ['service.entitlement.grant'],
    [PermissionDictionary::SERVICE_ENTITLEMENT_GRANT],
    'personal entitlement grants use the documented service permission key'
);
$assertSame(
    ['weibo.personal.use', 'weibo.team.manage'],
    [PermissionDictionary::WEIBO_PERSONAL_USE, PermissionDictionary::WEIBO_TEAM_MANAGE],
    'Weibo personal use and team management permissions use separate documented keys'
);
$assertSame(
    [true, true],
    [
        PermissionDictionary::isFixedKeyOrParent('service'),
        PermissionDictionary::isFixedKeyOrParent('service.entitlement'),
    ],
    'service parent segments cover the entitlement grant permission'
);
$entitlementGrantPatch = (string) file_get_contents(
    dirname(__DIR__) . '/sql/patches/20260813_service_entitlement_grant_permission.sql'
);
$assertSame(
    [true, true],
    [
        str_contains($entitlementGrantPatch, "'service.entitlement.grant'"),
        str_contains($entitlementGrantPatch, "`role`.`role_key` = 'owner'"),
    ],
    'existing owner roles receive the personal entitlement grant permission'
);
$documentManagePatch = (string) file_get_contents(
    dirname(__DIR__) . '/sql/patches/20260905_team_document_manage_permissions.sql'
);
$assertSame(
    [true, true, true, true, true],
    [
        str_contains($documentManagePatch, "'team.document.team.manage'"),
        str_contains($documentManagePatch, "'team.document.member.*.manage'"),
        str_contains($documentManagePatch, "'team.document.customer.*.manage'"),
        str_contains($documentManagePatch, "'team.document.virtual.*.manage'"),
        str_contains($documentManagePatch, "`role`.`role_key` = 'owner'"),
    ],
    'existing owner roles receive every document management permission'
);
$assertSame(
    [true, true, true],
    [
        PermissionDictionary::isFixedKeyOrParent('shop'),
        PermissionDictionary::isFixedKeyOrParent('shop.product'),
        PermissionDictionary::isFixedKeyOrParent('shop.product.self'),
    ],
    'shop parent segments are recognized for hierarchical self-management grants'
);
$abilityError = AccessDeniedException::ability('file', '文件上传');
$assertSame(
    [
        'kind' => 'ability',
        'key' => 'file',
        'label' => '文件上传',
        'minimum_level' => 1,
        'reason' => 'missing',
    ],
    $abilityError->data(),
    'ability rejection exposes a structured reason'
);

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "PermissionGate tests passed." . PHP_EOL);
