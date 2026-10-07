<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { setLucideProps } from '@lucide/vue'
import { api, auth, friendlyError } from '@lostsky/api/client'
import type { CommunitySession } from '@lostsky/api/community'
import { chatWorkspaceUrl, identityUrl, loginUrl } from '@lostsky/shared/navigation'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, NAlert, zhCN } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const identityHref = computed(() => identityUrl(new URL(route.fullPath, location.origin).href))
const loginHref = computed(() => loginUrl({ redirect: new URL(identityHref.value, location.origin).href }))
const actorKey = communityActorKey()
const session = useQuery({ queryKey: ['community-session', actorKey], queryFn: () => api.get<CommunitySession>('/session'), enabled: Boolean(auth.token()) })
</script>
<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN"><NDialogProvider><NMessageProvider>
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <header class="community-header"><RouterLink to="/" class="community-brand">LostSky 社区</RouterLink><nav aria-label="社区导航"><a :href="chatWorkspaceUrl()">聊天</a><RouterLink to="/">社区广场</RouterLink><RouterLink to="/mine">我加入的社区</RouterLink></nav><div class="community-identity"><span v-if="session.data.value?.entity">当前人员：{{ session.data.value.entity.name }}</span><a :href="auth.token() ? identityHref : loginHref">{{ auth.token() ? (session.data.value?.entity ? '前往通行证切换身份' : '选择人员身份') : '登录' }}</a></div></header>
    <main id="main-content" class="community-main" tabindex="-1"><LsPage width="content"><NAlert v-if="session.isError.value" type="error">{{ friendlyError(session.error.value) }}</NAlert><RouterView :key="$route.path" /></LsPage></main>
  </NMessageProvider></NDialogProvider></NConfigProvider>
</template>
<style scoped>
.community-header{display:flex;align-items:center;flex-wrap:wrap;gap:1rem 2rem;padding:1rem max(1rem,calc((100% - 72rem)/2));border-bottom:1px solid var(--border);background:var(--surface)}.community-brand{font-size:1.15rem;font-weight:750}.community-header nav,.community-identity{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem 1rem}.community-header a{display:inline-flex;align-items:center;min-height:44px}.community-header nav .router-link-exact-active{color:var(--primary);text-decoration:underline;text-underline-offset:.35em}.community-identity{font-size:.8125rem;color:var(--muted-ink);margin-left:auto}.community-main{padding:2rem 1rem;min-width:0}@media(max-width:639px){.community-header{gap:.25rem 1rem}.community-brand{width:100%}.community-identity{margin-left:0;width:100%}.community-main{padding:1.25rem 1rem}}
</style>
