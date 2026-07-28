<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="display-app">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="返回团队公开主页">
        <span>LOSTSKY</span>
        <small>TEAM DISPLAY</small>
      </RouterLink>
      <nav aria-label="公开主页导航">
        <RouterLink to="/">团队主页</RouterLink>
        <a href="https://www.lostsky.work">LostSky <ArrowUpRight :size="15" aria-hidden="true" /></a>
      </nav>
    </header>
    <main id="main-content" tabindex="-1"><RouterView /></main>
    <footer class="site-footer">
      <span>Powered by LostSky</span>
      <a href="https://www.lostsky.work">了解 LostSky <ArrowUpRight :size="15" aria-hidden="true" /></a>
    </footer>
  </div>
</template>
