<script setup lang="ts">
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { readAccessReason } from '@lostsky/api/access-result'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { BadgeCheck, Gift, Handshake, House, ListChecks } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { loadWorkspaceAccess } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })
const identityType = computed(() => ({ team: '团队身份', teamMember: '团队成员', teamVirtual: '虚拟人员' })[access.data.value?.identity?.type ?? ''] || '当前人员')

const entries = [
  { key: 'transactions', label: '我的流水', description: '汇总当前人员参与的流水与业绩。', to: '/personal/transactions', icon: ListChecks },
  { key: 'services', label: '我的接单', description: '查看你的接单情况。', to: '/personal/services', icon: BadgeCheck },
  { key: 'customers', label: '我的顾客', description: '查看当前人员负责或协作发单的顾客。', to: '/personal/customers', icon: Handshake },
  { key: 'entitlement-grant', label: '权益下发', description: '查看当前人员已下发的权益，并继续为接待的顾客下发。', to: '/personal/entitlements', icon: Gift },
]
type PersonalStats = { handler_count: number; sender_count: number; cs_count: number; monthly_performance_total: string | number; monthly_flow_total: string | number; performance_total: string | number }
const stats = useQuery({ queryKey: ['transaction-personal', 'stats'], queryFn: () => api.get<PersonalStats>('/personal/stats') })
const metrics = computed(() => [
  { key: 'handler_count', label: '总接单数', money: false },
  { key: 'sender_count', label: '总发单数', money: false },
  { key: 'cs_count', label: '总接待数', money: false },
  { key: 'monthly_performance_total', label: '月度业绩', money: true },
  { key: 'monthly_flow_total', label: '月度流水', money: true },
  { key: 'performance_total', label: '个人业绩', money: true },
].map(item => {
  const raw = stats.data.value?.[item.key as keyof PersonalStats]
  const available = !stats.isError.value && !stats.isPending.value && !readAccessReason(stats.data.value) && raw != null && Number.isFinite(Number(raw))
  return { key: item.key, label: item.label, value: available ? item.money ? '¥' + Number(raw).toFixed(2) : Number(raw) : '-' }
}))
</script>

<template>
  <LsOverviewPage
    :title="access.data.value?.identity?.name || (access.isError.value ? '当前身份摘要暂时不可用' : '正在读取当前人员')"
    :description="`${identityType} · ${access.data.value?.team?.name || '当前团队'}。查看自己的接单、发单与接待业绩，从参与的业务继续处理顾客和权益。${access.data.value?.identity?.slug ? ` 当前身份 @${access.data.value.identity.slug}` : ''}`"
  >
    <template #actions>
      <LsPageLink to="/overview" :icon="House" label="进入团队工作台" />

    </template>
    <LsPanel>
      <template #header><LsSectionHeader title="继续我的业务" description="从参与的流水、接单和顾客关系继续处理。" /></template>
      <LsOverviewLinks label="个人工作入口" :entries="entries" />
    </LsPanel>

      <LsPanel>
        <template #header><LsSectionHeader title="我的业务表现" description="按角色分别统计参与流水与业绩。" /></template>
        <LsMetricGrid :items="metrics" aria-label="个人业务统计" />
        <LsAsyncState v-if="stats.isPending.value" state="loading" :rows="2" />
        <LsInlineError v-else-if="stats.isError.value" :message="friendlyError(stats.error.value)" />
      </LsPanel>
      <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />

    <p class="workspace-note">团队流水需切换至团队工作台；商品编辑请移步至商城工作台。</p>
  </LsOverviewPage>
</template>

<style scoped>
.workspace-note { margin: 0; color: var(--text-secondary); font-size: .875rem; line-height: 1.6; }
</style>
