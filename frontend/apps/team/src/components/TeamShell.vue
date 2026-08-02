<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { chatWorkspaceUrl, redirectToLogin } from '@lostsky/shared/navigation'
import { feedback } from '@lostsky/ui/feedback'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
import {
  Bell, BookOpen, Bot, Boxes, ChevronDown, ChevronRight, ExternalLink,
  FileText, Files, House, LogOut, Menu, MessageCircleMore, Send, Settings, ShieldCheck,
  Contact, UserRound, Users, X,
} from '@lucide/vue'
import { NButton } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  abilityReason,
  hasPermission,
  hasPermissionMatching,
  permissionReason,
  useTeamAccess,
} from '../lib/teamAccess'

type NavItem = {
  to: string
  label: string
  icon: typeof House
  permission?: string
  permissionPattern?: RegExp
  ability?: 'doc'
}

const route = useRoute()
const router = useRouter()
const access = useTeamAccess()
const drawer = ref(false)
const menuScroll = ref<HTMLElement | null>(null)
const canScrollDown = ref(false)

const primary: NavItem[] = [
  { to: '/', label: '概览', icon: House },
  { to: '/entities', label: '实体', icon: Boxes },
  { to: '/members', label: '成员', icon: Users },
  { to: '/customers', label: '客户', icon: Contact },
  { to: '/notices/entity', label: '通知', icon: Bell },
  { to: '/docs', label: '文档', icon: BookOpen, ability: 'doc' },
  { to: '/files', label: '文件', icon: Files, permission: 'file.read' },
  { to: '/me', label: '我的', icon: UserRound },
]
const sidebarPrimary = primary.filter(item => item.to !== '/me')
const bottomPrimary = primary.filter(item => !['/members', '/notices/entity'].includes(item.to))
const secondary: NavItem[] = [
  { to: '/fields', label: '对象字段', icon: FileText, permission: 'team.entity_field.manage' },
  { to: '/chat-virtuals', label: '虚拟实体', icon: Bot, permissionPattern: /^chat\.virtual\.(?:\*|[^.]+)\.manage$/ },
  { to: '/roles', label: '角色权限', icon: ShieldCheck, permission: 'team.role.read' },
  { to: '/join-review', label: '加入审核', icon: Users, permission: 'team.join_review.read' },
  { to: '/notices/team', label: '站内通知', icon: Bell, permission: 'team.notice.read' },
  { to: '/notices/send', label: '发送通知', icon: Send, permission: 'team.notice.send' },
  { to: '/settings', label: '团队设置', icon: Settings, permission: 'team.setting.read' },
]

const snapshot = computed(() => access.data.value)
const title = computed(() => String(route.meta.title ?? '工作台'))
const teamSlug = window.location.hostname.split('.')[0] || ''
const displayUrl = computed(() => `//${teamSlug}.display.lostsky.work`)
const chatUrl = computed(() => chatWorkspaceUrl())
const noticeTarget = '/notices/entity'
const headerActions = [
  { key: 'display', label: '查看公开主页' },
  { key: 'chat', label: '消息' },
  { key: 'notice', label: '通知' },
]

function handleHeaderAction(key: string) {
  if (key === 'display') window.open(displayUrl.value, '_blank', 'noopener,noreferrer')
  else if (key === 'chat') window.location.href = chatUrl.value
  else if (key === 'notice') void router.push(noticeTarget)
}

function disabledReason(item: NavItem): string {
  if (access.isPending.value || access.isError.value) return ''
  if (item.ability) {
    const state = snapshot.value?.abilities?.[item.ability]
    if (state && !state.enabled) return abilityReason(item.ability, state.label ?? '文档')
  }
  if (item.permission && snapshot.value?.permissions && !hasPermission(snapshot.value, item.permission)) {
    return permissionReason(item.permission)
  }
  if (item.permissionPattern && snapshot.value?.permissions && !hasPermissionMatching(snapshot.value, item.permissionPattern)) {
    return permissionReason('chat.virtual.*.manage')
  }
  return ''
}

