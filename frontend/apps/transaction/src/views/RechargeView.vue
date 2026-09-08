<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
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
async function submit() {
  if (routeAccess.reason.value) return feedback.info(routeAccess.reason.value)
  const reason = await resolveTransactionAbilityReason(access.data.value)
  if (reason) return feedback.info(reason)
  save.mutate()
}
</script>

<template>
  <div class="recharge-view">
    <LsPageHeader title="顾客充值" description="充值成功后会增加顾客可用余额，并写入不可遗漏的余额变动记录。" :back-to="customerId ? `/balance?customer_id=${customerId}` : '/balances'" back-label="返回顾客余额" />
    <form @submit.prevent="submit">
      <LsFormSection title="充值信息">
        <LsField label="顾客" for-id="recharge-customer" required><NSelect id="recharge-customer" v-model:value="customerId" :options="customerOptions(options.data.value)" filterable :disabled="routeAccess.restricted.value" :placeholder="routeAccess.restricted.value ? '-' : '选择顾客'" /></LsField>
        <p v-if="customer" class="current-balance">充值前余额 <strong class="ls-tabular">{{ money(customer.balance?.balance) }}</strong></p>
        <LsField label="充值金额" for-id="recharge-amount" required><NInputNumber id="recharge-amount" v-model:value="amount" :min="0.01" :precision="2" :step="10" placeholder="输入大于 0 的金额" /></LsField>
        <LsField label="备注" for-id="recharge-memo"><NInput id="recharge-memo" v-model:value="memo" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="255" show-count placeholder="例如：7 月预存款充值" /></LsField>
        <LsInlineError v-if="(!routeAccess.restricted.value && options.isError.value) || save.isError.value" :message="friendlyError(options.error.value || save.error.value)" />
      </LsFormSection>
      <LsFormActions><LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton><LsButton type="submit" :loading="save.isPending.value" :disabled="Boolean(operationReason) || !customerId || !amount || amount <= 0" :disabled-reason="operationReason">确认充值</LsButton></LsFormActions>
    </form>
  </div>
</template>

<style scoped>.current-balance{margin:0;padding:.75rem .85rem;border-radius:8px;background:var(--cloud);color:var(--muted-ink);font-size:.85rem}.current-balance strong{color:var(--ink)}</style>
