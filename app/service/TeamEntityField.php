<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ManageScope;
use app\enum\TeamEntityType;
use app\enum\Visibility;
use app\model\TeamEntityField as TeamEntityFieldModel;
use app\model\TeamEntityFieldValue;
use app\model\VisibilityTarget;
use think\exception\HttpException;

class TeamEntityField
{
    /** 与实体字段共享同一套值类型校验。 */
    public function normalizeValue(string $type, mixed $value, array $options = []): array
    {
        return $this->valueData($type, $value, $options);
    }

    public function emptyValue(mixed $value): bool
    {
        return $this->isEmptyValue($value);
    }

    public function list(int $teamId, string $entityType): array
    {
        $type = $this->type($entityType);
        return TeamEntityFieldModel::where('team_id', $teamId)
            ->where('entity_type', $type->value)
            ->order('sort', 'asc')->order('id', 'asc')->select()->toArray();
    }

    public function get(int $teamId, int $id): array
    {
        $field = $this->field($teamId, $id);
        $result = $field->toArray();
        $result['visibility_targets'] = VisibilityTarget::with(['subject'])
            ->where('visibleable_type', 'entityField')
            ->where('visibleable_id', (int) $field->id)
            ->select()
            ->toArray();
        return $result;
    }

    public function create(int $teamId, array $data): int
    {
        $this->validate('create', $this->validationData($data));
        $type = $this->type((string) $data['entity_type']);
        if (TeamEntityFieldModel::where('team_id', $teamId)->where('entity_type', $type->value)
            ->where('field_key', $data['field_key'])->find()) {
            throw new HttpException(409, '字段标识已存在');
        }
        $visibility = Visibility::from((int) ($data['visibility'] ?? Visibility::Team->value));
        $visibilityTargets = $this->visibilityTargetsInput($data);
        return \think\facade\Db::transaction(function () use (
            $teamId,
            $type,
            $data,
            $visibility,
            $visibilityTargets
        ) {
            $field = app(TeamEntityFieldModel::class, [], true);
            $field->save([
                'team_id' => $teamId, 'entity_type' => $type, 'field_key' => $data['field_key'],
                'name' => $data['name'], 'source' => $data['source'] ?? 'custom',
                'value_type' => $data['value_type'] ?? 'string',
                'input_type' => $data['input_type'] ?? 'text', 'options' => $data['options'] ?? null,
                'default_value' => $data['default_value'] ?? null,
                'manager_scope' => ManageScope::from((int) ($data['manager_scope'] ?? ManageScope::Team->value)),
                'visibility' => $visibility,
                'is_required' => (int) ($data['is_required'] ?? 0),
                'is_editable' => (int) ($data['is_editable'] ?? 1),
                'is_searchable' => (int) ($data['is_searchable'] ?? 0),
                'is_system' => 0, 'sort' => (int) ($data['sort'] ?? 0),
            ]);
            app(\app\service\Visibility::class)->syncTargets(
                $field,
                $visibility === Visibility::Custom ? $visibilityTargets : [],
                $teamId
            );
            return (int) $field->id;
        });
    }

    public function update(int $teamId, int $id, array $data): void
    {
        $field = $this->field($teamId, $id);
        $this->validate('update', $this->validationData($data));
        $allow = array_intersect_key($data, array_flip([
            'name', 'source', 'value_type', 'input_type', 'options', 'default_value',
            'manager_scope', 'visibility', 'is_required', 'is_editable',
            'is_searchable', 'sort',
        ]));
        if (array_key_exists('manager_scope', $allow)) {
            $allow['manager_scope'] = ManageScope::from((int) $allow['manager_scope']);
        }
        if (array_key_exists('visibility', $allow)) {
            $allow['visibility'] = Visibility::from((int) $allow['visibility']);
        }
        $visibility = $allow['visibility'] ?? $field->enumCase('visibility');
        $visibilityTargets = $this->visibilityTargetsInput($data);
        \think\facade\Db::transaction(function () use (
            $field,
            $allow,
            $data,
            $teamId,
            $visibility,
            $visibilityTargets
        ) {
            if ($allow) {
                $field->save($allow);
            }
            if (array_key_exists('visibility', $data) || array_key_exists('visibility_targets', $data)) {
                app(\app\service\Visibility::class)->syncTargets(
                    $field,
                    $visibility === Visibility::Custom ? $visibilityTargets : [],
                    $teamId
                );
            }
        });
    }

