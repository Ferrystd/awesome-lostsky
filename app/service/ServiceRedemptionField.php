<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamService;
use app\model\TeamServiceFieldValue;
use app\model\TeamServiceInstance;
use app\model\TeamServiceRedemptionField;
use think\exception\HttpException;
use think\facade\Db;

final class ServiceRedemptionField
{
    public function list(int $teamId, int $serviceId): array
    {
        $this->service($teamId, $serviceId);
        return TeamServiceRedemptionField::where('team_id', $teamId)
            ->where('service_id', $serviceId)
            ->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
    }

    public function sync(int $teamId, int $serviceId, array $rows): array
    {
        $this->service($teamId, $serviceId);
        if (count($rows) > 50) throw new HttpException(422, '单个服务最多配置 50 个核销字段');

        $existing = [];
        foreach (TeamServiceRedemptionField::where('team_id', $teamId)
            ->where('service_id', $serviceId)->select() as $field) {
            $existing[(int) $field->id] = $field;
        }

        $normalized = [];
        $submittedIds = [];
        $submittedNames = [];
        foreach (array_values($rows) as $index => $row) {
            if (!is_array($row)) throw new HttpException(422, '核销字段格式无效');
            $id = (int) ($row['id'] ?? 0);
            $field = $id > 0 ? ($existing[$id] ?? null) : null;
            if ($id > 0 && !$field) throw new HttpException(422, '核销字段不属于当前服务');
            if ($id > 0 && isset($submittedIds[$id])) throw new HttpException(422, '核销字段不能重复提交');

            $data = $row;
            $data['sort'] = $index;
            $data['name'] = trim((string) ($data['name'] ?? ''));
            $this->validate($data);
            $normalizedName = mb_strtolower($data['name']);
            if (isset($submittedNames[$normalizedName])) throw new HttpException(409, '核销字段名称已存在');
            $submittedNames[$normalizedName] = true;
            if ($id > 0) $submittedIds[$id] = true;
            $normalized[] = ['field' => $field, 'data' => $data];
        }

        foreach ($normalized as $item) {
            $field = $item['field'];
            $data = $item['data'];
            if (!$field) $field = new TeamServiceRedemptionField;
            $field->save($this->payload($data) + [
                'team_id' => $teamId,
                'service_id' => $serviceId,
            ]);
            $submittedIds[(int) $field->id] = true;
        }

        foreach ($existing as $id => $field) {
            if (isset($submittedIds[$id])) continue;
            if (TeamServiceFieldValue::where('field_id', $id)->find()) $field->save(['is_active' => 0]);
            else $field->delete();
        }

        return $this->list($teamId, $serviceId);
    }

    public function fieldsForInstance(TeamServiceInstance $instance, bool $customer): array
    {
        return $this->fieldsForService(
            (int) $instance->team_id,
            (int) $instance->service_id,
            $customer,
            (int) $instance->id,
            1
        );
    }

    public function fieldsForService(
        int $teamId,
        int $serviceId,
        bool $customer,
        ?int $instanceId = null,
        int $resourceIndex = 1
    ): array
    {
        if ($serviceId < 1) return [];
        $query = TeamServiceRedemptionField::where('team_id', $teamId)
            ->where('service_id', $serviceId)->where('is_active', 1);
        if ($customer) $query->where('is_customer_visible', 1);
        $fields = $query->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
        $values = $instanceId
            ? TeamServiceFieldValue::where('service_instance_id', $instanceId)
                ->where('resource_index', $resourceIndex)->select()->toArray()
            : [];
        $valueMap = [];
        foreach ($values as $value) $valueMap[(int) $value['field_id']] = $value;
        foreach ($fields as &$field) $field['value'] = $valueMap[(int) $field['id']] ?? null;
        return $fields;
    }

    public function resourcesForInstance(TeamServiceInstance $instance, bool $customer): array
    {
        $entitlement = $instance->entitlement ?: $instance->entitlement()->find();
        $step = (string) ($entitlement?->quantity_step ?? '1');
        $count = $this->resourceCount((string) $instance->quantity, $step);
        $resources = [];
        for ($index = 1; $index <= $count; $index++) {
            $resources[] = [
                'index' => $index,
                'quantity' => $step,
                'redemption_fields' => $this->fieldsForService(
                    (int) $instance->team_id,
                    (int) $instance->service_id,
                    $customer,
                    (int) $instance->id,
                    $index
                ),
            ];
        }
        return $resources;
    }

    public function saveForStage(TeamServiceInstance $instance, string $stage, array $values): void
    {
        $this->saveResourceForStage($instance, $stage, 1, $values);
    }

    public function saveResourcesForStage(TeamServiceInstance $instance, string $stage, array $values): void
    {
        $entitlement = $instance->entitlement ?: $instance->entitlement()->find();
        $step = (string) ($entitlement?->quantity_step ?? '1');
        $count = $this->resourceCount((string) $instance->quantity, $step);
        $resources = $this->normalizeResourceMatrix($values, $count);
        foreach ($resources as $offset => $resourceValues) {
            $this->saveResourceForStage($instance, $stage, $offset + 1, $resourceValues);
        }
    }

