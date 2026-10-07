<?php
declare(strict_types=1);

namespace app\service;

final class PermissionDictionary
{
    public const TEAM_MEMBER_READ = 'team.member.read';
    public const TEAM_MEMBER_INVITE = 'team.member.invite';
    public const TEAM_MEMBER_UPDATE = 'team.member.update';
    public const TEAM_MEMBER_REMOVE = 'team.member.remove';
    public const TEAM_CUSTOMER_READ = 'team.customer.read';
    public const TEAM_CUSTOMER_MANAGE = 'team.customer.manage';
    public const TEAM_ROLE_READ = 'team.role.read';
    public const TEAM_ROLE_WRITE = 'team.role.write';

    public const TEAM_JOIN_FIELD_READ = 'team.join_field.read';
    public const TEAM_JOIN_FIELD_WRITE = 'team.join_field.write';
    public const TEAM_JOIN_REVIEW_READ = 'team.join_review.read';
    public const TEAM_JOIN_REVIEW_WRITE = 'team.join_review.write';

    public const SHOP_PRODUCT_READ = 'shop.product.read';
    public const SHOP_PRODUCT_WRITE = 'shop.product.write';
    public const SHOP_PRODUCT_DELETE = 'shop.product.delete';
    public const SHOP_PRODUCT_SELF_MANAGE = 'shop.product.self.manage';
    public const SHOP_PRODUCT_SELF_REPRICE = 'shop.product.self.reprice';
    public const SHOP_ORDER_READ = 'shop.order.read';
    public const SHOP_ORDER_WRITE = 'shop.order.write';
    public const SERVICE_REDEMPTION_READ = 'service.redemption.read';
    public const SERVICE_REDEMPTION_MANAGE = 'service.redemption.manage';
    public const SERVICE_ENTITLEMENT_GRANT = 'service.entitlement.grant';

    public const TRANSACTION_READ = 'transaction.read';
    public const TRANSACTION_WRITE = 'transaction.write';
    public const TRANSACTION_DELETE = 'transaction.delete';
    public const TRANSACTION_REPORT_READ = 'transaction.report.read';

    public const FILE_READ = 'file.read';
    public const FILE_UPLOAD = 'file.upload';
    public const FILE_DELETE = 'file.delete';
    public const TEAM_DOCUMENT_READ = 'team.document.read';
    public const TEAM_DOCUMENT_TEAM_MANAGE = 'team.document.team.manage';
    public const TEAM_DOCUMENT_MEMBER_ALL_MANAGE = 'team.document.member.*.manage';
    public const TEAM_DOCUMENT_CUSTOMER_ALL_MANAGE = 'team.document.customer.*.manage';
    public const TEAM_DOCUMENT_VIRTUAL_ALL_MANAGE = 'team.document.virtual.*.manage';
    public const TEAM_SETTING_READ = 'team.setting.read';
    public const TEAM_SETTING_UPDATE = 'team.setting.update';
    public const TEAM_ABILITY_REDEEM = 'team.ability.redeem';
    public const TEAM_NOTICE_READ = 'team.notice.read';
    public const TEAM_NOTICE_SEND = 'team.notice.send';
    public const TEAM_AUDIT_READ = 'team.audit.read';

    public const IDENTITY_TEAM_ASSUME = 'identity.team.assume';
    public const IDENTITY_MEMBER_ALL_ASSUME = 'identity.member.*.assume';
    public const IDENTITY_CUSTOMER_ALL_ASSUME = 'identity.customer.*.assume';
    public const IDENTITY_VIRTUAL_ALL_ASSUME = 'identity.virtual.*.assume';

