<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { readAccessReason } from '@lostsky/api/access-result'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { BadgeCheck, Gift, Handshake, House, ListChecks } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { loadWorkspaceAccess } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })
const identityType = computed(() => ({ team: '团队实体', teamMember: '团队成员', teamVirtual: '虚拟实体' })[access.data.value?.identity?.type ?? ''] || '当前实体')

const entries = [
  { key: 'transactions', label: '我的流水', description: '集中查看当前实体（Entity）的角色笔数、月度数据与参与流水。', to: '/personal/transactions', icon: ListChecks },
  { key: 'services', label: '我的接单', description: '查看当前实体作为处理者参与的履约任务。', to: '/personal/services', icon: BadgeCheck },
  { key: 'customers', label: '我的顾客', description: '查看当前实体负责或协作发单的顾客。', to: '/personal/customers', icon: Handshake },
  { key: 'entitlement-grant', label: '权益下发', description: '查看当前实体已下发的权益，并继续为接待的顾客下发。', to: '/personal/entitlements', icon: Gift },
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
  <LsWorkspaceOverview
    :eyebrow="`${identityType} · ${access.data.value?.team?.name || '当前团队'}`"
    :title="access.data.value?.identity?.name || (access.isError.value ? '当前身份摘要暂时不可用' : '正在读取当前实体')"
    :description="`查看自己的接单、发单与接待业绩，从参与的业务继续处理顾客和权益。${access.data.value?.identity?.slug ? ` 当前身份 @${access.data.value.identity.slug}` : ''}`"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/overview', icon: House, primary: true }]"
    :entries="entries"
    :scope-notes="['仅统计当前身份参与的业务；团队管理权限不会扩大个人数据范围。']"
  >
    <template #summary>
      <LsPanel>
        <template #header><LsSectionHeader title="我的业务表现" description="角色参与笔数与业绩分开呈现，月度指标按本月统计。" /></template>
        <LsMetricGrid :items="metrics" aria-label="个人业务统计" />
        <LsAsyncState v-if="stats.isPending.value" state="loading" :rows="2" />
        <LsInlineError v-else-if="stats.isError.value" :message="friendlyError(stats.error.value)" />
      </LsPanel>
      <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />
    </template>
  </LsWorkspaceOverview>
</template>
