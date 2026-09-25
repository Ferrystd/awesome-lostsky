<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/vendor/autoload.php';

use app\enum\ManageScope;
use app\enum\TeamEntityType;
use app\enum\Visibility;
use app\model\Document;
use app\model\Entity;
use app\model\Team;
use app\model\TeamEntityField;
use app\model\TeamEntityFieldValue;
use app\model\TeamEntityRole;
use app\model\TeamProduct;
use app\model\TeamProductHandler;
use app\model\TeamRole;
use app\service\Entity as EntityService;
use think\App;
use think\facade\Db;

(new App(dirname(__DIR__, 2)))->initialize();

$options = getopt('', ['team::', 'entity::']);
$teamSlug = strtolower(trim((string) ($options['team'] ?? 'demo')));
$entitySlug = strtolower(trim((string) ($options['entity'] ?? 'member-2')));
$portrait = '//assets.lostsky.work/images/hero-bg.png';

$team = Team::active()->where('slug', $teamSlug)->find();
$entity = Entity::where('slug', $entitySlug)->find();
if (!$team || !$entity) {
    fwrite(STDERR, "找不到有效团队 {$teamSlug} 或人员 {$entitySlug}\n");
    exit(1);
}
if (!in_array((string) $entity->entityable_type, ['teamMember', 'teamVirtual'], true)) {
    fwrite(STDERR, "测试人员必须是成员或虚拟人员\n");
    exit(1);
}

try {
    app(EntityService::class)->assertInTeam((int) $entity->id, (int) $team->id);
} catch (Throwable) {
    fwrite(STDERR, "人员 {$entitySlug} 不属于团队 {$teamSlug}\n");
    exit(1);
}

$upsert = static function (string $modelClass, array $where, array $values) {
    $now = time();
    $query = $modelClass::withTrashed();
    foreach ($where as $field => $value) {
        $query->where($field, $value);
    }
    $record = $query->find();
    $created = !$record;
    if (!$record) {
        $record = new $modelClass;
        $values = array_merge($where, $values);
    } elseif ($record->trashed()) {
        $record->restore();
    }
    $record->save($values);
    $timestamps = ['update_time' => $now];
    if ($created) {
        $timestamps['create_time'] = $now;
    }
    Db::table($record->getTable())->where('id', (int) $record->id)->update($timestamps);
    return $record;
};

