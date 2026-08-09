<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { House, ReceiptText, ShoppingBag } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasManagePermission, loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
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
    :eyebrow="`${access.data.value?.team?.name || '当前团队'} · 商品个人工作台`"
    title="管理自己的商品与业务订单"
    description="个人范围固定为当前已领取的 Entity；商品按专属 Entity 归属，订单按接单或发单关系收口。"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/manage', icon: House, primary: true }]"
    :entries="entries"
    :scope-notes="['我的商品只包含专属 Entity 为当前身份的商品，团队公用和其他 Entity 商品不会出现。', '新建商品自动归属当前 Entity，个人工作台不能转移归属或永久删除商品。', '服务端按 acting_entity 强制过滤，客户端不能传入其他 Entity ID 扩大范围。']"
  />
</template>
