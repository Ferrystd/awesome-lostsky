<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ServiceAdjustmentStatus;
use app\enum\ServiceAssignmentOfferStatus;
use app\enum\ServiceCancelStatus;
use app\enum\ServiceStatus;
use app\model\Entity;
use app\model\TeamServiceAdjustment;
use app\model\TeamServiceAssignmentOffer;
use app\model\TeamServiceCancelRequest;
use app\model\TeamServiceEntitlement;
use app\model\TeamServiceEvent;
use app\model\TeamServiceHandler;
use app\model\TeamServiceInstance;
use app\model\TeamService;
use think\exception\HttpException;
use think\facade\Db;

class ServiceRedemption
{
    private const MONEY_FIELDS = ['total_price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'];

    public function customerList(int $teamId, int $customerId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamServiceEntitlement::where('team_id', $teamId)->where('customer_id', $customerId);
        if (!empty($filters['available'])) {
            $query->whereRaw('granted_quantity > reserved_quantity + consumed_quantity');
        }
        $paginator = $query->with(['service'])->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        return [
            'total' => $paginator->total(),
            'list' => array_map($this->customerEntitlementResponse(...), $paginator->getCollection()->toArray()),
            'page' => $paginator->currentPage(),
            'limit' => $paginator->listRows(),
        ];
    }

    public function customerGet(int $teamId, int $customerId, int $id): array
    {
        $entitlement = TeamServiceEntitlement::where('team_id', $teamId)
            ->where('customer_id', $customerId)->with(['service'])->find($id);
        if (!$entitlement) throw new HttpException(404, '服务权益不存在');
        $result = $this->customerEntitlementResponse($entitlement->toArray());
        $instances = TeamServiceInstance::where('entitlement_id', $id)
            ->with(['cancelRequests.requester.profile', 'adjustments'])
            ->order('id', 'desc')->select()->toArray();
        $this->attachEntities($instances, [
            'handler' => 'handler_entity_id',
            'sender' => 'sender_entity_id',
            'cs' => 'cs_entity_id',
        ]);
        foreach ($instances as &$instance) {
            $model = TeamServiceInstance::find((int) $instance['id']);
            $instance['redemption_fields'] = $model
                ? app(ServiceRedemptionField::class)->fieldsForInstance($model, true)
                : [];
            $instance['redemption_resources'] = $model
                ? app(ServiceRedemptionField::class)->resourcesForInstance($model, true)
                : [];
            if ($model) $this->attachStatus($instance, $model);
        }
        $result['instances'] = array_map($this->customerInstance(...), $instances);
        $result['redemption_fields'] = app(ServiceRedemptionField::class)->fieldsForService(
            $teamId,
            (int) $entitlement->service_id,
            true
        );
        $result['allow_open_dispatch'] = (bool) app(TeamSetting::class)->internal($teamId, 'service')['allow_customer_open_dispatch'];
        $result['dispatch_available'] = true;
        $offers = TeamServiceAssignmentOffer::where('team_id', $teamId)
            ->where('customer_id', $customerId)->where('entitlement_id', $id)
            ->with(['targetHandler.profile'])->order('id', 'desc')->select()->toArray();
        foreach ($offers as &$offer) {
            $offer['instance'] = !empty($offer['service_instance_id'])
                ? TeamServiceInstance::find((int) $offer['service_instance_id'])?->toArray() : null;
            $resources = app(ServiceRedemptionField::class)->resourcesForValues(
                $teamId,
                (int) $entitlement->service_id,
                $offer['quantity'],
                $entitlement->quantity_step,
                is_array($offer['field_values'] ?? null) ? $offer['field_values'] : [],
                true
            );
            $offer['redemption_resources'] = $resources;
            $offer['redemption_fields'] = $resources[0]['redemption_fields'] ?? [];
        }
        $result['assignment_offers'] = array_map(function (array $offer): array {
            $row = $this->customerFields($offer, 'id entitlement_id service_instance_id target_handler_entity_id quantity total_price status memo decision_reason decided_at create_time update_time redemption_fields redemption_resources');
            $row['status'] = $this->customerStatus(ServiceAssignmentOfferStatus::class, $offer['status']);
            $row['target_handler'] = $this->customerEntity($offer['targetHandler'] ?? null);
            $row['instance'] = isset($offer['instance']) ? $this->customerInstance($offer['instance']) : null;
            return $row;
        }, $offers);
        return $result;
    }

    private function customerFields(array $row, string $fields): array
    {
        return array_intersect_key($row, array_flip(explode(' ', $fields)));
    }

    private function customerStatus(string $enum, int|string $status): int
    {
        foreach ($enum::cases() as $case) {
            if ($status === $case->value() || (string) $status === (string) $case->value) return $case->value;
        }
        throw new \LogicException('Unknown customer service status');
    }

    private function customerEntity(?array $entity): ?array
    {
        if ($entity === null) return null;
        $row = $this->customerFields($entity, 'id entity_id slug name avatar type');
        if (isset($entity['profile'])) $row['profile'] = $this->customerFields($entity['profile'], 'name avatar');
        return $row;
    }

    private function customerEntitlementResponse(array $entitlement): array
    {
        $row = $this->customerFields($entitlement, 'id service_id unit_name quantity_step granted_quantity reserved_quantity consumed_quantity available_quantity total_price expire_time is_expired is_exhausted unused_auto_complete_due_at create_time update_time');
        $row['service'] = isset($entitlement['service']) ? $this->customerFields($entitlement['service'], 'id name description unit_name quantity_step is_active') : null;
        return $row;
    }

    private function customerInstance(array $instance): array
    {
        $row = $this->customerFields($instance, 'id entitlement_id ordinal quantity status status_code status_label total_price expire_time is_expired memo handler_entity_id started_at completed_at completion_requested_at completion_due_at completion_rejected_at completion_rejection_reason settlement_kind create_time update_time redemption_fields redemption_resources');
        $row['status'] = $this->customerStatus(ServiceStatus::class, $instance['status']);
        $row['handler'] = $this->customerEntity($instance['handler'] ?? null);
        $row['cancel_requests'] = array_map(function (array $request): array {
            $result = $this->customerFields($request, 'id service_instance_id reason status decision_reason create_time update_time');
            $result['status'] = $this->customerStatus(ServiceCancelStatus::class, $request['status']);
            $result['requester'] = $this->customerEntity($request['requester'] ?? null);
            return $result;
        }, $instance['cancelRequests'] ?? $instance['cancel_requests'] ?? []);
        $row['adjustments'] = array_map(fn (array $adjustment): array => array_replace($this->customerFields($adjustment, 'id service_instance_id name quantity unit_price total_price status memo decided_at create_time update_time'), ['status' => $this->customerStatus(ServiceAdjustmentStatus::class, $adjustment['status'])]), $instance['adjustments'] ?? []);
        return $row;
    }

    public function handlers(int $teamId, int $customerId, int $id): array
    {
        $entitlement = $this->customerEntitlement($teamId, $customerId, $id);
        return $this->handlerRows($teamId, (int) $entitlement->service_id);
    }

