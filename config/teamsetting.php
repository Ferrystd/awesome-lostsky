<?php

use app\enum\MemberSearchPriority;
use app\enum\ChatCustomerGroupMode;
use app\enum\ChatGroupHistory;

return [
    'entity' => [
        'label'       => '对象搜索',
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
        'description' => '控制商城订单与其他应用之间的自动联动。',
        'order'       => 30,
        'settings'    => [
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
];
