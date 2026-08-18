<?php
declare(strict_types=1);

namespace app\service;

use think\exception\HttpException;
use think\facade\Db;

final class TeamAudit
{
    private const APPLICATIONS = [
        'team' => '团队',
        'shop' => '商品',
        'transaction' => '记账',
        'chat' => '聊天',
        'common' => '公共资源',
    ];

    private const ACTIONS = [
        'create' => '创建',
        'update' => '更新',
        'delete' => '删除',
        'save' => '保存',
        'upload' => '上传',
        'redeem' => '兑换',
        'bind' => '绑定',
        'unbind' => '解绑',
        'recharge' => '充值',
        'purchase' => '购买',
        'cancel' => '取消',
        'complete' => '完成',
        'approve' => '同意',
        'reject' => '拒绝',
        'depart' => '办理离队',
        'applyDeparture' => '申请离队',
        'block' => '封禁',
        'unblock' => '解封',
        'rotate' => '轮换凭据',
        'setHandlers' => '设置处理实体',
        'setPermissions' => '保存权限',
        'setRoles' => '保存角色分配',
        'setTasks' => '保存审核任务',
        'setTaskPassed' => '更新审核任务',
        'setSlug' => '设置标识',
        'setSearch' => '更新搜索设置',
        'setVisibility' => '更新可见范围',
        'send' => '发送',
        'apply' => '提交申请',
        'start' => '发起',
        'requestCancel' => '申请取消',
        'disable' => '停用',
        'issueCodes' => '发行卡密',
        'close' => '关闭',
        'addParticipants' => '添加参与者',
        'removeParticipant' => '移除参与者',
        'approveCancel' => '同意取消',
        'rejectCancel' => '拒绝取消',
        'reassign' => '改派',
        'claim' => '领取',
        'accept' => '确认',
        'restart' => '重新发起',
    ];

    private const RESOURCES = [
        'abilityClaim' => '团队能力',
        'chatIntegration' => 'Webhook 集成',
        'customer' => '顾客',
        'customerBalance' => '顾客余额',
        'customerSender' => '发单绑定',
        'customer_file' => '顾客文件',
        'document' => '文档',
        'entity' => '实体',
        'entity_display' => '实体公开展示',
        'entity_internal_visibility' => '实体团队内可见状态',
        'entity_visibility' => '实体可见范围',
        'entityField' => '对象字段',
        'entityFieldValues' => '对象字段值',
        'entityRole' => '实体角色',
        'file' => '文件',
        'joinApplication' => '加入申请',
        'joinApplicationFile' => '加入申请文件',
        'joinField' => '申请字段',
        'member' => '成员',
        'memberDeparture' => '离队申请',
        'notice' => '通知',
        'order' => '订单',
        'product' => '商品',
        'benefitPackage' => '权益包',
        'redemptionCampaign' => '兑换活动',
        'redemptionCode' => '兑换码',
        'service' => '服务',
        'conversation' => '会话',
        'role' => '角色',
        'rolePermission' => '角色权限',
        'serviceInstance' => '服务实例',
        'serviceAdjustment' => '履约加价费用',
        'teamSetting' => '团队设置',
        'transaction' => '流水',
        'virtualEntity' => '虚拟实体',
    ];

    public function catalog(): array
    {
        return [
            'applications' => $this->options(self::APPLICATIONS),
            'actions' => $this->options(self::ACTIONS),
            'resource_types' => $this->options(self::RESOURCES),
        ];
    }

