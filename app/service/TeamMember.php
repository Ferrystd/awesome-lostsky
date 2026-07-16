<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamMemberProfile;
use app\model\TeamMemberPost;
use app\model\TeamMemberPostType;
use app\validate\Member as MemberValidator;
use think\exception\HttpException;

class TeamMember
{
    private const PROFILE_FIELDS = ['nickname', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'];

    /**
     * 获取所有成员
     */
    public function list(int $teamId): array
    {
        return \app\model\TeamMember::where('team_id', $teamId)
            ->with(['profile', 'posts.type', 'fieldValues.field'])
            ->visible([
                'id',
                'team_id',
                'user_id',
                'is_displayed',
                'is_blocked',
                'nickname',
                'avatar',
                'description',
                'intro_image',
                'intro_video',
                'introduction_markdown',
                'create_time',
                'posts',
                'fieldValues',
            ])
            ->select()
            ->toArray();
    }

    /**
     * 获取单个成员
     */
    public function get(int $teamId, int $memberId): array
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)
            ->with(['profile', 'posts.type', 'fieldValues.field'])
            ->find($memberId);

        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        return $member->toArray();
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

            $profile = new TeamMemberProfile;
            $profile->save(array_merge([
                'member_id' => $member->id,
                'nickname' => '',
                'avatar' => '',
                'description' => null,
                'intro_image' => null,
                'intro_video' => null,
                'introduction_markdown' => null,
            ], $this->pick($data, self::PROFILE_FIELDS)));

            if (!empty($data['post_type_ids'])) {
                $this->syncPosts($member->id, $teamId, $data['post_type_ids']);
            }
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

            if (isset($data['is_displayed'])) {
                $member->is_displayed = (int) $data['is_displayed'];
                $member->save();
            }

            $profileData = $this->pick($data, self::PROFILE_FIELDS);
            if ($profileData) {
                $profile = TeamMemberProfile::where('member_id', $memberId)->findOrEmpty();
                $profile->save(array_merge(['member_id' => $memberId], $profileData));
            }

            if (isset($data['post_type_ids'])) {
                $this->syncPosts($memberId, $teamId, $data['post_type_ids']);
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

            $profile = TeamMemberProfile::where('member_id', $memberId)->find();
            if ($profile) {
                $profile->delete();
            }
            $posts = TeamMemberPost::where('member_id', $memberId)->select();
            foreach ($posts as $post) {
                $post->delete();
            }
            $member->delete();
        });
    }

    /**
     * 同步成员的岗位分配
     */
    private function syncPosts(int $memberId, int $teamId, array $typeIds): void
    {
        $existing = TeamMemberPost::where('member_id', $memberId)->select();
        foreach ($existing as $post) {
            $post->delete();
        }

        foreach ($typeIds as $typeId) {
            $type = TeamMemberPostType::where('team_id', $teamId)->find((int) $typeId);
            if (!$type) {
                continue;
            }
            $post = new TeamMemberPost;
            $post->member_id = $memberId;
            $post->type_id   = $type->id;
            $post->post_id   = $type->post_id;
            $post->save();
        }
    }

    private function pick(array $data, array $fields): array
    {
        return array_intersect_key($data, array_flip($fields));
    }
}