    public const COMMUNITY_TEAM_READ = 'community.team.read';
    public const COMMUNITY_TEAM_MANAGE = 'community.team.manage';
    public const ADMIN_COMMUNITY_READ = 'admin.community.read';
    public const ADMIN_COMMUNITY_WRITE = 'admin.community.write';
    public const ADMIN_COMMUNITY_MODERATE = 'admin.community.moderate';
    public const CHAT_GROUP_MANAGE = 'chat.group.manage';
    public const WEIBO_PERSONAL_USE = 'weibo.personal.use';
    public const WEIBO_TEAM_MANAGE = 'weibo.team.manage';
    public const TEAM_ENTITY_VIRTUAL_CREATE = 'team.entity.virtual.create';
    public const TEAM_ENTITY_VIRTUAL_ALL_MANAGE = 'team.entity.virtual.*.manage';
    public const TEAM_ENTITY_VIRTUAL_ALL_FIELD_MANAGE = 'team.entity.virtual.*.field.manage';
    public const TEAM_ENTITY_FIELD_MANAGE = 'team.entity.field.manage';
    public const TEAM_ENTITY_FIELD_CUSTOMER_MANAGE = 'team.entity.field.customer.manage';
    public const TEAM_ENTITY_READ = 'team.entity.read';
    public const TEAM_ENTITY_PROFILE_MANAGE = 'team.entity.profile.manage';

    public const ADMIN_DASHBOARD_READ = 'admin.dashboard.read';
    public const ADMIN_USER_READ = 'admin.user.read';
    public const ADMIN_USER_SENSITIVE_READ = 'admin.user.sensitive.read';
    public const ADMIN_USER_MODERATE = 'admin.user.moderate';
    public const ADMIN_USER_SESSION_REVOKE = 'admin.user.session.revoke';
    public const ADMIN_TEAM_READ = 'admin.team.read';
    public const ADMIN_TEAM_MODERATE = 'admin.team.moderate';
    public const ADMIN_TEAM_ABILITY_WRITE = 'admin.team.ability.write';
    public const ADMIN_ACCESS_READ = 'admin.access.read';
    public const ADMIN_ACCESS_WRITE = 'admin.access.write';
    public const ADMIN_AUDIT_READ = 'admin.audit.read';
    public const ADMIN_SYSTEM_READ = 'admin.system.read';
    public const ADMIN_SITE_READ = 'admin.site.read';
    public const ADMIN_SITE_WRITE = 'admin.site.write';
    public const ADMIN_ENTITLEMENT_READ = 'admin.entitlement.read';
    public const ADMIN_ENTITLEMENT_WRITE = 'admin.entitlement.write';

    public const TEAM_ENTITY_VIRTUAL_MANAGE_TEMPLATE = 'team.entity.virtual.<slug>.manage';

