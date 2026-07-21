<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class ChatConversation extends Validate
{
    protected $rule = [
        'kind' => 'require|in:direct,group',
        'title' => 'max:100',
        'actor_slug' => 'require|regex:^[a-z][a-z0-9_-]{1,49}$',
        'participants' => 'require|array',
        'is_temporary' => 'in:0,1',
        'expires_at' => 'integer',
    ];

    protected $message = [
        'kind.require' => '会话类型不能为空', 'kind.in' => '会话类型不正确',
        'title.max' => '群聊标题不能超过100位', 'actor_slug.require' => '发送身份不能为空',
        'actor_slug.regex' => '发送身份标识格式不正确', 'participants.require' => '参与者不能为空',
        'participants.array' => '参与者格式不正确', 'is_temporary.in' => '临时会话状态不正确',
        'expires_at.integer' => '到期时间格式不正确',
    ];

    protected $scene = ['create' => ['kind', 'title', 'actor_slug', 'participants', 'is_temporary', 'expires_at']];
}
