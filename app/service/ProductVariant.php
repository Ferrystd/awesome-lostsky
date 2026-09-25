<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ProductKind;
use app\model\TeamProduct;
use think\exception\HttpException;

/** 规格复用商品 ID；主商品仅承载展示，不进入履约树。 */
final class ProductVariant
{
    public function assertAvailable(TeamProduct $product): void
    {
        if ($product->enumCase('kind') === ProductKind::MultiVariant) {
            throw new HttpException(422, '请选择一个具体规格');
        }
        if (!$product->is_active) throw new HttpException(422, '商品或规格已停用');
        if ($product->parent_product_id === null) return;
        $parent = TeamProduct::where('team_id', $product->team_id)->lock(true)->find((int) $product->parent_product_id);
        if (!$parent || !$parent->is_active || $parent->enumCase('kind') !== ProductKind::MultiVariant
            || $parent->parent_product_id !== null || $parent->entity_id !== $product->entity_id) {
            throw new HttpException(422, '规格所属商品不可用');
        }
    }

    public function displayName(TeamProduct $product): string
    {
        if ($product->parent_product_id === null) return (string) $product->name;
        $parent = TeamProduct::withTrashed()->where('team_id', $product->team_id)->find((int) $product->parent_product_id);
        return ($parent ? $parent->name . ' · ' : '') . $product->name;
    }
}