    public function delete(int $teamId, int $id): void
    {
        $field = $this->field($teamId, $id);
        if ($field->is_system) {
            throw new HttpException(422, '系统字段不能删除');
        }
        \think\facade\Db::transaction(function () use ($field) {
            foreach (VisibilityTarget::where('visibleable_type', 'entityField')
                ->where('visibleable_id', (int) $field->id)
                ->select() as $target) {
                $target->delete();
            }
            foreach (TeamEntityFieldValue::where('field_id', $field->id)->select() as $value) {
                $value->delete();
            }
            $field->delete();
        });
    }

    public function typeFor(int $teamId, int $id): string
    {
        return $this->field($teamId, $id)->enumCase('entity_type')->value;
    }

    public function values(int $teamId, string $entitySlug): array
    {
        $actor = app(ChatActor::class)->resolve($teamId, $entitySlug);
        return TeamEntityFieldValue::where('team_id', $teamId)
            ->where('entity_id', $actor['entity_id'])->with(['field'])->select()->toArray();
    }

    public function visibleFields(
        int $teamId,
        string $entityType,
        int $subjectEntityId,
        array $actingEntity,
        bool $isFieldManager = false
    ): array {
        $type = $this->type($entityType);
        $actingEntityId = (int) ($actingEntity['entity_id'] ?? 0);
        $result = [];
        $fields = TeamEntityFieldModel::where('team_id', $teamId)
            ->where('entity_type', $type->value)
            ->order('sort', 'asc')->order('id', 'asc')->select();
        foreach ($fields as $field) {
            if (!$this->canView($field, $actingEntityId, $subjectEntityId, $isFieldManager)) {
                continue;
            }
            $item = $field->toArray();
            $item['can_edit'] = (bool) $field->is_editable && (
                $isFieldManager
                || (
                    $actingEntityId === $subjectEntityId
                    && $field->enumCase('manager_scope') === ManageScope::SubjectTeam
                )
            );
            $result[] = $item;
        }
        return $result;
    }

    public function visibleValues(
        int $teamId,
        int $subjectEntityId,
        string $entityType,
        array $actingEntity,
        bool $isFieldManager = false
    ): array {
        $fields = $this->visibleFields(
            $teamId,
            $entityType,
            $subjectEntityId,
            $actingEntity,
            $isFieldManager
        );
        $fieldMap = [];
        foreach ($fields as $field) {
            $fieldMap[(int) $field['id']] = $field;
        }
        if (!$fieldMap) {
            return [];
        }

        $result = [];
        foreach (TeamEntityFieldValue::where('team_id', $teamId)
            ->where('entity_id', $subjectEntityId)
            ->whereIn('field_id', array_keys($fieldMap))
            ->select()->toArray() as $value) {
            $value['field'] = $fieldMap[(int) $value['field_id']];
            $result[] = $value;
        }
        return $result;
    }

    public function saveValues(int $teamId, string $entitySlug, array $values): int
    {
        return $this->persistValues($teamId, $entitySlug, $values, false);
    }

    public function saveOwnValues(int $teamId, string $entitySlug, array $values): void
    {
        $this->persistValues($teamId, $entitySlug, $values, true);
    }

