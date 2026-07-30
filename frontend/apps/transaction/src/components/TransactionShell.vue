<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { BarChart3, ChevronRight, CircleDollarSign, Handshake, ListChecks, LogOut, Menu, Plus, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const drawer = ref(false)
const nav = [
  ['/', '流水', ListChecks],
  ['/stats', '统计', BarChart3],
  ['/bindings', '发单绑定', Handshake],
  ['/balances', '客户余额', CircleDollarSign],
] as const
const title = computed(() => String(route.meta.title ?? '记账工作台'))
function logout() {
  auth.clear()
  redirectToLogin()
}
</script>

<template>
  <div class="transaction-shell">
    <a class="skip" href="#workspace">跳到主要内容</a>
    <aside :class="['sidebar', { open: drawer }]" aria-label="记账导航">
      <div class="sidebar-head">
        <a class="wordmark" href="/"><strong>LostSky</strong><span>记账工作台</span></a>
        <button type="button" aria-label="关闭导航" @click="drawer = false"><X /></button>
      </div>
      <nav>
        <p>TRANSACTION</p>
        <RouterLink v-for="item in nav" :key="item[0]" :to="item[0]" @click="drawer = false">
          <component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" />
        </RouterLink>
      </nav>
      <RouterLink class="new-entry" to="/new" @click="drawer = false"><Plus :size="18" />登记流水</RouterLink>
      <button class="logout" type="button" @click="logout"><LogOut :size="18" />退出登录</button>
    </aside>
    <Transition name="ls-backdrop">
      <div v-if="drawer" class="backdrop" aria-hidden="true" @click="drawer = false"></div>
    </Transition>
    <section class="workspace">
      <header class="topbar">
        <button type="button" aria-label="打开导航" @click="drawer = true"><Menu /></button>
        <div><p>TRANSACTION WORKSPACE</p><h1>{{ title }}</h1></div>
        <RouterLink to="/new" aria-label="登记流水"><Plus :size="20" /></RouterLink>
      </header>
      <slot />
      <nav class="bottom-nav" aria-label="移动端导航">
        <RouterLink v-for="item in nav" :key="item[0]" :to="item[0]"><component :is="item[2]" :size="20" /><span>{{ item[1] }}</span></RouterLink>
        <button type="button" @click="drawer = true"><Menu :size="20" /><span>更多</span></button>
      </nav>
    </section>
  </div>
</template>
