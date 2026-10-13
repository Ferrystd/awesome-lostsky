<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h } from 'vue'
import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import { formatTime } from '../utils'

interface HealthCheck { key: string; name: string; status: AdminStatus; message: string }
interface Health { status: AdminStatus; checked_at: number; checks: HealthCheck[]; backlogs: Record<string, number> }
const routeAccess = useRouteAccess()
const query = useQuery({ queryKey: ['admin-health'], queryFn: () => routeAccess.read(() => api.get<Health>('/system/health')), enabled: computed(() => !routeAccess.restricted.value) })
const columns: DataTableColumns<HealthCheck> = [
  { title: '服务', key: 'name' },
  { title: '状态', key: 'status', render: row => h(LsStatusTag, { label: adminStatusLabel(row.status), type: adminStatusType(row.status) }) },
  { title: '说明', key: 'message' },
]
</script>

<template>
  <LsOverviewPage title="系统状态" description="只读检查核心依赖和后台积压；数据在进入页面、重新聚焦窗口和短暂故障恢复后自动更新。">
  <template #actions><LsSceneMotionControl /></template>
  <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
  <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取系统状态" :description="friendlyError(query.error.value)" />
  <template v-else-if="routeAccess.restricted.value">
    <LsPanel><section class="system-status"><h2>核心服务状态</h2><p>检查时间 -</p></section></LsPanel>
    <LsPanel><template #header><div class="system-panel-header"><h2>核心依赖</h2><p>检查结果不包含连接密钥和服务器路径</p></div></template><LsEmptyState :source="query.data.value" title="没有可显示的依赖状态" description="当前没有依赖状态数据。" /></LsPanel>
    <LsPanel><template #header><div class="system-panel-header"><h2>后台积压</h2><p>仅用于判断是否需要进入运维流程</p></div></template><LsDescriptionList><dt>任务数量</dt><dd>-</dd></LsDescriptionList></LsPanel>
  </template>
  <template v-else-if="query.data.value">
    <LsPanel><section class="system-status"><LsStatusTag :label="adminStatusLabel(query.data.value.status)" :type="adminStatusType(query.data.value.status)" /><h2>{{ query.data.value.status === 'healthy' ? '核心服务运行正常' : '有服务需要关注' }}</h2><p>检查时间 {{ formatTime(query.data.value.checked_at) }}</p></section></LsPanel>
    <LsPanel><template #header><div class="system-panel-header"><h2>核心依赖</h2><p>检查结果不包含连接密钥和服务器路径</p></div></template><NDataTable :columns="columns" :data="query.data.value.checks" :row-key="row => row.key" /></LsPanel>
    <LsPanel><template #header><div class="system-panel-header"><h2>后台积压</h2><p>仅用于判断是否需要进入运维流程</p></div></template><LsDescriptionList><template v-for="(count, key) in query.data.value.backlogs" :key="key"><dt>{{ key }}</dt><dd class="ls-tabular">{{ count }}</dd></template></LsDescriptionList></LsPanel>
  </template>
  </LsOverviewPage>
</template>

<style scoped>.system-status h2{margin:10px 0 4px;font-size:1.25rem}.system-status p,.system-panel-header p{margin:0;color:var(--muted-ink)}.system-panel-header h2{margin:0}</style>
