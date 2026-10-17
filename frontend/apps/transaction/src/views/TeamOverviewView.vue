<script setup lang="ts">
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { friendlyError } from '@lostsky/api/client'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import { BadgeCheck, BarChart3, CircleDollarSign, ListChecks, UserRound } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { loadWorkspaceAccess } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })

const entries = [
  { key: 'transactions', label: '团队流水', description: '查看团队收入、支出与调整记录。', to: '/transactions', icon: ListChecks },
  { key: 'services', label: '权益核销', description: '处理并记录顾客核销。', to: '/services', icon: BadgeCheck },
  { key: 'balances', label: '顾客余额', description: '查看顾客余额和流水明细；具备权限后可为顾客充值。', to: '/balances', icon: CircleDollarSign },
]
</script>

<template>
  <LsOverviewPage
    :title="access.data.value?.team?.name || '记账团队工作台'"
    description="看清每笔收支的来处与去向，让流水、权益核销和顾客余额相互衔接。"
  >
    <template #actions>
      <LsPageLink to="/personal" :icon="UserRound" label="进入个人工作台" />
      <LsSceneMotionControl />
    </template>
    <LsPanel>
      <template #header><LsSectionHeader title="处理团队业务" description="从流水核对收支，继续处理权益履约与顾客预存。" /></template>
      <LsOverviewLinks label="团队业务入口" :entries="entries" />
      <template #footer>
        <LsSectionHeader title="回看经营表现" :heading-level="3" description="按周期查看收入结构与业绩汇总。">
          <template #aside><LsPageLink to="/stats" :icon="BarChart3" label="查看经营统计" /></template>
        </LsSectionHeader>
      </template>
    </LsPanel>
    <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />
  </LsOverviewPage>
</template>
