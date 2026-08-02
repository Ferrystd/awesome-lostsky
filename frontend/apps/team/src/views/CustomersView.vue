<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect, NTag } from 'naive-ui'
import { computed, reactive } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
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

    <p v-if="query.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list" aria-label="正在加载客户"><span v-for="i in 6" :key="i" /></div>
    <LsEmptyState
      v-else-if="!query.data.value?.list.length"
      :title="filters.keyword || filters.assignee_entity_id !== null || filters.blocked !== null ? '没有匹配的客户' : '还没有可查看的客户'"
      :description="query.data.value?.scope === 'own' ? '客户通过你的邀请链接领取身份后会出现在这里。' : '客户领取团队商店身份后会进入客户目录。'"
    />
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead><tr><th>客户</th><th>当前归属</th><th>可用余额</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="item in query.data.value.list" :key="item.id">
            <td><strong>{{ item.name }}</strong><small>@{{ item.slug }}</small></td>
            <td>{{ item.assignee?.name || '未归属' }}<small v-if="item.assignee">@{{ item.assignee.slug }}</small></td>
            <td class="ls-tabular">{{ money(item.balance.balance) }}</td>
            <td>{{ date(item.create_time) }}</td>
            <td><NTag :type="item.is_blocked ? 'error' : 'success'" size="small" :bordered="false">{{ item.is_blocked ? '已封禁' : '正常' }}</NTag></td>
            <td><RouterLink :to="`/customers/${item.id}`">查看详情</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="query.data.value && query.data.value.total > 0" class="pager">
      <span>共 {{ query.data.value.total }} 位客户，第 {{ filters.page }} / {{ pages }} 页</span>
      <NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>

<style scoped>
.customers-view{display:grid;gap:1.5rem}
.filters{display:grid;grid-template-columns:minmax(16rem,2fr) repeat(2,minmax(10rem,1fr));gap:.75rem;padding:.85rem;background:white;border:1px solid var(--line);border-radius:12px}.search{display:flex;align-items:center;gap:.45rem}.search :deep(.n-input){flex:1}.data-table strong,.data-table small{display:block}.data-table small{margin-top:.15rem;color:var(--muted-ink);font-size:.74rem}.pager{display:flex;align-items:center;justify-content:space-between;gap:1rem;color:var(--muted-ink);font-size:.82rem}
@media(max-width:760px){.filters{grid-template-columns:1fr}.table-wrap th:nth-child(3),.table-wrap td:nth-child(3),.table-wrap th:nth-child(4),.table-wrap td:nth-child(4){display:none}.pager{align-items:stretch;flex-direction:column}.pager div{display:grid;grid-template-columns:1fr 1fr}}
</style>
