<script setup lang="ts">
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { ApiError, api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import type { EntityType } from '@lostsky/ui/entity'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { MessageCircleMore, Save } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { permissionReason, resourceUploadReason, useTeamAccess } from '../lib/teamAccess'

interface EntitySummary {
  entity_id: number
  slug: string
  type: EntityType
  name: string
}
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
  senders: EntitySummary[]
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
  return typeof value.id === 'number' && typeof value.slug === 'string' && typeof value.name === 'string' && typeof value.is_blocked === 'boolean' && typeof value.balance.balance === 'string' && typeof value.balance.recharged === 'string' && typeof value.balance.spent === 'string' && Array.isArray(value.senders) && typeof value.summary.transaction_count === 'number' && typeof value.summary.transaction_total === 'string' && typeof value.summary.order_count === 'number' && typeof value.summary.order_total === 'string' && typeof value.can_manage === 'boolean'
}

const route = useRoute()
const id = computed(() => Number(route.params.id))
const client = useQueryClient()
const access = useTeamAccess()
const routeAccess = useRouteAccess()
async function loadCustomerDetail() {
  const path = `/customer/${id.value}`
  const value = await routeAccess.read(() => api.get<unknown>(path))
  if (value === null && routeAccess.restricted.value) return null
  if (!isCustomerDetail(value)) {
    throw new ApiError('顾客详情数据不完整，请刷新后重试', {
      method: 'GET',
      path,
    })
  }
  return value
}
const query = useQuery({
  queryKey: computed(() => ['team-customer', id.value]),
  queryFn: loadCustomerDetail,
})
const canManage = computed(() => Boolean(query.data.value?.can_manage))
const manageReason = permissionReason('team.customer.manage')
const avatarUploading = ref(false)
const avatarUploadDisabledReason = computed(() => (!canManage.value ? permissionReason('team.customer.manage') : resourceUploadReason(access.data.value)))
const assignees = useQuery({
  queryKey: ['team-customer-assignees'],
  queryFn: () => api.get<EntitySummary[]>('/customer/assignees'),
  enabled: canManage,
})
const senderOptions = computed(() => (canManage.value ? (assignees.data.value ?? []) : (query.data.value?.senders ?? [])))
const assigneeOptions = computed(() => canManage.value ? (assignees.data.value ?? []) : (query.data.value?.assignee ? [query.data.value.assignee] : []))
const notFound = computed(() => query.error.value instanceof ApiError && query.error.value.status === 404)
const form = reactive({
  name: '',
  avatar: '',
  description: '',
  assignee_entity_id: null as number | null,
  sender_entity_ids: [] as number[],
  is_blocked: false,
})
const draftKey = () => teamDraftScope('CustomerDetailView', id.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })

watch(
  () => query.data.value,
  (value) => {
    if (!value) return
    const next = { ...form }
    Object.assign(next, {
      name: value.name,
      avatar: value.avatar ?? '',
      description: value.description ?? '',
      assignee_entity_id: value.assignee?.entity_id ?? null,
      sender_entity_ids: value.senders.map((sender) => sender.entity_id),
      is_blocked: value.is_blocked,
    })
    draft.hydrate(next)
},
  { immediate: true },
)
const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const form = submitted.value
    const data = await (
    api.post<void>(`/customer/${id.value}`, {
      name: form.name.trim(),
      avatar: form.avatar.trim() || null,
      description: form.description.trim() || null,
      assignee_entity_id: form.assignee_entity_id,
      sender_entity_ids: form.sender_entity_ids,
      is_blocked: form.is_blocked ? 1 : 0,
    })
    )
    return { data, submitted }
  },
  onSuccess: async ({ submitted }) => {
    if (!draft.accept(submitted)) return
    await Promise.all([client.invalidateQueries({ queryKey: ['team-customer', id.value] }), client.invalidateQueries({ queryKey: ['team-customers'] })])
  },
})
const chatUrl = computed(() => chatWorkspaceUrl('/new', query.data.value?.slug ? { participant: query.data.value.slug } : {}))
const money = (value: string) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(Number(value))
</script>

