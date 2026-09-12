<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import { useQuery } from '@tanstack/vue-query'
import { NButton, NInput, NInputNumber } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { formatMoney, shopApi } from '../lib'

const route = useRoute(); const router = useRouter(); const id = Number(route.params.id)
const product = useQuery({ queryKey: ['shop-product', id], queryFn: () => shopApi.product(id) })
const balance = useQuery({ queryKey: ['shop-balance'], queryFn: shopApi.balance })
const quantity = ref(1); const handlerId = ref<number | null>(null); const memo = ref(''); const pending = ref(false); const error = ref('')
const total = computed(() => Number(product.data.value?.price ?? 0) * quantity.value)
const insufficient = computed(() => Number(balance.data.value?.balance ?? 0) < total.value)
const handlers = computed(() => !product.data.value?.kind || product.data.value.kind === 1 ? product.data.value?.handlers ?? [] : [])
const needsHandler = computed(() => handlers.value.length > 1)
const productHandlers = ref<Record<number, number | null>>({})
const handlerGroups = computed(() => product.data.value?.handler_groups ?? [])
const missingProductHandler = computed(() => handlerGroups.value.some(group => group.handlers.length > 1 && !productHandlers.value[group.product_id]))

async function submit() {
  if (pending.value || !quantity.value || insufficient.value || missingProductHandler.value || (needsHandler.value && !handlerId.value)) return
  pending.value = true; error.value = ''
  try {
    const selections = Object.fromEntries(Object.entries(productHandlers.value).filter((entry): entry is [string, number] => entry[1] !== null))
    const result = await shopApi.purchase({ product_id: id, quantity: quantity.value, ...(handlerId.value ? { handler_entity_id: handlerId.value } : {}), ...(Object.keys(selections).length ? { product_handlers: selections } : {}), ...(memo.value.trim() ? { memo: memo.value.trim() } : {}) })
    await router.replace(`/orders/${result.id}`)
  } catch (reason) { error.value = friendlyError(reason); void balance.refetch() } finally { pending.value = false }
}
</script>

<template>
  <section class="checkout-page">
    <header><p class="eyebrow">确认购买</p><h1 tabindex="-1">确认购买</h1><p>价格与余额会在提交时由服务端再次核对。</p></header>
    <div v-if="product.isPending.value || balance.isPending.value" class="checkout-skeleton"><span /><span /></div>
    <div v-else-if="product.isError.value || balance.isError.value" class="inline-error"><span>{{ product.isError.value ? friendlyError(product.error.value) : '结账信息加载失败。' }}</span><button type="button" @click="product.refetch(); balance.refetch()">重试</button></div>
    <form v-else-if="product.data.value && balance.data.value" class="checkout-layout" @submit.prevent="submit">
      <div class="checkout-product"><img v-if="product.data.value.cover_image" :src="product.data.value.cover_image" :alt="product.data.value.name"><span v-else class="type-cover"><strong>{{ product.data.value.name.slice(0, 1) }}</strong></span><div><h2>{{ product.data.value.name }}</h2><p>{{ formatMoney(product.data.value.price) }} / 件</p></div></div>
      <div class="checkout-fields">
        <label>数量<NInputNumber v-model:value="quantity" :min="1" :max="999" size="large" /></label>
        <label v-if="handlers.length">接单人<LsEntitySelect v-model="handlerId" :entities="handlers" :placeholder="needsHandler ? '请选择接单人' : '默认接单人'" clearable /></label>
        <label v-for="group in handlerGroups.filter(group => group.handlers.length)" :key="group.product_id">{{ group.name }}接单人<LsEntitySelect v-model="productHandlers[group.product_id]" :entities="group.handlers" :placeholder="group.handlers.length > 1 ? '请选择接单人' : '默认接单人'" clearable /></label>
        <label>给商家的备注<NInput v-model:value="memo" type="textarea" maxlength="1000" show-count placeholder="可选" /></label>
      </div>
      <aside class="checkout-summary"><div><span>当前余额</span><strong>{{ formatMoney(balance.data.value.balance) }}</strong></div><div><span>应付总额</span><strong>{{ formatMoney(total) }}</strong></div><p v-if="insufficient" class="form-error" role="alert">余额不足，请联系商家充值后再购买。</p><p v-if="error" class="form-error" role="alert">{{ error }}</p><NButton attr-type="submit" type="primary" size="large" block :loading="pending" :disabled="!quantity || insufficient || missingProductHandler || (needsHandler && !handlerId)">使用余额购买</NButton><RouterLink :to="`/product/${id}`">返回商品详情</RouterLink></aside>
    </form>
  </section>
</template>
