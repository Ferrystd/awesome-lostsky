<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { formatAbilityDenied } from '@lostsky/api/error-format'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NInput, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'
import MediaPreparation from '../components/MediaPreparation.vue'
import type { WeiboAccount } from '../types'

const route = useRoute()
const personal = computed(() => route.meta.workspace === 'personal')
const prefix = computed(() => apiPrefix(personal.value))
const routeAccess = useRouteAccess()
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess() })
const accounts = useQuery({ queryKey: computed(() => ['weibo-accounts', prefix.value]), queryFn: () => api.get<WeiboAccount[]>(`${prefix.value}/accounts`), enabled: computed(() => !routeAccess.restricted.value) })
const accountId = ref<number | null>(null)
const topic = ref('')
const content = ref('')
const mediaIds = ref<number[]>([])
const pending = ref(false)
const operationDisabledReason = computed(() => {
  if (routeAccess.reason.value) return routeAccess.reason.value
  if (access.isPending.value) return '正在核对微博 Ability，请稍候'
  if (access.isError.value) return friendlyError(access.error.value)
  const ability = access.data.value?.abilities?.weibo
  return ability?.enabled ? '' : formatAbilityDenied('weibo', ability?.label || '微博')
})
const selectedAccount = computed(() => accounts.data.value?.find(account => account.id === accountId.value))
const targetSummary = computed(() => `#${topic.value || '未填写'}[超话]#`)
const contentSummary = computed(() => content.value.slice(0, 120) || '正文未填写')

async function submit() {
  if (operationDisabledReason.value) return feedback.info(operationDisabledReason.value)
  if (!accountId.value) return feedback.warning('请选择账号')
  if (!topic.value.trim()) return feedback.warning('请输入超话名')
  if (!content.value.trim()) return feedback.warning('请输入正文')
  pending.value = true
  try {
    const entity = expectedEntity(access.data.value, personal.value)
    await api.post(`${prefix.value}/posts`, { account_id: accountId.value, topic: topic.value, content: content.value, media_ids: mediaIds.value, ...entity })
    feedback.success('已完成一次远程操作')
  } catch (error) {
    feedback.error(friendlyError(error))
  } finally {
    pending.value = false
  }
}

</script>

<template>
  <div class="weibo-stack">
    <LsPageHeader title="超话发帖" description="首版仅支持超话帖，最多 9 张图片。图片上传后的 pid 可跨账号复用。" />
    <form class="weibo-form" @submit.prevent="submit">
      <LsFormSection title="执行账号" description="选择本次远端操作使用的已绑定账号。">
        <LsField label="微博账号" for-id="weibo-account" required>
          <NSelect id="weibo-account" v-model:value="accountId" :loading="!routeAccess.restricted.value && accounts.isPending.value" :disabled="routeAccess.restricted.value" :options="(accounts.data.value || []).map(account => ({ label: account.screen_name || account.uid, value: account.id }))" :placeholder="routeAccess.restricted.value ? '-' : '选择账号'" />
        </LsField>
      </LsFormSection>

        <LsFormSection title="发布内容" description="填写超话和正文；首版只支持发布到超话。">
          <LsField label="超话" for-id="weibo-topic" required hint="填写超话名称即可，不需要输入井号或“超话”字样。">
            <NInput id="weibo-topic" v-model:value="topic" placeholder="例如：失落青空" />
          </LsField>
          <LsField label="正文" for-id="weibo-content" required>
            <NInput id="weibo-content" v-model:value="content" type="textarea" placeholder="输入微博正文" :autosize="{ minRows: 6, maxRows: 12 }" />
          </LsField>
        </LsFormSection>
        <LsFormSection title="图片" description="每条最多 9 张；上传后的 pid 可跨账号复用，原文件不持久化。">
          <MediaPreparation v-model="mediaIds" :prefix="prefix" :personal="personal" :expected-entity-id="access.data.value?.identity.entity_id ?? 0" :account-id="accountId" :access-disabled-reason="routeAccess.reason.value" />
        </LsFormSection>

      <LsFormSection title="执行" description="点击后最多发出一个远端写请求；失败不会自动重试。">
        <LsDescriptionList>
          <dt>账号</dt><dd>{{ routeAccess.restricted.value ? '-' : selectedAccount?.screen_name || selectedAccount?.uid || '未选择' }}</dd>
          <dt>目标</dt><dd>{{ targetSummary }}</dd>
          <dt>内容</dt><dd>{{ contentSummary }}</dd>
        </LsDescriptionList>
        <LsFormActions>
          <LsButton type="submit" :disabled="Boolean(operationDisabledReason)" :disabled-reason="operationDisabledReason" :loading="pending">发布微博</LsButton>
        </LsFormActions>
      </LsFormSection>
    </form>
  </div>
</template>
