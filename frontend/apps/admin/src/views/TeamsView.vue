<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsDirectoryIdentity from '@lostsky/ui/components/LsDirectoryIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'

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
</script>

<template>
  <LsObjectDirectory title="团队" description="查看团队所有者、规模和运行状态；平台治理不修改团队内部业务数据。">
    <template #toolbar>
      <LsListToolbar embedded v-model="q" placeholder="搜索团队名称、slug、所有者或 ID" aria-label="搜索团队" :count-label="routeAccess.restricted.value ? '0 个团队' : `${query.data.value?.total ?? 0} 个团队`" @update:model-value="page = 1">
        <template #filters>
          <NSelect v-model:value="status" :options="options" @update:value="page = 1" />
        </template>
      </LsListToolbar>
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取团队" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有可显示的团队" description="调整搜索词或状态筛选后重试。" />
    <LsResourceList v-else aria-label="团队列表">
      <LsResourceRow v-for="team in query.data.value.list" :key="team.id" :to="`/teams/${team.id}`">
        <template #identity><LsDirectoryIdentity type="team" :name="team.name || team.slug" :slug="team.slug" :image-url="team.avatar ?? null">
          <template #status><LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" /></template>
          <template #context><span>所有者 {{ team.owner_username || `#${team.user_id}` }} · {{ team.member_count }} 位成员 · 创建于 {{ formatTime(team.create_time) }}</span></template>
        </LsDirectoryIdentity></template>
      </LsResourceRow>
    </LsResourceList>
    <template #pagination v-if="!routeAccess.restricted.value && !query.isPending.value && !query.isError.value && query.data.value?.list.length">
      <NPagination v-model:page="page" :page-size="20" :item-count="query.data.value.total" />
    </template>
  </LsObjectDirectory>
</template>
