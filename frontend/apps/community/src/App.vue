<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { setLucideProps } from '@lucide/vue'
import { api, auth, friendlyError } from '@lostsky/api/client'
import type { CommunitySession } from '@lostsky/api/community'
import { identityUrl, loginUrl } from '@lostsky/shared/navigation'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import CommunityShell from './components/CommunityShell.vue'
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
    <CommunityShell :entity="session.data.value?.entity" :identity-href="auth.token() ? identityHref : loginHref" :identity-label="auth.token() ? (session.data.value?.entity ? '切换身份' : '选择人员身份') : '登录'">
      <LsPage :width="route.path.endsWith('/new') || route.path.endsWith('/edit') ? 'form' : 'content'"><NAlert v-if="session.isError.value" type="error">{{ friendlyError(session.error.value) }}</NAlert><RouterView :key="$route.path" /></LsPage>
    </CommunityShell>
  </NMessageProvider></NDialogProvider></NConfigProvider>
</template>
<style scoped>
.skip-link{position:fixed;inset-block-start:.5rem;inset-inline-start:1rem;z-index:var(--z-modal);padding:.625rem 1rem;background:var(--surface);color:var(--primary);border:1px solid var(--border);transform:translateY(calc(-100% - 1rem))}.skip-link:focus{transform:none}
</style>
