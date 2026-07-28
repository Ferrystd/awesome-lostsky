<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use app\model\TeamProductHandler;
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

        $total = $query->count();
        $list  = $query->with(['subject.profile', 'handlers.subject.profile'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id): array
    {
        $product = TeamProduct::where('team_id', $teamId)
            ->with(['subject.profile', 'handlers.subject.profile'])
            ->find($id);

        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        return $product->toArray();
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
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'];

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
}
