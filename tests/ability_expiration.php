<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\job\ExpireTeamAbility;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamAbilityGrant;
use app\model\TeamNotice;
use app\model\User;
use app\service\AbilityResolver;
use app\service\TeamSetting;
use think\App;
use think\queue\Job;

(new App(dirname(__DIR__)))->initialize();

final class AbilityExpirationTestJob extends Job
{
    public ?int $releasedDelay = null;
    public function __construct(private int $attempt = 1) {}
    public function getJobId(): string { return 'ability-expiration-test'; }
    public function attempts(): int { return $this->attempt; }
    public function getRawBody(): string { return '{}'; }
    public function release($delay = 0): void { $this->releasedDelay = (int) $delay; parent::release($delay); }
}

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$grant = static function (int $teamId, string $key, int $level, int $endsAt): TeamAbilityGrant {
    $row = new TeamAbilityGrant;
    $row->save([
        'team_id' => $teamId,
        'ability_key' => $key,
        'level' => $level,
        'starts_at' => time() - 100,
        'ends_at' => $endsAt,
        'source_type' => 'manual',
    ]);
    return $row;
};
$project = static function (int $teamId, string $key, int $level, int $expires): void {
    $row = TeamAbility::where('team_id', $teamId)->where('ability_key', $key)->find() ?? new TeamAbility;
    $row->save(['team_id' => $teamId, 'ability_key' => $key, 'level' => $level, 'expire_time' => $expires]);
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $user = new User;
    $user->save([
        'phone' => '16' . random_int(100000000, 999999999),
        'username' => "ability-expiration-{$suffix}",
        'password' => password_hash('test-only', PASSWORD_DEFAULT),
    ]);
    $team = new Team;
    $team->save(['slug' => "ability-expiration-{$suffix}", 'user_id' => $user->id]);
    $teamId = (int) $team->id;
    $expiredAt = time() - 2;

    $grant($teamId, 'doc', 2, $expiredAt);
    $grant($teamId, 'doc', 1, time() + 3600);
    $project($teamId, 'doc', 2, $expiredAt);
    $boundary = app(AbilityResolver::class);
    $assert($boundary->resolveGrants($teamId, 'doc', 1, $expiredAt)['enabled'], 'grant remains valid through its exact end second');

    $job = new AbilityExpirationTestJob;
    app(ExpireTeamAbility::class)->fire($job, [
        'team_id' => $teamId,
        'ability_key' => 'doc',
        'expected_level' => 2,
        'expected_expire_time' => $expiredAt,
        'expire_time' => $expiredAt,
    ]);
    $doc = TeamAbility::where('team_id', $teamId)->where('ability_key', 'doc')->find();
    $assert($job->isDeleted() && !$job->isReleased(), 'successful expiration job is deleted');
    $assert((int) $doc->level === 1, 'real expiration downgrades the projection to the covered lower level');
    $assert(TeamNotice::where('team_id', $teamId)->count() === 1, 'real level downgrade sends one Team notice');

    $duplicate = new AbilityExpirationTestJob;
    app(ExpireTeamAbility::class)->fire($duplicate, [
        'team_id' => $teamId,
        'ability_key' => 'doc',
        'expected_level' => 2,
        'expected_expire_time' => $expiredAt,
        'expire_time' => $expiredAt,
    ]);
    $assert(TeamNotice::where('team_id', $teamId)->count() === 1, 'duplicate expiration job does not duplicate the notice');

    $coveredExpiry = $expiredAt - 10;
    $grant($teamId, 'transaction', 1, $coveredExpiry);
    $grant($teamId, 'transaction', 1, time() + 7200);
    $project($teamId, 'transaction', 1, time() + 7200);
    app(ExpireTeamAbility::class)->fire(new AbilityExpirationTestJob, [
        'team_id' => $teamId,
        'ability_key' => 'transaction',
        'expected_level' => 1,
        'expected_expire_time' => $coveredExpiry,
        'expire_time' => $coveredExpiry,
    ]);
    $assert(TeamNotice::where('team_id', $teamId)->count() === 1, 'same-level overlapping grant suppresses expiration notification');

    $shopGrant = $grant($teamId, 'shop', 1, time() + 3600);
    app(AbilityResolver::class)->syncProjection($teamId, 'shop');
    app(TeamSetting::class)->batch($teamId, 'shop', ['enabled' => true]);
    $shopGrant->save(['ends_at' => $expiredAt]);
    $project($teamId, 'shop', 1, $expiredAt);
    $expiredShop = app(\app\service\TeamAccess::class)->ability($teamId, 'shop', '商城');
    $assert(
        $expiredShop['enabled'] === false
            && $expiredShop['level'] === 1
            && $expiredShop['expire_time'] === $expiredAt
            && $expiredShop['reason'] === 'expired',
        'expired grant remains visible with its level, expiry and status in the access snapshot'
    );
    app(ExpireTeamAbility::class)->fire(new AbilityExpirationTestJob, [
        'team_id' => $teamId,
        'ability_key' => 'shop',
        'expected_level' => 1,
        'expected_expire_time' => $expiredAt,
        'expire_time' => $expiredAt,
    ]);
    $shop = TeamAbility::where('team_id', $teamId)->where('ability_key', 'shop')->find();
    $shopNotice = TeamNotice::where('team_id', $teamId)->whereLike('dedup_key', 'ability-expired:%:shop:%')->find();
    $assert((int) $shop->level === 0, 'Shop Ability fully expires');
    $assert(!(bool) app(TeamSetting::class)->internal($teamId, 'shop')['enabled'], 'Shop expiration atomically closes shop.enabled');
    $assert($shopNotice && str_contains((string) $shopNotice->content, '已自动关闭'), 'Shop expiration notice explains the automatic closure');
    $assert(!array_key_exists('dedup_key', $shopNotice->toArray()), 'notice API output hides the internal dedup key');

    $grant($teamId, 'file', 2, $expiredAt);
    $grant($teamId, 'file', 3, 0);
    $project($teamId, 'file', 3, 0);
    app(ExpireTeamAbility::class)->fire(new AbilityExpirationTestJob, [
        'team_id' => $teamId,
        'ability_key' => 'file',
        'expected_level' => 2,
        'expected_expire_time' => $expiredAt,
        'expire_time' => $expiredAt,
    ]);
    $assert((int) TeamAbility::where('team_id', $teamId)->where('ability_key', 'file')->value('level') === 3, 'permanent grant makes an old delayed job a no-op');
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
fwrite(STDOUT, "Ability expiration tests passed\n");
