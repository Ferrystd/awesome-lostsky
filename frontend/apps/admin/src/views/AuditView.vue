<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import type { AuditEvent, Page } from '../types'
import { formatTime } from '../utils'

const application = ref('')
const resourceType = ref('')
const actor = ref('')
const page = ref(1)
const routeAccess = useRouteAccess()
const appOptions = [{ label: '全部应用', value: '' }, { label: 'Admin', value: 'admin' }, { label: 'Team', value: 'team' }, { label: 'Transaction', value: 'transaction' }, { label: 'Shop', value: 'shop' }, { label: 'Chat', value: 'chat' }]
const resourceOptions = [{ label: '全部资源', value: '' }, { label: '用户', value: 'user' }, { label: '团队', value: 'team' }, { label: '平台角色', value: 'platform_admin_role' }]
const query = useQuery({ queryKey: ['admin-audit', application, resourceType, actor, page], queryFn: () => api.get<Page<AuditEvent>>('/audit-events', { application: application.value, resource_type: resourceType.value, actor_user_id: actor.value, page: page.value, limit: 20 }), enabled: computed(() => !routeAccess.restricted.value) })
function context(event: AuditEvent) { const reason = event.context?.reason; return typeof reason === 'string' ? reason : '—' }
const columns: DataTableColumns<AuditEvent> = [
  { title: '时间', key: 'create_time', render: event => formatTime(event.create_time) },
  { title: '应用 / 动作', key: 'action', render: event => h('div', { class: 'cell-primary' }, [h('strong', event.action), h('small', event.application)]) },
  { title: '执行人', key: 'actor', render: event => event.actor_username || 'CLI / 系统' },
  { title: '资源', key: 'resource', render: event => `${event.resource_type}${event.resource_id ? ` #${event.resource_id}` : ''}` },
  { title: '原因', key: 'reason', render: context },
  { title: '请求 ID', key: 'request_id', render: event => event.request_id || '—' },
]
</script>

<template>
  <LsPageHeader title="审计日志" description="集中查看平台治理和业务写操作；日志只展示已记录的非敏感上下文。" />
  <LsListToolbar v-model="actor" placeholder="搜索执行用户 ID" aria-label="搜索审计执行人" :count-label="routeAccess.restricted.value ? '0 条事件' : `${query.data.value?.total ?? 0} 条事件`" @update:model-value="page = 1">
    <template #filters><NSelect v-model:value="application" :options="appOptions" @update:value="page = 1" /><NSelect v-model:value="resourceType" :options="resourceOptions" @update:value="page = 1" /></template>
  </LsListToolbar>
  <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
  <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取审计日志" :description="friendlyError(query.error.value)" />
  <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有可显示的审计事件" description="调整应用、资源或执行人筛选。" />
  <template v-else>
    <LsResponsiveDataTable :columns="columns" :data="query.data.value.list" :row-key="row => row.id" :scroll-x="920">
      <template #mobile-title="{ row: event }">{{ event.action }}</template>
      <template #mobile-status="{ row: event }"><span>#{{ event.id }}</span></template>
      <template #mobile="{ row: event }"><dl><dt>执行人</dt><dd>{{ event.actor_username || 'CLI / 系统' }}</dd><dt>资源</dt><dd>{{ event.resource_type }} {{ event.resource_id ? `#${event.resource_id}` : '' }}</dd><dt>原因</dt><dd>{{ context(event) }}</dd><dt>时间</dt><dd>{{ formatTime(event.create_time) }}</dd></dl></template>
    </LsResponsiveDataTable>
    <div class="pagination"><NPagination v-model:page="page" :page-size="20" :item-count="query.data.value.total" /></div>
  </template>
</template>
