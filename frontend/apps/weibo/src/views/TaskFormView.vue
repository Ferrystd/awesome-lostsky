<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { api, auth, ApiError, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NDatePicker, NInput, NInputNumber, NRadioButton, NRadioGroup, NSelect } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MediaPreparation from '../components/MediaPreparation.vue'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'
import type { WeiboAccount, WeiboTask } from '../types'

const route = useRoute()
const router = useRouter()
const personal = computed(() => route.meta.workspace === 'personal')
const prefix = computed(() => apiPrefix(personal.value))
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const routeAccess = useRouteAccess()
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess() })
const accounts = useQuery({
  queryKey: computed(() => ['weibo-accounts', prefix.value]),
  queryFn: () => api.get<WeiboAccount[]>(`${prefix.value}/accounts`),
  enabled: computed(() => !routeAccess.restricted.value),
})
const existing = useQuery({
  queryKey: computed(() => ['weibo-task', prefix.value, id.value]),
  queryFn: () => routeAccess.read(() => api.get<WeiboTask>(`${prefix.value}/tasks/${id.value}`)),
  enabled: computed(() => editing.value && !routeAccess.restricted.value),
})
const topic = ref('')
const content = ref('')
const operationType = ref<'Post' | 'Checkin'>('Post')
const accountIds = ref<number[]>([])
const mediaIds = ref<number[]>([])
const startMs = ref(Date.now() + 60_000)
const min = ref(3600)
const max = ref(7200)
const pending = ref(false)
const isCheckin = computed(() => operationType.value === 'Checkin')
const canSave = computed(() => Boolean(
  topic.value.trim()
  && (isCheckin.value || content.value.trim())
  && accountIds.value.length
  && startMs.value > 0
  && (isCheckin.value || (min.value >= 1 && max.value >= min.value)),
))

const baselineVersion = ref<number | undefined>()
const conflict = ref(false)
const draft = useQueryDraft({
  key: () => `${location.host}:${JSON.stringify(auth.entity())}:${prefix.value}:${id.value}`,
  read: () => ({ operationType: operationType.value, topic: topic.value, content: content.value, accountIds: accountIds.value, mediaIds: mediaIds.value, startMs: startMs.value, min: min.value, max: max.value }),
  apply: value => { operationType.value = value.operationType; topic.value = value.topic; content.value = value.content; accountIds.value = value.accountIds; mediaIds.value = value.mediaIds; startMs.value = value.startMs; min.value = value.min; max.value = value.max },
})
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path })
const taskDraft = (task: WeiboTask) => ({ operationType: task.operation_type, topic: task.topic.name, content: task.content, accountIds: [...task.account_ids], mediaIds: [...task.media_ids], startMs: task.start_at * 1000, min: task.min_interval, max: task.max_interval })
watch(() => `${prefix.value}:${id.value}`, () => { baselineVersion.value = undefined; conflict.value = false; pending.value = false }, { flush: 'sync' })
watch(() => existing.data.value, task => {
  if (task && baselineVersion.value !== undefined && task.version < baselineVersion.value) return
  if (task && draft.hydrate(taskDraft(task))) baselineVersion.value = task.version
}, { immediate: true })
async function reloadTask() {
  if (draft.dirty.value && !window.confirm('重新载入将丢弃当前未保存的修改，确认继续？')) return
  const current = draft.capture()
  const result = await existing.refetch()
  if (!draft.isCurrent(current) || !result.data || result.error || JSON.stringify(draft.capture().value) !== JSON.stringify(current.value)) return
  draft.reset(taskDraft(result.data))
  baselineVersion.value = result.data.version
  conflict.value = false
}

async function save() {
  if (routeAccess.reason.value) return feedback.info(routeAccess.reason.value)
  if (!canSave.value || pending.value) return feedback.warning('请完整填写执行安排和发布内容')
  pending.value = true
  const submitted = draft.capture()
  const targetPrefix = prefix.value
  try {
    const body = {
      operation_type: submitted.value.operationType,
      topic: submitted.value.topic,
      content: isCheckin.value ? '' : submitted.value.content,
      account_ids: submitted.value.accountIds,
      media_ids: isCheckin.value ? [] : submitted.value.mediaIds,
      start_at: Math.floor(submitted.value.startMs / 1000),
      min_interval: isCheckin.value ? 86400 : submitted.value.min,
      max_interval: isCheckin.value ? 86400 : submitted.value.max,
      ...expectedEntity(access.data.value, personal.value),
      ...(editing.value ? { expected_version: baselineVersion.value } : {}),
    }
    const saved = await api.post<WeiboTask>(editing.value ? `${prefix.value}/tasks/${id.value}` : `${prefix.value}/tasks`, body)
    if (!draft.accept(submitted)) return
    baselineVersion.value = saved.version
    conflict.value = false
    feedback.success('任务已保存为暂停')
    if (!draft.dirty.value) void router.push(`${targetPrefix}/tasks`)
  } catch (error) {
    if (!draft.isCurrent(submitted)) return
    if (error instanceof ApiError && error.status === 409) conflict.value = true
    feedback.error(friendlyError(error))
  } finally {
    if (draft.isCurrent(submitted)) pending.value = false
  }
}
</script>

