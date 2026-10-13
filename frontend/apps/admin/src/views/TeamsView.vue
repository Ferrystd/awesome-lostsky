<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'

import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import type { Page, TeamSummary } from '../types'
import { formatTime } from '../utils'

const q = ref('')
const status = ref('')
const page = ref(1)
const routeAccess = useRouteAccess()
const options = [{ label: '全部状态', value: '' }, { label: '正常', value: 'active' }, { label: '已封禁', value: 'banned' }, { label: '已注销', value: 'cancelled' }]
const query = useQuery({ queryKey: ['admin-teams', q, status, page], queryFn: () => api.get<Page<TeamSummary>>('/teams', { q: q.value, status: status.value, page: page.value, limit: 20 }), enabled: computed(() => !routeAccess.restricted.value) })
const teamStatus = (team: TeamSummary): AdminStatus => team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'
const columns: DataTableColumns<TeamSummary> = [
  {
    title: '团队', key: 'team',
    render: team => h('div', { class: 'cell-primary' }, [
      h(LsEntityIdentity, { type: 'team', name: team.name || team.slug, slug: team.slug, imageUrl: team.avatar ?? null, size: 'sm' }),
      h(LsPageLink, { to: `/teams/${team.id}`, icon: ArrowUpRight, label: '查看团队' }),
    ]),
  },
  { title: '所有者', key: 'owner', render: team => team.owner_username || `#${team.user_id}` },
  { title: '成员', key: 'member_count' },
  { title: '状态', key: 'status', render: team => h(LsStatusTag, { label: adminStatusLabel(teamStatus(team)), type: adminStatusType(teamStatus(team)) }) },
  { title: '创建时间', key: 'create_time', render: team => formatTime(team.create_time) },
]
</script>

<template>
  <LsCollectionPage title="团队" description="查看团队所有者、规模和运行状态；平台治理不修改团队内部业务数据。">
    <template #toolbar>
      <LsListToolbar v-model="q" placeholder="搜索团队名称、slug、所有者或 ID" aria-label="搜索团队" :count-label="routeAccess.restricted.value ? '0 个团队' : `${query.data.value?.total ?? 0} 个团队`" @update:model-value="page = 1">
        <template #filters>
          <NSelect v-model:value="status" :options="options" @update:value="page = 1" />
        </template>
      </LsListToolbar>
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取团队" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有可显示的团队" description="调整搜索词或状态筛选后重试。" />
    <LsResponsiveDataTable v-else :columns="columns" :data="query.data.value.list" :row-key="row => row.id" :scroll-x="760">
      <template #mobile-title="{ row: team }">
        <LsPageLink :to="`/teams/${team.id}`" :icon="ArrowUpRight" :label="team.name || team.slug" />
      </template>
      <template #mobile-status="{ row: team }">
        <LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" />
      </template>
      <template #mobile="{ row: team }">
        <dl>
          <dt>标识</dt>
          <dd>{{ team.slug }}</dd>
          <dt>所有者</dt>
          <dd>{{ team.owner_username || `#${team.user_id}` }}</dd>
          <dt>成员</dt>
          <dd>{{ team.member_count }}</dd>
          <dt>创建时间</dt>
          <dd>{{ formatTime(team.create_time) }}</dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
    <template #pagination v-if="!routeAccess.restricted.value && !query.isPending.value && !query.isError.value && query.data.value?.list.length">
      <NPagination v-model:page="page" :page-size="20" :item-count="query.data.value.total" />
    </template>
  </LsCollectionPage>
</template>
