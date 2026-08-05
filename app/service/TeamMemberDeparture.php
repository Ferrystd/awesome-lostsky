<?php
declare(strict_types=1);

namespace app\service;

use app\enum\TeamMemberDepartureMode;
use app\enum\TeamMemberDepartureStatus;
use app\enum\TeamMemberStatus;
use app\model\Entity;
use app\model\Team;
use app\model\TeamMember;
use app\model\TeamMemberDeparture as DepartureModel;
use app\model\TeamMemberTenure;
use think\exception\HttpException;
use think\facade\Db;

class TeamMemberDeparture
{
    public function directMemberId(
        int $teamId,
        mixed $actingEntity,
        mixed $session,
        int $authenticatedUserId
    ): int {
        $member = is_array($actingEntity) && ($actingEntity['type'] ?? '') === 'teamMember'
            ? TeamMember::where('team_id', $teamId)->find((int) ($actingEntity['id'] ?? 0))
            : null;
        if (!$member
            || $member->enumCase('status') !== TeamMemberStatus::Active
            || (int) $member->user_id !== $authenticatedUserId
            || !$session
            || (int) ($session->parent_session_id ?? 0) > 0) {
            throw new HttpException(403, '离队自助操作必须使用成员本人直接登录的实体');
        }
        return (int) $member->id;
    }

    public function list(int $teamId, array $filters, int $page, int $limit): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = DepartureModel::where('team_id', $teamId);
        if (!empty($filters['status'])) {
            $status = TeamMemberDepartureStatus::tryFrom((int) $filters['status']);
            if (!$status) {
                throw new HttpException(422, '离队申请状态不正确');
            }
            $query->where('status', $status->value);
        }
        if (!empty($filters['member_id'])) {
            $query->where('member_id', (int) $filters['member_id']);
        }

        $paginator = $query->with(['member.profile', 'member.identity'])
            ->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $rows = $paginator->getCollection();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();

