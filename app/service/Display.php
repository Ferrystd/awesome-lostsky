<?php
declare(strict_types=1);

namespace app\service;

use app\enum\TeamEntityType;
use app\enum\Visibility;
use app\model\Document as DocumentModel;
use app\model\Entity as EntityModel;
use app\model\Team;
use app\model\TeamEntityProfile;
use app\model\TeamEntityField;
use app\model\TeamEntityFieldValue;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamProduct;
use app\model\TeamVirtual;
use think\exception\HttpException;

class Display
{
    private const PUBLIC_TYPES = ['teamMember', 'teamVirtual'];

    public function profile(int $teamId): array
    {
        $team = $this->team($teamId);
        $entity = EntityModel::with(['profile'])
            ->where('entityable_type', 'team')
            ->where('entityable_id', $teamId)
            ->find();
        if (!$entity) {
            throw new HttpException(404, '团队不存在');
        }

        return [
            'slug' => (string) $team->slug,
            'type' => 'team',
            'profile' => $this->profileData($entity),
            'fields' => $this->publicFields($teamId, $entity),
            'settings' => app(TeamSetting::class)->internal($teamId, 'display'),
        ];
    }

    public function entities(
        int $teamId,
        ?string $type,
        int $page,
        int $limit,
        string $keyword = ''
    ): array
    {
        $this->team($teamId);
        if ($type !== null && !in_array($type, self::PUBLIC_TYPES, true)) {
            throw new HttpException(422, '人员类型不正确');
        }
        $keyword = trim($keyword);
        if (mb_strlen($keyword, 'UTF-8') > 100) {
            throw new HttpException(422, '搜索关键词不能超过100个字符');
        }
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);

        $memberIds = $type === 'teamVirtual'
            ? []
            : array_map(
                static fn (TeamMember $member): int => (int) $member->id,
                array_values(array_filter(
                    TeamMember::where('team_id', $teamId)->select()->all(),
                    static fn (TeamMember $member): bool => (bool) $member->is_valid
                ))
            );
        $virtualIds = $type === 'teamMember'
            ? []
            : TeamVirtual::where('team_id', $teamId)->where('is_active', 1)->column('id');

        $query = EntityModel::with(['profile'])
            ->where('is_displayed', 1)
            ->where(function ($query) use ($memberIds, $virtualIds) {
                if ($memberIds) {
                    $query->where(function ($query) use ($memberIds) {
                        $query->where('entityable_type', 'teamMember')
                            ->whereIn('entityable_id', $memberIds);
                    });
                }
                if ($virtualIds) {
                    $method = $memberIds ? 'whereOr' : 'where';
                    $query->{$method}(function ($query) use ($virtualIds) {
                        $query->where('entityable_type', 'teamVirtual')
                            ->whereIn('entityable_id', $virtualIds);
                    });
                }
                if (!$memberIds && !$virtualIds) {
                    $query->whereRaw('1=0');
                }
            });

        if ($keyword !== '') {
            $escaped = addcslashes($keyword, '\\%_');
            $profileEntityIds = TeamEntityProfile::whereLike('name', "%{$escaped}%")
                ->column('entity_id');
            $query->where(function ($query) use ($escaped, $profileEntityIds) {
                $query->whereLike('slug', "%{$escaped}%");
                if ($profileEntityIds) {
                    $query->whereOr(function ($query) use ($profileEntityIds) {
                        $query->whereIn('id', $profileEntityIds);
                    });
                }
            });
        }

        $paginator = $query->order('id', 'asc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $rows = $paginator->getCollection();
        $roleMap = $this->publicRolesForEntities($teamId, array_map(
            static fn (EntityModel $entity): int => (int) $entity->id,
            $rows->all()
        ));
        $list = array_map(
            fn (EntityModel $entity): array => $this->summary(
                $entity,
                $roleMap[(int) $entity->id] ?? []
            ),
            $rows->all()
        );

        return app(Pagination::class)->response($paginator, $list);
    }

    public function entity(int $teamId, string $slug): array
    {
        $entity = $this->publicEntity($teamId, $slug);

        return [
            'slug' => (string) $entity->slug,
            'type' => (string) $entity->entityable_type,
            'status_code' => $entity->status_code,
            'status_label' => $entity->status_label,
            'profile' => $this->profileData($entity),
            'fields' => $this->publicFields($teamId, $entity),
            'roles' => $this->publicRoles($teamId, (int) $entity->id),
            'products' => $this->publicProducts($teamId, $entity),
        ];
    }

