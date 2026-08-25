<?php
declare(strict_types=1);

namespace app\model;

final class WeiboTaskAccount extends Base
{
    protected $type = ['id' => 'integer', 'task_id' => 'integer', 'account_id' => 'integer'];
}
