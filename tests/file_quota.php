<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\File as FileModel;
use app\model\Team;
use app\model\TeamAbility;
use app\model\User;
use app\service\File as FileService;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$user = new User;
$user->save([
    'phone' => '16' . random_int(100000000, 999999999),
    'username' => "file-quota-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$team = new Team;
$team->save(['slug' => "file-quota-{$suffix}", 'user_id' => $user->id]);
$service = app(FileService::class);
$fileIds = [];
$baseLimit = 128 * 1024 * 1024;
$limit = 500 * 1024 * 1024;

$makeFile = static function (int $index, int $size) use ($team, $suffix, &$fileIds): FileModel {
    $file = new FileModel;
    $file->save([
        'hash' => hash('sha256', "{$suffix}-{$index}"),
        'name' => "fixture-{$index}.txt",
        'path' => "team/{$team->id}/fixture-{$index}.txt",
        'size' => $size,
        'mime_type' => 'text/plain',
        'team_id' => $team->id,
        'entity_id' => null,
    ]);
    $fileIds[] = (int) $file->id;
    return $file;
};

try {
    $usage = $service->uploadAvailability((int) $team->id);
    $abilityState = $service->capacityAbility((int) $team->id);
    $accessState = app(\app\service\TeamAccess::class)->fileAbility((int) $team->id);
    if (!$usage['available'] || $usage['size_limit'] !== $baseLimit
        || $usage['remaining_size'] !== $baseLimit || $usage['reason'] !== null
        || !$abilityState['enabled'] || $abilityState['level'] !== 0
        || !$accessState['enabled'] || $accessState['level'] !== 0) {
        throw new RuntimeException('A missing File Ability must provide the level 0 base capacity');
    }
    $service->checkAbility((int) $team->id, 1);

    $ability = new TeamAbility;
    $ability->save([
        'team_id' => $team->id,
        'ability_key' => 'file',
        'level' => 1,
        'expire_time' => time() - 1,
    ]);
    $expired = $service->uploadAvailability((int) $team->id);
    if (!$expired['available'] || $expired['size_limit'] !== $baseLimit) {
        throw new RuntimeException('An expired File upgrade must fall back to level 0 capacity');
    }
    $ability->expire_time = 0;
    $ability->save();

    for ($index = 0; $index < 101; $index++) {
        $makeFile($index, 1);
    }

    $usage = $service->uploadAvailability((int) $team->id);
    if ($usage['count'] !== 101 || !$usage['available'] || $usage['remaining_size'] !== $limit - 101) {
        throw new RuntimeException('File count must not limit uploads while byte capacity remains');
    }
    $service->checkAbility((int) $team->id, 1);

    $first = FileModel::find($fileIds[0]);
    $makeFile(101, $limit - 101);
    $usage = $service->uploadAvailability((int) $team->id);
    if ($usage['count'] !== 102 || $usage['total_size'] !== $limit
        || $usage['remaining_size'] !== 0 || $usage['available'] || $usage['reason'] !== 'quota') {
        throw new RuntimeException('Level 1 capacity boundary must be reported exactly');
    }

    try {
        $service->checkAbility((int) $team->id, 1);
        throw new RuntimeException('Capacity overflow must be rejected');
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== 422
            || $exception->getMessage() !== '该团队文件已达到上限，请联系团队管理员。') {
            throw $exception;
        }
    }

    $deletion = new class extends FileService {
        public bool $fail = true;

        public function purgeObject(string $path): void
        {
            if ($this->fail) {
                throw new HttpException(500, 'simulated OSS failure');
            }
        }
    };
    try {
        $deletion->deleteByTeam((int) $team->id, (int) $first->id);
        throw new RuntimeException('OSS deletion failure must be returned');
    } catch (HttpException $exception) {
        if ($exception->getMessage() !== 'simulated OSS failure') {
            throw $exception;
        }
    }
    if (!FileModel::find($first->id) || $service->uploadAvailability((int) $team->id)['available']) {
        throw new RuntimeException('OSS deletion failure must preserve the record and used capacity');
    }

    $deletion->fail = false;
    $deletion->deleteByTeam((int) $team->id, (int) $first->id);
    if (FileModel::withTrashed()->find($first->id)
        || !$service->uploadAvailability((int) $team->id)['available']) {
        throw new RuntimeException('Successful deletion must permanently remove the record and release capacity');
    }

    $ability->level = 3;
    $ability->save();
    $usage = $service->uploadAvailability((int) $team->id);
    if (!$usage['available'] || $usage['size_limit'] !== null || $usage['remaining_size'] !== null) {
        throw new RuntimeException('Level 3 capacity must be unlimited');
    }
    $service->checkAbility((int) $team->id, PHP_INT_MAX);
} finally {
    if ($fileIds) {
        FileModel::destroy($fileIds, true);
    }
    if (isset($ability)) TeamAbility::destroy((int) $ability->id, true);
    Team::destroy((int) $team->id, true);
    User::destroy((int) $user->id, true);
}

fwrite(STDOUT, "File quota tests passed." . PHP_EOL);
