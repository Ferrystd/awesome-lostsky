<?php
declare(strict_types=1);

namespace app\service;

use app\enum\TeamJoinStatus;
use app\model\TeamJoinApplication;
use app\model\TeamJoinField;
use app\model\TeamJoinFieldValue;
use app\model\TeamJoinTask;
use app\model\TeamMemberProfile;
use think\exception\HttpException;
use think\file\UploadedFile;

class TeamJoin
{
    private const ACTIVE_STATUSES = [
        TeamJoinStatus::Applied->value,
        TeamJoinStatus::Reviewing->value,
    ];

    public function fields(int $teamId, bool $onlyFillable = false): array
    {
        $query = TeamJoinField::where('team_id', $teamId)->where('is_active', 1);
        if ($onlyFillable) {
            $query->where('is_apply_fillable', 1);
        }

        return $query->with(['memberField'])
            ->order('sort', 'asc')
            ->order('id', 'asc')
            ->select()
            ->toArray();
    }

    public function createField(int $teamId, array $data): int
    {
        $data = $this->fieldData($data);

        $validator = new \app\validate\TeamJoinField;
        if (!$validator->scene('create')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
        if (TeamJoinField::where('team_id', $teamId)->where('field_key', $data['field_key'])->find()) {
            throw new HttpException(409, '申请字段标识已存在');
        }
        $this->assertTransferField($teamId, $data);

        $field = new TeamJoinField;
        $field->save(array_merge(['team_id' => $teamId], $data));

        return (int) $field->id;
    }

    public function updateField(int $teamId, int $id, array $data): void
    {
        if (!$data) {
            return;
        }
        $field = $this->field($teamId, $id);
        if (array_key_exists('options', $data)) {
            $data['options'] = $this->options($data['options']);
        }

        $validator = new \app\validate\TeamJoinField;
        if (!$validator->scene('update')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
        $this->assertTransferField($teamId, array_merge($field->toArray(), $data));

        $field->save($data);
    }

    public function deleteField(int $teamId, int $id): void
    {
        $field = $this->field($teamId, $id);
        if (TeamJoinFieldValue::where('field_id', $field->id)->find()) {
            throw new HttpException(409, '申请字段已有提交记录，不能删除');
        }
        $field->delete();
    }

    public function apply(int $teamId, int $userId, array $data): int
    {
        $validator = new \app\validate\TeamJoinApplication;
        if (!$validator->scene('apply')->check($data)) {
            throw new HttpException(422, $validator->getError());
        }
        if (\app\model\TeamMember::where('team_id', $teamId)->where('user_id', $userId)->find()) {
            throw new HttpException(409, '你已经是本团队成员');
        }
        if (TeamJoinApplication::where('team_id', $teamId)->where('user_id', $userId)->whereIn('status', self::ACTIVE_STATUSES)->find()) {
            throw new HttpException(409, '你已有正在处理中的加入申请');
        }

        $values = $data['values'] ?? [];
        $this->assertRequiredValues($teamId, $values);

        return \app\model\Base::transaction(function () use ($teamId, $userId, $data, $values) {
            $application = new TeamJoinApplication;
            $application->save([
                'team_id' => $teamId,
                'user_id' => $userId,
                'member_id' => null,
                'status' => TeamJoinStatus::Applied->value,
                'memo' => $data['memo'] ?? null,
            ]);

            $this->saveApplicationValues((int) $application->id, $teamId, $values);

            return (int) $application->id;
        });
    }

    public function mine(int $teamId, int $userId): array
    {
        return TeamJoinApplication::where('team_id', $teamId)
            ->where('user_id', $userId)
            ->with(['values.field', 'tasks'])
            ->order('id', 'desc')
            ->select()
            ->toArray();
    }

    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        $query = TeamJoinApplication::where('team_id', $teamId);
        if (!empty($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }
        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        $total = $query->count();
        $list = $query->with(['user.profile', 'member.profile', 'values.field', 'tasks'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id, ?int $userId = null): array
    {
        $application = TeamJoinApplication::where('team_id', $teamId)
            ->with(['user.profile', 'member.profile', 'values.field', 'tasks'])
            ->find($id);
        if (!$application) {
            throw new HttpException(404, '申请不存在');
        }
        if ($userId !== null && (int) $application->user_id !== $userId) {
            throw new HttpException(403, '无权查看此申请');
        }

        return $application->toArray();
    }

    public function cancel(int $teamId, int $userId, int $id): void
    {
        $application = $this->application($teamId, $id);
        if ((int) $application->user_id !== $userId) {
            throw new HttpException(403, '无权取消此申请');
        }
        $this->assertPending($application);
        $application->status = TeamJoinStatus::Cancelled->value;
        $application->save();
    }

    public function startReview(int $teamId, int $id): void
    {
        $application = $this->application($teamId, $id);
        $this->assertPending($application);
        $application->status = TeamJoinStatus::Reviewing->value;
        $application->save();
    }

    public function reject(int $teamId, int $id, string $memo): void
    {
        $validator = new \app\validate\TeamJoinApplication;
        if (!$validator->scene('reject')->check(['id' => $id, 'reject_memo' => $memo])) {
            throw new HttpException(422, $validator->getError());
        }

        $application = $this->application($teamId, $id);
        $this->assertPending($application);
        $application->status = TeamJoinStatus::Rejected->value;
        $application->memo = $memo;
        $application->save();
    }

    public function approve(int $teamId, int $id): int
    {
        return \app\model\Base::transaction(function () use ($teamId, $id) {
            $application = TeamJoinApplication::where('team_id', $teamId)->lock(true)->find($id);
            if (!$application) {
                throw new HttpException(404, '申请不存在');
            }
            $this->assertPending($application);

            $member = \app\model\TeamMember::where('team_id', $teamId)
                ->where('user_id', (int) $application->user_id)
                ->find();

            if (!$member) {
                $member = new \app\model\TeamMember;
                $member->save([
                    'team_id' => $teamId,
                    'user_id' => (int) $application->user_id,
                ]);

                $profile = new TeamMemberProfile;
                $profile->save([
                    'member_id' => (int) $member->id,
                    'nickname' => '',
                    'avatar' => '',
                    'description' => null,
                    'intro_image' => null,
                    'intro_video' => null,
                    'introduction_markdown' => null,
                ]);
            }

            $this->transferValues($teamId, (int) $application->id, (int) $member->id);

            $application->member_id = (int) $member->id;
            $application->status = TeamJoinStatus::Joined->value;
            $application->save();

            return (int) $member->id;
        });
    }

    public function saveTasks(int $teamId, int $id, array $tasks): void
    {
        $validator = new \app\validate\TeamJoinApplication;
        if (!$validator->scene('tasks')->check(['id' => $id, 'tasks' => $tasks])) {
            throw new HttpException(422, $validator->getError());
        }

        \app\model\Base::transaction(function () use ($teamId, $id, $tasks) {
            $application = $this->application($teamId, $id);
            $this->assertPending($application);

            TeamJoinTask::where('application_id', $application->id)->delete();
            foreach (array_values($tasks) as $index => $taskData) {
                $title = trim((string) ($taskData['title'] ?? ''));
                if ($title === '') {
                    throw new HttpException(422, '审核任务标题不能为空');
                }

                $task = new TeamJoinTask;
                $task->save([
                    'application_id' => (int) $application->id,
                    'title' => $title,
                    'description' => $taskData['description'] ?? null,
                    'is_passed' => (int) ($taskData['is_passed'] ?? 0),
                    'sort' => (int) ($taskData['sort'] ?? ($index + 1) * 10),
                ]);
            }

            if ($this->statusId($application) === TeamJoinStatus::Applied->value) {
                $application->status = TeamJoinStatus::Reviewing->value;
                $application->save();
            }
        });
    }

    public function setTaskPassed(int $teamId, int $id, int $taskId, bool $isPassed): void
    {
        $application = $this->application($teamId, $id);
        $this->assertPending($application);

        $task = TeamJoinTask::where('application_id', $application->id)->find($taskId);
        if (!$task) {
            throw new HttpException(404, '审核任务不存在');
        }
        $task->is_passed = $isPassed ? 1 : 0;
        $task->save();
    }

    public function upload(UploadedFile $file, int $teamId): array
    {
        return app(\app\service\File::class)->uploadForJoin($file, $teamId);
    }

    private function field(int $teamId, int $id): TeamJoinField
    {
        $field = TeamJoinField::where('team_id', $teamId)->find($id);
        if (!$field) {
            throw new HttpException(404, '申请字段不存在');
        }

        return $field;
    }

    private function application(int $teamId, int $id): TeamJoinApplication
    {
        $application = TeamJoinApplication::where('team_id', $teamId)->find($id);
        if (!$application) {
            throw new HttpException(404, '申请不存在');
        }

        return $application;
    }

    private function assertPending(TeamJoinApplication $application): void
    {
        if (!in_array($this->statusId($application), self::ACTIVE_STATUSES, true)) {
            throw new HttpException(409, '当前申请状态不允许执行此操作');
        }
    }

    private function statusId(TeamJoinApplication $application): int
    {
        $status = $application->getData('status');

        return $status instanceof TeamJoinStatus ? $status->value : (int) $status;
    }

    private function fieldData(array $data): array
    {
        $data = array_merge([
            'value_type' => 'string',
            'input_type' => 'text',
            'options' => null,
            'default_value' => null,
            'is_apply_fillable' => 1,
            'is_apply_required' => 0,
            'is_transfer_member_field' => 0,
            'member_field_id' => null,
            'is_active' => 1,
            'sort' => 0,
        ], $data);
        $data['options'] = $this->options($data['options'] ?? null);

        return $data;
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

    private function assertTransferField(int $teamId, array $data): void
    {
        if (empty($data['is_transfer_member_field'])) {
            return;
        }
        $memberFieldId = (int) ($data['member_field_id'] ?? 0);
        if (!$memberFieldId) {
            throw new HttpException(422, '转存成员字段不能为空');
        }
        if (!\app\model\TeamMemberField::where('team_id', $teamId)->find($memberFieldId)) {
            throw new HttpException(404, '转存成员字段不存在');
        }
    }

    private function assertRequiredValues(int $teamId, array $values): void
    {
        $fields = TeamJoinField::where('team_id', $teamId)
            ->where('is_active', 1)
            ->where('is_apply_fillable', 1)
            ->select();

        foreach ($fields as $field) {
            if (!$field->is_apply_required) {
                continue;
            }
            $value = $values[$field->id] ?? $values[$field->field_key] ?? null;
            if ($value === null || $value === '' || $value === []) {
                throw new HttpException(422, "字段 {$field->name} 不能为空");
            }
        }
    }

    private function saveApplicationValues(int $applicationId, int $teamId, array $values): void
    {
        $fields = TeamJoinField::where('team_id', $teamId)
            ->where('is_active', 1)
            ->where('is_apply_fillable', 1)
            ->select();

        foreach ($fields as $field) {
            $rawValue = $values[$field->id] ?? $values[$field->field_key] ?? null;
            if ($rawValue === null || $rawValue === '') {
                $rawValue = $field->default_value;
            }

            [, , $data] = $this->valueData($field->value_type, $rawValue);
            $value = new TeamJoinFieldValue;
            $value->save(array_merge([
                'application_id' => $applicationId,
                'field_id' => (int) $field->id,
            ], $data));
        }
    }

    private function transferValues(int $teamId, int $applicationId, int $memberId): void
    {
        $values = TeamJoinFieldValue::where('application_id', $applicationId)
            ->with(['field'])
            ->select();

        foreach ($values as $value) {
            $field = $value->field;
            if (!$field || !$field->is_transfer_member_field || !$field->member_field_id) {
                continue;
            }
            $memberField = \app\model\TeamMemberField::where('team_id', $teamId)->find((int) $field->member_field_id);
            if (!$memberField) {
                continue;
            }

            $target = \app\model\TeamMemberFieldValue::where('member_id', $memberId)
                ->where('field_id', (int) $memberField->id)
                ->findOrEmpty();
            $target->save(array_merge([
                'member_id' => $memberId,
                'field_id' => (int) $memberField->id,
            ], $this->valuePayload($memberField->value_type, $this->rawValue($field->value_type, $value))));
        }
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

    private function valuePayload(string $type, $value): array
    {
        [, , $data] = $this->valueData($type, $value);

        return $data;
    }

    private function rawValue(string $type, TeamJoinFieldValue $value)
    {
        return match ($type) {
            'text' => $value->value_text,
            'int', 'bool' => $value->value_int,
            'decimal' => $value->value_decimal,
            'date', 'datetime' => $value->value_datetime,
            'multi_select', 'json' => $value->value_json,
            default => $value->value_string,
        };
    }
}
