<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NCheckbox, NFormItem, NInput } from 'naive-ui'
import { computed, reactive, ref } from 'vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { searchEntities, uploadMarkdownImage } from '../lib/markdown'
import { resourceUploadReason, useTeamAccess } from '../lib/teamAccess'

interface EntityOption {
  entity_id: number
  type: 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
  slug: string
  name: string
}

interface SendResult {
  id: number
  entity_id: number
}

const client = useQueryClient()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const access = useTeamAccess()
const routeAccess = useRouteAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const success = ref('')
const form = reactive({
  entity_id: 0,
  title: '',
  content: '',
  is_pinned: false,
})

const entities = useQuery({
  queryKey: ['entity-options'],
  queryFn: () => api.get<EntityOption[]>('/entity/options'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const recipients = computed(() => entities.data.value ?? [])
const send = useMutation({
  mutationFn: () => api.post<SendResult>('/notice/send', {
    entity_id: form.entity_id,
    title: form.title.trim(),
    content: form.content.trim() || null,
    is_pinned: form.is_pinned,
  }),
  onSuccess: async (result) => {
    editor.value?.clearDraft()
    const recipient = recipients.value.find((item) => item.entity_id === result.entity_id)
    success.value = `通知已发送给 ${recipient?.name || '所选人员'}。`
    form.title = ''
    form.content = ''
    form.is_pinned = false
    await client.invalidateQueries({ queryKey: ['notices', 'entity'] })
  },
  onError: () => {
    success.value = ''
  },
})

function submit() {
  if (routeAccess.restricted.value) return
  send.mutate()
}
</script>

<template>
  <LsFormPage title="发送通知" description="以团队名义向团队内的一位人员发送通知；发送后对方无法回复。">
    <template #actions>
      <LsPageLink to="/notices/sent" :icon="ArrowLeft" label="返回通知" />
    </template>

    <form class="notice-form" @submit.prevent="submit">
      <LsFormSection title="收件人员" description="以团队名义发送给一位人员；通知为单向消息，对方不能直接回复。">
      <LsField label="收件人员" for-id="notice-recipient" required hint="在本团队的人员中选择收件人；不会发给同名对象。">
        <LsEntitySelect
          :input-props="{ id: 'notice-recipient', 'aria-label': '收件人员' }"
          v-model="form.entity_id"
          :entities="recipients"
          :loading="!routeAccess.restricted.value && entities.isPending.value"
          :disabled="entities.isError.value || !recipients.length"
          :placeholder="routeAccess.restricted.value ? '-' : '选择本 Team 内的人员'"
        />
      </LsField>
      <LsInlineError v-if="entities.isError.value && !routeAccess.restricted.value" :message="`收件对象加载失败：${friendlyError(entities.error.value)}`" />
      <p v-else-if="entities.isSuccess.value && !recipients.length" class="feedback empty" role="status">
        当前团队还没有可接收通知的人员。
      </p>

      </LsFormSection>
      <LsFormSection title="通知内容" description="用标题概括事项，在正文中说明时间、背景和需要采取的行动。">
      <LsField label="标题" for-id="notice-title" required>
        <NInput
          :input-props="{ id: 'notice-title' }"
          v-model:value="form.title"
          maxlength="200"
          show-count
          placeholder="一句话说明通知事项"
          required
        />
      </LsField>

      <NFormItem label="正文">
        <LsMarkdownEditor
          ref="editor"
          v-model="form.content"
          draft-key="notice:new"
          :search-entities="searchEntities"
          :upload-image="uploadMarkdownImage"
          :upload-disabled-reason="uploadDisabledReason"
          placeholder="使用 Markdown 补充背景、时间和需要收件人采取的行动；输入 @ 可引用对象"
        />
      </NFormItem>

      <NFormItem label="列表位置"><NCheckbox v-model:checked="form.is_pinned">在收件人的通知列表中置顶</NCheckbox></NFormItem>
      </LsFormSection>

      <p v-if="success" class="feedback success" role="status" aria-live="polite">{{ success }}</p>
      <LsInlineError v-if="send.isError.value && !routeAccess.restricted.value" :message="`发送失败：${friendlyError(send.error.value)}。请检查收件对象和内容后重试。`" />

      <LsFormActions>
        <LsPageLink href="/notices/sent" :icon="ArrowLeft" label="取消" />
        <LsButton
          type="submit"
          :loading="send.isPending.value"
          :disabled="routeAccess.restricted.value || !form.entity_id || !form.title.trim() || entities.isError.value"
          :disabled-reason="routeAccess.reason.value"
        >
          发送通知
        </LsButton>
      </LsFormActions>
    </form>
  </LsFormPage>
</template>

<style scoped>
.notice-form{display:grid;gap:1.5rem}.feedback{margin:0;padding:12px 14px;border-radius:var(--radius-md);font-size:.875rem;line-height:1.55}.success{color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)}.empty{color:var(--text-secondary);background:var(--surface-subtle)}
</style>
