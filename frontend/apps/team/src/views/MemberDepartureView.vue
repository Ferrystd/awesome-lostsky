<script setup lang="ts">
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import TeamSectionNav from '../components/TeamSectionNav.vue'
import { reviewSections } from '../lib/workspaceNavigation'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { UserMinus } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const status = ref('')
const search = ref('')
const routeAccess = useRouteAccess()
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '申请中', value: '1' },
  { label: '已取消', value: '2' },
  { label: '已批准', value: '3' },
  { label: '已拒绝', value: '4' },
]
const query = useQuery({
  queryKey: computed(() => ['member-departures', status.value]),
  queryFn: () => api.get<Record<string, unknown>>('/memberDeparture/index', { status: status.value || undefined }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const rows = computed(() => (query.data.value?.list ?? []) as Record<string, unknown>[])
function memberName(item: Record<string, unknown>): string {
  const member = item.member as Record<string, unknown> | undefined
  return String(member?.nickname || member?.name || `成员 #${item.member_id}`)
}
const visible = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return rows.value.filter(item => !keyword || `${memberName(item)} ${item.id} ${item.member_id}`.toLowerCase().includes(keyword))
})
function statusType(code: unknown): 'success' | 'error' | 'warning' | 'info' {
  if (code === 'approved') return 'success'
  if (code === 'rejected' || code === 'cancelled') return 'error'
  return code === 'applied' ? 'warning' : 'info'
}
</script>

<template>
  <div class="departure-list">
    <AdminPageHeader title="人事审核" description="处理成员自助提交的离队申请；管理员办理离职时不再进入审核。" />
    <TeamSectionNav label="审核分类" :items="reviewSections" />
    <LsListToolbar v-model="search" placeholder="搜索成员或申请编号" aria-label="搜索离队申请" :count-label="routeAccess.restricted.value ? '0 条申请' : `${visible.length} 条申请`"><template #filters><NSelect v-model:value="status" :options="statusOptions" aria-label="筛选申请状态" /></template></LsListToolbar>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取离队申请" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="4" />
    <LsEmptyState v-else-if="routeAccess.restricted.value || !visible.length" :source="query.data.value" :title="routeAccess.restricted.value ? '没有可显示的离队申请' : '没有匹配的离队申请'" description="调整状态或搜索条件后再查看。" />
    <LsResourceList v-else aria-label="离队申请列表">
      <LsResourceRow v-for="item in visible" :key="String(item.id)" :title="memberName(item)" :icon="UserMinus" :to="{ path: '/departure-review/review', query: { id: String(item.id ?? '') } }">
        <template #status><LsStatusTag :label="String(item.status_label || item.status_code || item.status)" :type="statusType(item.status_code)" /></template>
        <template #metadata><span>申请 #{{ item.id }}</span><span>成员 #{{ item.member_id }}</span></template>
      </LsResourceRow>
    </LsResourceList>
  </div>
</template>

<style scoped>
.departure-list { display: grid; gap: 1.5rem; }
</style>
