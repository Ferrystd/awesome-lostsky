<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerOptions, money } from '../lib'
import type { TransactionOptions } from '../types'
import { loadWorkspaceAccess, resolveTransactionAbilityReason, transactionAbilityReason } from '../lib/workspace-access'

const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const client = useQueryClient()
const customerId = ref<number | null>(Number(route.query.customer_id || 0) || null)
const amount = ref<number | null>(null)
const memo = ref('')
const options = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options'), enabled: computed(() => !routeAccess.restricted.value) })
const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })
const customer = computed(() => (options.data.value?.customers ?? []).find(item => Number(item.id) === customerId.value))
const operationReason = computed(() => routeAccess.reason.value || (access.isPending.value ? '正在核对记账能力' : transactionAbilityReason(access.data.value)))
const save = useMutation({
  mutationFn: () => api.post('/transaction/balance/recharge', { customer_id: customerId.value, amount: amount.value, memo: memo.value.trim() }),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['transaction-options'] })
    await client.invalidateQueries({ queryKey: ['balance-logs'] })
    await router.push(`/balance?customer_id=${customerId.value}`)
  },
})
const submitReason = computed(() => {
  if (operationReason.value) return operationReason.value
  if (save.isPending.value) return '正在充值，请稍候'
  if (!customerId.value) return '请选择充值顾客'
  if (amount.value == null) return '请填写充值金额'
  if (!Number.isFinite(amount.value) || amount.value <= 0) return '充值金额必须大于 0'
  return ''
})
async function submit() {
  if (submitReason.value) return feedback.info(submitReason.value)
  const reason = await resolveTransactionAbilityReason(access.data.value)
  if (reason) return feedback.info(reason)
  if (submitReason.value) return feedback.info(submitReason.value)
  save.mutate()
}

const rechargePreview = computed(() => {
 const before = customer.value?.balance?.balance
 if (before == null || !Number.isFinite(Number(before)) || amount.value == null || !Number.isFinite(amount.value) || amount.value <= 0) return null
 return (Math.round(Number(before) * 100) + Math.round(amount.value * 100)) / 100
})

</script>

<template>
  <LsFormPage aside-label="顾客充值核对" title="顾客充值" description="充值成功后余额立即增加，并写入一条余额变动记录。">
    <template #actions>
      <LsPageLink :to="customerId ? `/balance?customer_id=${customerId}` : '/balances'" :icon="ArrowLeft" label="返回顾客余额" />
    </template>

    <form class="recharge-form" @submit.prevent="submit">
      <LsFormSection title="顾客与充值金额" description="先核对顾客及当前余额，再填写本次充值金额。">
        <LsField label="顾客" for-id="recharge-customer" required><NSelect id="recharge-customer" v-model:value="customerId" :options="customerOptions(options.data.value)" filterable :disabled="routeAccess.restricted.value" :placeholder="routeAccess.restricted.value ? '-' : '选择顾客'" /></LsField>
        <p v-if="customer" class="current-balance">充值前余额 <strong class="ls-tabular">{{ money(customer.balance?.balance) }}</strong></p>
        <LsField label="充值金额" for-id="recharge-amount" required><NInputNumber id="recharge-amount" v-model:value="amount" :min="0.01" :precision="2" :step="10" placeholder="输入大于 0 的金额" /></LsField>
        <LsField label="备注" for-id="recharge-memo"><NInput id="recharge-memo" v-model:value="memo" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="255" show-count placeholder="例如：7 月预存款充值" /></LsField>
        <LsInlineError v-if="(!routeAccess.restricted.value && options.isError.value) || save.isError.value" :message="friendlyError(options.error.value || save.error.value)" />
      </LsFormSection>
      <LsFormSection title="确认充值" description="提交后增加顾客余额，并保留本次充值记录。">
      <LsFormActions><LsButton type="button" variant="ghost" @click="router.back()"><template #icon><ArrowLeft :size="16" /></template>取消</LsButton><LsButton type="submit" :loading="save.isPending.value" :disabled="Boolean(submitReason)" :disabled-reason="submitReason">确认充值</LsButton></LsFormActions>
      </LsFormSection>
    </form>
    <template #aside>
      <LsFormSection title="充值核对" description="当前草稿；确认充值后才会写入余额。">
        <p v-if="routeAccess.restricted.value">暂无可查看的顾客资料。</p>
        <p v-else-if="options.isPending.value">正在读取顾客余额…</p>
        <p v-else-if="options.isError.value">顾客余额读取失败。</p>
        <LsDescriptionList v-else-if="customer">
          <dt>顾客</dt><dd>{{ customer.nickname || ('顾客 #' + customer.id) }}</dd>
          <dt>充值前余额</dt><dd>{{ customer.balance?.balance != null ? money(customer.balance.balance) : '-' }}</dd>
          <dt>本次充值</dt><dd>{{ amount != null && Number.isFinite(amount) && amount > 0 ? money(amount) : '-' }}</dd>
          <dt>预计充值后</dt><dd>{{ rechargePreview != null ? money(rechargePreview) : '-' }}</dd>
        </LsDescriptionList>
        <p v-else>选择顾客后核对充值前后余额。</p>
      </LsFormSection>
    </template>
  </LsFormPage>
</template>

<style scoped>.recharge-form{display:grid;gap:1.5rem}.current-balance{margin:0;padding:.75rem .85rem;border-radius:8px;background:var(--cloud);color:var(--muted-ink);font-size:.85rem}.current-balance strong{color:var(--ink)}</style>
