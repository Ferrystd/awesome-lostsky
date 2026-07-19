<?php

use app\enum\MemberSearchPriority;

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
];
