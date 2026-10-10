<script setup lang="ts">
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { ListPlus, Plus } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { hasPermission, useTeamAccess } from '../lib/teamAccess'
import { inputTypeLabel, type JoinField, valueTypeLabel } from '../lib/joinFields'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

const search = ref('')
const status = ref<'all' | 'active' | 'inactive'>('all')
const access = useTeamAccess()
const routeAccess = useRouteAccess()
const canRead = computed(() => !routeAccess.restricted.value && hasPermission(access.data.value, 'team.join_field.read'))
const fields = useQuery({
  queryKey: ['join-fields'],
  queryFn: () => api.get<JoinField[]>('/joinField/index'),
  enabled: computed(() => canRead.value),
})
const rows = computed(() => (Array.isArray(fields.data.value) ? fields.data.value : []))
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
    <AdminPageHeader back-to="/join-review" back-label="返回人事审核" title="申请字段" description="配置申请人需要填写的资料，以及审批通过后需要转存的人员字段。">
      <template #actions><LsPagePrimaryAction :icon="Plus" label="创建字段" to="/join-fields/new" /></template>
    </AdminPageHeader>
    <LsAsyncState v-if="access.isPending.value" state="loading" :rows="3" />
    <LsAsyncState v-else-if="access.isError.value" state="error" title="暂时无法确认申请字段权限" :description="friendlyError(access.error.value)" />
    <template v-else>
      <LsListToolbar v-model="search" placeholder="搜索字段名称或标识" aria-label="搜索申请字段" :count-label="!canRead ? '0 个字段' : `${visibleRows.length} 个字段`"><template #filters><NSelect v-model:value="status" :options="statusOptions" aria-label="筛选申请字段状态" /></template></LsListToolbar>
      <LsAsyncState v-if="canRead && fields.isPending.value" state="loading" :rows="5" />
      <LsAsyncState v-else-if="canRead && fields.isError.value" state="error" title="暂时无法读取申请字段" :description="friendlyError(fields.error.value)" />
      <LsResourceList v-else-if="visibleRows.length" aria-label="申请字段列表">
        <LsResourceRow v-for="field in visibleRows" :key="field.id" :title="field.name" :to="`/join-fields/${field.id}`" :icon="ListPlus" :description="`${valueTypeLabel(field.value_type)} / ${inputTypeLabel(field.input_type)}`">
          <template #status><LsStatusTag :label="field.is_active ? '已启用' : '已停用'" :type="field.is_active ? 'success' : 'default'" /></template>
          <template #metadata><span>{{ field.field_key }}</span><span>{{ field.is_apply_required ? '申请必填' : '申请选填' }}{{ field.is_transfer_entity_field ? ' · 审批后转存' : '' }}</span></template>
        </LsResourceRow>
      </LsResourceList>
      <LsEmptyState v-else :source="fields.data.value" :title="filtered ? '没有匹配的申请字段' : '还没有申请字段'" :description="filtered ? '调整搜索词或状态筛选后查看。' : '创建字段后，申请人会在加入页面看到已启用且允许填写的内容。'" />
    </template>
  </div>
</template>

<style scoped>
.join-fields-page { display: grid; gap: 1.5rem; }
</style>