    private function saveResourceForStage(TeamServiceInstance $instance, string $stage, int $resourceIndex, array $values): void
    {
        if (!in_array($stage, ['customer', 'manager'], true)) throw new HttpException(500, '核销字段阶段无效');
        $fields = TeamServiceRedemptionField::where('team_id', $instance->team_id)
            ->where('service_id', $instance->service_id)->where('fill_stage', $stage)
            ->where('is_active', 1)->order('sort', 'asc')->select();
        $provided = [];
        foreach ($values as $fieldId => $raw) $provided[(int) $fieldId] = $raw;
        $known = [];
        foreach ($fields as $field) $known[(int) $field->id] = $field;
        if (array_diff(array_keys($provided), array_keys($known))) throw new HttpException(422, '核销字段与服务或填写阶段不匹配');

        $normalizer = app(TeamEntityField::class);
        Db::transaction(function () use ($instance, $fields, $provided, $normalizer, $resourceIndex) {
            foreach ($fields as $field) {
                $fieldId = (int) $field->id;
                $existing = TeamServiceFieldValue::where('service_instance_id', $instance->id)
                    ->where('field_id', $fieldId)->where('resource_index', $resourceIndex)->find();
                $hasInput = array_key_exists($fieldId, $provided);
                $raw = $hasInput ? $provided[$fieldId] : ($existing ? $this->raw($existing) : $field->default_value);
                if ($field->is_required && $normalizer->emptyValue($raw)) throw new HttpException(422, "字段 {$field->name} 不能为空");
                if (!$hasInput && $existing) continue;
                if (!$hasInput && $normalizer->emptyValue($raw)) continue;
                $data = $normalizer->normalizeValue((string) $field->value_type, $raw, is_array($field->options) ? $field->options : []);
                $value = TeamServiceFieldValue::withTrashed()->where('service_instance_id', $instance->id)
                    ->where('field_id', $fieldId)->where('resource_index', $resourceIndex)->find();
                if (!$value) $value = new TeamServiceFieldValue;
                else $value->restore();
                $value->save($data + [
                    'service_instance_id' => $instance->id,
                    'field_id' => $fieldId,
                    'resource_index' => $resourceIndex,
                ]);
            }
        });
    }

    public function validateForService(int $teamId, int $serviceId, string $stage, array $values): array
    {
        if (!in_array($stage, ['customer', 'manager'], true)) throw new HttpException(500, '核销字段阶段无效');
        if ($serviceId < 1) return [];
        $fields = TeamServiceRedemptionField::where('team_id', $teamId)
            ->where('service_id', $serviceId)->where('fill_stage', $stage)
            ->where('is_active', 1)->order('sort', 'asc')->select();
        $provided = [];
        foreach ($values as $fieldId => $raw) $provided[(int) $fieldId] = $raw;
        $known = [];
        foreach ($fields as $field) $known[(int) $field->id] = $field;
        if (array_diff(array_keys($provided), array_keys($known))) throw new HttpException(422, '核销字段与服务或填写阶段不匹配');

        $normalizer = app(TeamEntityField::class);
        $result = [];
        foreach ($fields as $field) {
            $fieldId = (int) $field->id;
            $raw = array_key_exists($fieldId, $provided) ? $provided[$fieldId] : $field->default_value;
            if ($field->is_required && $normalizer->emptyValue($raw)) throw new HttpException(422, "字段 {$field->name} 不能为空");
            if ($normalizer->emptyValue($raw)) continue;
            $normalizer->normalizeValue((string) $field->value_type, $raw, is_array($field->options) ? $field->options : []);
            $result[$fieldId] = $raw;
        }
        return $result;
    }

    public function validateResourcesForService(
        int $teamId,
        int $serviceId,
        string $stage,
        mixed $quantity,
        mixed $step,
        array $values
    ): array {
        $count = $this->resourceCount((string) $quantity, (string) $step);
        $resources = $this->normalizeResourceMatrix($values, $count);
        $result = [];
        foreach ($resources as $resourceValues) {
            $result[] = $this->validateForService($teamId, $serviceId, $stage, $resourceValues);
        }
        return $result;
    }

    public function fieldsForValues(int $teamId, int $serviceId, array $values): array
    {
        $fields = $this->fieldsForService($teamId, $serviceId, false);
        foreach ($fields as &$field) $field['value'] = $values[(int) $field['id']] ?? null;
        return $fields;
    }

    public function resourcesForValues(
        int $teamId,
        int $serviceId,
        mixed $quantity,
        mixed $step,
        array $values,
        bool $customer = false
    ): array {
        $count = $this->resourceCount((string) $quantity, (string) $step);
        $matrix = $this->normalizeResourceMatrix($values, $count, false);
        $resources = [];
        foreach ($matrix as $offset => $resourceValues) {
            $fields = $this->fieldsForService($teamId, $serviceId, $customer);
            foreach ($fields as &$field) $field['value'] = $resourceValues[(int) $field['id']] ?? null;
            $resources[] = [
                'index' => $offset + 1,
                'quantity' => (string) $step,
                'redemption_fields' => $fields,
            ];
        }
        return $resources;
    }

