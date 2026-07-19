<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team as TeamModel;
use app\model\TeamMember;
use app\model\TeamProfile;
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
            ->where('is_blocked', 0)
            ->select();

        if ($members->isEmpty()) {
            return [];
        }

        $teamIds = $members->column('team_id');

        $teams = TeamModel::whereIn('id', $teamIds)
            ->active()
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
                'display_name' => $displayName,
                'user_id' => $userId,
            ]);

            app(\app\service\EntityIdentity::class)->claimTeam($team);

            $member = new TeamMember;
            $member->save([
                'team_id' => $team->id,
                'user_id' => $userId,
                'is_displayed' => 1,
            ]);

            $profile = new TeamProfile;
            $profile->save([
                'team_id' => $team->id,
            ]);

            return $team;
        });

        $team->currentUserId = $userId;
        return $team->visible(['id', 'slug', 'display_name', 'is_owner'])->toArray();
    }

    /**
     * 删除团队（仅创建者可操作）
     */
    public function delete(int $userId, int $teamId): void
    {
        $validator = new TeamValidator;
        if (!$validator->scene('delete')->check(['team_id' => $teamId])) {
            throw new HttpException(422, $validator->getError());
        }

        $team = TeamModel::find($teamId);
        if (!$team) {
            throw new HttpException(404, '团队不存在');
        }

        if ($team->user_id !== $userId) {
            throw new HttpException(403, '仅团队创建者可执行此操作');
        }

        \think\facade\Db::transaction(function () use ($teamId) {
            $profile = TeamProfile::where('team_id', $teamId)->find();
            if ($profile) {
                $profile->delete();
            }

            $members = TeamMember::where('team_id', $teamId)->select();
            foreach ($members as $member) {
                $member->delete();
            }

            $team = TeamModel::find($teamId);
            if ($team) {
                $team->delete();
            }
        });
    }
}
