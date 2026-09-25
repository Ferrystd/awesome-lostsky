<?php
declare(strict_types=1);

namespace app\model;

use app\enum\WeiboFeedClassificationStatus;

final class WeiboFeedPost extends Base
{
    protected $enumReadName = false;
    protected $type = [
        'id' => 'integer',
        'posted_at' => 'integer',
        'classification_status' => WeiboFeedClassificationStatus::class,
        'classification_attempts' => 'integer',
        'intent_score' => 'float',
    ];
}
