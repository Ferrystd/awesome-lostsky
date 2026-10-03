<?php
declare(strict_types=1);

namespace app\model;

use app\enum\WeiboAccountHealth;

final class WeiboAccount extends Base
{
    protected $enumReadName = false;
    protected $schema = [
        'id' => 'int', 'phone' => 'string', 'uid' => 'string', 'gsid' => 'string',
        'from_value' => 'string', 'screen_name' => 'string', 'oauth_token' => 'string',
        'cookie_json' => 'json', 'user_json' => 'json', 'health' => WeiboAccountHealth::class,
        'checked_at' => 'int', 'create_time' => 'int', 'update_time' => 'int', 'delete_time' => 'int',
    ];
    protected $type = [
        'id' => 'integer', 'health' => WeiboAccountHealth::class,
        'cookie_json' => 'json', 'user_json' => 'json',
        'checked_at' => 'integer', 'create_time' => 'integer',
        'update_time' => 'integer', 'delete_time' => 'integer',
    ];
    protected $json = ['cookie_json', 'user_json'];
    protected $hidden = [
        'delete_time', 'phone', 'gsid', 'from_value', 'oauth_token',
        'cookie_json', 'user_json',
    ];

    public function publicSummary(): array
    {
        return [
            'id' => $this->id,
            'uid' => $this->uid,
            'screen_name' => $this->screen_name,
            'health' => $this->enumCase('health')->name,
            'checked_at' => $this->checked_at ?: null,
        ];
    }
}
