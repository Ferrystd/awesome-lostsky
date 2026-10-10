<script setup lang="ts">
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Check, Plus, X } from '@lucide/vue'
import { NCheckbox, NEmpty, NInput, NModal } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

interface Task { id?: number; title: string; description?: string | null; is_passed?: 0 | 1; sort?: number }
const route = useRoute()
const client = useQueryClient()
const routeAccess = useRouteAccess()
const reviewId = computed(() => Number(route.query.id || 0))
const tasks = ref<Task[]>([])
const draft = useQueryDraft({ key: () => teamDraftScope('join-review-tasks', reviewId.value), read: () => tasks.value, apply: value => { tasks.value = value } })
const taskStatuses = computed(() => new Map(((detail.value?.tasks ?? []) as Task[]).map(task => [task.id, task.is_passed])))
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })
const rejectOpen = ref(false)
const rejectMemo = ref('')
const detailQuery = useQuery({ queryKey: computed(() => ['join-review', reviewId.value]), queryFn: () => routeAccess.read(() => api.get<Record<string, unknown>>('/joinReview/get', { id: reviewId.value })), enabled: computed(() => reviewId.value > 0 && !routeAccess.restricted.value) })
const detail = computed(() => detailQuery.data.value)
watch(detail, value => {
  if (!value) return
  draft.hydrate(Array.isArray(value.tasks) ? (value.tasks as Task[]).map(({ is_passed: _status, ...task }) => task) : [])
}, { immediate: true })
const action = useMutation({
  mutationFn: async ({ path, body }: { path: string; body: Record<string, unknown> }) => {
    const submitted = draft.capture()
    await api.post(path, body)
    return { submitted, path }
  },
  onSuccess: async ({ submitted, path }) => {
    if (!draft.isCurrent(submitted)) return
    if (path === '/joinReview/saveTasks') draft.accept(submitted)
    await client.invalidateQueries({ queryKey: ['join-reviews'] })
    if (!draft.isCurrent(submitted)) return
    await detailQuery.refetch()
  },
})
function run(path: string, extra: Record<string, unknown> = {}) { if (!routeAccess.restricted.value && reviewId.value) action.mutate({ path, body: { id: reviewId.value, ...extra } }) }
function reject() { rejectMemo.value = ''; rejectOpen.value = true }
function submitReject() { const memo = rejectMemo.value.trim(); if (!memo) return; run('/joinReview/reject', { memo }); rejectOpen.value = false }
function addTask() { tasks.value.push({ title: '', description: '', is_passed: 0, sort: tasks.value.length }) }
function saveTasks() { run('/joinReview/saveTasks', { tasks: tasks.value.map((item, index) => ({ id: item.id, title: item.title, description: item.description || null, is_passed: (item.id ? taskStatuses.value.get(item.id) : item.is_passed) ? 1 : 0, sort: index })) }) }
function toggleTask(task: Task, on: boolean) { if (task.id) run('/joinReview/setTaskPassed', { task_id: task.id, is_passed: on ? 1 : 0 }); else task.is_passed = on ? 1 : 0 }
function valueText(value: unknown) { if (value == null) return '—'; if (typeof value === 'object') { const item = value as Record<string, unknown>; return String(item.value_string ?? item.value_text ?? item.value_int ?? item.value_decimal ?? item.value_datetime ?? JSON.stringify(item.value_json ?? item)) } return String(value) }
function statusType(value: unknown): 'success' | 'error' | 'warning' | 'info' { if (value === '已加入') return 'success'; if (value === '已拒绝' || value === '已取消') return 'error'; if (value === '审核中') return 'warning'; return 'info' }
</script>

