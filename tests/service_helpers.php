<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\service\Pagination;
use app\service\Validation;
use think\exception\HttpException;
use think\paginator\driver\Bootstrap;
use think\Validate;

(new think\App(dirname(__DIR__)))->initialize();
$assert = static function (mixed $expected, mixed $actual): void {
    if ($expected !== $actual) throw new RuntimeException(var_export([$expected, $actual], true));
};
$pagination = new Pagination;
$rows = [['id' => 8], ['id' => 3]];
$paginator = new Bootstrap($rows, 2, 2, 9);
$assert(['total' => 9, 'list' => $rows, 'page' => 2, 'limit' => 2], $pagination->response($paginator));
$assert(['total' => 9, 'list' => [], 'page' => 2, 'limit' => 2], $pagination->response($paginator, []));
$assert(['total' => 9, 'list' => [['name' => 'converted']], 'page' => 2, 'limit' => 2],
    $pagination->response($paginator, [['name' => 'converted']]));
$assert(['total' => 0, 'list' => [], 'page' => 1, 'limit' => 20],
    $pagination->response(new Bootstrap([], 20, 1, 0)));
$assert(['total' => 9, 'list' => [], 'page' => 5, 'limit' => 2],
    $pagination->response(new Bootstrap([], 2, 8, 9)));
$assert([1, 100], $pagination->normalize(0, 101));

$validation = new Validation;
$validator = static fn (): Validate => (new Validate)
    ->rule(['name' => 'require', 'age' => 'integer'])
    ->message(['name.require' => '名称不能为空', 'age.integer' => '年龄必须为整数']);
$validation->check($validator(), ['name' => '测试', 'age' => 18]);
$validation->check($validator()->only(['age']), ['age' => 18]);
foreach ([['age' => 18], ['name' => '测试', 'age' => 'invalid']] as $index => $data) {
    try {
        $validation->check($validator(), $data);
        throw new RuntimeException('Expected HTTP 422');
    } catch (HttpException $error) {
        $assert(422, $error->getStatusCode());
        $assert(['名称不能为空', '年龄必须为整数'][$index], $error->getMessage());
    }
}
$roleValidator = new app\validate\Role;
$validation->check($roleValidator->scene('update'), ['id' => 1]);
echo "service_helpers: passed (pagination metadata, empty overrides, ordering, validation errors and scenes)\n";
