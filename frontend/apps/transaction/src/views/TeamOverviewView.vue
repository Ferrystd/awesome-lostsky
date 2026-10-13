<script setup lang="ts">
import LsDashboardPath from '@lostsky/ui/components/LsDashboardPath.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
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
  { key: 'stats', label: '经营统计', description: '查看团队收入结构与业绩汇总。', to: '/stats', icon: BarChart3 },
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
    <template #summary>
      <LsAsyncState v-if="access.isPending.value" state="loading" title="正在读取当前团队…" :rows="2" />
      <LsAsyncState v-else-if="access.isError.value" state="error" title="团队摘要暂时不可用" :description="friendlyError(access.error.value)" />
      <LsPanel v-else>
        <template #header><LsSectionHeader title="本次工作范围" description="团队经营记录集中查看，个人参与业务从个人工作台继续。" /></template>
        <LsDescriptionList><dt>当前团队</dt><dd>{{ access.data.value?.team?.name || '-' }}</dd><dt>当前身份</dt><dd>{{ access.data.value?.identity?.name || '-' }}</dd><dt>登记流水</dt><dd>进入个人工作台，记录本人参与的业务。</dd></LsDescriptionList>
      </LsPanel>
    </template>
      <div class="ledger-workspace">
        <LsPanel>
          <LsDashboardPath title="收支核对" description="从原始记录进入经营分析，核对收入、支出与调整。" :steps="[entries[0]!, entries[1]!]" />
        </LsPanel>
        <LsPanel>
          <LsDashboardPath title="权益与资金" description="核对服务履约和顾客预存余额，各项记录独立留痕。" :steps="[entries[2]!, entries[3]!]" />
        </LsPanel>
      </div>
  </LsOverviewPage>
</template>

<style scoped>
.ledger-workspace { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 899px) { .ledger-workspace { grid-template-columns: minmax(0, 1fr); } }
</style>
