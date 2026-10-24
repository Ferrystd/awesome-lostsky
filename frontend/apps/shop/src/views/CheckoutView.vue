<script setup lang="ts">
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import { friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { feedback } from '@lostsky/ui/feedback'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import { useQuery } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { formatMoney, shopApi } from '../lib'
import ServiceCompletionFields from '../../../transaction/src/components/ServiceCompletionFields.vue'
import { purchaseInputFields, reconcilePurchaseValues, purchaseValuesValid, serializePurchaseValues } from '../purchase-fields'

const route = useRoute(); const router = useRouter(); const id = computed(() => Number(route.params.id))
const product = useQuery({ queryKey: computed(() => ['shop-product', id.value]), queryFn: () => shopApi.product(id.value) })
const customer = useQuery({ queryKey: ['shop-customer'], queryFn: shopApi.me, retry: false })
const balance = useQuery({ queryKey: ['shop-balance'], queryFn: shopApi.balance })
const quantity = ref<number | null>(1); const handlerId = ref<number | null>(null); const memo = ref(''); const pending = ref(false); const error = ref('')
const requestedVariant = Number(route.query.variant)
const variantId = ref<number | null>(Number.isInteger(requestedVariant) && requestedVariant > 0 ? requestedVariant : null)
const variants = computed(() => product.data.value?.variants ?? [])
const selectedProduct = computed(() => product.data.value?.kind === 5 ? variants.value.find(variant => variant.id === variantId.value) : product.data.value)
const displayedProduct = computed(() => selectedProduct.value ?? product.data.value)
const purchaseFields = computed(() => selectedProduct.value?.purchase_fields ?? [])
const purchaseValues = ref<Record<number, unknown>>({})
const purchaseUploading = ref(false)
const productHandlers = ref<Record<number, number | null>>({})
const draft = useQueryDraft({
  key: () => `${customer.data.value?.team_id ?? 0}:${customer.data.value?.id ?? 0}:checkout:${id.value}`,
  read: () => ({ quantity: quantity.value, handlerId: handlerId.value, memo: memo.value, variantId: variantId.value, purchaseValues: purchaseValues.value, productHandlers: productHandlers.value }),
  initial: () => ({ quantity: 1, handlerId: null, memo: '', variantId: Number(route.query.variant) > 0 ? Number(route.query.variant) : null, purchaseValues: {}, productHandlers: {} }),
  apply: value => {
    quantity.value = value.quantity; handlerId.value = value.handlerId; memo.value = value.memo
    variantId.value = value.variantId; purchaseValues.value = value.purchaseValues; productHandlers.value = value.productHandlers
  },
})
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path })
watch([id, () => customer.data.value?.id, () => customer.data.value?.team_id], () => { pending.value = false; error.value = '' }, { flush: 'sync' })
watch([purchaseFields, () => customer.data.value?.id, () => customer.data.value?.team_id], ([fields]) => {
  const clean = !draft.dirty.value
  purchaseValues.value = reconcilePurchaseValues(fields, purchaseValues.value)
  if (clean) draft.reset(draft.capture().value)
}, { immediate: true })
const purchaseValid = computed(() => !purchaseUploading.value && purchaseValuesValid(purchaseFields.value, purchaseValues.value))
const variantOptions = computed(() => variants.value.map(variant => ({ label: `${variant.name} · ${formatMoney(variant.price)}`, value: variant.id })))
watch([() => product.data.value, () => customer.data.value?.id, () => customer.data.value?.team_id], ([data]) => {
  if (!data || data.id !== id.value || draft.dirty.value) return
  const rows = data.variants ?? []
  if (!rows.some(row => row.id === variantId.value)) variantId.value = rows.length === 1 ? rows[0].id : null
  draft.reset(draft.capture().value)
}, { immediate: true })
const total = computed(() => Number(selectedProduct.value?.price ?? 0) * (quantity.value ?? 0))
const insufficient = computed(() => Number(balance.data.value?.balance ?? 0) < total.value)
const handlers = computed(() => !selectedProduct.value?.kind || selectedProduct.value.kind === 1 ? selectedProduct.value?.handlers ?? [] : [])
const needsHandler = computed(() => handlers.value.length > 1)
const handlerGroups = computed(() => selectedProduct.value?.handler_groups ?? [])
watch(variantId, () => { handlerId.value = null; productHandlers.value = {}; error.value = '' }, { flush: 'sync' })
const missingProductHandler = computed(() => handlerGroups.value.some(group => group.handlers.length > 1 && !productHandlers.value[group.product_id]))

const submitReason = computed(() => {
  if (pending.value) return '正在提交订单，请稍候'
  if (!selectedProduct.value) return '请选择购买规格'
  if (purchaseUploading.value) return '购买资料正在上传，请稍候'
  if (!purchaseValid.value) return '请补齐购买资料必填项'
  if (quantity.value == null) return '请填写购买数量'
  if (!Number.isInteger(quantity.value) || quantity.value < 1 || quantity.value > 999) return '购买数量须为 1 至 999 的整数'
  if (insufficient.value) return '余额不足，请联系商家充值后再购买'
  if (missingProductHandler.value) return '请选择套餐商品的接单人'
  if (needsHandler.value && !handlerId.value) return '请选择接单人'
  return ''
})

