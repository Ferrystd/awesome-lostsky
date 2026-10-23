<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import TeamCategoryLayout from '../components/TeamCategoryLayout.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import { reviewSections } from '../lib/workspaceNavigation'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { Settings, ClipboardCheck } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'

const statusOptions = [
  { label: '全部状态', value: '' }, { label: '已申请', value: '已申请' }, { label: '审核中', value: '审核中' },
  { label: '已加入', value: '已加入' }, { label: '已拒绝', value: '已拒绝' }, { label: '已取消', value: '已取消' },
]
const status = ref('')
const search = ref('')
const routeAccess = useRouteAccess()
const listQuery = useQuery({ queryKey: computed(() => ['join-reviews', status.value]), queryFn: () => api.get<unknown>('/joinReview/index', { status: status.value }), enabled: computed(() => !routeAccess.restricted.value) })
const rows = computed<Record<string, unknown>[]>(() => {
  const data = listQuery.data.value
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).list)) return (data as Record<string, unknown>).list as Record<string, unknown>[]
  return []
})
function statusType(value: unknown): 'success' | 'error' | 'warning' | 'info' { if (value === '已加入') return 'success'; if (value === '已拒绝' || value === '已取消') return 'error'; if (value === '审核中') return 'warning'; return 'info' }
function applicant(item: Record<string, unknown>) { return String((item.user as Record<string, unknown> | undefined)?.name || item.name || `用户 #${item.user_id}`) }
const visibleRows = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return rows.value.filter(item => !keyword || `${applicant(item)} ${item.id ?? ''} ${item.memo ?? ''}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
  <div class="join-review-list-page">
    <LsPageHeader title="人事审核" description="查看加入申请，点击进入对应审核页面。">
      <template #actions>
        <LsPageLink :icon="Settings" label="申请表配置" to="/join-fields" />
      </template>
    </LsPageHeader>
    <TeamCategoryLayout :items="reviewSections.map(item => ({ ...item, key: item.to }))" current="/join-review" label="审核分类">
        <LsListToolbar v-model="search" placeholder="搜索申请人、编号或说明" aria-label="搜索加入申请" :count-label="routeAccess.restricted.value ? '0 条申请' : `${visibleRows.length} 条申请`">
          <template #filters>
            <NSelect v-model:value="status" :options="statusOptions" aria-label="筛选申请状态" />
          </template>
        </LsListToolbar>
      <div class="review-results">
      <LsAsyncState v-if="!routeAccess.restricted.value && listQuery.isError.value" state="error" title="暂时无法读取加入申请" :description="friendlyError(listQuery.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && listQuery.isPending.value" state="loading" :rows="4" />
      <LsEmptyState v-else-if="routeAccess.restricted.value || !visibleRows.length" :source="listQuery.data.value" :title="routeAccess.restricted.value ? '没有可显示的加入申请' : '没有匹配的加入申请'" description="调整搜索词或申请状态筛选后查看。" />
      <LsResourceList v-else aria-label="加入申请列表">
        <LsResourceRow v-for="item in visibleRows" :key="String(item.id)" :title="applicant(item)" :description="String(item.memo || '没有补充说明')" :icon="ClipboardCheck" :to="{ path: '/join-review/review', query: { id: String(item.id ?? '') } }">
          <template #status>
            <LsStatusTag :label="String(item.purpose_label || '加入')" type="info" />
            <LsStatusTag :label="String(item.status_label || item.status)" :type="statusType(item.status_label || item.status)" />
          </template>
          <template #metadata>
            <span>{{ item.purpose_label || '加入' }}申请 #{{ item.id }}</span>
          </template>
        </LsResourceRow>
      </LsResourceList>
      </div>
    </TeamCategoryLayout>
  </div>
</template>

<style scoped>
.join-review-list-page { min-width: 0; display: grid; gap: 1.5rem; }
.review-results { min-width: 0; margin-top: 1rem; }
</style>
