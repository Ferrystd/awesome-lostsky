<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft, ArrowUpRight } from '@lucide/vue'

import { api, ApiError, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { shopWorkspaceUrl } from '@lostsky/shared/navigation'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NAlert, NDescriptions, NDescriptionsItem, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerOptions, money } from '../lib'
import { loadWorkspaceAccess, resolveTransactionAbilityReason, transactionAbilityReason } from '../lib/workspace-access'
import type { ManualEntitlementGrantOptions, ManualEntitlementGrantResult } from '../types'
import { beginGrantOperation, finishGrantOperation, grantScope, loadGrantOperation, type GrantOperation } from '../lib/grantOperation'

const router = useRouter()
const route = useRoute()
const routeAccess = useRouteAccess()
const personal = computed(() => route.meta.workspace === 'personal')
const grantBase = computed(() => personal.value ? '/personal/entitlement-grant' : '/entitlement-grant')
const emptyForm = () => ({
  product_id: null as number | null,
  customer_id: null as number | null,
  quantity: 1 as number | null,
  sender_entity_id: null as number | null,
  cs_entity_id: null as number | null,
})
const form = reactive(emptyForm())
const result = ref<ManualEntitlementGrantResult | null>(null)
const access = useQuery({
  queryKey: ['transaction-workspace-access'],
  queryFn: () => loadWorkspaceAccess(),
})
const scope = computed(() => grantScope(location.host, access.data.value?.team?.id, access.data.value?.identity?.entity_id, personal.value))
const pending = ref<GrantOperation | null>(null)
const storageError = ref('')
const requestError = ref('')
const submitting = ref(false)
const draft = useQueryDraft({ key: () => scope.value, read: () => ({ ...form }), apply: value => Object.assign(form, value), initial: emptyForm })
useUnsavedChangesGuard(computed(() => draft.dirty.value && !pending.value), { shouldConfirm: (to, from) => to.path !== from.path })
watch(scope, value => {
  pending.value = null
  result.value = null
  storageError.value = ''
  requestError.value = ''
  if (!value) return
  try {
    pending.value = loadGrantOperation(value)
    draft.reset(pending.value
      ? { ...emptyForm(), ...pending.value.payload }
      : { ...emptyForm(), sender_entity_id: personal.value ? null : Number(access.data.value?.identity?.entity_id) })
  } catch {
    storageError.value = '无法读取本次发放的确认记录，请检查浏览器存储或联系管理员核对发放历史。'
  }
}, { immediate: true, flush: 'sync' })
const options = useQuery({
  queryKey: computed(() => ['manual-entitlement-grant-options', scope.value]),
  queryFn: () => api.get<ManualEntitlementGrantOptions>(`${grantBase.value}/options`),
  enabled: computed(() => Boolean(scope.value) && !routeAccess.restricted.value),
})

const products = computed(() => options.data.value?.products ?? [])
const productOptions = computed(() => products.value.map(product => ({
  label: `${product.name} · ${money(product.price)}`,
  value: Number(product.id),
})))
const quantityValid = computed(() => Number.isInteger(form.quantity) && Number(form.quantity) >= 1 && Number(form.quantity) <= 999)
const operationReason = computed(() => routeAccess.reason.value
  || (access.isPending.value ? '正在核对当前身份' : '')
  || (access.isError.value || !scope.value ? '暂时无法确认当前团队和人员，请刷新后重试' : '')
  || (pending.value ? '' : transactionAbilityReason(access.data.value)))
const grantDescription = computed(() => {
  const summary = personal.value
    ? '商品、本人接待顾客、客服和份数会作为同一次原子操作保存；发单人固定为当前人员。'
    : '商品、顾客、业务归属和份数会作为同一次原子操作保存。'
  if (!options.data.value) return summary
  return `${summary}${options.data.value.sync_transaction ? '提交后会同步一笔权益包收款流水。' : '本次只赋予权益，不同步流水。'}`
})
const shopProductsUrl = shopWorkspaceUrl('/manage/products')

const save = useMutation({
  mutationFn: ({ path, operation }: { path: string; operation: GrantOperation }) => api.post<ManualEntitlementGrantResult>(path, {
    ...operation.payload,
    idempotency_key: operation.key,
  }),
})
const submitDisabledReason = computed(() => operationReason.value
  || storageError.value
  || (submitting.value ? '正在确认发放结果，请稍候' : '')
  || (pending.value ? '' : newOperationReason.value))
const newOperationReason = computed(() => (options.isPending.value ? '正在读取赋予候选' : '')
  || (options.isError.value ? '赋予候选暂时无法读取，请刷新后重试' : '')
  || (!form.product_id ? '请选择权益套餐商品' : '')
  || (!form.customer_id ? (customerOptions(options.data.value).length ? '请选择顾客' : '请先建立并启用顾客资料') : '')
  || (!quantityValid.value ? '请输入 1 至 999 的赋予份数' : '')
  || (!personal.value && !form.sender_entity_id ? '请选择发单人' : ''))
