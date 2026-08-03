<?php
declare(strict_types=1);

namespace app\model;

class TeamEntityProfile extends Base
{
    protected $type = [
        'id' => 'integer', 'entity_id' => 'integer', 'create_time' => 'integer',
        'update_time' => 'integer', 'delete_time' => 'integer', 'name' => 'string',
        'avatar' => 'string', 'description' => 'string', 'intro_image' => 'string',
        'intro_video' => 'string', 'introduction_markdown' => 'string',
    ];

    protected $json = ['document_tags'];
    protected $hidden = ['delete_time'];
    protected $readonly = ['entity_id'];

    public function subject() { return $this->belongsTo(Entity::class, 'entity_id'); }
    public function markdownReferences() { return $this->morphMany(MarkdownReference::class, 'referenceable', 'teamEntityProfile'); }
    public function setNameAttr($value): string { return trim((string) $value); }
}
