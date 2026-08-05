<?php
declare(strict_types=1);

namespace app\service;

use app\enum\TeamJoinStatus;
use app\enum\TeamJoinPurpose;
use app\enum\TeamMemberStatus;
use app\model\TeamJoinApplication;
use app\model\TeamJoinField;
use app\model\TeamJoinFieldValue;
use app\model\TeamJoinTask;
use app\model\TeamMemberTenure;
use think\exception\HttpException;
use think\file\UploadedFile;

class TeamJoin
{
    private const ACTIVE_STATUSES = [
        TeamJoinStatus::Applied->value,
        TeamJoinStatus::Reviewing->value,
    ];

    public function form(int $teamId, int $userId): array
    {
        $member = \app\model\TeamMember::where('team_id', $teamId)
            ->where('user_id', $userId)
            ->find();
        if ($member && $member->enumCase('status') !== TeamMemberStatus::Departed) {
            throw new HttpException(409, '你已经是本团队成员');
        }

        $purpose = $member ? TeamJoinPurpose::Reinstate : TeamJoinPurpose::Join;
        $refill = $purpose === TeamJoinPurpose::Join || (bool) (
            app(TeamSetting::class)->internal($teamId, 'member')['reinstate_refill_join_fields'] ?? false
        );

        return [
            'purpose_code' => $purpose->code(),
            'purpose_label' => $purpose->value(),
            'refill_required' => $refill,
            'fields' => $refill ? $this->fields($teamId, true) : [],
        ];
    }

    public function fields(int $teamId, bool $onlyFillable = false): array
    {
        $query = TeamJoinField::where('team_id', $teamId);
        if ($onlyFillable) {
            $query->where('is_active', 1)->where('is_apply_fillable', 1);
        }

        $fields = $query
            ->order('sort', 'asc')
            ->order('id', 'asc')
            ->select();
        $entityFieldIds = [];
        foreach ($fields as $field) {
            if ($field->entity_field_id) {
                $entityFieldIds[] = (int) $field->entity_field_id;
            }
        }
        $entityFieldMap = [];
        if ($entityFieldIds) {
            foreach (\app\model\TeamEntityField::where('team_id', $teamId)
                ->whereIn('id', array_values(array_unique($entityFieldIds)))
                ->select() as $entityField) {
                $entityFieldMap[(int) $entityField->id] = $entityField->toArray();
            }
        }

        return array_map(static function (TeamJoinField $field) use ($entityFieldMap): array {
            $data = $field->toArray();
            $data['entity_field'] = $entityFieldMap[(int) ($field->entity_field_id ?? 0)] ?? null;

            return $data;
        }, $fields->all());
    }

    public function transferOptions(int $teamId): array
    {
        return \app\model\TeamEntityField::where('team_id', $teamId)
            ->where('entity_type', \app\enum\TeamEntityType::Entity->value)
            ->field(['id', 'field_key', 'name', 'value_type', 'input_type', 'sort'])
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
        $member = \app\model\TeamMember::where('team_id', $teamId)->where('user_id', $userId)->find();
        if ($member && $member->enumCase('status') !== TeamMemberStatus::Departed) {
            throw new HttpException(409, '你已经是本团队成员');
        }
        if (TeamJoinApplication::where('team_id', $teamId)->where('user_id', $userId)->whereIn('status', self::ACTIVE_STATUSES)->find()) {
            throw new HttpException(409, '你已有正在处理中的加入申请');
        }

        $purpose = $member ? TeamJoinPurpose::Reinstate : TeamJoinPurpose::Join;
        $refill = $purpose === TeamJoinPurpose::Join || (bool) (
            app(TeamSetting::class)->internal($teamId, 'member')['reinstate_refill_join_fields'] ?? false
        );
        $values = $refill ? ($data['values'] ?? []) : [];
        if ($refill) {
            $this->assertRequiredValues($teamId, $values);
        }
        $inviter = $purpose === TeamJoinPurpose::Join
            ? app(Inviter::class)->resolve($data['inviter_slug'] ?? null)
            : null;
        $entityId = $member
            ? (int) (\app\model\Entity::member()->where('entityable_id', (int) $member->id)->value('id') ?? 0)
            : 0;
        if ($member && $entityId < 1) {
            throw new HttpException(409, '原成员实体不存在，无法申请复职');
        }

        return \think\facade\Db::transaction(function () use (
            $teamId,
            $userId,
            $data,
            $values,
            $inviter,
            $purpose,
            $entityId,
            $refill
        ) {
            $application = new TeamJoinApplication;
            $application->save([
                'team_id' => $teamId,
                'user_id' => $userId,
                'entity_id' => $entityId > 0 ? $entityId : null,
                'inviter_entity_id' => $inviter?->id,
                'purpose' => $purpose,
                'status' => TeamJoinStatus::Applied,
                'memo' => $purpose === TeamJoinPurpose::Join ? ($data['memo'] ?? null) : null,
            ]);

            if ($refill) {
                $this->saveApplicationValues((int) $application->id, $teamId, $values);
            }

            return (int) $application->id;
        });
    }