    private const GROUPS = [
        '团队社区' => [self::COMMUNITY_TEAM_READ => '查看团队社区', self::COMMUNITY_TEAM_MANAGE => '管理团队社区'],
        '团队成员' => [
            self::TEAM_MEMBER_READ => '查看全部成员（含团队内隐藏）',
            self::TEAM_MEMBER_INVITE => '邀请成员',
            self::TEAM_MEMBER_UPDATE => '编辑成员',
            self::TEAM_MEMBER_REMOVE => '移除成员',
            self::TEAM_ROLE_READ => '查看角色',
            self::TEAM_ROLE_WRITE => '管理角色',
        ],
        '顾客' => [
            self::TEAM_CUSTOMER_READ => '查看全部顾客',
            self::TEAM_CUSTOMER_MANAGE => '管理顾客资料、归属、协作与封禁状态',
        ],
        '加入审核' => [
            self::TEAM_JOIN_FIELD_READ => '查看申请字段',
            self::TEAM_JOIN_FIELD_WRITE => '管理申请字段',
            self::TEAM_JOIN_REVIEW_READ => '查看加入申请',
            self::TEAM_JOIN_REVIEW_WRITE => '审核加入申请',
        ],
        '商店' => [
            self::SHOP_PRODUCT_READ => '查看商品',
            self::SHOP_PRODUCT_WRITE => '编辑商品',
            self::SHOP_PRODUCT_DELETE => '删除商品',
            self::SHOP_PRODUCT_SELF_MANAGE => '管理本人商品与服务资源',
            self::SHOP_PRODUCT_SELF_REPRICE => '调整本人商品与服务分成及权益包公用服务计价',
            self::SHOP_ORDER_READ => '查看订单',
            self::SHOP_ORDER_WRITE => '处理订单',
        ],
        '交易' => [
            self::TRANSACTION_READ => '查看团队全部交易',
            self::TRANSACTION_WRITE => '编辑交易',
            self::TRANSACTION_DELETE => '删除交易',
            self::TRANSACTION_REPORT_READ => '查看团队全部报表',
            self::SERVICE_ENTITLEMENT_GRANT => '为本人接待顾客赋予权益',
            self::SERVICE_REDEMPTION_READ => '查看全部服务核销',
            self::SERVICE_REDEMPTION_MANAGE => '管理服务核销',
        ],
        '文档管理' => [
            self::TEAM_DOCUMENT_READ => '查看全部文档（含当前 Entity 不可见文档）',
            self::TEAM_DOCUMENT_TEAM_MANAGE => '管理团队文档',
            self::TEAM_DOCUMENT_MEMBER_ALL_MANAGE => '管理全部成员文档',
            self::TEAM_DOCUMENT_CUSTOMER_ALL_MANAGE => '管理全部顾客文档',
            self::TEAM_DOCUMENT_VIRTUAL_ALL_MANAGE => '管理全部虚拟人员文档',
        ],
        '文件与设置' => [
            self::FILE_READ => '查看文件',
            self::FILE_UPLOAD => '上传文件',
            self::FILE_DELETE => '删除文件',
            self::TEAM_SETTING_READ => '查看设置',
            self::TEAM_SETTING_UPDATE => '编辑设置',
            self::TEAM_ABILITY_REDEEM => '兑换团队能力',
        ],
        '通知' => [
            self::TEAM_NOTICE_READ => '查看团队站内通知',
            self::TEAM_NOTICE_SEND => '发送通知',
        ],
        '安全与审计' => [
            self::TEAM_AUDIT_READ => '查看团队审计日志',
        ],
        '人员管理' => [
            self::TEAM_ENTITY_READ => '查看全部人员（含团队内隐藏）',
            self::TEAM_ENTITY_PROFILE_MANAGE => '管理人员资料与展示状态',
            self::TEAM_ENTITY_VIRTUAL_CREATE => '创建虚拟人员',
            self::TEAM_ENTITY_VIRTUAL_ALL_MANAGE => '管理全部虚拟人员',
            self::TEAM_ENTITY_VIRTUAL_ALL_FIELD_MANAGE => '管理全部虚拟人员字段',
            self::TEAM_ENTITY_FIELD_MANAGE => '管理团队与成员字段',
            self::TEAM_ENTITY_FIELD_CUSTOMER_MANAGE => '管理顾客字段',
        ],
        '人员委托' => [
            self::IDENTITY_TEAM_ASSUME => '领取团队身份',
            self::IDENTITY_MEMBER_ALL_ASSUME => '领取全部成员身份',
            self::IDENTITY_CUSTOMER_ALL_ASSUME => '领取全部顾客身份',
            self::IDENTITY_VIRTUAL_ALL_ASSUME => '领取全部虚拟人员身份',
        ],
        '聊天' => [
            self::CHAT_GROUP_MANAGE => '管理群聊',
        ],
        '微博' => [
            self::WEIBO_PERSONAL_USE => '使用个人微博工作台',
            self::WEIBO_TEAM_MANAGE => '查看并管理团队微博工作台',
        ],
    ];

