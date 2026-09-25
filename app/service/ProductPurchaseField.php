<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;

/** 购买时填写的商品资料；订单保存完整定义和值，不依赖后续商品配置。 */
final class ProductPurchaseField
{
    public function normalize(mixed $rows, array $existing = []): array
    {
        if (!is_array($rows) || !array_is_list($rows) || count($rows) > 50) {
            throw new HttpException(422, '购买资料必须为最多 50 个字段的列表');
        }
        $known = array_column($existing, null, 'id');
        $ids = $names = $result = [];
        foreach ($rows as $index => $row) {
            if (!is_array($row)) throw new HttpException(422, '购买字段格式无效');
            $id = $row['id'] ?? null;
            if (array_key_exists('id', $row)) {
                if (!is_int($id) || $id < 1 || !isset($known[$id]) || isset($ids[$id])) {
                    throw new HttpException(422, '购买字段不属于当前商品或重复提交');
                }
            } else {
                do { $id = random_int(1, 2147483647); } while (isset($ids[$id]) || isset($known[$id]));
            }
            if (!is_string($row['name'] ?? null)) throw new HttpException(422, '购买字段名称无效');
            $field = array_intersect_key($row, array_flip(['name', 'value_type', 'input_type', 'options', 'default_value', 'is_required']));
            $field['name'] = trim($field['name']);
            $field += ['value_type' => 'string', 'input_type' => 'text', 'options' => [], 'default_value' => null, 'is_required' => 0];
            if (!is_string($field['value_type']) || $field['value_type'] === '' || !is_string($field['input_type']) || $field['input_type'] === '') throw new HttpException(422, '购买字段类型无效');
            $validator = new \app\validate\TeamEntityField;
            if ($field['name'] === '' || !$validator->scene('update')->check($field)) throw new HttpException(422, $validator->getError() ?: '购买字段名称不能为空');
            if (!in_array($field['is_required'], [0, 1], true)) throw new HttpException(422, '购买字段必填标记无效');
            if (!is_array($field['options']) || !array_is_list($field['options']) || count($field['options']) > 100) throw new HttpException(422, '购买字段选项格式无效');
            foreach ($field['options'] as $option) {
                if (!is_string($option) || trim($option) === '' || mb_strlen($option) > 500) throw new HttpException(422, '购买字段选项不能为空或超过 500 字');
            }
            if (count(array_unique($field['options'])) !== count($field['options'])) throw new HttpException(422, '购买字段选项不能重复');
            if (in_array($field['value_type'], ['select', 'multi_select'], true) && !$field['options']) throw new HttpException(422, '选择类购买字段必须配置选项');
            if ($field['value_type'] === 'image' && $field['input_type'] !== 'upload') throw new HttpException(422, '图片字段必须使用图片上传控件');
            $name = mb_strtolower($field['name']);
            if (isset($names[$name])) throw new HttpException(422, '购买字段名称不能重复');
            $normalizer = app(TeamEntityField::class);
            if (!$normalizer->emptyValue($field['default_value'])) $normalizer->normalizeValue($field['value_type'], $field['default_value'], $field['options']);
            $ids[$id] = $names[$name] = true;
            $result[] = ['id' => $id, 'sort' => $index] + $field;
        }
        return $result;
    }

    public function snapshot(array $fields, mixed $values): array
    {
        if (!is_array($values)) throw new HttpException(422, '购买资料值格式无效');
        $known = array_column($fields, null, 'id');
        foreach ($values as $id => $value) {
            if (!ctype_digit((string) $id) || (string) (int) $id !== (string) $id || !isset($known[$id])) {
                throw new HttpException(422, '购买资料包含不属于当前商品的字段');
            }
        }
        $normalizer = app(TeamEntityField::class);
        $snapshot = [];
        foreach ($fields as $field) {
            $value = array_key_exists($field['id'], $values) ? $values[$field['id']] : $field['default_value'];
            if ($normalizer->emptyValue($value)) {
                if ($field['is_required']) throw new HttpException(422, "购买资料 {$field['name']} 不能为空");
                $value = null;
            } else {
                $normalizer->normalizeValue($field['value_type'], $value, $field['options']);
            }
            $snapshot[] = $field + ['value' => $value];
        }
        return $snapshot;
    }
}
