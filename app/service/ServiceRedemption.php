<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ServiceCancelStatus;
use app\enum\ServiceStatus;
use app\model\Entity;
use app\model\TeamServiceCancelRequest;
use app\model\TeamServiceEvent;
use app\model\TeamServiceHandler;
use app\model\TeamServiceInstance;
use think\exception\HttpException;
use think\facade\Db;

class ServiceRedemption
{
    private const RELATIONS = [
        'service', 'customer.profile', 'holder.profile',
        'cancelRequests.requester.profile', 'events.actor.profile',
    ];

    public function customerList(int $teamId, int $customerId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamServiceInstance::where('team_id', $teamId)->where('customer_id', $customerId);
        if (!empty($filters['status'])) $query->where('status', (int) $filters['status']);
        $total = $query->count();
        $list = $query->with(['service'])->order('id', 'desc')->page($page, $limit)->select()->toArray();
        $this->attachEntities($list, ['handler' => 'handler_entity_id']);
        return compact('total', 'list', 'page', 'limit');
    }

    public function customerGet(int $teamId, int $customerId, int $id): array
    {
        $instance = TeamServiceInstance::where('team_id', $teamId)
            ->where('customer_id', $customerId)->with(self::RELATIONS)->find($id);
        if (!$instance) throw new HttpException(404, '服务不存在');
        $result = $instance->toArray();
        $rows = [&$result];
        $this->attachEntities($rows, [
            'handler' => 'handler_entity_id',
            'sender' => 'sender_entity_id',
            'cs' => 'cs_entity_id',
        ]);
        if (!empty($result['cancel_requests'])) {
            $this->attachEntities($result['cancel_requests'], ['decider' => 'decided_by_entity_id']);
        }
        $result['redemption_fields'] = app(ProductRedemptionField::class)->fieldsForInstance($instance, true);
        return $result;
    }

    public function handlers(int $teamId, int $customerId, int $id): array
    {
        $instance = $this->customerInstance($teamId, $customerId, $id);
        return TeamServiceHandler::where('service_id', $instance->service_id)
            ->with(['subject.profile'])->select()->filter(
                static fn ($handler): bool => (bool) $handler->subject?->is_valid
            )->toArray();
    }

    public function start(int $teamId, int $customerId, int $id, int $handlerEntityId, string $memo, array $fieldValues, int $actorEntityId): void
    {
        Db::transaction(function () use ($teamId, $customerId, $id, $handlerEntityId, $memo, $fieldValues, $actorEntityId) {
            $instance = $this->locked($teamId, $id);
            if ((int) $instance->customer_id !== $customerId || (int) $instance->holder_entity_id !== $actorEntityId) {
                throw new HttpException(403, '只能核销当前 Customer Entity 持有的服务');
            }
            if ($instance->enumCase('status') !== ServiceStatus::Unredeemed) {
                throw new HttpException(409, '服务已被发起核销');
            }
            if ($instance->is_expired) throw new HttpException(422, '服务已过期');
            $this->assertHandler($teamId, (int) $instance->service_id, $handlerEntityId);
            app(ProductRedemptionField::class)->saveForStage($instance, 'customer', $fieldValues);

            $instance->status = ServiceStatus::Processing;
            $instance->handler_entity_id = $handlerEntityId;
            $instance->started_at = time();
            $instance->memo = $memo;
            $instance->save();
            $this->event((int) $instance->id, $actorEntityId, 'started', null, $handlerEntityId, ['memo' => $memo]);
        });
    }

