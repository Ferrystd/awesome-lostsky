<script setup lang="ts">
import { formatAbilityDenied, formatPermissionDenied } from '@lostsky/api/error-format'
import { identityUrl, workspaceAppEntries } from '@lostsky/shared/navigation'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { BarChart3, BadgeCheck, ChevronRight, CircleDollarSign, Gift, Handshake, House, ListChecks, Menu, MessageCircleMore, Radio, ReceiptText, Store, UserRound, X } from '@lucide/vue'
import { NButton } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { hasWorkspacePermission, loadWorkspaceAccess, serviceRedemptionReadPermissions, workspacePermissionKeys, type WorkspaceAccess, type WorkspacePermissionRequirement } from '../lib/workspace-access'

const route = useRoute()
const router = useRouter()
const drawer = ref(false)
const teamNav = [
  ['/overview', '概览', House, null],
  ['/transactions', '团队流水', ListChecks, 'transaction.read'],
  ['/stats', '经营统计', BarChart3, 'transaction.report.read'],
  ['/services', '权益核销', BadgeCheck, serviceRedemptionReadPermissions],
  ['/balances', '顾客余额', CircleDollarSign, 'transaction.read'],
] as const
const personalNav = [
  ['/personal', '概览', House, null],
  ['/personal/transactions', '我的流水', ListChecks, null],
  ['/personal/services', '我的接单', BadgeCheck, null],
  ['/personal/customers', '我的顾客', Handshake, null],
  ['/personal/entitlements', '权益下发', Gift, null],
] as const
const access = ref<WorkspaceAccess | null>(null)
void loadWorkspaceAccess().then(value => { access.value = value }).catch(() => undefined)
const activeWorkspace = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const nav = computed(() => activeWorkspace.value === 'personal' ? personalNav : teamNav)
const mobileNav = computed(() => nav.value.slice(0, 3))
const title = computed(() => String(route.meta.title ?? '记账工作台'))
const transactionReason = computed(() => {
  if (!access.value) return '正在核对记账能力'
  const transaction = access.value.abilities?.transaction
  return transaction?.enabled ? '' : formatAbilityDenied('transaction', transaction?.label ?? '记账')
})
const appEntries = computed(() => {
  const personal = activeWorkspace.value === 'personal'
  return workspaceAppEntries({ personal, states: { transaction: { disabled: Boolean(transactionReason.value), reason: transactionReason.value } } })
})
const headerActions = computed(() => appEntries.value.map(({ key, label, disabled, reason }) => ({ key, label, disabled, reason })))
const transactionEntry = computed(() => appEntries.value.find(item => item.key === 'transaction'))
function handleHeaderAction(key: string) {
  const entry = appEntries.value.find(item => item.key === key)
  if (!entry || entry.disabled) return
  if (entry.key === 'transaction') void router.push('/')
  else window.location.href = entry.href
}
function disabledReason(permission: WorkspacePermissionRequirement | null) {
  if (!permission) return ''
  if (!access.value) return '正在核对权限'
  if (transactionReason.value) return transactionReason.value
  return hasWorkspacePermission(access.value.permissions, permission) ? '' : formatPermissionDenied(workspacePermissionKeys(permission))
}
function explain(reason: string) { feedback.info(reason) }
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
        <p>记账</p>
        <template v-for="item in nav" :key="item[0]">
          <NButton v-if="disabledReason(item[3])" quaternary class="nav-disabled" :aria-label="`${item[1]}不可用：${disabledReason(item[3])}`" :title="disabledReason(item[3])" @click="explain(disabledReason(item[3]))"><component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" /></NButton>
          <RouterLink v-else :to="item[0]" @click="drawer = false"><component :is="item[2]" :size="19" /><span>{{ item[1] }}</span><ChevronRight :size="15" /></RouterLink>
        </template>
      </nav>
      <NButton class="logout" quaternary tag="a" :href="identityUrl()"><template #icon><UserRound :size="18" /></template>切换身份</NButton>
    </aside>
    <Transition name="ls-backdrop">
      <div v-if="drawer" class="backdrop" aria-hidden="true" @click="drawer = false"></div>
    </Transition>
    <section class="workspace">
      <LsWorkspaceHeader context-label="记账工作台" :title="title" :actions="headerActions" app-navigation @menu="drawer = true" @action="handleHeaderAction">
        <template #actions>
          <a class="app-link" :href="appEntries[0]?.href"><House :size="17" /><span>团队</span></a>
          <a class="app-link" :href="appEntries[1]?.href"><Store :size="17" /><span>商品</span></a>
          <NButton
            v-if="transactionEntry?.disabled"
            class="app-link app-disabled"
            quaternary
            :title="transactionEntry.reason"
            :aria-label="`记账不可用：${transactionEntry.reason}`"
            @click="explain(transactionEntry.reason || formatAbilityDenied('transaction', '记账'))"
          ><template #icon><ReceiptText :size="17" /></template><span>记账</span></NButton>
          <RouterLink v-else class="app-link" to="/"><ReceiptText :size="17" /><span>记账</span></RouterLink>
          <a class="app-link" :href="appEntries[3]?.href"><MessageCircleMore :size="19" /><span>聊天</span></a>
          <a class="app-link" :href="appEntries[4]?.href"><Radio :size="18" /><span>微博</span></a>
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
