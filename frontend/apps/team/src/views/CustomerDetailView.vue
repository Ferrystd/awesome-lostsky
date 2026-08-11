<script setup lang="ts">
import { ApiError, api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import type { EntityType } from '@lostsky/ui/entity'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { MessageCircleMore, Save } from '@lucide/vue'
import { NInput, NSelect } from 'naive-ui'
import type { SelectOption, SelectRenderLabel } from 'naive-ui'
import { computed, h, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPage from '../components/AdminPage.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import EntitySelectOption from '../components/EntitySelectOption.vue'
import { abilityReason, hasPermission, permissionReason, resourceUploadReason, useTeamAccess } from '../lib/teamAccess'

interface EntitySummary {
  entity_id: number
  slug: string
  type: EntityType
  name: string
}
interface AssigneeSelectOption extends SelectOption, EntitySummary {}
interface CustomerDetail {
  id: number
  slug: string
  name: string
  avatar?: string | null
  description?: string | null
  is_blocked: boolean
  create_time: number
  balance: { balance: string; recharged: string; spent: string }
  assignee?: EntitySummary | null
  summary: {
    transaction_count: number
    transaction_total: string
    order_count: number
    order_total: string
  }
  can_manage: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCustomerDetail(value: unknown): value is CustomerDetail {
  if (!isRecord(value) || !isRecord(value.balance) || !isRecord(value.summary)) return false
  return typeof value.id === 'number'
    && typeof value.slug === 'string'
    && typeof value.name === 'string'
    && typeof value.is_blocked === 'boolean'
    && typeof value.balance.balance === 'string'
    && typeof value.balance.recharged === 'string'
    && typeof value.balance.spent === 'string'
    && typeof value.summary.transaction_count === 'number'
    && typeof value.summary.transaction_total === 'string'
    && typeof value.summary.order_count === 'number'
    && typeof value.summary.order_total === 'string'
    && typeof value.can_manage === 'boolean'
}

const route = useRoute()
const id = computed(() => Number(route.params.id))
const client = useQueryClient()
const access = useTeamAccess()
async function loadCustomerDetail() {
  const path = `/customer/${id.value}`
  const value = await api.get<unknown>(path)
  if (!isCustomerDetail(value)) {
    throw new ApiError('客户详情数据不完整，请刷新后重试', { method: 'GET', path })
  }
  return value
}
const query = useQuery({
  queryKey: computed(() => ['team-customer', id.value]),
  queryFn: loadCustomerDetail,
})
const canManage = computed(() => Boolean(query.data.value?.can_manage))
const avatarUploading = ref(false)
const avatarUploadDisabledReason = computed(() => !canManage.value
  ? permissionReason('team.customer.manage')
  : resourceUploadReason(access.data.value))
const assignees = useQuery({
  queryKey: ['team-customer-assignees'],
  queryFn: () => api.get<EntitySummary[]>('/customer/assignees'),
  enabled: canManage,
})
const form = reactive({
  name: '',
  avatar: '',
  description: '',
  assignee_entity_id: null as number | null,
  is_blocked: false,
})
watch(() => query.data.value, value => {
  if (!value) return
  Object.assign(form, {
    name: value.name,
    avatar: value.avatar ?? '',
    description: value.description ?? '',
    assignee_entity_id: value.assignee?.entity_id ?? null,
    is_blocked: value.is_blocked,
  })
}, { immediate: true })
const save = useMutation({
  mutationFn: () => api.post<void>(`/customer/${id.value}`, {
    name: form.name.trim(),
    avatar: form.avatar.trim() || null,
    description: form.description.trim() || null,
    assignee_entity_id: form.assignee_entity_id,
    is_blocked: form.is_blocked ? 1 : 0,
  }),
  onSuccess: async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['team-customer', id.value] }),
      client.invalidateQueries({ queryKey: ['team-customers'] }),
    ])
  },
})
const assigneeOptions = computed<AssigneeSelectOption[]>(() => (assignees.data.value ?? []).map(item => ({
  ...item,
  label: `${item.name} @${item.slug}`,
  value: item.entity_id,
})))
const assigneeMenuProps = { class: 'entity-select-menu' }
const renderAssigneeLabel: SelectRenderLabel = option => h(EntitySelectOption, { entity: option as AssigneeSelectOption })
const chatReason = computed(() => {
  const snapshot = access.data.value
  if (!snapshot || !snapshot.permissions) return ''
  const chat = snapshot.abilities?.chat
  if (chat && !chat.enabled) return abilityReason('chat', chat.label || '聊天')
  if (!hasPermission(snapshot, 'chat.conversation.create')) return permissionReason('chat.conversation.create')
  return ''
})
const chatUrl = computed(() => query.data.value?.slug
  ? chatWorkspaceUrl('/new', { participant: query.data.value.slug })
  : '')
