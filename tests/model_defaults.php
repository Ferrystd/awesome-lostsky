<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\model\Base;

$assertSame = static function (mixed $expected, mixed $actual, string $case): void {
    if ($expected !== $actual) {
        throw new RuntimeException($case . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
};

// Capture every model's declared/inherited options at 5a50c07f, including special
// schemas, hidden fields, JSON, timestamps and enum settings. Type key order is
// irrelevant to field conversion; preserve order for all other option arrays.
$config = [];
foreach (glob(dirname(__DIR__) . '/app/model/*.php') as $file) {
    $class = 'app\\model\\' . basename($file, '.php');
    $props = (new ReflectionClass($class))->getDefaultProperties();
    if (isset($props['type'])) {
        ksort($props['type']);
    }
    ksort($props);
    $config[$class] = $props;
}
$assertSame('a50afc65fde40ca371fb0162450f0c364b6379516df88d7dba43ae2740dc3208', hash('sha256', serialize($config)), 'all baseline model options');

class ModelDefaultsFixture extends Base
{
    protected $pk = 'id';
    protected $type = ['status' => TeamMemberStatus::class, 'amount' => 'string'] + self::COMMON_TYPES;

    // Use the exact declared type map, without database schema discovery.
    protected function getFields(?string $field = null)
    {
        return $field === null ? $this->getOption('type') : ($this->getOption('type')[$field] ?? null);
    }

    public function timestampData(bool $update): array
    {
        $data = [];
        $this->autoDateTime($data, $update, []);
        return $data;
    }
}

class ModelDefaultsOverrideFixture extends ModelDefaultsFixture
{
    protected $type = ['id' => 'string', 'status' => TeamMemberStatus::class] + self::COMMON_TYPES;
    protected $hidden = ['status', 'delete_time'];
    protected $autoWriteTimestamp = false;
}

$model = new ModelDefaultsFixture([
    'id' => '42', 'create_time' => '1700000000', 'update_time' => '1700000001',
    'delete_time' => null, 'status' => 1, 'amount' => '12.30',
]);
$assertSame(42, $model->id, 'integer ID on hydration');
$assertSame(1700000000, $model->create_time, 'integer timestamp on hydration');
$assertSame(null, $model->delete_time, 'nullable soft deletion');
$assertSame('正常', $model->status, 'enum display value');
$assertSame(TeamMemberStatus::Active, $model->enumCase('status'), 'enum case');
$assertSame('12.30', $model->amount, 'decimal string');
$assertSame(false, array_key_exists('delete_time', $model->toArray()), 'inherited hidden field');
$model->id = '43';
$assertSame(43, $model->id, 'ID conversion on assignment');
$model->status = TeamMemberStatus::Blocked;
$assertSame(TeamMemberStatus::Blocked, $model->enumCase('status'), 'enum assignment');
$write = new ReflectionMethod($model, 'writeTransform');
$assertSame(2, $write->invoke($model, TeamMemberStatus::Blocked, TeamMemberStatus::class), 'enum serialization for writes');
$assertSame(43, $write->invoke($model, '43', 'integer'), 'integer serialization for writes');
$times = $model->timestampData(false);
$assertSame(['create_time', 'update_time'], array_keys($times), 'insert timestamp fields');
$assertSame(true, is_int($times['create_time']) && is_int($times['update_time']), 'integer automatic timestamps');
$assertSame(['update_time'], array_keys($model->timestampData(true)), 'update timestamp fields');
$override = new ModelDefaultsOverrideFixture(['id' => '0042', 'status' => 1]);
$assertSame('0042', $override->id, 'subclass type overrides common default');
$assertSame(['status', 'delete_time'], $override->getOption('hidden'), 'subclass hidden override');
$assertSame([], $override->timestampData(false), 'subclass timestamp override');
echo 'model_defaults: all model option snapshots and conversion checks passed', PHP_EOL;