    public function mine(int $teamId, int $userId): array
    {
        $applications = TeamJoinApplication::where('team_id', $teamId)
            ->where('user_id', $userId)
            ->with(['values.field', 'tasks'])
            ->order('id', 'desc')
            ->select();

        return array_map(
            fn (TeamJoinApplication $application): array => $this->applicationData($application, $teamId),
            $applications->all()
        );
    }

    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = TeamJoinApplication::where('team_id', $teamId);
        if (!empty($filters['status'])) {
            $query->where('status', (int) $filters['status']);
        }
        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        $paginator = $query->with(['user.profile', 'values.field', 'tasks'])
            ->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $applications = $paginator->getCollection();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();

        $list = array_map(
            fn (TeamJoinApplication $application): array => $this->applicationData($application, $teamId),
            $applications->all()
        );

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id, ?int $userId = null): array
    {
        $application = TeamJoinApplication::where('team_id', $teamId)
            ->with(['user.profile', 'values.field', 'tasks'])
            ->find($id);
        if (!$application) {
            throw new HttpException(404, '申请不存在');
        }
        if ($userId !== null && (int) $application->user_id !== $userId) {
            throw new HttpException(403, '无权查看此申请');
        }

        return $this->applicationData($application, $teamId);
    }

    public function cancel(int $teamId, int $userId, int $id): void
    {
        $application = $this->application($teamId, $id);
        if ((int) $application->user_id !== $userId) {
            throw new HttpException(403, '无权取消此申请');
        }
        $this->assertPending($application);
        $application->status = TeamJoinStatus::Cancelled;
        $application->save();
    }

    public function startReview(int $teamId, int $id): void
    {
        $application = $this->application($teamId, $id);
        $this->assertPending($application);
        $application->status = TeamJoinStatus::Reviewing;
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
        $application->status = TeamJoinStatus::Rejected;
        $application->memo = $memo;
        $application->save();
    }

    public function approve(int $teamId, int $id): int
    {
        return \think\facade\Db::transaction(function () use ($teamId, $id) {
            $application = TeamJoinApplication::where('team_id', $teamId)->lock(true)->find($id);
            if (!$application) {
                throw new HttpException(404, '申请不存在');
            }
            $this->assertPending($application);

            $purpose = $application->enumCase('purpose');
            $member = \app\model\TeamMember::where('team_id', $teamId)
                ->where('user_id', (int) $application->user_id)
                ->lock(true)
                ->find();

            if ($purpose === TeamJoinPurpose::Join && $member) {
                throw new HttpException(409, '申请人已经是团队成员');
            }
            if ($purpose === TeamJoinPurpose::Reinstate
                && (!$member || $member->enumCase('status') !== TeamMemberStatus::Departed)) {
                throw new HttpException(409, '成员当前状态不能复职');
            }

            if (!$member) {
                $member = new \app\model\TeamMember;
                $member->save([
                    'team_id' => $teamId,
                    'user_id' => (int) $application->user_id,
                    'inviter_entity_id' => $application->inviter_entity_id,
                    'status' => TeamMemberStatus::Active,
                ]);
                $entity = app(\app\service\Entity::class)->claimMember(
                    $teamId,
                    (int) $member->id,
                    "member-{$member->id}"
                );
            } else {
                $member->save([
                    'status' => TeamMemberStatus::Active,
                ]);
            }

            $this->transferValues($teamId, (int) $application->id, (int) $member->id);

            $entity ??= \app\model\Entity::member()->where('entityable_id', (int) $member->id)->find();
            if (!$entity) {
                throw new HttpException(409, '成员实体不存在');
            }
            $application->entity_id = (int) $entity->id;
            $application->status = TeamJoinStatus::Joined;
            $application->save();

            $tenure = new TeamMemberTenure;
            $tenure->save([
                'team_id' => $teamId,
                'member_id' => (int) $member->id,
                'join_application_id' => (int) $application->id,
                'joined_at' => time(),
                'departed_at' => null,
            ]);

            return (int) $member->id;
        });
    }

    public function saveTasks(int $teamId, int $id, array $tasks): void
    {
        $validator = new \app\validate\TeamJoinApplication;
        if (!$validator->scene('tasks')->check(['id' => $id, 'tasks' => $tasks])) {
            throw new HttpException(422, $validator->getError());
        }

        \think\facade\Db::transaction(function () use ($teamId, $id, $tasks) {
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

            if ($application->enumCase('status') === TeamJoinStatus::Applied) {
                $application->status = TeamJoinStatus::Reviewing;
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

    private function applicationData(TeamJoinApplication $application, int $teamId): array
    {
        $data = $application->toArray();
        $data['inviter'] = app(Inviter::class)->summary($teamId, $application->inviter_entity_id);

        return $data;
    }

    private function assertPending(TeamJoinApplication $application): void
    {
        if (!in_array($application->enumCase('status')->value, self::ACTIVE_STATUSES, true)) {
            throw new HttpException(409, '当前申请状态不允许执行此操作');
        }
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
            'is_transfer_entity_field' => 0,
            'entity_field_id' => null,
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
        if (empty($data['is_transfer_entity_field'])) {
            return;
        }
        $entityFieldId = (int) ($data['entity_field_id'] ?? 0);
        if (!$entityFieldId) {
            throw new HttpException(422, '转存实体字段不能为空');
        }
        if (!\app\model\TeamEntityField::where('team_id', $teamId)
            ->where('entity_type', \app\enum\TeamEntityType::Entity->value)
            ->find($entityFieldId)) {
            throw new HttpException(404, '转存实体字段不存在');
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
        $entityId = (int) (\app\model\Entity::member()
            ->where('entityable_id', $memberId)
            ->value('id') ?? 0);
        if ($entityId < 1) {
            throw new HttpException(409, '成员实体不存在');
        }
        $values = TeamJoinFieldValue::where('application_id', $applicationId)
            ->with(['field'])
            ->select();

        foreach ($values as $value) {
            $field = $value->field;
            if (!$field || !$field->is_transfer_entity_field || !$field->entity_field_id) {
                continue;
            }
            $entityField = \app\model\TeamEntityField::where('team_id', $teamId)
                ->where('entity_type', \app\enum\TeamEntityType::Entity->value)
                ->find((int) $field->entity_field_id);
            if (!$entityField) {
                continue;
            }

            $target = \app\model\TeamEntityFieldValue::withTrashed()
                ->where('team_id', $teamId)
                ->where('entity_id', $entityId)
                ->where('field_id', (int) $entityField->id)
                ->find();
            if (!$target) {
                $target = app(\app\model\TeamEntityFieldValue::class, [], true);
            }
            $target->save(array_merge([
                'team_id' => $teamId,
                'field_id' => (int) $entityField->id,
                'entity_id' => $entityId,
                'delete_time' => null,
            ], $this->valuePayload($entityField->value_type, $this->rawValue($field->value_type, $value))));
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
