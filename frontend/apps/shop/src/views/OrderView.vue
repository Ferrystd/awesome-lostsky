<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft } from '@lucide/vue'
import { NButton, NModal } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatDate, formatMoney, orderStatus, shopApi } from '../lib'
import { formatPurchaseValue } from '../purchase-fields'

const route = useRoute(); const id = computed(() => Number(route.params.id)); const queryClient = useQueryClient()
const order = useQuery({ queryKey: computed(() => ['shop-order', id.value]), queryFn: () => shopApi.order(id.value) })
const confirm = ref(false); const error = ref('')
const cancel = useMutation({
  mutationFn: () => shopApi.cancel(id.value),
  onSuccess: async () => { confirm.value = false; await queryClient.invalidateQueries({ queryKey: ['shop-order', id.value] }); await queryClient.invalidateQueries({ queryKey: ['shop-orders'] }) },
  onError: reason => { error.value = friendlyError(reason) },
})
</script>

<template>
  <section class="order-page">
    <RouterLink class="back-link" to="/orders"><ArrowLeft :size="18" aria-hidden="true" />返回订单</RouterLink>
    <div v-if="order.isPending.value" class="page-skeleton"><span /><span /></div>
    <div v-else-if="order.isError.value" class="state-page"><p>订单未抵达</p><h1 tabindex="-1">无法打开订单</h1><button type="button" @click="order.refetch()">重试</button></div>
    <article v-else-if="order.data.value" class="order-detail">
      <header><div><p class="eyebrow">订单 / #{{ order.data.value.id }}</p><h1 tabindex="-1">{{ order.data.value.product_name || `商品 #${order.data.value.product_id}` }}</h1></div><span :data-status="order.data.value.status">{{ orderStatus(order.data.value.status) }}</span></header>

      <section class="purchase-summary" aria-label="购买摘要">
      <img v-if="order.data.value.product_cover_image" :src="order.data.value.product_cover_image" :alt="order.data.value.product_name">
      <div class="order-total"><span>订单总额</span><strong>{{ formatMoney(order.data.value.total_price) }}</strong></div>
      </section>
      <dl><div><dt>下单时间</dt><dd>{{ formatDate(order.data.value.create_time) }}</dd></div><div><dt>数量</dt><dd>{{ order.data.value.quantity }}</dd></div><div><dt>单价</dt><dd>{{ formatMoney(order.data.value.unit_price) }}</dd></div><div><dt>余额支付</dt><dd>{{ formatMoney(order.data.value.prepaid) }}</dd></div><div v-if="order.data.value.memo"><dt>备注</dt><dd>{{ order.data.value.memo }}</dd></div></dl>

      <section v-if="order.data.value.purchase_fields?.length"><h2>购买资料</h2><dl><div v-for="field in order.data.value.purchase_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ formatPurchaseValue(field) }}</dd></div></dl></section>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <NButton v-if="order.data.value.status === 1" size="large" secondary type="error" @click="confirm = true">取消订单并退款</NButton>
    </article>
    <NModal v-model:show="confirm" preset="dialog" title="确认取消订单？" content="订单会保留为已取消，已使用的预存余额将原路退回。" positive-text="取消并退款" negative-text="继续保留" :loading="cancel.isPending.value" @positive-click="cancel.mutate()" />
  </section>
</template>

<style scoped>
.purchase-summary{display:flex;align-items:center;gap:1.5rem;padding-block:1.5rem;border-block:1px solid var(--line);margin-bottom:1rem}
.purchase-summary>img{width:6rem;height:6rem;object-fit:cover;border-radius:12px;flex:0 0 auto}
.purchase-summary>.order-total{flex:1;min-width:0;margin:0;padding:0;border:0;flex-wrap:wrap;gap:.5rem}
@media(max-width:480px){.purchase-summary{align-items:start;gap:1rem}.purchase-summary>.order-total{align-items:start;flex-direction:column}}
</style>
