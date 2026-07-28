<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, ReceiptText, ShoppingBag, WalletCards } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { formatDate, formatMoney, orderStatus, shopApi } from '../lib'

const orders = useQuery({ queryKey: ['shop-orders'], queryFn: () => shopApi.orders() })
const balance = useQuery({ queryKey: ['shop-balance'], queryFn: shopApi.balance })
</script>

<template>
  <section class="orders-page">
    <header class="account-heading">
      <div class="account-heading-copy">
        <h1 tabindex="-1">我的订单</h1>
        <p>购买记录、处理状态与退款结果都会保留在这里。</p>
      </div>
      <aside class="balance-brief" aria-label="客户余额">
        <div><WalletCards :size="20" aria-hidden="true" /><span>可用余额</span></div>
        <strong v-if="balance.data.value">{{ formatMoney(balance.data.value.balance) }}</strong>
        <span v-else-if="balance.isPending.value" class="balance-loading" role="status">正在读取余额…</span>
        <button v-else type="button" @click="balance.refetch()">余额加载失败，重试</button>
        <small>余额由商家预存，购买时自动扣减。</small>
      </aside>
    </header>

    <section class="orders-content" aria-labelledby="order-history-title">
      <header class="orders-content-heading">
        <div><ReceiptText :size="21" aria-hidden="true" /><h2 id="order-history-title">订单记录</h2></div>
        <span v-if="orders.data.value">{{ orders.data.value.total }} 笔</span>
      </header>

      <div v-if="orders.isPending.value" class="order-skeleton" aria-label="订单正在加载"><span v-for="item in 3" :key="item" /></div>
      <div v-else-if="orders.isError.value" class="collection-message" role="alert">
        <div><strong>订单暂时没有加载出来</strong><span>请检查网络连接后再试一次。</span></div>
        <button type="button" @click="orders.refetch()">重新加载</button>
      </div>
      <div v-else-if="orders.data.value?.list.length" class="order-list">
        <RouterLink v-for="order in orders.data.value.list" :key="order.id" :to="`/orders/${order.id}`">
          <img v-if="order.product_cover_image" :src="order.product_cover_image" alt="" loading="lazy">
          <span v-else class="order-number">#{{ order.id }}</span>
          <span class="order-copy">
            <small>{{ formatDate(order.create_time) }} · {{ orderStatus(order.status) }}</small>
            <strong>{{ order.product_name || `商品 #${order.product_id}` }}</strong>
            <p>{{ order.quantity }} 件 · {{ formatMoney(order.total_price) }}</p>
          </span>
          <ArrowRight :size="20" aria-hidden="true" />
        </RouterLink>
      </div>
      <div v-else class="orders-empty">
        <div class="orders-empty-copy">
          <span class="orders-empty-icon" aria-hidden="true"><ShoppingBag :size="28" :stroke-width="1.6" /></span>
          <h2>从第一件喜欢的商品开始</h2>
          <p>完成购买后，商品、金额、处理状态和退款记录会按时间出现在这里。</p>
          <RouterLink class="orders-cta" to="/">浏览商城 <ArrowRight :size="18" aria-hidden="true" /></RouterLink>
        </div>
        <ol class="orders-guide" aria-label="购买流程">
          <li><span>1</span><div><strong>选择商品</strong><small>查看团队正在展示的内容</small></div></li>
          <li><span>2</span><div><strong>余额购买</strong><small>使用商家为你预存的余额</small></div></li>
          <li><span>3</span><div><strong>跟进订单</strong><small>在这里查看处理与退款结果</small></div></li>
        </ol>
      </div>
    </section>
  </section>
</template>
