<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
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
</script>

<template>
  <div class="balance-logs-view">
    <PageHeader :title="`${customerName(customer, customerId)}的余额明细`" description="按发生时间查看充值、消费、退款和手动调整。" back-to="/balances" back-label="返回客户余额">
      <template #actions><RouterLink class="primary-link" :to="`/recharge?customer_id=${customerId}`">为该客户充值</RouterLink></template>
    </PageHeader>
    <section v-if="customer" class="balance-summary panel"><span>当前可用余额</span><strong class="ls-tabular">{{ money(customer.balance?.balance) }}</strong><small>累计充值 {{ money(customer.balance?.recharged) }} · 累计消费 {{ money(customer.balance?.spent) }}</small></section>
    <p v-if="!customerId" class="feedback error">缺少客户 ID。</p>
    <p v-else-if="query.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <LsEmptyState v-else-if="!query.data.value?.list.length" title="还没有余额变动" description="充值或使用预存款后，记录会出现在这里。" />
    <div v-else class="table-wrap"><table class="data-table"><thead><tr><th>时间</th><th>类型</th><th>金额</th><th>变动后余额</th><th>备注</th></tr></thead><tbody><tr v-for="item in query.data.value.list" :key="item.id"><td>{{ dateTime(item.create_time) }}</td><td>{{ balanceLogType(item.type) }}</td><td :class="Number(item.amount) >= 0 ? 'amount-positive' : 'amount-negative'">{{ Number(item.amount) >= 0 ? '+' : '' }}{{ money(item.amount) }}</td><td class="ls-tabular">{{ money(item.balance_after) }}</td><td>{{ item.memo || '—' }}</td></tr></tbody></table></div>
    <div v-if="query.data.value?.total" class="pager"><span>共 {{ query.data.value.total }} 条</span><NPagination v-model:page="page" :page-count="pages" /></div>
  </div>
</template>

<style scoped>.balance-logs-view{display:grid;gap:1.25rem}.balance-summary{display:grid;padding:1.25rem}.balance-summary span,.balance-summary small{color:var(--muted-ink);font-size:.8rem}.balance-summary strong{font-size:1.8rem;line-height:1.35}</style>
