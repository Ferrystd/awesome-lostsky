<script setup lang="ts">
import ShopOverviewWorkspace from '../../components/ShopOverviewWorkspace.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { friendlyError } from '@lostsky/api/client'

import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { House, ReceiptText, ShoppingBag } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const identityType = computed(() => ({ team: '团队身份', teamMember: '团队成员', teamVirtual: '虚拟人员' })[access.data.value?.identity?.type ?? ''] || '当前人员')
const entries = computed(() => [
  {
    key: 'products',
    label: '我的商品',
    description: '管理专属人员为当前身份的商品、接单人和核销字段。',
    to: '/manage/personal/products',
    icon: ShoppingBag,
  },
  {
    key: 'orders',
    label: '我的业务订单',
    description: '查看当前人员作为接单人或发单人参与的订单。',
    to: '/manage/personal/orders',
    icon: ReceiptText,
  },
])
const configurationSteps = computed(() => [{ key: 'create', label: '创建商品', description: '选择普通商品、核销商品、卡密或套餐。', to: '/manage/personal/products/new', icon: ShoppingBag }, entries.value[0]])
</script>

<template>
  <LsWorkspaceOverview
    :eyebrow="`${identityType} · ${access.data.value?.team?.name || '当前团队'}`"
    :title="access.data.value?.identity?.name || (access.isError.value ? '当前身份摘要暂时不可用' : '正在读取当前人员')"
    description="直接创建自己的商品，组合本人和公用商品，并跟进业务订单。"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/manage', icon: House, primary: true }]"
    :entries="entries"
  >
    <template #workspace>
      <ShopOverviewWorkspace :personal="true" :access="access.data.value" :steps="configurationSteps" />
      <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />
    </template>
  </LsWorkspaceOverview>
</template>