function explain(reason: string) {
  feedback.info(reason)
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

function logout() {
  auth.clear()
  redirectToLogin()
}

onMounted(() => {
  void nextTick(updateMenuScroll)
  window.addEventListener('resize', updateMenuScroll)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateMenuScroll))
watch(
  () => [secondary.length, drawer.value],
  () => { void nextTick(updateMenuScroll) },
  { flush: 'post' },
)
</script>

<template>
  <div class="team-shell">
    <a href="#workspace" class="skip">跳到主要内容</a>
    <aside :class="['sidebar', { open: drawer }]" aria-label="团队导航">
      <div class="sidebar-head">
        <a href="/" class="wordmark"><strong>LostSky</strong><span>失落青空</span></a>
        <NButton quaternary aria-label="关闭导航" @click="drawer = false"><template #icon><X /></template></NButton>
      </div>
      <div :class="['menu-scroll', { 'has-more': canScrollDown }]">
        <nav ref="menuScroll" @scroll="updateMenuScroll">
          <p>工作空间</p>
          <template v-for="item in sidebarPrimary" :key="item.to">
            <NButton
              v-if="disabledReason(item)"
              quaternary
              class="nav-disabled"
              :aria-label="`${item.label}不可用：${disabledReason(item)}`"
              :title="disabledReason(item)"
              @click="explain(disabledReason(item))"
            >
              <component :is="item.icon" :size="19" />
              <span>{{ item.label }}</span>
              <ChevronRight :size="15" />
            </NButton>
            <RouterLink v-else :to="item.to" @click="drawer = false">
              <component :is="item.icon" :size="19" />
              <span>{{ item.label }}</span>
              <ChevronRight :size="15" />
            </RouterLink>
          </template>

          <p>管理</p>
          <template v-for="item in secondary" :key="item.to">
            <NButton
              v-if="disabledReason(item)"
              quaternary
              class="nav-disabled"
              :aria-label="`${item.label}不可用：${disabledReason(item)}`"
              :title="disabledReason(item)"
              @click="explain(disabledReason(item))"
            >
              <component :is="item.icon" :size="19" />
              <span>{{ item.label }}</span>
              <ChevronRight :size="15" />
            </NButton>
            <RouterLink v-else :to="item.to" @click="drawer = false">
              <component :is="item.icon" :size="19" />
              <span>{{ item.label }}</span>
              <ChevronRight :size="15" />
            </RouterLink>
          </template>
        </nav>
        <NButton v-if="canScrollDown" class="menu-more" quaternary circle aria-label="向下查看更多菜单" @click="scrollMenuDown">
          <ChevronDown :size="18" stroke-width="2.4" />
        </NButton>
      </div>
      <NButton class="logout" quaternary @click="logout"><template #icon><LogOut :size="18" /></template>退出登录</NButton>
    </aside>

    <Transition name="ls-backdrop">
      <div v-if="drawer" class="backdrop" aria-hidden="true" @click="drawer = false" />
    </Transition>
    <section class="workspace">
      <LsWorkspaceHeader context-label="TEAM WORKSPACE" :title="title" :actions="headerActions" @menu="drawer = true" @action="handleHeaderAction">
        <template #actions>
          <a class="display-link" :href="displayUrl" target="_blank" rel="noopener noreferrer"><ExternalLink :size="17" /><span>查看公开主页</span></a>
          <a class="chat-link" :href="chatUrl"><MessageCircleMore :size="19" /><span>消息</span></a>
          <RouterLink :to="noticeTarget"><Bell :size="19" /><span>通知</span></RouterLink>
        </template>
      </LsWorkspaceHeader>
      <main id="workspace"><slot /></main>
      <nav class="bottom-nav" aria-label="移动端导航">
        <template v-for="item in bottomPrimary" :key="item.to">
          <NButton
            v-if="disabledReason(item)"
            quaternary
            :aria-label="`${item.label}不可用：${disabledReason(item)}`"
            :title="disabledReason(item)"
            @click="explain(disabledReason(item))"
          >
            <component :is="item.icon" :size="20" /><span>{{ item.label }}</span>
          </NButton>
          <RouterLink v-else :to="item.to">
            <component :is="item.icon" :size="20" /><span>{{ item.label }}</span>
          </RouterLink>
        </template>
        <NButton quaternary @click="drawer = true"><template #icon><Menu :size="20" /></template><span>更多</span></NButton>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.team-shell{min-height:100dvh;background:var(--cloud)}.skip{position:fixed;left:1rem;top:-4rem;z-index:100;padding:.7rem 1rem;background:white}.skip:focus{top:1rem}.sidebar{position:fixed;z-index:var(--z-modal);inset:0 auto 0 0;width:min(86vw,320px);display:flex;flex-direction:column;padding:1rem;background:var(--sky-void);color:white;transform:translateX(-101%);transition:transform .22s cubic-bezier(.22,1,.36,1)}.sidebar.open{transform:translateX(0)}.sidebar-head{height:52px;display:flex;align-items:center;justify-content:space-between}.sidebar-head button{width:44px;height:44px;display:grid;place-items:center;color:white;background:transparent;border:0}.wordmark{display:flex;align-items:baseline;gap:.45rem}.wordmark strong{font-family:'Barlow Condensed';font-size:1.45rem}.wordmark span{color:oklch(.68 .015 210);font-size:.68rem}.menu-scroll{position:relative;min-height:0;flex:1}.sidebar nav{height:100%;min-height:0;overflow-y:auto;padding-right:.25rem;scrollbar-width:thin;scrollbar-color:color-mix(in oklch,var(--sky-lost),white 18%) transparent}.menu-scroll.has-more::after{content:'';position:absolute;z-index:1;inset:auto 0 0;height:72px;pointer-events:none;background:linear-gradient(to bottom,transparent,var(--sky-void) 82%)}.menu-scroll.has-more nav{padding-bottom:3.25rem}.menu-more{position:absolute;z-index:2;left:50%;bottom:.4rem;width:34px;height:34px;display:grid;place-items:center;padding:0;color:oklch(.82 .14 185);background:color-mix(in oklch,var(--sky-void),var(--sky-lost) 18%);border:1px solid color-mix(in oklch,var(--sky-lost),white 16%);border-radius:50%;transform:translateX(-50%);cursor:pointer}nav p{margin:1.35rem .65rem .45rem;color:var(--sky-lost);font-size:.7rem;font-weight:750;letter-spacing:.06em}.sidebar nav a,.sidebar nav .nav-disabled{width:100%;min-height:44px;display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:.55rem;padding:0 .65rem;color:oklch(.76 .012 210);background:transparent;border:0;border-radius:8px;font-size:.9rem;text-align:left}.sidebar nav a:hover,.sidebar nav a.router-link-active{color:white;background:color-mix(in oklch,var(--sky-lost),transparent 78%)}.sidebar nav a.router-link-active svg:last-child{color:var(--afterglow)}.sidebar nav .nav-disabled{color:oklch(.52 .012 210);cursor:not-allowed}.sidebar nav .nav-disabled:focus-visible{outline:2px solid var(--afterglow);outline-offset:-2px}.logout{min-height:44px;display:flex;align-items:center;gap:.55rem;margin-top:auto;padding:0 .65rem;color:oklch(.72 .012 210);background:transparent;border:0}.backdrop{position:fixed;z-index:var(--z-backdrop);inset:0;background:oklch(.06 0 0/.66)}.workspace{min-height:100dvh;padding-bottom:72px}.topbar{height:68px;display:grid;grid-template-columns:44px minmax(0,1fr) repeat(3,44px);align-items:center;gap:.35rem;padding:0 .75rem;background:white;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:var(--z-sticky)}.topbar>button,.topbar>a{min-width:44px;height:44px;display:flex;align-items:center;justify-content:center;color:var(--muted-ink);background:transparent;border:0;border-radius:8px}.topbar>a:hover{color:var(--sky-lost-strong);background:var(--cloud)}.topbar div{min-width:0}.topbar p{margin:0;color:var(--sky-lost-strong);font-family:'Barlow Condensed';font-size:.68rem;font-weight:700;letter-spacing:.08em}.topbar h1{margin:0;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.display-link span,.chat-link span{display:none}.workspace main{width:min(100%,90rem);margin:0 auto;padding:1rem}.bottom-nav{position:fixed;z-index:var(--z-sticky);inset:auto 0 0;min-height:64px;display:grid;grid-template-columns:repeat(6,1fr);padding-bottom:env(safe-area-inset-bottom);background:white;border-top:1px solid var(--line)}.bottom-nav a,.bottom-nav button{min-width:0;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1rem;color:var(--muted-ink);background:transparent;border:0;font-size:.65rem}.bottom-nav button[title]{opacity:.45;cursor:not-allowed}.bottom-nav a.router-link-active{color:var(--sky-lost-strong)}
.sidebar{transition-duration:var(--motion-slow);transition-timing-function:var(--ease-out)}.sidebar nav a,.sidebar nav .nav-disabled{transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}
@media(min-width:900px){.team-shell{display:grid;grid-template-columns:248px minmax(0,1fr)}.sidebar{position:sticky;top:0;width:248px;height:100dvh;transform:none}.sidebar-head button{display:none}.workspace{padding-bottom:0}.topbar{grid-template-columns:1fr auto auto 44px;height:72px;padding-inline:1.5rem}.topbar>button{display:none}.topbar div{grid-column:1}.display-link,.chat-link{gap:.4rem;padding:0 .65rem}.display-link span,.chat-link span{display:inline;font-size:.82rem;font-weight:650}.workspace main{padding:1.75rem}.bottom-nav{display:none}}
</style>