<template>
    <div class="join-review-detail-page">
      <AdminPageHeader :title="`审核${detail?.purpose_label || '加入'}申请`" :description="reviewId ? `申请 #${reviewId}` : '缺少申请编号'" back-to="/join-review" back-label="返回申请列表">
        <template v-if="detail" #actions><LsStatusTag :label="String(detail.purpose_label || '加入')" type="info" /><LsStatusTag :label="String(detail.status_label || detail.status)" :type="statusType(detail.status_label || detail.status)" /></template>
      </AdminPageHeader>
      <LsInlineError v-if="!reviewId" message="缺少有效的申请编号，请返回列表重新选择。" />
      <LsAsyncState v-else-if="detailQuery.isError.value && !routeAccess.restricted.value" state="error" title="暂时无法读取加入申请" :description="friendlyError(detailQuery.error.value)" />
      <LsAsyncState v-else-if="detailQuery.isPending.value && !routeAccess.restricted.value" state="loading" :rows="6" />
      <template v-else-if="detail || routeAccess.restricted.value">
        <LsPanel><LsSectionHeader eyebrow="申请人" :title="String(routeAccess.restricted.value ? '-' : (detail?.user as Record<string, unknown> | undefined)?.name || `用户 #${detail?.user_id}`)" :description="String(routeAccess.restricted.value ? '-' : detail?.memo || '没有补充说明')" /></LsPanel>
        <LsPanel><section><LsSectionHeader title="申请资料" :heading-level="3" /><LsDescriptionList v-if="routeAccess.restricted.value"><dt>申请资料</dt><dd>-</dd></LsDescriptionList><LsDescriptionList v-else-if="(detail?.values as unknown[] | undefined)?.length"><template v-for="value in (detail?.values as Record<string, unknown>[] ?? [])" :key="String(value.id)"><dt>{{ (value.field as Record<string, unknown> | undefined)?.name || `字段 #${value.field_id}` }}</dt><dd>{{ valueText(value) }}</dd></template></LsDescriptionList><NEmpty v-else description="没有申请字段值" size="small" /></section></LsPanel>
        <LsPanel><section class="task-section">
          <LsSectionHeader title="审核任务" description="记录加入前需要完成的事项。" :heading-level="3"><template #aside><LsButton variant="secondary" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" @click="addTask"><template #icon><Plus :size="16" /></template>添加任务</LsButton></template></LsSectionHeader>
          <div v-if="tasks.length" class="tasks">
            <article v-for="(task, index) in tasks" :key="task.id ?? index">
              <span class="task-index">任务 {{ String(index + 1).padStart(2, '0') }}</span>
              <label><span>任务标题</span><NInput v-model:value="task.title" placeholder="例如：确认保密协议" /></label>
              <label><span>任务说明</span><NInput v-model:value="task.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="补充验收标准或负责人" /></label>
              <div class="task-actions"><NCheckbox :checked="(task.id ? taskStatuses.get(task.id) : task.is_passed) === 1" @update:checked="toggleTask(task, $event)">已完成</NCheckbox><LsButton variant="ghost" @click="tasks.splice(index, 1)"><template #icon><X :size="17" /></template>移除</LsButton></div>
            </article>
            <div class="save-row"><LsButton :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="action.isPending.value" @click="saveTasks">保存任务</LsButton></div>
          </div>
          <NEmpty v-else description="暂无审核任务，按需添加" size="small" />
        </section></LsPanel>
        <LsPanel v-if="routeAccess.restricted.value || ['applied', 'reviewing', '已申请', '审核中'].includes(String(detail?.status_code || detail?.status))"><section><LsSectionHeader title="审核决定" description="确认资料与任务后处理本次申请。" :heading-level="3"><template #aside><div class="decision-actions"><LsButton v-if="routeAccess.restricted.value || ['applied', '已申请'].includes(String(detail?.status_code || detail?.status))" variant="secondary" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="action.isPending.value" @click="run('/joinReview/review')">进入审核</LsButton><LsButton :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="action.isPending.value" @click="run('/joinReview/approve')"><template #icon><Check :size="17" /></template>同意{{ detail?.purpose_label || '加入' }}</LsButton><LsButton variant="danger" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="action.isPending.value" @click="reject">拒绝申请</LsButton></div></template></LsSectionHeader></section></LsPanel>
      </template>
      <LsInlineError v-if="action.isError.value && !routeAccess.restricted.value" :message="friendlyError(action.error.value)" />
      <NModal v-model:show="rejectOpen" preset="card" title="拒绝加入申请" :style="{ width: 'min(92vw, 30rem)' }">
        <p class="modal-copy">请填写拒绝原因。该内容会用于审核记录，并帮助申请人理解结果。</p>
        <NInput v-model:value="rejectMemo" aria-label="拒绝原因" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="300" show-count placeholder="请输入具体、可理解的拒绝原因" @keydown.ctrl.enter="submitReject" />
        <template #footer><div class="modal-actions"><LsButton variant="secondary" @click="rejectOpen = false">取消</LsButton><LsButton variant="danger" :disabled="!rejectMemo.trim()" @click="submitReject">确认拒绝</LsButton></div></template>
      </NModal>
    </div>
</template>

<style scoped>
.join-review-detail-page{display:grid;gap:1.5rem}.join-review-detail-page section h3,.join-review-detail-page section p{margin:0}.tasks{display:grid;gap:1rem;margin-top:1rem}.tasks article{display:grid;gap:.75rem;padding:1rem;background:var(--cloud);border-radius:10px}.task-index{color:var(--sky-lost-strong);font-size:.75rem;font-weight:750}.tasks label{display:grid;gap:.5rem}.tasks label>span{color:var(--muted-ink);font-size:.8rem;font-weight:650}.task-actions,.save-row,.decision-actions,.modal-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:.75rem}.save-row{padding-top:.25rem}.modal-actions{width:100%}
@media(max-width:639px){.decision-actions :deep(.n-button),.save-row :deep(.n-button){width:100%}.decision-actions,.save-row{display:grid;grid-template-columns:1fr;width:100%}}
</style>
