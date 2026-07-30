<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { withReferral } from '@lostsky/shared/referral'
import { formatMoney } from '../lib'
import type { PublicProduct } from '../types'

defineProps<{ products: PublicProduct[] }>()
</script>

<template>
  <div class="public-product-list">
    <a v-for="product in products" :key="product.id" :href="withReferral(product.href)">
      <span class="public-product-media">
        <img v-if="product.cover_image" :src="product.cover_image" :alt="product.name" width="320" height="240" loading="lazy">
        <span v-else class="public-product-fallback" aria-hidden="true">{{ product.name.slice(0, 1) }}</span>
      </span>
      <span class="public-product-copy">
        <strong>{{ product.name }}</strong>
        <span>{{ product.description || '前往商城查看商品详情与购买说明。' }}</span>
      </span>
      <span class="public-product-meta">
        <strong>{{ formatMoney(product.price) }}</strong>
        <span>商城详情 <ArrowUpRight :size="17" aria-hidden="true" /></span>
      </span>
    </a>
  </div>
</template>
