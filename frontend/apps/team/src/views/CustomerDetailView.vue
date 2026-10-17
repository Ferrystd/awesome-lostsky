<script setup lang="ts">
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
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
  <LsDetailPage aside-label="顾客业务摘要" title="顾客档案" back-to="/customers" back-label="返回顾客列表">
    <template #actions>
      <LsPageLink :icon="MessageCircleMore" label="发起对话" :href="chatUrl" />
    </template>
    <template v-if="query.data.value && !routeAccess.restricted.value" #summary>
      <div class="customer-profile__identity">
        <LsEntityIdentity type="teamCustomer" :name="query.data.value.name" :slug="query.data.value.slug" :image-url="query.data.value.avatar" size="lg">
          <template #status><LsStatusTag :label="query.data.value.is_blocked ? '已封禁' : '正常'" :type="query.data.value.is_blocked ? 'error' : 'success'" /></template>
        </LsEntityIdentity>
        <p class="customer-profile__intro">{{ query.data.value.description || '尚未填写顾客说明' }}</p>
      </div>
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
    <LsPanel v-else-if="query.data.value">
          <template #header>
            <LsSectionHeader title="维护顾客资料" description="归属与协作关系、基本资料在此统一保存。">
              <template #aside><LsStatusTag :label="canManage ? '可维护' : '只读'" /></template>
            </LsSectionHeader>
          </template>
          <form class="customer-profile__form" @submit.prevent="save.mutate()">
            <section class="customer-profile__group" aria-labelledby="customer-relations-title">
              <h3 id="customer-relations-title">归属与协作</h3>
              <LsInlineError v-if="assignees.isError.value" :message="friendlyError(assignees.error.value)" />
              <LsFormFields>
              <LsField v-slot="{ describedBy }" label="当前归属人" for-id="customer-assignee" hint="变更只影响之后创建的订单和流水，不修改历史发单人。">
                <LsEntitySelect :aria-describedby="describedBy" :input-props="{ 'aria-describedby': describedBy, id: 'customer-assignee', 'aria-label': '当前归属人' }" v-model="form.assignee_entity_id" :entities="assigneeOptions" :loading="canManage && assignees.isPending.value" :disabled="!canManage" clearable placeholder="未归属" />
              </LsField>
              <LsField v-slot="{ describedBy }" label="协作发单人" for-id="customer-senders" hint="可选择多名协作人员；处理业务仍需开通记账能力并具备相应权限。">
                <LsEntitySelect :aria-describedby="describedBy" :input-props="{ 'aria-describedby': describedBy, id: 'customer-senders', 'aria-label': '协作发单人' }" v-model="form.sender_entity_ids" :entities="senderOptions" :loading="canManage && assignees.isPending.value" :disabled="!canManage" multiple placeholder="未绑定协作发单人" />
              </LsField>
              </LsFormFields>
            </section>
            <section class="customer-profile__group" aria-labelledby="customer-basics-title">
              <h3 id="customer-basics-title">基本资料</h3>
              <LsFormFields>
              <LsField label="顾客昵称" for-id="customer-name"><NInput v-model:value="form.name" :input-props="{ id: 'customer-name' }" :disabled="!canManage" maxlength="50" /></LsField>
              <LsField label="头像" for-id="customer-avatar"><LsMediaUploadField id="customer-avatar" v-model="form.avatar" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传头像" :disabled="avatarUploading || Boolean(avatarUploadDisabledReason)" :disabled-reason="avatarUploadDisabledReason" @uploading="avatarUploading = $event" /></LsField>
              <LsField label="说明" for-id="customer-description"><NInput v-model:value="form.description" :input-props="{ id: 'customer-description' }" :disabled="!canManage" type="textarea" maxlength="500" /></LsField>
              <LsSwitchField v-model="form.is_blocked" label="封禁顾客" description="封禁后顾客现有身份会话不能继续使用。" :disabled="!canManage" />
              </LsFormFields>
            </section>
            <LsFormActions>
              <LsButton type="submit" :loading="save.isPending.value" :disabled="!canManage || avatarUploading || !draft.dirty.value" :disabled-reason="!canManage ? manageReason : avatarUploading ? '请等待头像上传完成' : !draft.dirty.value ? '尚未修改顾客资料' : undefined">
                <template #icon><Save :size="18" /></template>保存顾客资料
              </LsButton>
            </LsFormActions>
          </form>
        </LsPanel>
    <template #aside>
      <div class="customer-profile__context">
          <LsPanel>
            <template #header><LsSectionHeader title="业务摘要" description="该顾客在当前团队的累计记录" /></template>
            <div v-if="query.data.value && !routeAccess.restricted.value" class="customer-profile__business">
              <section class="customer-profile__balance" aria-labelledby="customer-balance-title">
                <h3 id="customer-balance-title">可用余额</h3>
                <strong>{{ money(query.data.value.balance.balance) }}</strong>
                <LsDescriptionList>
                  <dt>累计充值</dt><dd>{{ money(query.data.value.balance.recharged) }}</dd>
                  <dt>累计消费</dt><dd>{{ money(query.data.value.balance.spent) }}</dd>
                </LsDescriptionList>
              </section>
              <section class="customer-profile__record" aria-labelledby="customer-orders-title">
                <div class="customer-profile__record-heading"><h3 id="customer-orders-title">订单</h3><span>{{ query.data.value.summary.order_count }} 笔</span></div>
                <p>{{ money(query.data.value.summary.order_total) }}</p>
              </section>
              <section class="customer-profile__record" aria-labelledby="customer-transactions-title">
                <div class="customer-profile__record-heading"><h3 id="customer-transactions-title">流水</h3><span>{{ query.data.value.summary.transaction_count }} 笔</span></div>
                <p>{{ money(query.data.value.summary.transaction_total) }}</p>
              </section>
            </div>
            <LsDescriptionList v-else>
              <dt>可用余额</dt><dd>-</dd><dt>累计充值</dt><dd>-</dd><dt>累计消费</dt><dd>-</dd>
              <dt>订单笔数</dt><dd>-</dd><dt>订单金额</dt><dd>-</dd><dt>流水笔数</dt><dd>-</dd><dt>流水金额</dt><dd>-</dd>
            </LsDescriptionList>
          </LsPanel>
          <p class="customer-profile__note">历史订单与流水保留创建时的发单归属，不随当前归属人变更。</p>
      </div>
    </template>
  </LsDetailPage>