    private function persistValues(int $teamId, string $entitySlug, array $values, bool $ownOnly): int
    {
        $actor = app(ChatActor::class)->resolve($teamId, $entitySlug);
        $normalizedValues = [];
        foreach ($values as $fieldId => $rawValue) {
            $normalizedValues[(int) $fieldId] = $rawValue;
        }
        $fieldType = $this->actorFieldType($actor);
        $prepared = [];
        foreach ($normalizedValues as $fieldId => $rawValue) {
            $field = $this->field($teamId, (int) $fieldId);
            if ($field->enumCase('entity_type') !== $fieldType) {
                throw new HttpException(422, '字段与对象类型不匹配');
            }
            if ($ownOnly && (
                !$this->canView($field, (int) $actor['entity_id'], (int) $actor['entity_id'], false)
                || $field->enumCase('manager_scope') !== ManageScope::SubjectTeam
                || !(int) $field->is_editable
            )) {
                throw new HttpException(403, "字段 {$field->name} 不允许本人编辑");
            }
            if (!$ownOnly && !$field->is_editable) {
                throw new HttpException(422, "字段 {$field->name} 不允许编辑");
            }
            if ($field->is_required && $this->isEmptyValue($rawValue)) {
                throw new HttpException(422, "字段 {$field->name} 不能为空");
            }
            $prepared[] = [
                'field' => $field,
                'data' => $this->valueData(
                    (string) $field->value_type,
                    $rawValue,
                    is_array($field->options) ? $field->options : []
                ),
            ];
        }
        $this->assertRequiredValues($teamId, $actor, $normalizedValues, $ownOnly);
        \think\facade\Db::transaction(function () use ($teamId, $actor, $prepared) {
            foreach ($prepared as $item) {
                $field = $item['field'];
                $value = TeamEntityFieldValue::withTrashed()
                    ->where('field_id', $field->id)
                    ->where('entity_id', $actor['entity_id'])->find();
                if (!$value) {
                    $value = app(TeamEntityFieldValue::class, [], true);
                }
                $value->save(array_merge($item['data'], [
                    'team_id' => $teamId, 'field_id' => $field->id,
                    'entity_id' => $actor['entity_id'],
                    'delete_time' => null,
                ]));
            }
        });
        return (int) $actor['entity_id'];
    }

    private function assertRequiredValues(int $teamId, array $actor, array $values, bool $ownOnly): void
    {
        $requiredFields = TeamEntityFieldModel::where('team_id', $teamId)
            ->where('entity_type', $this->actorFieldType($actor)->value)
            ->where('is_required', 1)
            ->select();
        foreach ($requiredFields as $field) {
            if ($ownOnly && (
                !$this->canView($field, (int) $actor['entity_id'], (int) $actor['entity_id'], false)
                || $field->enumCase('manager_scope') !== ManageScope::SubjectTeam
                || !(int) $field->is_editable
            )) {
                continue;
            }
            if (array_key_exists((int) $field->id, $values)) {
                if ($this->isEmptyValue($values[(int) $field->id])) {
                    throw new HttpException(422, "字段 {$field->name} 不能为空");
                }
                continue;
            }
            $stored = TeamEntityFieldValue::where('field_id', $field->id)
                ->where('entity_id', $actor['entity_id'])
                ->find();
            if (!$stored || !$this->hasStoredValue($stored)) {
                throw new HttpException(422, "字段 {$field->name} 不能为空");
            }
        }
    }

    private function actorFieldType(array $actor): TeamEntityType
    {
        return match ($actor['type']) {
            \app\enum\ChatActorType::Entity, \app\enum\ChatActorType::Team => TeamEntityType::Entity,
            \app\enum\ChatActorType::Customer => TeamEntityType::Customer,
            \app\enum\ChatActorType::Virtual => TeamEntityType::Virtual,
            default => throw new HttpException(422, '该人员类型不支持自定义字段'),
        };
    }

    private function hasStoredValue(TeamEntityFieldValue $value): bool
    {
        foreach ([
            'value_string', 'value_text', 'value_int', 'value_decimal',
            'value_datetime', 'value_json',
        ] as $column) {
            if (!$this->isEmptyValue($value->{$column})) {
                return true;
            }
        }
        return false;
    }

    private function valueData(string $type, mixed $value, array $options): array
    {
        $data = array_fill_keys([
            'value_string', 'value_text', 'value_int', 'value_decimal', 'value_datetime', 'value_json',
        ], null);
        $column = match ($type) {
            'text' => 'value_text', 'int', 'bool' => 'value_int', 'decimal' => 'value_decimal',
            'date', 'datetime' => 'value_datetime', 'multi_select', 'json' => 'value_json',
            default => 'value_string',
        };
        $data[$column] = match ($type) {
            'int' => $this->integerValue($value),
            'bool' => $this->booleanValue($value),
            'decimal' => $this->decimalValue($value),
            'date', 'datetime' => $this->datetimeValue($value),
            'select' => $this->selectValue($value, $options),
            'multi_select' => $this->multiSelectValue($value, $options),
            'json' => $this->jsonValue($value),
            default => $this->stringValue($value, $column === 'value_string' ? 500 : null),
        };
        return $data;
    }

