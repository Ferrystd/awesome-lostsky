<script setup lang="ts">
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { ArrowUpRight } from '@lucide/vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NDatePicker, NPagination, NSelect } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { computed, h, reactive, ref, watch } from 'vue'

import { actorLabel, formatAuditTime, type AuditEventSummary, type AuditFilterCatalog, type AuditOption, type AuditPage } from '../lib/audit'

function selectOptions(items: AuditOption[]): SelectOption[] {
  return items.map(item => ({ label: item.label, value: item.value }))
}

const filters = reactive({
  q: '',
  application: null as string | null,
  action: null as string | null,
  resource_type: null as string | null,
  period: null as [number, number] | null,
  page: 1,
  limit: 20,
})
const showAdvanced = ref(false)
const routeAccess = useRouteAccess()
const advancedFilterCount = computed(() => [filters.action, filters.resource_type, filters.period].filter(Boolean).length)
const catalog = useQuery({
  queryKey: ['team-audit-catalog'],
  queryFn: () => api.get<AuditFilterCatalog>('/audit/catalog'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const applicationOptions = computed(() => selectOptions(catalog.data.value?.applications ?? []))
const actionOptions = computed(() => selectOptions(catalog.data.value?.actions ?? []))
const resourceOptions = computed(() => selectOptions(catalog.data.value?.resource_types ?? []))
const params = computed(() => ({
  q: filters.q.trim() || undefined,
  application: filters.application || undefined,
  action: filters.action || undefined,
  resource_type: filters.resource_type || undefined,
  start_time: filters.period?.[0] ? Math.floor(filters.period[0] / 1000) : undefined,
  end_time: filters.period?.[1] ? Math.floor(filters.period[1] / 1000) : undefined,
  page: filters.page,
  limit: filters.limit,
}))
const query = useQuery({
  queryKey: computed(() => ['team-audit', params.value]),
  queryFn: () => api.get<AuditPage>('/audit/index', params.value),
  enabled: computed(() => !routeAccess.restricted.value),
})
watch(
  () => [filters.application, filters.action, filters.resource_type, filters.period],
  () => { filters.page = 1 },
)
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)))
const columns: DataTableColumns<AuditEventSummary> = [
  { title: '时间', key: 'create_time', width: 176, render: event => formatAuditTime(event.create_time) },
  {
    title: '操作', key: 'action', render: event => h('div', { class: 'cell-primary' }, [
      h(LsPageLink, { to: `/audit/${event.id}`, icon: ArrowUpRight, label: `${event.resource_label} · ${event.action_label}` }),
      h('small', event.application_label),
    ]),
  },
  { title: '执行人', key: 'actor', render: event => actorLabel(event.actor) },
  { title: '目标', key: 'resource', render: event => `${event.resource_label}${event.resource_id ? ` #${event.resource_id}` : ''}` },
  { title: '请求 ID', key: 'request_id', render: event => event.request_id || '—' },
]
</script>

<template>
  <div class="audit-view">
    <LsCollectionPage title="审计日志" description="查看本团队内成功完成的管理操作；正文、凭据和联系方式不会写入审计上下文。">
      <template #toolbar>
        <LsListToolbar v-model="filters.q" class="audit-toolbar" placeholder="搜索执行人、动作、资源或请求 ID" aria-label="搜索审计日志" :count-label="routeAccess.restricted.value ? '0 条事件' : `${query.data.value?.total ?? 0} 条事件`" @update:model-value="filters.page = 1">
          <template #filters>
            <NSelect v-model:value="filters.application" :options="applicationOptions" clearable placeholder="全部应用" />
          </template>
          <template #actions>
            <LsButton size="sm" variant="secondary" :aria-expanded="showAdvanced" aria-controls="audit-advanced-filters" @click="showAdvanced = !showAdvanced">{{ showAdvanced ? '收起筛选' : '更多筛选' }}{{ advancedFilterCount ? `（${advancedFilterCount}）` : '' }}</LsButton>
          </template>
        </LsListToolbar>
      </template>
      <LsPanel v-if="showAdvanced">
        <section id="audit-advanced-filters" class="audit-filters" aria-label="更多审计筛选">
          <NSelect v-model:value="filters.action" :options="actionOptions" clearable filterable placeholder="全部动作" />
          <NSelect v-model:value="filters.resource_type" :options="resourceOptions" clearable filterable placeholder="全部资源" />
          <NDatePicker v-model:value="filters.period" class="period-filter" type="datetimerange" clearable aria-label="审计时间范围" />
        </section>
      </LsPanel>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取审计日志" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有可显示的审计事件" description="调整搜索条件或时间范围后再试。" />
      <LsResponsiveDataTable v-else :columns="columns" :data="query.data.value.list" :row-key="row => row.id" :scroll-x="980">
        <template #mobile-title="{ row: event }">
          <LsPageLink :to="`/audit/${event.id}`" :icon="ArrowUpRight" :label="event.resource_label + ' · ' + event.action_label" />
        </template>
        <template #mobile-status="{ row: event }">
          <span>{{ event.application_label }}</span>
        </template>
        <template #mobile="{ row: event }">
          <dl>
            <dt>执行人</dt>
            <dd>{{ actorLabel(event.actor) }}</dd>
            <dt>目标</dt>
            <dd>{{ event.resource_label }}{{ event.resource_id ? ` #${event.resource_id}` : '' }}</dd>
            <dt>时间</dt>
            <dd>{{ formatAuditTime(event.create_time) }}</dd>
            <dt>请求 ID</dt>
            <dd>{{ event.request_id || '—' }}</dd>
          </dl>
        </template>
      </LsResponsiveDataTable>
      <template v-if="query.data.value && query.data.value.total > 0" #pagination>
        <span>第 {{ filters.page }} / {{ pages }} 页</span>
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsCollectionPage>
  </div>
</template>

<style scoped>
.audit-toolbar{flex-wrap:wrap}.audit-filters{display:grid;grid-template-columns:minmax(10rem,1fr) minmax(10rem,1fr) minmax(17rem,2fr);gap:.5rem;min-width:0;}.cell-primary{display:grid;gap:.15rem}.cell-primary small{color:var(--muted-ink)}.period-filter{width:100%;min-width:0}@media(max-width:900px){.audit-filters{grid-template-columns:1fr 1fr}.period-filter{grid-column:1/-1}}@media(max-width:639px){.audit-filters{grid-template-columns:1fr}.period-filter{grid-column:auto}}
</style>
