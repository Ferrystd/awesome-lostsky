<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { friendlyError } from '@lostsky/api/client'
import LsSinglePanelPage from '@lostsky/ui/components/LsSinglePanelPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
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
  <LsSinglePanelPage
    :title="access.data.value?.team?.name || '记账团队工作台'"
    description="看清每笔收支的来处与去向，让流水、权益核销和顾客余额相互衔接。"
  >

    <section class="ledger-section" aria-labelledby="ledger-scope-title">
      <LsSectionHeader id="ledger-scope-title" title="本次工作范围" description="团队经营记录集中查看。" />
      <LsAsyncState v-if="access.isPending.value" state="loading" title="正在读取当前团队…" :rows="2" />
      <LsAsyncState v-else-if="access.isError.value" state="error" title="团队摘要暂时不可用" :description="friendlyError(access.error.value)" />
      <LsDescriptionList v-else><dt>当前团队</dt><dd>{{ access.data.value?.team?.name || '-' }}</dd><dt>当前身份</dt><dd>{{ access.data.value?.identity?.name || '-' }}</dd></LsDescriptionList>
    </section>
    <section class="ledger-section" aria-labelledby="ledger-operations-title">
      <LsSectionHeader id="ledger-operations-title" title="处理团队业务" description="从流水核对收支，继续处理权益履约与顾客预存。" />
      <LsResourceList>
        <LsResourceRow v-for="entry in entries" :key="entry.key" :title="entry.label" :description="entry.description" :to="entry.to" :icon="entry.icon" />
      </LsResourceList>
    </section>
    <section class="ledger-followup" aria-label="经营统计">
      <LsSectionHeader title="回看经营表现" description="按周期查看收入结构与业绩汇总，从记录进入分析。" />
      <LsPageLink to="/stats" :icon="BarChart3" label="查看经营统计" />
    </section>
    <section class="ledger-followup" aria-label="个人业务入口">
      <LsSectionHeader title="登记本人参与的业务" description="登记流水与个人参与业务，从个人工作台继续。" />
      <LsPageLink to="/personal" :icon="UserRound" label="进入个人工作台" />
    </section>
  </LsSinglePanelPage>
</template>

<style scoped>
.ledger-section { min-width: 0; display: grid; gap: 1rem; }
.ledger-followup { min-width: 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem 1.5rem; }
</style>
