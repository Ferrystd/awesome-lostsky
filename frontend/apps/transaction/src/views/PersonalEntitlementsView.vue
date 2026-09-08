<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { Gift } from '@lucide/vue'
import { NPagination } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, reactive } from 'vue'
import { dateTime } from '../lib'
import type { Pagination, PersonalEntitlementGrantRecord } from '../types'

const filters = reactive({ keyword: '', page: 1, limit: 20 })
const params = computed(() => ({
  keyword: filters.keyword.trim() || undefined,
  page: filters.page,
  limit: filters.limit,
}))
const query = useQuery({
  queryKey: computed(() => ['personal-entitlements', params.value]),
  queryFn: () => api.get<Pagination<PersonalEntitlementGrantRecord>>('/personal/entitlements', params.value),
})
const rows = computed(() => query.data.value?.list ?? [])
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))

function quantity(value: string, unit: string) {
  return `${value.replace(/\.?0+$/, '') || '0'} ${unit || '次'}`
}
function status(row: PersonalEntitlementGrantRecord) {
  if (row.is_expired) return { label: '已过期', type: 'error' as const }
  if (row.is_exhausted) return { label: '已用完', type: 'default' as const }
  return { label: '可使用', type: 'success' as const }
}
const columns: DataTableColumns<PersonalEntitlementGrantRecord> = [
  { title: '权益 / 商品', key: 'service', render: row => h('span', { class: 'entitlement-cell' }, [h('strong', row.service.name || `权益 #${row.id}`), h('small', row.product.name || '权益套餐')]) },
  { title: '顾客', key: 'customer', render: row => h(LsEntityIdentity, { type: 'customer', name: row.customer.name || `顾客 #${row.customer.id}`, imageUrl: row.customer.avatar ?? null, size: 'sm' }) },
  { title: '额度', key: 'quantity', render: row => h('span', { class: 'entitlement-cell ls-tabular' }, [h('strong', quantity(row.granted_quantity, row.unit_name)), h('small', `剩余 ${quantity(row.available_quantity, row.unit_name)}`)]) },
  { title: '状态', key: 'status', render: row => h(LsStatusTag, status(row)) },
  { title: '下发时间 / 到期', key: 'time', render: row => h('span', { class: 'entitlement-cell' }, [h('strong', dateTime(row.create_time)), h('small', row.expire_time ? `到期 ${dateTime(row.expire_time)}` : '永久有效')]) },
]
</script>

<template>
  <div class="personal-entitlements-view">
    <LsPageHeader title="权益下发" description="查看当前实体（Entity）直接下发给顾客的全部权益；每项记录均按本人发单身份固定归档。">
      <template #actions>
        <LsPagePrimaryAction :icon="Gift" label="下发权益" to="/personal/entitlements/new" />
      </template>
    </LsPageHeader>

    <LsListToolbar
      v-model="filters.keyword"
      placeholder="搜索权益、商品或顾客"
      aria-label="搜索本人下发的权益"
      :count-label="`${query.data.value?.total ?? 0} 项权益`"
      @update:model-value="filters.page = 1"
    />

    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取下发记录" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" />
    <LsEmptyState :source="query.data.value"
      v-else-if="!rows.length"
      :title="filters.keyword ? '没有匹配的下发记录' : '还没有下发权益'"
      :description="filters.keyword ? '调整搜索关键词后再试。' : '下发的顾客权益会显示在这里。'"
    />
    <LsResponsiveDataTable v-else :columns="columns" :data="rows" :row-key="row => Number(row.id)" :scroll-x="900">
      <template #mobile-title="{ row }">{{ row.service.name || `权益 #${row.id}` }}</template>
      <template #mobile-status="{ row }"><LsStatusTag v-bind="status(row)" /></template>
      <template #mobile="{ row }">
        <dl>
          <dt>来源商品</dt><dd>{{ row.product.name || '权益套餐' }}</dd>
          <dt>顾客</dt><dd>{{ row.customer.name || `顾客 #${row.customer.id}` }}</dd>
          <dt>下发额度</dt><dd class="ls-tabular">{{ quantity(row.granted_quantity, row.unit_name) }}</dd>
          <dt>剩余额度</dt><dd class="ls-tabular">{{ quantity(row.available_quantity, row.unit_name) }}</dd>
          <dt>下发时间</dt><dd>{{ dateTime(row.create_time) }}</dd>
          <dt>有效期</dt><dd>{{ row.expire_time ? dateTime(row.expire_time) : '永久有效' }}</dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
    <div v-if="query.data.value && Number(query.data.value.total) > 0" class="pager">
      <span>共 {{ query.data.value.total }} 项，第 {{ filters.page }} / {{ pages }} 页</span>
      <NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>

<style scoped>
.personal-entitlements-view{display:grid;gap:1.35rem}.personal-entitlements-view :deep(.entitlement-cell>*){display:block}.personal-entitlements-view :deep(.entitlement-cell small){margin-top:.15rem;color:var(--muted-ink);font-size:.75rem}
</style>
