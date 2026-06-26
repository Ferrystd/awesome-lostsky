<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use app\model\TeamProductHandler;
use app\model\TeamMember;
use think\exception\HttpException;
use think\facade\Db;

class Product
{
    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        $query = TeamProduct::where('team_id', $teamId);

        if (isset($filters['member_id'])) {
            $query->where('member_id', (int) $filters['member_id']);
        }
        if (isset($filters['is_active'])) {
            $query->where('is_active', (int) $filters['is_active']);
        }
        if (!empty($filters['keyword'])) {
            $keyword = addcslashes($filters['keyword'], '%_');
            $query->where('name', 'like', "%{$keyword}%");
        }

        $total = $query->count();
        $list  = $query->with(['member.profile', 'handlers.member.profile'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id): array
    {
        $product = TeamProduct::where('team_id', $teamId)
            ->with(['member.profile', 'handlers.member.profile'])
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

        $memberId = $data['member_id'] ?? null;
        if ($memberId && !TeamMember::where('team_id', $teamId)->find($memberId)) {
            throw new HttpException(422, '专属成员不存在');
        }

        return Db::transaction(function () use ($teamId, $data, $memberId) {
            $product = new TeamProduct;
            $product->save([
                'team_id' => $teamId,
                'member_id' => $memberId ?: null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'price' => (float) $data['price'],
                'cost' => (float) ($data['cost'] ?? 0),
                'handler_cut' => isset($data['handler_cut']) ? (float) $data['handler_cut'] : null,
                'sender_cut' => isset($data['sender_cut']) ? (float) $data['sender_cut'] : null,
                'cs_cut' => isset($data['cs_cut']) ? (float) $data['cs_cut'] : null,
                'team_cut' => isset($data['team_cut']) ? (float) $data['team_cut'] : null,
            ]);

            if ($memberId) {
                $handler = new TeamProductHandler;
                $handler->save([
                    'product_id' => $product->id,
                    'member_id' => $memberId,
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

        $allow = ['name', 'price', 'cost', 'description', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'];

        $update = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $data)) {
                $update[$k] = $data[$k];
            }
        }

        if ($update) {
            $product->save($update);
        }
    }

    public function delete(int $teamId, int $id): void
    {
        $product = TeamProduct::where('team_id', $teamId)->find($id);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        $product->delete();
    }

    public function setHandlers(int $teamId, int $productId, array $memberIds): void
    {
        $validator = app(\app\validate\Product::class);
        if (!$validator->scene('setHandlers')->check(['member_ids' => $memberIds])) {
            throw new HttpException(422, $validator->getError());
        }

        $product = TeamProduct::where('team_id', $teamId)->find($productId);
        if (!$product) {
            throw new HttpException(404, '商品不存在');
        }

        foreach ($memberIds as $mid) {
            if (!TeamMember::where('team_id', $teamId)->find($mid)) {
                throw new HttpException(422, "成员 {$mid} 不存在");
            }
        }

        Db::transaction(function () use ($productId, $memberIds) {
            TeamProductHandler::where('product_id', $productId)->delete();

            foreach ($memberIds as $mid) {
                $handler = new TeamProductHandler;
                $handler->product_id = $productId;
                $handler->member_id  = $mid;
                $handler->save();
            }
        });
    }
}
