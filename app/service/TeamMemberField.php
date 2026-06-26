<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;
use think\facade\Db;

class TeamMemberField
{
    /**
     * 获取成员字段定义列表
     */
    public function list(int $teamId, array $filters = []): array
    {
        $query = \app\model\TeamMemberField::where('team_id', $teamId);

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
            ->toArray();
    }

    /**
     * 获取单个成员字段定义
     */
    public function get(int $teamId, int $id): array
    {
        return $this->field($teamId, $id)->toArray();
    }

    /**
     * 新增成员字段定义
     */
    public function create(int $teamId, array $data): void
    {
        $validator = new \app\validate\TeamMemberField;
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        if (\app\model\TeamMemberField::where('team_id', $teamId)->where('field_key', $data['field_key'])->find()) {
            throw new HttpException(409, '字段标识已存在');
        }

        $field = new \app\model\TeamMemberField;
        $field->save(array_merge(['team_id' => $teamId], $data));
    }

    /**
     * 编辑成员字段定义
     */
    public function update(int $teamId, int $id, array $data): void
    {
        $validator = new \app\validate\TeamMemberField;
        if (!$validator->scene('update')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }

        $this->field($teamId, $id)->save($data);
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

        Db::transaction(function () use ($field) {
            \app\model\TeamMemberFieldValue::where('field_id', $field->id)->delete();
            $field->delete();
        });
    }

    /**
     * 获取成员字段值
     */
    public function values(int $teamId, int $memberId): array
    {
        $this->member($teamId, $memberId);

        return \app\model\TeamMemberFieldValue::where('member_id', $memberId)
            ->with(['field'])
            ->select()
            ->toArray();
    }

    /**
     * 保存成员字段值，values 使用 field_id => value
     */
    public function saveValues(int $teamId, int $memberId, array $values): void
    {
        $validator = new \app\validate\TeamMemberFieldValue;
        if (!$validator->scene('save')->check(['member_id' => $memberId, 'values' => $values])) {
            throw new HttpException(422, $validator->getError());
        }

        $this->member($teamId, $memberId);

        Db::transaction(function () use ($teamId, $memberId, $values, $validator) {
            foreach ($values as $fieldId => $rawValue) {
                $field = $this->field($teamId, (int) $fieldId);
                if (!$field->is_editable) {
                    throw new HttpException(422, "字段 {$field->name} 不允许编辑");
                }

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
}
