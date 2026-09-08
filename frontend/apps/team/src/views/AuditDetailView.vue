<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { actorLabel, displayAuditValue, formatAuditTime, type AuditChange, type AuditEventDetail } from '../lib/audit'

const route = useRoute()
const routeAccess = useRouteAccess()
const id = computed(() => Number(route.params.id))
const query = useQuery({
  queryKey: computed(() => ['team-audit-detail', id.value]),
  queryFn: () => routeAccess.read(() => api.get<AuditEventDetail>('/audit/get', { id: id.value })),
  enabled: computed(() => !routeAccess.restricted.value),
})
const changes = computed<AuditChange[]>(() => {
  const value = query.data.value?.context?.changes
  if (Array.isArray(value)) return value as AuditChange[]
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([field, change]) => ({
      field,
      ...(change && typeof change === 'object' ? change : { after: change }),
    }))
  }
  return []
})
const changedFields = computed(() => {
  const value = query.data.value?.context?.changed_fields
  return Array.isArray(value) ? value.map(String) : []
})
const metadata = computed(() => Object.entries(query.data.value?.context ?? {}).filter(([key]) => ![
  'actor_snapshot', 'target_snapshot', 'changes', 'changed_fields', 'changed',
].includes(key)))
</script>

<template>
  <div class="audit-detail">
    <AdminPageHeader :title="query.data.value ? `${query.data.value.resource_label} · ${query.data.value.action_label}` : '审计事件'" description="审计事件为只读记录；敏感字段只显示发生过变更，不保存原始内容。" back-to="/audit" back-label="返回审计日志" />
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取审计事件" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
    <template v-else-if="routeAccess.restricted.value">
      <LsPanel><template #header><LsSectionHeader title="事件信息" /></template><LsDescriptionList><dt>应用</dt><dd>-</dd><dt>动作</dt><dd>-</dd><dt>执行 Entity</dt><dd>-</dd><dt>认证账号 ID</dt><dd>-</dd><dt>目标资源</dt><dd>-</dd><dt>发生时间</dt><dd>-</dd><dt>请求 ID</dt><dd>-</dd><dt>是否产生变更</dt><dd>-</dd></LsDescriptionList></LsPanel>
      <LsPanel><template #header><LsSectionHeader title="变更内容" description="只展示允许进入审计记录的字段和安全值。" /></template><p class="muted">-</p></LsPanel>
    </template>
    <template v-else-if="query.data.value">
      <LsPanel>
        <template #header><LsSectionHeader title="事件信息" /></template>
        <LsDescriptionList>
          <dt>应用</dt><dd>{{ query.data.value.application_label }}</dd>
          <dt>动作</dt><dd>{{ query.data.value.action_label }}</dd>
          <dt>执行 Entity</dt><dd>{{ actorLabel(query.data.value.actor) }}</dd>
          <dt>认证账号 ID</dt><dd>#{{ query.data.value.actor.authenticated_user_id }}</dd>
          <dt>目标资源</dt><dd>{{ query.data.value.resource_label }}{{ query.data.value.resource_id ? ` #${query.data.value.resource_id}` : '' }}</dd>
          <dt>发生时间</dt><dd>{{ formatAuditTime(query.data.value.create_time) }}</dd>
          <dt>请求 ID</dt><dd>{{ query.data.value.request_id || '—' }}</dd>
          <dt>是否产生变更</dt><dd>{{ query.data.value.context.changed === false ? '否，命令成功但状态未变化' : '是' }}</dd>
        </LsDescriptionList>
      </LsPanel>
      <LsPanel>
        <template #header><LsSectionHeader title="变更内容" description="只展示允许进入审计记录的字段和安全值。" /></template>
        <div v-if="changes.length" class="change-list">
          <article v-for="(change, index) in changes" :key="`${change.field ?? 'field'}-${index}`">
            <strong>{{ change.field || '字段' }}</strong>
            <dl><dt>变更前</dt><dd>{{ displayAuditValue(change.before) }}</dd><dt>变更后</dt><dd>{{ displayAuditValue(change.after) }}</dd></dl>
          </article>
        </div>
        <p v-else-if="changedFields.length" class="field-list">已变更字段：{{ changedFields.join('、') }}</p>
        <p v-else class="muted">此事件只保留基础操作信息。</p>
      </LsPanel>
      <LsPanel v-if="metadata.length">
        <template #header><LsSectionHeader title="补充信息" /></template>
        <LsDescriptionList><template v-for="([key, value]) in metadata" :key="key"><dt>{{ key }}</dt><dd>{{ displayAuditValue(value) }}</dd></template></LsDescriptionList>
      </LsPanel>
    </template>
  </div>
</template>

<style scoped>
.audit-detail{display:grid;gap:1.5rem}.change-list{display:grid}.change-list article{display:grid;gap:.7rem;padding:1rem 0;border-bottom:1px solid var(--line)}.change-list article:first-child{padding-top:0}.change-list article:last-child{padding-bottom:0;border-bottom:0}.change-list dl{display:grid;grid-template-columns:6rem minmax(0,1fr);gap:.35rem 1rem;margin:0}.change-list dt{color:var(--muted-ink)}.change-list dd{min-width:0;margin:0;overflow-wrap:anywhere}.field-list,.muted{margin:0}.muted{color:var(--muted-ink)}@media(max-width:640px){.change-list dl{grid-template-columns:1fr}.change-list dd{margin-bottom:.35rem}}
</style>
