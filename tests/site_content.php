<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\service\SiteContent;
use think\App;
use think\exception\HttpException;
use think\facade\Db;
use think\Request;

(new App(dirname(__DIR__)))->initialize();
$service = new SiteContent;
$defaults = json_decode((string) file_get_contents(dirname(__DIR__) . '/config/site-content.json'), true, 512, JSON_THROW_ON_ERROR);
$assert = static function (bool $ok, string $label): void { if (!$ok) throw new RuntimeException($label); };
$invalid = static function (array $input) use ($service): void {
    try { $service->normalize($input); } catch (HttpException $e) { if ($e->getStatusCode() === 422) return; throw $e; }
    throw new RuntimeException('invalid input accepted');
};
$assert($service->normalize($defaults) === $defaults, 'historical defaults preserved');
foreach ([
    ['icp' => 42], ['icp' => str_repeat('号', 101)], ['unexpected' => true], ['members' => null],
    ['stats' => ['bad' => $defaults['stats'][0]]], ['stats' => array_fill(0, 13, $defaults['stats'][0])],
] as $change) $invalid(array_replace($defaults, $change));
foreach ([['name' => ' '], ['visible' => 'false'], ['avatar' => 'javascript:alert(1)'], ['avatar' => 'http://example.test/a.png'], ['avatar' => 'https://user:pass@example.test/a.png'], ['avatar' => '', 'initials' => ''], ['tags' => [42]], ['tags' => array_fill(0, 9, 'tag')]] as $change) {
    $input = $defaults;
    $input['members'][0] = array_replace($input['members'][0], $change);
    $invalid($input);
}
Db::startTrans();
try {
    $request = new Request;
    $request->authenticated_user_id = 0;
    $input = $defaults;
    $input['icp'] = '  粤ICP备12345678号-1  ';
    $input['members'] = array_reverse($input['members']);
    $input['members'][1]['visible'] = false;
    $input['stats'][0]['visible'] = false;
    $saved = $service->save($input, $request);
    $assert($saved['icp'] === '粤ICP备12345678号-1', 'text normalized');
    $assert($service->get() == $saved, 'whole group persisted');
    $public = $service->get(true);
    $assert(count($public['members']) === 1 && $public['members'][0]['name'] === 'Sarah Lin', 'hidden personnel omitted and order retained');
    $assert(count($public['stats']) === 3, 'hidden metric omitted');
    $audit = Db::name('business_audit_event')->where('action', 'site.content.save')->order('id', 'desc')->find();
    $assert($audit !== null && $audit['resource_type'] === 'siteContent', 'save audited');
    $broken = $saved; $broken['members'][0]['name'] = '';
    try { $service->save($broken, $request); throw new RuntimeException('invalid save accepted'); } catch (HttpException $e) { $assert($e->getStatusCode() === 422, '422 expected'); }
    $assert($service->get() == $saved, 'validation leaves previous whole group intact');
    $request->authenticated_user_id = 4294967295;
    $broken = $saved; $broken['icp'] = 'audit must roll back';
    try { $service->save($broken, $request); throw new RuntimeException('invalid audit actor accepted'); } catch (\think\db\exception\PDOException $e) { /* FK failure exercises atomic rollback. */ }
    $assert($service->get() == $saved, 'audit failure rolls back content');
    $response = (new \app\common\controller\SiteContent)->index();
    $assert($response->getData()['data'] === $public, 'public controller exposes filtered content');
    $assert($response->getHeader()['Cache-Control'] === 'no-store', 'public content is not cached');
} finally { Db::rollback(); }
echo "Site content validation, persistence, visibility and rollback passed\n";