async function submit() {
  if (submitDisabledReason.value) return feedback.info(submitDisabledReason.value)
  const submission = draft.capture()
  const submittedScope = scope.value
  const path = grantBase.value
  submitting.value = true
  requestError.value = ''
  let operation = pending.value
  try {
    if (!operation) {
      const reason = await resolveTransactionAbilityReason(access.data.value)
      if (!draft.isCurrent(submission)) return
      if (reason) return feedback.info(reason)
      try {
        operation = beginGrantOperation(submittedScope, {
          product_id: Number(submission.value.product_id),
          customer_id: Number(submission.value.customer_id),
          quantity: Number(submission.value.quantity),
          ...(personal.value ? {} : { sender_entity_id: submission.value.sender_entity_id }),
          cs_entity_id: submission.value.cs_entity_id,
        })
        pending.value = operation
      } catch {
        storageError.value = '无法保存本次发放的确认记录，尚未发送请求。请检查浏览器存储后刷新重试。'
        return
      }
    }
    const data = await save.mutateAsync({ path, operation })
    // Remove only this operation, even if its response arrives after navigation.
    const cleared = finishGrantOperation(submittedScope, operation.key)
    if (scope.value !== submittedScope || pending.value?.key !== operation.key) return
    // A previously mounted page may have already confirmed this same operation.
    if (!cleared && loadGrantOperation(submittedScope)) return
    pending.value = null
    result.value = data
    draft.reset({ ...emptyForm(), sender_entity_id: personal.value ? null : Number(access.data.value?.identity?.entity_id) })
    feedback.success('顾客权益已赋予')
  } catch (error) {
    if (scope.value !== submittedScope || (operation && pending.value?.key !== operation.key)) return
    if (error instanceof ApiError && error.status === 422 && operation) {
      try {
        if (finishGrantOperation(submittedScope, operation.key)) pending.value = null
      } catch {
        storageError.value = '无法清理本次发放的确认记录，请检查浏览器存储后刷新重试。'
      }
    }
    requestError.value = error instanceof ApiError ? friendlyError(error) : '确认记录暂时无法更新，请重试确认结果。'
  } finally {
    submitting.value = false
  }
}

const contextPayload = computed(() => pending.value?.payload ?? form)
const contextProduct = computed(() => products.value.find(item => Number(item.id) === contextPayload.value.product_id))

</script>