    public function requestCancel(int $teamId, int $customerId, int $id, string $reason, int $actorEntityId): int
    {
        return Db::transaction(function () use ($teamId, $customerId, $id, $reason, $actorEntityId) {
            $instance = $this->locked($teamId, $id);
            if ((int) $instance->customer_id !== $customerId || (int) $instance->holder_entity_id !== $actorEntityId) {
                throw new HttpException(403, '只能操作自己持有的服务');
            }
            $this->assertProcessing($instance);
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '已有待处理的取消申请');

            $request = new TeamServiceCancelRequest;
            $request->service_instance_id = $instance->id;
            $request->requested_by_entity_id = $actorEntityId;
            $request->status = ServiceCancelStatus::Pending;
            $request->reason = trim($reason);
            $request->save();
            $this->event((int) $instance->id, $actorEntityId, 'cancel_requested', null, null, ['request_id' => $request->id]);
            return (int) $request->id;
        });
    }

    public function list(int $teamId, array $subject, int $actorEntityId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamServiceInstance::where('team_id', $teamId);
        if (!$this->canReadAll($teamId, $subject)) $query->where('handler_entity_id', $actorEntityId);
        if (!empty($filters['status'])) $query->where('status', (int) $filters['status']);
        if (!empty($filters['handler_entity_id'])) $query->where('handler_entity_id', (int) $filters['handler_entity_id']);
        $total = $query->count();
        $list = $query->with(['service', 'customer.profile'])
            ->order('id', 'desc')->page($page, $limit)->select()->toArray();
        $this->attachEntities($list, ['handler' => 'handler_entity_id']);
        return compact('total', 'list', 'page', 'limit') + [
            'capabilities' => [
                'read_all' => $this->canReadAll($teamId, $subject),
                'manage' => $this->canManage($teamId, $subject),
            ],
        ];
    }

    public function get(int $teamId, array $subject, int $actorEntityId, int $id): array
    {
        $instance = TeamServiceInstance::where('team_id', $teamId)->with(self::RELATIONS)->find($id);
        if (!$instance) throw new HttpException(404, '服务不存在');
        if (!$this->canReadAll($teamId, $subject) && (int) $instance->handler_entity_id !== $actorEntityId) {
            throw new HttpException(403, '无权查看该核销');
        }
        $result = $instance->toArray();
        $rows = [&$result];
        $this->attachEntities($rows, [
            'handler' => 'handler_entity_id',
            'sender' => 'sender_entity_id',
            'cs' => 'cs_entity_id',
        ]);
        if (!empty($result['cancel_requests'])) {
            $this->attachEntities($result['cancel_requests'], ['decider' => 'decided_by_entity_id']);
        }
        $result['redemption_fields'] = app(ProductRedemptionField::class)->fieldsForInstance($instance, false);
        $manage = $this->canManage($teamId, $subject);
        $result['capabilities'] = [
            'manage' => $manage,
            'approve_cancel' => $manage || (int) $instance->handler_entity_id === $actorEntityId,
        ];
        return $result;
    }

    public function availableHandlers(int $teamId, array $subject, int $actorEntityId, int $id): array
    {
        $this->get($teamId, $subject, $actorEntityId, $id);
        $instance = TeamServiceInstance::where('team_id', $teamId)->find($id);
        return TeamServiceHandler::where('service_id', $instance->service_id)
            ->with(['subject.profile'])->select()->filter(
                static fn ($handler): bool => (bool) $handler->subject?->is_valid
            )->toArray();
    }

    public function approveCancel(int $teamId, array $subject, int $actorEntityId, int $id): void
    {
        Db::transaction(function () use ($teamId, $subject, $actorEntityId, $id) {
            $instance = $this->locked($teamId, $id);
            $this->assertProcessing($instance);
            $manage = $this->canManage($teamId, $subject);
            if (!$manage && (int) $instance->handler_entity_id !== $actorEntityId) {
                throw new HttpException(403, '只有当前接单人或服务管理 Entity 可同意取消');
            }
            $request = $this->requiredPendingCancel((int) $instance->id);
            $request->status = ServiceCancelStatus::Approved;
            $request->decided_by_entity_id = $actorEntityId;
            $request->decided_at = time();
            $request->save();
            $oldHandler = $instance->handler_entity_id ? (int) $instance->handler_entity_id : null;
            $instance->status = ServiceStatus::Unredeemed;
            $instance->handler_entity_id = null;
            $instance->started_at = null;
            $instance->save();
            $this->event((int) $instance->id, $actorEntityId, 'cancel_approved', $oldHandler, null, ['request_id' => $request->id]);
        });
    }

    public function rejectCancel(int $teamId, array $subject, int $actorEntityId, int $id, string $reason): void
    {
        $this->assertManage($teamId, $subject);
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $reason) {
            $instance = $this->locked($teamId, $id);
            $this->assertProcessing($instance);
            $request = $this->requiredPendingCancel((int) $instance->id);
            $request->status = ServiceCancelStatus::Rejected;
            $request->decided_by_entity_id = $actorEntityId;
            $request->decision_reason = trim($reason);
            $request->decided_at = time();
            $request->save();
            $this->event((int) $instance->id, $actorEntityId, 'cancel_rejected', null, null, ['request_id' => $request->id, 'reason' => $reason]);
        });
    }

    public function reassign(int $teamId, array $subject, int $actorEntityId, int $id, int $handlerEntityId, string $reason): void
    {
        $this->assertManage($teamId, $subject);
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $handlerEntityId, $reason) {
            $instance = $this->locked($teamId, $id);
            $this->assertProcessing($instance);
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '待处理取消申请存在时不可改派');
            $this->assertHandler($teamId, (int) $instance->service_id, $handlerEntityId);
            $old = $instance->handler_entity_id ? (int) $instance->handler_entity_id : null;
            if ($old === $handlerEntityId) return;
            $instance->handler_entity_id = $handlerEntityId;
            $instance->save();
            $this->event((int) $instance->id, $actorEntityId, 'reassigned', $old, $handlerEntityId, ['reason' => trim($reason)]);
        });
    }

    public function complete(int $teamId, array $subject, int $actorEntityId, int $id, array $fieldValues = []): void
    {
        $this->assertManage($teamId, $subject);
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $fieldValues) {
            $instance = $this->locked($teamId, $id);
            if ($instance->enumCase('status') === ServiceStatus::Redeemed) return;
            $this->assertProcessing($instance);
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '待处理取消申请存在时不可完成');
            app(ProductRedemptionField::class)->saveForStage($instance, 'manager', $fieldValues);

            $transId = null;
            if (app(AbilityResolver::class)->available($teamId, 'transaction')) {
                $transId = app(Transaction::class)->createServiceRedemption($teamId, [
                    'handler_entity_id' => $instance->handler_entity_id,
                    'sender_entity_id' => $instance->sender_entity_id,
                    'cs_entity_id' => $instance->cs_entity_id,
                    'customer_id' => $instance->customer_id,
                    'service_instance_id' => $instance->id,
                    'total_price' => $instance->total_price,
                    'cost' => $instance->cost,
                    'handler_cut' => $instance->handler_cut,
                    'sender_cut' => $instance->sender_cut,
                    'cs_cut' => $instance->cs_cut,
                    'team_cut' => $instance->team_cut,
                    'trans_at' => time(),
                    'memo' => '服务核销 #' . $instance->id,
                ]);
            }
            $instance->status = ServiceStatus::Redeemed;
            $instance->completed_at = time();
            $instance->trans_id = $transId;
            $instance->save();
            $this->event((int) $instance->id, $actorEntityId, 'completed', null, null, ['transaction_id' => $transId]);
        });
    }

    private function customerInstance(int $teamId, int $customerId, int $id): TeamServiceInstance
    {
        $instance = TeamServiceInstance::where('team_id', $teamId)->where('customer_id', $customerId)->find($id);
        if (!$instance) throw new HttpException(404, '服务不存在');
        return $instance;
    }

    private function locked(int $teamId, int $id): TeamServiceInstance
    {
        $instance = TeamServiceInstance::where('team_id', $teamId)->lock(true)->find($id);
        if (!$instance) throw new HttpException(404, '服务不存在');
        return $instance;
    }

    private function assertProcessing(TeamServiceInstance $instance): void
    {
        if ($instance->enumCase('status') !== ServiceStatus::Processing) throw new HttpException(409, '服务不在核销中');
    }

    private function assertHandler(int $teamId, int $serviceId, int $entityId): void
    {
        $handler = TeamServiceHandler::where('service_id', $serviceId)->where('entity_id', $entityId)->find();
        $entity = Entity::find($entityId);
        if (!$handler || !$entity || !$entity->is_valid) throw new HttpException(422, '接单 Entity 不在当前有效接单池中');
        app(\app\service\Entity::class)->assertInTeam($entityId, $teamId);
    }

    private function pendingCancel(int $instanceId, bool $lock = false): ?TeamServiceCancelRequest
    {
        $query = TeamServiceCancelRequest::where('service_instance_id', $instanceId)
            ->where('status', ServiceCancelStatus::Pending->value);
        if ($lock) $query->lock(true);
        return $query->find();
    }

    private function requiredPendingCancel(int $instanceId): TeamServiceCancelRequest
    {
        $request = $this->pendingCancel($instanceId, true);
        if (!$request) throw new HttpException(409, '没有待处理的取消申请');
        return $request;
    }

    private function canReadAll(int $teamId, array $subject): bool
    {
        return app(PermissionGate::class)->allows($teamId, $subject, [
            PermissionDictionary::SERVICE_REDEMPTION_READ,
            PermissionDictionary::SERVICE_REDEMPTION_MANAGE,
        ]);
    }

    private function canManage(int $teamId, array $subject): bool
    {
        return app(PermissionGate::class)->allows($teamId, $subject, [PermissionDictionary::SERVICE_REDEMPTION_MANAGE]);
    }

    private function assertManage(int $teamId, array $subject): void
    {
        app(PermissionGate::class)->assert($teamId, $subject, [PermissionDictionary::SERVICE_REDEMPTION_MANAGE]);
    }

    private function event(int $instanceId, int $actorId, string $type, ?int $from, ?int $to, array $detail): void
    {
        $event = new TeamServiceEvent;
        $event->service_instance_id = $instanceId;
        $event->actor_entity_id = $actorId;
        $event->event_type = $type;
        $event->from_handler_entity_id = $from;
        $event->to_handler_entity_id = $to;
        $event->detail = $detail ?: null;
        $event->save();
    }

    private function attachEntities(array &$rows, array $relations): void
    {
        $ids = [];
        foreach ($rows as $row) {
            foreach ($relations as $foreignKey) {
                $id = (int) ($row[$foreignKey] ?? 0);
                if ($id > 0) $ids[$id] = $id;
            }
        }
        $entities = $ids
            ? Entity::whereIn('id', array_values($ids))->with(['profile'])->select()->toArray()
            : [];
        $map = [];
        foreach ($entities as $entity) $map[(int) $entity['id']] = $entity;
        foreach ($rows as &$row) {
            foreach ($relations as $relation => $foreignKey) {
                $id = (int) ($row[$foreignKey] ?? 0);
                $row[$relation] = $id > 0 ? ($map[$id] ?? null) : null;
            }
        }
    }
}
