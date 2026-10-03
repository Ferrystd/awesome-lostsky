<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatActorType;
use app\model\Entity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\TeamVirtual;
use think\exception\HttpException;

class ChatActor
{
    public function current(array $acting): array
    {
        $summary = $this->summaryEntity((int) ($acting['entity_id'] ?? 0));
        if (!($summary['is_valid'] ?? false)) throw new HttpException(401, '当前人员身份会话已失效');
        return $summary;
    }

    public function search(string $keyword, string $slug, int $userId): array
    {
        if (trim($slug) !== '') {
            try { return [$this->summaryEntity((int) $this->resolveGlobal($slug, false)['entity_id'])]; }
            catch (HttpException) { return []; }
        }
        $needle = trim($keyword);
        if ($needle === '') return [];
        $results = app(\app\service\Entity::class)->search($needle, 20, $userId);
        return array_values(array_filter(array_map(function (array $item): ?array {
            $identity = Entity::where('slug', (string) ($item['slug'] ?? ''))->find();
            return $identity ? $this->summaryEntity((int) $identity->id) : null;
        }, $results)));
    }

    public function resolveGlobal(string $slug, bool $requireSearchable = false): array
    {
        $identity = Entity::where('slug', strtolower(trim($slug)))->find();
        if (!$identity || !$identity->is_valid || ($requireSearchable && !$identity->is_searchable)) throw new HttpException(404, '聊天人员不存在或不可联系');
        return $this->actorEntity((int) $identity->id);
    }

    public function summary(ChatActorType|string $type, int $id): array
    {
        $type = $type instanceof ChatActorType ? $type : ChatActorType::from($type);
        $model = match ($type) {
            ChatActorType::Entity => TeamMember::with(['profile','identity'])->find($id),
            ChatActorType::Customer => TeamCustomer::with(['profile','identity'])->find($id),
            ChatActorType::Team => Team::with(['identity','profile'])->find($id),
            ChatActorType::Virtual => TeamVirtual::with(['identity','profile'])->find($id),
        };
        if (!$model) return ['id'=>0,'entity_id'=>0,'type'=>$type->value,'slug'=>null,'name'=>'已失效人员','avatar'=>null,'is_valid'=>false,'team'=>null];
        return ['id'=>(int)($model->identity?->id??0),'entity_id'=>(int)($model->identity?->id??0),'type'=>$type->value,
            'slug'=>$model->slug??null,'name'=>match($type){ChatActorType::Entity=>$model->nickname?:'人员',ChatActorType::Customer=>$model->nickname?:'顾客',ChatActorType::Team=>$model->display_name?:'团队',ChatActorType::Virtual=>$model->name?:'虚拟人员'},
            'avatar'=>$type===ChatActorType::Team?null:($model->avatar?:null),'status_code'=>$type===ChatActorType::Entity?$model->status_code:null,
            'status_label'=>$type===ChatActorType::Entity?$model->status_label:null,'is_valid'=>(bool)$model->is_valid];
    }

    public function summaryEntity(int $entityId): array
    {
        $identity = Entity::find($entityId);
        if (!$identity) return ['id'=>$entityId,'entity_id'=>$entityId,'type'=>'entity','slug'=>null,'name'=>'已失效人员','avatar'=>null,'is_valid'=>false,'team'=>null];
        $type = match((string)$identity->entityable_type){'teamMember'=>ChatActorType::Entity,'teamCustomer'=>ChatActorType::Customer,'teamVirtual'=>ChatActorType::Virtual,'team'=>ChatActorType::Team};
        $teamId = app(IdentitySession::class)->entityTeamId((string)$identity->entityable_type,(int)$identity->entityable_id);
        $team = $teamId > 0 ? Team::find($teamId) : null;
        return array_merge($this->summary($type,(int)$identity->entityable_id),['id'=>(int)$identity->id,'entity_id'=>(int)$identity->id,
            'team'=>$team?['id'=>(int)$team->id,'slug'=>(string)$team->slug,'name'=>(string)($team->display_name?:$team->slug)]:null]);
    }

    public function actorEntity(int $entityId): array
    {
        $subject = app(\app\service\Entity::class)->subject($entityId);
        return ['entity_id'=>$entityId,'type'=>match($subject['type']){'teamMember'=>ChatActorType::Entity,'teamCustomer'=>ChatActorType::Customer,'teamVirtual'=>ChatActorType::Virtual,'team'=>ChatActorType::Team},
            'id'=>$subject['id'],'slug'=>(string)$subject['entity']->slug,'model'=>$subject['entity']->entityable];
    }
}
