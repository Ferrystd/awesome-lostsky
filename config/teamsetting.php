<?php

use app\enum\MemberSearchPriority;
use app\enum\ChatCustomerGroupMode;
use app\enum\ChatGroupHistory;
use app\enum\TeamMemberDepartureMode;

return [
    'entity' => [
        'label'       => '实体',
        'description' => '控制团队和成员是否可以通过对象标识被搜索。',
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
        'description' => '配置成员离队、复职与非正常状态实体的处理方式。',
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
                'label'       => '封禁或离队后仍可代管实体',
                'description' => '开启后，有代入权限的实体仍可以进入并使用其完整业务能力；成员本人始终无法直接登录。',
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
        'description' => '控制客户会话、群历史、已读回执与消息保留策略。',
        'order'       => 20,
        'settings'    => [
            'customer_direct_start' => [
                'label'       => '客户可发起单聊',
                'description' => '允许客户主动联系团队公开的成员或虚拟实体。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => true,
                'order'       => 10,
            ],
            'customer_group_mode' => [
                'label'       => '客户群聊权限',
                'description' => '决定客户是否可以加入或创建群聊。',
                'type'        => 'enum',
                'control'     => 'radio',
                'enum'        => ChatCustomerGroupMode::class,
                'default'     => ChatCustomerGroupMode::InviteOnly->value,
                'order'       => 20,
            ],
            'group_history' => [
                'label'       => '新成员可见群历史',
                'description' => '决定新参与者看到全部历史，还是仅看到加入后的消息。',
                'type'        => 'enum',
                'control'     => 'radio',
                'enum'        => ChatGroupHistory::class,
                'default'     => ChatGroupHistory::FromJoin->value,
                'order'       => 30,
            ],
            'read_receipts' => [
                'label' => '显示已读回执', 'description' => '向会话参与者展示已读状态。',
                'type' => 'boolean', 'control' => 'switch', 'default' => true, 'order' => 40,
            ],
            'edit_window_minutes' => [
                'label' => '消息编辑窗口', 'description' => '发送后允许本人编辑的分钟数。',
                'type' => 'integer', 'control' => 'number', 'default' => 15, 'min' => 0, 'max' => 1440, 'order' => 50,
            ],
            'revoke_window_minutes' => [
                'label' => '消息撤回窗口', 'description' => '发送后允许本人撤回的分钟数。',
                'type' => 'integer', 'control' => 'number', 'default' => 2, 'min' => 0, 'max' => 1440, 'order' => 60,
            ],
            'retention_days' => [
                'label' => '消息保留天数', 'description' => '0 表示永久保存。',
                'type' => 'integer', 'control' => 'number', 'default' => 0, 'min' => 0, 'max' => 3650, 'order' => 70,
            ],
        ],
    ],
    'shop' => [
        'label'       => '商城',
        'description' => '控制公开商城开放状态，以及商城订单与其他应用之间的自动联动。',
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
                'description' => '下单时自动生成关联流水；仅在团队已开通且未过期的 Transaction Ability 时生效。',
                'type'        => 'boolean',
                'control'     => 'switch',
                'default'     => true,
                'order'       => 10,
            ],
        ],
    ],
    'service' => [
        'label'       => '服务',
        'description' => '配置新服务、权益额度、公开接单与费用调整使用的团队默认值；单个服务或权益包可以覆盖。',
        'order'       => 35,
        'settings'    => [
            'default_unit_name' => [
                'label' => '默认计量单位', 'description' => '新建服务时默认使用的单位，例如次、人或小时。',
                'type' => 'string', 'control' => 'input', 'default' => '次', 'min_length' => 1, 'max_length' => 20, 'order' => 10,
            ],
            'default_quantity_scale' => [
                'label' => '默认数量精度', 'description' => '新建服务默认允许的小数位数，0 表示只允许整数。',
                'type' => 'integer', 'control' => 'number', 'default' => 0, 'min' => 0, 'max' => 4, 'order' => 20,
            ],
            'default_quantity_step' => [
                'label' => '默认最小核销步长', 'description' => '新建服务默认的最小履约单位，应与数量精度匹配。',
                'type' => 'string', 'control' => 'input', 'default' => '1', 'min_length' => 1, 'max_length' => 20, 'order' => 30,
            ],
            'default_valid_days' => [
                'label' => '默认权益有效天数', 'description' => '新建权益项默认的有效期；0 表示永久有效。',
                'type' => 'integer', 'control' => 'number', 'default' => 30, 'min' => 0, 'max' => 3650, 'order' => 40,
            ],
            'allow_customer_open_dispatch' => [
                'label' => '允许 Customer 公开召唤接单人', 'description' => '开启后，Customer 可不指定具体接单人，把已填写完整的履约任务公开给该服务接单池。',
                'type' => 'boolean', 'control' => 'switch', 'default' => true, 'order' => 50,
            ],
            'assignment_offer_timeout_minutes' => [
                'label' => '指定邀请有效分钟数', 'description' => 'Customer 指定接单 Entity 后，等待对方确认的最长时间。',
                'type' => 'integer', 'control' => 'number', 'default' => 30, 'min' => 1, 'max' => 1440, 'order' => 55,
            ],
            'default_handler_rate_percent' => [
                'label' => '默认接单分成比例', 'description' => '新建权益项按比例分成时的默认百分比。',
                'type' => 'integer', 'control' => 'number', 'default' => 80, 'min' => 0, 'max' => 100, 'order' => 60,
            ],
            'default_sender_rate_percent' => [
                'label' => '默认发单分成比例', 'description' => '新建权益项按比例分成时的默认百分比。',
                'type' => 'integer', 'control' => 'number', 'default' => 15, 'min' => 0, 'max' => 100, 'order' => 70,
            ],
            'default_cs_rate_percent' => [
                'label' => '默认客服分成比例', 'description' => '新建权益项按比例分成时的默认百分比；剩余部分归团队。',
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
                'label'       => '实体入口文案',
                'description' => '主页首屏中跳转到公开实体区域的链接文案。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '浏览公开实体',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 20,
            ],
            'homepage_entities_title' => [
                'label'       => '实体区域标题',
                'description' => '主页公开实体预览区域的标题。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '公开实体',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 30,
            ],
            'homepage_entities_description' => [
                'label'       => '实体区域说明',
                'description' => '主页公开实体预览区域的辅助说明。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '团队成员与虚拟实体',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 40,
            ],
            'homepage_entities_empty' => [
                'label'       => '实体空状态文案',
                'description' => '团队没有可公开实体时显示的提示。',
                'type'        => 'string',
                'control'     => 'input',
                'default'     => '团队暂时没有公开实体',
                'min_length'  => 1,
                'max_length'  => 100,
                'order'       => 50,
            ],
        ],
    ],
];
