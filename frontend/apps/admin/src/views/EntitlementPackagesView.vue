<script setup lang="ts">
import { api, friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPagePrimaryAction from "@lostsky/ui/components/LsPagePrimaryAction.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Plus } from "@lucide/vue";
import { NPagination } from "naive-ui";
import { computed, ref } from "vue";
type Item = {
  id: number;
  name: string;
  is_active: number;
  abilities: Array<{
    ability_key: string;
    level: number;
    duration_days: number;
  }>;
};
type Page = { total: number; list: Item[] };
const search = ref("");
const page = ref(1);
const routeAccess = useRouteAccess();
const query = useQuery({
  queryKey: computed(() => [
    "admin-entitlement-packages",
    search.value,
    page.value,
  ]),
  queryFn: () =>
    api.get<Page>("/entitlements/packages", {
      keyword: search.value || undefined,
      page: page.value,
      limit: 20,
    }),
  enabled: computed(() => !routeAccess.restricted.value),
});
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)),
);
</script>
<template>
  <div class="admin-list-page">
    <LsPageHeader
      title="Ability 权益包"
      description="权益包从代码目录中的能力里选择，并设定等级和持续天数。"
      ><template #actions
        ><LsPagePrimaryAction
          :icon="Plus"
          label="创建权益包"
          to="/entitlements/packages/new" /></template></LsPageHeader
    ><LsListToolbar
      v-model="search"
      placeholder="搜索权益包"
      aria-label="搜索 Ability 权益包"
      :count-label="routeAccess.restricted.value ? '0 个权益包' : `${query.data.value?.total ?? 0} 个权益包`"
      @update:model-value="page = 1"
    /><LsAsyncState
      v-if="!routeAccess.restricted.value && query.isPending.value"
      state="loading"
      :rows="5"
    /><LsAsyncState
      v-else-if="!routeAccess.restricted.value && query.isError.value"
      state="error"
      title="暂时无法读取权益包"
      :description="friendlyError(query.error.value)"
    /><LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !query.data.value?.list.length"
      title="没有可显示的权益包"
      description="创建权益包后再配置体验活动。"
    />
    <section v-else class="entitlement-list">
      <RouterLink
        v-for="item in query.data.value.list"
        :key="item.id"
        :to="`/entitlements/packages/${item.id}`"
        ><div>
          <strong>{{ item.name }}</strong
          ><small>{{
            item.abilities
              .map(
                (a) =>
                  `${a.ability_key} Lv.${a.level} · ${a.duration_days || "永久"}${a.duration_days ? "天" : ""}`,
              )
              .join("；")
          }}</small>
        </div>
        <LsStatusTag
          :label="item.is_active ? '启用' : '停用'"
          :type="item.is_active ? 'success' : 'default'"
      /></RouterLink>
    </section>
    <div v-if="query.data.value?.total" class="pager">
      <span>第 {{ page }} / {{ pages }} 页</span
      ><NPagination v-model:page="page" :page-count="pages" />
    </div>
  </div>
</template>
<style scoped>
.admin-list-page {
  display: grid;
  gap: 1.25rem;
}
.entitlement-list {
  display: grid;
  overflow: hidden;
  background: white;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}
.entitlement-list > a {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}
.entitlement-list > a:last-child {
  border-bottom: 0;
}
.entitlement-list > a:hover {
  background: var(--cloud);
}
.entitlement-list strong,
.entitlement-list small {
  display: block;
}
.entitlement-list small {
  margin-top: 0.2rem;
  color: var(--muted-ink);
  font-size: 0.78rem;
}
</style>
