<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import { customerOptions, memberOptions, money } from '../lib'
import type { TransactionOptions, TransactionRecord } from '../types'

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  handler_id: null as number | null,
  sender_id: null as number | null,
  cs_id: null as number | null,
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
    handler_id: Number(data.handler_id) || null,
    sender_id: data.sender_id ? Number(data.sender_id) : null,
    cs_id: data.cs_id ? Number(data.cs_id) : null,
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
const selectedCustomer = computed(() => optionsQuery.data.value?.customers.find(item => Number(item.id) === form.customer_id))
const balance = computed(() => Number(selectedCustomer.value?.balance?.balance ?? 0))
const canSubmit = computed(() => Boolean(form.handler_id && form.trans_at && balanced.value && (!form.prepaid || form.customer_id)))
const amountProps = { min: 0, precision: 2, step: 1 } as const

const save = useMutation({
  mutationFn: () => api.post<{ id?: number }>(editing.value ? `/transaction/${id.value}` : '/transaction', {
    ...(!editing.value ? { handler_id: form.handler_id, type: 2 } : {}),
    sender_id: form.sender_id,
    cs_id: form.cs_id,
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
    <PageHeader
      :title="editing ? '编辑流水' : '登记流水'"
      :description="editing ? '接单人创建后不可更换；修改预存款会同步生成余额变动。' : '总价需要同时与支付构成、成本及分配构成保持一致。'"
      :back-to="editing ? `/detail?id=${id}` : '/'"
      :back-label="editing ? '返回流水详情' : '返回流水列表'"
    />
    <p v-if="detail.isError.value || optionsQuery.isError.value" class="feedback error" role="alert">{{ friendlyError(detail.error.value || optionsQuery.error.value) }}</p>
    <form v-else class="transaction-form" @submit.prevent="save.mutate()">
      <section class="panel form-panel">
        <div class="section-title"><div><h3>参与方</h3><p>选择本团队成员与客户；客户为空时不能使用预存款。</p></div></div>
        <label class="field"><span>接单人 <b>*</b></span><NSelect v-model:value="form.handler_id" :options="memberOptions(optionsQuery.data.value)" filterable :disabled="editing" placeholder="选择接单人" /></label>
        <label class="field"><span>发单人</span><NSelect v-model:value="form.sender_id" :options="memberOptions(optionsQuery.data.value)" filterable clearable placeholder="可选" /></label>
        <label class="field"><span>客服</span><NSelect v-model:value="form.cs_id" :options="memberOptions(optionsQuery.data.value)" filterable clearable placeholder="可选" /></label>
        <label class="field"><span>客户</span><NSelect v-model:value="form.customer_id" :options="customerOptions(optionsQuery.data.value)" filterable clearable placeholder="可选；使用预存款时必填" /></label>
        <p v-if="selectedCustomer" class="balance-hint">当前客户余额 <strong class="ls-tabular">{{ money(balance) }}</strong></p>
      </section>
      <section class="panel form-panel">
        <div class="section-title"><div><h3>金额与支付</h3><p>现款 + 预存款必须等于总价。</p></div><strong :class="balanced ? 'ok' : 'warn'">{{ balanced ? '金额平衡' : '金额未平衡' }}</strong></div>
        <label class="field"><span>总价 <b>*</b></span><NInputNumber v-model:value="form.total_price" v-bind="amountProps" /></label>
        <label class="field"><span>现款</span><NInputNumber v-model:value="form.cash" v-bind="amountProps" /></label>
        <label class="field"><span>预存款</span><NInputNumber v-model:value="form.prepaid" v-bind="amountProps" /></label>
        <p class="equation ls-tabular">支付合计 {{ money(paymentTotal) }} / 总价 {{ money(form.total_price) }}</p>
      </section>
      <section class="panel form-panel">
        <div class="section-title"><div><h3>成本与分配</h3><p>成本 + 四类分配必须等于总价。</p></div></div>
        <label class="field"><span>成本</span><NInputNumber v-model:value="form.cost" v-bind="amountProps" /></label>
        <label class="field"><span>接单人分配</span><NInputNumber v-model:value="form.handler_cut" v-bind="amountProps" /></label>
        <label class="field"><span>发单人分配</span><NInputNumber v-model:value="form.sender_cut" v-bind="amountProps" /></label>
        <label class="field"><span>客服分配</span><NInputNumber v-model:value="form.cs_cut" v-bind="amountProps" /></label>
        <label class="field"><span>团队分配</span><NInputNumber v-model:value="form.team_cut" v-bind="amountProps" /></label>
        <p class="equation ls-tabular">成本与分配合计 {{ money(allocationTotal) }} / 总价 {{ money(form.total_price) }}</p>
      </section>
      <section class="panel form-panel">
        <div class="section-title"><div><h3>交易信息</h3><p>时间用于列表排序和统计归属。</p></div></div>
        <label class="field"><span>交易时间 <b>*</b></span><NDatePicker v-model:value="form.trans_at" type="datetime" clearable /></label>
        <label class="field"><span>备注</span><NInput v-model:value="form.memo" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" maxlength="500" show-count placeholder="可记录订单来源、异常说明或结算信息" /></label>
      </section>
      <p v-if="form.prepaid > balance && selectedCustomer" class="feedback error" role="alert">预存款金额超过当前客户余额。</p>
      <p v-if="save.isError.value" class="feedback error" role="alert">{{ friendlyError(save.error.value) }}</p>
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
