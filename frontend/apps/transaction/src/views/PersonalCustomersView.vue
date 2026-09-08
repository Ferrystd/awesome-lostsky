<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, reactive } from 'vue'
import { money } from '../lib'
import type { Pagination, PersonalCustomer } from '../types'

const filters = reactive({ keyword: '', page: 1, limit: 20 })
const params = computed(() => ({
  keyword: filters.keyword.trim() || undefined,
  page: filters.page,
  limit: filters.limit,
}))
const query = useQuery({
  queryKey: computed(() => ['personal-customers', params.value]),
  queryFn: () => api.get<Pagination<PersonalCustomer>>('/personal/customers', params.value),
})
const rows = computed(() => query.data.value?.list ?? [])
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))

function relationshipTags(row: PersonalCustomer) {
  const tags = []
  if (row.is_assignee) tags.push(h(LsStatusTag, { label: '当前归属', type: 'success' }))
  if (row.is_sender) tags.push(h(LsStatusTag, { label: '协作发单', type: 'info' }))
  return h('span', { class: 'relationship-tags' }, tags)
}

const columns: DataTableColumns<PersonalCustomer> = [
  { title: '顾客', key: 'customer', render: row => h(LsEntityIdentity, { type: 'customer', name: row.name || `顾客 #${row.id}`, slug: row.slug || '', imageUrl: row.avatar ?? null, size: 'sm' }) },
  { title: '与我的关系', key: 'relationship', render: relationshipTags },
  { title: '可用余额', key: 'balance', render: row => h('strong', { class: 'ls-tabular' }, money(row.balance?.balance)) },
  { title: '状态', key: 'status', render: row => h(LsStatusTag, { label: row.is_blocked ? '已封禁' : '正常', type: row.is_blocked ? 'error' : 'success' }) },
]
</script>

<template>
  <div class="personal-customers-view">
    <LsPageHeader title="我的顾客" description="汇总当前实体（Entity）负责或协作发单的顾客；同一顾客只显示一次，并标明每种关系。" />
    <LsListToolbar
      v-model="filters.keyword"
      placeholder="搜索顾客名称"
      aria-label="搜索我的顾客"
      :count-label="`${query.data.value?.total ?? 0} 位顾客`"
      @update:model-value="filters.page = 1"
    />
    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取我的顾客" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" />
    <LsEmptyState :source="query.data.value"
      v-else-if="!rows.length"
      :title="filters.keyword ? '没有匹配的顾客' : '还没有我的顾客'"
      :description="filters.keyword ? '调整搜索关键词后再试。' : '顾客归属当前实体，或将当前实体设为协作发单人后，会显示在这里。'"
    />
    <LsResponsiveDataTable v-else :columns="columns" :data="rows" :row-key="row => Number(row.id)" :scroll-x="760">
      <template #mobile-title="{ row }">{{ row.name || `顾客 #${row.id}` }}</template>
      <template #mobile-status="{ row }"><LsStatusTag :label="row.is_blocked ? '已封禁' : '正常'" :type="row.is_blocked ? 'error' : 'success'" /></template>
      <template #mobile="{ row }">
        <dl>
          <dt>与我的关系</dt>
          <dd class="relationship-tags"><LsStatusTag v-if="row.is_assignee" label="当前归属" type="success" /><LsStatusTag v-if="row.is_sender" label="协作发单" type="info" /></dd>
          <dt>可用余额</dt><dd class="ls-tabular">{{ money(row.balance?.balance) }}</dd>
          <dt>状态</dt><dd>{{ row.is_blocked ? '已封禁' : '正常' }}</dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
    <div v-if="query.data.value && Number(query.data.value.total) > 0" class="pager">
      <span>共 {{ query.data.value.total }} 位，第 {{ filters.page }} / {{ pages }} 页</span>
      <NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>

<style scoped>
.personal-customers-view{display:grid;gap:1.35rem}.relationship-tags{display:flex;flex-wrap:wrap;gap:.35rem}.pager{display:flex;align-items:center;justify-content:space-between;gap:1rem;color:var(--muted-ink);font-size:.82rem}@media(max-width:640px){.pager{align-items:flex-start;flex-direction:column}}
</style>
