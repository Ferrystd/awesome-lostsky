<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\ChatMessage;
use app\model\EntityIdentity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamCustomerProfile;
use app\model\TeamMember;
use app\model\TeamMemberProfile;
use app\model\TeamMemberRole;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamVirtual;
use app\service\ChatActor;
use app\service\ChatConversation;
use app\service\ChatMessage as ChatMessageService;
use app\service\ChatVirtual;
use app\service\EntityIdentity as EntityIdentityService;
use app\service\PermissionGate;
use app\service\RolePermission;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

set_exception_handler(static function (Throwable $exception): void {
    fwrite(
        STDERR,
        $exception::class . ': ' . $exception->getMessage()
            . " at {$exception->getFile()}:{$exception->getLine()}" . PHP_EOL
            . $exception->getTraceAsString() . PHP_EOL
    );
    exit(1);
});

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertSame = static function (mixed $expected, mixed $actual, string $case) use (&$failures): void {
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
    } catch (Throwable $exception) {
        $failures[] = "{$case}: expected HttpException {$status}, got " . $exception::class;
    }
};

$suffix = bin2hex(random_bytes(6));
$db = app()->db;
$db->startTrans();
try {
    $team = new Team;
    $team->save([
        'slug' => "chat-test-{$suffix}",
        'display_name' => 'Chat Test',
        'user_id' => 910001,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    $foreignTeam = new Team;
    $foreignTeam->save([
        'slug' => "chat-foreign-{$suffix}",
        'display_name' => 'Chat Foreign',
        'user_id' => 910002,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);

    $member = new TeamMember;
    $member->save([
        'team_id' => $team->id,
        'user_id' => $team->user_id,
        'is_displayed' => 1,
        'is_blocked' => 0,
    ]);
    $memberProfile = new TeamMemberProfile;
    $memberProfile->save([
        'member_id' => $member->id,
        'nickname' => 'Chat Member',
        'avatar' => '',
    ]);
    $memberSlug = "chat-member-{$suffix}";
    app(EntityIdentityService::class)->claimMember((int) $member->id, $memberSlug);

    $hiddenMember = new TeamMember;
    $hiddenMember->save([
        'team_id' => $team->id,
        'user_id' => 910004,
        'is_displayed' => 0,
        'is_blocked' => 0,
    ]);
    $hiddenMemberSlug = "chat-hidden-{$suffix}";
    app(EntityIdentityService::class)->claimMember((int) $hiddenMember->id, $hiddenMemberSlug);

    $customer = new TeamCustomer;
    $customer->save([
        'team_id' => $team->id,
        'user_id' => 910003,
        'is_blocked' => 0,
    ]);
    $customerProfile = new TeamCustomerProfile;
    $customerProfile->save([
        'customer_id' => $customer->id,
        'nickname' => 'Chat Customer',
    ]);
    $customerSlug = "chat-customer-{$suffix}";
    app(EntityIdentityService::class)->claimCustomer((int) $customer->id, $customerSlug);
    $identityFixtureCount = EntityIdentity::whereIn('slug', [$memberSlug, $customerSlug])->count();
    if ($identityFixtureCount !== 2) {
        throw new RuntimeException("member/customer identity count is {$identityFixtureCount}");
    }

    $role = new TeamRole;
    $role->save([
        'team_id' => $team->id,
        'role_key' => "chat-test-{$suffix}",
        'name' => 'Chat Test Role',
        'sort' => 0,
    ]);
    $memberRole = new TeamMemberRole;
    $memberRole->save([
        'team_id' => $team->id,
        'member_id' => $member->id,
        'role_id' => $role->id,
    ]);

    $gate = app(PermissionGate::class);
    $assert(
        !$gate->allows((int) $team->id, (int) $member->id, ['chat.conversation.create']),
        'team creator does not bypass role permissions'
    );

    $permissions = app(RolePermission::class);
    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.group.manage',
    ]);

    $virtualSlug = "chat-virtual-{$suffix}";
    $virtualCreated = app(ChatVirtual::class)->create((int) $team->id, [
        'slug' => $virtualSlug,
        'name' => 'Chat Virtual',
    ]);
    $virtualCandidates = [
        "chat.virtual.{$virtualSlug}.operate",
        'chat.virtual.*.operate',
    ];
    $virtualIdentity = EntityIdentity::where('slug', $virtualSlug)->find();
    $virtualModel = $virtualIdentity
        ? TeamVirtual::where('team_id', $team->id)->find($virtualIdentity->entityable_id)
        : null;
    if (!$virtualIdentity || !$virtualModel) {
        throw new RuntimeException(
            'created virtual entity or identity cannot be resolved'
                . '; identity=' . ($virtualIdentity ? 'yes' : 'no')
                . '; virtual=' . ($virtualModel ? 'yes' : 'no')
                . '; virtual_count=' . TeamVirtual::where('team_id', $team->id)->count()
                . '; identity_count=' . EntityIdentity::where('slug', $virtualSlug)->count()
                . '; identity_with_trashed=' . EntityIdentity::withTrashed()
                    ->where('slug', $virtualSlug)->count()
                . '; virtual_identity_total=' . EntityIdentity::withTrashed()
                    ->where('entityable_type', 'teamVirtual')->count()
                . '; returned_slug=' . json_encode($virtualCreated['slug'] ?? null)
        );
    }
    $assert(
        !$gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'virtual access is denied when neither permission exists'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        "chat.virtual.{$virtualSlug}.operate",
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'specific virtual permission grants access'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.virtual.*.operate',
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'wildcard virtual permission grants access'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.virtual.*.operate',
        "chat.virtual.{$virtualSlug}.operate",
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, $virtualCandidates),
        'wildcard and specific permissions are additive'
    );

    $newVirtualSlug = "chat-new-{$suffix}";
    app(ChatVirtual::class)->create((int) $team->id, [
        'slug' => $newVirtualSlug,
        'name' => 'New Chat Virtual',
    ]);
    $assert(
        $gate->allows((int) $team->id, (int) $member->id, [
            "chat.virtual.{$newVirtualSlug}.operate",
            'chat.virtual.*.operate',
        ]),
        'new virtual entity inherits existing wildcard permission'
    );

    $assertThrows(
        fn () => app(ChatActor::class)->resolve((int) $foreignTeam->id, $virtualSlug),
        404,
        'virtual slug cannot be forged across teams'
    );
    $assertThrows(
        fn () => app(\app\service\ChatIntegration::class)
            ->endpointResolution('https://127.0.0.1/webhook'),
        422,
        'webhook endpoint cannot target a private or reserved address'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ['chat.virtual.foo*.operate']),
        422,
        'partial wildcard permission is rejected'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ['chat.virtual.{slug}.operate']),
        422,
        'permission templates cannot be persisted'
    );
    $assertThrows(
        fn () => $permissions->save((int) $team->id, (int) $role->id, ['chat.virtual.missing.operate']),
        422,
        'permission for a missing team virtual is rejected'
    );

    $entityFields = app(\app\service\TeamEntityField::class);
    $entityFields->create((int) $team->id, [
        'entity_type' => 'member',
        'field_key' => "chat_note_{$suffix}",
        'name' => 'Chat Note',
        'value_type' => 'string',
        'input_type' => 'text',
        'options' => null,
        'is_required' => 0,
        'is_editable' => 1,
        'is_searchable' => 0,
        'is_visible' => 0,
        'sort' => 0,
    ]);
    $selectFieldKey = "chat_select_{$suffix}";
    $entityFields->create((int) $team->id, [
        'entity_type' => 'member',
        'field_key' => $selectFieldKey,
        'name' => 'Chat Select',
        'value_type' => 'select',
        'input_type' => 'select',
        'options' => ['alpha', 'beta'],
        'is_required' => 1,
        'is_editable' => 1,
        'is_searchable' => 0,
        'is_visible' => 0,
        'sort' => 0,
    ]);
    $selectField = \app\model\TeamEntityField::where('team_id', $team->id)
        ->where('field_key', $selectFieldKey)->find();
    $assertThrows(
        fn () => $entityFields->saveValues((int) $team->id, $memberSlug, []),
        422,
        'omitted required entity field is rejected when no stored value exists'
    );
    $entityFields->saveValues(
        (int) $team->id,
        $memberSlug,
        [(int) $selectField->id => 'alpha']
    );
    $assertSame(
        1,
        \app\model\TeamEntityFieldValue::where('field_id', $selectField->id)
            ->where('entity_type', 'member')
            ->where('entity_id', $member->id)
            ->count(),
        'unified entity field stores member value'
    );
    $assertThrows(
        fn () => $entityFields->saveValues(
            (int) $team->id,
            $memberSlug,
            [(int) $selectField->id => 'outside-option']
        ),
        422,
        'entity select value outside configured options is rejected'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.virtual.*.operate',
        "chat.virtual.{$virtualSlug}.operate",
    ]);
    app(ChatVirtual::class)->delete((int) $team->id, $virtualSlug);
    $assertSame(
        0,
        TeamRolePermission::where('team_id', $team->id)
            ->where('permission_key', "chat.virtual.{$virtualSlug}.operate")->count(),
        'deleting virtual entity removes its specific permission'
    );
    $assertSame(
        1,
        TeamRolePermission::where('team_id', $team->id)
            ->where('permission_key', 'chat.virtual.*.operate')->count(),
        'deleting virtual entity preserves wildcard permission'
    );
    $assert(
        EntityIdentity::withTrashed()->where('slug', $virtualSlug)->find() !== null,
        'deleted virtual slug remains permanently reserved'
    );
    $assert(
        TeamVirtual::where('team_id', $team->id)->where('id', '>', 0)
            ->where('name', 'Chat Virtual')->find() === null,
        'deleted virtual entity is hidden by soft delete'
    );
    $assertThrows(
        fn () => app(ChatVirtual::class)->create((int) $team->id, [
            'slug' => $virtualSlug,
            'name' => 'Reused Chat Virtual',
        ]),
        409,
        'deleted virtual slug cannot be reused'
    );

    $permissions->save((int) $team->id, (int) $role->id, [
        'chat.conversation.create',
        'chat.temporary.create',
        'chat.group.manage',
        'chat.virtual.*.operate',
    ]);
    $conversations = app(ChatConversation::class);
    $created = $conversations->create((int) $team->id, (int) $member->id, 0, [
        'kind' => 'direct',
        'actor_slug' => $memberSlug,
        'participants' => [$customerSlug],
        'is_temporary' => 0,
    ]);
    $assertSame(false, $created['existing'], 'first ordinary direct conversation is created');
    $existing = $conversations->create((int) $team->id, 0, (int) $customer->id, [
        'kind' => 'direct',
        'actor_slug' => $customerSlug,
        'participants' => [$memberSlug],
        'is_temporary' => 0,
    ]);
    $assertSame(true, $existing['existing'], 'ordinary direct conversation is unique by unordered participants');
    $assertSame($created['uuid'], $existing['uuid'], 'reversed direct participants resolve to the same conversation');

    $temporary = $conversations->create((int) $team->id, (int) $member->id, 0, [
        'kind' => 'direct',
        'actor_slug' => $memberSlug,
        'participants' => [$customerSlug],
        'is_temporary' => 1,
        'expires_at' => time() + 3600,
    ]);
    $assert(
        $temporary['uuid'] !== $created['uuid'],
        'temporary direct conversations may coexist with ordinary direct conversation'
    );

    $messages = app(ChatMessageService::class);
    $assertThrows(
        fn () => $messages->send((int) $team->id, (int) $member->id, 0, [
            'conversation' => $created['uuid'],
            'actor_slug' => $memberSlug,
            'content' => '   ',
        ]),
        422,
        'whitespace-only chat message is rejected'
    );
    $sent = $messages->send((int) $team->id, (int) $member->id, 0, [
        'conversation' => $created['uuid'],
        'actor_slug' => $memberSlug,
        'content' => 'hello',
    ]);
    $assertSame('hello', $sent['content'], 'member sends a text message');
    $storedMessage = ChatMessage::find((int) $sent['id']);
    if (!$storedMessage || (int) $storedMessage->getData('create_time') < time() - 60) {
        throw new RuntimeException(
            'message timestamp is invalid: ' . json_encode($storedMessage?->getData('create_time'))
        );
    }
    $messages->edit((int) $team->id, (int) $member->id, 0, (int) $sent['id'], 'edited');
    $assertSame(
        'edited',
        ChatMessage::find((int) $sent['id'])?->content,
        'sender edits message inside the configured window'
    );
    $messages->read(
        (int) $team->id,
        $created['uuid'],
        $memberSlug,
        (int) $member->id,
        0,
        (int) $sent['id']
    );
    $listed = $messages->list(
        (int) $team->id,
        $created['uuid'],
        (int) $member->id,
        0
    );
    $assertSame(1, count($listed), 'conversation message list returns the sent message');

    $secondMessage = $messages->send((int) $team->id, (int) $member->id, 0, [
        'conversation' => $created['uuid'],
        'actor_slug' => $memberSlug,
        'content' => 'read receipt disabled',
    ]);
    app(\app\service\TeamSetting::class)->batch((int) $team->id, 'chat', [
        'read_receipts' => false,
    ]);
    $messages->read(
        (int) $team->id,
        $created['uuid'],
        $memberSlug,
        (int) $member->id,
        0,
        (int) $secondMessage['id']
    );
    $conversationId = (int) \app\model\ChatConversation::where('uuid', $created['uuid'])->value('id');
    $memberParticipant = \app\model\ChatParticipant::where('conversation_id', $conversationId)
        ->where('actor_type', 'member')->where('actor_id', $member->id)->find();
    $assertSame(
        (int) $sent['id'],
        (int) $memberParticipant->last_read_message_id,
        'disabled read receipts do not advance the stored cursor'
    );
    $conversationWithoutReceipts = $conversations->get(
        (int) $team->id,
        $created['uuid'],
        (int) $member->id,
        0
    );
    $assert(
        array_reduce(
            $conversationWithoutReceipts['participants'],
            static fn (bool $carry, array $participant): bool =>
                $carry && $participant['last_read_message_id'] === null,
            true
        ),
        'disabled read receipts are hidden from conversation responses'
    );

    $messages->revoke((int) $team->id, (int) $member->id, 0, (int) $sent['id']);
    $assert(
        ChatMessage::find((int) $sent['id'])?->revoked_at !== null,
        'sender can revoke message inside the configured window'
    );

    $assertThrows(
        fn () => $conversations->create((int) $team->id, 0, (int) $customer->id, [
            'kind' => 'direct',
            'actor_slug' => $customerSlug,
            'participants' => [$hiddenMemberSlug],
            'is_temporary' => 0,
        ]),
        403,
        'customer cannot forge a direct conversation with a hidden member'
    );

    $assertThrows(
        fn () => $conversations->create((int) $team->id, 0, (int) $customer->id, [
            'kind' => 'group',
            'actor_slug' => $customerSlug,
            'participants' => [$memberSlug],
            'is_temporary' => 0,
        ]),
        403,
        'customer cannot create a group in invite-only mode'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Chat backend tests passed." . PHP_EOL);
