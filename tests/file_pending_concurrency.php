<?php
declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
(new think\App(dirname(__DIR__)))->initialize();
use think\facade\Db;
use think\facade\Config;
use app\model\User;
use app\model\Team;
use app\model\File;
$user = new User;
$team = new Team;
$file = new File;
try {
    $user->save(['phone'=>'16'.random_int(100000000,999999999),'username'=>'file-rr-test']);
    $team->save(['slug'=>'file-rr-'.bin2hex(random_bytes(5)),'user_id'=>$user->id]);
    $file->save(['team_id'=>$team->id,'hash'=>bin2hex(random_bytes(32)), 'name'=>'rr.png','path'=>'test/rr-'.bin2hex(random_bytes(12)),
        'size'=>128*1024*1024,'source'=>'attachment','pending_until'=>time()+43200]);
    $config = Config::get('database.connections.mysql');
    $other = new PDO('mysql:host='.$config['hostname'].';port='.$config['hostport'].';dbname='.$config['database'].';charset=utf8mb4',
        $config['username'],$config['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    Db::execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    Db::startTrans();
    $snapshot = fn() => (int) Db::name('file')->where('team_id',$team->id)->whereNull('pending_until')->sum('size');
    if ($snapshot() !== 0) throw new RuntimeException('Fixture must start pending');
    $other->prepare('UPDATE file SET pending_until = NULL WHERE id = ?')->execute([$file->id]);
    if ($snapshot() !== 0) throw new RuntimeException('Repro must retain old RR snapshot');
    Team::where('id',$team->id)->lock(true)->find();
    try {
        app(\app\service\File::class)->checkAbility((int)$team->id,1);
        throw new RuntimeException('Stale snapshot allowed quota overflow');
    } catch (\think\exception\HttpException $e) {
        if ($e->getStatusCode() !== 422) throw $e;
    }
    Db::rollback();
    echo "File quota RR current-read test passed (3 assertions).\n";
} finally {
    // Scoped committed fixtures are removed, even if the quota assertion fails.
    Db::rollback();
    if ($file->id) Db::name('file')->where('id',$file->id)->delete();
    if ($team->id) Db::name('team')->where('id',$team->id)->delete();
    if ($user->id) Db::name('user')->where('id',$user->id)->delete();
}