</template>

<style scoped>
.customer-profile__identity { min-width: 0; display: grid; gap: 1rem; padding-block: .25rem .5rem; }
.customer-profile__intro { margin: 0; max-width: 65ch; color: var(--text-secondary); font-size: .875rem; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
.customer-profile__form, .customer-profile__group, .customer-profile__business { min-width: 0; display: grid; gap: 1.25rem; }
.customer-profile__form { gap: 1.75rem; }
.customer-profile__group + .customer-profile__group { padding-top: 1.75rem; border-top: 1px solid var(--border); }
.customer-profile__group h3, .customer-profile__business h3 { margin: 0; color: var(--text); font-size: .875rem; font-weight: 650; }
.customer-profile__context { min-width: 0; display: grid; gap: 1rem; }
.customer-profile__balance { display: grid; gap: .75rem; min-width: 0; }
.customer-profile__balance > strong { font-size: 1.75rem; line-height: 1.3; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.customer-profile__record { padding-top: 1.25rem; border-top: 1px solid var(--border); }
.customer-profile__record-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; align-items: baseline; }
.customer-profile__record-heading > span { color: var(--text-secondary); font-size: .8125rem; font-variant-numeric: tabular-nums; }
.customer-profile__record > p { margin: .5rem 0 0; font-size: 1.125rem; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.customer-profile__note { margin: 0; padding-inline: .25rem; color: var(--text-secondary); font-size: .8125rem; line-height: 1.7; }
@container customer-profile (min-width: 48rem) {
  }
</style>
