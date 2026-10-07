<script setup lang="ts">
import { identityUrl, workspaceAppEntries } from "@lostsky/shared/navigation";
import LsPage from "@lostsky/ui/components/LsPage.vue";
import LsWorkspaceHeader from "@lostsky/ui/components/LsWorkspaceHeader.vue";
import {
  ChevronRight,
  House,
  MessageCircleMore,
  Radio,
  ReceiptText,
  ShoppingBag, UserRound,
  Store,
  X,
} from "@lucide/vue";
import { NButton } from "naive-ui";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const appIcons = { team: House, shop: Store, transaction: ReceiptText, chat: MessageCircleMore, community: MessageCircleMore, weibo: Radio }
const route = useRoute();
const router = useRouter();
const drawer = ref(false);
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
  return workspaceAppEntries({ personal });
});
const headerActions = computed(() => appEntries.value.map(({ key, label, disabled, reason }) => ({ key, label, disabled, reason })));
const title = computed(() => String(route.meta.title ?? "商城管理"));
const width = computed<"wide" | "content" | "form">(() =>
  ["content", "form"].includes(String(route.meta.width))
    ? (route.meta.width as "content" | "form")
    : "wide",
);
function handleHeaderAction(key: string) {
  const entry = appEntries.value.find(item => item.key === key);
  if (!entry || entry.disabled) return;
  if (entry.key === 'shop') void router.push('/manage');
  else window.location.href = entry.href;
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
        <p>{{ activeWorkspace === 'personal' ? '当前人员' : '销售与履约' }}</p>
        <template v-for="item in currentNav" :key="item.to">
          <RouterLink
          :to="item.to"
          @click="drawer = false"
          ><component :is="item.icon" :size="19" /><span>{{ item.label }}</span
          ><ChevronRight :size="15"
        /></RouterLink>
        </template>
      </nav>
      <NButton class="logout" quaternary tag="a" :href="identityUrl()"
        ><template #icon><UserRound :size="18" /></template>切换身份</NButton
      >
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
        context-label="商品工作台"
        :title="title"
        :actions="headerActions"
        app-navigation
        @menu="drawer = true"
        @action="handleHeaderAction"
      >
        <template #actions>
          <template v-for="entry in appEntries" :key="entry.key">
            <RouterLink v-if="entry.key === 'shop'" class="manage-app-link" to="/manage"><component :is="appIcons[entry.key]" :size="17" /><span>{{ entry.label }}</span></RouterLink>
            <a v-else class="manage-app-link" :href="entry.href"><component :is="appIcons[entry.key]" :size="17" /><span>{{ entry.label }}</span></a>
          </template>
        </template>
      </LsWorkspaceHeader>
      <LsPage id="shop-manage-main" as="main" :width="width"><div class="manage-page-content"><slot /></div></LsPage>
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
.manage-sidebar nav a {
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
  text-align: left;
}
.manage-sidebar nav a:hover,
.manage-sidebar nav a.router-link-active {
  color: white;
  background: color-mix(in oklch, var(--sky-lost), transparent 78%);
}
.manage-sidebar nav a.router-link-active svg:last-child {
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
  color: oklch(0.76 0.012 210);
  background: transparent;
  border: 0;
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
.manage-page-content {
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
  .manage-page-content {
    padding: 1.75rem;
  }
}
</style>