<template>
  <LsDetailPage :title="query.data.value?.name || '顾客详情'" description="查看顾客归属、余额和经营摘要；历史订单与流水保留创建时的发单归属。" back-to="/customers" back-label="返回顾客列表">
      <template #actions>
        <LsPageLink :icon="MessageCircleMore" label="发起对话" :href="chatUrl" />
      </template>
    <template v-if="query.data.value || routeAccess.restricted.value" #summary>
      <LsMetricGrid aria-label="顾客经营摘要" :items="[
        { key: 'balance', label: '可用余额', value: query.data.value ? money(query.data.value.balance.balance) : '-', hint: query.data.value ? `累计充值 ${money(query.data.value.balance.recharged)}` : '-' },
        { key: 'transactions', label: '流水', value: query.data.value ? `${query.data.value.summary.transaction_count} 笔` : '-', hint: query.data.value ? money(query.data.value.summary.transaction_total) : '-' },
        { key: 'orders', label: '订单', value: query.data.value ? `${query.data.value.summary.order_count} 笔` : '-', hint: query.data.value ? money(query.data.value.summary.order_total) : '-' },
      ]" />
    </template>

    <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
    <LsPanel v-if="routeAccess.restricted.value">
      <template #header><LsSectionHeader title="顾客资料"><template #aside><LsStatusTag label="只读" /></template></LsSectionHeader></template>
      <LsDescriptionList><dt>顾客昵称</dt><dd>-</dd><dt>当前归属人</dt><dd>-</dd><dt>协作发单人</dt><dd>-</dd></LsDescriptionList>
      <LsEmptyState title="顾客资料不可用" description="-" :access-reason="routeAccess.reason.value" />
      <LsFormActions><LsButton :disabled="true" :disabled-reason="routeAccess.reason.value"><template #icon><Save :size="18" /></template>保存顾客资料</LsButton></LsFormActions>
    </LsPanel>
    <LsEmptyState v-else-if="notFound" title="顾客不存在" description="该顾客可能已移除，请返回顾客列表查看其他顾客。" />
    <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取顾客详情" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="5" />
    <template v-else-if="query.data.value">

      <LsPanel>
        <template #header><LsSectionHeader title="顾客资料" :description="`@${query.data.value.slug}`"><template #aside><LsStatusTag :label="canManage ? '可维护' : '只读'" /></template></LsSectionHeader></template>
        <form @submit.prevent="save.mutate()">
          <LsInlineError v-if="assignees.isError.value" :message="friendlyError(assignees.error.value)" />
          <LsField label="顾客昵称" for-id="customer-name"><NInput v-model:value="form.name" :input-props="{ id: 'customer-name' }" :disabled="!canManage" maxlength="50" /></LsField>
          <LsField label="头像" for-id="customer-avatar"><LsMediaUploadField id="customer-avatar" v-model="form.avatar" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传头像" :disabled="avatarUploading || Boolean(avatarUploadDisabledReason)" :disabled-reason="avatarUploadDisabledReason" @uploading="avatarUploading = $event" /></LsField>
          <LsField label="说明" for-id="customer-description"><NInput v-model:value="form.description" :input-props="{ id: 'customer-description' }" :disabled="!canManage" type="textarea" maxlength="500" /></LsField>
          <LsField label="当前归属人" for-id="customer-assignee" hint="变更只影响之后创建的订单和流水，不修改历史发单人。">
            <LsEntitySelect :input-props="{ id: 'customer-assignee', 'aria-label': '当前归属人' }" v-model="form.assignee_entity_id" :entities="assigneeOptions" :loading="canManage && assignees.isPending.value" :disabled="!canManage" clearable placeholder="未归属" />
          </LsField>
          <LsField label="协作发单人" for-id="customer-senders" hint="可以选择多名协作人员；他们仍需开通记账能力并具备相应权限，才能处理该顾客的业务。">
            <LsEntitySelect :input-props="{ id: 'customer-senders', 'aria-label': '协作发单人' }" v-model="form.sender_entity_ids" :entities="senderOptions" :loading="canManage && assignees.isPending.value" :disabled="!canManage" multiple placeholder="未绑定协作发单人" />
          </LsField>
          <LsSwitchField v-model="form.is_blocked" label="封禁顾客" description="封禁后顾客现有身份会话不能继续使用。" :disabled="!canManage" />
          <LsFormActions
            ><LsButton type="submit" :loading="save.isPending.value" :disabled="!canManage || avatarUploading || !draft.dirty.value" :disabled-reason="!canManage ? manageReason : avatarUploading ? '请等待头像上传完成' : !draft.dirty.value ? '尚未修改顾客资料' : undefined"
              ><template #icon><Save :size="18" /></template>保存顾客资料</LsButton
            ></LsFormActions
          >
        </form>
      </LsPanel>
    </template>
  </LsDetailPage>
</template>

<style scoped>
form { min-width: 0; display: grid; gap: 1rem; }
</style>
