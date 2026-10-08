<script setup lang="ts">
import type { CommunityEntity } from '@lostsky/api/community'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import { Compass, Globe, MessageCircle, Users, LogIn } from '@lucide/vue'
import { NAvatar, NButton } from 'naive-ui'
import { useRoute } from 'vue-router'
defineProps<{ entity?: CommunityEntity | null; identityHref: string; identityLabel: string }>()
const route = useRoute()
</script>
<template>
  <div class="community-shell">
    <header class="community-shell__header">
      <RouterLink to="/" class="community-shell__brand"><Globe :size="26" aria-hidden="true" /><strong>LostSky 社区</strong></RouterLink>
      <div class="community-shell__identity"><NAvatar v-if="entity" round :src="entity.avatar || undefined" :size="32">{{ entity.name.slice(0, 1) }}</NAvatar><span v-if="entity" class="community-shell__person">当前人员：{{ entity.name }}</span><NButton tag="a" text :href="identityHref"><template #icon><LogIn :size="18" /></template>{{ identityLabel }}</NButton></div>
    </header>
    <nav class="community-shell__nav" aria-label="社区导航">
      <RouterLink to="/" :aria-current="route.path === '/' ? 'page' : undefined"><Compass :size="19" aria-hidden="true" />社区广场</RouterLink>
      <RouterLink to="/mine" :aria-current="route.path === '/mine' ? 'page' : undefined"><Users :size="19" aria-hidden="true" />我加入的社区</RouterLink>
      <a :href="chatWorkspaceUrl()"><MessageCircle :size="19" aria-hidden="true" />聊天</a>
    </nav>
    <main id="main-content" class="community-shell__main" tabindex="-1"><slot /></main>
  </div>
</template>
<style scoped>
.community-shell{min-width:0}.community-shell__header{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:76px;padding:1rem max(1rem,calc((100% - 64rem)/2));background:var(--surface)}.community-shell__brand{display:flex;align-items:center;gap:.625rem;min-height:44px;color:var(--primary);font-size:1.125rem;flex-shrink:0}.community-shell__identity{display:flex;align-items:center;justify-content:flex-end;gap:.625rem;min-width:0}.community-shell__person{max-width:14rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.875rem}.community-shell__nav{display:flex;align-items:center;gap:1.5rem;padding:0 max(1rem,calc((100% - 64rem)/2));background:var(--surface);border-bottom:1px solid var(--border)}.community-shell__nav a{display:flex;align-items:center;gap:.45rem;min-height:48px;border-bottom:2px solid transparent;font-size:.875rem;font-weight:600;white-space:nowrap}.community-shell__nav a[aria-current=page]{color:var(--primary);border-color:var(--primary)}.community-shell__nav a:hover{color:var(--primary)}.community-shell__main{padding:2rem 1rem 3rem;min-width:0}@media(max-width:639px){.community-shell__header{align-items:flex-start;flex-direction:column;gap:.25rem;padding-block:.625rem}.community-shell__identity{justify-content:flex-start;width:100%;min-height:44px;flex-wrap:wrap}.community-shell__nav{gap:1rem;flex-wrap:wrap}.community-shell__nav a{font-size:.8125rem}.community-shell__main{padding-top:1.25rem}}
</style>
