<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use app\model\TeamProductRedemptionField;
use app\model\TeamServiceFieldValue;
use app\model\TeamServiceInstance;
use think\exception\HttpException;
use think\facade\Db;

class ProductRedemptionField
{
    public function list(int $teamId, int $productId): array
    {
        $this->product($teamId, $productId);
        return TeamProductRedemptionField::where('team_id', $teamId)->where('product_id', $productId)
            ->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
    }

    public function create(int $teamId, int $productId, array $data): int
    {
        $this->product($teamId, $productId);
        $this->validate($data, true);
        $key = strtolower(trim((string) $data['field_key']));
        if (TeamProductRedemptionField::where('product_id', $productId)->where('field_key', $key)->find()) {
            throw new HttpException(409, '核销字段标识已存在');
        }
        $field = new TeamProductRedemptionField;
        $field->save($this->payload($data) + ['team_id' => $teamId, 'product_id' => $productId, 'field_key' => $key]);
        return (int) $field->id;
    }

    public function update(int $teamId, int $productId, int $id, array $data): void
    {
        $field = $this->field($teamId, $productId, $id);
        $this->validate($data, false);
        $field->save($this->payload($data));
    }

    public function delete(int $teamId, int $productId, int $id): void
    {
        $field = $this->field($teamId, $productId, $id);
        if (TeamServiceFieldValue::where('field_id', $id)->find()) {
            $field->save(['is_active' => 0]);
            return;
        }
        $field->delete();
    }

    public function fieldsForInstance(TeamServiceInstance $instance, bool $customer): array
    {
        if (!$instance->source_product_id) return [];
        $query = TeamProductRedemptionField::where('team_id', $instance->team_id)
            ->where('product_id', $instance->source_product_id)->where('is_active', 1);
        if ($customer) $query->where('is_customer_visible', 1);
        $fields = $query->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
        $values = TeamServiceFieldValue::where('service_instance_id', $instance->id)->select()->toArray();
        $valueMap = [];
        foreach ($values as $value) $valueMap[(int) $value['field_id']] = $value;
        foreach ($fields as &$field) $field['value'] = $valueMap[(int) $field['id']] ?? null;
        return $fields;
    }

    public function saveForStage(TeamServiceInstance $instance, string $stage, array $values): void
    {
        if (!in_array($stage, ['customer', 'manager'], true)) throw new HttpException(500, '核销字段阶段无效');
        $fields = $instance->source_product_id
            ? TeamProductRedemptionField::where('team_id', $instance->team_id)
                ->where('product_id', $instance->source_product_id)->where('fill_stage', $stage)
                ->where('is_active', 1)->order('sort', 'asc')->select()
            : [];
        $provided = [];
        foreach ($values as $fieldId => $raw) $provided[(int) $fieldId] = $raw;
        $known = [];
        foreach ($fields as $field) $known[(int) $field->id] = $field;
        if (array_diff(array_keys($provided), array_keys($known))) throw new HttpException(422, '核销字段与商品或填写阶段不匹配');

        $normalizer = app(TeamEntityField::class);
        Db::transaction(function () use ($instance, $fields, $provided, $normalizer) {
            foreach ($fields as $field) {
                $fieldId = (int) $field->id;
                $existing = TeamServiceFieldValue::where('service_instance_id', $instance->id)->where('field_id', $fieldId)->find();
                $hasInput = array_key_exists($fieldId, $provided);
                $raw = $hasInput ? $provided[$fieldId] : ($existing ? $this->raw($existing) : $field->default_value);
                if ($field->is_required && $normalizer->emptyValue($raw)) {
                    throw new HttpException(422, "字段 {$field->name} 不能为空");
                }
                if (!$hasInput && $existing) continue;
                if (!$hasInput && $normalizer->emptyValue($raw)) continue;
                $data = $normalizer->normalizeValue((string) $field->value_type, $raw, is_array($field->options) ? $field->options : []);
                $value = TeamServiceFieldValue::withTrashed()->where('service_instance_id', $instance->id)->where('field_id', $fieldId)->find();
                if (!$value) $value = new TeamServiceFieldValue;
                else $value->restore();
                $value->save($data + ['service_instance_id' => $instance->id, 'field_id' => $fieldId]);
            }
        });
    }

    private function raw(TeamServiceFieldValue $value): mixed
    {
        foreach (['value_string', 'value_text', 'value_int', 'value_decimal', 'value_datetime', 'value_json'] as $column) {
            if ($value->{$column} !== null) return $value->{$column};
        }
        return null;
    }

    private function payload(array $data): array
    {
        return array_intersect_key($data, array_flip([
            'name', 'value_type', 'input_type', 'options', 'default_value', 'fill_stage',
            'is_customer_visible', 'is_required', 'is_active', 'sort',
        ]));
    }

    private function validate(array $data, bool $create): void
    {
        $validator = new \app\validate\TeamEntityField;
        $check = $data + ['entity_type' => 'entity', 'source' => 'custom'];
        if ($create && !$validator->scene('create')->check($check)) throw new HttpException(422, $validator->getError());
        if (!$create && !$validator->scene('update')->check($check)) throw new HttpException(422, $validator->getError());
        if (isset($data['fill_stage']) && !in_array($data['fill_stage'], ['customer', 'manager'], true)) throw new HttpException(422, '填写阶段无效');
        foreach (['is_customer_visible', 'is_required', 'is_active'] as $key) {
            if (isset($data[$key]) && !in_array((int) $data[$key], [0, 1], true)) throw new HttpException(422, "{$key} 格式无效");
        }
    }

    private function product(int $teamId, int $productId): TeamProduct
    {
        $product = TeamProduct::where('team_id', $teamId)->find($productId);
        if (!$product) throw new HttpException(404, '商品不存在');
        return $product;
    }

    private function field(int $teamId, int $productId, int $id): TeamProductRedemptionField
    {
        $field = TeamProductRedemptionField::where('team_id', $teamId)->where('product_id', $productId)->find($id);
        if (!$field) throw new HttpException(404, '核销字段不存在');
        return $field;
    }
}
