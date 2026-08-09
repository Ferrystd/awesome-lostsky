<script setup lang="ts">
import { auth } from "@lostsky/api/client";
import { formatAbilityDenied, formatPermissionDenied } from "@lostsky/api/error-format";
import { chatWorkspaceUrl, redirectToLogin, shopWorkspaceUrl, teamWorkspaceUrl, transactionWorkspaceUrl } from "@lostsky/shared/navigation";
import LsPage from "@lostsky/ui/components/LsPage.vue";
import LsWorkspaceHeader from "@lostsky/ui/components/LsWorkspaceHeader.vue";
import { feedback } from "@lostsky/ui/feedback";
import {
  Boxes,
  ChevronRight,
  House,
  KeyRound,
  LogOut,
  MessageCircleMore,
  PackageOpen,
  ReceiptText,
  ShoppingBag, UserRound,
  Store,
  X,
} from "@lucide/vue";
import { NButton } from "naive-ui";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { hasManagePermission, loadManageAccess } from "../lib";
import type { ManageAccess } from "../types";

const route = useRoute();
const router = useRouter();
const drawer = ref(false);
const access = ref<ManageAccess | null>(null);
void loadManageAccess().then(value => { access.value = value }).catch(() => undefined);
const nav = [
  {
    to: "/manage",
    label: "概览",
    icon: House,
    permission: null,
  },
  {
    to: "/manage/products",
    label: "商品",
    icon: ShoppingBag,
    permission: "shop.product.read",
  },
  {
    to: "/manage/orders",
    label: "订单",
    icon: ReceiptText,
    permission: "shop.order.read",
  },
  {
    to: "/manage/services",
    label: "服务",
    icon: Boxes,
    permission: "shop.product.read",
  },
  {
    to: "/manage/packages",
    label: "权益包",
    icon: PackageOpen,
    permission: "shop.product.read",
  },
  {
    to: "/manage/campaigns",
    label: "卡活动",
    icon: KeyRound,
    permission: "shop.product.read",
  },
];
const activeWorkspace = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team');
const currentNav = computed(() => activeWorkspace.value === 'personal'
  ? [
      { to: '/manage/personal', label: '概览', icon: House, permission: null },
      { to: '/manage/personal/products', label: '我的商品', icon: ShoppingBag, permission: 'shop.product.self.manage' },
      { to: '/manage/personal/orders', label: '我的业务订单', icon: UserRound, permission: 'shop.order.read' },
    ]
  : nav);
const appEntries = computed(() => {
  const personal = activeWorkspace.value === 'personal';
  const transaction = access.value?.abilities?.transaction;
  return [
    { key: 'team', label: '团队', href: teamWorkspaceUrl(personal ? '/personal' : '/') },
    { key: 'shop', label: '商品', href: shopWorkspaceUrl('/manage') },
    { key: 'transaction', label: '记账', href: transactionWorkspaceUrl(personal ? '/personal' : '/'), disabled: !transaction?.enabled, reason: transaction ? formatAbilityDenied('transaction', transaction.label ?? '记账') : '正在核对 transaction Ability' },
    { key: 'chat', label: '聊天', href: chatWorkspaceUrl('/') },
  ];
});
const headerActions = computed(() => appEntries.value.map(({ key, label, disabled, reason }) => ({ key, label, disabled, reason })));
const transactionEntry = computed(() => appEntries.value.find(item => item.key === 'transaction'));
const title = computed(() => String(route.meta.title ?? "商城管理"));
const width = computed<"wide" | "content" | "form">(() =>
  ["content", "form"].includes(String(route.meta.width))
    ? (route.meta.width as "content" | "form")
    : "wide",
);
function logout() {
  auth.clear();
  redirectToLogin({ redirect: location.href });
}
function handleHeaderAction(key: string) {
  const entry = appEntries.value.find(item => item.key === key);
  if (!entry || entry.disabled) return;
  if (entry.key === 'shop') void router.push('/manage');
  else window.location.href = entry.href;
}
function disabledReason(permission: string | null) {
  if (!permission) return '';
  if (!access.value) return '正在核对 Permission';
  return hasManagePermission(access.value.permissions, permission) ? '' : formatPermissionDenied([permission]);
}
function explainPermission(permission: string | null) {
  feedback.info(disabledReason(permission));
}
</script>