    public function copyStageValues(TeamServiceInstance $source, TeamServiceInstance $target, string $stage): void
    {
        if (!in_array($stage, ['customer', 'manager'], true)) {
            throw new HttpException(500, '核销字段阶段无效');
        }
        $fieldIds = TeamServiceRedemptionField::where('team_id', $source->team_id)
            ->where('service_id', $source->service_id)
            ->where('fill_stage', $stage)
            ->column('id');
        if (!$fieldIds) return;

        $columns = ['value_string', 'value_text', 'value_int', 'value_decimal', 'value_datetime', 'value_json'];
        foreach (TeamServiceFieldValue::where('service_instance_id', $source->id)
            ->whereIn('field_id', $fieldIds)->select() as $sourceValue) {
            $payload = [
                'service_instance_id' => $target->id,
                'field_id' => $sourceValue->field_id,
                'resource_index' => $sourceValue->resource_index,
            ];
            foreach ($columns as $column) $payload[$column] = $sourceValue->{$column};
            (new TeamServiceFieldValue)->save($payload);
        }
    }

    public function splitStageValues(
        TeamServiceInstance $source,
        TeamServiceInstance $target,
        string $stage,
        int $claimedResourceCount
    ): void {
        if (!in_array($stage, ['customer', 'manager'], true)) {
            throw new HttpException(500, '核销字段阶段无效');
        }
        $fieldIds = TeamServiceRedemptionField::where('team_id', $source->team_id)
            ->where('service_id', $source->service_id)->where('fill_stage', $stage)->column('id');
        if (!$fieldIds) return;

        $columns = ['value_string', 'value_text', 'value_int', 'value_decimal', 'value_datetime', 'value_json'];
        foreach (TeamServiceFieldValue::where('service_instance_id', $source->id)
            ->whereIn('field_id', $fieldIds)->where('resource_index', '>', $claimedResourceCount)->select() as $sourceValue) {
            $payload = [
                'service_instance_id' => $target->id,
                'field_id' => $sourceValue->field_id,
                'resource_index' => (int) $sourceValue->resource_index - $claimedResourceCount,
            ];
            foreach ($columns as $column) $payload[$column] = $sourceValue->{$column};
            (new TeamServiceFieldValue)->save($payload);
            $sourceValue->delete();
        }
    }

    public function resourceCount(string $quantity, string $step): int
    {
        $quantityService = app(ServiceQuantity::class);
        $quantityMinor = $quantityService->toMinor($quantity);
        $stepMinor = $quantityService->toMinor($step);
        if ($stepMinor < 1 || $quantityMinor < $stepMinor || $quantityMinor % $stepMinor !== 0) {
            throw new HttpException(422, '履约数量必须按最小步长拆分为独立资源');
        }
        return intdiv($quantityMinor, $stepMinor);
    }

    private function normalizeResourceMatrix(array $values, int $count, bool $requireAll = true): array
    {
        if ($values === []) return array_fill(0, $count, []);
        $isMatrix = array_is_list($values) && (!$values || is_array($values[0] ?? null));
        $resources = $isMatrix ? array_values($values) : [$values];
        if ($requireAll && count($resources) !== $count) {
            throw new HttpException(422, "请分别填写 {$count} 份履约资源的字段");
        }
        while (count($resources) < $count) $resources[] = [];
        if (count($resources) > $count) throw new HttpException(422, '履约资源字段数量超过本次履约数量');
        foreach ($resources as $resource) {
            if (!is_array($resource)) throw new HttpException(422, '履约资源字段格式无效');
        }
        return $resources;
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

    private function validate(array $data): void
    {
        $validator = new \app\validate\TeamEntityField;
        $check = $data + ['entity_type' => 'entity', 'source' => 'custom'];
        if ($data['name'] === '' || mb_strlen($data['name']) > 50) throw new HttpException(422, '字段名称长度需在 1-50 位之间');
        if (!$validator->scene('update')->check($check)) throw new HttpException(422, $validator->getError());
        if (isset($data['fill_stage']) && !in_array($data['fill_stage'], ['customer', 'manager'], true)) throw new HttpException(422, '填写阶段无效');
        foreach (['is_customer_visible', 'is_required', 'is_active'] as $key) {
            if (isset($data[$key]) && !in_array((int) $data[$key], [0, 1], true)) throw new HttpException(422, "{$key} 格式无效");
        }
    }

    private function service(int $teamId, int $serviceId): TeamService
    {
        $service = TeamService::where('team_id', $teamId)->find($serviceId);
        if (!$service) throw new HttpException(404, '服务不存在');
        return $service;
    }
}