$result = Db::transaction(function () use (
    $team,
    $entity,
    $teamSlug,
    $entitySlug,
    $portrait,
    $upsert
): array {
    $profile = $entity->profile ?: new \app\model\TeamEntityProfile;
    $profile->save([
        'entity_id' => (int) $entity->id,
        'name' => 'member-2',
        'description' => '负责团队公开体验、内容维护与访客引导。',
        'intro_image' => $portrait,
        'introduction_markdown' => <<<MARKDOWN
## 你好，我是 member-2

这是用于验证 Display 公开字段、公开角色、Markdown 引用和公开文档的示例资料。

我会和 [@{$teamSlug}](lostsky://entity/{$teamSlug}) 一起维护团队公开内容。
MARKDOWN,
    ]);
    app(EntityService::class)->setDisplay((int) $team->id, (int) $entity->id, 1);

    $roles = [
        [
            'role_key' => 'display_host',
            'name' => '青空体验官',
            'description' => '负责访客体验与公开内容呈现。',
            'sort' => 10,
            'is_displayed' => 1,
        ],
        [
            'role_key' => 'display_guide',
            'name' => '团队向导',
            'description' => '帮助访客了解团队能力与协作方式。',
            'sort' => 20,
            'is_displayed' => 1,
        ],
        [
            'role_key' => 'display_internal',
            'name' => '内部运营',
            'description' => '仅供后台验证，不应出现在公开页面。',
            'sort' => 1,
            'is_displayed' => 0,
        ],
    ];
    $roleIds = [];
    foreach ($roles as $roleData) {
        $roleKey = $roleData['role_key'];
        unset($roleData['role_key']);
        $role = $upsert(TeamRole::class, [
            'team_id' => (int) $team->id,
            'role_key' => $roleKey,
        ], $roleData);
        $upsert(TeamEntityRole::class, [
            'team_id' => (int) $team->id,
            'entity_id' => (int) $entity->id,
            'role_id' => (int) $role->id,
        ], []);
        $roleIds[] = (int) $role->id;
    }

    $fieldDefinitions = [
        'display_specialty' => [
            'name' => '擅长领域',
            'value_type' => 'string',
            'input_type' => 'text',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 10,
            'value' => ['value_string' => '陪伴型游戏、团队协作与内容整理'],
        ],
        'display_available' => [
            'name' => '当前可预约',
            'value_type' => 'bool',
            'input_type' => 'checkbox',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 20,
            'value' => ['value_int' => 1],
        ],
        'display_platforms' => [
            'name' => '常用平台',
            'value_type' => 'multi_select',
            'input_type' => 'checkbox',
            'options' => ['PC', '主机', '移动端'],
            'visibility' => Visibility::Public,
            'sort' => 30,
            'value' => ['value_json' => ['PC', '主机']],
        ],
        'display_bio' => [
            'name' => '补充介绍',
            'value_type' => 'text',
            'input_type' => 'textarea',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 40,
            'value' => ['value_text' => "喜欢把复杂流程整理成清晰步骤。\n也会持续记录访客反馈。"],
        ],
        'display_projects' => [
            'name' => '完成项目',
            'value_type' => 'int',
            'input_type' => 'text',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 50,
            'value' => ['value_int' => 28],
        ],
        'display_rating' => [
            'name' => '体验评分',
            'value_type' => 'decimal',
            'input_type' => 'text',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 60,
            'value' => ['value_decimal' => '4.95'],
        ],
        'display_joined_on' => [
            'name' => '加入日期',
            'value_type' => 'date',
            'input_type' => 'date',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 70,
            'value' => ['value_datetime' => strtotime('2025-02-14 00:00:00')],
        ],
        'display_next_event' => [
            'name' => '下次公开活动',
            'value_type' => 'datetime',
            'input_type' => 'datetime',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 80,
            'value' => ['value_datetime' => strtotime('2026-08-08 19:30:00')],
        ],
        'display_status' => [
            'name' => '当前状态',
            'value_type' => 'select',
            'input_type' => 'select',
            'options' => ['接受预约', '准备中', '暂时离线'],
            'visibility' => Visibility::Public,
            'sort' => 90,
            'value' => ['value_string' => '接受预约'],
        ],
        'display_preferences' => [
            'name' => '展示偏好',
            'value_type' => 'json',
            'input_type' => 'textarea',
            'options' => null,
            'visibility' => Visibility::Public,
            'sort' => 100,
            'value' => ['value_json' => [
                '语言' => ['中文', 'English'],
                '时段' => '工作日晚上',
                '形式' => '语音或文字',
            ]],
        ],
        'display_internal_note' => [
            'name' => '内部备注',
            'value_type' => 'text',
            'input_type' => 'textarea',
            'options' => null,
            'visibility' => Visibility::Team,
            'sort' => 110,
            'value' => ['value_text' => '此内容用于验证非公开字段不会泄漏。'],
        ],
    ];
    $fieldIds = [];
    foreach ($fieldDefinitions as $fieldKey => $definition) {
        $value = $definition['value'];
        unset($definition['value']);
        $field = $upsert(TeamEntityField::class, [
            'team_id' => (int) $team->id,
            'entity_type' => TeamEntityType::Entity->value,
            'field_key' => $fieldKey,
        ], array_merge($definition, [
            'entity_type' => TeamEntityType::Entity,
            'source' => 'custom',
            'default_value' => null,
            'manager_scope' => ManageScope::Team,
            'is_required' => 0,
            'is_searchable' => 0,
            'is_system' => 0,
        ]));
        $upsert(TeamEntityFieldValue::class, [
            'field_id' => (int) $field->id,
            'entity_id' => (int) $entity->id,
        ], array_merge([
            'team_id' => (int) $team->id,
            'value_string' => null,
            'value_text' => null,
            'value_int' => null,
            'value_decimal' => null,
            'value_datetime' => null,
            'value_json' => null,
        ], $value));
        $fieldIds[] = (int) $field->id;
    }

    $products = [
        [
            'name' => '夜航陪伴',
            'description' => '由 member-2 提供的晚间语音陪伴与协作体验。',
            'cover_image' => $portrait,
            'price' => '39.00',
            'cost' => '10.00',
            'handler_cut' => '20.00',
            'is_active' => 1,
        ],
        [
            'name' => '内部下架商品',
            'description' => '用于验证下架商品不会出现在公开人员资料。',
            'cover_image' => null,
            'price' => '99.00',
            'cost' => '1.00',
            'handler_cut' => null,
            'is_active' => 0,
        ],
    ];
    $productIds = [];
    foreach ($products as $productData) {
        $name = $productData['name'];
        unset($productData['name']);
        $product = $upsert(TeamProduct::class, [
            'team_id' => (int) $team->id,
            'entity_id' => (int) $entity->id,
            'name' => $name,
        ], array_merge($productData, [
            'introduction_markdown' => "## {$name}\n\n这是用于验证人员专属商品公开陈列的演示内容。",
            'sender_cut' => null,
            'cs_cut' => null,
            'team_cut' => null,
        ]));
        $upsert(TeamProductHandler::class, [
            'product_id' => (int) $product->id,
            'entity_id' => (int) $entity->id,
        ], []);
        $productIds[] = (int) $product->id;
    }

    $teamEntity = Entity::where('entityable_type', 'team')
        ->where('entityable_id', (int) $team->id)
        ->findOrFail();
    $documents = [
        [
            'entity_id' => (int) $teamEntity->id,
            'title' => 'Display 团队公开说明',
            'content' => "# 团队公开说明\n\n这里汇总团队公开主页的测试内容，并链接到 [@{$entitySlug}](lostsky://entity/{$entitySlug})。",
            'visibility' => Visibility::Public,
            'sort' => 10,
        ],
        [
            'entity_id' => (int) $entity->id,
            'title' => 'member-2 公开服务指南',
            'content' => <<<'MARKDOWN'
# 服务指南

这份指南用于帮助访客快速了解一次公开体验如何进行。开始前，我们会先确认时间、目标与沟通方式。

> 清晰的预期比复杂的流程更重要。任何阶段都可以暂停并重新确认。

## 体验流程

| 阶段 | 主要内容 | 交付 |
| --- | --- | --- |
| 开始前 | 确认时间与体验目标 | 清晰的体验范围 |
| 进行中 | 保持沟通并记录反馈 | 可追踪的过程记录 |
| 结束后 | 整理结论与后续建议 | 一份复用建议 |

## 准备清单

- [x] 确认预约时间
- [x] 选择语音或文字沟通
- [ ] 补充希望重点体验的内容

如需引用团队公开资料，可以直接查看 `@member-2` 的人员主页。
MARKDOWN,
            'visibility' => Visibility::Public,
            'sort' => 10,
        ],
        [
            'entity_id' => (int) $entity->id,
            'title' => 'member-2 公开自我介绍',
            'content' => "# 自我介绍\n\n喜欢把复杂流程整理成访客能够快速理解的内容。",
            'visibility' => Visibility::Public,
            'sort' => 20,
        ],
        [
            'entity_id' => (int) $entity->id,
            'title' => 'member-2 内部协作备注',
            'content' => "此文档用于验证非 Public 文档不会出现在 Display。",
            'visibility' => Visibility::Team,
            'sort' => 1,
        ],
    ];
    $documentIds = [];
    foreach ($documents as $documentData) {
        $title = $documentData['title'];
        $subjectId = $documentData['entity_id'];
        unset($documentData['title'], $documentData['entity_id']);
        $document = $upsert(Document::class, [
            'entity_id' => $subjectId,
            'title' => $title,
        ], array_merge($documentData, [
            'manager_scope' => ManageScope::Team,
        ]));
        $documentIds[] = (int) $document->id;
    }

    return [
        'team' => $teamSlug,
        'entity' => $entitySlug,
        'display_url' => "http://{$teamSlug}.display.lostsky.work:5178/entity/{$entitySlug}",
        'intro_image' => $portrait,
        'role_ids' => $roleIds,
        'field_ids' => $fieldIds,
        'product_ids' => $productIds,
        'document_ids' => $documentIds,
    ];
});

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), "\n";