    private const ADMIN_GROUPS = [
        '平台社区' => [self::ADMIN_COMMUNITY_READ => '查看平台社区', self::ADMIN_COMMUNITY_WRITE => '维护资料与管理员', self::ADMIN_COMMUNITY_MODERATE => '治理内容与成员'],
        '平台概览' => [
            self::ADMIN_DASHBOARD_READ => '查看平台概览',
            self::ADMIN_SYSTEM_READ => '查看系统状态',
        ],
        '用户治理' => [
            self::ADMIN_USER_READ => '查看用户',
            self::ADMIN_USER_SENSITIVE_READ => '查看用户完整联系方式',
            self::ADMIN_USER_MODERATE => '封禁与解封用户',
            self::ADMIN_USER_SESSION_REVOKE => '撤销用户会话',
        ],
        '团队治理' => [
            self::ADMIN_TEAM_READ => '查看团队',
            self::ADMIN_TEAM_MODERATE => '封禁与解封团队',
            self::ADMIN_TEAM_ABILITY_WRITE => '开通、调整与续期团队能力',
        ],
        '平台权限' => [
            self::ADMIN_ACCESS_READ => '查看平台管理员与角色',
            self::ADMIN_ACCESS_WRITE => '管理平台管理员与角色',
            self::ADMIN_AUDIT_READ => '查看平台审计日志',
        ],
        '官网内容' => [
            self::ADMIN_SITE_READ => '查看官网内容',
            self::ADMIN_SITE_WRITE => '编辑官网内容',
        ],
        '平台权益' => [
            self::ADMIN_ENTITLEMENT_READ => '查看平台权益与体验码',
            self::ADMIN_ENTITLEMENT_WRITE => '管理平台权益与体验码',
        ],
    ];

