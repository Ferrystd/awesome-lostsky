<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Check, X } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

const route = useRoute()
const client = useQueryClient()
const routeAccess = useRouteAccess()
const id = computed(() => Number(route.query.id || 0))
const query = useQuery({
  queryKey: computed(() => ['member-departure', id.value]),
  queryFn: () => routeAccess.read(() => api.get<Record<string, unknown>>('/memberDeparture/get', { id: id.value })),
  enabled: computed(() => id.value > 0 && !routeAccess.restricted.value),
})
const detail = computed(() => query.data.value)
const member = computed(() => detail.value?.member as Record<string, unknown> | undefined)
const action = useMutation({
  mutationFn: (path: string) => api.post(path, { id: id.value }),
  onSuccess: async (_, path) => {
    await client.invalidateQueries({ queryKey: ['member-departures'] })
    await query.refetch()
    feedback.success(path.endsWith('/approve') ? '离队申请已批准' : '离队申请已拒绝')
  },
  onError: error => feedback.error(friendlyError(error)),
})
function decide(path: string, message: string) { if (!routeAccess.restricted.value && confirm(message)) action.mutate(path) }
function dateTime(value: unknown): string {
  const seconds = Number(value)
  return seconds ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeStyle: 'short' }).format(seconds * 1000) : '—'
}
</script>

<template>
  <div class="departure-detail">
    <AdminPageHeader title="审核离队申请" :description="id ? `申请 #${id}` : '缺少申请编号'" back-to="/departure-review" back-label="返回离队审核">
      <template v-if="detail" #actions><LsStatusTag :label="String(detail.status_label || detail.status_code || detail.status)" /></template>
    </AdminPageHeader>
    <LsInlineError v-if="!id" message="缺少有效的离队申请编号。" />
    <LsAsyncState v-else-if="query.isError.value && !routeAccess.restricted.value" state="error" title="暂时无法读取离队申请" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value && !routeAccess.restricted.value" state="loading" :rows="5" />
    <template v-else-if="detail || routeAccess.restricted.value">
      <LsPanel><section><small>目标成员</small><h2>{{ routeAccess.restricted.value ? '-' : member?.nickname || member?.name || `成员 #${detail?.member_id}` }}</h2><p>{{ routeAccess.restricted.value ? '-' : `@${member?.slug || '尚无 slug'} · ${member?.status_label || '正常'}` }}</p></section></LsPanel>
      <LsPanel><dl><div><dt>发起实体</dt><dd>{{ routeAccess.restricted.value ? '-' : (detail?.requester as Record<string, unknown> | undefined)?.name || `Entity #${detail?.requester_entity_id}` }}</dd></div><div><dt>申请时间</dt><dd>{{ routeAccess.restricted.value ? '-' : dateTime(detail?.create_time) }}</dd></div><div><dt>决定实体</dt><dd>{{ routeAccess.restricted.value ? '-' : (detail?.decision_entity as Record<string, unknown> | undefined)?.name || '尚未决定' }}</dd></div><div><dt>决定时间</dt><dd>{{ routeAccess.restricted.value ? '-' : dateTime(detail?.decided_at) }}</dd></div></dl></LsPanel>
      <LsPanel v-if="routeAccess.restricted.value || detail?.status_code === 'applied'"><section class="decision"><div><h3>审核决定</h3><p>批准后成员进入已离队状态，现有会话立即失效；资料、角色与业务关系保持不变。</p></div><div><LsButton :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="action.isPending.value" @click="decide('/memberDeparture/approve', '确认批准该离队申请？')"><template #icon><Check :size="17" /></template>批准离队</LsButton><LsButton variant="danger" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="action.isPending.value" @click="decide('/memberDeparture/reject', '确认拒绝该离队申请？')"><template #icon><X :size="17" /></template>拒绝申请</LsButton></div></section></LsPanel>
    </template>
  </div>
</template>

<style scoped>
.departure-detail{display:grid;gap:1.5rem}.departure-detail h2,.departure-detail h3,.departure-detail p{margin:0}.departure-detail section>small{color:var(--muted-ink)}.departure-detail section>p{margin-top:.35rem;color:var(--muted-ink)}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:0}dl>div{padding:1rem;background:var(--cloud);border-radius:10px}dt{color:var(--muted-ink);font-size:.78rem}dd{margin:.35rem 0 0;overflow-wrap:anywhere}.decision{display:flex;align-items:center;justify-content:space-between;gap:1rem}.decision>div:last-child{display:flex;flex-wrap:wrap;gap:.75rem}@media(max-width:639px){dl{grid-template-columns:1fr}.decision{align-items:stretch;flex-direction:column}.decision>div:last-child{display:grid}}
</style>