<template>
  <div class="manage-shell">
    <a class="manage-skip" href="#shop-manage-main">跳到主要内容</a>
    <aside
      :class="['manage-sidebar', { open: drawer }]"
      aria-label="商城管理导航"
    >
      <div class="manage-brand">
        <RouterLink to="/manage" @click="drawer = false"
          ><strong>LostSky</strong><span>商城管理</span></RouterLink
        ><NButton quaternary aria-label="关闭导航" @click="drawer = false"
          ><template #icon><X /></template
        ></NButton>
      </div>
      <nav>
        <p>{{ activeWorkspace === 'personal' ? '当前 Entity' : '销售与履约' }}</p>
        <template v-for="item in currentNav" :key="item.to">
          <NButton
            v-if="disabledReason(item.permission)"
            quaternary
            class="manage-nav-disabled"
            :aria-label="`${item.label}不可用：${disabledReason(item.permission)}`"
            :title="disabledReason(item.permission)"
            @click="explainPermission(item.permission)"
          ><component :is="item.icon" :size="19" /><span>{{ item.label }}</span><ChevronRight :size="15" /></NButton>
          <RouterLink
          v-else
          :key="item.to"
          :to="item.to"
          @click="drawer = false"
          ><component :is="item.icon" :size="19" /><span>{{ item.label }}</span
          ><ChevronRight :size="15"
        /></RouterLink>
        </template>
      </nav>
      <div class="manage-side-actions">
        <NButton quaternary @click="logout"
          ><template #icon><LogOut :size="17" /></template>退出登录</NButton
        >
      </div>
    </aside>
    <Transition name="ls-backdrop"
      ><button
        v-if="drawer"
        class="manage-backdrop"
        aria-label="关闭导航"
        @click="drawer = false"
    /></Transition>
    <section class="manage-workspace">
      <LsWorkspaceHeader
        context-label="SHOP WORKSPACE"
        :title="title"
        :actions="headerActions"
        app-navigation
        @menu="drawer = true"
        @action="handleHeaderAction"
      >
        <template #actions>
          <a class="manage-app-link" :href="appEntries[0]?.href"><House :size="17" /><span>团队</span></a>
          <RouterLink class="manage-app-link" to="/manage"><Store :size="17" /><span>商品</span></RouterLink>
          <NButton
            v-if="transactionEntry?.disabled"
            class="manage-app-link manage-app-disabled"
            quaternary
            :title="transactionEntry.reason"
            :aria-label="`记账不可用：${transactionEntry.reason}`"
            @click="feedback.info(transactionEntry.reason || formatAbilityDenied('transaction', '记账'))"
          ><template #icon><ReceiptText :size="17" /></template><span>记账</span></NButton>
          <a v-else class="manage-app-link" :href="transactionEntry?.href"><ReceiptText :size="17" /><span>记账</span></a>
          <a class="manage-app-link" :href="appEntries[3]?.href"><MessageCircleMore :size="19" /><span>聊天</span></a>
        </template>
      </LsWorkspaceHeader>
      <LsPage id="shop-manage-main" as="main" :width="width"><slot /></LsPage>
    </section>
  </div>
</template>

<style scoped>
.manage-shell {
  min-height: 100dvh;
  display: grid;
  background: var(--cloud);
  color: var(--ink);
}
.manage-skip {
  position: fixed;
  left: 1rem;
  top: -5rem;
  z-index: var(--z-tooltip);
  padding: 0.7rem 1rem;
  background: white;
}
.manage-skip:focus {
  top: 1rem;
}
.manage-sidebar {
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
  transition: transform var(--motion-slow) var(--ease-out);
}
.manage-sidebar.open {
  transform: none;
}
.manage-brand {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.manage-brand a {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
}
.manage-brand strong {
  font-family: "Barlow Condensed", "PingFang SC", sans-serif;
  font-size: 1.45rem;
}
.manage-brand span {
  color: oklch(0.68 0.015 210);
  font-size: 0.68rem;
}
.manage-brand button {
  color: white;
}
.manage-sidebar nav {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklch, var(--sky-lost), white 18%) transparent;
}
.manage-sidebar nav p {
  margin: 1.35rem 0.65rem 0.45rem;
  color: var(--sky-lost);
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}
.manage-sidebar nav a,
.manage-sidebar nav .manage-nav-disabled {
  width: 100%;
  min-height: 44px;
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0 0.65rem;
  color: oklch(0.76 0.012 210);
  border-radius: 8px;
  font-size: 0.9rem;
}
.manage-sidebar nav .manage-nav-disabled { color:oklch(.52 .012 210);cursor:not-allowed }
.manage-sidebar nav .manage-nav-disabled :deep(.n-button__content){grid-column:1/-1;width:100%;display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:center;gap:.55rem}
.manage-sidebar nav a:hover,
.manage-sidebar nav a.router-link-active {
  color: white;
  background: color-mix(in oklch, var(--sky-lost), transparent 78%);
}
.manage-sidebar nav a.router-link-active svg:last-child {
  color: var(--afterglow);
}
.manage-side-actions {
  display: grid;
  gap: 0.25rem;
}
.manage-side-actions button {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.55rem;
  padding: 0 0.65rem;
  color: oklch(0.76 0.012 210);
}
.manage-backdrop {
  position: fixed;
  z-index: var(--z-backdrop);
  inset: 0;
  border: 0;
  background: oklch(0.06 0 0/0.66);
}
.manage-workspace {
  min-width: 0;
  min-height: 100dvh;
}
.manage-workspace > :deep(.ls-page) {
  min-height: 0;
  align-content: start;
  padding: 1rem;
}
.manage-app-link {
  color: var(--muted-ink);
}
.manage-app-disabled { opacity: .48; cursor: not-allowed; }
@media (min-width: 900px) {
  .manage-shell {
    grid-template-columns: 248px minmax(0, 1fr);
  }
  .manage-sidebar {
    position: sticky;
    top: 0;
    width: 248px;
    height: 100dvh;
    transform: none;
  }
  .manage-brand button {
    display: none;
  }
  .manage-workspace {
    grid-column: 2;
  }
  .manage-workspace > :deep(.ls-page) {
    padding: 1.75rem;
  }
}
</style>
