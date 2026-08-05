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
        $query = TeamProduct::where('team_id', $teamId);

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
        $total = $paginator->total();
        $list  = $paginator->getCollection()->toArray();
        $page  = $paginator->currentPage();
        $limit = $paginator->listRows();
        $this->attachRelations($list, false);

        return compact('total', 'list', 'page', 'limit');
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
        return $result;
    }

    public function create(int $teamId, array $data): int
    {
        $validator = app(\app\validate\Product::class);
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
        try {
            $money = (new TeamProduct)->normalizeMoneyFields($data);
        } catch (\InvalidArgumentException) {
            throw new HttpException(422, '商品金额格式不正确');
        }

        $entityId = $data['entity_id'] ?? null;
        if ($entityId) {
            app(Entity::class)->assertInTeam((int) $entityId, $teamId);
        }
        $this->assertBenefitConfiguration($teamId, $data);

        return \think\facade\Db::transaction(function () use ($teamId, $data, $entityId, $money) {
            $product = new TeamProduct;
            $product->save([
                'team_id' => $teamId,
                'entity_id' => $entityId ?: null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'cover_image' => $data['cover_image'] ?? null,
                'introduction_markdown' => $data['introduction_markdown'] ?? null,
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

            if ($entityId) {
                $handler = new TeamProductHandler;
                $handler->save([
                    'product_id' => $product->id,
                    'entity_id' => $entityId,
                ]);
            }

            return (int) $product->id;
        });
    }

    public function edit(int $teamId, int $id, array $data): void
    {
        $product = TeamProduct::where('team_id', $teamId)->find($id);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        $validator = app(\app\validate\Product::class);
        if (!$validator->scene('edit')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $allow = ['name', 'price', 'cost', 'description', 'cover_image', 'introduction_markdown', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut',
            'kind', 'benefit_package_id', 'redemption_campaign_id'];

        $update = [];
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
        $this->assertBenefitConfiguration($teamId, array_merge($product->toArray(), $update));

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

    public function delete(int $teamId, int $id): void
    {
        $product = TeamProduct::where('team_id', $teamId)->find($id);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        \think\facade\Db::transaction(function () use ($product) {
            app(Markdown::class)->deleteSource($product, 'introduction_markdown');
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

        \think\facade\Db::transaction(function () use ($productId, $entityIds) {
            TeamProductHandler::where('product_id', $productId)->delete();

            foreach ($entityIds as $entityId) {
                $handler = new TeamProductHandler;
                $handler->product_id = $productId;
                $handler->entity_id  = $entityId;
                $handler->save();
            }
        });
    }

    private function assertBenefitConfiguration(int $teamId, array $data): void
    {
        $kind = ProductKind::from((int) ($data['kind'] ?? ProductKind::Standard->value));
        if ($kind === ProductKind::ServiceBundle) {
            $package = BenefitPackage::where('issuer_team_id', $teamId)->find((int) ($data['benefit_package_id'] ?? 0));
            if (!$package) throw new HttpException(422, '服务套餐必须关联当前团队的权益套餐');
        }
        if ($kind === ProductKind::RedemptionCard) {
            $campaign = RedemptionCampaign::where('issuer_team_id', $teamId)->find((int) ($data['redemption_campaign_id'] ?? 0));
            if (!$campaign) throw new HttpException(422, '卡密商品必须关联当前团队的卡密活动');
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
        $fieldsByProduct = [];
        if ($detail && $productIds) {
            $fields = \app\model\TeamProductRedemptionField::whereIn('product_id', array_values($productIds))
                ->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
            foreach ($fields as $field) $fieldsByProduct[(int) $field['product_id']][] = $field;
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
            if ($detail) $row['redemption_fields'] = $fieldsByProduct[$productId] ?? [];
        }
    }

    private function mapById(array $rows): array
    {
        $map = [];
        foreach ($rows as $row) $map[(int) $row['id']] = $row;
        return $map;
    }
}
