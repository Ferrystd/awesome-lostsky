<script setup lang="ts">
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowDown, ArrowRight, Sparkles } from '@lucide/vue'
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { formatMoney, shopApi } from '../lib'

const storefront = useQuery({ queryKey: ['shop-storefront'], queryFn: shopApi.storefront })
const products = useQuery({ queryKey: ['shop-products'], queryFn: () => shopApi.products() })
const hostSlug = location.hostname.split('.')[0] || 'team'
const profile = computed(() => storefront.data.value?.profile)
const shopName = computed(() => profile.value?.name || `${hostSlug} 商店`)
const description = computed(() => profile.value?.description || '由团队认真准备的商品与服务，在这里持续陈列。')
const productCount = computed(() => storefront.data.value?.product_count ?? products.data.value?.total ?? 0)

watch(shopName, (name) => { document.title = `${name} 商城 · LostSky` }, { immediate: true })
</script>

<template>
  <section class="store-hero" :aria-busy="storefront.isPending.value">
    <div class="hero-copy">
      <p class="store-kicker"><span /> @{{ storefront.data.value?.slug || hostSlug }}</p>
      <h1 tabindex="-1">{{ shopName }}</h1>
      <p class="hero-description">{{ description }}</p>
      <a v-if="!storefront.isError.value" class="primary-link" href="#collection">浏览商品 <ArrowDown :size="18" aria-hidden="true" /></a>
      <button v-else class="text-action" type="button" @click="storefront.refetch()">重新连接商城 <ArrowRight :size="18" aria-hidden="true" /></button>
      <p v-if="storefront.isPending.value" class="hero-status" role="status">正在准备商城内容…</p>
      <p v-else-if="storefront.isError.value" class="hero-status hero-status-error" role="alert">商城资料暂时没有抵达，请稍后重试。</p>
    </div>

    <div class="hero-art">
      <img v-if="profile?.intro_image" :src="profile.intro_image" :alt="`${shopName} 商城视觉`" fetchpriority="high">
      <div v-else class="store-poster" aria-label="商城品牌海报">
        <div class="poster-orbit" aria-hidden="true" />
        <div class="poster-top"><span>LostSky</span><span>团队商城</span></div>
        <div class="poster-center">
          <img v-if="profile?.avatar" :src="profile.avatar" alt="">
          <Sparkles v-else :size="34" :stroke-width="1.4" aria-hidden="true" />
          <strong>{{ shopName }}</strong>
        </div>
        <div class="poster-bottom"><span>CURATED BY TEAM</span><span>{{ productCount }} ITEMS</span></div>
      </div>
    </div>
  </section>

  <section id="collection" class="collection">
    <header class="collection-heading">
      <div><p class="section-label">团队精选</p><h2>本期陈列</h2></div>
      <p v-if="!products.isError.value">{{ productCount ? `${productCount} 件商品` : '新品准备中' }}</p>
    </header>
    <div v-if="products.isPending.value" class="product-skeleton" aria-label="商品正在加载"><span v-for="item in 2" :key="item" /></div>
    <div v-else-if="products.isError.value" class="collection-message" role="alert">
      <div><strong>商品列表暂时没有抵达</strong><span>品牌资料仍可继续浏览，你也可以重新加载商品。</span></div>
      <button type="button" @click="products.refetch()">重新加载</button>
    </div>
    <div v-else-if="products.data.value?.list?.length" class="product-stream">
      <article v-for="(product, index) in products.data.value.list" :key="product.id" class="product-feature" :class="{ reverse: index % 2 === 1 }">
        <RouterLink class="product-media" :to="`/product/${product.id}`" :aria-label="`查看 ${product.name}`">
          <img v-if="product.cover_image" :src="product.cover_image" :alt="product.name" width="960" height="720" loading="lazy">
          <span v-else class="type-cover"><small>{{ shopName }}</small><strong>{{ product.name }}</strong></span>
        </RouterLink>
        <div class="product-copy">
          <p class="section-label">精选商品</p>
          <h3>{{ product.name }}</h3>
          <p>{{ product.description || '查看商品详情与购买说明。' }}</p>
          <div><strong>{{ formatMoney(product.price) }}</strong><RouterLink :to="`/product/${product.id}`">查看详情 <ArrowRight :size="18" aria-hidden="true" /></RouterLink></div>
        </div>
      </article>
    </div>
    <div v-else class="collection-empty">
      <div class="empty-art" aria-hidden="true"><span /><span /><span /></div>
      <div><p class="section-label">即将上线</p><h3>商品正在准备中</h3><p>{{ shopName }} 正在整理第一批陈列。这里不会用虚构商品填满页面，等团队准备好真实内容后再与你见面。</p></div>
    </div>
  </section>

  <section v-if="profile?.introduction_markdown" class="manifesto">
    <header><p class="section-label">关于这间商店</p><h2>团队想与你分享的事</h2></header>
    <LsMarkdownRenderer class="shop-markdown" :content="profile.introduction_markdown" :chat-enabled="false" />
  </section>
</template>
