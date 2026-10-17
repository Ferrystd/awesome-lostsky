<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
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
import { NCheckbox, NInput } from 'naive-ui'
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
  <LsFormPage aside-label="通知发送摘要" title="发送通知" description="以团队名义向团队内的一位人员发送通知；发送后对方无法回复。">
    <template #actions>
      <LsPageLink to="/notices/sent" :icon="ArrowLeft" label="返回通知" />
    </template>

    <form class="notice-form" @submit.prevent="submit">
      <LsFormSection title="通知内容">
      <section class="delivery-note" aria-labelledby="delivery-note-title">
        <strong id="delivery-note-title">单向、同 Team 送达</strong>
        <p>此为单向通知，不支持回复或会话；发送方显示为团队本身。</p>
      </section>

      <LsFormFields>
        <LsField v-slot="{ describedBy }" label="收件人员" for-id="notice-recipient" required hint="在本团队的人员中选择收件人；不会发给同名对象。">
          <LsEntitySelect :aria-describedby="describedBy"
            :input-props="{ 'aria-describedby': describedBy, id: 'notice-recipient', 'aria-label': '收件人员' }"
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

      </LsFormFields>
      <LsFormContent title="正文">
        <LsMarkdownEditor
          ref="editor"
          v-model="form.content"
          draft-key="notice:new"
          :search-entities="searchEntities"
          :upload-image="uploadMarkdownImage"
          :upload-disabled-reason="uploadDisabledReason"
          placeholder="使用 Markdown 补充背景、时间和需要收件人采取的行动；输入 @ 可引用对象"
        />
      </LsFormContent>

      <LsFormFields><LsField label="列表位置" for-id="notice-pinned"><NCheckbox id="notice-pinned" v-model:checked="form.is_pinned">在收件人的通知列表中置顶</NCheckbox></LsField></LsFormFields>
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
  <template #aside><LsPanel><LsSectionHeader title="发送预览" description="当前草稿；确认正文和收件人后发送。" /><LsDescriptionList><dt>收件人</dt><dd>{{ routeAccess.restricted.value ? '-' : (recipients.find(item => item.entity_id === form.entity_id)?.name || '尚未选择') }}</dd><dt>标题</dt><dd>{{ routeAccess.restricted.value ? '-' : (form.title || '尚未填写') }}</dd><dt>置顶</dt><dd>{{ routeAccess.restricted.value ? '-' : (form.is_pinned ? '置顶显示' : '普通通知') }}</dd><dt>回复方式</dt><dd>{{ '收件人无法回复此通知' }}</dd></LsDescriptionList></LsPanel></template>
  </LsFormPage>
</template>

<style scoped>
.notice-form{display:grid;gap:1.5rem}.delivery-note strong{font-size:.9375rem}.delivery-note p{margin:6px 0 0;color:var(--text-secondary);font-size:.875rem;line-height:1.6}.feedback{margin:0;padding:12px 14px;border-radius:var(--radius-md);font-size:.875rem;line-height:1.55}.success{color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)}.empty{color:var(--text-secondary);background:var(--surface-subtle)}
</style>