    public function createOffer(
        int $teamId,
        int $customerId,
        int $entitlementId,
        mixed $quantity,
        int $handlerEntityId,
        string $memo,
        array $fieldValues,
        int $actorEntityId,
        string $idempotencyKey = ''
    ): int {
        $idempotencyKey = trim($idempotencyKey);
        if (strlen($idempotencyKey) > 100) throw new HttpException(422, 'Idempotency-Key 不能超过 100 个字符');
        if ($idempotencyKey !== '') {
            $existing = TeamServiceAssignmentOffer::where('team_id', $teamId)
                ->where('holder_entity_id', $actorEntityId)->where('idempotency_key', $idempotencyKey)->find();
            if ($existing) return (int) $existing->id;
        }
        return Db::transaction(function () use (
            $teamId, $customerId, $entitlementId, $quantity, $handlerEntityId,
            $memo, $fieldValues, $actorEntityId, $idempotencyKey
        ) {
            $entitlement = $this->lockedEntitlement($teamId, $entitlementId);
            $this->assertCustomerOwns($entitlement, $customerId, $actorEntityId);
            if ($entitlement->is_expired) throw new HttpException(422, '服务权益已过期');
            $this->assertHandler($teamId, (int) $entitlement->service_id, $handlerEntityId);
            $quantityRules = app(ServiceQuantity::class);
            $normalized = $quantityRules->normalize(
                $quantity,
                $entitlement->quantity_step
            );
            $quantityMinor = app(ServiceQuantity::class)->toMinor($normalized);
            if ($quantityMinor > app(ServiceQuantity::class)->toMinor($entitlement->available_quantity)) {
                throw new HttpException(409, '可用服务额度不足');
            }
            $fields = app(ServiceRedemptionField::class)->validateResourcesForService(
                $teamId,
                (int) $entitlement->service_id,
                'customer',
                $normalized,
                $entitlement->quantity_step,
                $fieldValues
            );
            $money = $this->allocateMoney($entitlement, $quantityMinor);
            $offer = new TeamServiceAssignmentOffer;
            $offer->save([
                'team_id' => $teamId,
                'service_id' => $entitlement->service_id,
                'customer_id' => $customerId,
                'holder_entity_id' => $actorEntityId,
                'entitlement_id' => $entitlementId,
                'target_handler_entity_id' => $handlerEntityId,
                'quantity' => $normalized,
                'status' => ServiceAssignmentOfferStatus::Pending,
                'memo' => trim($memo) ?: null,
                'field_values' => $fields ?: null,
                'idempotency_key' => $idempotencyKey !== '' ? $idempotencyKey : null,
            ] + $money);
            $this->reserve($entitlement, $quantityMinor);
            return (int) $offer->id;
        });
    }

    public function withdrawOffer(int $teamId, int $customerId, int $actorEntityId, int $id, string $reason = ''): void
    {
        Db::transaction(function () use ($teamId, $customerId, $actorEntityId, $id, $reason) {
            [$entitlement, $offer] = $this->lockedOffer($teamId, $id);
            if ((int) $offer->customer_id !== $customerId || (int) $offer->holder_entity_id !== $actorEntityId) {
                throw new HttpException(403, '只能取消当前 Customer Entity 发起的邀请');
            }
            if ($offer->enumCase('status') === ServiceAssignmentOfferStatus::Withdrawn) return;
            if ($offer->enumCase('status') !== ServiceAssignmentOfferStatus::Pending) throw new HttpException(409, '邀请已处理，不能取消');
            $offer->save([
                'status' => ServiceAssignmentOfferStatus::Withdrawn,
                'decided_by_entity_id' => $actorEntityId,
                'decision_reason' => trim($reason) ?: null,
                'decided_at' => time(),
            ]);
            $this->release($entitlement, app(ServiceQuantity::class)->toMinor($offer->quantity));
        });
    }

