<script setup lang="ts">
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import { friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadManageAccess, manageApi } from '../../lib'
import ServiceCompletionFields from '../../../../transaction/src/components/ServiceCompletionFields.vue'
import { purchaseInputFields, reconcilePurchaseValues, purchaseValuesValid, serializePurchaseValues } from '../../purchase-fields'

const router = useRouter()
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const routeAccess = useRouteAccess()
const form = reactive({ product_id: null as number | null, customer_id: null as number | null, handler_entity_id: null as number | null, sender_entity_id: null as number | null, cs_entity_id: null as number | null, quantity: 1, memo: '' })
const options = useQuery({ queryKey: ['manage-options'], queryFn: manageApi.options, enabled: computed(() => !routeAccess.restricted.value) })
const entities = computed(() => options.data.value?.entities ?? [])
const customers = computed(() => (options.data.value?.customers ?? []).map(c => ({ label: c.nickname || c.name || `顾客 #${c.id}`, value: c.id })))
const productOptions = computed(() => (options.data.value?.products ?? []).map(product => ({ label: `${product.name} · ¥${Number(product.price).toFixed(2)}`, value: product.id })))
const purchaseFields = computed(() => options.data.value?.products?.find(product => product.id === form.product_id)?.purchase_fields ?? [])
const purchaseValues = ref<Record<number, unknown>>({})
const purchaseUploading = ref(false)
const draft = useQueryDraft({
  key: () => `${access.data.value?.team?.id ?? 0}:${access.data.value?.identity?.entity_id ?? 0}:order:new`,
  read: () => ({ form: { ...form }, purchaseValues: purchaseValues.value }),
  apply: value => { Object.assign(form, value.form); purchaseValues.value = value.purchaseValues },
})
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path })
watch(purchaseFields, fields => {
  const clean = !draft.dirty.value
  purchaseValues.value = reconcilePurchaseValues(fields, purchaseValues.value)
  if (clean) draft.reset(draft.capture().value)
}, { immediate: true })
const save = useMutation({
  mutationFn: async () => {
    const submission = draft.capture()
    const data = await manageApi.createOrder({ ...submission.value.form, purchase_values: serializePurchaseValues(purchaseFields.value, submission.value.purchaseValues), memo: submission.value.form.memo.trim() || null })
    return { data, submission }
  },
  onSuccess: ({ data, submission }) => {
    if (draft.accept(submission) && !draft.dirty.value) void router.push(`/manage/orders/${data.id}`)
  },
})
const valid = computed(() => Boolean(form.product_id && form.quantity >= 1 && !purchaseUploading.value && !options.isPending.value && !options.isError.value && purchaseValuesValid(purchaseFields.value, purchaseValues.value)))
function submit() {
  if (routeAccess.reason.value) return feedback.info(routeAccess.reason.value)
  if (!valid.value || save.isPending.value) return
  save.mutate()
}
</script>

<template>
  <div class="manage-page">
    <LsPageHeader title="新建订单" description="分成自动根据价格计算，也可手动输入。" back-to="/manage/orders" back-label="返回订单" />
    <form class="manage-form" @submit.prevent="submit">
      <LsFormSection title="商品与顾客">
        <LsField label="商品" for-id="order-product" required><NSelect id="order-product" v-model:value="form.product_id" :options="productOptions" filterable :disabled="routeAccess.restricted.value" :placeholder="routeAccess.restricted.value ? '-' : '选择已上架商品'" /></LsField>
        <LsField label="数量" for-id="order-quantity" required><NInputNumber id="order-quantity" v-model:value="form.quantity" :min="1" :max="999" /></LsField>
        <LsField label="顾客" for-id="order-customer" hint="使用顾客预存款或交付服务权益时选择。"><NSelect id="order-customer" v-model:value="form.customer_id" :options="customers" filterable clearable :disabled="routeAccess.restricted.value" :placeholder="routeAccess.restricted.value ? '-' : '可选'" /></LsField>
      </LsFormSection>
      <LsFormSection v-if="purchaseFields.length" title="购买资料"><ServiceCompletionFields v-model="purchaseValues" :fields="purchaseInputFields(purchaseFields)" id-prefix="order-purchase-field" @uploading="purchaseUploading = $event" /></LsFormSection>
      <LsFormSection title="参与方">
        <LsField label="接单人" for-id="order-handler"><LsEntitySelect id="order-handler" v-model="form.handler_entity_id" :entities="entities" :loading="!routeAccess.restricted.value && options.isPending.value" :disabled="routeAccess.restricted.value || options.isError.value" clearable :placeholder="routeAccess.restricted.value ? '-' : '普通商品可选'" /></LsField>
        <LsField label="发单人" for-id="order-sender"><LsEntitySelect id="order-sender" v-model="form.sender_entity_id" :entities="entities" :loading="!routeAccess.restricted.value && options.isPending.value" :disabled="routeAccess.restricted.value || options.isError.value" clearable :placeholder="routeAccess.restricted.value ? '-' : '可选'" /></LsField>
        <LsField label="客服" for-id="order-cs"><LsEntitySelect id="order-cs" v-model="form.cs_entity_id" :entities="entities" :loading="!routeAccess.restricted.value && options.isPending.value" :disabled="routeAccess.restricted.value || options.isError.value" clearable :placeholder="routeAccess.restricted.value ? '-' : '可选'" /></LsField>
        <LsField label="备注" for-id="order-memo"><NInput id="order-memo" v-model:value="form.memo" type="textarea" maxlength="500" show-count /></LsField>
      </LsFormSection>
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions><LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton><LsButton type="submit" :disabled="routeAccess.restricted.value || !valid" :disabled-reason="routeAccess.reason.value" :loading="save.isPending.value">创建订单</LsButton></LsFormActions>
    </form>
  </div>
</template>
