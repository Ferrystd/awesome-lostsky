<script setup lang="ts">
import AdminPageHeader from '../components/AdminPageHeader.vue'
import TeamCategoryLayout from '../components/TeamCategoryLayout.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NDatePicker, NPagination, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import TeamAuditEventStream from '../components/TeamAuditEventStream.vue'
import { type AuditFilterCatalog, type AuditOption, type AuditPage } from '../lib/audit'

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
const applicationItems = computed(() => [
  { key: '', label: '全部应用' },
  ...(catalog.data.value?.applications ?? []).map(item => ({ key: item.value, label: item.label })),
])
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
const countLabel = computed(() => routeAccess.restricted.value
  ? '0 条事件'
  : query.isSuccess.value ? `${query.data.value?.total ?? 0} 条事件` : '')
</script>

<template>
  <div class="audit-view">
    <AdminPageHeader title="审计日志" description="查看本团队内成功完成的管理操作；正文、凭据和联系方式不会写入审计上下文。" />
    <TeamCategoryLayout
    label="应用分类"
    :items="applicationItems"
    :current="filters.application ?? ''"
    @select="filters.application = $event || null"
  >
    <div class="audit-workspace">
      <LsListToolbar v-model="filters.q" placeholder="搜索执行人、动作、资源或请求 ID" aria-label="搜索审计日志" :count-label="countLabel" @update:model-value="filters.page = 1">
        <template #actions>
          <LsButton size="sm" variant="secondary" :aria-expanded="showAdvanced" aria-controls="audit-advanced-filters" @click="showAdvanced = !showAdvanced">{{ showAdvanced ? '收起筛选' : '更多筛选' }}{{ advancedFilterCount ? `（${advancedFilterCount}）` : '' }}</LsButton>
        </template>
      </LsListToolbar>
      <LsInlineError v-if="!routeAccess.restricted.value && catalog.isError.value" :message="`筛选选项暂时无法读取：${friendlyError(catalog.error.value)}`" />
      <p v-else-if="!routeAccess.restricted.value && catalog.isPending.value" class="audit-workspace__hint" role="status">正在读取应用与筛选选项…</p>
      <section v-if="showAdvanced" id="audit-advanced-filters" class="audit-filters" aria-label="更多审计筛选">
        <LsField label="动作" for-id="audit-action">
          <NSelect v-model:value="filters.action" :input-props="{ id: 'audit-action', 'aria-label': '审计动作' }" :options="actionOptions" :loading="catalog.isFetching.value" clearable filterable placeholder="全部动作" aria-label="审计动作" />
        </LsField>
        <LsField label="资源" for-id="audit-resource">
          <NSelect v-model:value="filters.resource_type" :input-props="{ id: 'audit-resource', 'aria-label': '审计资源' }" :options="resourceOptions" :loading="catalog.isFetching.value" clearable filterable placeholder="全部资源" aria-label="审计资源" />
        </LsField>
        <LsField class="audit-filters__period" label="时间范围" for-id="audit-period">
          <NDatePicker id="audit-period" v-model:value="filters.period" class="period-filter" type="datetimerange" clearable role="group" aria-label="审计时间范围" />
        </LsField>
      </section>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取审计日志" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" title="没有可显示的审计事件" description="调整应用、搜索条件或时间范围后再试。" />
      <TeamAuditEventStream v-else :events="query.data.value.list" />
      <div v-if="!routeAccess.restricted.value && query.isSuccess.value && query.data.value && query.data.value.total > 0" class="audit-pagination">
        <span>第 {{ filters.page }} / {{ pages }} 页</span>
        <div class="audit-pagination__controls"><NPagination v-model:page="filters.page" :page-count="pages" :page-slot="5" /></div>
      </div>
    </div>
    </TeamCategoryLayout>
  </div>
</template>

<style scoped>
.audit-view { min-width: 0; display: grid; gap: 1.5rem; }
.audit-workspace { min-width: 0; display: grid; gap: 1.5rem; container: audit-workspace / inline-size; }
.audit-workspace__hint { margin: 0; color: var(--text-secondary); font-size: .8125rem; }
.audit-filters { min-width: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.audit-filters__period { grid-column: 1 / -1; }
.period-filter { width: 100%; min-width: 0; }
.audit-pagination { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; color: var(--text-secondary); font-size: .8125rem; font-variant-numeric: tabular-nums; }
.audit-pagination__controls { min-width: 0; max-width: 100%; overflow-x: auto; }
@container audit-workspace (max-width: 32rem) {
  .audit-filters { grid-template-columns: minmax(0, 1fr); }
}
</style>