const money = (value: string) => new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
}).format(Number(value))
</script>

<template>
  <AdminPage width="form">
    <AdminPageHeader
      :title="query.data.value?.name || '客户详情'"
      description="查看客户归属、余额和经营摘要；历史订单与流水保留创建时的发单归属。"
      back-to="/customers"
      back-label="返回客户列表"
    >
      <template #actions>
        <a v-if="!chatReason && chatUrl" class="chat-link" :href="chatUrl"><MessageCircleMore :size="18" />发起对话</a>
        <LsButton v-else variant="secondary" class="chat-link" :title="chatReason" disabled><template #icon><MessageCircleMore :size="18" /></template>发起对话</LsButton>
      </template>
    </AdminPageHeader>

    <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取客户详情" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="5" />
    <template v-else-if="query.data.value">
      <section class="summary-grid" aria-label="客户经营摘要">
        <article><span>可用余额</span><strong>{{ money(query.data.value.balance.balance) }}</strong><small>累计充值 {{ money(query.data.value.balance.recharged) }}</small></article>
        <article><span>流水</span><strong>{{ query.data.value.summary.transaction_count }} 笔</strong><small>{{ money(query.data.value.summary.transaction_total) }}</small></article>
        <article><span>订单</span><strong>{{ query.data.value.summary.order_count }} 笔</strong><small>{{ money(query.data.value.summary.order_total) }}</small></article>
      </section>

      <LsPanel>
        <template #header><header class="detail-heading"><div><h3>客户资料</h3><p>@{{ query.data.value.slug }}</p></div><span>{{ canManage ? '可维护' : '只读' }}</span></header></template>
        <form @submit.prevent="save.mutate()">
          <LsField label="客户昵称" for-id="customer-name"><NInput v-model:value="form.name" :input-props="{ id: 'customer-name' }" :disabled="!canManage" maxlength="50" /></LsField>
          <LsField label="头像" for-id="customer-avatar"><LsMediaUploadField id="customer-avatar" v-model="form.avatar" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传头像" :disabled="avatarUploading || Boolean(avatarUploadDisabledReason)" :disabled-reason="avatarUploadDisabledReason" @uploading="avatarUploading = $event" /></LsField>
          <LsField label="说明" for-id="customer-description"><NInput v-model:value="form.description" :input-props="{ id: 'customer-description' }" :disabled="!canManage" type="textarea" maxlength="500" /></LsField>
          <LsField label="当前归属人" for-id="customer-assignee" hint="变更只影响之后创建的订单和流水，不修改历史发单人。">
            <NSelect
              id="customer-assignee"
              v-model:value="form.assignee_entity_id"
              :options="assigneeOptions"
              :render-label="renderAssigneeLabel"
              :menu-props="assigneeMenuProps"
              :loading="assignees.isPending.value"
              :disabled="!canManage"
              :virtual-scroll="false"
              filterable
              clearable
              placeholder="未归属"
            />
          </LsField>
          <LsSwitchField v-model="form.is_blocked" label="封禁客户" description="封禁后客户现有身份会话不能继续使用。" :disabled="!canManage" />
          <LsFormActions v-if="canManage"><LsButton type="submit" :loading="save.isPending.value" :disabled="avatarUploading"><template #icon><Save :size="18" /></template>保存客户资料</LsButton></LsFormActions>
        </form>
      </LsPanel>
    </template>
  </AdminPage>
</template>

<style scoped>
.chat-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .9rem;border:0;border-radius:9px;color:white;background:var(--sky-lost-strong);font-size:.875rem;font-weight:700}.chat-link.disabled{color:var(--muted-ink);background:var(--cloud);cursor:not-allowed}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.summary-grid article{display:grid;gap:.25rem;padding:1.1rem;border-right:1px solid var(--line)}.summary-grid article:last-child{border-right:0}.summary-grid span,.summary-grid small{color:var(--muted-ink);font-size:.76rem}.summary-grid strong{font-size:1.1rem;font-variant-numeric:tabular-nums}.detail-heading{display:flex;align-items:start;justify-content:space-between;gap:1rem}.detail-heading h3,.detail-heading p{margin:0}.detail-heading p{margin-top:.2rem;color:var(--muted-ink);font-size:.8rem}.detail-heading>span{padding:.2rem .5rem;border-radius:999px;background:var(--cloud);font-size:.72rem;font-weight:700}.ls-panel form{max-width:42rem;display:grid;gap:1rem}
@media(max-width:640px){.summary-grid{grid-template-columns:1fr}.summary-grid article{border-right:0;border-bottom:1px solid var(--line)}.summary-grid article:last-child{border-bottom:0}}
</style>