<template>
  <LsFormPage :title="editing ? '编辑微博任务' : '新建微博任务'" description="新建和编辑任务不需要微博能力，仅启用任务需要；修改后任务会回到暂停状态，需重新开启。">
    <template #actions>
      <LsPageLink :to="`${prefix}/tasks`" :icon="ArrowLeft" label="返回任务" />
    </template>

    <div v-if="conflict" role="status"><p>任务状态已变化，当前修改已保留。请核对最新任务后再保存。</p><LsButton type="button" variant="secondary" @click="reloadTask">重新载入任务</LsButton></div>
    <LsInlineError v-if="existing.isError.value" :message="friendlyError(existing.error.value)" />
    <form v-else class="weibo-form" @submit.prevent="save">
      <LsFormSection v-if="editing && routeAccess.restricted.value" title="当前任务" description="列表结构始终可用；暂时无法读取的配置会显示为横杠。">
        <LsDescriptionList><dt>已保存配置</dt><dd>-</dd></LsDescriptionList>
      </LsFormSection>
      <LsFormSection title="任务与账号" description="选择任务类型，以及每轮可用的候选账号。">
        <LsInlineError v-if="accounts.isError.value" message="微博账号暂时无法读取，请稍后重试。" />
        <LsField label="任务类型" for-id="weibo-task-operation" required hint="签到任务每天最多尝试一次，失败不会在当天重试。">
          <NRadioGroup id="weibo-task-operation" v-model:value="operationType" name="weibo-task-operation">
            <NRadioButton value="Post">自动发帖</NRadioButton>
            <NRadioButton value="Checkin">每日签到</NRadioButton>
          </NRadioGroup>
        </LsField>
        <LsField label="候选账号" for-id="weibo-task-accounts" required hint="每轮会随机排序，并使用首个检查有效的账号。">
          <NSelect
            id="weibo-task-accounts"
            v-model:value="accountIds"
            multiple
            :loading="!routeAccess.restricted.value && accounts.isPending.value"
            :disabled="routeAccess.restricted.value || accounts.isError.value"
            :options="(accounts.data.value || []).map(account => ({ label: account.screen_name || account.uid, value: account.id }))"
            :placeholder="routeAccess.restricted.value ? '-' : '选择一个或多个账号'"
          />
        </LsField>
      </LsFormSection>
      <LsFormSection title="执行安排" :description="isCheckin ? '首次签到后，每天同一时间执行。' : '设置首次执行时间，以及后续每轮的随机间隔。'">
        <LsField label="开始时间" for-id="weibo-task-start" required :hint="isCheckin ? '首次在这个时间签到；之后每天同一时间执行。' : '首次开启后会在这个时间执行；后续按完成时间重新计算。'">
          <NDatePicker id="weibo-task-start" v-model:value="startMs" type="datetime" />
        </LsField>
        <LsField v-if="!isCheckin" label="最短间隔" for-id="weibo-task-min" required hint="单位为秒，必须是正整数。">
          <NInputNumber id="weibo-task-min" v-model:value="min" :min="1" :precision="0" placeholder="例如：3600" />
        </LsField>
        <LsField v-if="!isCheckin" label="最长间隔" for-id="weibo-task-max" required hint="每轮会在最短与最长间隔之间随机取值。">
          <NInputNumber id="weibo-task-max" v-model:value="max" :min="Math.max(1, min)" :precision="0" placeholder="例如：7200" />
        </LsField>
      </LsFormSection>

      <LsFormSection :title="isCheckin ? '签到目标' : '发布内容'" :description="isCheckin ? '填写每天需要签到的超话；任务保存后统一保持暂停。' : '填写超话、正文和图片；任务保存后统一保持暂停。'">
        <LsField label="超话" for-id="weibo-task-topic" required hint="填写超话名称即可，不需要输入井号或“超话”字样。">
          <NInput v-model:value="topic" placeholder="例如：失落青空" :input-props="{ id: 'weibo-task-topic' }" />
        </LsField>
        <LsField v-if="!isCheckin" label="正文" for-id="weibo-task-content" required>
          <NInput
            v-model:value="content"
            type="textarea"
            placeholder="输入每轮发布的微博正文"
            :autosize="{ minRows: 6, maxRows: 12 }"
            :input-props="{ id: 'weibo-task-content' }"
          />
        </LsField>
        <MediaPreparation
          v-if="!isCheckin"
          v-model="mediaIds"
          :prefix="prefix"
          :personal="personal"
          :expected-entity-id="access.data.value?.identity.entity_id ?? 0"
          :account-id="accountIds[0] ?? null"
          :access-disabled-reason="routeAccess.reason.value"
        />
      </LsFormSection>

      <LsFormSection title="保存任务" description="保存后保持暂停；需要执行时，再到任务列表手动开启。">
      <LsFormActions>
        <LsPageLink :to="`${prefix}/tasks`" :icon="ArrowLeft" label="取消" />
        <LsButton type="submit" size="lg" :loading="pending" :disabled="routeAccess.restricted.value || !canSave || !draft.dirty.value" :disabled-reason="routeAccess.reason.value">保存为暂停</LsButton>
      </LsFormActions>
      </LsFormSection>
    </form>
  </LsFormPage>
</template>
