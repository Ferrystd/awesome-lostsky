<script setup lang="ts">
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { Gift } from '@lucide/vue'
import { NPagination } from 'naive-ui'
import { computed, reactive } from 'vue'
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
</script>

<template>
  <div class="personal-entitlements-view">
    <LsObjectDirectory title="权益下发" description="查看当前人员直接下发给顾客的全部权益；每项记录均按本人发单身份固定归档。">
      <template #actions>
        <LsPageLink :icon="Gift" label="下发权益" to="/personal/entitlements/new" />
      </template>
      <template #toolbar>
        <LsListToolbar
        v-model="filters.keyword"
        placeholder="搜索权益、商品或顾客"
        aria-label="搜索本人下发的权益"
        :count-label="`${query.data.value?.total ?? 0} 项权益`"
        @update:model-value="filters.page = 1"
        />
      </template>
      <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取下发记录" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value"
      v-else-if="!rows.length"
      :title="filters.keyword ? '没有匹配的下发记录' : '还没有下发权益'"
      :description="filters.keyword ? '调整搜索关键词后再试。' : '下发的顾客权益会显示在这里。'"
      />
      <LsResourceList v-else aria-label="权益下发记录">
        <LsResourceRow v-for="row in rows" :key="row.id" :title="row.service.name || `权益 #${row.id}`" :description="`${row.product.name || '权益套餐'} · 顾客 ${row.customer.name || `顾客 #${row.customer.id}`} · 下发 ${quantity(row.granted_quantity, row.unit_name)} · 剩余 ${quantity(row.available_quantity, row.unit_name)}`">
          <template #status><LsStatusTag v-bind="status(row)" /></template>
          <template #metadata><LsEntityIdentity type="customer" :name="row.customer.name || `顾客 #${row.customer.id}`" :image-url="row.customer.avatar ?? null" size="sm" /><span>下发于 {{ dateTime(row.create_time) }}</span><span>{{ row.expire_time ? `到期 ${dateTime(row.expire_time)}` : '永久有效' }}</span></template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value && Number(query.data.value.total) > 0" #pagination>
        <span>共 {{ query.data.value.total }} 项，第 {{ filters.page }} / {{ pages }} 页</span>
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsObjectDirectory>
  </div>
</template>
