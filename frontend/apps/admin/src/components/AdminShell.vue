<script setup lang="ts">
defineProps<{ scene?: boolean }>()
import { api, auth, friendlyError } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { feedback } from '@lostsky/ui/feedback'
import LsSearchInput from '@lostsky/ui/components/LsSearchInput.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
import {
  Activity, ChevronRight, Command, FileClock, Gauge, KeyRound, LogOut, Menu, Search,
  ShieldCheck, ShieldPlus, Users, UserRoundCog, X,
} from '@lucide/vue'
import { NButton, NModal } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminSession } from '../session'
import type { TeamSummary, UserSummary } from '../types'

const route = useRoute()
const router = useRouter()
const drawer = ref(false)
const commandOpen = ref(false)
const search = ref('')
const searching = ref(false)
const results = ref<{ users: UserSummary[]; teams: TeamSummary[] }>({ users: [], teams: [] })
let timer = 0

interface NavItem { to: string; label: string; icon: typeof Gauge }
const nav: NavItem[] = [
  { to: '/', label: '平台总览', icon: Gauge },
  { to: '/users', label: '用户', icon: Users },
  { to: '/teams', label: '团队', icon: ShieldCheck },
  { to: '/administrators', label: '平台管理员', icon: UserRoundCog },
  { to: '/roles', label: '平台角色', icon: Command },
  { to: '/audit', label: '审计日志', icon: FileClock },
  { to: '/system', label: '系统状态', icon: Activity },
  { to: '/site-content', label: '官网内容', icon: FileClock },
  { to: '/entitlements/team-abilities', label: '团队能力', icon: ShieldPlus },
  { to: '/entitlements/packages', label: '平台权益', icon: KeyRound },
  { to: '/entitlements/campaigns', label: '兑换活动', icon: KeyRound },
]
const title = computed(() => String(route.meta.title ?? '平台管理'))

watch(search, (value) => {
  window.clearTimeout(timer)
  const keyword = value.trim()
  if (keyword.length < 2) {
    results.value = { users: [], teams: [] }
    return
  }
  timer = window.setTimeout(async () => {
    searching.value = true
    try { results.value = await api.get('/search', { q: keyword }) }
    catch (error) { feedback.error(friendlyError(error)) }
    finally { searching.value = false }
  }, 180)
})

function onKeyboard(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const typing = target?.matches('input,textarea,[contenteditable="true"]')
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault(); commandOpen.value = true
  } else if (!typing && event.key === '/') {
    event.preventDefault(); commandOpen.value = true
  } else if (event.key === 'Escape') commandOpen.value = false
}
function open(path: string) { commandOpen.value = false; search.value = ''; router.push(path) }
function logout() { auth.clear(); redirectToLogin() }
function openSearch() { commandOpen.value = true }
onMounted(() => {
  window.addEventListener('keydown', onKeyboard)
  window.addEventListener('admin:open-search', openSearch)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyboard)
  window.removeEventListener('admin:open-search', openSearch)
  window.clearTimeout(timer)
})
</script>

<template>
  <div class="admin-shell">
    <a href="#admin-main" class="skip-link">跳到主要内容</a>
    <aside :class="['admin-sidebar', { open: drawer }]" aria-label="平台管理导航">
      <div class="brand-row">
        <RouterLink to="/" class="brand" @click="drawer=false"><strong>LostSky</strong><span>平台管理</span></RouterLink>
        <NButton quaternary aria-label="关闭导航" @click="drawer=false"><template #icon><X :size="20" /></template></NButton>
      </div>
      <NButton class="sidebar-search" quaternary @click="commandOpen=true"><template #icon><Search :size="17" /></template><span>搜索平台资源</span><kbd>⌘ K</kbd></NButton>
      <nav>
        <p>平台资源</p>
        <RouterLink v-for="item in nav.slice(0,3)" :key="item.to" :to="item.to" @click="drawer=false">
          <component :is="item.icon" :size="18" /><span>{{ item.label }}</span><ChevronRight :size="14" />
        </RouterLink>
        <p v-if="nav.length>3">治理与安全</p>
        <RouterLink v-for="item in nav.slice(3)" :key="item.to" :to="item.to" :class="{ 'router-link-active': item.to === '/entitlements/campaigns' && route.path.startsWith('/entitlements/campaigns/') }" @click="drawer=false">
          <component :is="item.icon" :size="18" /><span>{{ item.label }}</span><ChevronRight :size="14" />
        </RouterLink>
      </nav>
      <div v-if="adminSession.data" class="admin-identity">
        <span>{{ adminSession.data.user.username.slice(0,1).toUpperCase() }}</span>
        <div><strong>{{ adminSession.data.user.username }}</strong><small>{{ adminSession.data.roles.map(r=>r.name).join('、') }}</small></div>
        <NButton quaternary aria-label="退出登录" @click="logout"><template #icon><LogOut :size="17" /></template></NButton>
      </div>
    </aside>
    <Transition name="ls-backdrop">
      <NButton v-if="drawer" class="shell-backdrop" quaternary aria-label="关闭导航" @click="drawer=false" />
    </Transition>
    <section class="admin-workspace">
      <LsWorkspaceHeader :scene="scene" :contextual="scene" context-label="平台管理" :title="title" :actions="[{ key: 'search', label: '搜索平台资源' }]" @menu="drawer=true" @action="commandOpen=true">
        <template #actions><NButton class="top-search" secondary @click="commandOpen=true"><template #icon><Search :size="18" /></template><span>搜索用户、团队</span><kbd>Ctrl K</kbd></NButton></template>
      </LsWorkspaceHeader>
      <slot />
    </section>
    <NModal v-model:show="commandOpen" preset="card" class="command-palette" title="搜索平台资源">
      <LsSearchInput v-model="search" autofocus placeholder="输入用户名、手机号、邮箱、团队名称或 ID" aria-label="搜索平台资源" />
      <p v-if="searching" class="command-hint">正在搜索…</p>
      <p v-else-if="search.trim().length<2" class="command-hint">至少输入 2 个字符。按 Esc 关闭。</p>
      <div v-else class="command-results">
        <section v-if="results.users.length"><h2>用户</h2><NButton v-for="user in results.users" :key="user.id" quaternary @click="open(`/users/${user.id}`)"><span><strong>{{ user.nickname || user.username }}</strong><small>#{{ user.id }} · {{ user.phone_masked || user.email_masked }}</small></span><LsStatusTag :label="user.is_banned ? '已封禁' : '正常'" :type="user.is_banned ? 'error' : 'success'" /></NButton></section>
        <section v-if="results.teams.length"><h2>团队</h2><NButton v-for="team in results.teams" :key="team.id" quaternary @click="open(`/teams/${team.id}`)"><span><strong>{{ team.name || team.slug }}</strong><small>#{{ team.id }} · {{ team.slug }}</small></span><LsStatusTag :label="team.is_banned ? '已封禁' : '正常'" :type="team.is_banned ? 'error' : 'success'" /></NButton></section>
        <p v-if="!results.users.length&&!results.teams.length" class="command-hint">没有找到匹配的用户或团队。</p>
      </div>
    </NModal>
  </div>
</template>
