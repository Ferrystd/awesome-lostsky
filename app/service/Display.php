<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team as TeamModel;
use think\exception\HttpException;

class Display
{
    private const MEMBER_VISIBLE = [
        'id',
        'nickname',
        'avatar',
        'intro_image',
        'intro_video',
        'introduction_markdown',
        'create_time',
        'posts',
    ];

    /**
     * 获取团队公开资料
     */
    public function profile(int $teamId): array
    {
        $team = TeamModel::active()->with(['profile'])->find($teamId);

        if (!$team) {
            throw new HttpException(404, '团队不存在');
        }

        return $team->visible(['id', 'slug', 'display_name', 'title', 'introduction', 'create_time'])->toArray();
    }

    /**
     * 获取可展示的成员列表
     */
    public function members(int $teamId): array
    {
        return \app\model\TeamMember::where('team_id', $teamId)
            ->where('is_displayed', 1)
            ->where('is_blocked', 0)
            ->with(['profile', 'posts.type'])
            ->visible(self::MEMBER_VISIBLE)
            ->select()
            ->toArray();
    }

    /**
     * 获取单个可展示的成员详情
     */
    public function member(int $teamId, int $memberId): array
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)
            ->where('is_displayed', 1)
            ->where('is_blocked', 0)
            ->with(['profile', 'posts.type'])
            ->find($memberId);

        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        return $member->visible(self::MEMBER_VISIBLE)->toArray();
    }
}
