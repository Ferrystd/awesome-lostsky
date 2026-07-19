<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ManageScope;
use app\enum\Visibility as VisibilityEnum;
use think\exception\HttpException;

class TeamMemberField
{
    /**
     * 获取成员字段定义列表
     */
    public function list(int $teamId, array $filters = [], int $userId = 0, int $memberId = 0): array
    {
        $query = \app\model\TeamMemberField::where('team_id', $teamId);
        $guard = app(\app\service\Visibility::class);
        $isManager = $guard->isTeamManager($teamId, $userId);

        if (!empty($filters['keyword'])) {
            $query->whereLike('name|field_key', "%{$filters['keyword']}%");
        }
        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        return $query
            ->order('sort', 'asc')
            ->order('id', 'asc')
            ->select()
            ->filter(fn ($field) => $guard->canView($field, $teamId, $memberId, $isManager, false))
            ->toArray();
    }

    /**
     * 获取单个成员字段定义
     */
    public function get(int $teamId, int $id, int $userId = 0, int $memberId = 0): array
    {
        $field = $this->field($teamId, $id);
        $guard = app(\app\service\Visibility::class);
        $guard->assertView($field, $teamId, $memberId, $guard->isTeamManager($teamId, $userId), false);

        return $field->toArray();
    }

    /**
     * 新增成员字段定义
     */
    public function create(int $teamId, array $data): void
    {
        $data = array_merge([
            'source'        => 'custom',
            'value_type'    => 'string',
            'input_type'    => 'text',
            'default_value' => null,
            'is_required'   => 0,
            'manager_scope' => ManageScope::Team->value,
            'visibility'    => VisibilityEnum::Team->value,
            'is_editable'   => 1,
            'is_searchable' => 0,
            'is_system'     => 0,
            'sort'          => 0,
        ], $data);
        $data['options'] = $this->options($data['options'] ?? null);

        $validator = new \app\validate\TeamMemberField;
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        if (\app\model\TeamMemberField::where('team_id', $teamId)->where('field_key', $data['field_key'])->find()) {
            throw new HttpException(409, '字段标识已存在');
        }

        $managerScope = $this->managerScope($data['manager_scope'] ?? ManageScope::Team->value);
        $visibility   = $this->visibility($data['visibility'] ?? VisibilityEnum::Team->value);
        $this->assertPolicy($managerScope, $visibility);

        unset($data['visibility_targets']);

        $field = app(\app\model\TeamMemberField::class);
        $field->save(array_merge($data, [
            'team_id'       => $teamId,
            'manager_scope' => $managerScope,
            'visibility'    => $visibility,
        ]));
    }

