<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamMemberPostType;
use app\validate\PostType as PostTypeValidator;
use think\exception\HttpException;

class PostType
{
    /**
     * 获取全部岗位类型
     */
    public function list(int $teamId): array
    {
        return TeamMemberPostType::where('team_id', $teamId)
            ->order('sort', 'asc')
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    /**
     * 获取单个岗位类型
     */
    public function get(int $teamId, int $id): array
    {
        $postType = TeamMemberPostType::where('team_id', $teamId)->find($id);
        if (!$postType) {
            throw new HttpException(404, '岗位类型不存在');
        }

        return $postType->toArray();
    }

    /**
     * 新增岗位类型
     */
    public function create(int $teamId, array $data): void
    {
        $validator = new PostTypeValidator;
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $exists = TeamMemberPostType::where('team_id', $teamId)
            ->where('post_id', $data['post_id'])
            ->find();
        if ($exists) {
            throw new HttpException(409, '该岗位ID已存在');
        }

        $postType = new TeamMemberPostType;
        $postType->save([
            'team_id' => $teamId,
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'post_id' => (int) $data['post_id'],
            'sort' => isset($data['sort']) ? (int) $data['sort'] : 0,
        ]);
    }

    /**
     * 编辑岗位类型
     */
    public function update(int $teamId, int $id, array $data): void
    {
        $validator = new PostTypeValidator;
        if (!$validator->scene('update')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $postType = TeamMemberPostType::where('team_id', $teamId)->find($id);
        if (!$postType) {
            throw new HttpException(404, '岗位类型不存在');
        }

        if (isset($data['post_id']) && (int) $data['post_id'] !== $postType->post_id) {
            $exists = TeamMemberPostType::where('team_id', $teamId)
                ->where('post_id', $data['post_id'])
                ->find();
            if ($exists) {
                throw new HttpException(409, '该岗位ID已被占用');
            }
        }

        $update = [];
        foreach (['name', 'description', 'post_id', 'sort'] as $field) {
            if (array_key_exists($field, $data)) {
                $update[$field] = in_array($field, ['post_id', 'sort'], true) ? (int) $data[$field] : $data[$field];
            }
        }

        if ($update) {
            $postType->save($update);
        }
    }

    /**
     * 删除岗位类型
     */
    public function delete(int $teamId, int $id): void
    {
        $validator = new PostTypeValidator;
        if (!$validator->scene('delete')->check(['id' => $id])) {
            throw new HttpException(422, $validator->getError());
        }

        $postType = TeamMemberPostType::where('team_id', $teamId)->find($id);
        if (!$postType) {
            throw new HttpException(404, '岗位类型不存在');
        }

        $postType->delete();
    }
}
