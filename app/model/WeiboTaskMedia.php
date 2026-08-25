<?php
declare(strict_types=1);

namespace app\model;

final class WeiboTaskMedia extends Base
{
    protected $type = ['id' => 'integer', 'task_id' => 'integer', 'media_id' => 'integer', 'sort' => 'integer'];
}
