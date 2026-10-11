<script setup lang="ts">
import { teamNavigation, teamNavigationOwner } from '../lib/workspaceNavigation'
import { identityUrl, workspaceAppEntries } from '@lostsky/shared/navigation'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
import { Bell, ChevronDown, ChevronRight, FileText, Globe, House, Menu, MessageCircleMore, Radio, ReceiptText, ShieldCheck, Store, UserRound, X } from '@lucide/vue'
import { NButton } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type NavItem = {
  to: string
  label: string
  icon: typeof House
}
const appIcons = { team: House, shop: Store, transaction: ReceiptText, chat: MessageCircleMore, community: Globe, weibo: Radio }
const route = useRoute()
const router = useRouter()
const drawer = ref(false)
const menuScroll = ref<HTMLElement | null>(null)
const canScrollDown = ref(false)

const primary: NavItem[] = [{ to: '/', label: '概览', icon: House }]
const personalNav: NavItem[] = [
  { to: '/personal', label: '概览', icon: House },
  { to: '/personal/notices', label: '收件箱', icon: Bell },
  { to: '/personal/profile', label: '资料', icon: UserRound },
  { to: '/personal/fields', label: '对象字段', icon: FileText },
  { to: '/personal/access', label: '角色与权限', icon: ShieldCheck },
]
const title = computed(() => String(route.meta.title ?? '工作台'))
const activeWorkspace = computed(() => (route.meta.workspace === 'personal' ? 'personal' : 'team'))
const sidebarPrimary = computed(() => (activeWorkspace.value === 'personal' ? personalNav : primary))
const bottomPrimary = computed(() => (activeWorkspace.value === 'personal' ? personalNav : [...primary, ...teamNavigation[0].links.filter(item => ['/entities', '/customers'].includes(item.to))]))
const appEntries = computed(() => {
  const personal = activeWorkspace.value === 'personal'
  return workspaceAppEntries({ personal })
})
const headerActions = computed(() =>
  appEntries.value.map(({ key, label, disabled, reason }) => ({
    key,
    label,
    disabled,
    reason,
  })),
)
const sidebarUtility = computed(() =>
  activeWorkspace.value === 'personal'
    ? {
        label: '切换身份',
        href: identityUrl(),
        icon: UserRound,
        target: undefined,
        rel: undefined,
      }
    : {
        label: '切换身份',
        href: identityUrl(),
        icon: UserRound,
        target: undefined,
        rel: undefined,
      },
)

function handleHeaderAction(key: string) {
  const entry = appEntries.value.find((item) => item.key === key)
  if (!entry || entry.disabled) return
  if (entry.key === 'team') void router.push('/')
  else window.location.href = entry.href
}

function updateMenuScroll() {
  const element = menuScroll.value
  canScrollDown.value = Boolean(element && element.scrollTop + element.clientHeight < element.scrollHeight - 4)
}