    /** 权限字典的完整说明；界面短标签继续由 groups()/adminGroups() 提供。 */
    public static function descriptions(): array
    {
        return [
            'community.team.read' => 'community.team.read',
            'community.team.manage' => 'community.team.manage',
            'admin.community.read' => 'admin.community.read',
            'admin.community.write' => 'admin.community.write',
            'admin.community.moderate' => 'admin.community.moderate',
            'team.member.read' => '查看完整成员管理集合，包括团队内隐藏或封禁成员；基础目录不要求此权限',
            'team.member.invite' => '邀请或新增成员',
            'team.member.update' => '编辑、封禁、解封、设置 slug 与搜索成员',
            'team.member.remove' => '查询、批准和拒绝成员离队申请，以及直接办理离职；保留成员和业务历史',
            'team.role.read' => '查看角色、权限和角色分配',
            'team.role.write' => '管理角色、权限和角色分配',
            'team.ability.redeem' => '兑换团队能力（卡密或体验码）',
            'team.customer.read' => '查看当前团队全部顾客；无此权限的归属实体仍只能查看自己的顾客',
            'team.customer.manage' => '管理顾客资料、当前归属、协作发单人与封禁状态，并包含全量顾客读取',
            'team.join_field.read' => '查看加入申请字段',
            'team.join_field.write' => '管理加入申请字段',
            'team.join_review.read' => '查看加入申请',
            'team.join_review.write' => '审核申请及维护审核任务',
            'shop.product.read' => '查看商品',
            'shop.product.write' => '创建、编辑商品和配置处理人',
            'shop.product.delete' => '删除商品',
            'shop.product.self.manage' => '管理当前 Entity 本人服务、权益包、卡活动、卡密与商品',
            'shop.product.self.reprice' => '调整本人商品、服务及权益包服务项的人员分成，并调整本人权益包内公用服务的价格、成本；不由本人资源管理权限隐式包含',
            'shop.order.read' => '查看订单',
            'shop.order.write' => '创建、取消和完成订单',
            'transaction.read' => '查看团队全量流水、余额日志、发单人和交易选项；本人相关读取不依赖此权限',
            'transaction.write' => '创建或编辑流水、充值及团队手动赋予权益；顾客协作关系由 `team.customer.manage` 维护',
            'transaction.delete' => '删除流水',
            'transaction.report.read' => '查看团队全量交易统计报表；“我的流水”中的个人统计不依赖此权限',
            'service.entitlement.grant' => '在个人工作台为当前 Entity 接待的顾客赋予服务权益',
            'service.redemption.read' => '进入团队服务核销并查看全量列表、详情与接单池',
            'service.redemption.manage' => '查看团队全量核销，并允许改派、处理取消、确认完成与调整费用',
            'weibo.personal.use' => '内部 Entity 使用个人微博业务导航、读取与本地管理',
            'weibo.team.manage' => '使用团队微博业务导航、读取与本地管理；可由目标团队授予外部 Entity',
            'file.read' => '查看团队文件与用量',
            'file.upload' => '通过团队文件库上传团队文件；资源附件上传只受 File Ability 与所属资源编辑鉴权控制',
            'file.delete' => '删除团队文件',
            'team.document.read' => '查看团队全部文档，包括当前 Entity 按可见性无法读取的文档；基础文档入口不要求此权限',
            'team.document.team.manage' => '管理归属于团队人员的文档',
            'team.document.member.*.manage' => '管理当前团队全部成员实体的文档',
            'team.document.customer.*.manage' => '管理当前团队全部顾客实体的文档',
            'team.document.virtual.*.manage' => '管理当前团队全部虚拟实体的文档',
            'team.setting.read' => '查看团队设置及设置结构',
            'team.setting.update' => '修改团队设置',
            'team.audit.read' => '查看当前团队审计日志',
            'team.notice.read' => '查看 LostSky 发给团队的共享站内通知',
            'team.notice.send' => '以团队名义向同团队人员发送单向通知',
            'identity.team.assume' => '领取当前授权团队的团队实体',
            'identity.member.*.assume' => '领取当前授权团队的任意有效成员',
            'identity.customer.*.assume' => '领取当前授权团队的任意有效顾客',
            'identity.virtual.*.assume' => '领取当前授权团队的任意有效虚拟实体',
            'team.entity.read' => '查看全部有效实体，包括团队内隐藏实体；基础目录不要求此权限',
            'team.entity.profile.manage' => '管理实体资料、团队内可见状态和公开展示状态',
            'team.entity.virtual.create' => '创建虚拟实体',
            'team.entity.virtual.*.manage' => '管理当前团队全部虚拟实体及集成',
            'team.entity.virtual.*.field.manage' => '管理当前团队全部虚拟实体字段',
            'team.entity.field.manage' => '管理团队与成员实体字段',
            'team.entity.field.customer.manage' => '管理顾客实体字段',
            'chat.group.manage' => '管理群聊',
            'admin.dashboard.read' => '查看平台总览',
            'admin.system.read' => '查看系统状态',
            'admin.site.read' => '查看官网备案号、核心人员和团队优势数据',
            'admin.site.write' => '编辑官网备案号、核心人员和团队优势数据',
            'admin.entitlement.read' => '查看 Ability 权益与体验码',
            'admin.entitlement.write' => '管理 Ability 权益与体验码',
            'admin.user.read' => '查看用户与脱敏联系方式',
            'admin.user.sensitive.read' => '查看用户完整手机和邮箱',
            'admin.user.moderate' => '封禁与解封用户',
            'admin.user.session.revoke' => '撤销用户全部会话',
            'admin.team.read' => '查看团队',
            'admin.team.moderate' => '封禁与解封团队',
            'admin.team.ability.write' => '开通、调整与续期团队 Ability',
            'admin.access.read' => '查看平台管理员与角色',
            'admin.access.write' => '管理平台管理员与角色',
            'admin.audit.read' => '查看集中审计事件',
        ];
    }

    public static function dynamicDescriptions(): array
    {
        return [
            'team.entity.virtual.<slug>.manage' => '管理当前团队指定虚拟实体',
            'team.entity.virtual.<slug>.field.manage' => '管理当前团队指定虚拟实体字段',
            'identity.member.<slug>.assume' => '领取当前团队指定有效成员',
            'identity.customer.<slug>.assume' => '领取当前团队指定有效顾客',
            'identity.virtual.<slug>.assume' => '领取当前团队指定有效虚拟实体',
            'team.document.member.<slug>.manage' => '管理当前团队指定成员实体的文档',
            'team.document.customer.<slug>.manage' => '管理当前团队指定顾客实体的文档',
            'team.document.virtual.<slug>.manage' => '管理当前团队指定虚拟实体的文档',
        ];
    }

