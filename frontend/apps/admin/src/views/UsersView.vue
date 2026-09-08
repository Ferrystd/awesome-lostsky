<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { adminStatusLabel, adminStatusType } from '../status'
import type { Page, UserSummary } from '../types'
import { formatTime } from '../utils'

const q = ref('')
const status = ref('')
const page = ref(1)
const routeAccess = useRouteAccess()
const options = [{ label: '全部状态', value: '' }, { label: '正常', value: 'active' }, { label: '已封禁', value: 'banned' }]
const query = useQuery({
  queryKey: ['admin-users', q, status, page],
  queryFn: () => api.get<Page<UserSummary>>('/users', { q: q.value, status: status.value, page: page.value, limit: 20 }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const columns: DataTableColumns<UserSummary> = [
  {
    title: '用户', key: 'user',
    render: user => h('div', { class: 'cell-primary' }, [
      h(RouterLink, { to: `/users/${user.id}` }, { default: () => user.nickname || user.username }),
      h('small', `#${user.id} · @${user.username}`),
    ]),
  },
  { title: '联系方式', key: 'contact', render: user => user.phone || user.phone_masked || user.email || user.email_masked || '—' },
  { title: '团队', key: 'team_count' },
  { title: '设备', key: 'device_count' },
  {
    title: '状态', key: 'status',
    render: user => h(LsStatusTag, { label: adminStatusLabel(user.is_banned ? 'banned' : 'active'), type: adminStatusType(user.is_banned ? 'banned' : 'active') }),
  },
  { title: '注册时间', key: 'create_time', render: user => formatTime(user.create_time) },
]
</script>

<template>
  <LsPageHeader title="用户" description="查询平台账号、会话与团队归属；敏感联系方式按当前角色权限（Permission）展示。" />
  <LsListToolbar v-model="q" placeholder="搜索用户名、手机号、邮箱、昵称或 ID" aria-label="搜索用户" :count-label="routeAccess.restricted.value ? '0 位用户' : `${query.data.value?.total ?? 0} 位用户`" @update:model-value="page = 1">
    <template #filters><NSelect v-model:value="status" :options="options" @update:value="page = 1" /></template>
  </LsListToolbar>
  <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取用户" :description="friendlyError(query.error.value)" />
  <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有匹配的用户" description="调整搜索词或状态筛选后重试。" />
  <template v-else>
    <LsResponsiveDataTable :columns="columns" :data="query.data.value.list" :row-key="row => row.id" :scroll-x="860">
      <template #mobile-title="{ row: user }"><RouterLink :to="`/users/${user.id}`">{{ user.nickname || user.username }}</RouterLink></template>
      <template #mobile-status="{ row: user }"><LsStatusTag :label="adminStatusLabel(user.is_banned ? 'banned' : 'active')" :type="adminStatusType(user.is_banned ? 'banned' : 'active')" /></template>
      <template #mobile="{ row: user }"><dl><dt>用户 ID</dt><dd>#{{ user.id }}</dd><dt>联系方式</dt><dd>{{ user.phone || user.phone_masked || user.email || user.email_masked || '—' }}</dd><dt>团队 / 设备</dt><dd>{{ user.team_count }} / {{ user.device_count }}</dd><dt>注册时间</dt><dd>{{ formatTime(user.create_time) }}</dd></dl></template>
    </LsResponsiveDataTable>
    <div class="pagination"><NPagination v-model:page="page" :page-size="20" :item-count="query.data.value.total" /></div>
  </template>
</template>
