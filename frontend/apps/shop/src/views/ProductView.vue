<script setup lang="ts">
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatMoney, shopApi } from '../lib'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const product = useQuery({ queryKey: computed(() => ['shop-product', id.value]), queryFn: () => shopApi.product(id.value) })
</script>

<template>
  <div v-if="product.isPending.value" class="page-skeleton"><span /><span /><span /></div>
  <section v-else-if="product.isError.value" class="state-page"><p>商品未抵达</p><h1 tabindex="-1">无法打开这个商品</h1><button type="button" @click="product.refetch()">重新加载</button></section>
  <article v-else-if="product.data.value" class="product-page">
    <RouterLink class="back-link" to="/"><ArrowLeft :size="18" aria-hidden="true" />返回陈列</RouterLink>
    <div class="product-hero">
      <div class="detail-media">
        <img v-if="product.data.value.cover_image" :src="product.data.value.cover_image" :alt="product.data.value.name">
        <span v-else class="type-cover"><small>LOSTSKY SELECT</small><strong>{{ product.data.value.name.slice(0, 1) }}</strong></span>
      </div>
      <div class="detail-copy"><p class="eyebrow">PRODUCT / {{ product.data.value.id }}</p><h1 tabindex="-1">{{ product.data.value.name }}</h1><p>{{ product.data.value.description }}</p><strong class="detail-price">{{ formatMoney(product.data.value.price) }}</strong><RouterLink class="primary-link" :to="`/product/${id}/checkout`">确认购买 <ArrowRight :size="18" aria-hidden="true" /></RouterLink><small>使用商家预存余额支付</small></div>
    </div>
    <section v-if="product.data.value.introduction_markdown" class="product-story"><p class="section-index">DETAILS / 商品详情</p><LsMarkdownRenderer class="shop-markdown" :content="product.data.value.introduction_markdown" :chat-enabled="false" /></section>
  </article>
</template>
