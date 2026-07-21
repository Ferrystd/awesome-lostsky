<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class ChatMessage extends Validate
{
    protected $rule = [
        'conversation' => 'require|regex:/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
        'actor_slug' => 'require|regex:^[a-z][a-z0-9_-]{1,49}$',
        'content' => 'require|length:1,10000',
        'reply_id' => 'integer',
        'message_id' => 'require|integer',
    ];

    protected $message = [
        'conversation.require' => '会话标识不能为空', 'conversation.regex' => '会话标识格式不正确',
        'actor_slug.require' => '发送身份不能为空', 'actor_slug.regex' => '发送身份格式不正确',
        'content.require' => '消息内容不能为空', 'content.length' => '消息内容长度需在1-10000位',
        'reply_id.integer' => '回复消息格式不正确', 'message_id.require' => '消息ID不能为空',
        'message_id.integer' => '消息ID格式不正确',
    ];

    protected $scene = [
        'send' => ['conversation', 'actor_slug', 'content', 'reply_id'],
        'edit' => ['message_id', 'content'],
        'revoke' => ['message_id'],
    ];
}
