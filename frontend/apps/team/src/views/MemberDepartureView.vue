<script setup lang="ts">
import TeamSectionNav from '../components/TeamSectionNav.vue'
import { reviewSections } from '../lib/workspaceNavigation'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight } from '@lucide/vue'
import { NSelect, NSkeleton } from 'naive-ui'
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
    <LsListToolbar v-model="search" placeholder="搜索成员或申请编号" aria-label="搜索离队申请" :count-label="routeAccess.restricted.value ? '0 条申请' : `${visible.length} 条申请`">
      <template #filters><NSelect v-model:value="status" class="status-filter" :options="statusOptions" aria-label="筛选申请状态" /></template>
    </LsListToolbar>
    <p v-if="!routeAccess.restricted.value && query.isError.value" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="!routeAccess.restricted.value && query.isPending.value" class="loading"><NSkeleton v-for="item in 4" :key="item" height="82px" /></div>
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !visible.length" :title="routeAccess.restricted.value ? '没有可显示的离队申请' : '没有匹配的离队申请'" description="调整状态或搜索条件后再查看。" />
    <section v-else class="rows">
      <RouterLink v-for="item in visible" :key="String(item.id)" :to="{ path: '/departure-review/review', query: { id: String(item.id ?? '') } }">
        <div><strong>{{ memberName(item) }}</strong><small>申请 #{{ item.id }} · 成员 #{{ item.member_id }}</small></div>
        <LsStatusTag :label="String(item.status_label || item.status_code || item.status)" :type="statusType(item.status_code)" />
        <ArrowRight :size="18" aria-hidden="true" />
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.departure-list{display:grid;gap:1.5rem}.status-filter{width:11rem}.loading{display:grid;gap:.75rem}.error{color:var(--danger)}.rows{display:grid;overflow:hidden;border:1px solid var(--line);border-radius:12px;background:white}.rows>a{min-height:82px;display:grid;grid-template-columns:minmax(0,1fr) auto 24px;align-items:center;gap:1rem;padding:1rem;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}.rows>a:last-child{border-bottom:0}.rows>a:hover{background:var(--cloud)}.rows strong,.rows small{display:block}.rows small{margin-top:.25rem;color:var(--muted-ink);font-size:.78rem}@media(max-width:639px){.status-filter{width:100%}}
</style>
