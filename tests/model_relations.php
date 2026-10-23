<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

// A separate manager and process-local database never consult the application .env.
$db = new think\DbManager();
$db->setConfig(['default' => 'relations', 'connections' => [
    'relations' => ['type' => 'sqlite', 'database' => ':memory:', 'prefix' => ''],
]]);
$connection = $db->connect();
$assertSame = static function (mixed $expected, mixed $actual, string $case): void {
    if ($expected !== $actual) throw new RuntimeException($case . ': ' . var_export($actual, true));
};
$groups = [
    'team' => [
        'ChatConversation', 'File', 'TeamAbility',
        'TeamAbilityGrant', 'TeamCustomer', 'TeamCustomerSender',
        'TeamDomain', 'TeamEntityField', 'TeamEntityRole',
        'TeamJoinApplication', 'TeamJoinField', 'TeamMember',
        'TeamNotice', 'TeamOrder', 'TeamProduct',
        'TeamProfile', 'TeamRole', 'TeamRolePermission',
        'TeamService', 'TeamServiceAdjustment', 'TeamServiceAssignmentOffer',
        'TeamServiceEntitlement', 'TeamServiceInstance', 'TeamSetting',
        'TeamTransaction', 'TeamVirtual', 'TeamVirtualIntegration',
    ],
    'subject' => [
        'ChatConversation', 'ChatMessage', 'ChatParticipant',
        'Document', 'EntitySession', 'File',
        'MarkdownReference', 'TeamCustomerSender', 'TeamEntityFieldValue',
        'TeamEntityProfile', 'TeamEntityRole', 'TeamJoinApplication',
        'TeamMemberProfile', 'TeamProduct', 'TeamProductHandler',
        'TeamServiceHandler', 'VisibilityTarget',
    ],
];
$connection->execute('CREATE TABLE team (id INTEGER PRIMARY KEY, delete_time INTEGER)');
$connection->execute('CREATE TABLE entity (id INTEGER PRIMARY KEY, delete_time INTEGER)');
foreach (['team', 'entity'] as $table) {
    $connection->table($table)->insertAll([
        ['id' => 101, 'delete_time' => null], ['id' => 102, 'delete_time' => 1],
    ]);
}
$tables = [];
$count = 0;
foreach ($groups as $method => $models) {
    $target = $method === 'team' ? app\model\Team::class : app\model\Entity::class;
    $foreignKey = $method === 'team' ? 'team_id' : 'entity_id';
    foreach ($models as $name) {
        $class = 'app\\model\\' . $name;
        $table = think\helper\Str::snake($name);
        if (!isset($tables[$table])) {
            $connection->execute('CREATE TABLE ' . $table . ' (id INTEGER PRIMARY KEY, team_id INTEGER, entity_id INTEGER, delete_time INTEGER)');
            $connection->table($table)->insertAll([
                ['id' => 1, 'team_id' => 101, 'entity_id' => 101, 'delete_time' => null],
                ['id' => 2, 'team_id' => 102, 'entity_id' => 102, 'delete_time' => null],
                ['id' => 3, 'team_id' => 999, 'entity_id' => 999, 'delete_time' => null],
                ['id' => 4, 'team_id' => 101, 'entity_id' => 101, 'delete_time' => 1],
            ]);
            $tables[$table] = true;
        }
        $model = new $class();
        $signature = new ReflectionMethod($class, $method);
        $assertSame(true, $signature->isPublic(), "$name.$method visibility");
        $assertSame(0, $signature->getNumberOfParameters(), "$name.$method parameters");
        $assertSame(null, $signature->getReturnType(), "$name.$method return declaration");
        $relation = $model->$method();
        $assertSame(think\model\relation\BelongsTo::class, get_class($relation), "$name.$method type");
        $assertSame($target, get_class($relation->getModel()), "$name.$method target");
        $assertSame($foreignKey, $relation->getForeignKey(), "$name.$method foreign key");
        $assertSame('id', $relation->getLocalKey(), "$name.$method local key");
        $assertSame($method, (new ReflectionProperty($relation, 'relation'))->getValue($relation), "$name.$method inferred name");
        $targetTable = $method === 'team' ? 'team' : 'entity';
        $sql = $relation->getQuery()->where('id', 101)->fetchSql()->find();
        $assertSame(true, str_contains($sql, $targetTable) && str_contains(strtolower($sql), 'delete_time') && str_contains(strtolower($sql), 'null'), "$name.$method scoped SQL");
        $rows = $class::with([$method])->order('id')->select();
        $assertSame(3, count($rows), "$name parent soft deletion");
        $assertSame(101, $rows[0]->$method->id, "$name.$method eager relation");
        $assertSame(null, $rows[1]->$method, "$name.$method deleted target");
        $assertSame(null, $rows[2]->$method, "$name.$method missing target");
        $count++;
    }
}
// Only the audited models expose these relationship entry points.
foreach (glob(dirname(__DIR__) . '/app/model/*.php') as $file) {
    $name = basename($file, '.php');
    foreach ($groups as $method => $models) {
        $assertSame(in_array($name, $models, true), method_exists('app\\model\\' . $name, $method), "$name.$method method presence");
    }
}
echo "model_relations: $count relationship metadata, SQL and eager-loading cases passed", PHP_EOL;
