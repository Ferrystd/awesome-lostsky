<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity as EntityModel;
use think\exception\HttpException;
use think\facade\Db;
use think\file\UploadedFile;

class EntitySelfManagement
{
    private const SUPPORTED_TYPES = ['team', 'teamMember', 'teamVirtual'];
    private const PUBLIC_PROFILE_FIELDS = [
        'name', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown',
    ];

    public function current(?array $actingEntity): array
    {
        if (!$actingEntity) {
            return ['identity' => null, 'supported' => false];
        }

        $context = $this->context($actingEntity, false);
        $entity = $context['entity'];
        $identity = $this->identitySummary($entity, $context['team_id']);
        if (!in_array($context['type'], self::SUPPORTED_TYPES, true)) {
            return [
                'identity' => $identity,
                'supported' => false,
                'unsupported_reason' => '当前实体类型不进入后台个人工作台，请使用对应的业务中心。',
            ];
        }

        $profile = app(EntityProfile::class)->ensure((int) $entity->id);
        $fieldType = $this->fieldType($context['type']);
        $fieldService = app(TeamEntityField::class);
        $fields = $fieldService->visibleFields(
            $context['team_id'],
            $fieldType,
            (int) $entity->id,
            $actingEntity
        );
        $values = $fieldService->visibleValues(
            $context['team_id'],
            (int) $entity->id,
            $fieldType,
            $actingEntity
        );
        $roles = (string) $entity->slug === ''
            ? ['role_assignments' => [], 'effective_permissions' => []]
            : app(EntityRole::class)->summary($context['team_id'], (string) $entity->slug);

        $result = [
            'identity' => $identity,
            'supported' => true,
            'profile' => $this->profileData($profile->toArray()),
            'custom_fields' => $fields,
            'custom_field_values' => $values,
            'role_assignments' => $roles['role_assignments'],
            'effective_permissions' => $roles['effective_permissions'],
            'upload' => $this->uploadCapability($context['team_id'], $actingEntity),
        ];

        return $result;
    }

    public function updateProfile(array $actingEntity, int $expectedEntityId, array $data): void
    {
        $context = $this->writableContext($actingEntity, $expectedEntityId);
        $type = $context['type'];
        $allowed = self::PUBLIC_PROFILE_FIELDS;
        $data = array_intersect_key($data, array_flip($allowed));

        $validation = ['nickname' => (string) ($data['name'] ?? '')] + array_intersect_key(
            $data,
            array_flip(['avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'])
        );
        $validator = new \app\validate\Member;
        if (!$validator->scene('edit')->check($validation)) {
            throw new HttpException(422, $validator->getError());
        }
        app(EntityProfile::class)->update($context['team_id'], (int) $context['entity']->id, $data);
    }

    public function claimSlug(array $actingEntity, int $expectedEntityId, string $slug): array
    {
        $context = $this->writableContext($actingEntity, $expectedEntityId);
        if ($context['type'] !== 'teamMember') {
            throw new HttpException(422, '当前实体类型不支持补全标识');
        }
        $entity = $context['entity'];
        if ((string) $entity->slug !== '') {
            throw new HttpException(409, "对象标识已经确定：{$entity->slug}");
        }

        $validator = new \app\validate\Entity;
        if (!$validator->scene('claim')->check(['slug' => $slug])) {
            throw new HttpException(422, $validator->getError());
        }
        $slug = strtolower(trim($slug));
        if (EntityModel::withTrashed()->where('slug', $slug)->where('id', '<>', $entity->id)->find()) {
            throw new HttpException(409, '对象标识已被占用');
        }
        Db::name('entity')->where('id', (int) $entity->id)->where('slug', '')->update([
            'slug' => $slug,
            'update_time' => time(),
        ]);
        $saved = EntityModel::find((int) $entity->id);
        if (!$saved || (string) $saved->slug !== $slug) {
            throw new HttpException(409, '对象标识已由其他请求确定，请重新加载');
        }
        return ['slug' => $slug];
    }

    public function saveFields(array $actingEntity, int $expectedEntityId, array $values): void
    {
        $context = $this->writableContext($actingEntity, $expectedEntityId);
        $slug = (string) $context['entity']->slug;
        if ($slug === '') {
            throw new HttpException(422, '请先确定对象标识');
        }
        app(TeamEntityField::class)->saveOwnValues($context['team_id'], $slug, $values);
    }

    public function upload(
        array $actingEntity,
        int $expectedEntityId,
        UploadedFile $file
    ): array {
        $context = $this->writableContext($actingEntity, $expectedEntityId);
        return app(File::class)->upload($file, $context['team_id'], $actingEntity);
    }

    private function writableContext(array $actingEntity, int $expectedEntityId): array
    {
        if ($expectedEntityId < 1 || (int) ($actingEntity['entity_id'] ?? 0) !== $expectedEntityId) {
            throw new HttpException(409, '身份已切换，请重新加载后再保存');
        }
        $context = $this->context($actingEntity, true);
        if (!in_array($context['type'], self::SUPPORTED_TYPES, true)) {
            throw new HttpException(403, '当前实体类型不支持自我管理');
        }
        return $context;
    }

    private function context(array $actingEntity, bool $requireValid): array
    {
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        $type = (string) ($actingEntity['type'] ?? '');
        $id = (int) ($actingEntity['id'] ?? 0);
        $entity = EntityModel::with(['profile'])->find($entityId);
        if (!$entity || (string) $entity->entityable_type !== $type || (int) $entity->entityable_id !== $id) {
            throw new HttpException(401, '当前实体身份会话已失效');
        }
        if ($requireValid && !$entity->is_valid) {
            throw new HttpException(401, '当前实体身份会话已失效');
        }
        $teamId = app(IdentitySession::class)->entityTeamId($type, $id);
        if ($teamId < 1) {
            throw new HttpException(401, '当前实体所属团队不可用');
        }
        return compact('entity', 'type', 'id', 'teamId') + ['team_id' => $teamId];
    }

    private function identitySummary(EntityModel $entity, int $teamId): array
    {
        return [
            'entity_id' => (int) $entity->id,
            'type' => (string) $entity->entityable_type,
            'id' => (int) $entity->entityable_id,
            'slug' => (string) $entity->slug ?: null,
            'name' => (string) ($entity->profile?->name ?: app(IdentitySession::class)->entityName(
                (string) $entity->entityable_type,
                (int) $entity->entityable_id
            )),
            'avatar' => $entity->profile?->avatar ?: null,
            'status_code' => $entity->status_code,
            'status_label' => $entity->status_label,
            'team' => app(IdentitySession::class)->teamSummary($teamId),
        ];
    }

    private function profileData(array $profile): array
    {
        $result = [];
        foreach (self::PUBLIC_PROFILE_FIELDS as $field) {
            $result[$field] = $profile[$field] ?? null;
        }
        return $result;
    }

    private function fieldType(string $type): string
    {
        return match ($type) {
            'team' => 'entity',
            'teamMember' => 'entity',
            'teamVirtual' => 'virtual',
            default => throw new HttpException(422, '当前实体类型不支持对象字段'),
        };
    }

    private function uploadCapability(int $teamId, array $actingEntity): array
    {
        $ability = app(TeamAccess::class)->fileAbility($teamId);
        return [
            'enabled' => (bool) $ability['enabled'],
            'reason' => $ability['reason'],
        ];
    }
}