    public function documents(
        int $teamId,
        ?string $entitySlug,
        int $page,
        int $limit
    ): array {
        $entity = $this->documentSubject($teamId, $entitySlug);
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);

        $query = DocumentModel::where('entity_id', (int) $entity->id)
            ->where('visibility', Visibility::Public->value);
        $paginator = $query->order('sort', 'asc')->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $rows = $paginator->getCollection();
        $subject = $this->summary(
            $entity,
            $this->publicRoles($teamId, (int) $entity->id)
        );
        $list = array_map(
            fn (DocumentModel $document): array => $this->documentData($document, $subject, false),
            $rows->all()
        );

        return app(Pagination::class)->response($paginator, $list);
    }

    public function document(int $teamId, int $id): array
    {
        $document = DocumentModel::where('visibility', Visibility::Public->value)->find($id);
        if (!$document) {
            throw new HttpException(404, '文档不存在');
        }

        $entity = EntityModel::with(['profile'])->find((int) $document->entity_id);
        if (!$entity || !$this->isPublicSubject($entity, $teamId)) {
            throw new HttpException(404, '文档不存在');
        }

        return $this->documentData(
            $document,
            $this->summary($entity, $this->publicRoles($teamId, (int) $entity->id)),
            true
        );
    }

    public function resolve(array $slugs): array
    {
        $slugs = array_values(array_unique(array_filter(array_map(
            static fn ($slug): string => strtolower(trim((string) $slug)),
            $slugs
        ), static fn (string $slug): bool => (bool) preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $slug))));
        $slugs = array_slice($slugs, 0, 50);
        if (!$slugs) {
            return [];
        }

        $entities = EntityModel::with(['profile'])->whereIn('slug', $slugs)->select();
        $map = [];
        foreach ($entities as $entity) {
            $map[(string) $entity->slug] = $this->resolved($entity);
        }

        return array_map(
            fn (string $slug): array => $map[$slug] ?? $this->unavailable($slug),
            $slugs
        );
    }

    private function team(int $teamId): Team
    {
        $team = Team::active()->find($teamId);
        if (!$team) {
            throw new HttpException(404, '团队不存在');
        }

        return $team;
    }

    private function publicEntity(int $teamId, string $slug): EntityModel
    {
        $entity = EntityModel::with(['profile'])
            ->where('slug', strtolower(trim($slug)))
            ->where('is_displayed', 1)
            ->whereIn('entityable_type', self::PUBLIC_TYPES)
            ->find();
        if (!$entity || !$this->isPublicSubject($entity, $teamId)) {
            throw new HttpException(404, '人员不存在');
        }

        return $entity;
    }

    private function documentSubject(int $teamId, ?string $slug): EntityModel
    {
        $team = $this->team($teamId);
        if ($slug === null || trim($slug) === '' || strtolower(trim($slug)) === (string) $team->slug) {
            $entity = EntityModel::with(['profile'])
                ->where('entityable_type', 'team')
                ->where('entityable_id', $teamId)
                ->find();
            if ($entity) {
                return $entity;
            }
            throw new HttpException(404, '团队不存在');
        }

        return $this->publicEntity($teamId, $slug);
    }

    private function isPublicSubject(EntityModel $entity, int $teamId): bool
    {
        if ($entity->entityable_type === 'team') {
            return (int) $entity->entityable_id === $teamId
                && (bool) Team::active()->where('id', $teamId)->find();
        }
        if (!in_array($entity->entityable_type, self::PUBLIC_TYPES, true)
            || (int) $entity->is_displayed !== 1) {
            return false;
        }

        try {
            app(\app\service\Entity::class)->assertInTeam((int) $entity->id, $teamId);
            return true;
        } catch (HttpException) {
            return false;
        }
    }

    private function profileData(EntityModel $entity): array
    {
        $profile = $entity->profile;

        return [
            'name' => (string) ($profile?->name ?: $entity->slug),
            'avatar' => $profile?->avatar ?: null,
            'description' => $profile?->description ?: null,
            'intro_image' => $profile?->intro_image ?: null,
            'intro_video' => $profile?->intro_video ?: null,
            'introduction_markdown' => $profile?->introduction_markdown ?: null,
            'document_tags' => $this->outputTags($profile?->document_tags),
        ];
    }

    private function publicFields(int $teamId, EntityModel $entity): array
    {
        $fieldType = $entity->entityable_type === 'teamVirtual'
            ? TeamEntityType::Virtual
            : TeamEntityType::Entity;
        $visibleFields = app(\app\service\TeamEntityField::class)->visibleFields(
            $teamId,
            $fieldType->value,
            (int) $entity->id,
            [],
            false
        );
        $visibleFieldIds = array_map(
            static fn (array $field): int => (int) $field['id'],
            $visibleFields
        );
        if (!$visibleFieldIds) {
            return [];
        }
        $fields = TeamEntityField::where('team_id', $teamId)
            ->where('entity_type', $fieldType->value)
            ->whereIn('id', $visibleFieldIds)
            ->order('sort', 'asc')->order('id', 'asc')->select();
        if ($fields->isEmpty()) {
            return [];
        }

        $values = TeamEntityFieldValue::where('team_id', $teamId)
            ->where('entity_id', (int) $entity->id)
            ->whereIn('field_id', array_map(
                static fn (TeamEntityField $field): int => (int) $field->id,
                $fields->all()
            ))
            ->select()
            ->column(null, 'field_id');

        $result = [];
        foreach ($fields as $field) {
            $value = $this->fieldValue($field, $values[(int) $field->id] ?? null);
            if ($this->emptyValue($value)) {
                continue;
            }
            $item = [
                'key' => (string) $field->field_key,
                'name' => (string) $field->name,
                'value_type' => (string) $field->value_type,
                'value' => $value,
            ];
            if (is_array($field->options) && $field->options) {
                $item['options'] = $field->options;
            }
            $result[] = $item;
        }

        return $result;
    }

    private function fieldValue(TeamEntityField $field, ?TeamEntityFieldValue $stored): mixed
    {
        $type = (string) $field->value_type;
        $value = $stored ? match ($type) {
            'text' => $stored->value_text,
            'int', 'bool' => $stored->value_int,
            'decimal' => $stored->value_decimal,
            'date', 'datetime' => $stored->value_datetime,
            'multi_select', 'json' => $stored->value_json,
            default => $stored->value_string,
        } : null;
        if (!$this->emptyValue($value)) {
            return $type === 'decimal' ? (string) $value : $value;
        }

        $default = $field->default_value;
        if ($this->emptyValue($default)) {
            return null;
        }

        $value = match ($type) {
            'int', 'bool' => (int) $default,
            'decimal' => (string) $default,
            'date', 'datetime' => is_numeric($default) ? (int) $default : strtotime((string) $default),
            'multi_select', 'json' => $this->jsonDefault((string) $default),
            default => (string) $default,
        };
        return $value === false ? null : $value;
    }

    private function jsonDefault(string $value): mixed
    {
        $decoded = json_decode($value, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    private function emptyValue(mixed $value): bool
    {
        return $value === null || $value === '' || $value === [];
    }

    private function publicRoles(int $teamId, int $entityId): array
    {
        return $this->publicRolesForEntities($teamId, [$entityId])[$entityId] ?? [];
    }

    private function publicProducts(int $teamId, EntityModel $entity): array
    {
        if (!app(ShopAvailability::class)->open($teamId)) return [];
        $team = $this->team($teamId);
        $products = $entity->products()
            ->where('team_id', $teamId)
            ->where('is_active', 1)
            ->order('id', 'desc')
            ->select();

        return array_map(static fn (TeamProduct $product): array => [
            'id' => (int) $product->id,
            'name' => (string) $product->name,
            'description' => $product->description ?: null,
            'cover_image' => $product->cover_image ?: null,
            'price' => (string) $product->price,
            'href' => "//{$team->slug}.shop.lostsky.work/product/{$product->id}",
        ], $products->all());
    }

    private function publicRolesForEntities(int $teamId, array $entityIds): array
    {
        $entityIds = array_values(array_unique(array_map('intval', $entityIds)));
        if (!$entityIds) {
            return [];
        }

        $assignments = TeamEntityRole::with(['role'])
            ->where('team_id', $teamId)
            ->whereIn('entity_id', $entityIds)
            ->select();
        $roles = [];
        foreach ($assignments as $assignment) {
            $role = $assignment->role;
            if (!$role || (int) $role->is_displayed !== 1 || (int) $role->team_id !== $teamId) {
                continue;
            }
            $roles[(int) $assignment->entity_id][] = [
                'id' => (int) $role->id,
                'name' => (string) $role->name,
                'description' => $role->description ?: null,
                '_sort' => (int) $role->sort,
            ];
        }

        foreach ($roles as &$items) {
            usort($items, static fn (array $left, array $right): int =>
                [$left['_sort'], $left['id']] <=> [$right['_sort'], $right['id']]
            );
            $items = array_map(static function (array $role): array {
                unset($role['_sort'], $role['id']);
                return $role;
            }, $items);
        }
        unset($items);

        return $roles;
    }

    private function summary(EntityModel $entity, array $roles = []): array
    {
        $profile = $this->profileData($entity);

        $summary = [
            'slug' => (string) $entity->slug,
            'type' => (string) $entity->entityable_type,
            'name' => $profile['name'],
            'avatar' => $profile['avatar'],
            'description' => $profile['description'],
            'status_code' => $entity->status_code,
            'status_label' => $entity->status_label,
        ];
        if (in_array($summary['type'], self::PUBLIC_TYPES, true)) {
            $summary['roles'] = $roles;
        }

        return $summary;
    }

    private function documentData(DocumentModel $document, array $subject, bool $withContent): array
    {
        $result = [
            'id' => (int) $document->id,
            'title' => (string) $document->title,
            'sort' => (int) $document->sort,
            'update_time' => (int) $document->getData('update_time'),
            'entity' => $subject,
            'tags' => $this->outputTags($document->tags),
        ];
        if ($withContent) {
            $result['content'] = $document->content;
        }

        return $result;
    }

    private function resolved(EntityModel $entity): array
    {
        $subject = $entity->entityable;
        if (!$subject || !(bool) $subject->is_valid) {
            return $this->unavailable((string) $entity->slug, (string) $entity->entityable_type);
        }

        if ($entity->entityable_type === 'team') {
            $profile = $this->profileData($entity);
            return [
                'slug' => (string) $entity->slug,
                'type' => 'team',
                'display_name' => $profile['name'],
                'avatar' => $profile['avatar'],
                'team' => null,
                'available' => true,
                'href' => "//{$entity->slug}.display.lostsky.work/",
            ];
        }
        if (!in_array($entity->entityable_type, self::PUBLIC_TYPES, true)
            || (int) $entity->is_displayed !== 1) {
            return $this->unavailable((string) $entity->slug, (string) $entity->entityable_type);
        }

        $team = $subject->team;
        if (!$team || !(bool) $team->is_valid) {
            return $this->unavailable((string) $entity->slug, (string) $entity->entityable_type);
        }
        $profile = $this->profileData($entity);
        $teamProfile = EntityModel::with(['profile'])
            ->where('entityable_type', 'team')
            ->where('entityable_id', (int) $team->id)
            ->find();

        return [
            'slug' => (string) $entity->slug,
            'type' => (string) $entity->entityable_type,
            'display_name' => $profile['name'],
            'avatar' => $profile['avatar'],
            'team' => [
                'slug' => (string) $team->slug,
                'display_name' => $teamProfile
                    ? $this->profileData($teamProfile)['name']
                    : (string) $team->slug,
            ],
            'available' => true,
            'href' => "//{$team->slug}.display.lostsky.work/entity/{$entity->slug}",
        ];
    }

    private function unavailable(string $slug, string $type = 'unknown'): array
    {
        return [
            'slug' => $slug,
            'type' => in_array($type, ['team', 'teamMember', 'teamVirtual'], true) ? $type : 'unknown',
            'display_name' => $slug,
            'avatar' => null,
            'team' => null,
            'available' => false,
            'href' => null,
        ];
    }

    private function outputTags(mixed $tags): array
    {
        return is_array($tags) && array_is_list($tags) ? array_values($tags) : [];
    }
}
