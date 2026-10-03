<?php
declare(strict_types=1);

namespace app\service;

use app\enum\LogType;
use app\enum\ServiceAdjustmentStatus;
use app\enum\ServiceCancelStatus;
use app\enum\ServiceStatus;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamServiceAdjustment;
use app\model\TeamServiceCancelRequest;
use app\model\TeamServiceInstance;
use app\model\TeamTransaction;
use think\exception\HttpException;
use think\facade\Db;

class ServiceAdjustment
{
    public function create(int $teamId, array $subject, int $actorEntityId, int $instanceId, array $data): int
    {
        app(PermissionGate::class)->assert($teamId, $subject, [PermissionDictionary::SERVICE_REDEMPTION_MANAGE]);
        return Db::transaction(function () use ($teamId, $actorEntityId, $instanceId, $data) {
            $instance = TeamServiceInstance::where('team_id', $teamId)->lock(true)->find($instanceId);
            if (!$instance) throw new HttpException(404, '履约切片不存在');
            if ($instance->enumCase('status') !== ServiceStatus::Processing) {
                throw new HttpException(409, '只有核销中的履约可以申请加价');
            }
            if ($instance->completion_requested_at !== null) throw new HttpException(409, '结单请求待顾客确认时不能申请加价');
            if (TeamServiceCancelRequest::where('service_instance_id', $instanceId)
                ->where('status', ServiceCancelStatus::Pending->value)->lock(true)->find()) {
                throw new HttpException(409, '存在待处理取消申请时不能申请加价');
            }
            $name = trim((string) ($data['name'] ?? ''));
            if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '费用名称应为 1 至 100 个字符');
            $entitlement = $instance->entitlement;
            if (!$entitlement) throw new HttpException(409, '服务权益不存在');
            $quantityRules = app(ServiceQuantity::class);
            $quantity = $quantityRules->normalize(
                $data['quantity'] ?? 1,
                $entitlement->quantity_step
            );
            $unitPrice = $this->money($data['unit_price'] ?? null, '单价');
            $totalCents = intdiv(
                $this->toCents($unitPrice) * app(ServiceQuantity::class)->toMinor($quantity)
                    + intdiv(ServiceQuantity::FACTOR, 2),
                ServiceQuantity::FACTOR
            );
            if ($totalCents < 1) throw new HttpException(422, '加价总额必须大于零');
            $parts = [];
            foreach (['cost', 'handler_cut', 'sender_cut', 'cs_cut'] as $field) {
                $parts[$field] = $this->money($data[$field] ?? 0, $field);
            }
            $hasDistribution = array_key_exists('handler_cut', $data)
                || array_key_exists('sender_cut', $data)
                || array_key_exists('cs_cut', $data);
            if (!$hasDistribution) {
                $defaults = app(TeamSetting::class)->internal($teamId, 'service');
                $availableCents = max(0, $totalCents - $this->toCents($parts['cost']));
                $parts['handler_cut'] = $this->fromCents($instance->handler_entity_id
                    ? intdiv($availableCents * (int) $defaults['default_adjustment_handler_rate_percent'], 100)
                    : 0);
                $parts['sender_cut'] = $this->fromCents($instance->sender_entity_id
                    ? intdiv($availableCents * (int) $defaults['default_adjustment_sender_rate_percent'], 100)
                    : 0);
                $parts['cs_cut'] = $this->fromCents($instance->cs_entity_id
                    ? intdiv($availableCents * (int) $defaults['default_adjustment_cs_rate_percent'], 100)
                    : 0);
            }
            if (!$instance->sender_entity_id) $parts['sender_cut'] = '0.00';
            if (!$instance->cs_entity_id) $parts['cs_cut'] = '0.00';
            $teamCents = $totalCents;
            foreach ($parts as $value) $teamCents -= $this->toCents($value);
            if ($teamCents < 0) throw new HttpException(422, '加价费用分成超过加价总额');
            $adjustment = new TeamServiceAdjustment;
            $adjustment->save([
                'team_id' => $teamId,
                'service_instance_id' => $instanceId,
                'customer_id' => $instance->customer_id,
                'requested_by_entity_id' => $actorEntityId,
                'name' => $name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $this->fromCents($totalCents),
                'cost' => $parts['cost'],
                'handler_cut' => $parts['handler_cut'],
                'sender_cut' => $parts['sender_cut'],
                'cs_cut' => $parts['cs_cut'],
                'team_cut' => $this->fromCents($teamCents),
                'status' => ServiceAdjustmentStatus::Pending,
                'memo' => trim((string) ($data['memo'] ?? '')),
            ]);
            return (int) $adjustment->id;
        });
    }

    public function accept(int $teamId, int $customerId, int $actorEntityId, int $instanceId, int $adjustmentId): void
    {
        Db::transaction(function () use ($teamId, $customerId, $actorEntityId, $instanceId, $adjustmentId) {
            [$instance, $adjustment] = $this->lockedCustomerAdjustment($teamId, $customerId, $actorEntityId, $instanceId, $adjustmentId);
            if ($adjustment->enumCase('status') === ServiceAdjustmentStatus::Accepted) return;
            if ($adjustment->enumCase('status') !== ServiceAdjustmentStatus::Pending) {
                throw new HttpException(409, '费用调整已失效');
            }
            if ($instance->enumCase('status') !== ServiceStatus::Processing) {
                throw new HttpException(409, '该次服务已不在核销中');
            }
            if (TeamServiceCancelRequest::where('service_instance_id', $instanceId)
                ->where('status', ServiceCancelStatus::Pending->value)->lock(true)->find()) {
                throw new HttpException(409, '取消申请处理期间不能确认加价');
            }
            $receiptId = null;
            if (app(AbilityResolver::class)->available($teamId, 'transaction')) {
                $receiptId = app(Transaction::class)->createServiceAdjustmentReceipt($teamId, [
                    'customer_id' => $customerId,
                    'service_adjustment_id' => $adjustmentId,
                    'total_price' => $adjustment->total_price,
                    'trans_at' => time(),
                    'memo' => '履约加价收款：' . $adjustment->name,
                ]);
            } else {
                $this->consumeWithoutTransaction($customerId, (string) $adjustment->total_price, '履约加价消费');
            }
            $adjustment->save([
                'status' => ServiceAdjustmentStatus::Accepted,
                'decided_by_entity_id' => $actorEntityId,
                'decided_at' => time(),
                'receipt_trans_id' => $receiptId,
            ]);
        });
    }

    public function reject(int $teamId, int $customerId, int $actorEntityId, int $instanceId, int $adjustmentId): void
    {
        Db::transaction(function () use ($teamId, $customerId, $actorEntityId, $instanceId, $adjustmentId) {
            [, $adjustment] = $this->lockedCustomerAdjustment($teamId, $customerId, $actorEntityId, $instanceId, $adjustmentId);
            if ($adjustment->enumCase('status') === ServiceAdjustmentStatus::Cancelled) return;
            if ($adjustment->enumCase('status') !== ServiceAdjustmentStatus::Pending) {
                throw new HttpException(409, '已确认的加价费用不能直接取消');
            }
            $adjustment->save([
                'status' => ServiceAdjustmentStatus::Cancelled,
                'decided_by_entity_id' => $actorEntityId,
                'decided_at' => time(),
            ]);
        });
    }

    public function cancel(int $teamId, array $subject, int $actorEntityId, int $instanceId, int $adjustmentId): void
    {
        app(PermissionGate::class)->assert($teamId, $subject, [PermissionDictionary::SERVICE_REDEMPTION_MANAGE]);
        Db::transaction(function () use ($teamId, $actorEntityId, $instanceId, $adjustmentId) {
            $adjustment = TeamServiceAdjustment::where('team_id', $teamId)
                ->where('service_instance_id', $instanceId)->lock(true)->find($adjustmentId);
            if (!$adjustment) throw new HttpException(404, '费用调整不存在');
            if ($adjustment->enumCase('status') === ServiceAdjustmentStatus::Cancelled) return;
            if ($adjustment->enumCase('status') !== ServiceAdjustmentStatus::Pending) {
                throw new HttpException(409, '顾客已确认的加价费用不能直接取消');
            }
            $adjustment->save([
                'status' => ServiceAdjustmentStatus::Cancelled,
                'decided_by_entity_id' => $actorEntityId,
                'decided_at' => time(),
            ]);
        });
    }

    public function createPerformancesForInstance(TeamServiceInstance $instance): void
    {
        $adjustments = TeamServiceAdjustment::where('service_instance_id', $instance->id)
            ->where('status', ServiceAdjustmentStatus::Accepted->value)
            ->whereNull('performance_trans_id')->lock(true)->select();
        foreach ($adjustments as $adjustment) {
            $transId = app(Transaction::class)->createServiceAdjustmentPerformance((int) $instance->team_id, [
                'handler_entity_id' => $instance->handler_entity_id,
                'sender_entity_id' => $instance->sender_entity_id,
                'cs_entity_id' => $instance->cs_entity_id,
                'customer_id' => $instance->customer_id,
                'service_adjustment_id' => $adjustment->id,
                'total_price' => $adjustment->total_price,
                'cost' => $adjustment->cost,
                'handler_cut' => $adjustment->handler_cut,
                'sender_cut' => $adjustment->sender_cut,
                'cs_cut' => $adjustment->cs_cut,
                'team_cut' => $adjustment->team_cut,
                'trans_at' => time(),
                'memo' => '履约加价业绩：' . $adjustment->name,
            ]);
            $adjustment->performance_trans_id = $transId;
            $adjustment->save();
        }
    }

    private function lockedCustomerAdjustment(
        int $teamId,
        int $customerId,
        int $actorEntityId,
        int $instanceId,
        int $adjustmentId
    ): array {
        $instance = TeamServiceInstance::where('team_id', $teamId)->lock(true)->find($instanceId);
        if (!$instance) throw new HttpException(404, '履约切片不存在');
        if ((int) $instance->customer_id !== $customerId || (int) $instance->holder_entity_id !== $actorEntityId) {
            throw new HttpException(403, '只能处理当前 Customer Entity 的费用调整');
        }
        $adjustment = TeamServiceAdjustment::where('team_id', $teamId)
            ->where('service_instance_id', $instanceId)->where('customer_id', $customerId)
            ->lock(true)->find($adjustmentId);
        if (!$adjustment) throw new HttpException(404, '费用调整不存在');
        return [$instance, $adjustment];
    }

    private function consumeWithoutTransaction(int $customerId, string $amount, string $memo): void
    {
        $balance = TeamCustomerBalance::where('customer_id', $customerId)->lock(true)->find();
        if (!$balance) throw new HttpException(422, '顾客预存款余额不足');
        $balance = (new TeamCustomerBalance)->consume($customerId, $amount);
        if (!$balance) throw new HttpException(422, '顾客预存款余额不足');
        $log = new TeamCustomerBalanceLog;
        $log->save([
            'customer_id' => $customerId,
            'type' => LogType::Consume,
            'amount' => (new TeamCustomerBalance)->negative($amount),
            'balance_after' => $balance->balance,
            'trans_id' => null,
            'memo' => $memo,
        ]);
    }

    private function money(mixed $value, string $name): string
    {
        if (is_int($value)) $value = (string) $value;
        if (is_float($value) && is_finite($value)) $value = number_format($value, 2, '.', '');
        if (!is_string($value) || !preg_match('/^\d{1,10}(?:\.\d{1,2})?$/D', trim($value))) {
            throw new HttpException(422, "{$name}金额格式无效");
        }
        return $this->fromCents($this->toCents(trim($value)));
    }

    private function toCents(string $amount): int
    {
        preg_match('/^(\d+)(?:\.(\d{1,2}))?$/D', $amount, $match);
        return (int) $match[1] * 100 + (int) str_pad($match[2] ?? '', 2, '0');
    }

    private function fromCents(int $cents): string
    {
        return intdiv($cents, 100) . '.' . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
