<script setup lang="ts">
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { computed } from 'vue'
import { friendlyError } from '@lostsky/api/client'
import { RouterLink, useRoute } from 'vue-router'
import { formatMoney, shopApi } from '../lib'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const product = useQuery({ queryKey: computed(() => ['shop-product', id.value]), queryFn: () => shopApi.product(id.value) })
</script>

<template>
  <div v-if="product.isPending.value" class="page-skeleton"><span /><span /><span /></div>
  <section v-else-if="product.isError.value" class="state-page"><p>商品未抵达</p><h1 tabindex="-1">{{ friendlyError(product.error.value) }}</h1><button type="button" @click="product.refetch()">重新加载</button></section>
  <article v-else-if="product.data.value" class="product-page">
    <RouterLink class="back-link" to="/"><ArrowLeft :size="18" aria-hidden="true" />返回陈列</RouterLink>
    <div class="product-hero">
      <div class="detail-media">
        <img v-if="product.data.value.cover_image" :src="product.data.value.cover_image" :alt="product.data.value.name">
        <span v-else class="type-cover"><small>LOSTSKY SELECT</small><strong>{{ product.data.value.name.slice(0, 1) }}</strong></span>
      </div>
      <div class="detail-copy"><p class="eyebrow">商品 / {{ product.data.value.id }}</p><h1 tabindex="-1">{{ product.data.value.name }}</h1><p>{{ product.data.value.description }}</p><strong class="detail-price">{{ formatMoney(product.data.value.price) }}</strong><RouterLink class="primary-link" :to="`/product/${id}/checkout`">确认购买 <ArrowRight :size="18" aria-hidden="true" /></RouterLink><small>使用商家预存余额支付</small></div>
    </div>
    <section v-if="product.data.value.benefit_package?.services.length" class="product-inclusions" aria-labelledby="product-inclusions-title">
      <div>
        <p class="section-index">权益内容</p>
        <h2 id="product-inclusions-title">内含服务</h2>
        <p>{{ product.data.value.benefit_package.name }}将在购买成功后发放到你的服务权益中。</p>
      </div>
      <div class="inclusion-list">
        <article v-for="(item, index) in product.data.value.benefit_package.services" :key="item.id" class="inclusion-item">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h3>{{ item.name }}</h3>
            <p v-if="item.description">{{ item.description }}</p>
            <dl>
              <div><dt>服务额度</dt><dd>{{ Number(item.quantity) }} {{ item.unit_name }}</dd></div>
              <div><dt>单次最小额度</dt><dd>{{ Number(item.quantity_step) }} {{ item.unit_name }}</dd></div>
              <div><dt>有效期</dt><dd>{{ item.valid_days > 0 ? `领取后 ${item.valid_days} 天` : '长期有效' }}</dd></div>
            </dl>
          </div>
        </article>
      </div>
    </section>
    <section v-if="product.data.value.introduction_markdown" class="product-story"><p class="section-index">商品详情</p><LsMarkdownRenderer class="shop-markdown" :content="product.data.value.introduction_markdown" :chat-enabled="false" /></section>
  </article>
</template>
