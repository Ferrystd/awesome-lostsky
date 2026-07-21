<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class ChatIntegration extends Validate
{
    protected $rule = [
        'name' => 'require|length:1,50',
        'endpoint_url' => 'require|url|max:1000',
        'events' => 'array',
        'is_active' => 'in:0,1',
    ];

    protected $message = [
        'name.require' => '集成名称不能为空', 'name.length' => '集成名称不能超过50位',
        'endpoint_url.require' => 'Webhook地址不能为空', 'endpoint_url.url' => 'Webhook地址格式不正确',
        'endpoint_url.max' => 'Webhook地址过长', 'events.array' => '事件列表格式不正确',
        'is_active.in' => '启用状态不正确',
    ];

    protected $scene = ['create' => ['name', 'endpoint_url', 'events']];

    public function sceneUpdate(): self
    {
        return $this->only(['name', 'endpoint_url', 'events', 'is_active'])
            ->remove('name', 'require')
            ->remove('endpoint_url', 'require');
    }
}
