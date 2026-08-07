<script setup lang="ts">
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { House, ReceiptText } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasManagePermission, loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const orderReason = computed(() => {
  if (access.isPending.value) return '正在核对 shop.order.read Permission'
  if (access.isError.value) return '暂时无法核对 shop.order.read Permission'
  return hasManagePermission(access.data.value?.permissions ?? [], 'shop.order.read') ? '' : '缺少 shop.order.read Permission'
})
const entries = computed(() => [{
  key: 'orders',
  label: '我的业务订单',
  description: '查看当前 Entity 作为接单人或发单人参与的订单。',
  to: '/manage/personal/orders',
  icon: ReceiptText,
  disabled: Boolean(orderReason.value),
  reason: orderReason.value,
}])
</script>

<template>
  <LsWorkspaceOverview
    :eyebrow="`${access.data.value?.team?.name || '当前团队'} · 商品个人工作台`"
    title="只查看与你相关的业务订单"
    description="个人范围固定为当前已领取的 Entity，不引入商品所有权，也不会混入其他 Entity 的订单。"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/manage', icon: House, primary: true }]"
    :entries="entries"
    :scope-notes="['只包含当前 Entity 作为接单人或发单人关联的订单。', '这里不会出现“我的商品”，商品仍属于团队经营配置。', '服务端按 acting_entity 强制过滤，客户端不能传入其他 Entity ID 扩大范围。']"
  />
</template>
