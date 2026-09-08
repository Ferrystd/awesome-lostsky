<script setup lang="ts">
import ShopOverviewWorkspace from '../../components/ShopOverviewWorkspace.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { friendlyError } from '@lostsky/api/client'

import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { Boxes, House, KeyRound, PackageOpen, ReceiptText, ShoppingBag } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const identityType = computed(() => ({ team: 'Team Entity', teamMember: '团队成员', teamVirtual: '虚拟实体' })[access.data.value?.identity?.type ?? ''] || '当前 Entity')
const entries = computed(() => [
  {
    key: 'products',
    label: '我的商品',
    description: '管理专属 Entity 为当前身份的商品、接单人和核销字段。',
    to: '/manage/personal/products',
    icon: ShoppingBag,
  },
  {
    key: 'services',
    label: '我的服务',
    description: '定义当前 Entity 自己提供的服务、默认金额与接单池。',
    to: '/manage/personal/services',
    icon: Boxes,
  },
  {
    key: 'packages',
    label: '我的权益包',
    description: '组合本人服务与已启用的团队公用服务。',
    to: '/manage/personal/packages',
    icon: PackageOpen,
  },
  {
    key: 'campaigns',
    label: '我的卡活动',
    description: '配置卡活动、发行卡密并管理领取范围。',
    to: '/manage/personal/campaigns',
    icon: KeyRound,
  },
  {
    key: 'orders',
    label: '我的业务订单',
    description: '查看当前 Entity 作为接单人或发单人参与的订单。',
    to: '/manage/personal/orders',
    icon: ReceiptText,
  },
])
const configurationSteps = computed(() => ['services', 'packages', 'campaigns', 'products'].map(key => entries.value.find(entry => entry.key === key)!))
</script>

<template>
  <LsWorkspaceOverview
    :eyebrow="`${identityType} · ${access.data.value?.team?.name || '当前团队'}`"
    :title="access.data.value?.identity?.name || (access.isError.value ? '当前身份摘要暂时不可用' : '正在读取当前 Entity')"
    description="从自己的服务出发，组合权益、配置卡活动，让商品与业务订单有序衔接。"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/manage', icon: House, primary: true }]"
    :entries="entries"
  >
    <template #workspace>
      <ShopOverviewWorkspace :personal="true" :access="access.data.value" :steps="configurationSteps" />
      <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />
    </template>
  </LsWorkspaceOverview>
</template>
