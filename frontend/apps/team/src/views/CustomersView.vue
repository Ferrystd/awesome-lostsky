<script setup lang="ts">
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsDirectoryIdentity from '@lostsky/ui/components/LsDirectoryIdentity.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import { computed, reactive } from 'vue'

import { hasPermission, useTeamAccess } from '../lib/teamAccess'

interface EntitySummary {
  entity_id: number
  slug: string
  type: string
  name: string
  avatar?: string | null
}
interface CustomerRow {
  id: number
  slug: string
  name: string
  avatar?: string | null
  description?: string | null
  is_blocked: boolean
  create_time: number
  balance: { balance: string; recharged: string; spent: string }
  assignee?: EntitySummary | null
}
interface CustomerPage {
  total: number
  list: CustomerRow[]
  page: number
  limit: number
  scope: 'own' | 'all'
}

const filters = reactive({
  keyword: '',
  assignee_entity_id: null as number | null,
  blocked: null as number | null,
  page: 1,
  limit: 20,
})
const access = useTeamAccess()
const canReadAll = computed(() => hasPermission(access.data.value, 'team.customer.read') || hasPermission(access.data.value, 'team.customer.manage'))
const params = computed(() => ({
  keyword: filters.keyword.trim() || undefined,
  assignee_entity_id: filters.assignee_entity_id,
  blocked: filters.blocked,
  page: filters.page,
  limit: filters.limit,
}))
const query = useQuery({
  queryKey: computed(() => ['team-customers', params.value]),
  queryFn: () => api.get<CustomerPage>('/customer', params.value),
})
const assignees = useQuery({
  queryKey: ['team-customer-assignees'],
  queryFn: () => api.get<EntitySummary[]>('/customer/assignees'),
  enabled: canReadAll,
})
const assigneeEntities = computed(() => [{ entity_id: 0, type: 'entity', name: '未归属', slug: null }, ...(assignees.data.value ?? [])])
const blockedOptions = [
  { label: '正常顾客', value: 0 },
  { label: '已封禁', value: 1 },
]
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))
const money = (value: string) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(Number(value))
const date = (value: number) =>
  new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
  }).format(value * 1000)
</script>

<template>
  <div class="customers-view">
    <LsObjectDirectory title="顾客" description="查找顾客、确认归属，进入详情维护资料或发起会话。">
      <template #toolbar>
        <LsListToolbar v-model="filters.keyword" placeholder="搜索顾客昵称" aria-label="搜索顾客" :count-label="query.data.value ? `${query.data.value.total} 位顾客` : ''" @update:model-value="filters.page = 1">
          <template #filters>
            <LsEntitySelect v-if="canReadAll" v-model="filters.assignee_entity_id" :entities="assigneeEntities" clearable placeholder="全部归属人" aria-label="筛选归属人" @update:model-value="filters.page = 1" />
            <NSelect v-model:value="filters.blocked" :options="blockedOptions" clearable placeholder="全部状态" aria-label="筛选顾客状态" @update:value="filters.page = 1" />
          </template>
        </LsListToolbar>
      </template>
      <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取顾客" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value" v-else-if="!query.data.value?.list.length" :title="filters.keyword || filters.assignee_entity_id !== null || filters.blocked !== null ? '没有匹配的顾客' : '还没有可查看的顾客'" :description="query.data.value?.scope === 'own' ? '归属于当前身份的顾客会出现在这里。' : '顾客领取团队商店身份后会进入顾客目录。'" />
      <LsResourceList v-else aria-label="顾客目录">
        <LsResourceRow v-for="customer in query.data.value.list" :key="customer.id" :to="`/customers/${customer.id}`">
          <template #identity>
            <LsDirectoryIdentity type="customer" :name="customer.name" :slug="customer.slug" :image-url="customer.avatar">
              <template #status><LsStatusTag :label="customer.is_blocked ? '已封禁' : '正常'" :type="customer.is_blocked ? 'error' : 'success'" /></template>
              <template #context><span>{{ customer.assignee ? `归属 ${customer.assignee.name} · @${customer.assignee.slug}` : '未归属' }}</span></template>
            </LsDirectoryIdentity>
          </template>
          <template #actions>
            <div class="customer-facts">
              <span>可用余额 <span class="ls-tabular">{{ money(customer.balance.balance) }}</span></span>
              <span>创建于 {{ date(customer.create_time) }}</span>
            </div>
          </template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value && query.data.value.total > 0" #pagination>
        <span>共 {{ query.data.value.total }} 位顾客，第 {{ filters.page }} / {{ pages }} 页</span>
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsObjectDirectory>
  </div>
</template>

<style scoped>
.customer-facts { display: grid; gap: .25rem; text-align: right; color: var(--text-secondary); font-size: .8125rem; line-height: 1.5; overflow-wrap: anywhere; }
</style>
