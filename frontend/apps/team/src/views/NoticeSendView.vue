<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { entityTypeLabel, entityTypeTone } from '@lostsky/ui/entity'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Bot, Building2, Handshake, UserRound } from '@lucide/vue'
import { NCheckbox, NFormItem, NInput, NSelect } from 'naive-ui'
import type { SelectOption, SelectRenderLabel } from 'naive-ui'
import { computed, h, reactive, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
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

interface RecipientSelectOption extends SelectOption {
  type: EntityOption['type']
  slug: string
  name: string
}

const typeIcons = {
  team: Building2,
  teamMember: UserRound,
  teamCustomer: Handshake,
  teamVirtual: Bot,
} as const
const recipientMenuProps = { class: 'recipient-select-menu' }

const client = useQueryClient()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const access = useTeamAccess()
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
})
const recipients = computed(() => entities.data.value ?? [])
const recipientOptions = computed<RecipientSelectOption[]>(() => recipients.value.map((entity) => ({
  label: `${entity.name} ${entityTypeLabel(entity.type)} ${entity.slug ? `@${entity.slug}` : ''}`,
  value: entity.entity_id,
  type: entity.type,
  slug: entity.slug,
  name: entity.name,
})))
const renderRecipientLabel: SelectRenderLabel = (rawOption) => {
  const option = rawOption as RecipientSelectOption
  const icon = typeIcons[option.type]
  const typeLabel = entityTypeLabel(option.type)
  const tone = entityTypeTone(option.type)

  return h('span', { class: 'recipient-option', 'data-entity-tone': tone }, [
    h('span', { class: 'recipient-option__icon', 'aria-hidden': 'true' }, [
      h(icon, { size: 19, strokeWidth: 1.8 }),
    ]),
    h('span', { class: 'recipient-option__identity' }, [
      h('strong', option.name),
      h('span', { class: 'recipient-option__meta' }, [
        h('span', { class: 'recipient-option__type' }, typeLabel),
        option.slug ? h('span', { class: 'recipient-option__slug' }, `@${option.slug}`) : null,
      ]),
    ]),
  ])
}

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
    success.value = `通知已发送给 ${recipient?.name || '所选 Entity'}。`
    form.title = ''
    form.content = ''
    form.is_pinned = false
    await client.invalidateQueries({ queryKey: ['notices', 'entity'] })
  },
  onError: () => {
    success.value = ''
  },
})
</script>

<template>
  <div class="notice-send-view">
    <AdminPageHeader
      title="发送通知"
      description="由有权限（Permission）的当前实体（Entity）代表 Team，向同 Team 的一个实体（Entity）发送单向通知。"
      back-to="/notices/entity"
      back-label="返回通知"
    />

    <form class="notice-form" @submit.prevent="send.mutate()">
      <section class="delivery-note" aria-labelledby="delivery-note-title">
        <strong id="delivery-note-title">单向、同 Team 送达</strong>
        <p>通知只进入所选实体（Entity）的收件箱，不支持回复、抄送或会话；发送方统一显示为当前 Team。</p>
      </section>

      <LsField label="收件 Entity" for-id="notice-recipient" required hint="可选择 Team、成员、顾客或虚拟实体（Virtual Entity）；结果包含类型与全局标识，避免发给同名对象。">
        <NSelect
          id="notice-recipient"
          v-model:value="form.entity_id"
          class="recipient-select"
          :options="recipientOptions"
          :render-label="renderRecipientLabel"
          :menu-props="recipientMenuProps"
          :loading="entities.isPending.value"
          :disabled="entities.isError.value || !recipientOptions.length"
          :virtual-scroll="false"
          filterable
          placeholder="选择本 Team 内的实体（Entity）"
        />
      </LsField>
      <LsInlineError v-if="entities.isError.value" :message="`收件对象加载失败：${friendlyError(entities.error.value)}`" />
      <p v-else-if="entities.isSuccess.value && !recipientOptions.length" class="feedback empty" role="status">
        当前团队还没有可接收通知的 Entity。
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

      <p v-if="success" class="feedback success" role="status" aria-live="polite">{{ success }}</p>
      <LsInlineError v-if="send.isError.value" :message="`发送失败：${friendlyError(send.error.value)}。请检查收件对象和内容后重试。`" />

      <div class="actions">
        <RouterLink class="cancel" to="/notices/entity">取消</RouterLink>
        <LsButton
          type="submit"
          size="lg"
          :loading="send.isPending.value"
          :disabled="!form.entity_id || !form.title.trim() || entities.isError.value"
        >
          发送通知
        </LsButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.notice-send-view,.notice-form{display:grid;gap:24px}.notice-form{max-width:42rem}.delivery-note{padding:16px;background:var(--surface-subtle);border:1px solid var(--border);border-radius:var(--radius-md)}.delivery-note strong{font-size:.9375rem}.delivery-note p{margin:6px 0 0;color:var(--text-secondary);font-size:.875rem;line-height:1.6}.field{display:grid;gap:8px}.field>span{color:var(--text-secondary);font-size:.875rem;font-weight:650}.field b{color:var(--danger)}.field small{color:var(--text-secondary);font-size:.8125rem;line-height:1.5}.recipient-select :deep(.n-base-selection-label){padding-right:2.5rem}.recipient-select :deep(.recipient-option){grid-template-columns:auto minmax(0,1fr);gap:.5rem}.recipient-select :deep(.recipient-option__icon){width:auto;height:auto;background:transparent;border-radius:0}.recipient-select :deep(.recipient-option__identity){display:flex;align-items:center;gap:.5rem}.recipient-select :deep(.recipient-option__identity strong){flex:0 1 auto}.recipient-select :deep(.recipient-option__meta){min-width:0}.recipient-select :deep(.recipient-option__type){display:none}.feedback{margin:0;padding:12px 14px;border-radius:var(--radius-md);font-size:.875rem;line-height:1.55}.success{color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)}.error{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,transparent)}.empty{color:var(--text-secondary);background:var(--surface-subtle)}.actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-bottom:36px}.cancel{min-height:50px;display:inline-flex;align-items:center;justify-content:center;padding:.8rem 1.25rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:var(--radius-sm);font-weight:650;text-decoration:none}.cancel:hover{background:var(--cloud)}.cancel:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:2px}@media(max-width:639px){.notice-send-view,.notice-form{gap:20px}.recipient-select :deep(.recipient-option__slug){display:none}.actions>*{flex:1}}
</style>

<style>
.recipient-select-menu{padding:6px}.recipient-select-menu .n-base-select-option{height:auto;min-height:62px;padding:7px 10px;border-radius:8px}.recipient-select-menu .n-base-select-option__content{min-width:0;width:100%}.recipient-option{width:100%;min-width:0;display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:10px}.recipient-option__icon{width:38px;height:38px;display:grid;place-items:center;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 88%);border-radius:8px}.recipient-option__identity{min-width:0;display:grid;gap:4px}.recipient-option__identity strong,.recipient-option__slug{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.recipient-option__identity strong{color:var(--ink);font-size:.875rem;line-height:1.2}.recipient-option__meta{min-width:0;display:flex;align-items:center;gap:7px;color:var(--muted-ink);font-size:.75rem;line-height:1.2}.recipient-option__type{flex:none;padding:2px 7px;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 89%);border-radius:999px;font-weight:700}.recipient-option__slug{min-width:0}.recipient-select-menu .n-base-select-option--selected .recipient-option__identity strong{color:var(--sky-lost-strong)}@media(prefers-reduced-motion:reduce){.recipient-select-menu .n-base-select-option{transition:none}}
</style>
