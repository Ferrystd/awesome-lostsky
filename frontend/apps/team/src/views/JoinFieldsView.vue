<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { ChevronRight, ListPlus, Plus } from '@lucide/vue'
import { NAlert, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'
import { inputTypeLabel, type JoinField, valueTypeLabel } from '../lib/joinFields'

const search = ref('')
const status = ref<'all' | 'active' | 'inactive'>('all')
const access = useTeamAccess()
const canRead = computed(() => hasPermission(access.data.value, 'team.join_field.read'))
const canWrite = computed(() => hasPermission(access.data.value, 'team.join_field.write'))
const fields = useQuery({
  queryKey: ['join-fields'],
  queryFn: () => api.get<JoinField[]>('/joinField/index'),
  enabled: computed(() => canRead.value),
})
const rows = computed(() => Array.isArray(fields.data.value) ? fields.data.value : [])
const visibleRows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return rows.value.filter((field) => {
    if (status.value === 'active' && !field.is_active) return false
    if (status.value === 'inactive' && field.is_active) return false
    return !keyword || `${field.name} ${field.field_key}`.toLocaleLowerCase().includes(keyword)
  })
})
const filtered = computed(() => Boolean(search.value.trim()) || status.value !== 'all')
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已启用', value: 'active' },
  { label: '已停用', value: 'inactive' },
]
</script>

<template>
  <div class="join-fields-page">
    <AdminPageHeader title="申请字段" description="配置申请人需要填写的资料，以及审批通过后需要转存的人员字段。">
      <template v-if="canWrite" #actions>
        <RouterLink to="/join-fields/new"><LsButton><template #icon><Plus :size="17" /></template>创建字段</LsButton></RouterLink>
      </template>
    </AdminPageHeader>

    <LsAsyncState v-if="access.isPending.value" state="loading" :rows="3" />
    <LsAsyncState v-else-if="access.isError.value" state="error" title="暂时无法确认申请字段权限" :description="friendlyError(access.error.value)" />
    <NAlert v-else-if="!canRead" type="warning" title="申请字段不可用">{{ permissionReason('team.join_field.read') }}</NAlert>
    <template v-else>
      <LsListToolbar v-model="search" placeholder="搜索字段名称或标识" aria-label="搜索申请字段" :count-label="`${visibleRows.length} 个字段`">
        <template #filters><NSelect v-model:value="status" class="status-filter" :options="statusOptions" aria-label="筛选申请字段状态" /></template>
      </LsListToolbar>
      <LsAsyncState v-if="fields.isPending.value" state="loading" :rows="5" />
      <LsAsyncState v-else-if="fields.isError.value" state="error" title="暂时无法读取申请字段" :description="friendlyError(fields.error.value)" />
      <div v-else-if="visibleRows.length" class="join-field-list">
        <RouterLink v-for="field in visibleRows" :key="field.id" :to="`/join-fields/${field.id}`">
          <span class="field-icon" aria-hidden="true"><ListPlus :size="20" /></span>
          <span class="field-copy">
            <strong>{{ field.name }}</strong>
            <small>{{ field.field_key }} · {{ valueTypeLabel(field.value_type) }} / {{ inputTypeLabel(field.input_type) }}</small>
            <small>{{ field.is_apply_required ? '申请必填' : '申请选填' }}{{ field.is_transfer_entity_field ? ' · 审批后转存' : '' }}</small>
          </span>
          <LsStatusTag :label="field.is_active ? '已启用' : '已停用'" :type="field.is_active ? 'success' : 'default'" />
          <ChevronRight class="arrow" :size="18" aria-hidden="true" />
        </RouterLink>
      </div>
      <LsEmptyState
        v-else
        :title="filtered ? '没有匹配的申请字段' : '还没有申请字段'"
        :description="filtered ? '调整搜索词或状态筛选后查看。' : '创建字段后，申请人会在加入页面看到已启用且允许填写的内容。'"
      />
    </template>
  </div>
</template>

<style scoped>
.join-fields-page{display:grid;gap:1.5rem}.status-filter{width:11rem}.join-field-list{display:grid;overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.join-field-list>a{min-width:0;min-height:80px;display:grid;grid-template-columns:42px minmax(0,1fr) auto 22px;align-items:center;gap:.75rem;padding:.875rem;color:var(--ink);background:white;border-bottom:1px solid var(--line);transition:background-color var(--motion-fast) var(--ease-standard)}.join-field-list>a:last-child{border-bottom:0}.join-field-list>a:hover{background:var(--cloud)}.join-field-list>a:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:-3px}.field-icon{width:42px;height:42px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border-radius:9px}.field-copy{min-width:0}.field-copy strong,.field-copy small{display:block;overflow-wrap:anywhere}.field-copy small{margin-top:.2rem;color:var(--muted-ink);font-size:.76rem;line-height:1.4}.arrow{color:var(--muted-ink)}@media(max-width:639px){.join-fields-page{gap:1rem}.status-filter{width:100%}.join-field-list>a{grid-template-columns:42px minmax(0,1fr) 20px}.join-field-list :deep(.ls-status-tag){grid-column:2;width:fit-content}.arrow{grid-column:3;grid-row:1/3}}
</style>