        return [
            'total' => $total,
            'list' => array_map(fn (DepartureModel $row): array => $this->data($row), $rows->all()),
            'page' => $page,
            'limit' => $limit,
        ];
    }

    public function get(int $teamId, int $id): array
    {
        $row = DepartureModel::where('team_id', $teamId)
            ->with(['member.profile', 'member.identity'])
            ->find($id);
        if (!$row) {
            throw new HttpException(404, '离队申请不存在');
        }
        return $this->data($row);
    }

    public function mine(int $teamId, int $memberId): array
    {
        $rows = DepartureModel::where('team_id', $teamId)
            ->where('member_id', $memberId)
            ->with(['member.profile', 'member.identity'])
            ->order('id', 'desc')
            ->select();
        return array_map(fn (DepartureModel $row): array => $this->data($row), $rows->all());
    }

    public function apply(int $teamId, int $memberId, int $requesterEntityId): array
    {
        $mode = TeamMemberDepartureMode::from((string) (
            app(TeamSetting::class)->internal($teamId, 'member')['departure_mode']
            ?? TeamMemberDepartureMode::Review->value
        ));
        if ($mode === TeamMemberDepartureMode::Disabled) {
            throw new HttpException(403, '团队当前不允许成员自助离队');
        }

        $result = Db::transaction(function () use ($teamId, $memberId, $requesterEntityId, $mode): array {
            $member = $this->lockedMember($teamId, $memberId);
            if ($member->enumCase('status') !== TeamMemberStatus::Active) {
                throw new HttpException(409, '只有正常成员可以自助申请离队');
            }
            $this->assertNotOwner($teamId, $member);
            $this->assertNoPending($memberId);

            $departure = $this->createApplication($teamId, $memberId, $requesterEntityId);
            if ($mode === TeamMemberDepartureMode::Auto) {
                $this->completeDeparture($departure, $member, $requesterEntityId);
            }

            return [
                'id' => (int) $departure->id,
                'status_code' => $departure->enumCase('status')->code(),
            ];
        });

        if ($result['status_code'] === TeamMemberDepartureStatus::Approved->code()) {
            $this->revokeMemberSessions($memberId);
        }
        return $this->get($teamId, (int) $result['id']);
    }

    public function depart(int $teamId, int $memberId, int $decisionEntityId): int
    {
        $result = Db::transaction(function () use ($teamId, $memberId, $decisionEntityId): array {
            $member = $this->lockedMember($teamId, $memberId);
            if (!in_array($member->enumCase('status'), [TeamMemberStatus::Active, TeamMemberStatus::Blocked], true)) {
                throw new HttpException(409, '成员已经离队');
            }
            $this->assertNotOwner($teamId, $member);

            $departure = DepartureModel::where('team_id', $teamId)
                ->where('member_id', $memberId)
                ->where('status', TeamMemberDepartureStatus::Applied->value)
                ->lock(true)
                ->find();
            if (!$departure) {
                $departure = $this->createApplication($teamId, $memberId, $decisionEntityId);
            }
            $this->completeDeparture($departure, $member, $decisionEntityId);

            return ['id' => (int) $departure->id, 'member_id' => (int) $member->id];
        });
        $this->revokeMemberSessions($result['member_id']);
        return $result['id'];
    }

    public function cancel(int $teamId, int $memberId, int $id, int $decisionEntityId): void
    {
        Db::transaction(function () use ($teamId, $memberId, $id, $decisionEntityId): void {
            $departure = $this->lockedApplication($teamId, $id);
            if ((int) $departure->member_id !== $memberId) {
                throw new HttpException(403, '无权取消该离队申请');
            }
            $this->assertPending($departure);
            $departure->save([
                'status' => TeamMemberDepartureStatus::Cancelled,
                'decision_entity_id' => $decisionEntityId,
                'decided_at' => time(),
            ]);
        });
    }

    public function approve(int $teamId, int $id, int $decisionEntityId): int
    {
        $memberId = Db::transaction(function () use ($teamId, $id, $decisionEntityId): int {
            $departure = $this->lockedApplication($teamId, $id);
            $this->assertPending($departure);
            $member = $this->lockedMember($teamId, (int) $departure->member_id);
            if (!in_array($member->enumCase('status'), [TeamMemberStatus::Active, TeamMemberStatus::Blocked], true)) {
                throw new HttpException(409, '成员当前状态不能批准离队');
            }
            $this->assertNotOwner($teamId, $member);
            $this->completeDeparture($departure, $member, $decisionEntityId);
            return (int) $member->id;
        });
        $this->revokeMemberSessions($memberId);
        return $memberId;
    }

    public function reject(int $teamId, int $id, int $decisionEntityId): void
    {
        Db::transaction(function () use ($teamId, $id, $decisionEntityId): void {
            $departure = $this->lockedApplication($teamId, $id);
            $this->assertPending($departure);
            $departure->save([
                'status' => TeamMemberDepartureStatus::Rejected,
                'decision_entity_id' => $decisionEntityId,
                'decided_at' => time(),
            ]);
        });
    }

    private function createApplication(int $teamId, int $memberId, int $requesterEntityId): DepartureModel
    {
        $departure = new DepartureModel;
        $departure->save([
            'team_id' => $teamId,
            'member_id' => $memberId,
            'requester_entity_id' => $requesterEntityId,
            'decision_entity_id' => null,
            'status' => TeamMemberDepartureStatus::Applied,
            'decided_at' => null,
        ]);
        return $departure;
    }

    private function completeDeparture(
        DepartureModel $departure,
        TeamMember $member,
        int $decisionEntityId
    ): void {
        $now = time();
        $tenure = TeamMemberTenure::where('member_id', (int) $member->id)
            ->whereNull('departed_at')
            ->order('id', 'desc')
            ->lock(true)
            ->find();
        if (!$tenure) {
            $tenure = new TeamMemberTenure;
            $tenure->save([
                'team_id' => (int) $member->team_id,
                'member_id' => (int) $member->id,
                'join_application_id' => null,
                'joined_at' => (int) ($member->create_time ?: $now),
                'departed_at' => $now,
            ]);
        } else {
            $tenure->save(['departed_at' => $now]);
        }

        $member->save([
            'status' => TeamMemberStatus::Departed,
        ]);
        $departure->save([
            'status' => TeamMemberDepartureStatus::Approved,
            'decision_entity_id' => $decisionEntityId,
            'decided_at' => $now,
        ]);
    }

    private function lockedApplication(int $teamId, int $id): DepartureModel
    {
        $departure = DepartureModel::where('team_id', $teamId)->lock(true)->find($id);
        if (!$departure) {
            throw new HttpException(404, '离队申请不存在');
        }
        return $departure;
    }

    private function lockedMember(int $teamId, int $memberId): TeamMember
    {
        $member = TeamMember::where('team_id', $teamId)->lock(true)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }
        return $member;
    }

    private function assertPending(DepartureModel $departure): void
    {
        if ($departure->enumCase('status') !== TeamMemberDepartureStatus::Applied) {
            throw new HttpException(409, '当前离队申请已经处理');
        }
    }

    private function assertNoPending(int $memberId): void
    {
        if (DepartureModel::where('member_id', $memberId)
            ->where('status', TeamMemberDepartureStatus::Applied->value)
            ->find()) {
            throw new HttpException(409, '该成员已有待处理的离队申请');
        }
    }

    private function assertNotOwner(int $teamId, TeamMember $member): void
    {
        $ownerUserId = (int) (Team::where('id', $teamId)->value('user_id') ?? 0);
        if ($ownerUserId > 0 && $ownerUserId === (int) $member->user_id) {
            throw new HttpException(409, '团队 owner 不能离队');
        }
    }

    private function revokeMemberSessions(int $memberId): void
    {
        $entityId = (int) (Entity::member()->where('entityable_id', $memberId)->value('id') ?? 0);
        if ($entityId > 0) {
            app(IdentitySession::class)->revokeForEntities([$entityId]);
        }
    }

    private function data(DepartureModel $departure): array
    {
        $data = $departure->toArray();
        $data['requester'] = $this->entitySummary((int) $departure->requester_entity_id);
        $data['decision_entity'] = $this->entitySummary((int) ($departure->decision_entity_id ?? 0));
        return $data;
    }

    private function entitySummary(int $entityId): ?array
    {
        if ($entityId < 1) {
            return null;
        }
        $entity = Entity::with(['profile'])->find($entityId);
        if (!$entity) {
            return null;
        }
        return [
            'entity_id' => (int) $entity->id,
            'slug' => (string) $entity->slug,
            'name' => (string) ($entity->profile?->name ?: '实体'),
        ];
    }
}
