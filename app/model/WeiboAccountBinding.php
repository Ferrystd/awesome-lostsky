<?php
declare(strict_types=1);

namespace app\model;

final class WeiboAccountBinding extends Base
{
    protected $type = ['id' => 'integer', 'team_id' => 'integer', 'entity_id' => 'integer', 'account_id' => 'integer'];
}
