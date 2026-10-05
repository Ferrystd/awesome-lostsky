import asyncio,json,subprocess,secrets,pathlib,sys
root=str(pathlib.Path(__file__).resolve().parent.parent)
if '--realtime' not in sys.argv:
 print('External probe disabled; pass --realtime explicitly.');sys.exit(0)
import websockets
run='release-'+secrets.token_hex(8)
php=r'''require getcwd().'/vendor/autoload.php';(new think\App(getcwd()))->initialize();$a=json_decode(stream_get_contents(STDIN),true);$s='entity-session:'.$a['id'];$t=Firebase\JWT\JWT::encode(['sub'=>$s,'exp'=>time()+120],config('centrifugo.token_secret'),'HS256');$u=config('centrifugo.client_url');if(str_starts_with($u,'/'))$u=preg_replace('~^http~','ws',rtrim(config('centrifugo.api_url'),'/')).$u;$c=$a['channel'];$st=Firebase\JWT\JWT::encode(['sub'=>$s,'channel'=>$c,'exp'=>time()+120],config('centrifugo.token_secret'),'HS256');echo json_encode(['url'=>$u,'token'=>$t,'subscription'=>$st]);'''
def call(code,data):
 p=subprocess.run(['php','-r',code],input=json.dumps(data),text=True,capture_output=True,check=True,cwd=root)
 return json.loads(p.stdout)
async def main():
 id=secrets.randbelow(1000000000)+2000000000
 channel='chat.conversation.'+run+'.entity.0.session.'+str(id)
 cfg=call(php,{'id':id,'channel':channel})
 async with websockets.connect(cfg['url'],open_timeout=8) as ws:
  await ws.send(json.dumps({'id':1,'connect':{'token':cfg['token']}}))
  r=json.loads(await asyncio.wait_for(ws.recv(),8));assert 'connect' in r,r
  print('REAL_WS_CONNECT_PASS')
  await ws.send(json.dumps({'id':2,'subscribe':{'channel':channel,'token':cfg['subscription']}}))
  r=json.loads(await asyncio.wait_for(ws.recv(),8));assert 'subscribe' in r,r
  print('REAL_WS_SUBSCRIBE_PASS')
  cmd=r'''require getcwd().'/vendor/autoload.php';(new think\App(getcwd()))->initialize();$a=json_decode(stream_get_contents(STDIN),true);$r=app(app\service\ChatRealtime::class)->request(rtrim(config('centrifugo.api_url'),'/').'/api/publish',json_encode(['channel'=>$a['channel'],'data'=>['probe'=>$a['run']]]),['X-API-Key: '.config('centrifugo.api_key')]);echo $r['body'];'''
  r=call(cmd,{'channel':channel,'run':run});assert 'error' not in r,r
  r=json.loads(await asyncio.wait_for(ws.recv(),8));assert r['push']['pub']['data']['probe']==run
  print('REAL_WS_PUBLICATION_PASS')
  cmd=r'''require getcwd().'/vendor/autoload.php';(new think\App(getcwd()))->initialize();$a=json_decode(stream_get_contents(STDIN),true);app(app\service\ChatRealtime::class)->disconnectSession($a['id']);echo '{}';'''
  call(cmd,{'id':id})
  try:
   r=json.loads(await asyncio.wait_for(ws.recv(),8));assert 'disconnect' in r.get('push',{}),r
  except websockets.ConnectionClosed:
   pass
  print('REAL_WS_SERVICE_DISCONNECT_PASS')
asyncio.run(main())