    /**
     * 编辑成员字段定义
     */
    public function update(int $teamId, int $id, array $data): void
    {
        if (array_key_exists('options', $data)) {
            $data['options'] = $this->options($data['options']);
        }

        $validator = new \app\validate\TeamMemberField;
        if (!$validator->scene('update')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $field        = $this->field($teamId, $id);
        $managerScope = array_key_exists('manager_scope', $data) ? $this->managerScope($data['manager_scope']) : $field->enumCase('manager_scope');
        $visibility   = array_key_exists('visibility', $data) ? $this->visibility($data['visibility']) : $field->enumCase('visibility');
        $this->assertPolicy($managerScope, $visibility);

        unset($data['visibility_targets']);

        $field->save(array_merge($data, [
            'manager_scope' => $managerScope,
            'visibility'    => $visibility,
        ]));
    }

    /**
     * 删除成员字段定义
     */
    public function delete(int $teamId, int $id): void
    {
        $field = $this->field($teamId, $id);
        if ($field->is_system) {
            throw new HttpException(422, '系统字段不能删除');
        }

        \think\facade\Db::transaction(function () use ($field) {
            \app\model\TeamMemberFieldValue::where('field_id', $field->id)->delete();
            \app\model\VisibilityTarget::where('visibleable_type', 'teamMemberField')
                ->where('visibleable_id', (int) $field->id)
                ->delete();
            $field->delete();
        });
    }

    /**
     * 获取成员字段值
     */
    public function values(int $teamId, int $memberId, int $userId = 0, int $viewerMemberId = 0): array
    {
        $this->member($teamId, $memberId);
        $guard = app(\app\service\Visibility::class);
        $isManager = $guard->isTeamManager($teamId, $userId);
        $isSubject = $memberId === $viewerMemberId;

        return \app\model\TeamMemberFieldValue::where('member_id', $memberId)
            ->with(['field'])
            ->select()
            ->filter(fn ($value) => $value->field && $guard->canView($value->field, $teamId, $viewerMemberId, $isManager, $isSubject))
            ->toArray();
    }

    /**
     * 保存成员字段值，values 使用 field_id => value
     */
    public function saveValues(int $teamId, int $memberId, array $values, int $userId = 0, int $viewerMemberId = 0): void
    {
        $validator = new \app\validate\TeamMemberFieldValue;
        if (!$validator->scene('save')->check(['member_id' => $memberId, 'values' => $values])) {
            throw new HttpException(422, $validator->getError());
        }

        $this->member($teamId, $memberId);
        $guard = app(\app\service\Visibility::class);
        $isManager = $guard->isTeamManager($teamId, $userId);
        $isSubject = $memberId === $viewerMemberId;

        \think\facade\Db::transaction(function () use ($teamId, $memberId, $values, $validator, $guard, $isManager, $isSubject) {
            foreach ($values as $fieldId => $rawValue) {
                $field = $this->field($teamId, (int) $fieldId);
                if (!$field->is_editable) {
                    throw new HttpException(422, "字段 {$field->name} 不允许编辑");
                }
                $guard->assertManage($field->enumCase('manager_scope'), $isManager, $isSubject);

                [$column, $scene, $data] = $this->valueData($field->value_type, $rawValue);
                if (!$validator->scene($scene)->check([$scene => $rawValue])) {
                    throw new HttpException(422, $validator->getError());
                }

                $value = \app\model\TeamMemberFieldValue::where('member_id', $memberId)
                    ->where('field_id', $field->id)
                    ->findOrEmpty();

                $value->save(array_merge([
                    'member_id' => $memberId,
                    'field_id' => $field->id,
                ], $data));
            }
        });
    }

    private function field(int $teamId, int $id): \app\model\TeamMemberField
    {
        $field = \app\model\TeamMemberField::where('team_id', $teamId)->find($id);
        if (!$field) {
            throw new HttpException(404, '成员字段不存在');
        }

        return $field;
    }

    private function member(int $teamId, int $memberId): \app\model\TeamMember
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)->find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }

        return $member;
    }

    private function valueData(string $type, $value): array
    {
        $data = [
            'value_string' => null,
            'value_text' => null,
            'value_int' => null,
            'value_decimal' => null,
            'value_datetime' => null,
            'value_json' => null,
        ];

        [$column, $scene] = match ($type) {
            'text' => ['value_text', 'value_text'],
            'int' => ['value_int', 'value_int'],
            'bool' => ['value_int', 'value_bool'],
            'decimal' => ['value_decimal', 'value_decimal'],
            'date', 'datetime' => ['value_datetime', 'value_datetime'],
            'multi_select' => ['value_json', 'value_array'],
            'json' => ['value_json', 'value_json'],
            default => ['value_string', 'value_string'],
        };
        $data[$column] = $value;

        return [$column, $scene, $data];
    }

    private function options($options): ?array
    {
        if ($options === null || $options === '') {
            return null;
        }
        if (is_array($options)) {
            return array_values($options);
        }
        if (!is_string($options)) {
            throw new HttpException(422, '字段选项格式不正确');
        }

        $decoded = json_decode($options, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            throw new HttpException(422, '字段选项格式不正确');
        }

        return array_values($decoded);
    }

    private function assertPolicy(ManageScope $managerScope, VisibilityEnum $visibility): void
    {
        $allowed = match ($managerScope) {
            ManageScope::Team => in_array($visibility, [VisibilityEnum::Team, VisibilityEnum::SubjectTeam, VisibilityEnum::Member, VisibilityEnum::Public], true),
            ManageScope::SubjectTeam => in_array($visibility, [VisibilityEnum::SubjectTeam, VisibilityEnum::Member, VisibilityEnum::Public], true),
        };

        if (!$allowed) {
            throw new HttpException(422, '管理范围与可见范围组合不合法');
        }
    }

    private function managerScope($value): ManageScope
    {
        try {
            return $value instanceof ManageScope ? $value : ManageScope::from((int) $value);
        } catch (\ValueError) {
            throw new HttpException(422, '管理范围格式不正确');
        }
    }

    private function visibility($value): VisibilityEnum
    {
        try {
            return $value instanceof VisibilityEnum ? $value : VisibilityEnum::from((int) $value);
        } catch (\ValueError) {
            throw new HttpException(422, '可见范围格式不正确');
        }
    }
}