<template>
  <LsFormPage aside-label="权益发放核对" :title="personal ? '下发顾客权益' : '赋予顾客权益'" :description="personal ? '授予顾客可核销的权益，视同顾客下单核销商品；全程不产生商城订单。' : '按权益套餐的内容把权益直接交付给顾客；不创建商城订单。'">
    <template #actions>
      <LsPageLink :to="personal ? '/personal/entitlements' : '/services'" :icon="ArrowLeft" :label="personal ? '返回权益下发' : '返回权益核销'" />
    </template>

    <p v-if="result" class="grant-result" role="status" aria-live="polite">
      已赋予 {{ result.entitlement_count }} 项权益；未创建商城订单；{{ result.transaction_id ? `已生成流水 #${result.transaction_id}` : '未同步流水' }}。
    </p>
    <LsInlineError v-if="storageError" :message="storageError" />
    <LsAsyncState v-if="!pending && !routeAccess.restricted.value && (access.isPending.value || options.isPending.value)" state="loading" :rows="5" />
    <LsAsyncState v-else-if="!pending && !routeAccess.restricted.value && options.isError.value" state="error" title="暂时无法读取赋予候选" :description="friendlyError(options.error.value)" />
    <LsEmptyState :source="options.data.value" v-else-if="!pending && !routeAccess.restricted.value && !products.length" title="没有可赋予的权益套餐" description="请先在商城应用创建并启用核销商品。">
      <template #action><LsPageLink :href="shopProductsUrl" :icon="ArrowUpRight" label="前往商品管理" /></template>
    </LsEmptyState>
    <form class="grant-form" v-else @submit.prevent="submit">
      <LsFormSection :title="pending ? '确认发放结果' : '顾客与权益'" :description="grantDescription">
        <template v-if="pending">
          <NAlert type="warning" title="发放结果待确认">
            本次发放内容已保存。请重试确认结果；确认完成前不能修改或再次发放。刷新后可继续确认同一次操作。
          </NAlert>
          <NDescriptions :column="1" label-placement="left">
            <NDescriptionsItem label="权益套餐商品">{{ products.find(item => Number(item.id) === pending!.payload.product_id)?.name || `商品 #${pending.payload.product_id}` }}</NDescriptionsItem>
            <NDescriptionsItem label="顾客">{{ customerOptions(options.data.value).find(item => Number(item.value) === pending!.payload.customer_id)?.label || `顾客 #${pending.payload.customer_id}` }}</NDescriptionsItem>
            <NDescriptionsItem label="赋予份数">{{ pending.payload.quantity }}</NDescriptionsItem>
            <NDescriptionsItem v-if="pending.payload.sender_entity_id" label="发单人">人员 #{{ pending.payload.sender_entity_id }}</NDescriptionsItem>
            <NDescriptionsItem v-if="pending.payload.cs_entity_id" label="客服">人员 #{{ pending.payload.cs_entity_id }}</NDescriptionsItem>
          </NDescriptions>
        </template>
        <template v-else>
        <LsField label="权益套餐商品" for-id="grant-product" required hint="仅列出商城中已启用、且含有核销商品的套餐商品。">
          <NSelect id="grant-product" v-model:value="form.product_id" :options="productOptions" filterable :disabled="routeAccess.restricted.value || submitting" :placeholder="routeAccess.restricted.value ? '-' : '选择权益套餐商品'" />
        </LsField>
        <LsField label="顾客" for-id="grant-customer" required>
          <NSelect id="grant-customer" v-model:value="form.customer_id" :options="customerOptions(options.data.value)" :disabled="submitting" filterable placeholder="选择顾客" />
        </LsField>
        <LsField label="赋予份数" for-id="grant-quantity" required hint="每份包含该商品权益包中的全部权益。">
          <NInputNumber id="grant-quantity" v-model:value="form.quantity" :disabled="submitting" :min="1" :max="999" :precision="0" />
        </LsField>
        <LsField v-if="!personal" label="发单人" for-id="grant-sender" required hint="顾客已有当前归属时，服务端优先使用该归属。">
          <LsEntitySelect id="grant-sender" v-model="form.sender_entity_id" :disabled="submitting" :entities="options.data.value?.entities ?? []" placeholder="选择发单人" />
        </LsField>
        <LsField label="客服" for-id="grant-cs">
          <LsEntitySelect id="grant-cs" v-model="form.cs_entity_id" :disabled="submitting" :entities="options.data.value?.entities ?? []" clearable placeholder="可选" />
        </LsField>
        </template>
        <LsInlineError v-if="requestError" :message="requestError" />
      </LsFormSection>
      <LsFormSection :title="pending ? '继续确认' : '确认发放'" description="本次操作直接发放权益，不创建商城订单。">
      <LsFormActions>
        <LsButton type="button" variant="ghost" @click="router.back()"><template #icon><ArrowLeft :size="16" /></template>取消</LsButton>
        <LsButton type="submit" :loading="submitting" :disabled="Boolean(submitDisabledReason)" :disabled-reason="submitDisabledReason">{{ pending ? '重试确认结果' : personal ? '下发权益' : '确认提交' }}</LsButton>
      </LsFormActions>
      </LsFormSection>
    </form>
    <template #aside>
      <LsFormSection title="发放核对" :description="pending ? '本次待确认操作的固定内容。' : '当前草稿；提交后才会发放。'">
        <p v-if="routeAccess.restricted.value">暂无可查看的权益资料。</p>
        <p v-else-if="!pending && options.isPending.value">正在读取权益套餐…</p>
        <p v-else-if="!pending && options.isError.value">权益套餐读取失败。</p>
        <LsDescriptionList v-else>
          <dt>商品</dt><dd>{{ contextProduct?.name || (contextPayload.product_id ? '商品 #' + contextPayload.product_id : '尚未选择') }}</dd>
          <dt>顾客</dt><dd>{{ customerOptions(options.data.value).find(item => Number(item.value) === contextPayload.customer_id)?.label || (contextPayload.customer_id ? '顾客 #' + contextPayload.customer_id : '尚未选择') }}</dd>
          <dt>份数</dt><dd>{{ contextPayload.quantity ?? '-' }}</dd>
          <dt>商城订单</dt><dd>不创建</dd>
          <dt>同步收款</dt><dd>{{ pending ? '以本次发放确认结果为准' : options.data.value ? (options.data.value.sync_transaction ? '同步权益包收款流水' : '只赋予权益') : '待核对' }}</dd>
        </LsDescriptionList>
      </LsFormSection>
    </template>
  </LsFormPage>
</template>

<style scoped>
.grant-form{display:grid;gap:1.25rem}.grant-result{margin:0;padding:.75rem .875rem;border-radius:8px;background:var(--cloud);color:var(--ink);font-size:.875rem;line-height:1.6}
</style>
