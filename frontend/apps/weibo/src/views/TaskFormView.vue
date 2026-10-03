<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
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

watch(() => existing.data.value, task => {
  if (!task) return
  operationType.value = task.operation_type
  topic.value = task.topic.name
  content.value = task.content
  accountIds.value = [...task.account_ids]
  mediaIds.value = [...task.media_ids]
  startMs.value = task.start_at * 1000
  min.value = task.min_interval
  max.value = task.max_interval
}, { immediate: true })

async function save() {
  if (routeAccess.reason.value) return feedback.info(routeAccess.reason.value)
  if (!canSave.value || pending.value) return feedback.warning('请完整填写执行安排和发布内容')
  pending.value = true
  try {
    const body = {
      operation_type: operationType.value,
      topic: topic.value,
      content: isCheckin.value ? '' : content.value,
      account_ids: accountIds.value,
      media_ids: isCheckin.value ? [] : mediaIds.value,
      start_at: Math.floor(startMs.value / 1000),
      min_interval: isCheckin.value ? 86400 : min.value,
      max_interval: isCheckin.value ? 86400 : max.value,
      ...expectedEntity(access.data.value, personal.value),
      ...(editing.value ? { expected_version: existing.data.value?.version } : {}),
    }
    await api.post(editing.value ? `${prefix.value}/tasks/${id.value}` : `${prefix.value}/tasks`, body)
    feedback.success('任务已保存为暂停')
    void router.push(`${prefix.value}/tasks`)
  } catch (error) {
    feedback.error(friendlyError(error))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="weibo-stack">
    <LsPageHeader
      :title="editing ? '编辑微博任务' : '新建微博任务'"
      description="新建和编辑任务不需要微博能力，仅启用任务需要；修改后任务会回到暂停状态，需重新开启。"
      :back-to="`${prefix}/tasks`"
      back-label="返回任务"
    />
    <LsInlineError v-if="existing.isError.value" :message="friendlyError(existing.error.value)" />
    <form v-else class="weibo-form" @submit.prevent="save">
      <LsFormSection v-if="editing && routeAccess.restricted.value" title="当前任务" description="列表结构始终可用；暂时无法读取的配置会显示为横杠。">
        <LsDescriptionList><dt>已保存配置</dt><dd>-</dd></LsDescriptionList>
      </LsFormSection>
      <LsFormSection title="执行安排" :description="isCheckin ? '选择候选账号和首次签到时间；之后每天同一时间执行。' : '选择每轮可用的候选账号，并设置首次执行时间与随机间隔。'">
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

      <LsFormActions>
        <LsButton variant="secondary" @click="router.push(`${prefix}/tasks`)">取消</LsButton>
        <LsButton type="submit" size="lg" :loading="pending" :disabled="routeAccess.restricted.value || !canSave" :disabled-reason="routeAccess.reason.value">保存为暂停</LsButton>
      </LsFormActions>
    </form>
  </div>
</template>