    private function validationData(array $data): array
    {
        if (array_key_exists('options', $data) && $data['options'] === null) {
            unset($data['options']);
        }
        return $data;
    }

    private function visibilityTargetsInput(array $data): array
    {
        if (!array_key_exists('visibility_targets', $data) || $data['visibility_targets'] === null) {
            return [];
        }
        if (!is_array($data['visibility_targets'])) {
            throw new HttpException(422, '指定可见对象格式不正确');
        }
        return $data['visibility_targets'];
    }

    private function canView(
        TeamEntityFieldModel $field,
        int $actingEntityId,
        int $subjectEntityId,
        bool $isFieldManager
    ): bool {
        if ($isFieldManager) {
            return true;
        }
        return match ($field->enumCase('visibility')) {
            Visibility::Team => false,
            Visibility::SubjectTeam => $actingEntityId > 0 && $actingEntityId === $subjectEntityId,
            Visibility::Entity => $actingEntityId > 0,
            Visibility::Public => true,
            Visibility::Custom => $actingEntityId > 0 && (bool) VisibilityTarget::where(
                'visibleable_type',
                'entityField'
            )
                ->where('visibleable_id', (int) $field->id)
                ->where('entity_id', $actingEntityId)
                ->find(),
        };
    }

    private function isEmptyValue(mixed $value): bool
    {
        return $value === null || $value === '' || $value === [];
    }

    private function integerValue(mixed $value): ?int
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && preg_match('/^-?\d+$/', $value))) {
            throw new HttpException(422, '整数字段值格式不正确');
        }
        return (int) $value;
    }

    private function booleanValue(mixed $value): ?int
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        if (!in_array($value, [0, 1, '0', '1', false, true], true)) {
            throw new HttpException(422, '布尔字段值格式不正确');
        }
        return (int) (bool) $value;
    }

    private function decimalValue(mixed $value): ?string
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        if ((!is_int($value) && !is_float($value) && !is_string($value)) || !is_numeric((string) $value)) {
            throw new HttpException(422, '数值字段值格式不正确');
        }
        return (string) $value;
    }

    private function datetimeValue(mixed $value): ?int
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        $timestamp = is_numeric($value) ? (int) $value : strtotime((string) $value);
        if ($timestamp === false || $timestamp < 0) {
            throw new HttpException(422, '日期字段值格式不正确');
        }
        return $timestamp;
    }

    private function selectValue(mixed $value, array $options): ?string
    {
        $value = $this->stringValue($value, 500);
        if ($value !== null && !in_array($value, array_map('strval', $options), true)) {
            throw new HttpException(422, '选择字段值不在可选项中');
        }
        return $value;
    }

    private function multiSelectValue(mixed $value, array $options): ?array
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        if (!is_array($value)) {
            throw new HttpException(422, '多选字段值格式不正确');
        }
        $values = array_values(array_unique(array_map('strval', $value)));
        if (array_diff($values, array_map('strval', $options))) {
            throw new HttpException(422, '多选字段值包含无效选项');
        }
        return $values;
    }

    private function jsonValue(mixed $value): mixed
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        if (!is_string($value)) {
            return $value;
        }
        try {
            return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new HttpException(422, 'JSON字段值格式不正确');
        }
    }

    private function stringValue(mixed $value, ?int $maxLength): ?string
    {
        if ($this->isEmptyValue($value)) {
            return null;
        }
        if (!is_scalar($value)) {
            throw new HttpException(422, '文本字段值格式不正确');
        }
        $value = (string) $value;
        if ($maxLength !== null && mb_strlen($value) > $maxLength) {
            throw new HttpException(422, "文本字段值不能超过{$maxLength}位");
        }
        return $value;
    }

    private function field(int $teamId, int $id): TeamEntityFieldModel
    {
        $field = TeamEntityFieldModel::where('team_id', $teamId)->find($id);
        if (!$field) {
            throw new HttpException(404, '对象字段不存在');
        }
        return $field;
    }

    private function type(string $value): TeamEntityType
    {
        try {
            return TeamEntityType::from($value);
        } catch (\ValueError) {
            throw new HttpException(422, '对象类型不正确');
        }
    }

    private function validate(string $scene, array $data): void
    {
        $validator = new \app\validate\TeamEntityField;
        if (!$validator->scene($scene)->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
    }
}
