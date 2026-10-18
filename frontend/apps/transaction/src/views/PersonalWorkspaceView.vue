<script setup lang="ts">
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CirclePlus } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PersonalServiceLists from '../components/PersonalServiceLists.vue'

const route = useRoute()
const client = useQueryClient()
const section = computed(() => String(route.meta.personalSection ?? 'transactions'))
const endpoint = computed(() => ({ transactions: '/personal/transactions', services: '/personal/services' })[section.value] || '/personal/transactions')
const title = computed(() => ({ transactions: '我的流水', services: '我的接单' })[section.value] || '个人记账')
const query = useQuery({ queryKey: computed(() => ['transaction-personal', section.value]), queryFn: () => api.get<any>(endpoint.value) })
const statsQuery = useQuery({
  queryKey: ['transaction-personal', 'stats'],
  queryFn: () => api.get<any>('/personal/stats'),
  enabled: computed(() => section.value === 'transactions'),
})
const rows = computed(() => Array.isArray(query.data.value) ? query.data.value : query.data.value?.list ?? [])
const available = computed(() => section.value === 'services' ? query.data.value?.available ?? [] : [])
const offers = computed(() => section.value === 'services' ? query.data.value?.offers ?? [] : [])
const actionError = ref('')
const action = useMutation({
  mutationFn: (input: { path: string; body?: Record<string, unknown> }) => api.post(input.path, input.body ?? {}),
  onSuccess: async () => {
    actionError.value = ''
    await client.invalidateQueries({ queryKey: ['transaction-personal', 'services'] })
  },
  onError: error => actionError.value = friendlyError(error),
})
const money = (value: unknown) => `¥${Number(value || 0).toFixed(2)}`
const personalMetricItems = computed(() => [
  { key: 'handler', label: '总接单数', value: statsQuery.data.value?.handler_count ?? 0 },
  { key: 'sender', label: '总发单数', value: statsQuery.data.value?.sender_count ?? 0 },
  { key: 'cs', label: '总接待数', value: statsQuery.data.value?.cs_count ?? 0 },
  { key: 'monthly-performance', label: '月度业绩', value: money(statsQuery.data.value?.monthly_performance_total) },
  { key: 'monthly-flow', label: '月度流水', value: money(statsQuery.data.value?.monthly_flow_total) },
  { key: 'performance', label: '个人业绩', value: money(statsQuery.data.value?.performance_total) },
])
</script>

<template>
  <div class="personal-workspace">
    <LsObjectDirectory :title="title" :description="section === 'services' ? '确认指定邀请，登记信息并接单核销，并管理当前人员已结单的履约任务。' : '汇总当前人员参与的流水与业绩。'">
      <template v-if="section === 'transactions'" #actions>
        <LsPageLink :icon="CirclePlus" label="登记流水" to="/personal/transactions/new" />
      </template>
      <template #toolbar><LsListToolbar embedded :searchable="false" :count-label="section === 'services' ? `${offers.length + available.length + rows.length} 项任务` : `${rows.length} 条流水`" /></template>
      <LsAsyncState v-if="query.isPending.value || (section === 'transactions' && statsQuery.isPending.value)" state="loading" :rows="5" />
      <LsAsyncState v-else-if="query.isError.value || (section === 'transactions' && statsQuery.isError.value)" state="error" title="暂时无法读取" :description="friendlyError(query.error.value || statsQuery.error.value)" />
      <template v-else-if="section === 'services'">
        <PersonalServiceLists :offers="offers" :available="available" :assigned="rows" :acting="action.isPending.value" @return-task="(id, reason) => action.mutate({ path: `/personal/services/${id}/return`, body: { reason } })" />
        <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>
      </template>
      <template v-else>
        <LsPanel>
          <LsMetricGrid :items="personalMetricItems" aria-label="个人流水统计" />
        </LsPanel>
        <LsEmptyState :source="query.data.value" v-if="!rows.length" title="暂无相关记录" description="当前人员参与业务后，流水会显示在这里。" />
        <LsResourceList v-else aria-label="我的流水列表">
          <LsResourceRow v-for="(row, index) in rows" :key="row.id ?? index" :to="row.id ? `/personal/transactions/${row.id}` : undefined" :title="row.product_name || row.customer?.profile?.name || row.customer?.nickname || `记录 #${row.id ?? index + 1}`">
            <template #metadata>
              <span>{{ money(row.total_price) }}</span>
            </template>
          </LsResourceRow>
        </LsResourceList>
      </template>
    </LsObjectDirectory>
  </div>
</template>

<style scoped>
.action-error { margin: 0; color: var(--danger); }
</style>
