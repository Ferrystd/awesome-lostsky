<?php
declare(strict_types=1);

namespace app\model;

class TeamEntityProfile extends Base
{
    use concern\BelongsToEntity;

    protected $type = [
        'entity_id' => 'integer',
        'name' => 'string',
        'avatar' => 'string', 'description' => 'string', 'intro_image' => 'string',
        'intro_video' => 'string', 'introduction_markdown' => 'string',
    ] + self::COMMON_TYPES;

    protected $json = ['document_tags'];
    protected $readonly = ['entity_id'];

    public function markdownReferences() { return $this->morphMany(MarkdownReference::class, 'referenceable', 'teamEntityProfile'); }
    public function setNameAttr($value): string { return trim((string) $value); }
}