function scrollMenuDown() {
  const element = menuScroll.value
  if (!element) return
  element.scrollBy({
    top: Math.max(160, element.clientHeight * 0.65),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

onMounted(() => {
  void nextTick(updateMenuScroll)
  window.addEventListener('resize', updateMenuScroll)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateMenuScroll))
watch(
  () => [drawer.value, route.path],
  () => {
    void nextTick(updateMenuScroll)
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="team-shell">
    <a href="#workspace" class="skip">跳到主要内容</a>
    <aside :class="['sidebar', { open: drawer }]" aria-label="团队导航">
      <div class="sidebar-head">
        <a href="/" class="wordmark"><strong>LostSky</strong><span>失落青空</span></a>
        <NButton quaternary aria-label="关闭导航" @click="drawer = false"
          ><template #icon><X /></template
        ></NButton>
      </div>
      <div :class="['menu-scroll', { 'has-more': canScrollDown }]">
        <nav ref="menuScroll" @scroll="updateMenuScroll">
          <p>工作空间</p>
          <template v-for="item in sidebarPrimary" :key="item.to">
            <RouterLink :to="item.to" @click="drawer = false">
              <component :is="item.icon" :size="19" />
              <span>{{ item.label }}</span>
              <ChevronRight :size="15" />
            </RouterLink>
          </template>

          <template v-if="activeWorkspace === 'team'">
            <template v-for="group in teamNavigation" :key="group.key">
              <p>{{ group.title }}</p>
              <RouterLink v-for="item in group.links" :key="item.to" :to="item.to" :class="{ 'router-link-active': teamNavigationOwner(route.path) === item.to }" :aria-current="teamNavigationOwner(route.path) === item.to ? 'page' : undefined" @click="drawer = false">
                <component :is="item.icon" :size="19" /><span>{{ item.label }}</span><ChevronRight :size="15" />
              </RouterLink>
            </template>
          </template>
        </nav>
        <NButton v-if="canScrollDown" class="menu-more" quaternary circle aria-label="向下查看更多菜单" @click="scrollMenuDown">
          <ChevronDown :size="18" stroke-width="2.4" />
        </NButton>
      </div>
      <NButton class="logout" quaternary tag="a" :href="sidebarUtility.href" :target="sidebarUtility.target" :rel="sidebarUtility.rel"
        ><template #icon><component :is="sidebarUtility.icon" :size="18" /></template>{{ sidebarUtility.label }}</NButton
      >
    </aside>

    <Transition name="ls-backdrop">
      <div v-if="drawer" class="backdrop" aria-hidden="true" @click="drawer = false" />
    </Transition>
    <section class="workspace">
      <LsWorkspaceHeader context-label="团队工作台" :title="title" :actions="headerActions" app-navigation current-app="team" @menu="drawer = true" @action="handleHeaderAction">
        <template #actions>
          <template v-for="entry in appEntries" :key="entry.key">
            <RouterLink v-if="entry.key === 'team'" class="display-link" to="/"><component :is="appIcons[entry.key]" :size="17" /><span>{{ entry.label }}</span></RouterLink>
            <a v-else class="display-link" :href="entry.href"><component :is="appIcons[entry.key]" :size="17" /><span>{{ entry.label }}</span></a>
          </template>
        </template>
      </LsWorkspaceHeader>
      <main id="workspace"><slot /></main>
      <nav class="bottom-nav" aria-label="移动端导航">
        <template v-for="item in bottomPrimary" :key="item.to">
          <RouterLink :to="item.to">
            <component :is="item.icon" :size="20" /><span>{{ item.label }}</span>
          </RouterLink>
        </template>
        <NButton quaternary @click="drawer = true"
          ><template #icon><Menu :size="20" /></template><span>更多</span></NButton
        >
      </nav>
    </section>
  </div>
</template>

<style scoped>
.team-shell {
  min-height: 100dvh;
  background: var(--cloud);
}
.skip {
  position: fixed;
  left: 1rem;
  top: -4rem;
  z-index: 100;
  padding: 0.7rem 1rem;
  background: var(--surface);
}
.skip:focus {
  top: 1rem;
}
.sidebar {
  position: fixed;
  z-index: var(--z-modal);
  inset: 0 auto 0 0;
  width: min(86vw, 320px);
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--sky-void);
  color: white;
  transform: translateX(-101%);
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.sidebar.open {
  transform: translateX(0);
}
.sidebar-head {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-head button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: white;
  background: transparent;
  border: 0;
}
.wordmark {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
}
.wordmark strong {
  font-family: 'Barlow Condensed';
  font-size: 1.45rem;
}
.wordmark span {
  color: oklch(0.68 0.015 210);
  font-size: 0.68rem;
}
.menu-scroll {
  position: relative;
  min-height: 0;
  flex: 1;
}
.sidebar nav {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklch, var(--sky-lost), white 18%) transparent;
}
.menu-scroll.has-more::after {
  content: '';
  position: absolute;
  z-index: 1;
  inset: auto 0 0;
  height: 72px;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--sky-void) 82%);
}
.menu-scroll.has-more nav {
  padding-bottom: 3.25rem;
}
.menu-more {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 0.4rem;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  color: oklch(0.82 0.14 185);
  background: color-mix(in oklch, var(--sky-void), var(--sky-lost) 18%);
  border: 1px solid color-mix(in oklch, var(--sky-lost), white 16%);
  border-radius: 50%;
  transform: translateX(-50%);
  cursor: pointer;
}
nav p {
  margin: 1.35rem 0.65rem 0.45rem;
  color: var(--sky-lost);
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}
.sidebar nav a {
  width: 100%;
  min-height: 44px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  color: oklch(0.76 0.012 210);
  background: transparent;
  border: 0;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: left;
}
.sidebar nav a:hover,
.sidebar nav a.router-link-active {
  color: white;
  background: color-mix(in oklch, var(--sky-lost), transparent 78%);
}
.sidebar nav a.router-link-active svg:last-child {
  color: var(--afterglow);
}
.logout {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.55rem;
  margin-top: auto;
  padding: 0 0.65rem;
  color: oklch(0.72 0.012 210);
  background: transparent;
  border: 0;
}
.backdrop {
  position: fixed;
  z-index: var(--z-backdrop);
  inset: 0;
  background: oklch(0.06 0 0/0.66);
}
.workspace {
  min-height: 100dvh;
  padding-bottom: 72px;
}
.topbar {
  height: 68px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) repeat(3, 44px);
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}
.topbar > button,
.topbar > a {
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-ink);
  background: transparent;
  border: 0;
  border-radius: 8px;
}
.topbar > a:hover {
  color: var(--sky-lost-strong);
  background: var(--cloud);
}
.topbar div {
  min-width: 0;
}
.topbar p {
  margin: 0;
  color: var(--sky-lost-strong);
  font-family: 'Barlow Condensed';
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.topbar h1 {
  margin: 0;
  font-size: 1.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.workspace main {
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
}
.bottom-nav {
  position: fixed;
  z-index: var(--z-sticky);
  inset: auto 0 0;
  min-height: 64px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
  border-top: 1px solid var(--line);
}
.bottom-nav a,
.bottom-nav button {
  min-width: 0;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  color: var(--muted-ink);
  background: transparent;
  border: 0;
  font-size: 0.65rem;
}
.bottom-nav a.router-link-active {
  color: var(--sky-lost-strong);
}
.sidebar {
  transition-duration: var(--motion-slow);
  transition-timing-function: var(--ease-out);
}
.sidebar nav a {
  transition:
    color var(--motion-fast) var(--ease-standard),
    background-color var(--motion-fast) var(--ease-standard);
}
@media (min-width: 900px) {
  .team-shell {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
  }
  .sidebar {
    position: sticky;
    top: 0;
    width: 248px;
    height: 100dvh;
    transform: none;
  }
  .sidebar-head button {
    display: none;
  }
  .workspace {
    padding-bottom: 0;
  }
  .topbar {
    grid-template-columns: 1fr auto auto 44px;
    height: 72px;
    padding-inline: 1.5rem;
  }
  .topbar > button {
    display: none;
  }
  .topbar div {
    grid-column: 1;
  }
  .workspace main {
    padding: 1.5rem;
  }
  .bottom-nav {
    display: none;
  }
}
</style>
