<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowUpRight, CirclePlus } from '@lucide/vue'
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
    <LsPageHeader :title="title" :description="section === 'services' ? '确认指定邀请，登记信息并接单核销，并管理当前人员已结单的履约任务。' : '汇总当前人员参与的流水与业绩。'">
      <template v-if="section === 'transactions'" #actions>
        <LsPagePrimaryAction :icon="CirclePlus" label="登记流水" to="/personal/transactions/new" />
      </template>
    </LsPageHeader>

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
      <div v-else class="record-list">
        <article v-for="(row, index) in rows" :key="row.id ?? index">
          <strong>{{ row.product_name || row.customer?.profile?.name || row.customer?.nickname || `记录 #${row.id ?? index + 1}` }}</strong>
          <span class="record-amount">{{ money(row.total_price) }}</span>
          <RouterLink
            v-if="row.id"
            class="record-detail-link"
            :to="`/personal/transactions/${row.id}`"
            :aria-label="`查看流水 ${row.id} 详情`"
          >
            查看详情<ArrowUpRight :size="16" aria-hidden="true" />
          </RouterLink>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.personal-workspace{display:grid;gap:1rem}.record-list{overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md)}.record-list article{min-height:64px;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:1rem;padding:.8rem 1rem;border-bottom:1px solid var(--border)}.record-list article:last-child{border-bottom:0}.record-list strong{min-width:0;overflow-wrap:anywhere}.record-amount{color:var(--muted-ink);font-variant-numeric:tabular-nums}.record-detail-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.35rem;color:var(--primary);font-size:.84rem;font-weight:700}.record-detail-link:hover{text-decoration:underline}.record-detail-link:focus-visible{outline:2px solid var(--sky-lost-strong);outline-offset:3px;border-radius:var(--radius-sm)}.action-error{margin:0;color:var(--danger)}@media(max-width:640px){.record-list article{grid-template-columns:minmax(0,1fr) auto;gap:.35rem 1rem}.record-list strong{grid-column:1/-1}.record-detail-link{justify-content:flex-end}}
</style>
