<script setup lang="ts">
import { identityUrl, workspaceAppEntries } from "@lostsky/shared/navigation";
import LsWorkspaceHeader from "@lostsky/ui/components/LsWorkspaceHeader.vue";
import {
  ChevronRight,
  ClipboardList,
  FileClock,
  House,
  Menu,
  MessageCircleMore,
  Radio,
  ReceiptText,
  Send,
  ShieldCheck,
  Store,
  Users,
  X,
} from "@lucide/vue";
import { NButton } from "naive-ui";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const navigationPath = computed(() => route.path.startsWith('/personal/interactions/comment-presets') ? '/personal/feed' : route.path);
const router = useRouter();
const drawer = ref(false);
const personal = computed(() => route.meta.workspace === "personal");
const base = computed(() => (personal.value ? "/personal" : ""));
const nav = computed(
  () =>
    [
      [base.value || "/overview", "概览", House],
      ...(personal.value ? [["/personal/feed", "点单信息流", Radio] as const] : []),
      [`${base.value}/accounts`, "账号", Users],
      [`${base.value}/compose`, "发帖", Send],
      [`${base.value}/interactions`, "互动", MessageCircleMore],
      [`${base.value}/tasks`, "任务", ClipboardList],
      [`${base.value}/logs`, "日志", FileClock],
    ] as const,
);
const mobileNav = computed(() =>
  nav.value.filter((item) =>
    [
      base.value || "/overview",
      personal.value ? "/personal/feed" : "/accounts",
      `${base.value}/tasks`,
    ].includes(item[0]),
  ),
);
const entries = computed(() =>
  workspaceAppEntries({ personal: personal.value }),
);
const headerActions = computed(() =>
  entries.value.map(({ key, label }) => ({ key, label })),
);
function appIcon(key: string) {
  return key === "team"
    ? House
    : key === "shop"
      ? Store
      : key === "transaction"
        ? ReceiptText
        : key === "chat" || key === "community"
          ? MessageCircleMore
          : Radio;
}
function switchApp(key: string) {
  const entry = entries.value.find((item) => item.key === key);
  if (!entry) return;
  if (key === "weibo")
    void router.push(personal.value ? "/personal" : "/overview");
  else location.href = entry.href;
}
</script>
<template>
  <div class="weibo-shell">
    <a class="weibo-skip" href="#workspace">跳到主要内容</a>
    <aside :class="['weibo-sidebar', { open: drawer }]" aria-label="微博导航">
      <div class="weibo-brand">
        <RouterLink :to="base || '/overview'" @click="drawer = false"
          ><strong>LostSky</strong><span>失落青空</span></RouterLink
        >
        <NButton quaternary aria-label="关闭导航" @click="drawer = false"
          ><template #icon><X /></template
        ></NButton>
      </div>
      <nav>
        <p>工作空间</p>
        <template v-for="item in nav" :key="item[0]">
          <RouterLink :to="item[0]" :class="{ 'router-link-active': (item[0] !== (base || '/overview') && (navigationPath === item[0] || navigationPath.startsWith(`${item[0]}/`))) }" :aria-current="(item[0] !== (base || '/overview') && (navigationPath === item[0] || navigationPath.startsWith(`${item[0]}/`))) ? 'page' : undefined" @click="drawer = false">
            <component :is="item[2]" :size="19" />
            <span>{{ item[1] }}</span>
            <ChevronRight :size="15" />
          </RouterLink>
        </template>
      </nav>
      <NButton class="switch" quaternary tag="a" :href="identityUrl()"
        ><template #icon><ShieldCheck :size="18" /></template>切换身份</NButton
      >
    </aside>
    <Transition name="ls-backdrop"
      ><div
        v-if="drawer"
        class="weibo-backdrop"
        aria-hidden="true"
        @click="drawer = false"
    /></Transition>
    <section class="weibo-layout">
      <LsWorkspaceHeader
        context-label="微博工作台"
        :title="String(route.meta.title || '微博')"
        :actions="headerActions"
        app-navigation
        @menu="drawer = true"
        @action="switchApp"
      >
        <template #actions>
          <template v-for="entry in entries" :key="entry.key">
            <RouterLink
              v-if="entry.key === 'weibo'"
              class="weibo-app-link"
              :to="personal ? '/personal' : '/overview'"
              ><component :is="appIcon(entry.key)" :size="17" />{{
                entry.label
              }}</RouterLink
            >
            <a v-else class="weibo-app-link" :href="entry.href"
              ><component :is="appIcon(entry.key)" :size="17" />{{
                entry.label
              }}</a
            >
          </template>
        </template>
      </LsWorkspaceHeader>
      <div class="weibo-content">
        <slot />
      </div>
    </section>
    <nav class="weibo-bottom" aria-label="移动端主导航">
      <template v-for="item in mobileNav" :key="item[0]">
        <RouterLink :to="item[0]"
          ><component :is="item[2]" :size="19" /><span>{{
            item[1]
          }}</span></RouterLink
        >
      </template>
      <NButton quaternary aria-label="更多" @click="drawer = true"
        ><span class="weibo-bottom-item"
          ><Menu :size="19" /><span>更多</span></span
        ></NButton
      >
    </nav>
  </div>
</template>
