<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { hasPermission, useTeamAccess } from '../lib/teamAccess'
import type { EntityType } from '@lostsky/ui/entity'

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
const canReadAll = computed(() => hasPermission(access.data.value, 'team.customer.read')
  || hasPermission(access.data.value, 'team.customer.manage'))
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
const assigneeOptions = computed(() => [
  { label: '未归属', value: 0 },
  ...(assignees.data.value ?? []).map(item => ({
    label: `${item.name} · @${item.slug}`,
    value: item.entity_id,
  })),
])
const blockedOptions = [
  { label: '正常客户', value: 0 },
  { label: '已封禁', value: 1 },
]
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))
const money = (value: string) => new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
}).format(Number(value))
const date = (value: number) => new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
}).format(value * 1000)
const columns: DataTableColumns<CustomerRow> = [
  { title: '客户', key: 'customer', render: item => h(LsEntityIdentity, { type: 'customer', name: item.name, slug: item.slug, imageUrl: item.avatar ?? null, size: 'sm' }) },
  { title: '当前归属', key: 'assignee', render: item => item.assignee ? h(LsEntityIdentity, { type: item.assignee.type as EntityType, name: item.assignee.name, slug: item.assignee.slug, imageUrl: item.assignee.avatar ?? null, size: 'sm' }) : '未归属' },
  { title: '可用余额', key: 'balance', render: item => h('span', { class: 'ls-tabular' }, money(item.balance.balance)) },
  { title: '创建时间', key: 'create_time', render: item => date(item.create_time) },
  { title: '状态', key: 'status', render: item => h(LsStatusTag, { label: item.is_blocked ? '已封禁' : '正常', type: item.is_blocked ? 'error' : 'success' }) },
  { title: '操作', key: 'actions', render: item => h(RouterLink, { to: `/customers/${item.id}` }, { default: () => '查看详情' }) },
]
</script>

<template>
  <div class="customers-view">
    <AdminPageHeader
      title="客户"
      :description="query.data.value?.scope === 'own'
        ? '这里显示当前归属于你的客户；完整客户目录需要客户读取权限。'
        : '查看团队客户、当前归属与余额状态，进入详情后执行维护或发起会话。'"
    />

    <LsListToolbar v-model="filters.keyword" placeholder="搜索客户昵称" aria-label="搜索客户" :count-label="`${query.data.value?.total ?? 0} 位客户`" @update:model-value="filters.page = 1">
      <template #filters>
      <NSelect
        v-if="canReadAll"
        v-model:value="filters.assignee_entity_id"
        :options="assigneeOptions"
        clearable
        filterable
        placeholder="全部归属人"
        @update:value="filters.page = 1"
      />
      <NSelect
        v-model:value="filters.blocked"
        :options="blockedOptions"
        clearable
        placeholder="全部状态"
        @update:value="filters.page = 1"
      />
      </template>
    </LsListToolbar>

    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取客户" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" />
    <LsEmptyState
      v-else-if="!query.data.value?.list.length"
      :title="filters.keyword || filters.assignee_entity_id !== null || filters.blocked !== null ? '没有匹配的客户' : '还没有可查看的客户'"
      :description="query.data.value?.scope === 'own' ? '归属于当前身份的客户会出现在这里。' : '客户领取团队商店身份后会进入客户目录。'"
    />
    <LsResponsiveDataTable v-else :columns="columns" :data="query.data.value.list" :row-key="row => row.id" :scroll-x="920">
      <template #mobile-title="{ row: customer }">
        <RouterLink :to="`/customers/${customer.id}`">{{ customer.name }}</RouterLink>
      </template>
      <template #mobile-status="{ row: customer }">
        <LsStatusTag :label="customer.is_blocked ? '已封禁' : '正常'" :type="customer.is_blocked ? 'error' : 'success'" />
      </template>
      <template #mobile="{ row: customer }">
        <LsEntityIdentity type="customer" :name="customer.name" :slug="customer.slug" :image-url="customer.avatar ?? null" size="sm" />
        <dl>
          <dt>当前归属</dt><dd>{{ customer.assignee ? `${customer.assignee.name} · @${customer.assignee.slug}` : '未归属' }}</dd>
          <dt>可用余额</dt><dd class="ls-tabular">{{ money(customer.balance.balance) }}</dd>
          <dt>创建时间</dt><dd>{{ date(customer.create_time) }}</dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
    <div v-if="query.data.value && query.data.value.total > 0" class="pager">
      <span>共 {{ query.data.value.total }} 位客户，第 {{ filters.page }} / {{ pages }} 页</span>
      <NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>

<style scoped>
.customers-view{display:grid;gap:1.5rem}
.pager{display:flex;align-items:center;justify-content:space-between;gap:1rem;color:var(--muted-ink);font-size:.82rem}
@media(max-width:760px){.pager{align-items:stretch;flex-direction:column}.pager div{display:grid;grid-template-columns:1fr 1fr}}
</style>
