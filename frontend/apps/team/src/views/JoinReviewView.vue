<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight } from '@lucide/vue'
import { NSelect, NSkeleton, NTag } from 'naive-ui'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const statusOptions = [
  { label: '全部状态', value: '' }, { label: '已申请', value: '已申请' }, { label: '审核中', value: '审核中' },
  { label: '已加入', value: '已加入' }, { label: '已拒绝', value: '已拒绝' }, { label: '已取消', value: '已取消' },
]
const status = ref('')
const search = ref('')
const listQuery = useQuery({ queryKey: computed(() => ['join-reviews', status.value]), queryFn: () => api.get<unknown>('/joinReview/index', { status: status.value }) })
const rows = computed<Record<string, unknown>[]>(() => {
  const data = listQuery.data.value
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).list)) return (data as Record<string, unknown>).list as Record<string, unknown>[]
  return []
})
function statusType(value: unknown) { if (value === '已加入') return 'success'; if (value === '已拒绝' || value === '已取消') return 'error'; if (value === '审核中') return 'warning'; return 'info' }
function applicant(item: Record<string, unknown>) { return String((item.user as Record<string, unknown> | undefined)?.name || item.name || `用户 #${item.user_id}`) }
const visibleRows = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return rows.value.filter(item => !keyword || `${applicant(item)} ${item.id ?? ''} ${item.memo ?? ''}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
    <div class="join-review-list-page">
      <AdminPageHeader title="加入审核" description="查看申请状态，选择一条申请进入独立审核页面。">
      </AdminPageHeader>
      <LsListToolbar v-model="search" placeholder="搜索申请人、编号或说明" aria-label="搜索加入申请" :count-label="`${visibleRows.length} 条申请`"><template #filters><NSelect v-model:value="status" class="status-filter" :options="statusOptions" aria-label="筛选申请状态" /></template></LsListToolbar>
      <p v-if="listQuery.isError.value" class="error" role="alert">{{ friendlyError(listQuery.error.value) }}</p>
      <div v-else-if="listQuery.isPending.value" class="loading" aria-label="正在读取申请"><NSkeleton v-for="item in 4" :key="item" height="88px" /></div>
      <LsEmptyState v-else-if="!visibleRows.length" title="没有匹配的加入申请" description="调整搜索词或申请状态筛选后查看。" />
      <div v-else class="review-list" aria-label="加入申请列表">
        <RouterLink v-for="item in visibleRows" :key="String(item.id)" :to="{ path: '/join-review/review', query: { id: String(item.id ?? '') } }">
          <div class="identity"><strong>{{ applicant(item) }}</strong><small>申请 #{{ item.id }}</small></div>
          <p>{{ item.memo || '没有补充说明' }}</p>
          <NTag :type="statusType(item.status)" size="small" :bordered="false">{{ item.status }}</NTag>
          <ArrowRight class="arrow" :size="18" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
</template>

<style scoped>
.join-review-list-page{display:grid;gap:1.5rem}.status-filter{width:11rem}.review-list{display:grid;overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.review-list>a{min-width:0;min-height:88px;display:grid;grid-template-columns:minmax(8rem,.5fr) minmax(0,1fr) auto 24px;align-items:center;gap:1rem;padding:1rem;color:var(--ink);background:white;border-bottom:1px solid var(--line);transition:background-color var(--motion-fast) var(--ease-standard)}.review-list>a:last-child{border-bottom:0}.review-list>a:hover{background:var(--cloud)}.review-list>a:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:-3px}.identity strong,.identity small{display:block}.identity small{margin-top:.25rem;color:var(--muted-ink);font-size:.75rem}.review-list p{min-width:0;margin:0;color:var(--muted-ink);font-size:.875rem;overflow-wrap:anywhere}.arrow{color:var(--muted-ink)}.error,.empty{padding:1rem;background:white;border:1px solid var(--line);border-radius:10px}.error{color:var(--danger)}.empty{padding-block:4rem}.loading{display:grid;gap:.75rem}
@media(max-width:639px){.status-filter{width:100%}.review-list>a{grid-template-columns:minmax(0,1fr) auto 24px;gap:.5rem 1rem}.identity{grid-column:1}.review-list p{grid-column:1/-1;grid-row:2}.review-list :deep(.n-tag){grid-column:2;grid-row:1}.arrow{grid-column:3;grid-row:1}}
</style>
