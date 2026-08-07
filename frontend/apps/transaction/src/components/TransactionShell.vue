<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { chatWorkspaceUrl, redirectToLogin, shopWorkspaceUrl, teamWorkspaceUrl, transactionWorkspaceUrl } from '@lostsky/shared/navigation'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { BarChart3, BadgeCheck, ChevronRight, CircleDollarSign, Handshake, House, ListChecks, LogOut, Menu, MessageCircleMore, Plus, ReceiptText, Store, X } from '@lucide/vue'
import { NButton } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { hasWorkspacePermission, loadWorkspaceAccess, type WorkspaceAccess } from '../lib/workspace-access'

const route = useRoute()
const router = useRouter()
const drawer = ref(false)
const teamNav = [
  ['/overview', '概览', House, null],
  ['/', '流水', ListChecks, 'transaction.read'],
  ['/services', '服务核销', BadgeCheck, null],
  ['/stats', '统计', BarChart3, 'transaction.report.read'],
  ['/bindings', '发单绑定', Handshake, 'transaction.read'],
  ['/balances', '客户余额', CircleDollarSign, 'transaction.read'],
] as const
const personalNav = [
  ['/personal', '概览', House, null],
  ['/personal/transactions', '相关流水', ListChecks, 'transaction.read'],
  ['/personal/stats', '我的业绩', BarChart3, 'transaction.report.read'],
  ['/personal/services', '我的核销', BadgeCheck, null],
  ['/personal/bindings', '客户协作', Handshake, 'transaction.read'],
] as const
const access = ref<WorkspaceAccess | null>(null)
void loadWorkspaceAccess().then(value => { access.value = value }).catch(() => undefined)
const activeWorkspace = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const nav = computed(() => activeWorkspace.value === 'personal' ? personalNav : teamNav)
const mobileNav = computed(() => nav.value.slice(0, 3))
const title = computed(() => String(route.meta.title ?? '记账工作台'))
const transactionReason = computed(() => {
  if (!access.value) return '正在核对 transaction Ability'
  return access.value.abilities?.transaction?.enabled ? '' : '当前团队未启用 transaction Ability'
})
const newReason = computed(() => {
  if (!access.value) return '正在核对 Permission'
  if (transactionReason.value) return transactionReason.value
  return hasWorkspacePermission(access.value.permissions, 'transaction.write') ? '' : '缺少 transaction.write Permission'
})
const appEntries = computed(() => {
  const personal = activeWorkspace.value === 'personal'
  return [
    { key: 'team', label: '团队', href: teamWorkspaceUrl(personal ? '/personal' : '/') },
    { key: 'shop', label: '商品', href: shopWorkspaceUrl(personal ? '/manage/personal' : '/manage') },
    { key: 'transaction', label: '记账', href: transactionWorkspaceUrl('/'), disabled: Boolean(transactionReason.value), reason: transactionReason.value },
    { key: 'chat', label: '聊天', href: chatWorkspaceUrl('/') },
  ]
})
const headerActions = computed(() => appEntries.value.map(({ key, label, disabled, reason }) => ({ key, label, disabled, reason })))
const transactionEntry = computed(() => appEntries.value.find(item => item.key === 'transaction'))
function handleHeaderAction(key: string) {
  const entry = appEntries.value.find(item => item.key === key)
  if (!entry || entry.disabled) return
  if (entry.key === 'transaction') void router.push('/')
  else window.location.href = entry.href
}
function disabledReason(permission: string | null) {
  if (!permission) return ''
  if (!access.value) return '正在核对 Permission'
  if (transactionReason.value) return transactionReason.value
  return hasWorkspacePermission(access.value.permissions, permission) ? '' : `缺少 ${permission} Permission`
}
function explain(reason: string) { feedback.info(reason) }
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
        <NButton quaternary aria-label="关闭导航" @click="drawer = false"><template #icon><X /></template></NButton>
      </div>
      <nav>
        <p>TRANSACTION</p>
        <template v-for="item in nav" :key="item[0]">
          <NButton v-if="disabledReason(item[3])" quaternary class="nav-disabled" :aria-label="`${item[1]}不可用：${disabledReason(item[3])}`" :title="disabledReason(item[3])" @click="explain(disabledReason(item[3]))"><component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" /></NButton>
          <RouterLink v-else :to="item[0]" @click="drawer = false"><component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" /></RouterLink>
        </template>
      </nav>
      <NButton v-if="activeWorkspace === 'team' && newReason" quaternary class="new-entry disabled" :title="newReason" @click="explain(newReason)"><Plus :size="18" />登记流水</NButton>
      <RouterLink v-else-if="activeWorkspace === 'team'" class="new-entry" to="/new" @click="drawer = false"><Plus :size="18" />登记流水</RouterLink>
      <NButton class="logout" quaternary @click="logout"><template #icon><LogOut :size="18" /></template>退出登录</NButton>
    </aside>
    <Transition name="ls-backdrop">
      <div v-if="drawer" class="backdrop" aria-hidden="true" @click="drawer = false"></div>
    </Transition>
    <section class="workspace">
      <LsWorkspaceHeader context-label="TRANSACTION WORKSPACE" :title="title" :actions="headerActions" app-navigation @menu="drawer = true" @action="handleHeaderAction">
        <template #actions>
          <a class="app-link" :href="appEntries[0]?.href"><House :size="17" /><span>团队</span></a>
          <a class="app-link" :href="appEntries[1]?.href"><Store :size="17" /><span>商品</span></a>
          <NButton
            v-if="transactionEntry?.disabled"
            class="app-link app-disabled"
            quaternary
            :title="transactionEntry.reason"
            :aria-label="`记账不可用：${transactionEntry.reason}`"
            @click="explain(transactionEntry.reason || '当前团队未启用 transaction Ability')"
          ><template #icon><ReceiptText :size="17" /></template><span>记账</span></NButton>
          <RouterLink v-else class="app-link" to="/"><ReceiptText :size="17" /><span>记账</span></RouterLink>
          <a class="app-link" :href="appEntries[3]?.href"><MessageCircleMore :size="19" /><span>聊天</span></a>
        </template>
      </LsWorkspaceHeader>
      <slot />
      <nav class="bottom-nav" aria-label="移动端导航">
        <template v-for="item in mobileNav" :key="item[0]"><NButton v-if="disabledReason(item[3])" quaternary :title="disabledReason(item[3])" @click="explain(disabledReason(item[3]))"><component :is="item[2]" :size="20" /><span>{{ item[1] }}</span></NButton><RouterLink v-else :to="item[0]"><component :is="item[2]" :size="20" /><span>{{ item[1] }}</span></RouterLink></template>
        <NButton quaternary @click="drawer = true"><template #icon><Menu :size="20" /></template><span>更多</span></NButton>
      </nav>
    </section>
  </div>
</template>
