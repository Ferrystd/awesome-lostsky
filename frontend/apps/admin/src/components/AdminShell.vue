<script setup lang="ts">
import { api, auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import LsSearchInput from '@lostsky/ui/components/LsSearchInput.vue'
import {
  Activity, ChevronRight, Command, FileClock, Gauge, LogOut, Menu, Search,
  ShieldCheck, Users, UserRoundCog, X,
} from '@lucide/vue'
import { NModal, NTag } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminSession, can } from '../session'
import type { TeamSummary, UserSummary } from '../types'

const route = useRoute()
const router = useRouter()
const drawer = ref(false)
const commandOpen = ref(false)
const search = ref('')
const searching = ref(false)
const results = ref<{ users: UserSummary[]; teams: TeamSummary[] }>({ users: [], teams: [] })
let timer = 0

const nav = [
  { to: '/', label: '平台总览', icon: Gauge, permission: 'admin.dashboard.read' },
  { to: '/users', label: '用户', icon: Users, permission: 'admin.user.read' },
  { to: '/teams', label: '团队', icon: ShieldCheck, permission: 'admin.team.read' },
  { to: '/administrators', label: '平台管理员', icon: UserRoundCog, permission: 'admin.access.read' },
  { to: '/roles', label: '平台角色', icon: Command, permission: 'admin.access.read' },
  { to: '/audit', label: '审计日志', icon: FileClock, permission: 'admin.audit.read' },
  { to: '/system', label: '系统状态', icon: Activity, permission: 'admin.system.read' },
]
const visibleNav = computed(() => nav.filter((item) => can(item.permission)))
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
        <button type="button" aria-label="关闭导航" @click="drawer=false"><X :size="20" /></button>
      </div>
      <button class="sidebar-search" type="button" @click="commandOpen=true"><Search :size="17" /><span>搜索平台资源</span><kbd>⌘ K</kbd></button>
      <nav>
        <p>平台资源</p>
        <RouterLink v-for="item in visibleNav.slice(0,3)" :key="item.to" :to="item.to" @click="drawer=false">
          <component :is="item.icon" :size="18" /><span>{{ item.label }}</span><ChevronRight :size="14" />
        </RouterLink>
        <p v-if="visibleNav.length>3">治理与安全</p>
        <RouterLink v-for="item in visibleNav.slice(3)" :key="item.to" :to="item.to" @click="drawer=false">
          <component :is="item.icon" :size="18" /><span>{{ item.label }}</span><ChevronRight :size="14" />
        </RouterLink>
      </nav>
      <div v-if="adminSession.data" class="admin-identity">
        <span>{{ adminSession.data.user.username.slice(0,1).toUpperCase() }}</span>
        <div><strong>{{ adminSession.data.user.username }}</strong><small>{{ adminSession.data.roles.map(r=>r.name).join('、') }}</small></div>
        <button type="button" aria-label="退出登录" @click="logout"><LogOut :size="17" /></button>
      </div>
    </aside>
    <Transition name="ls-backdrop">
      <button v-if="drawer" class="shell-backdrop" type="button" aria-label="关闭导航" @click="drawer=false" />
    </Transition>
    <section class="admin-workspace">
      <header class="admin-topbar">
        <button type="button" aria-label="打开导航" @click="drawer=true"><Menu :size="21" /></button>
        <div><small>PLATFORM ADMIN</small><h1>{{ title }}</h1></div>
        <button class="top-search" type="button" @click="commandOpen=true"><Search :size="18" /><span>搜索用户、团队</span><kbd>Ctrl K</kbd></button>
      </header>
      <slot />
    </section>
    <NModal v-model:show="commandOpen" preset="card" class="command-palette" title="搜索平台资源">
      <LsSearchInput v-model="search" autofocus placeholder="输入用户名、手机号、邮箱、团队名称或 ID" aria-label="搜索平台资源" />
      <p v-if="searching" class="command-hint">正在搜索…</p>
      <p v-else-if="search.trim().length<2" class="command-hint">至少输入 2 个字符。按 Esc 关闭。</p>
      <div v-else class="command-results">
        <section v-if="results.users.length"><h2>用户</h2><button v-for="user in results.users" :key="user.id" type="button" @click="open(`/users/${user.id}`)"><span><strong>{{ user.nickname || user.username }}</strong><small>#{{ user.id }} · {{ user.phone_masked || user.email_masked }}</small></span><NTag size="small" :type="user.is_banned ? 'error' : 'success'">{{ user.is_banned ? '已封禁' : '正常' }}</NTag></button></section>
        <section v-if="results.teams.length"><h2>团队</h2><button v-for="team in results.teams" :key="team.id" type="button" @click="open(`/teams/${team.id}`)"><span><strong>{{ team.name || team.slug }}</strong><small>#{{ team.id }} · {{ team.slug }}</small></span><NTag size="small" :type="team.is_banned ? 'error' : 'success'">{{ team.is_banned ? '已封禁' : '正常' }}</NTag></button></section>
        <p v-if="!results.users.length&&!results.teams.length" class="command-hint">没有找到匹配的用户或团队。</p>
      </div>
    </NModal>
  </div>
</template>
