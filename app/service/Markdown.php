<?php
declare (strict_types = 1);

namespace app\service;

use think\Model;

class Markdown
{
    private const SOURCE_MAP = [
        \app\model\Document::class          => 'document',
        \app\model\TeamEntityProfile::class => 'teamEntityProfile',
        \app\model\TeamProduct::class        => 'teamProduct',
    ];

    public function sync(Model $source, string $field, ?string $markdown): void
    {
        $type = self::SOURCE_MAP[$source::class] ?? null;
        if (!$type) {
            throw new \InvalidArgumentException('不支持的 Markdown 引用来源');
        }

        preg_match_all('/\]\(lostsky:\/\/entity\/([a-zA-Z][a-zA-Z0-9_-]{1,49})\)/', (string) $markdown, $matches);
        $slugs = array_values(array_unique(array_map('strtolower', $matches[1] ?? [])));
        $identities = $slugs
            ? \app\model\Entity::whereIn('slug', $slugs)->select()
            : [];
        $active = [];

        foreach ($identities as $identity) {
            $active[(int) $identity->id] = true;
            \app\model\MarkdownReference::withTrashed()->updateOrCreate([
                'referenceable_type' => $type,
                'referenceable_id'   => (int) $source->id,
                'referenceable_field'=> $field,
                'entity_id' => (int) $identity->id,
            ], [
                'delete_time' => null,
            ]);
        }

        $rows = \app\model\MarkdownReference::where('referenceable_type', $type)
            ->where('referenceable_id', (int) $source->id)
            ->where('referenceable_field', $field)
            ->select();
        foreach ($rows as $row) {
            if (!isset($active[(int) $row->entity_id])) {
                $row->delete();
            }
        }
    }

    public function deleteSource(Model $source, string $field): void
    {
        $type = self::SOURCE_MAP[$source::class] ?? null;
        if (!$type) {
            return;
        }

        foreach (\app\model\MarkdownReference::where('referenceable_type', $type)
            ->where('referenceable_id', (int) $source->id)
            ->where('referenceable_field', $field)
            ->select() as $row) {
            $row->delete();
        }
    }
}
