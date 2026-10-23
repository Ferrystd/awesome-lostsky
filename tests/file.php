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
    file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
    $validator = app(\app\validate\File::class);
    $assert(
        $validator->upload(new UploadedFile($path, 'avatar.png', 'image/png', null, true)),
        'configured image extension is accepted'
    );

    file_put_contents($path, '<!doctype html><html><body>fake image</body></html>');
    $validator = app(\app\validate\File::class, [], true);
    $assert(!$validator->upload(new UploadedFile($path, 'fake.png', 'image/png', null, true)), 'image MIME is detected from content, not supplied header or extension');

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
    $persistPosition = strpos((string) $source, '$result = Db::transaction(', (int) $uploadPosition);
    $assert(
        $uploadPosition !== false
            && $persistPosition !== false
            && $uploadPosition < $persistPosition
            && str_contains((string) $source, '$this->purgeObject($path);'),
        'OSS is called outside the persistence transaction and database failure has compensation'
    );
    $subject = (new \app\model\File())->subject();
    $schema = file_get_contents(dirname(__DIR__) . '/sql/schema.sql');
    $assert(
        str_contains((string) $source, "where('entity_id'")
            && str_contains((string) $source, '$record->entity_id = $entityId;')
            && !str_contains((string) $source, '$record->member_id'),
        'file persistence uses entity IDs instead of member IDs'
    );
    $assert(
        $subject instanceof \think\model\relation\BelongsTo
            && $subject->getModel() instanceof \app\model\Entity
            && $subject->getForeignKey() === 'entity_id'
            && $subject->getLocalKey() === 'id'
            && str_contains((string) $schema, 'CONSTRAINT `fk_file_entity`')
            && !str_contains((string) $schema, 'CONSTRAINT `fk_file_member`'),
        'file model and schema reference entity'
    );
    $exceptionHandle = file_get_contents(dirname(__DIR__) . '/app/ExceptionHandle.php');
    $deployment = file_get_contents(dirname(__DIR__) . '/docs/dev/operations/deployment.md');
    $productionIni = file_get_contents(dirname(__DIR__) . '/deploy/php/lostsky-production.ini');
    $tiers = require dirname(__DIR__) . '/config/file.php';
    $cleanup = require dirname(__DIR__) . '/config/cleanup.php';
    $fallback = dirname(__DIR__) . '/deploy/oss/system/image-not-found.png';
    $fallbackDeploy = file_get_contents(dirname(__DIR__) . '/app/command/DeployOssFallback.php');
    $fallbackConfigure = file_get_contents(dirname(__DIR__) . '/app/command/ConfigureOssFallback.php');
    $fallbackPublish = file_get_contents(dirname(__DIR__) . '/app/command/PublishOssFallback.php');
    $mediaManifest = json_decode((string) file_get_contents(dirname(__DIR__) . '/frontend/media/manifest.json'), true, 512, JSON_THROW_ON_ERROR);
    $assert(
        str_contains((string) $source, "'source' => 'base'")
            && str_contains((string) $exceptionHandle, 'AccessDeniedException')
            && str_contains((string) $exceptionHandle, "'data'    => \$e->data()"),
        'file ability failures use the structured JSON error contract'
    );
    $assert(
        str_contains((string) $productionIni, 'upload_tmp_dir=')
            && str_contains((string) $productionIni, 'display_errors=Off')
            && str_contains((string) $productionIni, 'display_startup_errors=Off')
            && str_contains((string) $productionIni, 'log_errors=On')
            && str_contains((string) $deployment, 'Content-Type'),
        'production upload runtime documents a writable temp directory and pure JSON smoke test'
    );
    $assert(
        !array_key_exists('count', $tiers['tiers'][0])
            && $tiers['tiers'][0]['size'] === 128 * 1024 * 1024
            && $tiers['tiers'][1]['size'] === 500 * 1024 * 1024
            && $tiers['tiers'][2]['size'] === 2 * 1024 * 1024 * 1024
            && $tiers['tiers'][3]['size'] === -1,
        'File Ability tiers start at 128 MiB for level 0 and level 3 is unlimited'
    );
    $assert(
        str_contains((string) $source, "private const QUOTA_MESSAGE = '该团队文件已达到上限，请联系团队管理员。'")
            && str_contains((string) $source, 'uploadAvailability')
            && str_contains((string) $source, '$this->lockTeam($teamId);'),
        'quota status, canonical error text, and serialized final validation are implemented'
    );
    $assert(
        !array_key_exists('file_retention_days', $cleanup)
            && str_contains((string) $source, '$this->purgeObject((string) $file->path);')
            && str_contains((string) $source, '$file->force(true)->delete();'),
        'file deletion purges OSS before permanently deleting the record'
    );
    $image = is_file($fallback) ? getimagesize($fallback) : false;
    $assert(
        is_file($fallback)
            && hash_file('sha256', $fallback) === 'c7867513080c061235f9be90bab875c19883a0fe268b8fa7e937ed3c6d325f31'
            && $image !== false
            && $image[0] === 1568
            && $image[1] === 1003
            && $image['mime'] === 'image/png',
        'the original protected OSS image fallback is preserved byte-for-byte'
    );
    $assert(
        str_contains((string) $fallbackDeploy, "private const OBJECT_KEY = 'system/image-not-found.png'")
            && str_contains((string) $fallbackDeploy, "OssClient::OSS_CONTENT_TYPE => 'image/png'")
            && str_contains((string) $fallbackConfigure, "private const IMAGE_SUFFIXES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']")
            && str_contains((string) $fallbackConfigure, 'httpErrorCodeReturnedEquals: 404')
            && str_contains((string) $fallbackConfigure, 'httpRedirectCode: 302')
            && str_contains((string) $fallbackConfigure, '$preserved')
            && str_contains((string) $fallbackPublish, 'BucketACLType::PUBLIC_READ')
            && str_contains((string) $fallbackPublish, 'new PublicAccessBlockConfiguration(false)')
            && str_contains((string) $fallbackPublish, 'confirm-public-read'),
        'OSS fallback deployment locks the system key and preserves unrelated routing rules'
    );
    $manifestPaths = array_column($mediaManifest['assets'] ?? [], 'path');
    $assert(
        in_array('deploy/oss/system/image-not-found.png', $manifestPaths, true)
            && str_contains((string) $deployment, 'oss:fallback:deploy')
            && str_contains((string) $deployment, 'oss:fallback:configure --dry-run')
            && str_contains((string) $deployment, 'oss:fallback:publish --confirm-public-read')
            && str_contains((string) $deployment, 'https://help.aliyun.com/zh/oss/user-guide/redirection'),
        'the protected fallback is registered and its safe deployment workflow is documented'
    );
} finally {
    @unlink($path);
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "File upload tests passed." . PHP_EOL);