    public function list(int $teamId, array $filters): array
    {
        [$page, $limit] = app(Pagination::class)->normalize(
            (int) ($filters['page'] ?? 1),
            (int) ($filters['limit'] ?? Pagination::DEFAULT_LIMIT)
        );
        $query = $this->query($teamId, $filters);
        $paginator = $query->order('event.id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $rows = $paginator->getCollection()->toArray();

        return [
            'total' => $paginator->total(),
            'list' => array_map(fn (array $row): array => $this->present($row, false), $rows),
            'page' => $paginator->currentPage(),
            'limit' => $paginator->listRows(),
        ];
    }

    public function get(int $teamId, int $id): array
    {
        if ($id < 1) {
            throw new HttpException(422, '审计事件 ID 不正确');
        }
        $row = $this->query($teamId, [])->where('event.id', $id)->find();
        if (!$row) {
            throw new HttpException(404, '审计事件不存在');
        }

        return $this->present($row, true);
    }

    private function query(int $teamId, array $filters)
    {
        $startTime = (int) ($filters['start_time'] ?? 0);
        $endTime = (int) ($filters['end_time'] ?? 0);
        if ($startTime > 0 && $endTime > 0 && $startTime > $endTime) {
            throw new HttpException(422, '开始时间不能晚于结束时间');
        }

        $query = Db::name('business_audit_event')->alias('event')
            ->leftJoin('user actor_user', 'actor_user.id = event.authenticated_user_id')
            ->leftJoin('entity actor_entity', 'actor_entity.id = event.entity_id')
            ->leftJoin('team_entity_profile actor_profile', 'actor_profile.entity_id = event.entity_id AND actor_profile.delete_time IS NULL')
            ->where('event.team_id', $teamId)
            ->whereNull('event.delete_time');

        foreach (['application', 'action', 'resource_type'] as $field) {
            $value = trim((string) ($filters[$field] ?? ''));
            if ($value !== '') {
                if (mb_strlen($value) > 50) {
                    throw new HttpException(422, '审计筛选值过长');
                }
                $query->where("event.{$field}", $value);
            }
        }
        $actorEntityId = (int) ($filters['actor_entity_id'] ?? 0);
        if ($actorEntityId > 0) {
            $query->where('event.entity_id', $actorEntityId);
        }
        if ($startTime > 0) {
            $query->where('event.create_time', '>=', $startTime);
        }
        if ($endTime > 0) {
            $query->where('event.create_time', '<=', $endTime);
        }

        $keyword = trim((string) ($filters['q'] ?? ''));
        if ($keyword !== '') {
            if (mb_strlen($keyword) > 100) {
                throw new HttpException(422, '搜索内容不能超过 100 个字符');
            }
            $pattern = '%' . addcslashes($keyword, '\\%_') . '%';
            $where = '(actor_user.username LIKE ? OR actor_profile.name LIKE ? OR actor_entity.slug LIKE ? OR event.action LIKE ? OR event.resource_type LIKE ? OR event.request_id LIKE ?';
            $bindings = array_fill(0, 6, $pattern);
            if (ctype_digit($keyword)) {
                $where .= ' OR event.id = ? OR event.resource_id = ? OR event.entity_id = ? OR event.authenticated_user_id = ?';
                $numeric = (int) $keyword;
                array_push($bindings, $numeric, $numeric, $numeric, $numeric);
            }
            $query->whereRaw($where . ')', $bindings);
        }

        return $query->field([
            'event.id', 'event.team_id', 'event.entity_id', 'event.authenticated_user_id',
            'event.application', 'event.action', 'event.resource_type', 'event.resource_id',
            'event.request_id', 'event.context', 'event.create_time',
            'actor_user.username actor_username', 'actor_entity.entityable_type actor_entity_type',
            'actor_entity.slug actor_entity_slug', 'actor_profile.name actor_entity_name',
        ]);
    }

    private function present($row, bool $detail): array
    {
        $row = is_array($row) ? $row : $row->toArray();
        $context = $this->decodeContext($row['context'] ?? null);
        $snapshot = is_array($context['actor_snapshot'] ?? null) ? $context['actor_snapshot'] : [];
        $data = [
            'id' => (int) $row['id'],
            'application' => (string) $row['application'],
            'application_label' => self::APPLICATIONS[$row['application']] ?? (string) $row['application'],
            'action' => (string) $row['action'],
            'action_label' => self::ACTIONS[$row['action']] ?? (string) $row['action'],
            'resource_type' => (string) $row['resource_type'],
            'resource_label' => self::RESOURCES[$row['resource_type']] ?? (string) $row['resource_type'],
            'resource_id' => isset($row['resource_id']) ? (int) $row['resource_id'] : null,
            'actor' => [
                'authenticated_user_id' => (int) ($row['authenticated_user_id'] ?? 0),
                'username' => $snapshot['username'] ?? $row['actor_username'] ?? null,
                'entity_id' => isset($row['entity_id']) ? (int) $row['entity_id'] : null,
                'entity_type' => $snapshot['entity_type'] ?? $row['actor_entity_type'] ?? null,
                'entity_name' => $snapshot['entity_name'] ?? $row['actor_entity_name'] ?? null,
                'entity_slug' => $snapshot['entity_slug'] ?? $row['actor_entity_slug'] ?? null,
            ],
            'request_id' => $row['request_id'] ?: null,
            'create_time' => (int) $row['create_time'],
        ];
        if ($detail) {
            $data['context'] = app(BusinessAudit::class)->sanitizeContext($context);
        }

        return $data;
    }

    private function decodeContext($context): array
    {
        if (is_array($context)) {
            return $context;
        }
        if (!is_string($context) || trim($context) === '') {
            return [];
        }
        $decoded = json_decode($context, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function options(array $items): array
    {
        $options = [];
        foreach ($items as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }
}
