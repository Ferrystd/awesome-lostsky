<?php
/** Explicit, isolated release probes. Never sends SMS or Weibo posts. */
declare(strict_types=1);
if (!in_array('--oss',$argv,true) && !in_array('--webhook',$argv,true)) {
    echo "External probes disabled; pass --oss or --webhook explicitly.\n";
    exit(0);
}
require dirname(__DIR__).'/vendor/autoload.php';
(new think\App(dirname(__DIR__)))->initialize();
set_exception_handler(static function(Throwable $e):void { fwrite(STDERR,'External probe failed: '.get_class($e).PHP_EOL);exit(1); });
$assert=static function(bool $ok,string $label):void {if(!$ok)throw new RuntimeException($label);echo 'PASS '.$label.PHP_EOL;};
if(in_array('--oss',$argv,true)) {
    $key='release-probes/release-'.bin2hex(random_bytes(8)).'/object.txt';
    $file=tempnam(sys_get_temp_dir(),'lostsky-release-');
    file_put_contents($file,'LostSky isolated release probe '.bin2hex(random_bytes(8)));
    $service=app(app\service\File::class);
    $client=(new ReflectionMethod($service,'ossClient'))->invoke($service);
    $bucket=config('aliyun.bucket');
    try {
        (new ReflectionMethod($service,'putOss'))->invoke($service,$key,$file);
        $assert(hash_equals(hash_file('sha256',$file),hash('sha256',$client->getObject($bucket,$key))),'real OSS put/get');
        $meta=$client->getObjectMeta($bucket,$key);
        $assert((int)($meta['content-length']??-1)===filesize($file),'real OSS head size');
    } finally {
        try {$client->deleteObject($bucket,$key);$assert(!$client->doesObjectExist($bucket,$key),'real OSS delete verified');}
        finally {unlink($file);}
    }
}
if(in_array('--webhook',$argv,true)) {
    // Public echo is a TLS/transport component probe, not the production receiver.
    $body=json_encode(['probe'=>'LostSky release fixture','nonce'=>bin2hex(random_bytes(8))]);
    $id='msg_'.bin2hex(random_bytes(8));$timestamp=(string)time();$secret=random_bytes(32);
    $signature='v1,'.base64_encode(hash_hmac('sha256',$id.'.'.$timestamp.'.'.$body,$secret,true));
    $response=app(app\service\ChatRealtime::class)->request('https://httpbin.org/post',$body,[
        'webhook-id: '.$id,'webhook-timestamp: '.$timestamp,'webhook-signature: '.$signature,
    ]);
    $echo=json_decode($response['body'],true);
    $assert($response['code']===200 && ($echo['data']??null)===$body,'real public echo HTTPS payload');
    $headers=array_change_key_case((array)($echo['headers']??[]),CASE_LOWER);
    $received=(array)($headers['webhook-signature']??[]);
    $assert(in_array($signature,$received,true),'real public echo signature header');
}
