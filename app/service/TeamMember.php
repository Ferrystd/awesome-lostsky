<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamEntityProfile;
use app\validate\Member as MemberValidator;
use think\exception\HttpException;

class TeamMember
{
    private const PROFILE_FIELDS = [];

    /**
     * 获取所有成员
     */
    public function list(int $teamId, array $actingEntity): array
    {
        $canReadAll = app(PermissionGate::class)->allows(
            $teamId,
            $actingEntity,
            [PermissionDictionary::TEAM_MEMBER_READ]
        );
        $query = \app\model\TeamMember::where('team_id', $teamId);
        if (!$canReadAll) {
            $visibleMemberIds = \app\model\Entity::member()
                ->where('is_internal_visible', 1)
                ->column('entityable_id');
            $query->where('is_blocked', 0)->whereIn('id', $visibleMemberIds);
        }
        $members = $query
            ->with(['profile', 'identity', 'team'])
            ->visible([
                'id',
                'team_id',
                'user_id',
                'entity_id',
                'is_blocked',
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
            && ((int) $member->is_blocked !== 0 || (int) $identity->is_internal_visible !== 1))) {
            throw new HttpException(404, '成员不存在');
        }

        $result = $member->toArray();
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
    public function add(int $teamId, int $userId, array $data): void
    {
        $validator = new MemberValidator;
        if (!$validator->scene('add')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        if (\app\model\TeamMember::where('team_id', $teamId)->where('user_id', $userId)->find()) {
            throw new HttpException(409, '该用户已是本团队成员');
        }

        \think\facade\Db::transaction(function () use ($teamId, $userId, $data) {
            $member = new \app\model\TeamMember;
            $member->save([
                'team_id' => $teamId,
                'user_id' => $userId,
            ]);
            $entity = app(\app\service\Entity::class)->claimMember(
                $teamId,
                (int) $member->id,
                "member-{$member->id}"
            );

            $profile = new TeamEntityProfile;
            $profile->save(array_merge([
                'entity_id' => $entity->id,
                'name' => '',
                'avatar' => '',
                'description' => null,
                'intro_image' => null,
                'intro_video' => null,
                'introduction_markdown' => null,
            ]));

            app(\app\service\Markdown::class)->sync(
                $profile,
                'introduction_markdown',
                $profile->introduction_markdown
            );

        });
    }

    /**
     * 编辑成员
     */
    public function edit(int $teamId, int $memberId, array $data): void
    {
        $validator = new MemberValidator;
        if (!$validator->scene('edit')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        \think\facade\Db::transaction(function () use ($teamId, $memberId, $data) {
            $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
            if (!$member) {
                throw new HttpException(404, '成员不存在');
            }

        });
    }

    /**
     * 封禁成员
     */
    public function block(int $teamId, int $memberId): void
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        $member->is_blocked = 1;
        $member->save();
    }

    /**
     * 解封成员
     */
    public function unblock(int $teamId, int $memberId): void
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        $member->is_blocked = 0;
        $member->save();
    }

    /**
     * 移出成员
     */
    public function remove(int $teamId, int $memberId): void
    {
        $validator = new MemberValidator;
        if (!$validator->scene('remove')->check(['member_id' => $memberId])) {
            throw new HttpException(422, $validator->getError());
        }

        \think\facade\Db::transaction(function () use ($teamId, $memberId) {
            $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
            if (!$member) {
                throw new HttpException(404, '成员不存在');
            }

            $entityId = (int) app(Entity::class)->requireBySubject('teamMember', $memberId)->id;
            $profile = TeamEntityProfile::where('entity_id', $entityId)->find();
            if ($profile) {
                $profile->delete();
            }
            $member->delete();
        });
    }

    private function pick(array $data, array $fields): array
    {
        return array_intersect_key($data, array_flip($fields));
    }
}
