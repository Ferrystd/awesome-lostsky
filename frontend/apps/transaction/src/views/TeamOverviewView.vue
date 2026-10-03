<script setup lang="ts">
import LsDashboardPath from '@lostsky/ui/components/LsDashboardPath.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { friendlyError } from '@lostsky/api/client'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
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
  <LsWorkspaceOverview
    eyebrow="记账团队工作台"
    :title="access.data.value?.team?.name || (access.isError.value ? '团队摘要暂时不可用' : '正在读取当前团队…')"
    description="看清每笔收支的来处与去向，让流水、权益核销和顾客余额相互衔接。"
    :actions="[{ key: 'personal', label: '进入个人工作台', to: '/personal', icon: UserRound, primary: true }]"
    :entries="entries"
  >
    <template #workspace>
      <div class="ledger-workspace">
        <LsPanel>
          <LsDashboardPath title="收支核对" description="从原始记录进入经营分析，核对收入、支出与调整。" :steps="[entries[0]!, entries[1]!]" />
        </LsPanel>
        <LsPanel>
          <LsDashboardPath title="权益与资金" description="核对服务履约和顾客预存余额，各项记录独立留痕。" :steps="[entries[2]!, entries[3]!]" />
        </LsPanel>
      </div>
      <LsPanel>
        <template #header><LsSectionHeader title="本次工作范围" description="团队经营记录集中查看，个人参与业务从个人工作台继续。" /></template>
        <LsDescriptionList><dt>当前团队</dt><dd>{{ access.data.value?.team?.name || '-' }}</dd><dt>当前身份</dt><dd>{{ access.data.value?.identity?.name || '-' }}</dd><dt>登记流水</dt><dd>进入个人工作台，记录本人参与的业务。</dd></LsDescriptionList>
      </LsPanel>
      <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />
    </template>
  </LsWorkspaceOverview>
</template>

<style scoped>
.ledger-workspace { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 899px) { .ledger-workspace { grid-template-columns: minmax(0, 1fr); } }
</style>
