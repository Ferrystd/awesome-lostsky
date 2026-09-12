<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamEntityProfile as Profile;
use think\facade\Db;
use think\exception\HttpException;

class EntityProfile
{
    public const FIELDS = ['name', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown', 'document_tags'];

    public function ensure(int $entityId, array $data = []): Profile
    {
        $profile = Profile::where('entity_id', $entityId)->findOrEmpty();
        if ($profile->isEmpty()) {
            $profile->save(array_merge(['entity_id' => $entityId, 'name' => '', 'avatar' => ''], $this->pick($data)));
        }
        return $profile;
    }

    public function listing(int $teamId, ?string $type, int $page, int $limit, bool $canReadAll): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $members = \app\model\TeamMember::where('team_id', $teamId)->select()->all();
        $memberIds = array_map(
            static fn (\app\model\TeamMember $member): int => (int) $member->id,
            $canReadAll
                ? $members
                : array_values(array_filter(
                    $members,
                    static fn (\app\model\TeamMember $member): bool => (bool) $member->is_valid
                ))
        );
        $customerIds = \app\model\TeamCustomer::where('team_id', $teamId)
            ->where('is_blocked', 0)
            ->column('id');
        $virtualIds = \app\model\TeamVirtual::where('team_id', $teamId)
            ->where('is_active', 1)
            ->column('id');
        $query = \app\model\Entity::with(['profile'])
            ->where(function ($query) use ($teamId, $memberIds, $customerIds, $virtualIds) {
                $query->where('entityable_type', 'team')->where('entityable_id', $teamId)
                    ->whereOr(function ($query) use ($memberIds) { $query->where('entityable_type', 'teamMember')->whereIn('entityable_id', $memberIds); })
                    ->whereOr(function ($query) use ($customerIds) { $query->where('entityable_type', 'teamCustomer')->whereIn('entityable_id', $customerIds); })
                    ->whereOr(function ($query) use ($virtualIds) { $query->where('entityable_type', 'teamVirtual')->whereIn('entityable_id', $virtualIds); });
            });
        if (!$canReadAll) {
            $query->where(function ($query) {
                $query->where('entityable_type', 'team')
                    ->whereOr(function ($query) {
                        $query->where('entityable_type', '<>', 'teamCustomer')
                            ->where('is_internal_visible', 1);
                    });
            });
        }
        if ($type !== null) $query->where('entityable_type', $type);
        $paginator = $query->order('id', 'asc')->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();
        $list = array_map(
            fn (\app\model\Entity $entity): array => $this->data($entity),
            $paginator->getCollection()->all()
        );
        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $entityId, bool $canReadAll): array
    {
        app(Entity::class)->assertBelongsToTeam($entityId, $teamId);
        $entity = \app\model\Entity::with(['profile'])->find($entityId);
        $canReadUnavailableMember = $canReadAll && $entity?->entityable_type === 'teamMember';
        if (!$entity || (!$entity->is_valid && !$canReadUnavailableMember)
            || (!$canReadAll
                && $entity->entityable_type !== 'team'
                && ($entity->entityable_type === 'teamCustomer'
                    || (int) $entity->is_internal_visible !== 1))) {
            throw new HttpException(404, '人员不存在');
        }
        return $this->data($entity);
    }

    public function update(int $teamId, int $entityId, array $data): void
    {
        app(Entity::class)->assertBelongsToTeam($entityId, $teamId);
        $data = $this->pick($data);
        if (array_key_exists('document_tags', $data)) {
            $data['document_tags'] = $this->normalizeDocumentTags($data['document_tags']);
        }
        if (!$data) return;
        Db::transaction(function () use ($entityId, $data) {
            $profile = $this->ensure($entityId);
            $profile->save($data);
            if (array_key_exists('introduction_markdown', $data)) app(Markdown::class)->sync($profile, 'introduction_markdown', $data['introduction_markdown']);
        });
    }

    private function pick(array $data): array { return array_intersect_key($data, array_flip(self::FIELDS)); }

    private function data(\app\model\Entity $entity): array
    {
        $data = $entity->toArray();
        if (is_array($data['profile'] ?? null)) {
            $data['profile']['document_tags'] = $this->outputDocumentTags($data['profile']['document_tags'] ?? null);
        }
        return $data;
    }

    private function normalizeDocumentTags(mixed $documentTags): array
    {
        if ($documentTags === null) {
            return [];
        }
        if (!is_array($documentTags) || !array_is_list($documentTags)) {
            throw new HttpException(422, '文档展示标签必须是数组');
        }

        $normalized = [];
        foreach ($documentTags as $item) {
            if (!is_array($item) || !array_key_exists('tag', $item) || !is_string($item['tag'])) {
                throw new HttpException(422, '文档展示标签格式不正确');
            }
            $tag = preg_replace('/^\s+|\s+$/u', '', $item['tag']);
            if ($tag === null || $tag === '') {
                throw new HttpException(422, '文档展示标签不能为空');
            }
            if (str_starts_with($tag, '#')) {
                throw new HttpException(422, '文档展示标签不能以#开头');
            }
            if (preg_match('/\p{Cc}/u', $tag) !== 0) {
                throw new HttpException(422, '文档展示标签不能包含控制字符');
            }
            if (mb_strlen($tag, 'UTF-8') > 50) {
                throw new HttpException(422, '文档展示标签长度不能超过50个字符');
            }
            if (in_array($tag, array_column($normalized, 'tag'), true)) {
                throw new HttpException(422, '文档展示标签不能重复');
            }

            $description = $item['description'] ?? null;
            if ($description !== null && !is_string($description)) {
                throw new HttpException(422, '文档展示标签说明必须是字符串');
            }
            if ($description !== null) {
                $description = preg_replace('/^\s+|\s+$/u', '', $description);
                if ($description === null) {
                    throw new HttpException(422, '文档展示标签说明格式不正确');
                }
                if ($description === '') {
                    $description = null;
                } elseif (mb_strlen($description, 'UTF-8') > 255) {
                    throw new HttpException(422, '文档展示标签说明长度不能超过255个字符');
                }
            }
            $normalized[] = ['tag' => $tag, 'description' => $description];
        }

        return $normalized;
    }

    private function outputDocumentTags(mixed $documentTags): array
    {
        return is_array($documentTags) && array_is_list($documentTags)
            ? array_values($documentTags)
            : [];
    }
}
