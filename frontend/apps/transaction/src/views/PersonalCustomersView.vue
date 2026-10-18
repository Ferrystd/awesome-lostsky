<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination } from 'naive-ui'
import { computed, reactive } from 'vue'
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


</script>

<template>
  <div class="personal-customers-view">
    <LsObjectDirectory title="我的顾客" description="汇总当前人员负责或协作发单的顾客；同一顾客只显示一次，并标明每种关系。">
      <template #toolbar>
        <LsListToolbar embedded
        v-model="filters.keyword"
        placeholder="搜索顾客名称"
        aria-label="搜索我的顾客"
        :count-label="`${query.data.value?.total ?? 0} 位顾客`"
        @update:model-value="filters.page = 1"
        />
      </template>
      <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取我的顾客" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value"
      v-else-if="!rows.length"
      :title="filters.keyword ? '没有匹配的顾客' : '还没有我的顾客'"
      :description="filters.keyword ? '调整搜索关键词后再试。' : '顾客归属当前人员，或将当前人员设为协作发单人后，会显示在这里。'"
      />
      <LsResourceList v-else aria-label="我的顾客列表">
        <LsResourceRow v-for="row in rows" :key="row.id">
          <template #identity><LsEntityIdentity type="customer" :name="row.name || `顾客 #${row.id}`" :slug="row.slug || ''" :image-url="row.avatar ?? null" size="sm" /></template>
          <template #metadata><LsStatusTag v-if="row.is_assignee" label="当前归属" type="success" /><LsStatusTag v-if="row.is_sender" label="协作发单" type="info" /><LsStatusTag :label="row.is_blocked ? '已封禁' : '正常'" :type="row.is_blocked ? 'error' : 'success'" /><span>可用余额 {{ money(row.balance?.balance) }}</span></template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value && Number(query.data.value.total) > 0" #pagination>
        <span>共 {{ query.data.value.total }} 位，第 {{ filters.page }} / {{ pages }} 页</span>
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsObjectDirectory>
  </div>
</template>

