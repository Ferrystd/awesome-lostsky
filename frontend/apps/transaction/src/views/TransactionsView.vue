<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { CirclePlus, ListChecks, Search, SlidersHorizontal } from '@lucide/vue'
import { NButton, NDatePicker, NInput, NSelect } from 'naive-ui'
import { computed, reactive } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { customerName, customerOptions, dateTime, entityName, entityOptions, money, transactionType } from '../lib'
import type { Pagination, TransactionOptions, TransactionRecord } from '../types'

const filters = reactive({
  keyword: '',
  type: null as number | null,
  handler_entity_id: null as number | null,
  customer_id: null as number | null,
  range: null as [number, number] | null,
  page: 1,
  limit: 20,
})
const optionsQuery = useQuery({
  queryKey: ['transaction-options'],
  queryFn: () => api.get<TransactionOptions>('/transaction/options'),
})
const params = computed(() => ({
  keyword: filters.keyword.trim() || undefined,
  type: filters.type,
  handler_entity_id: filters.handler_entity_id,
  customer_id: filters.customer_id,
  start_time: filters.range ? Math.floor(filters.range[0] / 1000) : undefined,
  end_time: filters.range ? Math.floor(filters.range[1] / 1000) + 1 : undefined,
  page: filters.page,
  limit: filters.limit,
}))
const query = useQuery({
  queryKey: computed(() => ['transactions', params.value]),
  queryFn: () => api.get<Pagination<TransactionRecord>>('/transaction', params.value),
})
const rows = computed(() => query.data.value?.list ?? [])
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))
const hasFilters = computed(() => Boolean(filters.keyword || filters.type || filters.handler_entity_id || filters.customer_id || filters.range))
const typeOptions = [{ label: '商城订单', value: 1 }, { label: '记账登记', value: 2 }]

function reset() {
  Object.assign(filters, { keyword: '', type: null, handler_entity_id: null, customer_id: null, range: null, page: 1 })
}
</script>

<template>
  <div class="transactions-view">
    <PageHeader title="流水" description="按时间查看收入构成与参与方；创建、查看和编辑均在独立任务页完成。">
      <template #actions>
        <RouterLink class="primary-link" to="/new"><CirclePlus :size="18" />登记流水</RouterLink>
      </template>
    </PageHeader>

    <section class="filters panel" aria-label="筛选流水">
      <label class="search">
        <Search :size="18" aria-hidden="true" />
        <span class="ls-sr-only">搜索客户</span>
        <NInput v-model:value="filters.keyword" clearable placeholder="搜索客户昵称" @update:value="filters.page = 1" />
      </label>
      <NDatePicker v-model:value="filters.range" type="daterange" clearable start-placeholder="开始日期" end-placeholder="结束日期" @update:value="filters.page = 1" />
      <NSelect v-model:value="filters.type" :options="typeOptions" clearable placeholder="全部类型" @update:value="filters.page = 1" />
      <NSelect v-model:value="filters.handler_entity_id" :options="entityOptions(optionsQuery.data.value)" filterable clearable placeholder="全部接单人" @update:value="filters.page = 1" />
      <NSelect v-model:value="filters.customer_id" :options="customerOptions(optionsQuery.data.value)" filterable clearable placeholder="全部客户" @update:value="filters.page = 1" />
      <NButton v-if="hasFilters" secondary @click="reset"><SlidersHorizontal :size="17" />清除筛选</NButton>
    </section>

    <p v-if="query.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 6" :key="i" /></div>
    <section v-else-if="!rows.length" class="empty">
      <ListChecks :size="34" />
      <h3>{{ hasFilters ? '没有匹配的流水' : '还没有流水' }}</h3>
      <p>{{ hasFilters ? '调整筛选条件后再试。' : '登记第一笔流水后，这里会按交易时间展示记录。' }}</p>
      <RouterLink v-if="!hasFilters" class="primary-link" to="/new">登记第一笔流水</RouterLink>
    </section>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>时间 / 类型</th><th>客户</th><th>接单人</th><th>支付构成</th><th>总价</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="item in rows" :key="item.id">
            <td><strong>{{ dateTime(item.trans_at) }}</strong><small>{{ transactionType(item.type) }}</small></td>
            <td>{{ customerName(item.customer, item.customer_id) }}</td>
            <td>{{ entityName(item.handler, item.handler_entity_id) }}</td>
            <td class="optional-column"><span>现款 {{ money(item.cash) }}</span><small>预存 {{ money(item.prepaid) }}</small></td>
            <td class="ls-tabular amount">{{ money(item.total_price) }}</td>
            <td><RouterLink :to="`/detail?id=${item.id}`">查看</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="query.data.value && Number(query.data.value.total) > 0" class="pager">
      <span>共 {{ query.data.value.total }} 条，第 {{ filters.page }} / {{ pages }} 页</span>
      <div class="pager-actions">
        <button type="button" :disabled="filters.page <= 1" @click="filters.page--">上一页</button>
        <button type="button" :disabled="filters.page >= pages" @click="filters.page++">下一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transactions-view{display:grid;gap:1.35rem}.filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:center;gap:.65rem;padding:.8rem}.filters .search{display:flex;align-items:center;gap:.35rem}.filters .search :deep(.n-input){flex:1}.filters :deep(.n-date-picker){grid-column:span 2}.data-table strong,.data-table small,.data-table span{display:block}.data-table strong{font-size:.84rem}.data-table small{margin-top:.15rem;color:var(--muted-ink);font-size:.75rem}.amount{font-weight:750;white-space:nowrap}@media(max-width:700px){.filters{grid-template-columns:1fr}.filters>*{width:100%;min-width:0}.filters :deep(.n-date-picker){grid-column:auto}.data-table th:nth-child(3),.data-table td:nth-child(3){display:none}}
</style>
