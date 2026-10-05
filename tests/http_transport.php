<?php
declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';
(new think\App(dirname(__DIR__)))->initialize();
$socket=stream_socket_server('tcp://127.0.0.1:0',$errno,$error);
if(!$socket)throw new RuntimeException('Cannot reserve local port');
$address=stream_socket_get_name($socket,false);fclose($socket);
$router=tempnam(sys_get_temp_dir(),'lostsky-http-');$log=tempnam(sys_get_temp_dir(),'lostsky-http-log-');
file_put_contents($router, '<?php if($_SERVER["REQUEST_URI"]==="/bad"){http_response_code(503);}header("Content-Type: application/json");echo json_encode(["ok"=>true]);');
$process=proc_open([PHP_BINARY,'-S',$address,$router],[0=>['pipe','r'],1=>['file',$log,'a'],2=>['file',$log,'a']],$pipes,null,null,['bypass_shell'=>true,'create_new_console'=>false]);
if(!is_resource($process))throw new RuntimeException('Cannot start local HTTP fixture');
fclose($pipes[0]);$checks=0;
$assert=static function(bool $ok,string $name)use(&$checks):void{if(!$ok)throw new RuntimeException($name);$checks++;};
try {
    $ready=false;
    for($i=0;$i<30;$i++){$c=@stream_socket_client('tcp://'.$address,$errno,$error,.1);if($c){fclose($c);$ready=true;break;}usleep(100000);}
    $assert($ready,'local HTTP readiness');
    $url='http://'.$address;$chat=new app\service\ChatRealtime();
    $r=$chat->request($url.'/ok','{}');
    $assert($r['code']===200 && json_decode($r['body'],true)['ok']===true,'Chat real transport returns success without deprecated handle close');
    try {$chat->request($url.'/bad','{}');throw new LogicException('503 was accepted');}
    catch(RuntimeException $e){$assert(str_contains($e->getMessage(),'503'),'Chat rejects HTTP error');}
    $protocol=new app\service\WeiboProtocol();$request=new ReflectionMethod($protocol,'request');
    [$payload,$status]=$request->invoke($protocol,'GET',$url.'/ok');
    $assert($status===200 && $payload['ok']===true,'Weibo real transport returns success');
    [$payload,$status]=$request->invoke($protocol,'GET',$url.'/bad');
    $assert($status===503 && $payload['ok']===true,'Weibo preserves error payload for classifier');
    // Error paths release their handle and allow subsequent successful requests.
    $assert($chat->request($url.'/ok','{}')['code']===200,'Chat recovers after HTTP failure');
    [$payload,$status]=$request->invoke($protocol,'GET',$url.'/ok');
    $assert($status===200,'Weibo recovers after HTTP error');
} finally {proc_terminate($process);proc_close($process);unlink($router);unlink($log);}
echo 'HTTP transport tests passed ('.$checks.' checks).'.PHP_EOL;
