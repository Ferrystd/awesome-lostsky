<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ProductKind;
use app\enum\TransactionType;
use app\model\BenefitPackage;
use app\model\TeamCustomer;
use app\model\TeamCustomerSender;
use app\model\TeamProduct;
use app\model\TeamServiceEntitlement;
use think\exception\HttpException;

final class ManualEntitlementGrant
{
    public function personalHistory(int $teamId, int $actorEntityId, string $keyword = '', int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamServiceEntitlement::where('team_id', $teamId)
            ->where('sender_entity_id', $actorEntityId)
            ->whereNotNull('source_product_id')
            ->whereNull('source_order_id')
            ->whereNull('source_claim_id');

        $keyword = trim($keyword);
        if ($keyword !== '') {
            $query->where(function ($scope) use ($teamId, $keyword) {
                $scope->whereIn('service_id', function ($sub) use ($teamId, $keyword) {
                    $sub->table('team_service')
                        ->where('team_id', $teamId)
                        ->where('name', 'like', "%{$keyword}%")
                        ->field('id');
                })->whereIn('source_product_id', function ($sub) use ($teamId, $keyword) {
                    $sub->table('team_product')
                        ->where('team_id', $teamId)
                        ->where('name', 'like', "%{$keyword}%")
                        ->field('id');
                }, 'OR')->whereIn('customer_id', function ($sub) use ($teamId, $keyword) {
                    $sub->table('team_customer c')
                        ->join('entity e', "e.entityable_type = 'teamCustomer' AND e.entityable_id = c.id")
                        ->join('team_entity_profile p', 'p.entity_id = e.id')
                        ->where('c.team_id', $teamId)
                        ->where('p.name', 'like', "%{$keyword}%")
                        ->field('c.id');
                }, 'OR');
            });
        }

        $paginator = $query->with(['service', 'customer.profile', 'sourceProduct'])
            ->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $list = array_map(static function (TeamServiceEntitlement $row): array {
            $customer = $row->customer;
            $service = $row->service;
            $product = $row->sourceProduct;
            return [
                'id' => (int) $row->id,
                'create_time' => (int) $row->create_time,
                'granted_quantity' => (string) $row->granted_quantity,
                'consumed_quantity' => (string) $row->consumed_quantity,
                'available_quantity' => (string) $row->available_quantity,
                'unit_name' => (string) $row->unit_name,
                'expire_time' => (int) $row->expire_time,
                'is_expired' => (bool) $row->is_expired,
                'is_exhausted' => (bool) $row->is_exhausted,
                'customer' => [
                    'id' => (int) ($customer?->id ?? $row->customer_id),
                    'name' => (string) ($customer?->nickname ?? ''),
                    'avatar' => $customer?->avatar ?: null,
                ],
                'service' => [
                    'id' => (int) ($service?->id ?? $row->service_id),
                    'name' => (string) ($service?->name ?? ''),
                ],
                'product' => [
                    'id' => (int) ($product?->id ?? $row->source_product_id),
                    'name' => (string) ($product?->name ?? ''),
                ],
            ];
        }, $paginator->getCollection()->all());

        return [
            'total' => $paginator->total(),
            'list' => $list,
            'page' => $paginator->currentPage(),
            'limit' => $paginator->listRows(),
        ];
    }

    public function options(int $teamId, array $actingEntity, int $actorEntityId, bool $personal = false): array
    {
        $products = TeamProduct::where('team_id', $teamId)
            ->whereIn('kind', [ProductKind::ServiceBundle->value, ProductKind::Redeemable->value])
            ->where('is_active', 1)
            ->whereNotNull('benefit_package_id')
            ->order('id', 'desc')
            ->select()
            ->all();
        $packageIds = array_values(array_unique(array_filter(array_map(
            static fn (TeamProduct $product): int => (int) $product->benefit_package_id,
            $products
        ))));
        $activePackageIds = $packageIds
            ? array_map('intval', BenefitPackage::whereIn('id', $packageIds)->where('is_active', 1)->column('id'))
            : [];
        $customers = TeamCustomer::where('team_id', $teamId)->where('is_blocked', 0);
        if ($personal || ($actingEntity['type'] ?? '') !== 'team') {
            $bindingCustomerIds = TeamCustomerSender::where('team_id', $teamId)
                ->where('entity_id', $actorEntityId)
                ->column('customer_id');
            $customers->where(function ($scope) use ($actorEntityId, $bindingCustomerIds) {
                $scope->where('assignee_entity_id', $actorEntityId);
                if ($bindingCustomerIds) $scope->whereIn('id', $bindingCustomerIds, 'OR');
            });
        }
        $customers = $customers->with(['profile'])
            ->visible(['id', 'nickname', 'avatar', 'description', 'is_blocked'])
            ->order('id', 'asc')
            ->select()
            ->toArray();

        return [
            'products' => array_values(array_map(static fn (TeamProduct $product): array => [
                'id' => (int) $product->id,
                'name' => (string) $product->name,
                'price' => (string) $product->price,
            ], array_filter(
                $products,
                static fn (TeamProduct $product): bool => in_array((int) $product->benefit_package_id, $activePackageIds, true)
            ))),
            'customers' => $customers,
            'entities' => app(CustomerAssignment::class)->options($teamId),
            'sync_transaction' => (bool) (app(TeamSetting::class)->internal($teamId, 'shop')['sync_manual_entitlement_transaction'] ?? false),
        ];
    }

