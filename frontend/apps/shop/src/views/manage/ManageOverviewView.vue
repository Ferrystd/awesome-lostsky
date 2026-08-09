<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { Boxes, KeyRound, PackageOpen, ReceiptText, ShoppingBag, UserRound } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasManagePermission, loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })

function permissionReason(permission: string) {
  if (access.isPending.value) return `正在核对 ${permission} Permission`
  if (access.isError.value) return friendlyError(access.error.value)
  return hasManagePermission(access.data.value?.permissions ?? [], permission) ? '' : formatPermissionDenied([permission])
}

const entries = computed(() => [
  { key: 'products', label: '商品', description: '维护可售商品、处理人和核销字段。', to: '/manage/products', icon: ShoppingBag, permission: 'shop.product.read' },
  { key: 'orders', label: '订单', description: '查看团队订单并持续推进履约状态。', to: '/manage/orders', icon: ReceiptText, permission: 'shop.order.read' },
  { key: 'services', label: '服务', description: '配置服务内容、价格与处理关系。', to: '/manage/services', icon: Boxes, permission: 'shop.product.read' },
  { key: 'packages', label: '权益包', description: '组合服务权益、数量与有效期限。', to: '/manage/packages', icon: PackageOpen, permission: 'shop.product.read' },
  { key: 'campaigns', label: '卡活动', description: '管理卡活动、发行批次与卡密。', to: '/manage/campaigns', icon: KeyRound, permission: 'shop.product.read' },
].map(item => {
  const reason = permissionReason(item.permission)
  return { ...item, disabled: Boolean(reason), reason }
}))
</script>

<template>
  <LsWorkspaceOverview
    eyebrow="商品团队工作台"
    :title="access.data.value?.team?.name || (access.isError.value ? '团队摘要暂时不可用' : '正在读取当前团队…')"
    description="集中维护商品、订单与履约配置；没有管理 Permission 时，入口仍保留并直接说明原因。"
    :actions="[{ key: 'personal', label: '进入个人工作台', to: '/manage/personal', icon: UserRound, primary: true }]"
    :entries="entries"
    :scope-notes="['团队概览只读取访问快照，不请求商品、订单或履约统计。', '具体管理操作继续由既有 Shop Permission 与服务端接口共同校验。']"
  />
</template>
