<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { Boxes, House, KeyRound, PackageOpen, ReceiptText, ShoppingBag } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasManagePermission, loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const identityType = computed(() => ({ team: 'Team Entity', teamMember: '团队成员', teamVirtual: '虚拟实体' })[access.data.value?.identity?.type ?? ''] || '当前 Entity')
const orderReason = computed(() => {
  if (access.isPending.value) return '正在核对 shop.order.read Permission'
  if (access.isError.value) return friendlyError(access.error.value)
  return hasManagePermission(access.data.value?.permissions ?? [], 'shop.order.read') ? '' : formatPermissionDenied(['shop.order.read'])
})
const productReason = computed(() => {
  if (access.isPending.value) return '正在核对 shop.product.self.manage Permission'
  if (access.isError.value) return friendlyError(access.error.value)
  return hasManagePermission(access.data.value?.permissions ?? [], 'shop.product.self.manage') ? '' : formatPermissionDenied(['shop.product.self.manage'])
})
const entries = computed(() => [
  {
    key: 'products',
    label: '我的商品',
    description: '管理专属 Entity 为当前身份的商品、接单人和核销字段。',
    to: '/manage/personal/products',
    icon: ShoppingBag,
    disabled: Boolean(productReason.value),
    reason: productReason.value,
  },
  {
    key: 'services',
    label: '我的服务',
    description: '定义当前 Entity 自己提供的服务、默认金额与接单池。',
    to: '/manage/personal/services',
    icon: Boxes,
    disabled: Boolean(productReason.value),
    reason: productReason.value,
  },
  {
    key: 'packages',
    label: '我的权益包',
    description: '组合本人服务与已启用的团队公用服务。',
    to: '/manage/personal/packages',
    icon: PackageOpen,
    disabled: Boolean(productReason.value),
    reason: productReason.value,
  },
  {
    key: 'campaigns',
    label: '我的卡活动',
    description: '配置卡活动、发行卡密并管理领取范围。',
    to: '/manage/personal/campaigns',
    icon: KeyRound,
    disabled: Boolean(productReason.value),
    reason: productReason.value,
  },
  {
    key: 'orders',
    label: '我的业务订单',
    description: '查看当前 Entity 作为接单人或发单人参与的订单。',
    to: '/manage/personal/orders',
    icon: ReceiptText,
    disabled: Boolean(orderReason.value),
    reason: orderReason.value,
  },
])
</script>

<template>
  <LsWorkspaceOverview
    :eyebrow="`${identityType} · ${access.data.value?.team?.name || '当前团队'}`"
    :title="access.data.value?.identity?.name || '正在读取当前 Entity'"
    :description="`商品个人工作台固定服务于当前身份${access.data.value?.identity?.slug ? ` @${access.data.value.identity.slug}` : ''}；商品、服务、权益包与卡活动按当前 Entity 归属，订单按接单或发单关系收口。`"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/manage', icon: House, primary: true }]"
    :entries="entries"
    :scope-notes="['个人资源只显示当前 Entity 自己创建的内容；组包和售卖时可以使用已启用的团队公用资源。', '新建资源自动归属当前 Entity，个人工作台不能转移归属或永久删除资源。', '服务端按 acting_entity 强制过滤，顾客端不能传入其他 Entity ID 扩大范围。']"
  />
</template>
