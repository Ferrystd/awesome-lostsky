<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerOptions, entityOptions, money } from '../lib'
import type { TransactionOptions, TransactionRecord } from '../types'

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  handler_entity_id: null as number | null,
  sender_entity_id: null as number | null,
  cs_entity_id: null as number | null,
  customer_id: null as number | null,
  total_price: 0,
  cost: 0,
  cash: 0,
  prepaid: 0,
  handler_cut: 0,
  sender_cut: 0,
  cs_cut: 0,
  team_cut: 0,
  trans_at: Date.now(),
  memo: '',
})
const optionsQuery = useQuery({
  queryKey: ['transaction-options'],
  queryFn: () => api.get<TransactionOptions>('/transaction/options'),
})
const detail = useQuery({
  queryKey: computed(() => ['transaction', id.value]),
  queryFn: () => api.get<TransactionRecord>(`/transaction/${id.value}`),
  enabled: editing,
})
watch(() => detail.data.value, (data) => {
  if (!data) return
  Object.assign(form, {
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
const selectedCustomer = computed(() => customers.value.find(item => Number(item.id) === form.customer_id))
const balance = computed(() => Number(selectedCustomer.value?.balance?.balance ?? 0))
const canSubmit = computed(() => Boolean(form.handler_entity_id && form.trans_at && balanced.value && (!form.prepaid || form.customer_id)))
const amountProps = { min: 0, precision: 2, step: 1 } as const

const save = useMutation({
  mutationFn: () => api.post<{ id?: number }>(editing.value ? `/transaction/${id.value}` : '/transaction', {
    ...(!editing.value ? { handler_entity_id: form.handler_entity_id, type: 2 } : {}),
    sender_entity_id: form.sender_entity_id,
    cs_entity_id: form.cs_entity_id,
    customer_id: form.customer_id,
    total_price: form.total_price,
    cost: form.cost,
    cash: form.cash,
    prepaid: form.prepaid,
    handler_cut: form.handler_cut,
    sender_cut: form.sender_cut,
    cs_cut: form.cs_cut,
    team_cut: form.team_cut,
    trans_at: Math.floor(form.trans_at / 1000),
    memo: form.memo.trim() || null,
  }),
  onSuccess: async (data) => {
    await client.invalidateQueries({ queryKey: ['transactions'] })
    await router.push(`/detail?id=${editing.value ? id.value : Number(data?.id ?? 0)}`)
  },
})
</script>

<template>
  <div class="transaction-form-view">
    <LsPageHeader
      :title="editing ? '编辑流水' : '登记流水'"
      :description="editing ? '接单人创建后不可更换；修改预存款会同步生成余额变动。' : '总价需要同时与支付构成、成本及分配构成保持一致。'"
      :back-to="editing ? `/detail?id=${id}` : '/'"
      :back-label="editing ? '返回流水详情' : '返回流水列表'"
    />
    <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
    <form v-else class="transaction-form" @submit.prevent="save.mutate()">
      <LsInlineError v-if="optionsQuery.isError.value" message="参与方选项暂时无法读取；表单仍可查看，但相关字段已禁用。" />
      <LsPanel><div class="form-panel">
        <div class="section-title"><div><h3>参与方</h3><p>选择接单人、发单人、客服与客户；客户为空时不能使用预存款。</p></div></div>
        <p v-if="optionsQuery.data.value && !hasEntityOptions" class="hint">当前响应未提供主体选项，主体字段已禁用，其他金额与备注仍可填写。</p>
        <p v-if="optionsQuery.data.value && !hasCustomerOptions" class="hint">当前响应未提供客户选项，客户与预存款暂不可用。</p>
        <LsField label="接单人" for-id="transaction-handler" required><NSelect id="transaction-handler" v-model:value="form.handler_entity_id" :options="entityOptions(optionsQuery.data.value)" filterable :disabled="editing || !hasEntityOptions" placeholder="选择接单人" /></LsField>
        <LsField label="发单人" for-id="transaction-sender"><NSelect id="transaction-sender" v-model:value="form.sender_entity_id" :options="entityOptions(optionsQuery.data.value)" filterable clearable :disabled="!hasEntityOptions" placeholder="可选" /></LsField>
        <LsField label="客服" for-id="transaction-cs"><NSelect id="transaction-cs" v-model:value="form.cs_entity_id" :options="entityOptions(optionsQuery.data.value)" filterable clearable :disabled="!hasEntityOptions" placeholder="可选" /></LsField>
        <LsField label="客户" for-id="transaction-customer"><NSelect id="transaction-customer" v-model:value="form.customer_id" :options="customerOptions(optionsQuery.data.value)" filterable clearable :disabled="!hasCustomerOptions" placeholder="可选；使用预存款时必填" /></LsField>
        <p v-if="selectedCustomer" class="balance-hint">当前客户余额 <strong class="ls-tabular">{{ money(balance) }}</strong></p>
      </div></LsPanel>
      <LsPanel><div class="form-panel">
        <div class="section-title"><div><h3>金额与支付</h3><p>现款 + 预存款必须等于总价。</p></div><strong :class="balanced ? 'ok' : 'warn'">{{ balanced ? '金额平衡' : '金额未平衡' }}</strong></div>
        <LsField label="总价" for-id="transaction-total" required><NInputNumber id="transaction-total" v-model:value="form.total_price" v-bind="amountProps" /></LsField>
        <LsField label="现款" for-id="transaction-cash"><NInputNumber id="transaction-cash" v-model:value="form.cash" v-bind="amountProps" /></LsField>
        <LsField label="预存款" for-id="transaction-prepaid"><NInputNumber id="transaction-prepaid" v-model:value="form.prepaid" v-bind="amountProps" :disabled="!hasCustomerOptions" /></LsField>
        <p class="equation ls-tabular">支付合计 {{ money(paymentTotal) }} / 总价 {{ money(form.total_price) }}</p>
      </div></LsPanel>
      <LsPanel><div class="form-panel">
        <div class="section-title"><div><h3>成本与分配</h3><p>成本 + 四类分配必须等于总价。</p></div></div>
        <LsField label="成本" for-id="transaction-cost"><NInputNumber id="transaction-cost" v-model:value="form.cost" v-bind="amountProps" /></LsField>
        <LsField label="接单人分配" for-id="transaction-handler-cut"><NInputNumber id="transaction-handler-cut" v-model:value="form.handler_cut" v-bind="amountProps" /></LsField>
        <LsField label="发单人分配" for-id="transaction-sender-cut"><NInputNumber id="transaction-sender-cut" v-model:value="form.sender_cut" v-bind="amountProps" /></LsField>
        <LsField label="客服分配" for-id="transaction-cs-cut"><NInputNumber id="transaction-cs-cut" v-model:value="form.cs_cut" v-bind="amountProps" /></LsField>
        <LsField label="团队分配" for-id="transaction-team-cut"><NInputNumber id="transaction-team-cut" v-model:value="form.team_cut" v-bind="amountProps" /></LsField>
        <p class="equation ls-tabular">成本与分配合计 {{ money(allocationTotal) }} / 总价 {{ money(form.total_price) }}</p>
      </div></LsPanel>
      <LsPanel><div class="form-panel">
        <div class="section-title"><div><h3>交易信息</h3><p>时间用于列表排序和统计归属。</p></div></div>
        <LsField label="交易时间" for-id="transaction-time" required><NDatePicker id="transaction-time" v-model:value="form.trans_at" type="datetime" clearable /></LsField>
        <LsField label="备注" for-id="transaction-memo"><NInput id="transaction-memo" v-model:value="form.memo" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" maxlength="500" show-count placeholder="可记录订单来源、异常说明或结算信息" /></LsField>
      </div></LsPanel>
      <LsInlineError v-if="form.prepaid > balance && selectedCustomer" message="预存款金额超过当前客户余额。" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <div class="form-actions">
        <LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton>
        <LsButton type="submit" size="lg" :loading="save.isPending.value" :disabled="!canSubmit || form.prepaid > balance">保存流水</LsButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.transaction-form-view,.transaction-form{display:grid;gap:1.25rem}.section-title>strong{font-size:.78rem}.ok{color:var(--success)}.warn{color:var(--warning)}.balance-hint,.equation{margin:0;padding:.7rem .8rem;border-radius:8px;background:var(--cloud);color:var(--muted-ink);font-size:.82rem}.balance-hint strong{color:var(--ink)}
</style>
