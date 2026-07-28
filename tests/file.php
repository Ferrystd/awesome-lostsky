<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use think\App;
use think\file\UploadedFile;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};

$path = tempnam(sys_get_temp_dir(), 'lostsky-upload-');
if ($path === false) {
    fwrite(STDERR, "Unable to create upload fixture." . PHP_EOL);
    exit(1);
}

try {
    file_put_contents($path, 'upload-validator-fixture');
    $validator = app(\app\validate\File::class);
    $assert(
        $validator->upload(new UploadedFile($path, 'avatar.webp', 'image/webp', null, true)),
        'configured image extension is accepted'
    );

    $validator = app(\app\validate\File::class, [], true);
    $assert(
        !$validator->upload(new UploadedFile($path, 'payload.php', 'application/x-php', null, true)),
        'executable extension is rejected'
    );

    $source = file_get_contents(dirname(__DIR__) . '/app/service/File.php');
    $assert(
        str_contains((string) $source, '->uploadFile(')
            && !str_contains((string) $source, '->putObject('),
        'OSS upload streams the local file instead of treating its path as object content'
    );
    $uploadPosition = strpos((string) $source, '$this->putOss($path, $file->getPathname());');
    $persistPosition = strpos((string) $source, 'return Db::transaction(', (int) $uploadPosition);
    $assert(
        $uploadPosition !== false
            && $persistPosition !== false
            && $uploadPosition < $persistPosition
            && str_contains((string) $source, '$this->purgeObject($path);'),
        'OSS is called outside the persistence transaction and database failure has compensation'
    );
    $model = file_get_contents(dirname(__DIR__) . '/app/model/File.php');
    $schema = file_get_contents(dirname(__DIR__) . '/sql/schema.sql');
    $assert(
        str_contains((string) $source, "where('entity_id'")
            && str_contains((string) $source, '$record->entity_id = $entityId;')
            && !str_contains((string) $source, '$record->member_id'),
        'file persistence uses entity IDs instead of member IDs'
    );
    $assert(
        str_contains((string) $model, "belongsTo(Entity::class, 'entity_id')")
            && str_contains((string) $schema, 'CONSTRAINT `fk_file_entity`')
            && !str_contains((string) $schema, 'CONSTRAINT `fk_file_member`'),
        'file model and schema reference entity'
    );
} finally {
    @unlink($path);
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "File upload tests passed." . PHP_EOL);
