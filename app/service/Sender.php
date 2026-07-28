<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamCustomer;
use app\model\TeamCustomerSender;
use think\exception\HttpException;

class Sender
{
    public function bindings(int $teamId, int $entityId): array
    {
        return TeamCustomerSender::where('team_id', $teamId)
            ->where('entity_id', $entityId)
            ->with(['customer.profile'])
            ->select()
            ->toArray();
    }

    public function allBindings(int $teamId): array
    {
        return TeamCustomerSender::where('team_id', $teamId)
            ->with(['customer.profile', 'subject.profile'])
            ->select()
            ->toArray();
    }

    public function bind(int $teamId, int $entityId, int $customerId): void
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);

        if (!TeamCustomer::where('team_id', $teamId)->find($customerId)) {
            throw new HttpException(422, '客户不存在');
        }

        $existing = TeamCustomerSender::withTrashed()->sender($entityId, $customerId)->find();
        if ($existing) {
            if (!$existing->trashed()) {
                throw new HttpException(409, '该绑定已存在');
            }

            $existing->restore();
            return;
        }

        $binding = new TeamCustomerSender;
        $binding->team_id     = $teamId;
        $binding->entity_id   = $entityId;
        $binding->customer_id = $customerId;
        $binding->save();
    }

    public function unbind(int $teamId, int $id): void
    {
        $binding = TeamCustomerSender::where('team_id', $teamId)->find($id);
        if (!$binding) {
            throw new HttpException(404, '绑定不存在');
        }

        $binding->delete();
    }
}
