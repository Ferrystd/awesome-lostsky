<script setup lang="ts">
import { ShoppingBag, UserRound } from '@lucide/vue'
import { NConfigProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { RouterLink, RouterView } from 'vue-router'

const shopTheme: GlobalThemeOverrides = {
  common: {
    primaryColor: '#69e4dc',
    primaryColorHover: '#93f1eb',
    primaryColorPressed: '#47c7c0',
    primaryColorSuppl: '#69e4dc',
    borderRadius: '8px',
    textColorBase: '#f5f7fb',
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  },
  Input: {
    heightLarge: '52px',
    color: '#0b1525',
    colorFocus: '#0b1525',
    border: '1px solid rgba(163, 197, 211, .3)',
    borderHover: '1px solid rgba(105, 228, 220, .72)',
    borderFocus: '1px solid #69e4dc',
    boxShadowFocus: '0 0 0 3px rgba(105, 228, 220, .13)',
    borderRadius: '8px',
  },
  Button: {
    heightLarge: '52px',
    borderRadiusLarge: '8px',
    fontWeight: '700',
  },
}
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="shopTheme">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <div class="shop-app">
      <header class="site-header">
        <RouterLink class="brand" to="/" aria-label="返回商城首页"><span>LOSTSKY</span><small>TEAM SHOP</small></RouterLink>
        <nav aria-label="商城导航">
          <RouterLink to="/">商城首页</RouterLink>
          <RouterLink to="/customer/profile"><UserRound :size="17" aria-hidden="true" />我的资料</RouterLink>
          <RouterLink to="/orders"><ShoppingBag :size="17" aria-hidden="true" />我的订单</RouterLink>
        </nav>
      </header>
      <main id="main-content" tabindex="-1"><RouterView /></main>
      <footer class="site-footer"><span>Powered by LostSky</span><a href="https://www.lostsky.work">认识 LostSky</a></footer>
    </div>
  </NConfigProvider>
</template>
