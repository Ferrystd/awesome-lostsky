<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use app\model\TeamProductHandler;
use app\model\BenefitPackage;
use app\model\RedemptionCampaign;
use app\enum\ProductKind;
use think\exception\HttpException;

class Product
{
    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamProduct::where('team_id', $teamId)->whereNull('parent_product_id');

        if (isset($filters['entity_id'])) {
            $query->where('entity_id', (int) $filters['entity_id']);
        }
        if (isset($filters['is_active'])) {
            $query->where('is_active', (int) $filters['is_active']);
        }
        if (!empty($filters['keyword'])) {
            $keyword = addcslashes($filters['keyword'], '%_');
            $query->where('name', 'like', "%{$keyword}%");
        }

        $paginator = $query->order('id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $list  = $paginator->getCollection()->toArray();
        $this->attachRelations($list, false);

        return app(Pagination::class)->response($paginator, $list);
    }

    public function get(int $teamId, int $id): array
    {
        $product = TeamProduct::where('team_id', $teamId)->find($id);

        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        $result = $product->toArray();
        $rows = [&$result];
        $this->attachRelations($rows, true);
        if ($product->enumCase('kind') === ProductKind::MultiVariant) {
            $result['variants'] = [];
            foreach ($product->variants as $variant) {
                $result['variants'][] = $this->get($teamId, (int) $variant->id);
            }
        }
        if (in_array($product->enumCase('kind'), [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true)) {
            $packageId = $product->enumCase('kind') === ProductKind::ServiceBundle ? (int) $product->benefit_package_id
                : (int) RedemptionCampaign::where('issuer_team_id', $teamId)->find((int) $product->redemption_campaign_id)?->package_id;
            $items = \app\model\BenefitPackageService::where('package_id', $packageId)->whereNotNull('product_id')->order('sort')->select();
            if (!$items->isEmpty()) {
                $result['items'] = [];
                foreach ($items as $item) {
                    $row = array_intersect_key($item->toArray(), array_flip(['product_id', 'unit_price', 'unit_cost', 'unit_handler_cut', 'unit_sender_cut', 'unit_cs_cut']));
                    $row['quantity'] = intdiv(app(ServiceQuantity::class)->toMinor($item->quantity), ServiceQuantity::FACTOR);
                    $result['items'][] = $row;
                }
            }
        }
        if ($product->enumCase('kind') === ProductKind::Redeemable) {
            $item = \app\model\BenefitPackageService::where('package_id', $product->benefit_package_id)->find();
            if (!$item || !$item->service_id) throw new HttpException(422, '核销商品内部配置缺失');
            $service = app(EntitlementManagement::class)->service($teamId, (int) $item->service_id);
            $result['redemption'] = [
                'unit_name' => $service['unit_name'], 'quantity_step' => $service['quantity_step'],
                'auto_complete_after_minutes' => $service['auto_complete_after_minutes'] ?? null,
                'unused_auto_complete_after_minutes' => $service['unused_auto_complete_after_minutes'] ?? null,
                'quantity' => $item->quantity, 'valid_days' => $item->valid_days,
                'handler_entity_ids' => array_map(fn ($handler) => (int) $handler['entity_id'], $service['handlers'] ?? []),
                'redemption_fields' => $service['redemption_fields'],
            ];
        }
        return $result;
    }

    public function create(int $teamId, array $data, bool $canReprice = true): int
    {
        if ((int) ($data['kind'] ?? 1) === ProductKind::MultiVariant->value) {
            return \think\facade\Db::transaction(function () use ($teamId, $data, $canReprice) {
                $id = $this->createRecord($teamId, $this->containerData($data));
                $this->saveVariants($teamId, TeamProduct::find($id), $data['variants'] ?? null, $canReprice);
                return $id;
            });
        }
        if (array_key_exists('variants', $data)) throw new HttpException(422, '只有多规格商品可以配置规格');
        if (array_key_exists('items', $data)) {
            if (!in_array((int) ($data['kind'] ?? 1), [ProductKind::ServiceBundle->value, ProductKind::RedemptionCard->value], true)) throw new HttpException(422, '只有套餐和卡密可以配置商品子项');
            return \think\facade\Db::transaction(fn () => $this->createRecord($teamId, $this->compositionConfiguration($teamId, $data, $canReprice)));
        }
        if ((int) ($data['kind'] ?? 1) !== ProductKind::Redeemable->value) {
            return $this->createRecord($teamId, $data);
        }
        return \think\facade\Db::transaction(function () use ($teamId, $data) {
            $validator = app(\app\validate\Product::class);
            if (!$validator->scene('create')->check($data)) throw new HttpException(422, $validator->getError());
            $configuration = $data['redemption'] ?? null;
            if (!is_array($configuration)) throw new HttpException(422, '核销商品必须提供核销配置');
            if (!empty($data['benefit_package_id']) || !empty($data['redemption_campaign_id'])) {
                throw new HttpException(422, '核销商品的内部权益配置由系统维护');
            }
            try {
                $money = (new TeamProduct)->normalizeMoneyFields($data);
            } catch (\InvalidArgumentException) {
                throw new HttpException(422, '商品金额格式不正确');
            }
            $defaults = app(PersonalPricing::class)->defaults($teamId, $money['price'] ?? 0, $money['cost'] ?? 0);
            $serviceData = array_intersect_key($configuration, array_flip([
                'unit_name', 'quantity_step', 'auto_complete_after_minutes', 'unused_auto_complete_after_minutes', 'handler_entity_ids', 'redemption_fields',
            ]));
            $serviceData = array_merge($serviceData, [
                'name' => $data['name'] ?? '',
                'description' => $data['description'] ?? null,
                'owner_entity_id' => $data['entity_id'] ?? null,
                'default_total_price' => $money['price'] ?? 0,
                'default_cost' => $money['cost'] ?? 0,
                'default_handler_cut' => $money['handler_cut'] ?? $defaults['handler_cut'],
                'default_sender_cut' => $money['sender_cut'] ?? $defaults['sender_cut'],
                'default_cs_cut' => $money['cs_cut'] ?? $defaults['cs_cut'],
            ]);
            $management = app(EntitlementManagement::class);
            $serviceId = $management->saveService($teamId, null, $serviceData);
            // 单商品售价是整份金额，不把分币精度强行除以可为小数的核销额度。
            $data['benefit_package_id'] = $management->savePackage($teamId, null, [
                'name' => $data['name'],
                'owner_entity_id' => $data['entity_id'] ?? null,
                'pricing_mode' => \app\enum\BenefitPricingMode::LegacyEqualSplit->value,
                'services' => [[
                    'service_id' => $serviceId,
                    'quantity' => $configuration['quantity'] ?? 1,
                    'valid_days' => $configuration['valid_days'] ?? app(TeamSetting::class)->internal($teamId, 'service')['default_valid_days'],
                ]],
            ]);
            foreach (['handler_cut', 'sender_cut', 'cs_cut'] as $field) {
                $data[$field] = $money[$field] ?? $defaults[$field];
            }
            $price = app(BenefitPackagePricing::class);
            $teamCents = $price->toCents((string) ($money['price'] ?? '0')) - $price->toCents((string) ($money['cost'] ?? '0'));
            foreach (['handler_cut', 'sender_cut', 'cs_cut'] as $field) $teamCents -= $price->toCents((string) $data[$field]);
            if ($teamCents < 0) throw new HttpException(422, '成本与人员分成不能超过售价');
            $data['team_cut'] = $price->fromCents($teamCents);
            return $this->createRecord($teamId, $data);
        });
    }

    private function compositionConfiguration(int $teamId, array $data, bool $canReprice, int $productId = 0): array
    {
        return \think\facade\Db::transaction(function () use ($teamId, $data, $canReprice, $productId) {
            \app\model\Team::where('id', $teamId)->lock(true)->find();
            if (!is_array($data['items']) || !array_is_list($data['items'])) throw new HttpException(422, '套餐组成必须为列表');
            if (!empty($data['benefit_package_id']) || !empty($data['redemption_campaign_id'])) throw new HttpException(422, '套餐内部配置由系统维护');
            $owner = $data['entity_id'] ?? null;
            if ($owner !== null) app(Entity::class)->assertInTeam((int) $owner, $teamId);
            $tree = app(ProductComposition::class)->inspectStored([
                'id' => $productId, 'team_id' => $teamId, 'entity_id' => $owner, 'kind' => ProductKind::from((int) $data['kind']),
                'is_active' => 1, 'items' => $data['items'],
            ]);
            $pricing = app(BenefitPackagePricing::class);
            $normalized = [];
            $previous = [];
            if ($productId > 0) {
                $existing = TeamProduct::where('team_id', $teamId)->lock(true)->find($productId);
                $packageId = $existing->enumCase('kind') === ProductKind::ServiceBundle ? (int) $existing->benefit_package_id
                    : (int) RedemptionCampaign::where('issuer_team_id', $teamId)->find((int) $existing->redemption_campaign_id)?->package_id;
                foreach (\app\model\BenefitPackageService::where('package_id', $packageId)->whereNotNull('product_id')->order('sort')->order('id')->lock(true)->select() as $saved) {
                    $previous[(int) $saved->product_id][] = $saved->toArray();
                }
            }
            foreach ($data['items'] as $sort => $item) {
                $child = TeamProduct::where('team_id', $teamId)->lock(true)->find((int) $item['product_id']);
                $defaults = app(PersonalPricing::class)->defaults($teamId, $child->price, $child->cost);
                $baseline = ['unit_price' => $child->price, 'unit_cost' => $child->cost];
                foreach (['handler_cut', 'sender_cut', 'cs_cut'] as $field) $baseline['unit_' . $field] = $child->{$field} ?? $defaults[$field];
                if (!empty($previous[(int) $child->id])) {
                    $saved = array_shift($previous[(int) $child->id]);
                    $baseline = array_replace($baseline, array_intersect_key($saved, $baseline));
                }
                $locked = $tree['pricing_locked'] ? $baseline : (!$canReprice
                    ? ($child->entity_id === null ? $baseline : array_diff_key($baseline, array_flip(['unit_price', 'unit_cost'])))
                    : []);
                foreach ($locked as $field => $amount) {
                    if (array_key_exists($field, $item) && (!is_scalar($item[$field]) || $pricing->toCents((string) $item[$field]) !== $pricing->toCents((string) $amount))) {
                        throw new HttpException(422, '当前套餐子项金额不允许调整');
                    }
                }
                $normalized[] = $pricing->normalizeItem(array_merge($baseline, $item, $locked), $sort);
            }
            $package = new BenefitPackage;
            $package->save(['issuer_team_id' => $teamId, 'owner_entity_id' => $owner, 'name' => $data['name'] ?? '',
                'pricing_mode' => \app\enum\BenefitPricingMode::Itemized, 'is_active' => 1]);
            foreach ($normalized as $item) (new \app\model\BenefitPackageService)->save(['package_id' => $package->id] + $item);
            $totals = $pricing->summary($package);
            if ($tree['pricing_locked']) {
                foreach ($totals as $field => $amount) {
                    if (array_key_exists($field, $data) && $data[$field] !== null && $pricing->toCents((string) $data[$field]) !== $pricing->toCents($amount)) {
                        throw new HttpException(422, '嵌套套餐必须使用子项汇总金额');
                    }
                }
            }
            $data = array_merge($data, $totals, ['benefit_package_id' => (int) $package->id]);
            if ((int) $data['kind'] === ProductKind::RedemptionCard->value) {
                $campaign = new RedemptionCampaign;
                $campaign->save(['issuer_team_id' => $teamId, 'owner_entity_id' => $owner, 'package_id' => $package->id,
                    'name' => $data['name'], 'mode' => 1, 'claim_group' => '', 'is_active' => 1]);
                $data['redemption_campaign_id'] = (int) $campaign->id;
                $data['benefit_package_id'] = null;
            }
            return $data;
        });
    }

    private function createRecord(int $teamId, array $data): int
    {
        $validator = app(\app\validate\Product::class);
        app(Validation::class)->check($validator->scene('create'), $data);
        try {
            $money = (new TeamProduct)->normalizeMoneyFields($data);
        } catch (\InvalidArgumentException) {
            throw new HttpException(422, '商品金额格式不正确');
        }

        $entityId = $data['entity_id'] ?? null;
        if ($entityId) {
            app(Entity::class)->assertInTeam((int) $entityId, $teamId);
        }
        $benefitPackage = $this->assertBenefitConfiguration($teamId, $data);
        if ($benefitPackage && app(BenefitPackagePricing::class)->isItemized($benefitPackage)) {
            $money = app(BenefitPackagePricing::class)->summary($benefitPackage);
        }

        return \think\facade\Db::transaction(function () use ($teamId, $data, $entityId, $money) {
            $product = new TeamProduct;
            $product->save([
                'team_id' => $teamId,
                'entity_id' => $entityId ?: null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'cover_image' => $data['cover_image'] ?? null,
                'introduction_markdown' => $data['introduction_markdown'] ?? null,
                'purchase_fields' => app(ProductPurchaseField::class)->normalize(array_key_exists('purchase_fields', $data) ? $data['purchase_fields'] : []),
                'price' => $money['price'],
                'cost' => $money['cost'] ?? '0.00',
                'handler_cut' => $money['handler_cut'] ?? null,
                'sender_cut' => $money['sender_cut'] ?? null,
                'cs_cut' => $money['cs_cut'] ?? null,
                'team_cut' => $money['team_cut'] ?? null,
                'kind' => ProductKind::from((int) ($data['kind'] ?? ProductKind::Standard->value)),
                'benefit_package_id' => $data['benefit_package_id'] ?? null,
                'redemption_campaign_id' => $data['redemption_campaign_id'] ?? null,
            ]);
            app(Markdown::class)->sync(
                $product,
                'introduction_markdown',
                $data['introduction_markdown'] ?? null
            );

            if ($entityId && $product->enumCase('kind') !== ProductKind::MultiVariant) {
                $handler = new TeamProductHandler;
                $handler->save([
                    'product_id' => $product->id,
                    'entity_id' => $entityId,
                ]);
            }

            if (array_key_exists('handler_entity_ids', $data)) {
                if (!is_array($data['handler_entity_ids'])) throw new HttpException(422, '接单人配置必须为列表');
                $this->setHandlers($teamId, (int) $product->id, $data['handler_entity_ids']);
            }
            return (int) $product->id;
        });
    }

    public function edit(int $teamId, int $id, array $data, bool $canReprice = true): void
    {
        \think\facade\Db::transaction(function () use ($teamId, $id, $data, $canReprice) {
            $product = TeamProduct::where('team_id', $teamId)->lock(true)->find($id);
            if ($product && $product->parent_product_id !== null) throw new HttpException(422, '请在所属商品中编辑规格');
            $this->editRecord($teamId, $id, $data, $canReprice);
        });
    }

    private function editRecord(int $teamId, int $id, array $data, bool $canReprice): void
    {
        $product = TeamProduct::where('team_id', $teamId)->lock(true)->find($id);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        $kind = $product->enumCase('kind');
        if (isset($data['kind']) && (int) $data['kind'] !== $kind->value) {
            throw new HttpException(422, '商品类型不能修改，请新建商品');
        }
        if ($kind === ProductKind::MultiVariant) {
            $configuration = $this->containerData(array_merge($product->toArray(), $data));
            $configuration['kind'] = ProductKind::MultiVariant->value;
            $validator = app(\app\validate\Product::class);
            if (!$validator->scene('edit')->check($configuration)) throw new HttpException(422, $validator->getError());
            $product->save(array_intersect_key($configuration, array_flip(['name', 'description', 'cover_image', 'introduction_markdown', 'is_active'])));
            if (array_key_exists('introduction_markdown', $data)) app(Markdown::class)->sync($product, 'introduction_markdown', $data['introduction_markdown']);
            if (array_key_exists('variants', $data)) $this->saveVariants($teamId, $product, $data['variants'], $canReprice);
            if ($product->is_active && !$product->variants()->where('is_active', 1)->count()) throw new HttpException(422, '上架商品至少需要一个启用规格');
            return;
        }
        if (array_key_exists('variants', $data)) throw new HttpException(422, '只有多规格商品可以配置规格');
        if (!array_key_exists('items', $data)
            && (array_key_exists('benefit_package_id', $data) || array_key_exists('redemption_campaign_id', $data))
            && in_array($kind, [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true)) {
            $packageId = $kind === ProductKind::ServiceBundle ? (int) $product->benefit_package_id
                : (int) RedemptionCampaign::where('issuer_team_id', $teamId)->find((int) $product->redemption_campaign_id)?->package_id;
            if (\app\model\BenefitPackageService::where('package_id', $packageId)->whereNotNull('product_id')->count()) {
                throw new HttpException(422, '组合商品请通过商品子项修改，不能替换内部权益配置');
            }
        }
        if (array_key_exists('items', $data)) {
            if (!in_array($kind, [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true)) {
                throw new HttpException(422, '只能编辑套餐或卡密的组成');
            }
            $candidate = array_merge(['name' => $product->name], $data, ['entity_id' => $product->entity_id, 'kind' => $kind->value]);
            $data = $this->compositionConfiguration($teamId, $candidate, $canReprice, $id);
        }
        if ($kind === ProductKind::Redeemable && (array_key_exists('benefit_package_id', $data) || array_key_exists('redemption_campaign_id', $data))) {
            throw new HttpException(422, '核销商品的内部权益配置由系统维护');
        }

        $validator = app(\app\validate\Product::class);
        app(Validation::class)->check($validator->scene('edit'), $data);

        $allow = ['name', 'price', 'cost', 'description', 'cover_image', 'introduction_markdown', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut',
            'kind', 'benefit_package_id', 'redemption_campaign_id'];

        $update = [];
        if (array_key_exists('purchase_fields', $data)) {
            $update['purchase_fields'] = app(ProductPurchaseField::class)->normalize($data['purchase_fields'], $product->purchase_fields ?? []);
        }
        foreach ($allow as $k) {
            if (array_key_exists($k, $data)) {
                $update[$k] = $data[$k];
            }
        }

        try {
            $update = array_merge($update, (new TeamProduct)->normalizeMoneyFields($update));
        } catch (\InvalidArgumentException) {
            throw new HttpException(422, '商品金额格式不正确');
        }
        $configuration = array_merge($product->toArray(), $update);
        if ($kind === ProductKind::Standard) {
            $pricing = app(BenefitPackagePricing::class);
            $defaults = app(PersonalPricing::class)->defaults($teamId, $configuration['price'], $configuration['cost']);
            $remaining = $pricing->toCents((string) $configuration['price']) - $pricing->toCents((string) $configuration['cost']);
            foreach (['handler_cut', 'sender_cut', 'cs_cut'] as $field) {
                $remaining -= $pricing->toCents((string) ($configuration[$field] ?? $defaults[$field]));
            }
            if ($remaining < 0) throw new HttpException(422, '成本与人员分成不能超过售价');
            $update['team_cut'] = $pricing->fromCents($remaining);
            $configuration['team_cut'] = $update['team_cut'];
        }
        if ($kind === ProductKind::Redeemable) {
            $update = $this->updateRedemption($teamId, $product, $configuration, $data, $update);
            $configuration = array_merge($configuration, $update);
        } elseif (array_key_exists('redemption', $data)) {
            throw new HttpException(422, '只有核销商品可以配置核销信息');
        }
        if (!array_key_exists('kind', $update)) {
            $configuration['kind'] = $product->enumCase('kind')->value;
        }
        $benefitPackage = $this->assertBenefitConfiguration($teamId, $configuration);
        if ($benefitPackage && app(BenefitPackagePricing::class)->isItemized($benefitPackage)) {
            $update = array_merge($update, app(BenefitPackagePricing::class)->summary($benefitPackage));
        }

        if (array_key_exists('handler_entity_ids', $data)) {
            if (!is_array($data['handler_entity_ids'])) throw new HttpException(422, '接单人配置必须为列表');
            $this->setHandlers($teamId, $id, $data['handler_entity_ids']);
        }
        if ($update) {
            \think\facade\Db::transaction(function () use ($product, $update) {
                $product->save($update);
                if (array_key_exists('introduction_markdown', $update)) {
                    app(Markdown::class)->sync(
                        $product,
                        'introduction_markdown',
                        $update['introduction_markdown']
                    );
                }
            });
        }
    }

    private function updateRedemption(int $teamId, TeamProduct $product, array $configuration, array $data, array $update): array
    {
        $redemption = $data['redemption'] ?? [];
        if (!is_array($redemption) || (array_key_exists('redemption', $data) && $data['redemption'] === null)) {
            throw new HttpException(422, '核销配置格式不正确');
        }
        $package = BenefitPackage::where('issuer_team_id', $teamId)->lock(true)->find((int) $product->benefit_package_id);
        $items = $package ? \app\model\BenefitPackageService::where('package_id', $package->id)->lock(true)->select() : null;
        if (!$items || $items->count() !== 1 || !$items[0]->service_id) throw new HttpException(422, '核销商品内部配置缺失');
        $item = $items[0];
        $service = \app\model\TeamService::where('team_id', $teamId)->lock(true)->find((int) $item->service_id);
        if (!$service || (int) $service->owner_entity_id !== (int) $product->entity_id) {
            throw new HttpException(422, '核销商品内部归属不匹配');
        }
        $serviceData = array_merge($service->toArray(), array_intersect_key($redemption, array_flip([
            'unit_name', 'quantity_step', 'auto_complete_after_minutes', 'unused_auto_complete_after_minutes', 'handler_entity_ids', 'redemption_fields',
        ])), [
            'name' => $configuration['name'], 'description' => $configuration['description'] ?? null,
            'default_total_price' => $configuration['price'], 'default_cost' => $configuration['cost'] ?? '0.00',
            'default_handler_cut' => $configuration['handler_cut'] ?? '0.00',
            'default_sender_cut' => $configuration['sender_cut'] ?? '0.00',
            'default_cs_cut' => $configuration['cs_cut'] ?? '0.00',
        ]);
        $quantity = app(ServiceQuantity::class)->normalize($redemption['quantity'] ?? $item->quantity, $serviceData['quantity_step']);
        $days = $redemption['valid_days'] ?? $item->valid_days;
        if (filter_var($days, FILTER_VALIDATE_INT) === false || (int) $days < 0) throw new HttpException(422, '有效天数不正确');
        $serviceId = (int) $service->id;
        if ($product->parent_product_id !== null) {
            // 规格内部定义使用新版本，已售订单和已发权益仍关联旧服务及其字段。
            $savedFields = app(ServiceRedemptionField::class)->list($teamId, $serviceId);
            $fieldIds = array_column($savedFields, 'id');
            $fields = array_key_exists('redemption_fields', $redemption) ? $redemption['redemption_fields'] : $savedFields;
            if (!is_array($fields) || !array_is_list($fields)) throw new HttpException(422, '核销字段必须为列表');
            $submittedFieldIds = [];
            foreach ($fields as &$field) {
                if (!is_array($field)) throw new HttpException(422, '核销字段格式无效');
                if (isset($field['id'])) {
                    if ((!is_int($field['id']) && !is_string($field['id'])) || !ctype_digit((string) $field['id'])
                        || !in_array((int) $field['id'], $fieldIds, true)) throw new HttpException(422, '核销字段不属于当前规格');
                    if (isset($submittedFieldIds[(int) $field['id']])) throw new HttpException(422, '核销字段不能重复提交');
                    $submittedFieldIds[(int) $field['id']] = true;
                }
                unset($field['id']);
            }
            unset($field);
            $serviceData['redemption_fields'] = $fields;
            $serviceData['handler_entity_ids'] ??= \app\model\TeamServiceHandler::where('service_id', $serviceId)->column('entity_id');
            $serviceId = app(EntitlementManagement::class)->saveService($teamId, null, $serviceData);
        } else {
            app(EntitlementManagement::class)->saveService($teamId, $serviceId, $serviceData);
        }
        if ($serviceId !== (int) $service->id || $quantity !== (string) $item->quantity || (int) $days !== (int) $item->valid_days) {
            // 已售权益仍引用旧明细ID；新配置只用于后续订单。
            $update['benefit_package_id'] = app(EntitlementManagement::class)->savePackage($teamId, null, [
                'name' => $configuration['name'], 'owner_entity_id' => $product->entity_id,
                'pricing_mode' => \app\enum\BenefitPricingMode::LegacyEqualSplit->value,
                'services' => [['service_id' => $serviceId, 'quantity' => $quantity, 'valid_days' => (int) $days]],
            ]);
        }
        $price = app(BenefitPackagePricing::class);
        $teamCents = $price->toCents((string) $configuration['price']) - $price->toCents((string) ($configuration['cost'] ?? '0.00'));
        foreach (['handler_cut', 'sender_cut', 'cs_cut'] as $field) $teamCents -= $price->toCents((string) ($configuration[$field] ?? '0.00'));
        if ($teamCents < 0) throw new HttpException(422, '成本与人员分成不能超过售价');
        $update['team_cut'] = $price->fromCents($teamCents);
        return $update;
    }

    public function delete(int $teamId, int $id): void
    {
        $product = TeamProduct::where('team_id', $teamId)->find($id);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }
        if ($product->parent_product_id !== null) throw new HttpException(422, '请在所属商品中删除规格');

        \think\facade\Db::transaction(function () use ($product) {
            foreach (TeamProduct::where('parent_product_id', (int) $product->id)->select() as $variant) {
                app(Markdown::class)->deleteSource($variant, 'introduction_markdown');
                $variant->delete();
            }
            app(Markdown::class)->deleteSource($product, 'introduction_markdown');
            // 规格已显式软删除，避免 ORM 对已加载的关系再次级联删除。
            unset($product->variants);
            $product->delete();
        });
    }

    public function setHandlers(int $teamId, int $productId, array $entityIds): void
    {
        $validator = app(\app\validate\Product::class);
        if (!$validator->scene('setHandlers')->check(['entity_ids' => $entityIds])) {
            throw new HttpException(422, $validator->getError());
        }

        $product = TeamProduct::where('team_id', $teamId)->find($productId);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        foreach ($entityIds as $entityId) {
            app(Entity::class)->assertInTeam((int) $entityId, $teamId);
        }

        $entityIds = array_values(array_unique(array_map('intval', $entityIds)));
        \think\facade\Db::transaction(function () use ($productId, $entityIds) {
            $records = TeamProductHandler::withTrashed()
                ->where('product_id', $productId)
                ->lock(true)
                ->select();
            $existing = [];
            foreach ($records as $record) {
                $entityId = (int) $record->entity_id;
                $existing[$entityId] = $record;
                if (!in_array($entityId, $entityIds, true) && !$record->trashed()) {
                    $record->delete();
                }
            }

            foreach ($entityIds as $entityId) {
                if (isset($existing[$entityId])) {
                    if ($existing[$entityId]->trashed()) {
                        $existing[$entityId]->restore();
                    }
                    continue;
                }
                $handler = new TeamProductHandler;
                $handler->product_id = $productId;
                $handler->entity_id  = $entityId;
                $handler->save();
            }
        });
    }

    private function containerData(array $data): array
    {
        foreach (['items', 'redemption', 'benefit_package_id', 'redemption_campaign_id', 'handler_entity_ids', 'purchase_fields'] as $field) {
            if (!empty($data[$field])) throw new HttpException(422, '多规格商品的交付配置必须填写在规格中');
            unset($data[$field]);
        }
        foreach (['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
            if (isset($data[$field]) && (!is_scalar($data[$field]) || !is_numeric($data[$field]) || (float) $data[$field] !== 0.0)) {
                throw new HttpException(422, '多规格商品的价格和分成必须填写在规格中');
            }
            $data[$field] = '0.00';
        }
        return $data;
    }

    /** 规格列表为完整替换，缺省整个列表则保留；修改失败时连同内部资源回滚。 */
    private function saveVariants(int $teamId, TeamProduct $parent, mixed $rows, bool $canReprice): void
    {
        if (!is_array($rows) || !array_is_list($rows) || count($rows) < 1 || count($rows) > 50) {
            throw new HttpException(422, '多规格商品必须配置 1 至 50 个规格');
        }
        $existing = [];
        foreach ($parent->variants()->lock(true)->select() as $variant) $existing[(int) $variant->id] = $variant;
        $kept = [];
        $names = [];
        foreach ($rows as $sort => $row) {
            if (!is_array($row)) throw new HttpException(422, '规格格式不正确');
            $id = $row['id'] ?? null;
            if ($id !== null && ((!is_int($id) && !is_string($id)) || !ctype_digit((string) $id) || !isset($existing[(int) $id]))) {
                throw new HttpException(422, '规格不属于当前商品');
            }
            $id = (int) $id;
            if ($id && isset($kept[$id])) throw new HttpException(422, '规格不能重复提交');
            $name = $row['name'] ?? ($existing[$id]->name ?? null);
            if (!is_string($name) || trim($name) === '') throw new HttpException(422, '规格名称不能为空');
            $key = mb_strtolower(trim($name));
            if (isset($names[$key])) throw new HttpException(422, '规格名称不能重复');
            $names[$key] = true;
            $kind = $row['kind'] ?? (isset($existing[$id]) ? $existing[$id]->enumCase('kind')->value : 1);
            if (!in_array($kind, [1, 2, 3, 4, '1', '2', '3', '4'], true) || array_key_exists('variants', $row)) {
                throw new HttpException(422, '规格只能使用普通、核销、卡密或套餐类型');
            }
            if (array_key_exists('entity_id', $row) && $row['entity_id'] !== $parent->entity_id) throw new HttpException(422, '规格归属必须跟随主商品');
            if (array_key_exists('parent_product_id', $row) && (int) $row['parent_product_id'] !== (int) $parent->id) throw new HttpException(422, '不能转移规格所属商品');
            $row['name'] = trim($name);
            $row['kind'] = (int) $kind;
            if ($id) {
                $this->editRecord($teamId, $id, $row, $canReprice);
            } else {
                $row['entity_id'] = $parent->entity_id;
                $row['cover_image'] ??= $parent->cover_image;
                $id = $this->create($teamId, $row, $canReprice);
                if (array_key_exists('is_active', $row)) $this->editRecord($teamId, $id, ['is_active' => $row['is_active']], $canReprice);
            }
            TeamProduct::where('id', $id)->update(['parent_product_id' => $parent->id, 'variant_sort' => $sort]);
            if (!isset($existing[$id]) && (int) $kind === ProductKind::Standard->value) {
                $this->editRecord($teamId, $id, [], $canReprice);
            }
            $kept[$id] = true;
        }
        foreach ($existing as $id => $variant) {
            if (isset($kept[$id])) continue;
            app(Markdown::class)->deleteSource($variant, 'introduction_markdown');
            $variant->delete();
        }
        if ($parent->is_active && !$parent->variants()->where('is_active', 1)->count()) throw new HttpException(422, '上架商品至少需要一个启用规格');
        // 完整替换后复核，防止前面的规格引用本次后面才删除或停用的规格。
        if ($parent->is_active) {
            foreach ($parent->variants()->where('is_active', 1)->select() as $variant) {
                if (!in_array($variant->enumCase('kind'), [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true)) continue;
                $definition = $this->get($teamId, (int) $variant->id);
                $definition['kind'] = $variant->enumCase('kind');
                app(ProductComposition::class)->inspectStored($definition);
            }
        }
    }

    private function assertBenefitConfiguration(int $teamId, array $data): ?BenefitPackage
    {
        $ownerEntityId = (int) ($data['entity_id'] ?? 0) ?: null;
        $kind = ProductKind::from((int) ($data['kind'] ?? ProductKind::Standard->value));
        if (in_array($kind, [ProductKind::ServiceBundle, ProductKind::Redeemable], true)) {
            $package = BenefitPackage::where('issuer_team_id', $teamId)->find((int) ($data['benefit_package_id'] ?? 0));
            if (!$package) throw new HttpException(422, '服务套餐必须关联当前团队的权益套餐');
            $this->assertCompatibleBenefitOwner($ownerEntityId, $package->owner_entity_id);
            return $package;
        }
        if ($kind === ProductKind::RedemptionCard) {
            $campaign = RedemptionCampaign::where('issuer_team_id', $teamId)
                ->with(['package'])->find((int) ($data['redemption_campaign_id'] ?? 0));
            if (!$campaign) throw new HttpException(422, '卡密商品必须关联当前团队的卡密活动');
            $this->assertCompatibleBenefitOwner($ownerEntityId, $campaign->owner_entity_id);
            return $campaign->package;
        }
        return null;
    }

    private function assertCompatibleBenefitOwner(?int $ownerEntityId, mixed $candidateOwnerEntityId): void
    {
        $candidateOwnerEntityId = $candidateOwnerEntityId === null ? null : (int) $candidateOwnerEntityId;
        if ($candidateOwnerEntityId !== null && $candidateOwnerEntityId !== $ownerEntityId) {
            throw new HttpException(422, '商品不能引用其他 Entity 的权益资源');
        }
    }

    private function attachRelations(array &$rows, bool $detail): void
    {
        $productIds = [];
        $entityIds = [];
        $packageIds = [];
        $campaignIds = [];
        foreach ($rows as $row) {
            $productIds[(int) $row['id']] = (int) $row['id'];
            $entityId = (int) ($row['entity_id'] ?? 0);
            if ($entityId > 0) $entityIds[$entityId] = $entityId;
            $packageId = (int) ($row['benefit_package_id'] ?? 0);
            if ($packageId > 0) $packageIds[$packageId] = $packageId;
            $campaignId = (int) ($row['redemption_campaign_id'] ?? 0);
            if ($campaignId > 0) $campaignIds[$campaignId] = $campaignId;
        }

        $subjectMap = $this->mapById($entityIds
            ? \app\model\Entity::whereIn('id', array_values($entityIds))->with(['profile'])->select()->toArray()
            : []);
        $packageQuery = $packageIds ? BenefitPackage::whereIn('id', array_values($packageIds)) : null;
        $packages = $packageQuery
            ? ($detail ? $packageQuery->with(['services.service', 'abilities']) : $packageQuery)->select()->toArray()
            : [];
        $packageMap = $this->mapById($packages);
        $campaignMap = $this->mapById($campaignIds
            ? RedemptionCampaign::whereIn('id', array_values($campaignIds))->select()->toArray()
            : []);

        $handlersByProduct = [];
        if ($productIds) {
            $handlers = TeamProductHandler::whereIn('product_id', array_values($productIds))
                ->with(['subject.profile'])->select()->toArray();
            foreach ($handlers as $handler) $handlersByProduct[(int) $handler['product_id']][] = $handler;
        }
        foreach ($rows as &$row) {
            $productId = (int) $row['id'];
            $entityId = (int) ($row['entity_id'] ?? 0);
            $packageId = (int) ($row['benefit_package_id'] ?? 0);
            $campaignId = (int) ($row['redemption_campaign_id'] ?? 0);
            $row['subject'] = $entityId > 0 ? ($subjectMap[$entityId] ?? null) : null;
            $row['handlers'] = $handlersByProduct[$productId] ?? [];
            $row['benefit_package'] = $packageId > 0 ? ($packageMap[$packageId] ?? null) : null;
            $row['redemption_campaign'] = $campaignId > 0 ? ($campaignMap[$campaignId] ?? null) : null;
        }
    }

    private function mapById(array $rows): array
    {
        $map = [];
        foreach ($rows as $row) $map[(int) $row['id']] = $row;
        return $map;
    }
}
