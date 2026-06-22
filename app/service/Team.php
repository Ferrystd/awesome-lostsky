<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team as TeamModel;
use app\model\TeamMember;
use app\model\TeamProfile;
use app\validate\Team as TeamValidator;
use think\exception\HttpException;
use think\facade\Db;

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

        if (TeamModel::where('slug', $slug)->find()) {
            throw new HttpException(409, '团队标识已被占用');
        }

        $team = Db::transaction(function () use ($userId, $slug, $displayName) {
            $team = new TeamModel;
            $team->slug         = $slug;
            $team->display_name = $displayName;
            $team->user_id      = $userId;
            $team->save();

            $member = new TeamMember;
            $member->team_id      = $team->id;
            $member->user_id      = $userId;
            $member->is_displayed = 1;
            $member->save();

            $profile = new TeamProfile;
            $profile->team_id = $team->id;
            $profile->save();

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

        Db::transaction(function () use ($teamId) {
            TeamProfile::destroy(['team_id' => $teamId]);
            TeamMember::destroy(['team_id' => $teamId]);
            TeamModel::destroy($teamId);
        });
    }
}
