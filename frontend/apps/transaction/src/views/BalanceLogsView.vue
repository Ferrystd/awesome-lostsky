<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useQuery } from '@tanstack/vue-query'
import { CircleDollarSign } from '@lucide/vue'
import { NPagination } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import { balanceLogType, customerName, dateTime, money } from '../lib'
import type { BalanceLog, Pagination, TransactionOptions } from '../types'

const route = useRoute()
const customerId = computed(() => Number(route.query.customer_id || 0))
const page = ref(1)
const options = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options') })
const customer = computed(() => (options.data.value?.customers ?? []).find(item => Number(item.id) === customerId.value))
const query = useQuery({
  queryKey: computed(() => ['balance-logs', customerId.value, page.value]),
  queryFn: () => api.get<Pagination<BalanceLog>>('/transaction/balance/logs', { customer_id: customerId.value, page: page.value, limit: 20 }),
  enabled: computed(() => customerId.value > 0),
})
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)))
const columns: DataTableColumns<BalanceLog> = [
  { title: '时间', key: 'create_time', render: row => dateTime(row.create_time) },
  { title: '类型', key: 'type', render: row => balanceLogType(row.type) },
  { title: '金额', key: 'amount', render: row => h('strong', { class: Number(row.amount) >= 0 ? 'amount-positive' : 'amount-negative' }, `${Number(row.amount) >= 0 ? '+' : ''}${money(row.amount)}`) },
  { title: '变动后余额', key: 'balance_after', render: row => h('span', { class: 'ls-tabular' }, money(row.balance_after)) },
  { title: '备注', key: 'memo', render: row => row.memo || '—' },
]
</script>

<template>
  <div class="balance-logs-view">
    <LsPageHeader :title="`${customerName(customer, customerId)}的余额明细`" description="按发生时间查看充值、消费、退款和手动调整。" back-to="/balances" back-label="返回顾客余额">
      <template #actions><LsPagePrimaryAction :icon="CircleDollarSign" label="为该顾客充值" :to="`/recharge?customer_id=${customerId}`" /></template>
    </LsPageHeader>
    <LsPanel v-if="customer"><section class="balance-summary"><span>当前可用余额</span><strong class="ls-tabular">{{ money(customer.balance?.balance) }}</strong><small>累计充值 {{ money(customer.balance?.recharged) }} · 累计消费 {{ money(customer.balance?.spent) }}</small></section></LsPanel>
    <LsInlineError v-if="!customerId" message="缺少顾客 ID。" />
    <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取余额明细" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="5" />
    <LsEmptyState v-else-if="!query.data.value?.list.length" title="还没有余额变动" description="充值或使用预存款后，记录会出现在这里。" />
    <LsResponsiveDataTable v-else :columns="columns" :data="query.data.value.list" :row-key="row => Number(row.id)" :scroll-x="700">
      <template #mobile-title="{ row }">{{ dateTime(row.create_time) }} · {{ balanceLogType(row.type) }}</template>
      <template #mobile="{ row }">
        <dl>
          <dt>金额</dt><dd :class="Number(row.amount) >= 0 ? 'amount-positive' : 'amount-negative'">{{ Number(row.amount) >= 0 ? '+' : '' }}{{ money(row.amount) }}</dd>
          <dt>变动后余额</dt><dd class="ls-tabular">{{ money(row.balance_after) }}</dd>
          <dt>备注</dt><dd>{{ row.memo || '—' }}</dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
    <div v-if="query.data.value?.total" class="pager"><span>共 {{ query.data.value.total }} 条</span><NPagination v-model:page="page" :page-count="pages" /></div>
  </div>
</template>

<style scoped>.balance-logs-view{display:grid;gap:1.25rem}.balance-summary{display:grid;padding:1.25rem}.balance-summary span,.balance-summary small{color:var(--muted-ink);font-size:.8rem}.balance-summary strong{font-size:1.8rem;line-height:1.35}</style>