    public function grant(int $teamId, int $actorEntityId, array $data, bool $personal = false): array
    {
        $productId = (int) ($data['product_id'] ?? 0);
        $customerId = (int) ($data['customer_id'] ?? 0);
        $quantity = (int) ($data['quantity'] ?? 1);
        if ($productId < 1 || $customerId < 1) {
            throw new HttpException(422, '请选择服务套餐商品和顾客');
        }
        if ($quantity < 1 || $quantity > 999) {
            throw new HttpException(422, '赋予份数必须在 1 到 999 之间');
        }

        return \think\facade\Db::transaction(function () use ($teamId, $actorEntityId, $data, $productId, $customerId, $quantity, $personal) {
            $product = TeamProduct::where('team_id', $teamId)->lock(true)->find($productId);
            if (!$product || !(bool) $product->is_active || !in_array($product->enumCase('kind'), [ProductKind::ServiceBundle, ProductKind::Redeemable], true)) {
                throw new HttpException(422, '服务套餐商品不存在或已停用');
            }

            $customer = app(CustomerAssignment::class)->customer($teamId, $customerId, true);
            if ((bool) $customer->is_blocked || !$customer->root_entity_id) {
                throw new HttpException(422, '顾客不可用');
            }

            if ($personal && !$this->servesCustomer($teamId, $actorEntityId, $customer)) {
                throw new HttpException(403, '只能为当前 Entity 接待的顾客赋予权益');
            }

            $assignedSenderId = app(CustomerAssignment::class)->sender($customer, $teamId);
            $defaultTeamSenderId = app(Entity::class)->idBySubject('team', $teamId);
            $senderEntityId = $personal
                ? $actorEntityId
                : ($assignedSenderId ?: (int) ($data['sender_entity_id'] ?? $defaultTeamSenderId));
            $senderEntityId = $senderEntityId > 0
                ? (int) app(Entity::class)->assertInTeam($senderEntityId, $teamId)->id
                : null;
            $csEntityId = (int) ($data['cs_entity_id'] ?? 0);
            $csEntityId = $csEntityId > 0
                ? (int) app(Entity::class)->assertInTeam($csEntityId, $teamId)->id
                : null;

            $entitlementIds = app(BenefitFulfillment::class)->grantProduct(
                $product,
                $customer,
                $quantity,
                $senderEntityId,
                $csEntityId
            );

            $settings = app(TeamSetting::class)->internal($teamId, 'shop');
            $shouldSync = (bool) ($settings['sync_manual_entitlement_transaction'] ?? false)
                && app(AbilityResolver::class)->available($teamId, 'transaction');
            $transactionId = null;
            if ($shouldSync) {
                $totalPrice = app(BenefitPackagePricing::class)->fromCents(
                    app(BenefitPackagePricing::class)->toCents((string) $product->price) * $quantity
                );
                $transactionId = app(Transaction::class)->create($teamId, [
                    'type' => TransactionType::ServicePackageReceipt,
                    'customer_id' => $customerId,
                    'sender_entity_id' => $senderEntityId,
                    'cs_entity_id' => $csEntityId,
                    'total_price' => $totalPrice,
                    'cash' => $totalPrice,
                    'prepaid' => '0.00',
                    'memo' => "手动赋予权益：{$product->name} × {$quantity}",
                ]);
            }

            return [
                'entitlement_ids' => $entitlementIds,
                'entitlement_count' => count($entitlementIds),
                'transaction_id' => $transactionId,
                'order_id' => null,
            ];
        });
    }

    private function servesCustomer(int $teamId, int $actorEntityId, TeamCustomer $customer): bool
    {
        return (int) ($customer->assignee_entity_id ?? 0) === $actorEntityId
            || (bool) TeamCustomerSender::where('team_id', $teamId)
                ->sender($actorEntityId, (int) $customer->id)
                ->find();
    }
}
