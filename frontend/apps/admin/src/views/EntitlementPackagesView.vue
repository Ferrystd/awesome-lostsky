<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Plus, ArrowUpRight, Gift } from "@lucide/vue";
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
    <LsObjectDirectory title="Ability 权益包" description="权益包从代码目录中的能力里选择，并设定等级和持续天数。">
      <template #actions
        >
        <LsPageLink :to="'/entitlements/campaigns'" :icon="ArrowUpRight" label="兑换活动" />
        <LsPageLink
        :icon="Plus"
        label="创建权益包"
        to="/entitlements/packages/new" />
      </template>
      <template #toolbar>
        <LsListToolbar
        v-model="search"
        placeholder="搜索权益包"
        aria-label="搜索 Ability 权益包"
        :count-label="routeAccess.restricted.value ? '0 个权益包' : `${query.data.value?.total ?? 0} 个权益包`"
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
      title="暂时无法读取权益包"
      :description="friendlyError(query.error.value)"
      />
      <LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !query.data.value?.list.length"
      title="没有可显示的权益包"
      description="创建权益包后再配置体验活动。"
      />
      <LsResourceList v-else aria-label="权益包列表">
        <LsResourceRow v-for="item in query.data.value.list" :key="item.id" :title="item.name" :description="item.abilities.map((a) => `${a.ability_key} Lv.${a.level} · ${a.duration_days || '永久'}${a.duration_days ? '天' : ''}`).join('；')" :to="`/entitlements/packages/${item.id}`" :icon="Gift">
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
    </LsObjectDirectory>
  </div>
</template>
