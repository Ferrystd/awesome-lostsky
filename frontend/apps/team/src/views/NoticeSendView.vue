<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NCheckbox, NInput, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

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

const typeLabels: Record<EntityOption['type'], string> = {
  team: '团队',
  teamMember: '成员',
  teamCustomer: '客户',
  teamVirtual: '虚拟实体',
}

const client = useQueryClient()
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
const recipients = computed(() => (entities.data.value ?? []).filter((entity) => entity.type !== 'team'))
const recipientOptions = computed<SelectOption[]>(() => recipients.value.map((entity) => ({
  label: `${entity.name} · ${typeLabels[entity.type]}${entity.slug ? ` (@${entity.slug})` : ''}`,
  value: entity.entity_id,
})))

watch(recipients, (items) => {
  if (!form.entity_id && items.length) form.entity_id = items[0].entity_id
}, { immediate: true })

const send = useMutation({
  mutationFn: () => api.post<SendResult>('/notice/send', {
    entity_id: form.entity_id,
    title: form.title.trim(),
    content: form.content.trim() || null,
    is_pinned: form.is_pinned,
  }),
  onSuccess: async (result) => {
    const recipient = recipients.value.find((item) => item.entity_id === result.entity_id)
    success.value = `通知已发送给 ${recipient?.name || '所选 Entity'}，没有自动抄送 Team。`
    form.title = ''
    form.content = ''
    form.is_pinned = false
    await client.invalidateQueries({ queryKey: ['notices'] })
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
      description="以当前 Team 名义向一个 Entity 发送站内通知。收件人可以是成员、客户或虚拟实体。"
      back-to="/notice"
      back-label="返回站内信"
    />

    <form class="notice-form" @submit.prevent="send.mutate()">
      <section class="delivery-note" aria-labelledby="delivery-note-title">
        <strong id="delivery-note-title">单向送达</strong>
        <p>本次通知只进入所选 Entity 的收件箱，不会自动抄送 Team；Team 原有的 LostSky 收件箱保持不变。</p>
      </section>

      <label class="field">
        <span>收件 Entity <b aria-hidden="true">*</b></span>
        <NSelect
          v-model:value="form.entity_id"
          :options="recipientOptions"
          :loading="entities.isPending.value"
          :disabled="entities.isError.value || !recipientOptions.length"
          filterable
          placeholder="选择成员、客户或虚拟实体"
        />
        <small>选择结果包含 Entity 类型与全局标识，避免发给同名对象。</small>
      </label>
      <p v-if="entities.isError.value" class="feedback error" role="alert">
        收件对象加载失败：{{ friendlyError(entities.error.value) }}
      </p>
      <p v-else-if="entities.isSuccess.value && !recipientOptions.length" class="feedback empty" role="status">
        当前团队还没有可接收通知的 Entity。
      </p>

      <label class="field">
        <span>标题 <b aria-hidden="true">*</b></span>
        <NInput
          v-model:value="form.title"
          maxlength="200"
          show-count
          placeholder="一句话说明通知事项"
          required
        />
      </label>

      <label class="field">
        <span>正文</span>
        <NInput
          v-model:value="form.content"
          type="textarea"
          :autosize="{ minRows: 7, maxRows: 14 }"
          placeholder="补充背景、时间和需要收件人采取的行动"
        />
      </label>

      <NCheckbox v-model:checked="form.is_pinned">
        在收件人的通知列表中置顶
      </NCheckbox>

      <p v-if="success" class="feedback success" role="status" aria-live="polite">{{ success }}</p>
      <p v-if="send.isError.value" class="feedback error" role="alert">
        发送失败：{{ friendlyError(send.error.value) }}。请检查收件对象和内容后重试。
      </p>

      <div class="actions">
        <RouterLink class="cancel" to="/notice">取消</RouterLink>
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
.notice-send-view,.notice-form{display:grid;gap:24px}.notice-form{max-width:42rem}.delivery-note{padding:16px;background:var(--surface-subtle);border:1px solid var(--border);border-radius:var(--radius-md)}.delivery-note strong{font-size:.9375rem}.delivery-note p{margin:6px 0 0;color:var(--text-secondary);font-size:.875rem;line-height:1.6}.field{display:grid;gap:8px}.field>span{color:var(--text-secondary);font-size:.875rem;font-weight:650}.field b{color:var(--danger)}.field small{color:var(--text-secondary);font-size:.8125rem;line-height:1.5}.feedback{margin:0;padding:12px 14px;border-radius:var(--radius-md);font-size:.875rem;line-height:1.55}.success{color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)}.error{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,transparent)}.empty{color:var(--text-secondary);background:var(--surface-subtle)}.actions{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-bottom:36px}.cancel{min-height:50px;display:inline-flex;align-items:center;justify-content:center;padding:.8rem 1.25rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:var(--radius-sm);font-weight:650;text-decoration:none}.cancel:hover{background:var(--cloud)}.cancel:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:2px}@media(max-width:639px){.notice-send-view,.notice-form{gap:20px}.actions>*{flex:1}}
</style>
