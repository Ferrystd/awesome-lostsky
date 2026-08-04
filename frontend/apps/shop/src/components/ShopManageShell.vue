<script setup lang="ts">
import { auth } from "@lostsky/api/client";
import { redirectToLogin } from "@lostsky/shared/navigation";
import LsPage from "@lostsky/ui/components/LsPage.vue";
import LsWorkspaceHeader from "@lostsky/ui/components/LsWorkspaceHeader.vue";
import {
  Boxes,
  ChevronRight,
  ExternalLink,
  KeyRound,
  LogOut,
  PackageOpen,
  ReceiptText,
  ShoppingBag,
  X,
} from "@lucide/vue";
import { NButton } from "naive-ui";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { canManage } from "../lib";

const route = useRoute();
const drawer = ref(false);
const slug = window.location.hostname.split(".")[0] || "";
const storefront = `//${slug}.shop.lostsky.work/`;
const nav = [
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
const visibleNav = computed(() =>
  nav.filter((item) => canManage(item.permission)),
);
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
function openStorefront() {
  window.open(storefront, "_blank", "noopener,noreferrer");
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
        <RouterLink to="/manage/products" @click="drawer = false"
          ><strong>LostSky</strong><span>商城管理</span></RouterLink
        ><NButton quaternary aria-label="关闭导航" @click="drawer = false"
          ><template #icon><X /></template
        ></NButton>
      </div>
      <nav>
        <p>销售与履约</p>
        <RouterLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          @click="drawer = false"
          ><component :is="item.icon" :size="19" /><span>{{ item.label }}</span
          ><ChevronRight :size="15"
        /></RouterLink>
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
        context-label="SHOP MANAGER"
        :title="title"
        :actions="[{ key: 'storefront', label: '查看商城前台' }]"
        @menu="drawer = true"
        @action="openStorefront"
      >
        <template #actions
          ><a
            class="manage-storefront-link"
            :href="storefront"
            target="_blank"
            rel="noopener noreferrer"
            ><ExternalLink :size="17" />查看商城前台</a
          ></template
        >
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
}
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
.manage-storefront-link {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.75rem;
  color: var(--muted-ink);
  font-size: 0.82rem;
  font-weight: 650;
}
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
