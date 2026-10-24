<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { ShieldX } from '@lucide/vue'
function leave(){auth.clear();redirectToLogin()}
</script>
<template>
  <div class="access-result">
    <header><ShieldX :size="36" aria-hidden="true" /><h1>无法进入平台管理后台</h1><p>当前账号未绑定有效的平台管理员角色。</p></header>
    <LsPanel><section class="access-result__recovery"><h2>如何继续</h2><p>需要管理平台时，请联系超级管理员确认账号角色；也可以使用其他账号登录。</p><LsButton @click="leave">返回账号登录</LsButton></section></LsPanel>
  </div>
</template>
<style scoped>
.access-result{width:100%;max-width:42rem;margin:clamp(1rem,5vh,4rem) auto;display:grid;gap:1.5rem;overflow-wrap:anywhere}.access-result header{display:grid;gap:.75rem}.access-result svg{color:var(--sky-lost-strong)}.access-result h1{font-size:1.75rem;line-height:1.3;margin:0}.access-result p{color:var(--muted-ink);line-height:1.65;margin:0}.access-result__recovery{display:grid;justify-items:start;gap:1rem}.access-result h2{font-size:1.125rem;margin:0}
</style>