async function submit() {
  if (submitReason.value) return feedback.info(submitReason.value)
  if (!selectedProduct.value || quantity.value == null) return
  const submission = draft.capture()
  pending.value = true; error.value = ''
  try {
    const selections = Object.fromEntries(Object.entries(productHandlers.value).filter((entry): entry is [string, number] => entry[1] !== null))
    const result = await shopApi.purchase({ product_id: selectedProduct.value.id, quantity: quantity.value, ...(purchaseFields.value.length ? { purchase_values: serializePurchaseValues(purchaseFields.value, purchaseValues.value) } : {}), ...(handlerId.value ? { handler_entity_id: handlerId.value } : {}), ...(Object.keys(selections).length ? { product_handlers: selections } : {}), ...(memo.value.trim() ? { memo: memo.value.trim() } : {}) })
    if (!draft.accept(submission) || draft.dirty.value) return
    await router.replace(`/orders/${result.id}`)
  } catch (reason) { if (draft.isCurrent(submission)) { error.value = friendlyError(reason); void balance.refetch() } } finally { if (draft.isCurrent(submission)) pending.value = false }
}
</script>

<template>
  <section class="checkout-page">
    <header><h1 tabindex="-1">确认购买</h1><p>选择购买内容，填写资料后使用本店余额付款。</p></header>
    <div v-if="product.isPending.value || balance.isPending.value" class="checkout-skeleton"><span /><span /></div>
    <div v-else-if="product.isError.value || balance.isError.value" class="inline-error"><span>{{ product.isError.value ? friendlyError(product.error.value) : '结账信息加载失败。' }}</span><button type="button" @click="product.refetch(); balance.refetch()">重试</button></div>
    <form v-else-if="product.data.value && balance.data.value" class="checkout-layout" @submit.prevent="submit">
      <div class="checkout-product"><img v-if="displayedProduct?.cover_image" :src="displayedProduct.cover_image" :alt="product.data.value.name"><span v-else class="type-cover"><strong>{{ product.data.value.name.slice(0, 1) }}</strong></span><div><h2>{{ product.data.value.name }}</h2><p>{{ formatMoney(displayedProduct?.price ?? 0) }}<template v-if="product.data.value.kind === 5 && !selectedProduct"> 起</template><template v-else> / 件</template></p></div></div>
      <div class="checkout-fields">
        <label v-if="product.data.value.kind === 5">规格<NSelect v-model:value="variantId" :options="variantOptions" placeholder="请选择规格" :disabled="pending" /></label>
        <p v-if="selectedProduct?.description">{{ selectedProduct.description }}</p>
        <section v-if="purchaseFields.length" aria-label="购买资料" :inert="pending"><h2>购买资料</h2><ServiceCompletionFields v-model="purchaseValues" :fields="purchaseInputFields(purchaseFields)" id-prefix="purchase-field" @uploading="purchaseUploading = $event" /></section>
        <label>数量<NInputNumber v-model:value="quantity" :min="1" :max="999" size="large" /></label>
        <label v-if="handlers.length">接单人<LsEntitySelect v-model="handlerId" :entities="handlers" :placeholder="needsHandler ? '请选择接单人' : '默认接单人'" clearable /></label>
        <label v-for="group in handlerGroups.filter(group => group.handlers.length)" :key="group.product_id">{{ group.name }}接单人<LsEntitySelect v-model="productHandlers[group.product_id]" :entities="group.handlers" :placeholder="group.handlers.length > 1 ? '请选择接单人' : '默认接单人'" clearable /></label>
        <label>给商家的备注<NInput v-model:value="memo" type="textarea" maxlength="1000" show-count placeholder="可选" /></label>
      </div>
      <section class="checkout-summary" aria-label="确认付款"><div><span>当前余额</span><strong>{{ formatMoney(balance.data.value.balance) }}</strong></div><div><span>应付总额</span><strong>{{ formatMoney(total) }}</strong></div><p v-if="insufficient" class="form-error" role="alert">余额不足，请联系商家充值后再购买。</p><p v-if="error" class="form-error" role="alert">{{ error }}</p><LsButton type="submit" size="lg" block :loading="pending" :disabled="Boolean(submitReason)" :disabled-reason="submitReason">使用余额购买</LsButton><RouterLink :to="`/product/${id}`">返回商品详情</RouterLink></section>
    </form>
  </section>
</template>

<style scoped>
.checkout-page{max-width:52rem}
.checkout-layout{grid-template-columns:minmax(0,1fr);gap:2rem}
.checkout-fields{max-width:100%;min-width:0}
.checkout-summary{margin-top:.5rem;border-radius:12px;padding:clamp(1rem,3vw,2rem)}
</style>
