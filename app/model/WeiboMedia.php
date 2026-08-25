<?php
declare(strict_types=1);

namespace app\model;

final class WeiboMedia extends Base
{
    protected $type = ['id' => 'integer', 'team_id' => 'integer', 'owner_entity_id' => 'integer', 'variants' => 'json', 'byte_count' => 'integer'];
    protected $json = ['variants'];
}
