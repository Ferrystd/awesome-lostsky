<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMember 模型
 * @mixin \think\Model
 */
class TeamMember extends Base
{
    protected $type = [
        'id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'team_id' => 'integer',
        'user_id' => 'integer',
        'is_displayed' => 'integer',
        'is_blocked' => 'integer',
    ];

    protected $json = [];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamMemberProfile::class, 'member_id')
            ->bind(['nickname', 'avatar']);
    }

    public function posts()
    {
        return $this->hasMany(TeamMemberPost::class, 'member_id');
    }

    public function handledTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'handler_id');
    }

    public function sentTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'sender_id');
    }

    public function csTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'cs_id');
    }

    public function bindings()
    {
        return $this->hasMany(TeamCustomerSender::class, 'member_id');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function files()
    {
        return $this->hasMany(File::class, 'member_id');
    }

    // 占位：CS 角色尚未实现，始终返回空
    public function scopeCs($query)
    {
        return $query->whereRaw('1=0');
    }
}
