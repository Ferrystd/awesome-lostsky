<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="state-page">
    <p>404</p>
    <h1 tabindex="-1">这里没有可公开查看的内容</h1>
    <span>页面可能不存在，或对应资料尚未公开。</span>
    <RouterLink to="/"><ArrowLeft :size="18" aria-hidden="true" />返回团队主页</RouterLink>
  </section>
</template>