    public static function groups(): array
    {
        return self::GROUPS;
    }

    public static function keys(): array
    {
        $keys = [];
        foreach (self::GROUPS as $items) {
            $keys = array_merge($keys, array_keys($items));
        }

        return array_values(array_unique($keys));
    }

    public static function contains(string $key): bool
    {
        return in_array($key, self::keys(), true)
            || self::dynamic($key) !== null;
    }

    public static function isFixedKeyOrParent(string $key): bool
    {
        foreach (self::keys() as $candidate) {
            if ($candidate === $key || str_starts_with($candidate, "{$key}.")) {
                return true;
            }
        }

        return false;
    }

    public static function adminGroups(): array
    {
        return self::ADMIN_GROUPS;
    }

    public static function adminKeys(): array
    {
        $keys = [];
        foreach (self::ADMIN_GROUPS as $items) {
            $keys = array_merge($keys, array_keys($items));
        }

        return array_values(array_unique($keys));
    }

    /**
     * @return array{kind: 'virtual', slug: string, action: string}|array{kind: 'document', type: string, slug: string}|array{kind: 'act', slug: string}|array{kind: 'assume', type: string, slug: string}|null
     */
    public static function dynamic(string $key): ?array
    {
        if (preg_match(
            '/^team\.entity\.virtual\.([a-z0-9][a-z0-9_-]{0,49})\.(manage|field\.manage)$/',
            $key,
            $match
        )) {
            return ['kind' => 'virtual', 'slug' => $match[1], 'action' => $match[2]];
        }

        if (preg_match(
            '/^team\.document\.(member|customer|virtual)\.([a-z0-9][a-z0-9_-]{0,49})\.manage$/',
            $key,
            $match
        )) {
            return ['kind' => 'document', 'type' => $match[1], 'slug' => $match[2]];
        }

        if (preg_match(
            '/^identity\.(member|customer|virtual)\.([a-z0-9][a-z0-9_-]{0,49})\.assume$/',
            $key,
            $match
        )) {
            return ['kind' => 'assume', 'type' => $match[1], 'slug' => $match[2]];
        }

        return null;
    }

    /**
     * 返回动态权限的直接或间接父键所对应的一个叶子权限。
     *
     * @return array{kind: 'virtual', slug: string, action: string}|array{kind: 'document', type: string, slug: string}|array{kind: 'act', slug: string}|array{kind: 'assume', type: string, slug: string}|null
     */
    public static function dynamicDescendant(string $key): ?array
    {
        foreach (['.manage', '.field.manage', '.assume'] as $suffix) {
            $dynamic = self::dynamic($key . $suffix);
            if ($dynamic !== null) {
                return $dynamic;
            }
        }

        return null;
    }

    public static function virtual(string $slug, string $action): string
    {
        return match ($action) {
            'manage', 'field.manage' => "team.entity.virtual.{$slug}.{$action}",
            default => throw new \InvalidArgumentException("Unsupported virtual permission action: {$action}"),
        };
    }

    public static function assume(string $type, string $slug = '*'): string
    {
        return "identity.{$type}.{$slug}.assume";
    }

    public static function documentManage(string $type, string $slug = '*'): string
    {
        return match ($type) {
            'team' => self::TEAM_DOCUMENT_TEAM_MANAGE,
            'teamMember' => "team.document.member.{$slug}.manage",
            'teamCustomer' => "team.document.customer.{$slug}.manage",
            'teamVirtual' => "team.document.virtual.{$slug}.manage",
            default => throw new \InvalidArgumentException("Unsupported document entity type: {$type}"),
        };
    }

    public static function entityField(string $type): string
    {
        return match ($type) {
            'entity' => self::TEAM_ENTITY_FIELD_MANAGE,
            'customer' => self::TEAM_ENTITY_FIELD_CUSTOMER_MANAGE,
            default => throw new \InvalidArgumentException("Unsupported entity field type: {$type}"),
        };
    }
}
