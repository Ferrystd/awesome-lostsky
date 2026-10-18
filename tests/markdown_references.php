<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Document;
use app\model\MarkdownReference;
use app\model\TeamEntityProfile;
use app\model\TeamProduct;
use app\service\Markdown;
use think\App;
use think\facade\Db;

(new App(dirname(__DIR__)))->initialize();
if (!in_array(config('database.connections.mysql.hostname'), ['127.0.0.1', 'localhost', '::1'], true)) {
    throw new RuntimeException('This transactional fixture requires a local database');
}
$checks = 0;
$assert = static function (bool $condition, string $case) use (&$checks): void {
    if (!$condition) throw new RuntimeException($case);
    $checks++;
};
Db::startTrans();
try {
    $slug = 'markdown-ref-' . bin2hex(random_bytes(6));
    $entityId = Db::name('entity')->insertGetId([
        'slug' => $slug, 'entityable_type' => 'teamVirtual',
        'entityable_id' => random_int(1000000000, 2000000000),
        'create_time' => time(), 'update_time' => time(),
    ]);
    $service = app(Markdown::class);
    foreach ([Document::class => 'document', TeamEntityProfile::class => 'teamEntityProfile', TeamProduct::class => 'teamProduct'] as $class => $type) {
        // Only source identity is read by sync; all references and the entity roll back below.
        $source = new $class(['id' => $entityId]);
        $lookup = ['referenceable_type' => $type, 'referenceable_id' => $entityId, 'referenceable_field' => 'content', 'entity_id' => $entityId];
        $markdown = "[person](lostsky://entity/{$slug})";
        $service->sync($source, 'content', $markdown);
        $reference = MarkdownReference::where($lookup)->find();
        $assert($reference !== null, "{$type}: creates reference");
        $referenceId = (int) $reference->id;
        $service->sync($source, 'content', $markdown);
        $assert(MarkdownReference::where($lookup)->count() === 1, "{$type}: repeat sync does not duplicate");
        $service->sync($source, 'content', '');
        $assert(MarkdownReference::where($lookup)->find() === null, "{$type}: removed mention soft deletes reference");
        $service->sync($source, 'content', $markdown);
        $restored = MarkdownReference::where($lookup)->find();
        $assert($restored !== null && (int) $restored->id === $referenceId, "{$type}: restores original reference");
        $assert(MarkdownReference::withTrashed()->where($lookup)->count() === 1, "{$type}: restoration keeps unique source reference");
        $service->deleteSource($source, 'content');
        $assert(MarkdownReference::where($lookup)->find() === null, "{$type}: source deletion removes reference");
    }
} finally {
    Db::rollback();
}
echo "Markdown references: {$checks} checks passed; fixture rolled back\n";
