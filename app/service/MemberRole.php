<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamMember;
use app\model\TeamMemberRole;
use app\model\TeamRole;
use think\exception\HttpException;

class MemberRole
{
    public function list(int $teamId, int $memberId): array
    {
        $this->assertMember($teamId, $memberId);

        return TeamMemberRole::where('team_id', $teamId)
            ->where('member_id', $memberId)
            ->with(['role'])
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    public function save(int $teamId, int $memberId, $roleIds): void
    {
        if (!is_array($roleIds)) {
            throw new HttpException(422, '角色列表格式不正确');
        }
        $data = ['member_id' => $memberId, 'role_ids' => $roleIds];
        $this->validate($data);

        $ids = [];
        foreach ($roleIds as $roleId) {
            if (filter_var($roleId, FILTER_VALIDATE_INT) === false || (int) $roleId <= 0) {
                throw new HttpException(422, '角色ID格式不正确');
            }
            $ids[] = (int) $roleId;
        }
        $ids = array_values(array_unique($ids));

        TeamMemberRole::transaction(function () use ($teamId, $memberId, $ids) {
            $this->assertMember($teamId, $memberId);

            if ($ids) {
                $count = TeamRole::where('team_id', $teamId)->whereIn('id', $ids)->count();
                if ($count !== count($ids)) {
                    throw new HttpException(404, '角色不存在');
                }
            }

            $records = TeamMemberRole::withTrashed()
                ->where('team_id', $teamId)
                ->where('member_id', $memberId)
                ->lock(true)
                ->select();

            $existing = [];
            foreach ($records as $record) {
                $roleId = (int) $record->role_id;
                $existing[$roleId] = $record;
                if (!in_array($roleId, $ids, true) && !$record->trashed()) {
                    $record->delete();
                }
            }

            foreach ($ids as $roleId) {
                if (isset($existing[$roleId])) {
                    if ($existing[$roleId]->trashed()) {
                        $existing[$roleId]->restore();
                    }
                    continue;
                }

                $memberRole = new TeamMemberRole;
                $memberRole->save([
                    'team_id'   => $teamId,
                    'member_id' => $memberId,
                    'role_id'   => $roleId,
                ]);
            }
        });
    }

    private function assertMember(int $teamId, int $memberId): void
    {
        if (!TeamMember::where('team_id', $teamId)->find($memberId)) {
            throw new HttpException(404, '成员不存在');
        }
    }

    private function validate(array $data): void
    {
        $validator = new \app\validate\MemberRole;
        if (!$validator->scene('save')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
