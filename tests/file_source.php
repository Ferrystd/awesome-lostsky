<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\FileSource;
use app\model\File as FileModel;
use app\model\Team;
use app\model\User;
use app\service\File as FileService;
use think\App;
use think\facade\Db;
use think\file\UploadedFile;

(new App(dirname(__DIR__)))->initialize();
$check = static function (bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
};
$validator = new \app\validate\File;
$check($validator->attachmentSource('markdown') === FileSource::Markdown, 'Markdown source accepted');
$check($validator->attachmentSource('attachment') === FileSource::Attachment, 'Attachment source accepted');
foreach (['manual', 'system', 'command', 'unknown', '', 'invalid'] as $invalid) {
    try {
        $validator->attachmentSource($invalid);
        throw new RuntimeException('Invalid common source accepted');
    } catch (\think\exception\HttpException $exception) {
        $check($exception->getStatusCode() === 422, 'Invalid source returns 422');
    }
}

$path = tempnam(sys_get_temp_dir(), 'file-source-');
file_put_contents($path, 'file-source-' . bin2hex(random_bytes(8)));
Db::startTrans();
try {
    $user = new User;
    $user->save(['phone' => '16' . random_int(100000000, 999999999), 'username' => 'file-source-test']);
    $team = new Team;
    $team->save(['slug' => 'file-source-' . bin2hex(random_bytes(5)), 'user_id' => $user->id]);
    $entity = new \app\model\Entity;
    $entity->save(['slug' => 'file-source-entity-' . bin2hex(random_bytes(5)), 'entityable_type' => 'team', 'entityable_id' => $team->id]);
    $service = app(FileService::class);
    foreach (FileSource::cases() as $source) {
        $file = new FileModel;
        $file->save([
            'team_id' => $team->id, 'entity_id' => $entity->id,
            'name' => 'fixture.txt', 'path' => 'test/file-source.txt',
            'hash' => $source === FileSource::Markdown ? hash_file('sha256', $path) : hash('sha256', $source->value),
            'mime_type' => 'text/plain', 'size' => filesize($path), 'source' => $source,
        ]);
        $check($service->get((int) $team->id, (int) $file->id)['source'] === $source->value, 'Detail exposes stored source');
        if ($source === FileSource::Markdown) $markdown = $file;
    }
    $check(count($service->list((int) $team->id, [])['list']) === 7, 'List includes each category');
    $upload = new UploadedFile($path, 'fixture.txt', 'text/plain', null, true);
    $result = $service->uploadForJoin($upload, (int) $team->id);
    $check($result['id'] === (int) $markdown->id, 'Different entry deduplicates');
    $check($service->get((int) $team->id, $result['id'])['source'] === 'markdown', 'Dedup preserves first source');
    $markdown->delete();
    $result = $service->uploadForJoin($upload, (int) $team->id);
    $check($service->get((int) $team->id, $result['id'])['source'] === 'markdown', 'Restore preserves first source');
    $legacy = new FileModel;
    $legacy->save(['team_id' => $team->id, 'entity_id' => $entity->id, 'name' => 'legacy.txt', 'hash' => hash('sha256', 'legacy'), 'path' => 'test/legacy.txt']);
    $check($service->get((int) $team->id, (int) $legacy->id)['source'] === 'unknown', 'Missing source defaults to unknown');
} finally {
    Db::rollback();
    unlink($path);
}
echo "File source tests passed.\n";
