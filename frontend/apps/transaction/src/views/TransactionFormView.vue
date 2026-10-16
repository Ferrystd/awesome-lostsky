<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NDatePicker, NInput, NInputNumber } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerName, money, transactionParticipantDefaults } from '../lib'
import { loadWorkspaceAccess, resolveTransactionAbilityReason, transactionAbilityReason } from '../lib/workspace-access'
import type { TransactionOptions, TransactionRecord } from '../types'

const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const personal = computed(() => route.meta.workspace === 'personal')
const form = reactive({
  handler_entity_id: null as number | null,
  sender_entity_id: null as number | null,
  cs_entity_id: null as number | null,
  customer_id: null as number | null,
  total_price: 0 as number | null,
  cost: 0 as number | null,
  cash: 0 as number | null,
  prepaid: 0 as number | null,
  handler_cut: 0 as number | null,
  sender_cut: 0 as number | null,
  cs_cut: 0 as number | null,
  team_cut: 0 as number | null,
  trans_at: Date.now() as number | null,
  memo: '',
})
const optionsQuery = useQuery({
  queryKey: computed(() => ['transaction-options', personal.value ? 'personal' : 'team']),
  queryFn: () => api.get<TransactionOptions>(personal.value ? '/personal/transaction-options' : '/transaction/options'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const accessQuery = useQuery({
  queryKey: ['transaction-workspace-access'],
  queryFn: () => loadWorkspaceAccess(),
})
const detail = useQuery({
  queryKey: computed(() => ['transaction', id.value]),
  queryFn: () => routeAccess.read(() => api.get<TransactionRecord>(`/transaction/${id.value}`)),
  enabled: computed(() => editing.value && !routeAccess.restricted.value),
})
const draft = useQueryDraft({ key: () => `${location.host}:${JSON.stringify(auth.entity())}:${personal.value}:${id.value}`, read: () => ({ ...form }), apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path || String(to.query.id ?? '') !== String(from.query.id ?? '') })
watch(() => detail.data.value, (data) => {
  if (!data) return
  draft.hydrate({
    handler_entity_id: Number(data.handler_entity_id) || null,
    sender_entity_id: data.sender_entity_id ? Number(data.sender_entity_id) : null,
    cs_entity_id: data.cs_entity_id ? Number(data.cs_entity_id) : null,
    customer_id: data.customer_id ? Number(data.customer_id) : null,
    total_price: Number(data.total_price ?? 0),
    cost: Number(data.cost ?? 0),
    cash: Number(data.cash ?? 0),
    prepaid: Number(data.prepaid ?? 0),
    handler_cut: Number(data.handler_cut ?? 0),
    sender_cut: Number(data.sender_cut ?? 0),
    cs_cut: Number(data.cs_cut ?? 0),
    team_cut: Number(data.team_cut ?? 0),
    trans_at: Number(data.trans_at ?? 0) * 1000,
    memo: String(data.memo ?? ''),
  })
}, { immediate: true })

const paymentTotal = computed(() => Number(form.cash) + Number(form.prepaid))
const allocationTotal = computed(() => Number(form.cost) + Number(form.handler_cut) + Number(form.sender_cut) + Number(form.cs_cut) + Number(form.team_cut))
const balanced = computed(() => {
  const total = Number(form.total_price)
  return Math.round(total * 100) === Math.round(paymentTotal.value * 100)
    && Math.round(total * 100) === Math.round(allocationTotal.value * 100)
})
const hasEntityOptions = computed(() => Array.isArray(optionsQuery.data.value?.entities))
const hasCustomerOptions = computed(() => Array.isArray(optionsQuery.data.value?.customers))
const customers = computed(() => optionsQuery.data.value?.customers ?? [])
const customerEntities = computed(() => customers.value
  .filter(item => Number(item.is_blocked ?? 0) !== 1)
  .map(item => ({
    id: Number(item.id),
    type: 'teamCustomer',
    name: customerName(item, item.id),
    avatar: item.avatar,
  })))
const selectedCustomer = computed(() => customers.value.find(item => Number(item.id) === form.customer_id))
const currentEntityId = computed(() => Number(accessQuery.data.value?.identity?.entity_id) || null)
const balance = computed(() => Number(selectedCustomer.value?.balance?.balance ?? 0))
const operationReason = computed(() => routeAccess.reason.value || (editing.value ? '' : accessQuery.isPending.value ? '正在核对记账能力' : transactionAbilityReason(accessQuery.data.value)))
const amountFields = ['total_price', 'cost', 'cash', 'prepaid', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as const
const submitReason = computed(() => operationReason.value
  || (save.isPending.value ? '正在保存流水，请稍候' : '')
  || (!currentEntityId.value ? '正在核对当前人员身份' : '')
  || (!form.handler_entity_id ? '请选择接单人' : '')
  || (amountFields.some(key => typeof form[key] !== 'number' || !Number.isFinite(form[key]) || Number(form[key]) < 0) ? '请完整填写金额，金额须为大于或等于 0 的数字' : '')
  || (form.trans_at == null || !Number.isFinite(form.trans_at) || form.trans_at <= 0 ? '请选择有效的交易时间' : '')
  || (!balanced.value ? '总价、支付合计与成本分成合计必须一致' : '')
  || (form.prepaid && !form.customer_id ? '使用预存款时请选择顾客' : '')
  || (Number(form.prepaid) > balance.value ? '预存款金额超过当前顾客余额' : ''))
const amountProps = { min: 0, precision: 2, step: 1 } as const

function applyCustomerDefaults(value: number | number[] | null) {
  const customerId = Array.isArray(value) ? null : value
  const customer = customers.value.find(item => Number(item.id) === Number(customerId))
  const defaults = transactionParticipantDefaults(customer, currentEntityId.value)
  form.sender_entity_id = defaults.senderEntityId
  if (defaults.csEntityId) form.cs_entity_id = defaults.csEntityId
}

watch(currentEntityId, (entityId) => {
  if (!editing.value && entityId) applyCustomerDefaults(form.customer_id)
}, { immediate: true })

const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const targetId = id.value
    const wasEditing = editing.value
    const wasPersonal = personal.value
    const data = await api.post<{ id?: number }>(editing.value ? `/transaction/${id.value}` : '/transaction', {
    expected_entity_id: currentEntityId.value,
    ...(!editing.value ? { handler_entity_id: submitted.value.handler_entity_id, type: 2 } : {}),
    sender_entity_id: submitted.value.sender_entity_id,
    cs_entity_id: submitted.value.cs_entity_id,
    customer_id: submitted.value.customer_id,
    total_price: submitted.value.total_price,
    cost: submitted.value.cost,
    cash: submitted.value.cash,
    prepaid: submitted.value.prepaid,
    handler_cut: submitted.value.handler_cut,
    sender_cut: submitted.value.sender_cut,
    cs_cut: submitted.value.cs_cut,
    team_cut: submitted.value.team_cut,
    trans_at: Math.floor(Number(submitted.value.trans_at) / 1000),
    memo: submitted.value.memo.trim() || null,
  })
    return { data, submitted, targetId, wasEditing, wasPersonal }
  },
  onSuccess: async ({ data, submitted, targetId, wasEditing, wasPersonal }) => {
    if (!draft.accept(submitted)) return
    await client.invalidateQueries({ queryKey: ['transactions'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    await router.push(wasPersonal && !wasEditing
      ? '/personal/transactions'
      : `/detail?id=${wasEditing ? targetId : Number(data?.id ?? 0)}`)
  },
})
async function submit() {
  if (submitReason.value) return feedback.info(submitReason.value)
  const reason = await resolveTransactionAbilityReason(accessQuery.data.value)
  if (!editing.value && reason) return feedback.info(reason)
  if (submitReason.value) return feedback.info(submitReason.value)
  save.mutate()
}
const summaryAvailable = computed(() => !routeAccess.restricted.value && (!editing.value || detail.isSuccess.value))
const summaryComplete = computed(() => summaryAvailable.value && amountFields.every(key => typeof form[key] === 'number' && Number.isFinite(form[key]) && Number(form[key]) >= 0))
const summaryMoney = (value: number | null) => summaryAvailable.value && typeof value === 'number' && Number.isFinite(value) && value >= 0 ? money(value) : '-'
</script>

<template>
  <LsFormPage aside-label="流水金额与顾客摘要" :title="editing ? '编辑流水' : '登记流水'" :description="editing ? '接单人创建后不可更换；修改预存款会同步生成余额变动。' : '总价需要同时与支付构成、成本及分成构成保持一致。'">
    <template #actions>
      <LsPageLink :to="editing ? `/detail?id=${id}` : personal ? '/personal/transactions' : '/'" :icon="ArrowLeft" :label="editing ? '返回流水详情' : personal ? '返回我的流水' : '返回流水列表'" />
    </template>

    <LsInlineError v-if="!routeAccess.restricted.value && detail.isError.value" :message="friendlyError(detail.error.value)" />
    <form v-else class="transaction-form" @submit.prevent="submit">
      <LsInlineError v-if="!routeAccess.restricted.value && optionsQuery.isError.value" message="参与方选项暂时无法读取；表单仍可查看，但相关字段已禁用。" />
      <LsFormSection title="参与方" description="选择接单人、发单人、客服与顾客；顾客为空时不能使用预存款。" :heading-level="3">
        <p v-if="optionsQuery.data.value && !hasEntityOptions" class="hint">当前响应未提供主体选项，主体字段已禁用，其他金额与备注仍可填写。</p>
        <p v-if="optionsQuery.data.value && !hasCustomerOptions" class="hint">当前响应未提供顾客选项，顾客与预存款暂不可用。</p>
        <LsField label="接单人" for-id="transaction-handler" required><LsEntitySelect id="transaction-handler" v-model="form.handler_entity_id" :entities="optionsQuery.data.value?.entities ?? []" :loading="!routeAccess.restricted.value && optionsQuery.isPending.value" :disabled="routeAccess.restricted.value || editing || !hasEntityOptions" :placeholder="routeAccess.restricted.value ? '-' : '选择接单人'" /></LsField>
        <LsField label="发单人" for-id="transaction-sender"><LsEntitySelect id="transaction-sender" v-model="form.sender_entity_id" :entities="optionsQuery.data.value?.entities ?? []" :loading="optionsQuery.isPending.value" :disabled="!hasEntityOptions" clearable placeholder="可选" /></LsField>
        <LsField label="客服" for-id="transaction-cs"><LsEntitySelect id="transaction-cs" v-model="form.cs_entity_id" :entities="optionsQuery.data.value?.entities ?? []" :loading="optionsQuery.isPending.value" :disabled="!hasEntityOptions" clearable placeholder="可选" /></LsField>
        <LsField label="顾客" for-id="transaction-customer"><LsEntitySelect id="transaction-customer" v-model="form.customer_id" :entities="customerEntities" :loading="optionsQuery.isPending.value" :disabled="!hasCustomerOptions" clearable placeholder="可选；使用预存款时必填" @update:model-value="applyCustomerDefaults" /></LsField>
        <p v-if="selectedCustomer" class="balance-hint">当前顾客余额 <strong class="ls-tabular">{{ money(balance) }}</strong></p>
      </LsFormSection>
      <LsFormSection title="金额与支付" description="现款 + 预存款必须等于总价。" :heading-level="3"><template #aside><strong :class="balanced ? 'ok' : 'warn'">{{ balanced ? '金额平衡' : '金额未平衡' }}</strong></template>
        <LsField label="总价" for-id="transaction-total" required><NInputNumber id="transaction-total" v-model:value="form.total_price" v-bind="amountProps" /></LsField>
        <LsField label="现款" for-id="transaction-cash"><NInputNumber id="transaction-cash" v-model:value="form.cash" v-bind="amountProps" /></LsField>
        <LsField label="预存款" for-id="transaction-prepaid"><NInputNumber id="transaction-prepaid" v-model:value="form.prepaid" v-bind="amountProps" :disabled="!hasCustomerOptions" /></LsField>
        <p class="equation ls-tabular">支付合计 {{ money(paymentTotal) }} / 总价 {{ money(form.total_price) }}</p>
      </LsFormSection>
      <LsFormSection title="成本与分成" description="成本 + 四类分成必须等于总价。" :heading-level="3">
        <LsField label="成本" for-id="transaction-cost"><NInputNumber id="transaction-cost" v-model:value="form.cost" v-bind="amountProps" /></LsField>
        <LsField label="接单人分成" for-id="transaction-handler-cut"><NInputNumber id="transaction-handler-cut" v-model:value="form.handler_cut" v-bind="amountProps" /></LsField>
        <LsField label="发单人分成" for-id="transaction-sender-cut"><NInputNumber id="transaction-sender-cut" v-model:value="form.sender_cut" v-bind="amountProps" /></LsField>
        <LsField label="客服分成" for-id="transaction-cs-cut"><NInputNumber id="transaction-cs-cut" v-model:value="form.cs_cut" v-bind="amountProps" /></LsField>
        <LsField label="团队分成" for-id="transaction-team-cut"><NInputNumber id="transaction-team-cut" v-model:value="form.team_cut" v-bind="amountProps" /></LsField>
        <p class="equation ls-tabular">成本与分成合计 {{ money(allocationTotal) }} / 总价 {{ money(form.total_price) }}</p>
      </LsFormSection>
      <LsFormSection title="交易信息" description="时间用于列表排序和统计归属。" :heading-level="3">
        <LsField label="交易时间" for-id="transaction-time" required><NDatePicker id="transaction-time" v-model:value="form.trans_at" type="datetime" clearable /></LsField>
        <LsField label="备注" for-id="transaction-memo"><NInput id="transaction-memo" v-model:value="form.memo" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" maxlength="500" show-count placeholder="可记录订单来源、异常说明或结算信息" /></LsField>
      </LsFormSection>
      <LsInlineError v-if="Number(form.prepaid) > balance && selectedCustomer" message="预存款金额超过当前顾客余额。" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions>
        <LsButton type="button" variant="ghost" @click="router.back()"><template #icon><ArrowLeft :size="16" /></template>取消</LsButton>
        <LsButton type="submit" size="lg" :loading="save.isPending.value" :disabled="Boolean(submitReason)" :disabled-reason="submitReason">保存流水</LsButton>
      </LsFormActions>
    </form>
    <template #aside>
      <LsFormSection title="金额摘要" description="当前草稿，保存后生效">
        <p v-if="routeAccess.restricted.value" class="transaction-context-note">{{ routeAccess.reason.value }}</p>
        <LsInlineError v-else-if="editing && detail.isError.value" :message="friendlyError(detail.error.value)" />
        <LsAsyncState v-else-if="editing && detail.isPending.value" state="loading" :rows="3" />
        <template v-else>
          <LsDescriptionList>
            <dt>总价</dt><dd>{{ summaryMoney(form.total_price) }}</dd>
            <dt>现款</dt><dd>{{ summaryMoney(form.cash) }}</dd>
            <dt>预存款</dt><dd>{{ summaryMoney(form.prepaid) }}</dd>
            <dt>支付合计</dt><dd>{{ summaryComplete ? money(paymentTotal) : '-' }}</dd>
            <dt>成本及分成</dt><dd>{{ summaryComplete ? money(allocationTotal) : '-' }}</dd>
          </LsDescriptionList>
          <LsStatusTag :label="!summaryComplete ? '金额待补全' : balanced ? '金额已平衡' : '金额未平衡'" :type="summaryComplete && balanced ? 'success' : 'warning'" />
          <p v-if="summaryComplete && !balanced" class="transaction-context-note">支付与总价相差 {{ money(Math.abs(paymentTotal - Number(form.total_price))) }}；成本及分成与总价相差 {{ money(Math.abs(allocationTotal - Number(form.total_price))) }}。</p>
        </template>
      </LsFormSection>
      <LsFormSection title="顾客与余额" description="当前选择的顾客">
        <p v-if="routeAccess.restricted.value" class="transaction-context-note">顾客信息不可读取。</p>
        <LsInlineError v-else-if="optionsQuery.isError.value" message="顾客信息暂时无法读取。" />
        <LsAsyncState v-else-if="optionsQuery.isPending.value || (editing && detail.isPending.value)" state="loading" :rows="2" />
        <p v-else-if="editing && detail.isError.value" class="transaction-context-note">流水详情读取失败，无法确认顾客。</p>
        <LsDescriptionList v-else-if="selectedCustomer">
          <dt>顾客</dt><dd>{{ customerName(selectedCustomer, selectedCustomer.id) }}</dd>
          <dt>当前余额</dt><dd>{{ selectedCustomer.balance?.balance != null ? money(balance) : '-' }}</dd>
          <dt>本次预存款</dt><dd>{{ summaryMoney(form.prepaid) }}</dd>
        </LsDescriptionList>
        <p v-else class="transaction-context-note">{{ form.customer_id ? '当前顾客资料不在可读取范围内。' : '尚未选择顾客；使用预存款时需选择顾客。' }}</p>
      </LsFormSection>
    </template>
  </LsFormPage>
</template>

<style scoped>
.transaction-context-note { margin: 0; color: var(--text-secondary); font-size: .8125rem; line-height: 1.7; }
.transaction-form{display:grid;gap:1.25rem}.ok,.warn{font-size:.78rem}.ok{color:var(--success)}.warn{color:var(--warning)}.balance-hint,.equation{margin:0;padding:.7rem .8rem;border-radius:8px;background:var(--cloud);color:var(--muted-ink);font-size:.82rem}.balance-hint strong{color:var(--ink)}
</style>
