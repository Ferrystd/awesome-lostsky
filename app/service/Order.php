<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use app\model\TeamProductHandler;
use app\model\TeamOrder;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamTransaction;
use app\enum\OrderStatus;
use app\enum\TransactionType;
use app\enum\LogType;
use think\exception\HttpException;

class Order
{
    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        $query = TeamOrder::where('team_id', $teamId);

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }
        if (isset($filters['handler_id'])) {
            $query->where('handler_id', (int) $filters['handler_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }
        if (!empty($filters['start_time'])) {
            $query->where('create_time', '>=', (int) $filters['start_time']);
        }
        if (!empty($filters['end_time'])) {
            $query->where('create_time', '<', (int) $filters['end_time']);
        }

        $total = $query->count();
        $list  = $query->with(['product', 'customer.profile', 'handler.profile', 'sender.profile', 'transaction'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id): array
    {
        $order = TeamOrder::where('team_id', $teamId)
            ->with(['product', 'customer.profile', 'handler.profile', 'sender.profile', 'transaction'])
            ->find($id);

        if (!$order) {
            throw new HttpException(404, '订单不存在');
        }

        return $order->toArray();
    }

    public function create(int $teamId, array $data): int
    {
        $validator = app(\app\validate\Order::class);
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $product = TeamProduct::where('team_id', $teamId)
            ->where('id', (int) $data['product_id'])
            ->find();

        if (!$product || !$product->is_active) {
            throw new HttpException(422, '商品不存在或已下架');
        }

        $handlerId = $this->resolveHandler($product, $data['handler_id'] ?? null);
        $quantity  = (int) ($data['quantity'] ?? 1);
        $unitPrice = (float) $product->price;

        $totalPrice = round((float) $product->price * $quantity, 2);
        $cost       = round((float) ($product->cost ?? 0) * $quantity, 2);

        $handlerCut = $this->resolveCut($data['handler_cut'] ?? null, $product->handler_cut);
        $senderCut  = empty($data['sender_id']) ? null
            : $this->resolveCut($data['sender_cut'] ?? null, $product->sender_cut);
        $csCut      = empty($data['cs_id']) ? null
            : $this->resolveCut($data['cs_cut'] ?? null, $product->cs_cut);
        $teamCut    = $this->resolveCut($data['team_cut'] ?? null, $product->team_cut);

        return \think\facade\Db::transaction(function () use ($teamId, $data, $handlerId, $quantity,
            $unitPrice, $totalPrice, $cost, $handlerCut, $senderCut, $csCut, $teamCut
        ) {
            $transData = [
                'handler_id'  => $handlerId,
                'sender_id'   => $data['sender_id'] ?? null,
                'cs_id'       => $data['cs_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'type'        => TransactionType::ShopOrder->value,
                'total_price' => $totalPrice,
                'cost'        => $cost,
                'prepaid'     => $totalPrice,
                'handler_cut' => (float) ($handlerCut ?? 0),
                'sender_cut'  => (float) ($senderCut ?? 0),
                'cs_cut'      => (float) ($csCut ?? 0),
                'team_cut'    => (float) ($teamCut ?? 0),
                'trans_at'    => time(),
                'memo'        => $data['memo'] ?? null,
            ];

            $transId = app(Transaction::class)->create($teamId, $transData);

            $order = new TeamOrder;
            $order->team_id     = $teamId;
            $order->customer_id = $data['customer_id'] ?? null;
            $order->handler_id  = $handlerId;
            $order->sender_id   = $data['sender_id'] ?? null;
            $order->product_id  = (int) $data['product_id'];
            $order->quantity    = $quantity;
            $order->unit_price  = $unitPrice;
            $order->total_price = $totalPrice;
            $order->cost        = $cost;
            $order->handler_cut = $handlerCut;
            $order->sender_cut  = $senderCut;
            $order->cs_cut      = $csCut;
            $order->team_cut    = $teamCut;
            $order->prepaid     = $totalPrice;
            $order->trans_id    = $transId;
            $order->status      = OrderStatus::Processing->value;
            $order->memo        = $data['memo'] ?? null;
            $order->save();

            return (int) $order->id;
        });
    }

    public function cancel(int $teamId, int $id): void
    {
        $order = TeamOrder::where('team_id', $teamId)->find($id);
        if (!$order) {
            throw new HttpException(404, '订单不存在');
        }

        if ($order->status !== OrderStatus::Processing) {
            throw new HttpException(422, '仅处理中的订单可取消');
        }

        \think\facade\Db::transaction(function () use ($order) {
            // 退还预存款
            if ($order->prepaid > 0 && $order->customer_id) {
                $balance = TeamCustomerBalance::where('customer_id', $order->customer_id)
                    ->lock(true)->find();
                if ($balance) {
                    TeamCustomerBalance::where('customer_id', $order->customer_id)
                        ->inc('balance', $order->prepaid)
                        ->dec('spent', $order->prepaid)
                        ->update();

                    $balance = TeamCustomerBalance::where('customer_id', $order->customer_id)->find();

                    $log = new TeamCustomerBalanceLog;
                    $log->customer_id   = $order->customer_id;
                    $log->type          = LogType::Refund->value;
                    $log->amount        = (float) $order->prepaid;
                    $log->balance_after = (float) $balance->balance;
                    $log->trans_id      = $order->trans_id;
                    $log->memo          = '订单取消退款';
                    $log->save();
                }
            }

            // 软删除关联流水
            if ($order->trans_id) {
                $trans = TeamTransaction::find($order->trans_id);
                if ($trans) {
                    $trans->delete();
                }
            }

            $order->delete();
        });
    }

    public function complete(int $teamId, int $id): void
    {
        $order = TeamOrder::where('team_id', $teamId)->find($id);
        if (!$order) {
            throw new HttpException(404, '订单不存在');
        }

        if ($order->status !== OrderStatus::Processing) {
            throw new HttpException(422, '仅处理中的订单可标记完成');
        }

        $order->status = OrderStatus::Completed->value;
        $order->save();
    }

    private function resolveCut(mixed $inputCut, mixed $productCut): ?float
    {
        if ($inputCut !== null) {
            return (float) $inputCut;
        }
        if ($productCut !== null) {
            return (float) $productCut;
        }
        return null;
    }

    private function resolveHandler(TeamProduct $product, $handlerId): ?int
    {
        $exists = TeamProductHandler::where('product_id', $product->id)->find();

        if (!$exists) {
            return $handlerId ?? null;
        }

        $handlerId = $handlerId !== null ? (int) $handlerId : null;

        if ($handlerId === 0) {
            return 0;
        }

        if ($handlerId === null) {
            $ids = TeamProductHandler::where('product_id', $product->id)->column('member_id');
            if (count($ids) === 1) {
                return (int) $ids[0];
            }

            throw new HttpException(422, '请选择接单人');
        }

        if (!TeamProductHandler::where('product_id', $product->id)
            ->where('member_id', $handlerId)->find()) {
            throw new HttpException(422, '该成员不是此商品的接单人');
        }

        return $handlerId;
    }
}
