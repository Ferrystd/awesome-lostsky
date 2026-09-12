<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\ProductKind;

/**
 * TeamProduct 模型 — 商品/服务
 * @mixin \think\Model
 */
class TeamProduct extends Base
{
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        // entity_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        'name'        => 'string',
        'description' => 'string',
        'cover_image' => 'string',
        'introduction_markdown' => 'string',
        'price'       => 'string',
        'cost'        => 'string',
        'handler_cut' => 'string',
        'sender_cut'  => 'string',
        'cs_cut'      => 'string',
        'team_cut'    => 'string',
        'kind'        => ProductKind::class,
        'is_active'   => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    public function handlers()
    {
        return $this->hasMany(TeamProductHandler::class, 'product_id');
    }

    public function benefitPackage()
    {
        return $this->belongsTo(BenefitPackage::class, 'benefit_package_id');
    }

    public function redemptionCampaign()
    {
        return $this->belongsTo(RedemptionCampaign::class, 'redemption_campaign_id');
    }

    public function compositionReferences()
    {
        return $this->hasMany(BenefitPackageService::class, 'product_id');
    }

    public function markdownReferences()
    {
        return $this->morphMany(MarkdownReference::class, 'referenceable', 'teamProduct');
    }

    public function normalizeMoneyFields(array $data): array
    {
        $fields = ['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'];
        $result = [];

        foreach ($fields as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            if ($data[$field] === null && $field !== 'price' && $field !== 'cost') {
                $result[$field] = null;
                continue;
            }

            $value = (string) $data[$field];
            if (!preg_match('/^\d{1,10}(?:\.\d{1,2})?$/D', $value)) {
                throw new \InvalidArgumentException('商品金额格式无效');
            }
            $row = $this->db()->getConnection()->query(
                'SELECT CAST(:amount AS DECIMAL(12,2)) AS amount',
                ['amount' => $value]
            )[0];
            $result[$field] = $row['amount'];
        }

        return $result;
    }
}
