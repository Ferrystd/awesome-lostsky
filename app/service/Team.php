<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team as TeamModel;
use app\model\TeamMember;
use app\model\TeamMemberTenure;
use app\enum\TeamMemberStatus;
use app\validate\Team as TeamValidator;
use think\exception\HttpException;

class Team
{
    /**
     * 获取用户所属的所有团队
     */
    public function list(int $userId): array
    {
        $members = TeamMember::where('user_id', $userId)
            ->where('status', TeamMemberStatus::Active->value)
            ->select();

        if ($members->isEmpty()) {
            return [];
        }

        $teamIds = $members->column('team_id');

        $teams = TeamModel::whereIn('id', $teamIds)
            ->active()
            ->with(['identity', 'profile'])
            ->visible(['id', 'slug', 'display_name', 'is_owner'])
            ->select();

        foreach ($teams as $team) {
            $team->currentUserId = $userId;
        }

        return $teams->toArray();
    }

    /**
     * 创建团队
     */
    public function create(int $userId, string $slug, string $displayName): array
    {
        $validator = new TeamValidator;
        if (!$validator->scene('create')->check(['slug' => $slug, 'display_name' => $displayName])) {
            throw new HttpException(422, $validator->getError());
        }

        $team = \think\facade\Db::transaction(function () use ($userId, $slug, $displayName) {
            $team = new TeamModel;
            $team->save([
                'slug' => $slug,
                'user_id' => $userId,
            ]);

            $teamEntity = app(\app\service\Entity::class)->claimTeam($team);
            app(EntityProfile::class)->update((int) $team->id, (int) $teamEntity->id, ['name' => $displayName]);

            $member = new TeamMember;
            $member->save([
                'team_id' => $team->id,
                'user_id' => $userId,
                'status' => TeamMemberStatus::Active,
            ]);
            app(\app\service\Entity::class)->claimMember(
                (int) $team->id,
                (int) $member->id,
                "member-{$member->id}"
            );
            app(\app\service\RolePermission::class)->bootstrapOwner(
                (int) $team->id,
                (int) $member->id
            );
            $tenure = new TeamMemberTenure;
            $tenure->save([
                'team_id' => (int) $team->id,
                'member_id' => (int) $member->id,
                'join_application_id' => null,
                'joined_at' => time(),
                'departed_at' => null,
            ]);

            return $team;
        });

        $team = TeamModel::with(['identity', 'profile'])->findOrFail((int) $team->id);
        $team->currentUserId = $userId;
        return $team->visible(['id', 'slug', 'display_name', 'is_owner'])->toArray();
    }

}
