<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import { api, friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Plus, ArrowUpRight, Ticket } from "@lucide/vue";
import { NPagination } from "naive-ui";
import { computed, ref } from "vue";

type Item = {
  id: number;
  name: string;
  mode: number;
  is_active: number;
  package?: { name: string };
};
type Page = { total: number; list: Item[] };
const search = ref("");
const page = ref(1);
const routeAccess = useRouteAccess();
const query = useQuery({
  queryKey: computed(() => [
    "admin-entitlement-campaigns",
    search.value,
    page.value,
  ]),
  queryFn: () =>
    api.get<Page>("/entitlements/campaigns", {
      keyword: search.value || undefined,
      page: page.value,
      limit: 20,
    }),
  enabled: computed(() => !routeAccess.restricted.value),
});
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)),
);
const mode = (v: number) =>
  ({ 1: "独立卡密", 2: "公共活动码", 3: "定向卡密" })[v] ?? "未知";
</script>
<template>
  <div class="admin-list-page">
    <LsCollectionPage title="Ability 体验活动" description="创建平台活动、发行共享体验码，并在需要时显式查看或停用。">
      <template #actions
        >
        <LsPageLink :to="'/entitlements/packages'" :icon="ArrowUpRight" label="平台权益" />
        <LsPageLink
        :icon="Plus"
        label="创建活动"
        to="/entitlements/campaigns/new" />
      </template>
      <template #toolbar>
        <LsListToolbar
        v-model="search"
        placeholder="搜索体验活动"
        aria-label="搜索 Ability 活动"
        :count-label="routeAccess.restricted.value ? '0 个活动' : `${query.data.value?.total ?? 0} 个活动`"
        @update:model-value="page = 1"
        />
      </template>
      <LsAsyncState
      v-if="!routeAccess.restricted.value && query.isPending.value"
      state="loading"
      :rows="5"
      />
      <LsAsyncState
      v-else-if="!routeAccess.restricted.value && query.isError.value"
      state="error"
      title="暂时无法读取活动"
      :description="friendlyError(query.error.value)"
      />
      <LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !query.data.value?.list.length"
      title="没有可显示的体验活动"
      description="还没有体验活动；先创建权益包，再建立公共体验活动。"
      />
      <LsResourceList v-else aria-label="体验活动列表">
        <LsResourceRow v-for="item in query.data.value.list" :key="item.id" :title="item.name" :description="`${mode(Number(item.mode))} · ${item.package?.name || '未命名权益包'}`" :to="`/entitlements/campaigns/${item.id}`" :icon="Ticket">
          <template #status>
            <LsStatusTag :label="item.is_active ? '启用' : '停用'" :type="item.is_active ? 'success' : 'default'" />
          </template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value?.total" #pagination>
        <span>第 {{ page }} / {{ pages }} 页</span
        >
        <NPagination v-model:page="page" :page-count="pages" />
      </template>
    </LsCollectionPage>
  </div>
</template>
