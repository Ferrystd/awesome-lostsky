<?php
declare(strict_types=1);

namespace app\model;

final class WeiboFeedPollState extends Base
{
    protected $name = 'weibo_feed_poll_state';
    protected $type = [
        'id' => 'integer',
        'last_attempt_at' => 'integer',
        'last_success_at' => 'integer',
    ];
}
