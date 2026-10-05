<?php
declare(strict_types=1);

namespace app\service;

use app\enum\TeamMemberStatus;
use app\model\TeamMemberTenure;
use app\validate\Member as MemberValidator;
use think\exception\HttpException;

class TeamMember
{
    private const PROFILE_FIELDS = [];

    /**
     * 获取所有成员
     */
    public function list(int $teamId, array $actingEntity, ?string $statusCode = null): array
    {
        $canReadAll = app(PermissionGate::class)->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_MEMBER_READ]
        );
        $query = \app\model\TeamMember::where('team_id', $teamId);
        if ($statusCode !== null && $statusCode !== '') {
            $status = null;
            foreach (TeamMemberStatus::cases() as $candidate) {
                if ($candidate->code() === strtolower($statusCode)) {
                    $status = $candidate;
                    break;
                }
            }
            if (!$status) {
                throw new HttpException(422, '成员状态不正确');
            }
            $query->where('status', $status->value);
        }
        if (!$canReadAll) {
            $visibleMemberIds = \app\model\Entity::member()
                ->where('is_internal_visible', 1)
                ->column('entityable_id');
            $query->where('status', TeamMemberStatus::Active->value)->whereIn('id', $visibleMemberIds);
        }
        $members = $query
            ->with(['profile', 'identity', 'team'])
            ->visible([
                'id',
                'team_id',
                'user_id',
                'entity_id',
                'status_code',
                'status_label',
                'slug',
                'search_override',
                'is_valid',
                'is_searchable',
                'name',
                'avatar',
                'description',
                'intro_image',
                'intro_video',
                'introduction_markdown',
                'create_time',
            ])
            ->select()
            ->all();
        $fieldService = app(TeamEntityField::class);
        $isFieldManager = app(PermissionGate::class)->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_ENTITY_FIELD_MANAGE]
        );
        return array_map(function ($member) use (
            $teamId,
            $actingEntity,
            $fieldService,
            $isFieldManager
        ): array {
            $item = $member->toArray();
            $item['fieldValues'] = $fieldService->visibleValues(
                $teamId,
                (int) $member->entity_id,
                'entity',
                $actingEntity,
                $isFieldManager
            );
            return $item;
        }, $members);
    }

    /**
     * 获取单个成员
     */
    public function get(int $teamId, int $memberId, array $actingEntity): array
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)
            ->with(['profile', 'identity', 'team'])
            ->find($memberId);

        $canReadAll = app(PermissionGate::class)->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_MEMBER_READ]
        );
        $identity = $member
            ? \app\model\Entity::member()->where('entityable_id', $memberId)->find()
            : null;
        if (!$member || !$identity || (!$canReadAll
            && ($member->enumCase('status') !== TeamMemberStatus::Active
                || (int) $identity->is_internal_visible !== 1))) {
            throw new HttpException(404, '成员不存在');
        }

        $result = $member->toArray();
        $result['inviter'] = app(Inviter::class)->summary($teamId, $member->inviter_entity_id);
        $isFieldManager = app(PermissionGate::class)->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_ENTITY_FIELD_MANAGE]
        );
        $result['fieldValues'] = app(TeamEntityField::class)->visibleValues(
            $teamId,
            (int) $member->entity_id,
            'entity',
            $actingEntity,
            $isFieldManager
        );
        return $result;
    }

    public function capabilities(int $teamId, array $subject, array $member): array
    {
        $gate = app(PermissionGate::class);
        $allows = static fn (string $key): bool => $gate->allows($teamId, $subject, [$key]);
        $canUpdate = $allows(PermissionDictionary::TEAM_MEMBER_UPDATE);
        $slug = (string) ($member['slug'] ?? '');

        return [
            'member_edit' => $canUpdate,
            'field_manage' => $allows(PermissionDictionary::TEAM_ENTITY_FIELD_MANAGE),
            'role_read' => $allows(PermissionDictionary::TEAM_ROLE_READ),
            'role_write' => $allows(PermissionDictionary::TEAM_ROLE_WRITE),
            'member_block' => $canUpdate,
            'member_search' => $canUpdate,
            'member_slug' => $canUpdate,
            'member_remove' => $allows(PermissionDictionary::TEAM_MEMBER_REMOVE),
            'identity_assume' => $slug !== '' && $gate->allows($teamId, $subject, [
                PermissionDictionary::assume('member', $slug),
                PermissionDictionary::IDENTITY_MEMBER_ALL_ASSUME,
            ]),
        ];
    }

    /**
     * 添加成员
     */
    public function add(int $teamId, int $userId, array $data): int
    {
        $validator = new MemberValidator;
        if (!$validator->scene('add')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $existing = \app\model\TeamMember::where('team_id', $teamId)->where('user_id', $userId)->find();
        if ($existing) {
            throw new HttpException(
                409,
                $existing->enumCase('status') === TeamMemberStatus::Departed
                    ? '该用户已离队，请由其提交复职申请'
                    : '该用户已是本团队成员'
            );
        }

        return \think\facade\Db::transaction(function () use ($teamId, $userId, $data) {
            $member = new \app\model\TeamMember;
            $member->save([
                'team_id' => $teamId,
                'user_id' => $userId,
                'status' => TeamMemberStatus::Active,
            ]);
            app(\app\service\Entity::class)->claimMember(
                $teamId,
                (int) $member->id,
                "member-{$member->id}"
            );

            $tenure = new TeamMemberTenure;
            $tenure->save([
                'team_id' => $teamId,
                'member_id' => (int) $member->id,
                'join_application_id' => null,
                'joined_at' => time(),
                'departed_at' => null,
            ]);
            return (int) $member->id;
        });
    }

    /**
     * 编辑成员
     */
    public function edit(int $teamId, int $memberId, array $data): void
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }
        throw new HttpException(410, '旧成员资料编辑接口已停用，请使用人员资料或个人工作台接口');
    }

    /**
     * 封禁成员
     */
    public function block(int $teamId, int $memberId): void
    {
        \think\facade\Db::transaction(function () use ($teamId, $memberId): void {
            $member = \app\model\TeamMember::where('team_id', $teamId)->lock(true)->find($memberId);
            if (!$member) throw new HttpException(404, '成员不存在');
            if ($member->enumCase('status') !== TeamMemberStatus::Active) throw new HttpException(409, '只有正常成员可以被封禁');
            $member->save(['status' => TeamMemberStatus::Blocked]);
        });
        $this->revokeMemberSessions($memberId);
    }

    /** 解封前锁定并重新确认成员状态，不能复活已离队成员。 */
    public function unblock(int $teamId, int $memberId): void
    {
        \think\facade\Db::transaction(function () use ($teamId, $memberId): void {
            $member = \app\model\TeamMember::where('team_id', $teamId)->lock(true)->find($memberId);
            if (!$member) throw new HttpException(404, '成员不存在');
            if ($member->enumCase('status') !== TeamMemberStatus::Blocked) throw new HttpException(409, '只有已封禁成员可以解封');
            $member->save(['status' => TeamMemberStatus::Active]);
        });
    }
    private function revokeMemberSessions(int $memberId): void
    {
        $entityId = (int) (\app\model\Entity::member()
            ->where('entityable_id', $memberId)
            ->value('id') ?? 0);
        if ($entityId > 0) {
            app(IdentitySession::class)->revokeForEntities([$entityId]);
        }
    }

    private function pick(array $data, array $fields): array
    {
        return array_intersect_key($data, array_flip($fields));
    }
}