    public function assignmentOffers(int $teamId, int $actorEntityId, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $paginator = TeamServiceAssignmentOffer::where('team_id', $teamId)
            ->where('target_handler_entity_id', $actorEntityId)
            ->where('status', ServiceAssignmentOfferStatus::Pending->value)
            ->with(['service', 'customer.profile', 'entitlement'])
            ->order('id', 'asc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $list = $paginator->getCollection()->toArray();
        foreach ($list as &$offer) $this->attachOfferFields($offer);
        return ['total' => $paginator->total(), 'list' => $list, 'page' => $page, 'limit' => $limit];
    }

    public function assignmentOffer(int $teamId, int $actorEntityId, int $id): array
    {
        $offer = TeamServiceAssignmentOffer::where('team_id', $teamId)
            ->where('target_handler_entity_id', $actorEntityId)
            ->with(['service', 'customer.profile', 'entitlement'])->find($id);
        if (!$offer) throw new HttpException(404, '接单邀请不存在');
        $result = $offer->toArray();
        $this->attachOfferFields($result);
        return $result;
    }

    public function acceptOffer(int $teamId, int $actorEntityId, int $id, array $fieldValues = []): int
    {
        return Db::transaction(function () use ($teamId, $actorEntityId, $id, $fieldValues) {
            [$entitlement, $offer] = $this->lockedOffer($teamId, $id);
            if ((int) $offer->target_handler_entity_id !== $actorEntityId) throw new HttpException(403, '该邀请不属于当前 Entity');
            if ($offer->enumCase('status') === ServiceAssignmentOfferStatus::Accepted) return (int) $offer->service_instance_id;
            if ($offer->enumCase('status') !== ServiceAssignmentOfferStatus::Pending) throw new HttpException(409, '邀请已失效');
            $this->assertHandler($teamId, (int) $offer->service_id, $actorEntityId);
            app(ServiceRedemptionField::class)->validateResourcesForService(
                $teamId,
                (int) $offer->service_id,
                'manager',
                $offer->quantity,
                $entitlement->quantity_step,
                $fieldValues
            );
            $ordinal = (int) TeamServiceInstance::where('entitlement_id', $entitlement->id)->max('ordinal') + 1;
            $instance = new TeamServiceInstance;
            $instance->save([
                'team_id' => $teamId,
                'service_id' => $offer->service_id,
                'customer_id' => $offer->customer_id,
                'holder_entity_id' => $offer->holder_entity_id,
                'entitlement_id' => $entitlement->id,
                'source_product_id' => $entitlement->source_product_id,
                'source_order_id' => $entitlement->source_order_id,
                'source_claim_id' => $entitlement->source_claim_id,
                'ordinal' => $ordinal,
                'quantity' => $offer->quantity,
                'status' => ServiceStatus::Processing,
                'handler_entity_id' => $actorEntityId,
                'sender_entity_id' => $entitlement->sender_entity_id,
                'cs_entity_id' => $entitlement->cs_entity_id,
                'total_price' => $offer->total_price,
                'cost' => $offer->cost,
                'handler_cut' => $offer->handler_cut,
                'sender_cut' => $offer->sender_cut,
                'cs_cut' => $offer->cs_cut,
                'team_cut' => $offer->team_cut,
                'expire_time' => $entitlement->expire_time,
                'auto_complete_after_minutes' => $this->serviceAutoCompleteAfterMinutes((int) $offer->service_id),
                'started_at' => time(),
                'memo' => $offer->memo,
            ]);
            app(ServiceRedemptionField::class)->saveResourcesForStage(
                $instance,
                'customer',
                is_array($offer->field_values) ? $offer->field_values : []
            );
            app(ServiceRedemptionField::class)->saveResourcesForStage($instance, 'manager', $fieldValues);
            $offer->save([
                'status' => ServiceAssignmentOfferStatus::Accepted,
                'service_instance_id' => $instance->id,
                'decided_by_entity_id' => $actorEntityId,
                'decided_at' => time(),
            ]);
            $this->event((int) $instance->id, $actorEntityId, 'invite_accepted', null, $actorEntityId, ['offer_id' => $offer->id]);
            return (int) $instance->id;
        });
    }

    public function rejectOffer(int $teamId, int $actorEntityId, int $id, string $reason = ''): void
    {
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $reason) {
            [$entitlement, $offer] = $this->lockedOffer($teamId, $id);
            if ((int) $offer->target_handler_entity_id !== $actorEntityId) throw new HttpException(403, '该邀请不属于当前 Entity');
            if ($offer->enumCase('status') === ServiceAssignmentOfferStatus::Rejected) return;
            if ($offer->enumCase('status') !== ServiceAssignmentOfferStatus::Pending) throw new HttpException(409, '邀请已失效');
            $offer->save([
                'status' => ServiceAssignmentOfferStatus::Rejected,
                'decided_by_entity_id' => $actorEntityId,
                'decision_reason' => trim($reason) ?: null,
                'decided_at' => time(),
            ]);
            $this->release($entitlement, app(ServiceQuantity::class)->toMinor($offer->quantity));
        });
    }

    public function start(
        int $teamId,
        int $customerId,
        int $entitlementId,
        mixed $quantity,
        int $handlerEntityId,
        string $memo,
        array $fieldValues,
        int $actorEntityId
    ): int {
        return Db::transaction(function () use (
            $teamId,
            $customerId,
            $entitlementId,
            $quantity,
            $handlerEntityId,
            $memo,
            $fieldValues,
            $actorEntityId
        ) {
            if ($handlerEntityId > 0) throw new HttpException(422, '指定接单人请改用接单邀请');
            $entitlement = $this->lockedEntitlement($teamId, $entitlementId);
            $this->assertCustomerOwns($entitlement, $customerId, $actorEntityId);
            if ($entitlement->is_expired) throw new HttpException(422, '服务权益已过期');
            $quantityRules = app(ServiceQuantity::class);
            $normalized = $quantityRules->normalize(
                $quantity,
                $entitlement->quantity_step
            );
            $quantityMinor = app(ServiceQuantity::class)->toMinor($normalized);
            if ($quantityMinor > app(ServiceQuantity::class)->toMinor($entitlement->available_quantity)) {
                throw new HttpException(409, '可用服务额度不足');
            }
            if (!(bool) app(TeamSetting::class)->internal($teamId, 'service')['allow_customer_open_dispatch']) {
                throw new HttpException(422, '当前团队未开放公开召唤接单人');
            }
            $money = $this->allocateMoney($entitlement, $quantityMinor);
            $ordinal = (int) TeamServiceInstance::where('entitlement_id', $entitlementId)->max('ordinal') + 1;
            $instance = new TeamServiceInstance;
            $instance->save([
                'team_id' => $teamId,
                'service_id' => $entitlement->service_id,
                'customer_id' => $customerId,
                'holder_entity_id' => $entitlement->holder_entity_id,
                'entitlement_id' => $entitlementId,
                'source_product_id' => $entitlement->source_product_id,
                'source_order_id' => $entitlement->source_order_id,
                'source_claim_id' => $entitlement->source_claim_id,
                'ordinal' => $ordinal,
                'quantity' => $normalized,
                'status' => ServiceStatus::Processing,
                'handler_entity_id' => null,
                'sender_entity_id' => $entitlement->sender_entity_id,
                'cs_entity_id' => $entitlement->cs_entity_id,
                'expire_time' => $entitlement->expire_time,
                'auto_complete_after_minutes' => $this->serviceAutoCompleteAfterMinutes((int) $entitlement->service_id),
                'started_at' => null,
                'memo' => trim($memo),
            ] + $money);
            app(ServiceRedemptionField::class)->saveResourcesForStage($instance, 'customer', $fieldValues);
            $this->reserve($entitlement, $quantityMinor);
            $this->event((int) $instance->id, $actorEntityId, 'opened', null, null, [
                'quantity' => $normalized,
                'memo' => trim($memo),
            ]);
            return (int) $instance->id;
        });
    }

    public function restart(
        int $teamId,
        int $customerId,
        int $id,
        int $handlerEntityId,
        string $memo,
        array $fieldValues,
        int $actorEntityId
    ): void {
        Db::transaction(function () use ($teamId, $customerId, $id, $handlerEntityId, $memo, $fieldValues, $actorEntityId) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            $this->assertCustomerOwns($entitlement, $customerId, $actorEntityId);
            if ($instance->enumCase('status') !== ServiceStatus::Unredeemed) {
                throw new HttpException(409, '只有已取消的履约切片可以重新发起');
            }
            if ($entitlement->is_expired) throw new HttpException(422, '服务权益已过期');
            $quantityMinor = app(ServiceQuantity::class)->toMinor($instance->quantity);
            if ($quantityMinor > app(ServiceQuantity::class)->toMinor($entitlement->available_quantity)) {
                throw new HttpException(409, '可用服务额度不足');
            }
            $this->assertHandler($teamId, (int) $instance->service_id, $handlerEntityId);
            app(ServiceRedemptionField::class)->saveResourcesForStage($instance, 'customer', $fieldValues);
            $money = $this->allocateMoney($entitlement, $quantityMinor);
            $instance->status = ServiceStatus::Processing;
            $instance->handler_entity_id = $handlerEntityId;
            $instance->auto_complete_after_minutes = $this->serviceAutoCompleteAfterMinutes((int) $instance->service_id);
            $instance->started_at = time();
            $instance->completed_at = null;
            $instance->memo = trim($memo);
            foreach ($money as $field => $value) $instance->{$field} = $value;
            $instance->save();
            $this->reserve($entitlement, $quantityMinor);
            $this->event((int) $instance->id, $actorEntityId, 'restarted', null, $handlerEntityId, [
                'quantity' => $instance->quantity,
                'memo' => trim($memo),
            ]);
        });
    }

    public function requestCancel(int $teamId, int $customerId, int $id, string $reason, int $actorEntityId): int
    {
        return Db::transaction(function () use ($teamId, $customerId, $id, $reason, $actorEntityId) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            if ((int) $instance->customer_id !== $customerId || (int) $instance->holder_entity_id !== $actorEntityId) {
                throw new HttpException(403, '只能操作当前 Customer Entity 持有的服务');
            }
            $this->assertProcessing($instance);
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '已有待处理的取消申请');
            $this->assertNoCompletionRequest($instance);
            $request = new TeamServiceCancelRequest;
            $request->save([
                'service_instance_id' => $instance->id,
                'requested_by_entity_id' => $actorEntityId,
                'status' => ServiceCancelStatus::Pending,
                'reason' => trim($reason),
            ]);
            $this->event((int) $instance->id, $actorEntityId, 'cancel_requested', null, null, ['request_id' => $request->id]);
            return (int) $request->id;
        });
    }

    public function list(int $teamId, array $subject, int $actorEntityId, array $filters, int $page = 1, int $limit = 20, bool $forcePersonal = false): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamServiceInstance::where('team_id', $teamId);
        if ($forcePersonal || !$this->canReadAll($teamId, $subject)) $query->where('handler_entity_id', $actorEntityId);
        if (!empty($filters['status'])) $query->where('status', (int) $filters['status']);
        if (!empty($filters['handler_entity_id'])) $query->where('handler_entity_id', (int) $filters['handler_entity_id']);
        $paginator = $query->with(['service', 'customer.profile', 'entitlement'])
            ->order('id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $list = [];
        foreach ($paginator->getCollection() as $model) {
            $row = $model->toArray();
            $this->attachStatus($row, $model);
            $list[] = $row;
        }
        $this->attachEntities($list, ['handler' => 'handler_entity_id']);
        return [
            'total' => $paginator->total(),
            'list' => $list,
            'page' => $paginator->currentPage(),
            'limit' => $paginator->listRows(),
            'capabilities' => [
                'read_all' => $this->canReadAll($teamId, $subject),
                'manage' => $this->canManage($teamId, $subject),
            ],
        ];
    }

    public function get(int $teamId, array $subject, int $actorEntityId, int $id, bool $forcePersonal = false): array
    {
        $instance = TeamServiceInstance::where('team_id', $teamId)
            ->with(['service', 'customer.profile', 'entitlement', 'cancelRequests.requester.profile', 'adjustments'])
            ->find($id);
        if (!$instance) throw new HttpException(404, '履约切片不存在');
        if (($forcePersonal || !$this->canReadAll($teamId, $subject)) && (int) $instance->handler_entity_id !== $actorEntityId) {
            throw new HttpException(403, '无权查看该核销');
        }
        $result = $instance->toArray();
        $this->attachStatus($result, $instance);
        $rows = [&$result];
        $this->attachEntities($rows, [
            'handler' => 'handler_entity_id',
            'sender' => 'sender_entity_id',
            'cs' => 'cs_entity_id',
        ]);
        if (!empty($result['cancel_requests'])) {
            $this->attachEntities($result['cancel_requests'], ['decider' => 'decided_by_entity_id']);
        }
        $result['redemption_fields'] = app(ServiceRedemptionField::class)->fieldsForInstance($instance, false);
        $result['redemption_resources'] = app(ServiceRedemptionField::class)->resourcesForInstance($instance, false);
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
        return $this->handlerRows($teamId, (int) $instance->service_id);
    }

    public function claimable(int $teamId, int $actorEntityId, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $this->assertEligibleHandler($teamId, $actorEntityId);
        $activeServiceIds = array_map('intval', TeamService::where('team_id', $teamId)
            ->where('is_active', 1)->column('id'));
        $restrictedServiceIds = $activeServiceIds
            ? array_map('intval', TeamServiceHandler::whereIn('service_id', $activeServiceIds)
                ->group('service_id')->column('service_id'))
            : [];
        $explicitServiceIds = $activeServiceIds
            ? array_map('intval', TeamServiceHandler::where('entity_id', $actorEntityId)
                ->whereIn('service_id', $activeServiceIds)->column('service_id'))
            : [];
        $serviceIds = array_values(array_unique(array_merge(
            $explicitServiceIds,
            array_diff($activeServiceIds, $restrictedServiceIds)
        )));
        $query = TeamServiceInstance::where('team_id', $teamId)
            ->where('status', ServiceStatus::Processing->value)
            ->whereNull('handler_entity_id');
        if ($serviceIds) $query->whereIn('service_id', $serviceIds);
        else $query->where('id', 0);
        $paginator = $query->with(['service', 'customer.profile', 'entitlement'])
            ->order('id', 'asc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $list = $paginator->getCollection()->toArray();
        foreach ($list as &$instance) $this->attachInstanceFields($instance);
        return [
            'total' => $paginator->total(),
            'list' => $list,
            'page' => $paginator->currentPage(),
            'limit' => $paginator->listRows(),
        ];
    }

    public function claimableGet(int $teamId, int $actorEntityId, int $id): array
    {
        $instance = TeamServiceInstance::where('team_id', $teamId)
            ->where('status', ServiceStatus::Processing->value)->whereNull('handler_entity_id')
            ->with(['service', 'customer.profile', 'entitlement'])->find($id);
        if (!$instance) throw new HttpException(404, '公开任务不存在或已被领取');
        $this->assertHandler($teamId, (int) $instance->service_id, $actorEntityId);
        $result = $instance->toArray();
        $this->attachInstanceFields($result);
        return $result;
    }

    public function claim(int $teamId, int $actorEntityId, int $id, mixed $quantity = null, array $fieldValues = []): int
    {
        return Db::transaction(function () use ($teamId, $actorEntityId, $id, $quantity, $fieldValues) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            $this->assertProcessing($instance);
            if ($instance->handler_entity_id !== null) {
                if ((int) $instance->handler_entity_id === $actorEntityId) return (int) $instance->id;
                throw new HttpException(409, '该任务已被其他接单人领取');
            }
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '该任务正在申请取消');
            $this->assertHandler($teamId, (int) $instance->service_id, $actorEntityId);
            $quantityRules = app(ServiceQuantity::class);
            $requested = $quantity === null || $quantity === '' ? $instance->quantity : $quantity;
            $normalized = $quantityRules->normalize($requested, $entitlement->quantity_step);
            $requestedMinor = $quantityRules->toMinor($normalized);
            $currentMinor = $quantityRules->toMinor($instance->quantity);
            if ($requestedMinor > $currentMinor) throw new HttpException(409, '领取数量不能超过当前公开任务数量');

            $fieldService = app(ServiceRedemptionField::class);
            $fieldService->validateResourcesForService(
                $teamId,
                (int) $instance->service_id,
                'manager',
                $normalized,
                $entitlement->quantity_step,
                $fieldValues
            );
            $remainderId = null;
            if ($requestedMinor < $currentMinor) {
                if (TeamServiceAdjustment::where('service_instance_id', $instance->id)->find()) {
                    throw new HttpException(409, '已有费用调整的任务只能整单领取');
                }
                [$claimedMoney, $remainderMoney] = $this->splitInstanceMoney($instance, $requestedMinor, $currentMinor);
                $remainder = new TeamServiceInstance;
                $remainder->save([
                    'team_id' => $instance->team_id,
                    'service_id' => $instance->service_id,
                    'customer_id' => $instance->customer_id,
                    'holder_entity_id' => $instance->holder_entity_id,
                    'entitlement_id' => $instance->entitlement_id,
                    'source_product_id' => $instance->source_product_id,
                    'source_order_id' => $instance->source_order_id,
                    'source_claim_id' => $instance->source_claim_id,
                    'ordinal' => (int) TeamServiceInstance::where('entitlement_id', $instance->entitlement_id)->max('ordinal') + 1,
                    'quantity' => $quantityRules->fromMinor($currentMinor - $requestedMinor),
                    'status' => ServiceStatus::Processing,
                    'handler_entity_id' => null,
                    'sender_entity_id' => $instance->sender_entity_id,
                    'cs_entity_id' => $instance->cs_entity_id,
                    'expire_time' => $instance->expire_time,
                    'auto_complete_after_minutes' => $instance->auto_complete_after_minutes,
                    'started_at' => null,
                    'memo' => $instance->memo,
                ] + $remainderMoney);
                $claimedResourceCount = $fieldService->resourceCount($normalized, (string) $entitlement->quantity_step);
                $fieldService->splitStageValues($instance, $remainder, 'customer', $claimedResourceCount);
                $fieldService->splitStageValues($instance, $remainder, 'manager', $claimedResourceCount);
                Db::name('team_service_instance')->where('id', $instance->id)->update([
                    'quantity' => $normalized,
                    'handler_entity_id' => $actorEntityId,
                    'started_at' => time(),
                    'update_time' => time(),
                ] + $claimedMoney);
                $remainderId = (int) $remainder->id;
                $instance = TeamServiceInstance::find((int) $instance->id);
                $this->event($remainderId, $actorEntityId, 'split_opened', null, null, [
                    'source_instance_id' => (int) $instance->id,
                    'quantity' => $remainder->quantity,
                ]);
            } else {
                $instance->handler_entity_id = $actorEntityId;
                $instance->started_at = time();
                $instance->save();
            }
            $fieldService->saveResourcesForStage($instance, 'manager', $fieldValues);
            $this->event((int) $instance->id, $actorEntityId, 'claimed', null, $actorEntityId, [
                'quantity' => $normalized,
                'remainder_instance_id' => $remainderId,
            ]);
            return (int) $instance->id;
        });
    }

    public function returnToPool(int $teamId, int $actorEntityId, int $id, string $reason): void
    {
        $reason = trim($reason);
        if ($reason === '') throw new HttpException(422, '请填写退回原因');
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $reason) {
            [, $instance] = $this->lockedPair($teamId, $id);
            $this->assertProcessing($instance);
            if ($instance->handler_entity_id === null) {
                $returned = TeamServiceEvent::where('service_instance_id', $id)
                    ->where('actor_entity_id', $actorEntityId)->where('event_type', 'returned')->find();
                if ($returned) return;
            }
            if ((int) $instance->handler_entity_id !== $actorEntityId) throw new HttpException(403, '只能退回自己当前接取的任务');
            $this->assertNoCompletionRequest($instance);
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '存在待处理取消申请，请先处理取消');
            $instance->handler_entity_id = null;
            $instance->started_at = null;
            $instance->save();
            $this->event((int) $instance->id, $actorEntityId, 'returned', $actorEntityId, null, ['reason' => $reason]);
        });
    }

    public function invalidateOffersForHandlers(int $teamId, int $serviceId, array $entityIds): void
    {
        $entityIds = array_values(array_unique(array_filter(array_map('intval', $entityIds))));
        if (!$entityIds) return;
        $ids = TeamServiceAssignmentOffer::where('team_id', $teamId)->where('service_id', $serviceId)
            ->whereIn('target_handler_entity_id', $entityIds)
            ->where('status', ServiceAssignmentOfferStatus::Pending->value)->column('id');
        foreach ($ids as $id) {
            Db::transaction(function () use ($teamId, $id) {
                [$entitlement, $offer] = $this->lockedOffer($teamId, (int) $id);
                if ($offer->enumCase('status') !== ServiceAssignmentOfferStatus::Pending) return;
                $offer->save([
                    'status' => ServiceAssignmentOfferStatus::Invalidated,
                    'decision_reason' => '接单资格已移除',
                    'decided_at' => time(),
                ]);
                $this->release($entitlement, app(ServiceQuantity::class)->toMinor($offer->quantity));
            });
        }
    }

    public function approveCancel(int $teamId, array $subject, int $actorEntityId, int $id): void
    {
        Db::transaction(function () use ($teamId, $subject, $actorEntityId, $id) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            $this->assertProcessing($instance);
            $manage = $this->canManage($teamId, $subject);
            if (!$manage && (int) $instance->handler_entity_id !== $actorEntityId) {
                throw new HttpException(403, '只有当前接单人或服务管理 Entity 可同意取消');
            }
            if (TeamServiceAdjustment::where('service_instance_id', $id)
                ->where('status', ServiceAdjustmentStatus::Accepted->value)->find()) {
                throw new HttpException(409, '存在已确认的加价费用，暂不能取消该次履约');
            }
            $request = $this->requiredPendingCancel((int) $instance->id);
            $request->save([
                'status' => ServiceCancelStatus::Approved,
                'decided_by_entity_id' => $actorEntityId,
                'decided_at' => time(),
            ]);
            TeamServiceAdjustment::where('service_instance_id', $id)
                ->where('status', ServiceAdjustmentStatus::Pending->value)
                ->update([
                    'status' => ServiceAdjustmentStatus::Cancelled->value,
                    'decided_by_entity_id' => $actorEntityId,
                    'decided_at' => time(),
                ]);
            $oldHandler = $instance->handler_entity_id ? (int) $instance->handler_entity_id : null;
            $instance->completion_requested_at = null;
            $instance->status = ServiceStatus::Unredeemed;
            $instance->handler_entity_id = null;
            $instance->started_at = null;
            $instance->save();
            $this->release($entitlement, app(ServiceQuantity::class)->toMinor($instance->quantity));
            $this->event((int) $instance->id, $actorEntityId, 'cancel_approved', $oldHandler, null, ['request_id' => $request->id]);
        });
    }

    public function rejectCancel(int $teamId, array $subject, int $actorEntityId, int $id, string $reason): void
    {
        $this->assertManage($teamId, $subject);
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $reason) {
            [, $instance] = $this->lockedPair($teamId, $id);
            $this->assertProcessing($instance);
            $request = $this->requiredPendingCancel((int) $instance->id);
            $request->save([
                'status' => ServiceCancelStatus::Rejected,
                'decided_by_entity_id' => $actorEntityId,
                'decision_reason' => trim($reason),
                'decided_at' => time(),
            ]);
            $this->event((int) $instance->id, $actorEntityId, 'cancel_rejected', null, null, [
                'request_id' => $request->id,
                'reason' => trim($reason),
            ]);
        });
    }

    public function reject(int $teamId, array $subject, int $actorEntityId, int $id, string $reason): void
    {
        $this->assertManage($teamId, $subject);
        $reason = trim($reason);
        if ($reason === '') throw new HttpException(422, '请填写驳回原因');
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $reason) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            $this->assertProcessing($instance);
            if (TeamServiceAdjustment::where('service_instance_id', $id)
                ->where('status', ServiceAdjustmentStatus::Accepted->value)->find()) {
                throw new HttpException(409, '存在已确认的加价费用，暂不能驳回该次核销');
            }
            TeamServiceAdjustment::where('service_instance_id', $id)
                ->where('status', ServiceAdjustmentStatus::Pending->value)
                ->update([
                    'status' => ServiceAdjustmentStatus::Cancelled->value,
                    'decided_by_entity_id' => $actorEntityId,
                    'decided_at' => time(),
                ]);
            if ($request = $this->pendingCancel((int) $instance->id, true)) {
                $request->save([
                    'status' => ServiceCancelStatus::Approved,
                    'decided_by_entity_id' => $actorEntityId,
                    'decision_reason' => $reason,
                    'decided_at' => time(),
                ]);
            }
            $oldHandler = $instance->handler_entity_id ? (int) $instance->handler_entity_id : null;
            $instance->completion_requested_at = null;
            $instance->status = ServiceStatus::Unredeemed;
            $instance->handler_entity_id = null;
            $instance->started_at = null;
            $instance->completed_at = null;
            $instance->save();
            $this->release($entitlement, app(ServiceQuantity::class)->toMinor($instance->quantity));
            $this->event((int) $instance->id, $actorEntityId, 'redemption_rejected', $oldHandler, null, [
                'reason' => $reason,
            ]);
        });
    }

    public function reassign(int $teamId, array $subject, int $actorEntityId, int $id, int $handlerEntityId, string $reason): void
    {
        $this->assertManage($teamId, $subject);
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $handlerEntityId, $reason) {
            [, $instance] = $this->lockedPair($teamId, $id);
            $this->assertProcessing($instance);
            if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '待处理取消申请存在时不可改派');
            $this->assertNoCompletionRequest($instance);
            $this->assertHandler($teamId, (int) $instance->service_id, $handlerEntityId);
            $old = $instance->handler_entity_id ? (int) $instance->handler_entity_id : null;
            if ($old === $handlerEntityId) return;
            $instance->handler_entity_id = $handlerEntityId;
            if ($old === null) $instance->started_at = time();
            $instance->save();
            $this->event((int) $instance->id, $actorEntityId, 'reassigned', $old, $handlerEntityId, ['reason' => trim($reason)]);
        });
    }

    public function complete(int $teamId, array $subject, int $actorEntityId, int $id, array $fieldValues = []): void
    {
        $this->assertManage($teamId, $subject);
        $this->completeAuthorized($teamId, $actorEntityId, $id, $fieldValues);
    }

    public function completeOwn(int $teamId, int $actorEntityId, int $id, array $fieldValues = []): void
    {
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $fieldValues) {
            [, $instance] = $this->lockedPair($teamId, $id);
            if ((int) $instance->handler_entity_id !== $actorEntityId) throw new HttpException(403, '只能请求完成当前 Entity 自己接取的核销');
            if ($instance->enumCase('status') === ServiceStatus::Redeemed) return;
            $this->assertProcessing($instance);
            if ($instance->completion_requested_at !== null) return;
            $this->assertCompletionReady($instance);
            app(ServiceRedemptionField::class)->saveResourcesForStage($instance, 'manager', $fieldValues);
            $instance->completion_requested_at = time();
            $instance->save();
            $this->event($id, $actorEntityId, 'completion_requested', null, null, []);
        });
    }

    public function confirmCompletion(int $teamId, int $customerId, int $actorEntityId, int $id): void
    {
        Db::transaction(function () use ($teamId, $customerId, $actorEntityId, $id) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            $this->assertCustomerOwns($entitlement, $customerId, $actorEntityId);
            if ($instance->enumCase('status') === ServiceStatus::Redeemed) return;
            $this->assertProcessing($instance);
            if ($instance->completion_requested_at === null) throw new HttpException(409, '接单人尚未请求结单');
            $this->completeLocked($entitlement, $instance, $actorEntityId, [], false);
        });
    }

    public function rejectCompletion(int $teamId, int $customerId, int $actorEntityId, int $id, string $reason): void
    {
        $reason = trim($reason);
        if ($reason === '') throw new HttpException(422, '请填写拒绝结单原因');
        Db::transaction(function () use ($teamId, $customerId, $actorEntityId, $id, $reason) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            $this->assertCustomerOwns($entitlement, $customerId, $actorEntityId);
            $this->assertProcessing($instance);
            if ($instance->completion_requested_at === null) throw new HttpException(409, '当前没有待确认结单请求');
            $instance->completion_requested_at = null;
            $instance->save();
            $this->event($id, $actorEntityId, 'completion_rejected', null, null, ['reason' => $reason]);
        });
    }

    private function assertNoCompletionRequest(TeamServiceInstance $instance): void
    {
        if ($instance->completion_requested_at !== null) throw new HttpException(409, '结单请求待顾客确认，请先拒绝结单再处理取消或交接');
    }

    private function assertCompletionReady(TeamServiceInstance $instance): void
    {
        if ($instance->handler_entity_id === null) throw new HttpException(409, '任务尚未接单');
        if ($this->pendingCancel((int) $instance->id, true)) throw new HttpException(409, '待处理取消申请存在时不可完成');
        if (TeamServiceAdjustment::where('service_instance_id', $instance->id)
            ->where('status', ServiceAdjustmentStatus::Pending->value)->lock(true)->find()) {
            throw new HttpException(409, '仍有待顾客确认的加价费用');
        }
    }

    private function completeAuthorized(int $teamId, int $actorEntityId, int $id, array $fieldValues, ?int $requiredHandlerId = null): void
    {
        Db::transaction(function () use ($teamId, $actorEntityId, $id, $fieldValues, $requiredHandlerId) {
            [$entitlement, $instance] = $this->lockedPair($teamId, $id);
            if ($requiredHandlerId !== null && (int) $instance->handler_entity_id !== $requiredHandlerId) {
                throw new HttpException(403, '只能完成当前 Entity 自己接取的核销');
            }
            if ($instance->enumCase('status') === ServiceStatus::Redeemed) return;
            $this->assertProcessing($instance);
            $this->completeLocked($entitlement, $instance, $actorEntityId, $fieldValues, false);
        });
    }

    public function autoCompleteDue(?int $now = null, int $limit = 100): array
    {
        $now ??= time();
        $limit = max(1, min(1000, $limit));
        $ids = Db::name('team_service_instance')->alias('instance')
            ->leftJoin('team_service_cancel_request cancel_request', 'cancel_request.service_instance_id = instance.id AND cancel_request.status = 1 AND cancel_request.delete_time IS NULL')
            ->leftJoin('team_service_adjustment adjustment', 'adjustment.service_instance_id = instance.id AND adjustment.status = 1 AND adjustment.delete_time IS NULL')
            ->where('instance.status', ServiceStatus::Processing->value)
            ->whereNotNull('instance.handler_entity_id')
            ->whereNotNull('instance.completion_requested_at')
            ->whereNotNull('instance.auto_complete_after_minutes')
            ->whereNull('cancel_request.id')
            ->whereNull('adjustment.id')
            ->whereRaw('instance.completion_requested_at + instance.auto_complete_after_minutes * 60 <= :now', ['now' => $now])
            ->order('instance.completion_requested_at', 'asc')->limit($limit)->column('instance.id');

        $completed = 0;
        $failed = 0;
        foreach ($ids as $id) {
            try {
                $didComplete = Db::transaction(function () use ($id, $now): bool {
                    $reference = TeamServiceInstance::find((int) $id);
                    if (!$reference) return false;
                    [$entitlement, $instance] = $this->lockedPair((int) $reference->team_id, (int) $id);
                    if ($instance->enumCase('status') !== ServiceStatus::Processing
                        || $instance->handler_entity_id === null
                        || $instance->completion_requested_at === null
                        || $instance->auto_complete_after_minutes === null
                        || (int) $instance->completion_requested_at + (int) $instance->auto_complete_after_minutes * 60 > $now
                        || $this->pendingCancel((int) $instance->id, true)
                        || TeamServiceAdjustment::where('service_instance_id', $instance->id)
                            ->where('status', ServiceAdjustmentStatus::Pending->value)->lock(true)->find()) {
                        return false;
                    }
                    $this->completeLocked($entitlement, $instance, null, [], true, $now);
                    return true;
                });
                if ($didComplete) $completed++;
            } catch (\Throwable) {
                $failed++;
            }
        }
        return compact('completed', 'failed');
    }

    public function autoCompleteUnusedDue(?int $now = null, int $limit = 100): array
    {
        $now ??= time();
        $ids = TeamServiceEntitlement::whereNotNull('unused_auto_complete_due_at')
            ->where('unused_auto_complete_due_at', '<=', $now)
            ->whereRaw('granted_quantity > reserved_quantity + consumed_quantity')
            ->order('unused_auto_complete_due_at', 'asc')->limit(max(1, min(1000, $limit)))->column('id');
        $completed = 0;
        $failed = 0;
        foreach ($ids as $id) {
            try {
                $didComplete = Db::transaction(function () use ($id, $now): bool {
                    $entitlement = TeamServiceEntitlement::where('id', $id)->lock(true)->find();
                    if (!$entitlement || $entitlement->unused_auto_complete_due_at === null
                        || (int) $entitlement->unused_auto_complete_due_at > $now) return false;
                    $quantity = app(ServiceQuantity::class);
                    $minor = $quantity->toMinor($entitlement->available_quantity);
                    if ($minor === 0) return false;
                    $money = $this->allocateMoney($entitlement, $minor);
                    $instance = new TeamServiceInstance;
                    $instance->save([
                        'team_id' => $entitlement->team_id,
                        'service_id' => $entitlement->service_id,
                        'customer_id' => $entitlement->customer_id,
                        'holder_entity_id' => $entitlement->holder_entity_id,
                        'entitlement_id' => $entitlement->id,
                        'source_product_id' => $entitlement->source_product_id,
                        'source_order_id' => $entitlement->source_order_id,
                        'source_claim_id' => $entitlement->source_claim_id,
                        'ordinal' => (int) TeamServiceInstance::where('entitlement_id', $id)->max('ordinal') + 1,
                        'quantity' => $quantity->fromMinor($minor),
                        'status' => ServiceStatus::Redeemed,
                        'handler_entity_id' => null,
                        'sender_entity_id' => $entitlement->sender_entity_id,
                        'cs_entity_id' => $entitlement->cs_entity_id,
                        'expire_time' => $entitlement->expire_time,
                        'settlement_kind' => 'unused',
                        'completed_at' => $now,
                    ] + $money);
                    $transId = null;
                    if (app(AbilityResolver::class)->available((int) $entitlement->team_id, 'transaction')) {
                        $settledMoney = $money;
                        $settledMoney['handler_cut'] = '0.00';
                        $settledMoney['team_cut'] = $this->fromCents($this->toCents($money['team_cut']) + $this->toCents($money['handler_cut']));
                        $transId = app(Transaction::class)->createUnusedServiceSettlement((int) $entitlement->team_id, $settledMoney + [
                            'sender_entity_id' => $entitlement->sender_entity_id,
                            'cs_entity_id' => $entitlement->cs_entity_id,
                            'customer_id' => $entitlement->customer_id,
                            'service_instance_id' => $instance->id,
                            'trans_at' => $now,
                            'memo' => '未使用权益结单 #' . $instance->id,
                        ]);
                    }
                    $instance->trans_id = $transId;
                    $instance->save();
                    $entitlement->consumed_quantity = $quantity->fromMinor($quantity->toMinor($entitlement->consumed_quantity) + $minor);
                    $entitlement->save();
                    $this->event((int) $instance->id, null, 'unused_auto_completed', null, null, ['transaction_id' => $transId]);
                    return true;
                });
                if ($didComplete) $completed++;
            } catch (\Throwable) {
                $failed++;
            }
        }
        return compact('completed', 'failed');
    }

    private function completeLocked(
        TeamServiceEntitlement $entitlement,
        TeamServiceInstance $instance,
        ?int $actorEntityId,
        array $fieldValues,
        bool $automatic,
        ?int $completedAt = null
    ): void {
        $this->assertCompletionReady($instance);
        if (!$automatic && $instance->completion_requested_at === null) {
            app(ServiceRedemptionField::class)->saveResourcesForStage($instance, 'manager', $fieldValues);
        }
        $completedAt ??= time();
        $transId = null;
        if (app(AbilityResolver::class)->available((int) $instance->team_id, 'transaction')) {
            $transId = app(Transaction::class)->createServiceRedemption((int) $instance->team_id, [
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
                'trans_at' => $completedAt,
                'memo' => '服务核销 #' . $instance->id,
            ]);
            app(ServiceAdjustment::class)->createPerformancesForInstance($instance);
        }
        $quantityMinor = app(ServiceQuantity::class)->toMinor($instance->quantity);
        $reserved = app(ServiceQuantity::class)->toMinor($entitlement->reserved_quantity);
        if ($reserved < $quantityMinor) throw new HttpException(409, '服务权益预占数量异常');
        $entitlement->reserved_quantity = app(ServiceQuantity::class)->fromMinor($reserved - $quantityMinor);
        $entitlement->consumed_quantity = app(ServiceQuantity::class)->fromMinor(
            app(ServiceQuantity::class)->toMinor($entitlement->consumed_quantity) + $quantityMinor
        );
        $entitlement->save();
        $instance->status = ServiceStatus::Redeemed;
        $instance->completed_at = $completedAt;
        $instance->trans_id = $transId;
        $instance->save();
        $this->event(
            (int) $instance->id,
            $actorEntityId,
            $automatic ? 'auto_completed' : 'completed',
            null,
            null,
            ['transaction_id' => $transId, 'automatic' => $automatic]
        );
    }

    private function customerEntitlement(int $teamId, int $customerId, int $id): TeamServiceEntitlement
    {
        $entitlement = TeamServiceEntitlement::where('team_id', $teamId)->where('customer_id', $customerId)->find($id);
        if (!$entitlement) throw new HttpException(404, '服务权益不存在');
        return $entitlement;
    }

    private function lockedEntitlement(int $teamId, int $id): TeamServiceEntitlement
    {
        $entitlement = TeamServiceEntitlement::where('team_id', $teamId)->lock(true)->find($id);
        if (!$entitlement) throw new HttpException(404, '服务权益不存在');
        return $entitlement;
    }

    private function lockedOffer(int $teamId, int $id): array
    {
        $reference = TeamServiceAssignmentOffer::where('team_id', $teamId)->find($id);
        if (!$reference) throw new HttpException(404, '接单邀请不存在');
        $entitlement = $this->lockedEntitlement($teamId, (int) $reference->entitlement_id);
        $offer = TeamServiceAssignmentOffer::where('team_id', $teamId)->lock(true)->find($id);
        if (!$offer || (int) $offer->entitlement_id !== (int) $entitlement->id) {
            throw new HttpException(409, '接单邀请关联已变化');
        }
        return [$entitlement, $offer];
    }

    private function lockedPair(int $teamId, int $instanceId): array
    {
        $reference = TeamServiceInstance::where('team_id', $teamId)->find($instanceId);
        if (!$reference) throw new HttpException(404, '履约切片不存在');
        $entitlement = $this->lockedEntitlement($teamId, (int) $reference->entitlement_id);
        $instance = TeamServiceInstance::where('team_id', $teamId)->lock(true)->find($instanceId);
        if (!$instance || (int) $instance->entitlement_id !== (int) $entitlement->id) {
            throw new HttpException(409, '履约切片关联已变化');
        }
        return [$entitlement, $instance];
    }

    private function assertCustomerOwns(TeamServiceEntitlement $entitlement, int $customerId, int $actorEntityId): void
    {
        if ((int) $entitlement->customer_id !== $customerId || (int) $entitlement->holder_entity_id !== $actorEntityId) {
            throw new HttpException(403, '只能核销当前 Customer Entity 持有的服务权益');
        }
    }

    private function assertProcessing(TeamServiceInstance $instance): void
    {
        if ($instance->enumCase('status') !== ServiceStatus::Processing) throw new HttpException(409, '服务不在核销中');
    }

    private function assertHandler(int $teamId, int $serviceId, int $entityId): void
    {
        $service = TeamService::where('team_id', $teamId)->find($serviceId);
        if (!$service || !(bool) $service->is_active) throw new HttpException(422, '服务不存在或已停用');
        $this->assertEligibleHandler($teamId, $entityId);
        $restricted = TeamServiceHandler::where('service_id', $serviceId)->count() > 0;
        if ($restricted && !TeamServiceHandler::where('service_id', $serviceId)->where('entity_id', $entityId)->find()) {
            throw new HttpException(422, '接单 Entity 不在当前有效接单池中');
        }
    }

    private function assertEligibleHandler(int $teamId, int $entityId): void
    {
        $entity = Entity::find($entityId);
        if (!$entity || !$entity->is_valid) throw new HttpException(422, '接单 Entity 不可用');
        if (!in_array((string) $entity->entityable_type, ['team', 'teamMember', 'teamVirtual'], true)) {
            throw new HttpException(422, '该 Entity 类型不能接单');
        }
        app(\app\service\Entity::class)->assertInTeam($entityId, $teamId);
    }

    private function attachOfferFields(array &$offer): void
    {
        $entitlement = $offer['entitlement'] ?? null;
        $resources = app(ServiceRedemptionField::class)->resourcesForValues(
            (int) $offer['team_id'],
            (int) ($offer['service_id'] ?? $entitlement['service_id'] ?? 0),
            $offer['quantity'] ?? '1',
            $entitlement['quantity_step'] ?? '1',
            is_array($offer['field_values'] ?? null) ? $offer['field_values'] : []
        );
        $offer['redemption_resources'] = $resources;
        $offer['redemption_fields'] = $resources[0]['redemption_fields'] ?? [];
    }

    private function attachInstanceFields(array &$instance): void
    {
        $entitlement = $instance['entitlement'] ?? null;
        $model = TeamServiceInstance::find((int) $instance['id']);
        $instance['redemption_fields'] = $model
            ? app(ServiceRedemptionField::class)->fieldsForInstance($model, false)
            : [];
        $instance['redemption_resources'] = $model
            ? app(ServiceRedemptionField::class)->resourcesForInstance($model, false)
            : [];
        if ($model) $this->attachStatus($instance, $model);
        $instance['unit_name'] = $entitlement['unit_name'] ?? '单位';
    }

    private function attachStatus(array &$row, TeamServiceInstance $instance): void
    {
        $status = $instance->enumCase('status');
        $row['status_code'] = $status->value;
        $row['status_label'] = $status->value();
    }

    private function handlerRows(int $teamId, int $serviceId): array
    {
        $service = TeamService::where('team_id', $teamId)->where('is_active', 1)->find($serviceId);
        if (!$service) return [];
        $handlers = TeamServiceHandler::where('service_id', $serviceId)
            ->with(['subject.profile'])->select();
        if ($handlers->count() > 0) return $handlers->filter(
                static fn ($handler): bool => (bool) $handler->subject?->is_valid
            )->toArray();
        return array_values(array_map(
            static fn (array $entity): array => [
                'entity_id' => (int) $entity['entity_id'],
                'subject' => $entity,
            ],
            array_filter(
                app(\app\service\Entity::class)->optionsForTeam($teamId, true),
                static fn (array $entity): bool => in_array(
                    (string) ($entity['type'] ?? ''),
                    ['team', 'teamMember', 'teamVirtual'],
                    true
                )
            )
        ));
    }

    private function reserve(TeamServiceEntitlement $entitlement, int $quantityMinor): void
    {
        $entitlement->reserved_quantity = app(ServiceQuantity::class)->fromMinor(
            app(ServiceQuantity::class)->toMinor($entitlement->reserved_quantity) + $quantityMinor
        );
        $entitlement->save();
    }

    private function release(TeamServiceEntitlement $entitlement, int $quantityMinor): void
    {
        $reserved = app(ServiceQuantity::class)->toMinor($entitlement->reserved_quantity);
        if ($reserved < $quantityMinor) throw new HttpException(409, '服务权益预占数量异常');
        $entitlement->reserved_quantity = app(ServiceQuantity::class)->fromMinor($reserved - $quantityMinor);
        $entitlement->save();
    }

    private function allocateMoney(TeamServiceEntitlement $entitlement, int $quantityMinor): array
    {
        $availableMinor = app(ServiceQuantity::class)->toMinor($entitlement->available_quantity);
        $remaining = [];
        foreach (self::MONEY_FIELDS as $field) {
            $cents = $this->toCents($entitlement->{$field}) - $this->usedCents((int) $entitlement->id, $field);
            if ($cents < 0) throw new HttpException(422, '历史核销金额与权益余额不一致，请联系管理员核查');
            $remaining[$field] = $this->fromCents($cents);
        }
        if ($this->toCents($remaining['total_price']) !== array_sum(array_map(
            fn(string $field): int => $this->toCents($remaining[$field]),
            ['cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut']
        ))) throw new HttpException(422, '历史核销金额与权益余额不平衡，请联系管理员核查');
        return app(MoneyAllocation::class)->split($remaining, [$quantityMinor, $availableMinor - $quantityMinor])[0];
    }

    private function splitInstanceMoney(TeamServiceInstance $instance, int $claimedMinor, int $totalMinor): array
    {
        $totals = [];
        foreach (self::MONEY_FIELDS as $field) $totals[$field] = $instance->{$field};
        return app(MoneyAllocation::class)->split($totals, [$claimedMinor, $totalMinor - $claimedMinor]);
    }
    private function usedCents(int $entitlementId, string $field): int
    {
        $value = TeamServiceInstance::where('entitlement_id', $entitlementId)
            ->whereIn('status', [ServiceStatus::Processing->value, ServiceStatus::Redeemed->value])
            ->sum($field);
        $offered = TeamServiceAssignmentOffer::where('entitlement_id', $entitlementId)
            ->where('status', ServiceAssignmentOfferStatus::Pending->value)->sum($field);
        return $this->toCents((string) ($value ?: '0.00')) + $this->toCents((string) ($offered ?: '0.00'));
    }

    private function toCents(mixed $amount): int
    {
        $raw = (string) $amount;
        if (!preg_match('/^(\d+)(?:\.(\d{1,2}))?$/D', $raw, $match)) throw new HttpException(422, '金额格式无效');
        return (int) $match[1] * 100 + (int) str_pad($match[2] ?? '', 2, '0');
    }

    private function fromCents(int $cents): string
    {
        return intdiv($cents, 100) . '.' . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
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

    private function event(int $instanceId, ?int $actorId, string $type, ?int $from, ?int $to, array $detail): void
    {
        $event = new TeamServiceEvent;
        $event->save([
            'service_instance_id' => $instanceId,
            'actor_entity_id' => $actorId,
            'event_type' => $type,
            'from_handler_entity_id' => $from,
            'to_handler_entity_id' => $to,
            'detail' => $detail ?: null,
        ]);
    }

    private function serviceAutoCompleteAfterMinutes(int $serviceId): ?int
    {
        $value = TeamService::where('id', $serviceId)->value('auto_complete_after_minutes');
        return $value === null ? null : (int) $value;
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
