<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Check, Plus, X } from '@lucide/vue'
import { NButton, NCheckbox, NEmpty, NInput, NModal, NSkeleton, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface Task { id?: number; title: string; description?: string | null; is_passed?: 0 | 1; sort?: number }
const route = useRoute()
const client = useQueryClient()
const reviewId = computed(() => Number(route.query.id || 0))
const tasks = ref<Task[]>([])
const rejectOpen = ref(false)
const rejectMemo = ref('')
const detailQuery = useQuery({ queryKey: computed(() => ['join-review', reviewId.value]), queryFn: () => api.get<Record<string, unknown>>('/joinReview/get', { id: reviewId.value }), enabled: computed(() => reviewId.value > 0) })
const detail = computed(() => detailQuery.data.value)
watch(detail, (value) => { tasks.value = Array.isArray(value?.tasks) ? (value.tasks as Task[]).map((item) => ({ ...item })) : [] }, { immediate: true })
const action = useMutation({
  mutationFn: ({ path, body }: { path: string; body: Record<string, unknown> }) => api.post(path, body),
  onSuccess: async () => { await client.invalidateQueries({ queryKey: ['join-reviews'] }); await detailQuery.refetch() },
})
function run(path: string, extra: Record<string, unknown> = {}) { if (reviewId.value) action.mutate({ path, body: { id: reviewId.value, ...extra } }) }
function reject() { rejectMemo.value = ''; rejectOpen.value = true }
function submitReject() { const memo = rejectMemo.value.trim(); if (!memo) return; run('/joinReview/reject', { memo }); rejectOpen.value = false }
function addTask() { tasks.value.push({ title: '', description: '', is_passed: 0, sort: tasks.value.length }) }
function saveTasks() { run('/joinReview/saveTasks', { tasks: tasks.value.map((item, index) => ({ id: item.id, title: item.title, description: item.description || null, is_passed: item.is_passed ? 1 : 0, sort: index })) }) }
function toggleTask(task: Task, on: boolean) { if (task.id) run('/joinReview/setTaskPassed', { task_id: task.id, is_passed: on ? 1 : 0 }); else task.is_passed = on ? 1 : 0 }
function valueText(value: unknown) { if (value == null) return '—'; if (typeof value === 'object') { const item = value as Record<string, unknown>; return String(item.value_string ?? item.value_text ?? item.value_int ?? item.value_decimal ?? item.value_datetime ?? JSON.stringify(item.value_json ?? item)) } return String(value) }
function statusType(value: unknown) { if (value === '已加入') return 'success'; if (value === '已拒绝' || value === '已取消') return 'error'; if (value === '审核中') return 'warning'; return 'info' }
</script>

<template>
    <div class="join-review-detail-page">
      <AdminPageHeader title="审核加入申请" :description="reviewId ? `申请 #${reviewId}` : '缺少申请编号'" back-to="/join-review" back-label="返回申请列表">
        <template v-if="detail" #actions><NTag :type="statusType(detail.status)" size="large" :bordered="false">{{ detail.status }}</NTag></template>
      </AdminPageHeader>
      <p v-if="!reviewId" class="error" role="alert">缺少有效的申请编号，请返回列表重新选择。</p>
      <p v-else-if="detailQuery.isError.value" class="error" role="alert">{{ friendlyError(detailQuery.error.value) }}</p>
      <div v-else-if="detailQuery.isPending.value" class="panel loading" aria-label="正在读取申请详情"><NSkeleton text :repeat="6" /></div>
      <template v-else-if="detail">
        <section class="panel summary"><div><small>申请人</small><h3>{{ (detail.user as Record<string, unknown> | undefined)?.name || `用户 #${detail.user_id}` }}</h3><p>{{ detail.memo || '没有补充说明' }}</p></div></section>
        <section class="panel"><h3>申请资料</h3><dl><template v-for="value in (detail.values as Record<string, unknown>[] ?? [])" :key="String(value.id)"><dt>{{ (value.field as Record<string, unknown> | undefined)?.name || `字段 #${value.field_id}` }}</dt><dd>{{ valueText(value) }}</dd></template></dl><NEmpty v-if="!(detail.values as unknown[] | undefined)?.length" description="没有申请字段值" size="small" /></section>
        <section class="panel task-section">
          <div class="section-title"><div><h3>审核任务</h3><p>记录加入前需要完成的事项。</p></div><NButton secondary @click="addTask"><template #icon><Plus :size="16" /></template>添加任务</NButton></div>
          <div v-if="tasks.length" class="tasks">
            <article v-for="(task, index) in tasks" :key="task.id ?? index">
              <span class="task-index">任务 {{ String(index + 1).padStart(2, '0') }}</span>
              <label><span>任务标题</span><NInput v-model:value="task.title" placeholder="例如：确认保密协议" /></label>
              <label><span>任务说明</span><NInput v-model:value="task.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="补充验收标准或负责人" /></label>
              <div class="task-actions"><NCheckbox :checked="task.is_passed === 1" @update:checked="toggleTask(task, $event)">已完成</NCheckbox><NButton quaternary type="error" @click="tasks.splice(index, 1)"><template #icon><X :size="17" /></template>移除</NButton></div>
            </article>
            <div class="save-row"><NButton type="primary" :loading="action.isPending.value" @click="saveTasks">保存任务</NButton></div>
          </div>
          <NEmpty v-else description="暂无审核任务，按需添加" size="small" />
        </section>
        <section v-if="['已申请', '审核中'].includes(String(detail.status))" class="panel decision"><div><h3>审核决定</h3><p>确认资料与任务后处理本次申请。</p></div><div class="decision-actions"><NButton v-if="detail.status === '已申请'" secondary :loading="action.isPending.value" @click="run('/joinReview/review')">进入审核</NButton><NButton type="primary" :loading="action.isPending.value" @click="run('/joinReview/approve')"><template #icon><Check :size="17" /></template>同意加入</NButton><NButton type="error" secondary :loading="action.isPending.value" @click="reject">拒绝申请</NButton></div></section>
      </template>
      <p v-if="action.isError.value" class="error" role="alert">{{ friendlyError(action.error.value) }}</p>
      <NModal v-model:show="rejectOpen" preset="card" title="拒绝加入申请" :style="{ width: 'min(92vw, 30rem)' }">
        <p class="modal-copy">请填写拒绝原因。该内容会用于审核记录，并帮助申请人理解结果。</p>
        <NInput v-model:value="rejectMemo" aria-label="拒绝原因" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="300" show-count placeholder="请输入具体、可理解的拒绝原因" @keydown.ctrl.enter="submitReject" />
        <template #footer><div class="modal-actions"><NButton @click="rejectOpen = false">取消</NButton><NButton type="error" :disabled="!rejectMemo.trim()" @click="submitReject">确认拒绝</NButton></div></template>
      </NModal>
    </div>
</template>

<style scoped>
.join-review-detail-page{display:grid;gap:1.5rem}.panel{min-width:0;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}.panel h3,.panel p{margin:0}.summary small{color:var(--muted-ink);font-size:.75rem}.summary h3{margin-top:.25rem;font-size:1.25rem}.summary p,.section-title p,.decision p,.modal-copy{margin-top:.375rem;color:var(--muted-ink);font-size:.875rem;line-height:1.6}dl{display:grid;grid-template-columns:minmax(7rem,.45fr) minmax(0,1.55fr);margin:1rem 0 0}dt,dd{margin:0;padding:.75rem 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}dt{color:var(--muted-ink);font-size:.8rem}.section-title,.decision{display:flex;align-items:center;justify-content:space-between;gap:1rem}.tasks{display:grid;gap:1rem;margin-top:1rem}.tasks article{display:grid;gap:.75rem;padding:1rem;background:var(--cloud);border-radius:10px}.task-index{color:var(--sky-lost-strong);font-size:.75rem;font-weight:750}.tasks label{display:grid;gap:.5rem}.tasks label>span{color:var(--muted-ink);font-size:.8rem;font-weight:650}.task-actions,.save-row,.decision-actions,.modal-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:.75rem}.save-row{padding-top:.25rem}.error{padding:1rem;margin:0;color:var(--danger);background:white;border:1px solid color-mix(in oklch,var(--danger),white 70%);border-radius:10px}.loading{min-height:16rem}.modal-actions{width:100%}
@media(max-width:639px){.panel{padding:1rem}dl{grid-template-columns:1fr}dt{padding-bottom:.25rem;border:0}dd{padding-top:0}.section-title,.decision{align-items:stretch;flex-direction:column}.section-title :deep(.n-button),.decision-actions :deep(.n-button),.save-row :deep(.n-button){width:100%}.decision-actions,.save-row{display:grid;grid-template-columns:1fr;width:100%}}
</style>
