<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { SlidersHorizontal, ArrowUpRight } from '@lucide/vue'
import { NDatePicker, NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, reactive } from 'vue'

import { customerName, customerOptions, dateTime, entityName, money, transactionType } from '../lib'
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
const routeAccess = useRouteAccess()
const optionsQuery = useQuery({
  queryKey: ['transaction-options'],
  queryFn: () => api.get<TransactionOptions>('/transaction/options'),
  enabled: computed(() => !routeAccess.restricted.value),
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
  enabled: computed(() => !routeAccess.restricted.value),
})
const rows = computed(() => query.data.value?.list ?? [])
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))
const hasFilters = computed(() => Boolean(filters.keyword || filters.type || filters.handler_entity_id || filters.customer_id || filters.range))
const typeOptions = [{ label: '商城订单', value: 1 }, { label: '记账登记', value: 2 }, { label: '权益包收款', value: 3 }, { label: '权益核销', value: 4 }, { label: '未使用权益结单', value: 7 }]

function reset() {
  Object.assign(filters, { keyword: '', type: null, handler_entity_id: null, customer_id: null, range: null, page: 1 })
}
const columns: DataTableColumns<TransactionRecord> = [
  { title: '时间 / 类型', key: 'time', render: row => h('span', { class: 'transaction-cell' }, [h('strong', dateTime(row.trans_at)), h('small', transactionType(row.type))]) },
  { title: '顾客', key: 'customer', render: row => h(LsEntityIdentity, { type: 'customer', name: customerName(row.customer, row.customer_id), slug: String((row.customer as any)?.slug ?? ''), imageUrl: (row.customer as any)?.avatar ?? null, size: 'sm' }) },
  { title: '接单人', key: 'handler', render: row => h(LsEntityIdentity, { type: (row.handler as any)?.type ?? 'entity', name: entityName(row.handler, row.handler_entity_id), slug: String((row.handler as any)?.slug ?? ''), imageUrl: (row.handler as any)?.avatar ?? null, size: 'sm' }) },
  { title: '支付构成', key: 'payment', render: row => h('span', { class: 'transaction-cell' }, [h('span', `现款 ${money(row.cash)}`), h('small', `预存 ${money(row.prepaid)}`)]) },
  { title: '总价', key: 'total_price', render: row => h('strong', { class: 'ls-tabular' }, money(row.total_price)) },
  { title: '操作', key: 'actions', render: row => h(LsPageLink, { to: `/detail?id=${row.id}`, icon: ArrowUpRight, label: '查看' }) },
]
</script>

<template>
  <div class="transactions-view">
    <LsCollectionPage title="流水" description="实时查看团队流水，随时掌握收支情况。">
      <template #toolbar>
        <LsListToolbar v-model="filters.keyword" placeholder="搜索顾客昵称" aria-label="搜索流水顾客" :count-label="routeAccess.restricted.value ? '0 条流水' : `${query.data.value?.total ?? 0} 条流水`" @update:model-value="filters.page = 1">
          <template #filters>
            <NDatePicker v-model:value="filters.range" type="daterange" clearable start-placeholder="开始日期" end-placeholder="结束日期" @update:value="filters.page = 1" />
            <NSelect v-model:value="filters.type" :options="typeOptions" clearable placeholder="全部类型" @update:value="filters.page = 1" />
            <LsEntitySelect v-model="filters.handler_entity_id" :entities="optionsQuery.data.value?.entities ?? []" :loading="optionsQuery.isPending.value" :disabled="optionsQuery.isError.value" clearable placeholder="全部接单人" @update:model-value="filters.page = 1" />
            <NSelect v-model:value="filters.customer_id" :options="customerOptions(optionsQuery.data.value)" filterable clearable placeholder="全部顾客" @update:value="filters.page = 1" />
          </template>
          <template v-if="hasFilters" #actions>
            <LsButton variant="secondary" size="sm" @click="reset"><template #icon><SlidersHorizontal :size="17" /></template>清除筛选</LsButton>
          </template>
        </LsListToolbar>
      </template>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取流水" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !rows.length"
      :title="routeAccess.restricted.value ? '没有可显示的流水' : hasFilters ? '没有匹配的流水' : '还没有流水'"
      :description="hasFilters ? '调整筛选条件后再试。' : '登记第一笔流水后，这里会按交易时间展示记录。'"
      />
      <LsResponsiveDataTable v-else :columns="columns" :data="rows" :row-key="row => Number(row.id)" :scroll-x="940">
        <template #mobile-title="{ row }">{{ dateTime(row.trans_at) }} · {{ transactionType(row.type) }}</template>
        <template #mobile="{ row }">
          <dl>
            <dt>顾客</dt>
            <dd>{{ customerName(row.customer, row.customer_id) }}</dd>
            <dt>接单人</dt>
            <dd>{{ entityName(row.handler, row.handler_entity_id) }}</dd>
            <dt>现金 / 预存</dt>
            <dd class="ls-tabular">{{ money(row.cash) }} / {{ money(row.prepaid) }}</dd>
            <dt>总价</dt>
            <dd class="ls-tabular">
              <strong>{{ money(row.total_price) }}</strong>
            </dd>
            <dt>操作</dt>
            <dd>
              <LsPageLink :to="`/detail?id=${row.id}`" :icon="ArrowUpRight" label="查看" />
            </dd>
          </dl>
        </template>
      </LsResponsiveDataTable>
      <template v-if="query.data.value && Number(query.data.value.total) > 0" #pagination>
        <span>共 {{ query.data.value.total }} 条，第 {{ filters.page }} / {{ pages }} 页</span>
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsCollectionPage>
  </div>
</template>

<style scoped>
.transactions-view :deep(.transaction-cell>*){display:block}.transactions-view :deep(.transaction-cell small){margin-top:.15rem;color:var(--muted-ink);font-size:.75rem}
</style>
