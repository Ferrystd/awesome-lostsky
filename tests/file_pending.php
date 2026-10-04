<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
(new think\App(dirname(__DIR__)))->initialize();
use app\model\File as FileModel;
use app\model\Team;
use app\model\User;
use app\model\Entity;
use app\model\TeamEntityProfile;
use app\service\File;
use think\facade\Db;
use think\facade\Config;
use think\exception\HttpException;
use think\file\UploadedFile;
$checks = 0;
$check = static function (bool $value, string $name) use (&$checks): void { $checks++; if (!$value) throw new RuntimeException($name); };
$reject = static function (callable $call, int $code) use ($check): void {
    try { $call(); throw new RuntimeException('Expected rejection'); }
    catch (HttpException $e) { $check($e->getStatusCode() === $code, 'Status matches'); }
};
$local = tempnam(sys_get_temp_dir(), 'pending');
file_put_contents($local, 'pending-' . bin2hex(random_bytes(12)));
Db::startTrans();
try {
    $user = new User;
    $user->save(['phone' => '16'.random_int(100000000,999999999), 'username'=>'pending-test']);
    $team = new Team;
    $team->save(['slug'=>'pending-'.bin2hex(random_bytes(5)), 'user_id'=>$user->id]);
    $entity = new Entity;
    $entity->save(['slug'=>'pending-entity-'.bin2hex(random_bytes(5)), 'entityable_type'=>'team', 'entityable_id'=>$team->id]);
    $profile = new TeamEntityProfile;
    $profile->save(['entity_id'=>$entity->id, 'name'=>'pending']);
    $service = app(File::class);
    $domain = rtrim((string) Config::get('aliyun.oss_domain'), '/');
    if (!$domain) $domain = 'https://'.Config::get('aliyun.bucket').'.oss-'.Config::get('aliyun.region').'.aliyuncs.com';
    $fixture = static function (string $label, int $deadline, int $size = 10) use ($team,$entity): FileModel {
        $file = new FileModel;
        $file->save(['team_id'=>$team->id, 'entity_id'=>$entity->id, 'path'=>$team->id.'/test/'.bin2hex(random_bytes(12)).'.png',
            'hash'=>hash('sha256',$label.bin2hex(random_bytes(4))), 'name'=>$label.'.png', 'size'=>$size, 'mime_type'=>'image/png',
            'source'=>'attachment', 'pending_until'=>$deadline]);
        return $file;
    };
    $pending = $fixture('hidden', time()+43200);
    $check($service->usage((int)$team->id)['total_size'] === 0, 'Pending does not consume quota');
    $check($service->list((int)$team->id, [])['total'] === 0, 'Pending not listed');
    $reject(fn()=>$service->get((int)$team->id,(int)$pending->id),404);
    Db::name('file')->where('id',$pending->id)->update(['hash'=>hash_file('sha256',$local)]);
    $same = $service->uploadForJoin(new UploadedFile($local,'test.txt','text/plain',null,true),(int)$team->id);
    $check($same['id']===(int)$pending->id, 'Dedupe pending without OSS');
    $check(FileModel::find($pending->id)->pending_until !== null, 'Join dedupe remains pending');
    $profile->save(['description'=>$domain.'/'.$pending->path]);
    $check(FileModel::find($pending->id)->pending_until !== null, 'Arbitrary text URL does not activate');
    $profile->save(['avatar'=>$domain.'/'.$pending->path]);
    $check(FileModel::find($pending->id)->pending_until === null, 'Saved avatar activates');
    $check($service->usage((int)$team->id)['total_size'] === 10, 'Activated file consumes quota');
    $md = $fixture('markdown', time()+43200);
    $document = new \app\model\Document;
    $document->save(['entity_id'=>$entity->id,'title'=>'pending','content'=>$domain.'/'.$md->path]);
    $check(FileModel::find($md->id)->pending_until !== null, 'Markdown bare URL does not activate');
    $document->save(['content'=>"```md\n![x](".$domain.'/'.$md->path.")\n```"]);
    $check(FileModel::find($md->id)->pending_until !== null, 'Code block does not activate');
    $document->save(['content'=>'`![x]('.$domain.'/'.$md->path.')`']);
    $check(FileModel::find($md->id)->pending_until !== null, 'Inline code does not activate');
    $document->save(['content'=>'<!-- ![x]('.$domain.'/'.$md->path.') -->']);
    $check(FileModel::find($md->id)->pending_until !== null, 'Comment inline image does not activate');
    $document->save(['content'=>'<!-- ![x][ref] -->'."\n\n[ref]: ".$domain.'/'.$md->path]);
    $check(FileModel::find($md->id)->pending_until !== null, 'Comment reference image does not activate');
    $document->save(['content'=>'![x]('.$domain.'/'.$md->path.')']);
    $check(FileModel::find($md->id)->pending_until === null, 'Document image resolves entity team and activates');
    foreach (['![r][ref]' . "\n\n[ref]: %s", '<img src="%s">', '[file][ref]' . "\n\n[ref]: %s"] as $format) {
        $reference = $fixture('reference', time()+43200);
        $document->save(['content'=>sprintf($format, $domain.'/'.$reference->path)]);
        $check(FileModel::find($reference->id)->pending_until === null, 'Reference and HTML rendered nodes activate');
    }
    $expired = $fixture('expired', time()-1);
    $oldAvatar = TeamEntityProfile::find($profile->id)->avatar;
    $reject(fn()=>TeamEntityProfile::find($profile->id)->save(['avatar'=>$domain.'/'.$expired->path]),422);
    $check(TeamEntityProfile::find($profile->id)->avatar === $oldAvatar, 'Expired reference rolls resource back');
    $rollback = $fixture('rollback', time()+43200);
    try {
        Db::transaction(function () use($profile,$domain,$rollback): void {
            TeamEntityProfile::find($profile->id)->save(['avatar'=>$domain.'/'.$rollback->path]);
            throw new RuntimeException('rollback');
        });
    } catch (RuntimeException $e) { $check($e->getMessage()==='rollback','Forced rollback'); }
    $check(FileModel::find($rollback->id)->pending_until !== null, 'Outer business failure rolls activation back');
    $full = $fixture('quota', time()+43200, 128*1024*1024);
    $reject(fn()=>TeamEntityProfile::find($profile->id)->save(['avatar'=>$domain.'/'.$full->path]),422);
    $check(FileModel::find($full->id)->pending_until !== null, 'Quota failure preserves pending');
    $foreign = new Team;
    $foreign->save(['slug'=>'pending-foreign-'.bin2hex(random_bytes(4)), 'user_id'=>$user->id]);
    $cross = $fixture('cross',time()+43200);
    $cross->save(['team_id'=>$foreign->id]); // readonly must not change stored team
    Db::name('file')->where('id',$cross->id)->update(['team_id'=>$foreign->id]);
    $reject(fn()=>TeamEntityProfile::find($profile->id)->save(['avatar'=>$domain.'/'.$cross->path]),422);
    $check($service->expirePending(time()) === 1, 'Only expired pending cleaned');
    $check(FileModel::withTrashed()->find($expired->id) === null, 'Expired row removed');
    $check(\app\model\ExternalCompensation::where('resource_key',$expired->path)->whereNull('completed_at')->count() === 1, 'Physical purge durably queued');
    $check(FileModel::find($pending->id)!==null, 'Active file retained');
    echo "File pending lifecycle tests passed ({$checks} assertions).\n";
} finally { Db::rollback(); unlink($local); }
