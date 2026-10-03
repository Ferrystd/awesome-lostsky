<?php

use app\enum\MemberSearchPriority;
use app\enum\TeamMemberDepartureMode;

return [
    'entity' => [
        'label'       => '人员',
        'description' => '决定团队和成员能否通过 @标识 被搜索到。',
        'order'       => 10,
        'settings'    => [
            'team_searchable' => [
                'label'       => '团队自身可搜索',
                'description' => '允许已登录用户通过 @slug 找到当前团队。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => false,
                'order'       => 10,
            ],
            'member_searchable' => [
                'label'       => '成员默认可搜索',
                'description' => '成员未设置个人覆盖值时采用此默认值。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => false,
                'order'       => 20,
            ],
            'member_search_priority' => [
                'label'       => '搜索优先级',
                'description' => '决定团队默认值与成员显式设置冲突时采用哪一个。',
                'type'        => 'enum',
                'control'     => 'radio',
                'enum'        => MemberSearchPriority::class,
                'default'     => MemberSearchPriority::Team->value,
                'order'       => 30,
            ],
        ],
    ],
    'member' => [
        'label'       => '成员',
        'description' => '管理成员离队与入职相关设置。',
        'order'       => 15,
        'settings'    => [
            'departure_mode' => [
                'label'       => '成员自助离队',
                'description' => '决定成员能否自行发起离队，以及是否需要审核。',
                'type'        => 'enum',
                'control'     => 'radio',
                'enum'        => TeamMemberDepartureMode::class,
                'default'     => TeamMemberDepartureMode::Review->value,
                'order'       => 10,
            ],
            'inactive_entity_available' => [
                'label'       => '成员失效后允许被管理员登录',
                'description' => '开启后，有权限的人员仍可登录该成员并使用其全部业务功能；成员本人始终无法登录。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => false,
                'order'       => 20,
            ],
            'reinstate_refill_join_fields' => [
                'label'       => '复职时重新填写申请资料',
                'description' => '开启后，已离队成员申请复职时需重新填写当前的加入字段。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => false,
                'order'       => 30,
            ],
        ],
    ],
    'chat' => [
        'label'       => '聊天',
        'description' => '控制团队群聊的消息保留策略。',
        'order'       => 20,
        'settings'    => [
            'retention_days' => [
                'label' => '群聊消息保留天数', 'description' => '只清理本团队所属群聊；0 表示永久保存。跨团队单聊始终保留。',
                'type' => 'integer', 'control' => 'number', 'default' => 0, 'min' => 0, 'max' => 3650, 'order' => 10,
            ],
        ],
    ],
    'shop' => [
        'label'       => '商城',
        'description' => '控制公开商城是否开放，以及订单与记账应用之间的自动联动。',
        'order'       => 30,
        'settings'    => [
            'enabled' => [
                'label'       => '开放商城',
                'description' => '开启后，客户可以浏览和购买已上架商品；关闭不影响后台与历史业务数据。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => false,
                'ability'     => ['key' => 'shop', 'level' => 1],
                'order'       => 5,
            ],
            'sync_transaction' => [
                'label'       => '自动同步记账流水',
                'description' => '下单后于记账应用自动生成对应流水；需要团队记账能力有效。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => true,
                'order'       => 10,
            ],
            'sync_manual_entitlement_transaction' => [
                'label'       => '手动赋予权益时同步流水',
                'description' => '在记账工作台直接赋予客户权益时，按商品快照生成服务包收款；关闭时只赋予权益。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => false,
                'order'       => 20,
            ],
        ],
    ],
    'service' => [
        'label'       => '服务',
        'description' => '设置核销、分成等默认数据。',
        'order'       => 35,
        'settings'    => [
            'default_unit_name' => [
                'label' => '默认计量单位', 'description' => '新建服务时默认使用的单位，例如次、人或小时。',
                'type' => 'string', 'control' => 'input', 'default' => '次', 'min_length' => 1, 'max_length' => 20, 'order' => 10,
            ],
            'default_quantity_step' => [
                'label' => '默认最小核销单位', 'description' => '新建服务默认的最小履约单位，最多四位小数；数量精度由核销单位自动确定。',
                'type' => 'string', 'control' => 'input', 'default' => '1', 'min_length' => 1, 'max_length' => 20, 'order' => 30,
            ],
            'default_valid_days' => [
                'label' => '默认权益有效天数', 'description' => '新建权益项默认的有效期；0 表示永久有效。',
                'type' => 'integer', 'control' => 'number', 'default' => 30, 'min' => 0, 'max' => 3650, 'order' => 40,
            ],
            'default_auto_complete_after_minutes' => [
                'label' => '默认自动结单时长（分钟）', 'description' => '新建核销商品、规格或服务时默认填入；从开始核销起连续计时，留空则不自动结单。',
                'type' => 'integer', 'control' => 'number', 'default' => null, 'nullable' => true,
                'min' => 1, 'max' => 5256000, 'step' => 1, 'order' => 45,
            ],
            'allow_customer_open_dispatch' => [
                'label' => '允许顾客公开征集接单人', 'description' => '开启后，顾客无需指定接单人；核销权益时会进入公开接单池。',
                'type' => 'boolean', 'control' => 'switch', 'default' => true, 'order' => 50,
            ],
            'default_handler_rate_percent' => [
                'label' => '默认接单分配比例', 'description' => '服务或权益项价格、成本变化时，用于重算接单固定金额。',
                'type' => 'integer', 'control' => 'number', 'default' => 80, 'min' => 0, 'max' => 100, 'order' => 60,
            ],
            'default_sender_rate_percent' => [
                'label' => '默认发单分配比例', 'description' => '服务或权益项价格、成本变化时，用于重算发单固定金额。',
                'type' => 'integer', 'control' => 'number', 'default' => 15, 'min' => 0, 'max' => 100, 'order' => 70,
            ],
            'default_cs_rate_percent' => [
                'label' => '默认客服分配比例', 'description' => '服务或权益项价格、成本变化时，用于重算客服固定金额；剩余部分归团队。',
                'type' => 'integer', 'control' => 'number', 'default' => 0, 'min' => 0, 'max' => 100, 'order' => 80,
            ],
            'default_adjustment_handler_rate_percent' => [
                'label' => '加价默认接单分成', 'description' => '费用调整未手工填写分配时，默认分给接单人的百分比。',
                'type' => 'integer', 'control' => 'number', 'default' => 80, 'min' => 0, 'max' => 100, 'order' => 90,
            ],
            'default_adjustment_sender_rate_percent' => [
                'label' => '加价默认发单分成', 'description' => '费用调整未手工填写分配时，默认分给发单人的百分比。',
                'type' => 'integer', 'control' => 'number', 'default' => 15, 'min' => 0, 'max' => 100, 'order' => 100,
            ],
            'default_adjustment_cs_rate_percent' => [
                'label' => '加价默认客服分成', 'description' => '费用调整未手工填写分配时，默认分给客服的百分比；剩余部分归团队。',
                'type' => 'integer', 'control' => 'number', 'default' => 0, 'min' => 0, 'max' => 100, 'order' => 110,
            ],
        ],
    ],
    'display' => [
        'label'       => '展示',
        'description' => '配置团队公开主页的固定展示文案。',
        'order'       => 40,
        'settings'    => [
            'homepage_welcome' => [
                'label'       => '主页欢迎语',
                'description' => '团队公开简介为空时显示在主页首屏。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '欢迎来到我们的公开主页',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 10,
            ],
            'homepage_entities_link' => [
                'label'       => '人员入口文案',
                'description' => '主页首屏中跳转到公开人员区域的链接文案。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '浏览公开人员',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 20,
            ],
            'homepage_entities_title' => [
                'label'       => '人员区域标题',
                'description' => '主页公开人员预览区域的标题。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '公开人员',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 30,
            ],
            'homepage_entities_description' => [
                'label'       => '人员区域说明',
                'description' => '主页公开人员预览区域的辅助说明。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '团队成员与虚拟人员',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 40,
            ],
            'homepage_entities_empty' => [
                'label'       => '人员空状态文案',
                'description' => '团队没有可公开人员时显示的提示。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '团队暂时没有公开人员',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 50,
            ],
        ],
    ],
];
