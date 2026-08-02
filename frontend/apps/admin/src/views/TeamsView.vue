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
import { NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { h, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import type { Page, TeamSummary } from '../types'
import { formatTime } from '../utils'

const q = ref('')
const status = ref('')
const page = ref(1)
const options = [{ label: '全部状态', value: '' }, { label: '正常', value: 'active' }, { label: '已封禁', value: 'banned' }, { label: '已注销', value: 'cancelled' }]
const query = useQuery({ queryKey: ['admin-teams', q, status, page], queryFn: () => api.get<Page<TeamSummary>>('/teams', { q: q.value, status: status.value, page: page.value, limit: 20 }) })
const teamStatus = (team: TeamSummary): AdminStatus => team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'
const columns: DataTableColumns<TeamSummary> = [
  {
    title: '团队', key: 'team',
    render: team => h(RouterLink, { to: `/teams/${team.id}` }, {
      default: () => h(LsEntityIdentity, { type: 'team', name: team.name || team.slug, slug: team.slug, imageUrl: team.avatar ?? null, size: 'sm' }),
    }),
  },
  { title: '所有者', key: 'owner', render: team => team.owner_username || `#${team.user_id}` },
  { title: '成员', key: 'member_count' },
  { title: '状态', key: 'status', render: team => h(LsStatusTag, { label: adminStatusLabel(teamStatus(team)), type: adminStatusType(teamStatus(team)) }) },
  { title: '创建时间', key: 'create_time', render: team => formatTime(team.create_time) },
]
</script>

<template>
  <LsPageHeader title="团队" description="查看团队所有者、规模和运行状态；平台治理不修改团队内部业务数据。" />
  <LsListToolbar v-model="q" placeholder="搜索团队名称、slug、所有者或 ID" aria-label="搜索团队" :count-label="`${query.data.value?.total ?? 0} 个团队`" @update:model-value="page = 1">
    <template #filters><NSelect v-model:value="status" :options="options" @update:value="page = 1" /></template>
  </LsListToolbar>
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取团队" :description="friendlyError(query.error.value)" />
  <LsEmptyState v-else-if="!query.data.value?.list.length" title="没有匹配的团队" description="调整搜索词或状态筛选后重试。" />
  <template v-else>
    <LsResponsiveDataTable :columns="columns" :data="query.data.value.list" :row-key="row => row.id" :scroll-x="760">
      <template #mobile-title="{ row: team }"><RouterLink :to="`/teams/${team.id}`">{{ team.name || team.slug }}</RouterLink></template>
      <template #mobile-status="{ row: team }"><LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" /></template>
      <template #mobile="{ row: team }"><dl><dt>标识</dt><dd>{{ team.slug }}</dd><dt>所有者</dt><dd>{{ team.owner_username || `#${team.user_id}` }}</dd><dt>成员</dt><dd>{{ team.member_count }}</dd><dt>创建时间</dt><dd>{{ formatTime(team.create_time) }}</dd></dl></template>
    </LsResponsiveDataTable>
    <div class="pagination"><NPagination v-model:page="page" :page-size="20" :item-count="query.data.value.total" /></div>
  </template>
</template>
