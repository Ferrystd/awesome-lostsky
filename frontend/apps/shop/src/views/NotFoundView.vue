<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
const route = useRoute()
</script>

<template>
  <LsDetailPage v-if="route.meta.manage" title="404" back-to="/manage"><LsEmptyState title="页面不存在" description="请返回工作台选择其他入口。" /></LsDetailPage>
  <section v-else class="state-page">
    <p>404 / 页面未找到</p>
    <h1 tabindex="-1">这里没有陈列商品</h1>
    <RouterLink to="/">返回商城首页</RouterLink>
  </section>
</template>
