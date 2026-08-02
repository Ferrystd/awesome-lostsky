<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\BusinessAuditEvent;
use app\model\Team;
use app\model\TeamAbility;
use app\model\User;
use think\App;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$user = new User;
$user->save([
    'phone' => '19' . random_int(100000000, 999999999),
    'username' => "ability-command-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$team = new Team;
$team->save([
    'slug' => "ability-command-{$suffix}",
    'user_id' => $user->id,
]);

$run = static function (array $arguments): array {
    $command = [PHP_BINARY, dirname(__DIR__) . '/think', 'team:grant-ability', ...$arguments];
    $descriptors = [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $process = proc_open($command, $descriptors, $pipes, dirname(__DIR__));
    if (!is_resource($process)) {
        throw new RuntimeException('Unable to start team:grant-ability');
    }

    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);

    return [proc_close($process), $stdout, $stderr];
};

try {
    [$exitCode, $stdout, $stderr] = $run([
        '--team=' . $team->slug,
        '--ability=doc',
        '--level=2',
        '--expire-time=2000000000',
    ]);
    if ($exitCode !== 0 || $stderr !== '') {
        throw new RuntimeException("Grant command failed: {$stdout}{$stderr}");
    }

    $ability = TeamAbility::where('team_id', $team->id)->where('ability_key', 'doc')->find();
    if (!$ability || $ability->level !== 2 || $ability->expire_time !== 2000000000) {
        throw new RuntimeException('Grant command did not persist the requested ability');
    }
    $abilityId = (int) $ability->id;

    [$exitCode] = $run([
        '--team=' . $team->slug,
        '--ability=doc',
        '--level=3',
    ]);
    $ability = TeamAbility::where('team_id', $team->id)->where('ability_key', 'doc')->find();
    if ($exitCode !== 0
        || !$ability
        || (int) $ability->id !== $abilityId
        || $ability->level !== 3
        || $ability->expire_time !== 0) {
        throw new RuntimeException('Repeated grant did not update the existing ability');
    }

    $ability->delete();
    [$exitCode] = $run([
        '--team=' . $team->slug,
        '--ability=doc',
    ]);
    $ability = TeamAbility::where('team_id', $team->id)->where('ability_key', 'doc')->find();
    if ($exitCode !== 0 || !$ability || (int) $ability->id !== $abilityId) {
        throw new RuntimeException('Grant command did not restore a soft-deleted ability');
    }

    [$exitCode] = $run(['--team=0', '--ability=doc']);
    if ($exitCode === 0) {
        throw new RuntimeException('Grant command accepted a team ID instead of a slug');
    }

    [$exitCode] = $run(['--team=missing-team', '--ability=doc']);
    if ($exitCode === 0) {
        throw new RuntimeException('Grant command accepted a missing team');
    }

    [$exitCode] = $run(['--team=' . $team->slug, '--ability=invalid:key']);
    if ($exitCode === 0) {
        throw new RuntimeException('Grant command accepted an invalid ability key');
    }

    $auditCount = BusinessAuditEvent::where('application', 'admin')
        ->where('action', 'ability.grant')
        ->where('resource_type', 'team_ability')
        ->where('resource_id', $abilityId)
        ->count();
    if ($auditCount !== 3) {
        throw new RuntimeException('Grant command did not write one audit event per successful grant');
    }

    [$exitCode, $stdout] = $run(['--help']);
    if ($exitCode !== 0
        || !str_contains($stdout, 'doc')
        || !str_contains($stdout, 'file')
        || !str_contains($stdout, 'transaction')) {
        throw new RuntimeException('Grant command help does not describe existing abilities');
    }
} finally {
    if (isset($abilityId)) {
        $auditIds = BusinessAuditEvent::withTrashed()
            ->where('application', 'admin')
            ->where('action', 'ability.grant')
            ->where('resource_type', 'team_ability')
            ->where('resource_id', $abilityId)
            ->column('id');
        if ($auditIds) {
            BusinessAuditEvent::destroy($auditIds, true);
        }
        TeamAbility::destroy($abilityId, true);
    }
    Team::destroy($team->id, true);
    User::destroy($user->id, true);
}

fwrite(STDOUT, "Team grant ability command tests passed\n");
