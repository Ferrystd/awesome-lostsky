<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'

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
</script>

<template>
  <LsObjectDirectory title="用户" description="查询平台用户的会话和团队归属；手机号等敏感信息需要相应权限才能查看。">
    <template #toolbar>
      <LsListToolbar embedded v-model="q" placeholder="搜索用户名、手机号、邮箱、昵称或 ID" aria-label="搜索用户" :count-label="routeAccess.restricted.value ? '0 位用户' : `${query.data.value?.total ?? 0} 位用户`" @update:model-value="page = 1">
        <template #filters>
          <NSelect v-model:value="status" :options="options" @update:value="page = 1" />
        </template>
      </LsListToolbar>
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取用户" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有匹配的用户" description="调整搜索词或状态筛选后重试。" />
    <LsResourceList v-else aria-label="用户列表">
      <LsResourceRow v-for="user in query.data.value.list" :key="user.id" :title="user.nickname || user.username" :to="`/users/${user.id}`" :description="`#${user.id} · @${user.username} · ${user.phone || user.phone_masked || user.email || user.email_masked || '无联系方式'}`">
        <template #status><LsStatusTag :label="adminStatusLabel(user.is_banned ? 'banned' : 'active')" :type="adminStatusType(user.is_banned ? 'banned' : 'active')" /></template>
        <template #metadata><span>{{ user.team_count }} 个团队 · {{ user.device_count }} 台设备</span><span>注册于 {{ formatTime(user.create_time) }}</span></template>
      </LsResourceRow>
    </LsResourceList>
    <template #pagination v-if="!routeAccess.restricted.value && !query.isPending.value && !query.isError.value && query.data.value?.list.length">
      <NPagination v-model:page="page" :page-size="20" :item-count="query.data.value.total" />
    </template>
  </LsObjectDirectory>
</template>
