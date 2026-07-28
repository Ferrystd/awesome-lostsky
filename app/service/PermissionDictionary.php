<?php
declare(strict_types=1);

namespace app\service;

final class PermissionDictionary
{
    public const TEAM_MEMBER_READ = 'team.member.read';
    public const TEAM_MEMBER_INVITE = 'team.member.invite';
    public const TEAM_MEMBER_UPDATE = 'team.member.update';
    public const TEAM_MEMBER_REMOVE = 'team.member.remove';
    public const TEAM_ROLE_READ = 'team.role.read';
    public const TEAM_ROLE_WRITE = 'team.role.write';

    public const TEAM_JOIN_FIELD_READ = 'team.join_field.read';
    public const TEAM_JOIN_FIELD_WRITE = 'team.join_field.write';
    public const TEAM_JOIN_REVIEW_READ = 'team.join_review.read';
    public const TEAM_JOIN_REVIEW_WRITE = 'team.join_review.write';

    public const SHOP_PRODUCT_READ = 'shop.product.read';
    public const SHOP_PRODUCT_WRITE = 'shop.product.write';
    public const SHOP_PRODUCT_DELETE = 'shop.product.delete';
    public const SHOP_ORDER_READ = 'shop.order.read';
    public const SHOP_ORDER_WRITE = 'shop.order.write';

    public const TRANSACTION_READ = 'transaction.read';
    public const TRANSACTION_WRITE = 'transaction.write';
    public const TRANSACTION_DELETE = 'transaction.delete';
    public const TRANSACTION_REPORT_READ = 'transaction.report.read';

    public const FILE_READ = 'file.read';
    public const FILE_UPLOAD = 'file.upload';
    public const FILE_DELETE = 'file.delete';
    public const TEAM_SETTING_READ = 'team.setting.read';
    public const TEAM_SETTING_UPDATE = 'team.setting.update';
    public const TEAM_NOTICE_SEND = 'team.notice.send';

    public const IDENTITY_TEAM_ASSUME = 'identity.team.assume';
    public const IDENTITY_MEMBER_ALL_ASSUME = 'identity.member.*.assume';
    public const IDENTITY_CUSTOMER_ALL_ASSUME = 'identity.customer.*.assume';
    public const IDENTITY_VIRTUAL_ALL_ASSUME = 'identity.virtual.*.assume';

    public const CHAT_CONVERSATION_CREATE = 'chat.conversation.create';
    public const CHAT_GROUP_MANAGE = 'chat.group.manage';
    public const CHAT_TEMPORARY_CREATE = 'chat.temporary.create';
    public const CHAT_MESSAGE_MODERATE = 'chat.message.moderate';
    public const CHAT_VIRTUAL_CREATE = 'chat.virtual.create';
    public const CHAT_VIRTUAL_ALL_MANAGE = 'chat.virtual.*.manage';
    public const CHAT_VIRTUAL_ALL_OPERATE = 'chat.virtual.*.operate';
    public const CHAT_VIRTUAL_ALL_FIELD_MANAGE = 'chat.virtual.*.field.manage';
    public const TEAM_ENTITY_FIELD_MANAGE = 'team.entity_field.manage';
    public const TEAM_ENTITY_READ = 'team.entity.read';
    public const TEAM_ENTITY_PROFILE_MANAGE = 'team.entity_profile.manage';
    public const TEAM_ENTITY_FIELD_CUSTOMER_MANAGE = 'team.entity_field.customer.manage';

    public const CHAT_VIRTUAL_MANAGE_TEMPLATE = 'chat.virtual.<slug>.manage';

    private const GROUPS = [
        '团队成员' => [
            self::TEAM_ENTITY_READ => '查看实体',
            self::TEAM_ENTITY_PROFILE_MANAGE => '管理实体资料',
            self::TEAM_MEMBER_READ => '查看成员',
            self::TEAM_MEMBER_INVITE => '邀请成员',
            self::TEAM_MEMBER_UPDATE => '编辑成员',
            self::TEAM_MEMBER_REMOVE => '移除成员',
            self::TEAM_ROLE_READ => '查看角色',
            self::TEAM_ROLE_WRITE => '管理角色',
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
            self::SHOP_ORDER_READ => '查看订单',
            self::SHOP_ORDER_WRITE => '处理订单',
        ],
        '交易' => [
            self::TRANSACTION_READ => '查看交易',
            self::TRANSACTION_WRITE => '编辑交易',
            self::TRANSACTION_DELETE => '删除交易',
            self::TRANSACTION_REPORT_READ => '查看报表',
        ],
        '文件与设置' => [
            self::FILE_READ => '查看文件',
            self::FILE_UPLOAD => '上传文件',
            self::FILE_DELETE => '删除文件',
            self::TEAM_SETTING_READ => '查看设置',
            self::TEAM_SETTING_UPDATE => '编辑设置',
            self::TEAM_NOTICE_SEND => '发送通知',
        ],
        '身份委托' => [
            self::IDENTITY_TEAM_ASSUME => '领取团队身份',
            self::IDENTITY_MEMBER_ALL_ASSUME => '领取全部成员身份',
            self::IDENTITY_CUSTOMER_ALL_ASSUME => '领取全部客户身份',
            self::IDENTITY_VIRTUAL_ALL_ASSUME => '领取全部虚拟实体身份',
        ],
        '聊天' => [
            self::CHAT_CONVERSATION_CREATE => '创建会话',
            self::CHAT_GROUP_MANAGE => '管理群聊',
            self::CHAT_TEMPORARY_CREATE => '创建临时会话',
            self::CHAT_MESSAGE_MODERATE => '审核与撤回消息',
            self::CHAT_VIRTUAL_CREATE => '创建虚拟实体',
            self::CHAT_VIRTUAL_ALL_MANAGE => '管理全部虚拟实体',
            self::CHAT_VIRTUAL_ALL_OPERATE => '操作全部虚拟实体',
            self::CHAT_VIRTUAL_ALL_FIELD_MANAGE => '管理全部虚拟实体字段',
            self::TEAM_ENTITY_FIELD_MANAGE => '管理人员字段',
            self::TEAM_ENTITY_FIELD_CUSTOMER_MANAGE => '管理客户字段',
        ],
    ];

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
        return in_array($key, self::keys(), true) || self::dynamic($key) !== null;
    }

    /**
     * @return array{kind: 'virtual', slug: string, action: string}|array{kind: 'assume', type: string, slug: string}|null
     */
    public static function dynamic(string $key): ?array
    {
        if (preg_match(
            '/^chat\.virtual\.([a-z0-9][a-z0-9_-]{0,49})\.(manage|operate|field\.manage)$/',
            $key,
            $match
        )) {
            return ['kind' => 'virtual', 'slug' => $match[1], 'action' => $match[2]];
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

    public static function virtual(string $slug, string $action): string
    {
        return "chat.virtual.{$slug}.{$action}";
    }

    public static function assume(string $type, string $slug = '*'): string
    {
        return "identity.{$type}.{$slug}.assume";
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
