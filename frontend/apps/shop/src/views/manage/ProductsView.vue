<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsResourceList from "@lostsky/ui/components/LsResourceList.vue";
import LsResourceRow from "@lostsky/ui/components/LsResourceRow.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Plus, ShoppingBag } from "@lucide/vue";
import { NPagination, NSelect } from "naive-ui";
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { formatMoney, productManagement } from "../../lib";
type Row = {
  id: number;
  name: string;
  price: string;
  kind: number | string;
  is_active: number;
  handlers?: unknown[];
};
const route = useRoute();
const routeAccess = useRouteAccess();
const scope = computed(() => route.meta.workspace === "personal" ? "personal" : "team");
const management = computed(() => productManagement(scope.value));
const personal = computed(() => management.value.personal);
const filters = reactive({
  keyword: "",
  is_active: null as number | null,
  page: 1,
  limit: 20,
});
const params = computed(() => ({
  ...filters,
  keyword: filters.keyword || undefined,
  is_active: filters.is_active ?? undefined,
}));
const query = useQuery({
  queryKey: computed(() => ["manage-products", scope.value, params.value]),
  queryFn: () => management.value.products(params.value),
  enabled: computed(() => !routeAccess.restricted.value),
});
const rows = computed(() => (query.data.value?.list ?? []) as Row[]);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)),
);
const kind = (value: unknown) =>
  ({ 1: "普通商品", 2: "套餐", 3: "卡密", 4: "核销商品", 5: "多规格商品" })[Number(value)] ??
  String(value);
</script>
<template>
  <LsObjectDirectory :title="personal ? '我的商品' : '商品'" :description="personal ? '查找你可维护的商品，进入配置价格与履约方式。' : '查找商品、确认销售状态，进入维护价格与接单配置。'">
    <template #actions>
      <LsPageLink :icon="Plus" label="新建商品" :to="`${management.routeBase}/new`" />
    </template>
    <template #toolbar>
      <LsListToolbar embedded v-model="filters.keyword" placeholder="搜索商品名称" aria-label="搜索商品"
        :count-label="routeAccess.restricted.value ? '0 个商品' : `${query.data.value?.total ?? 0} 个商品`"
        @update:model-value="filters.page = 1">
        <template #filters>
          <NSelect v-model:value="filters.is_active" :options="[{ label: '已上架', value: 1 }, { label: '已下架', value: 0 }]"
            clearable placeholder="全部状态" aria-label="商品状态" @update:value="filters.page = 1" />
        </template>
      </LsListToolbar>
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取商品" :description="friendlyError(query.error.value)" />
    <LsEmptyState v-else-if="routeAccess.restricted.value || !rows.length" :source="query.data.value"
      :title="routeAccess.restricted.value ? '没有可显示的商品' : personal ? '还没有匹配的本人商品' : '还没有匹配的商品'"
      :description="personal ? '新建商品后会自动归属当前人员，并可在这里配置销售与履约方式。' : '新建商品后可在这里配置销售与履约方式。'" />
    <LsResourceList v-else aria-label="商品目录">
      <LsResourceRow v-for="row in rows" :key="row.id" :title="row.name" :icon="ShoppingBag"
        :to="`${management.routeBase}/${row.id}`"
        :description="`${kind(row.kind)} · ${kind(row.kind) === '多规格商品' ? '接单人按规格配置' : `${row.handlers?.length ?? 0} 位接单人`}`">
        <template #status><LsStatusTag :label="row.is_active ? '已上架' : '已下架'" :type="row.is_active ? 'success' : 'default'" /></template>
        <template #actions><span class="product-price">{{ kind(row.kind) === '多规格商品' ? '按规格定价' : `售价 ${formatMoney(row.price)}` }}</span></template>
      </LsResourceRow>
    </LsResourceList>
    <template v-if="query.data.value?.total" #pagination>
      <span>共 {{ query.data.value.total }} 个商品，第 {{ filters.page }} / {{ pages }} 页</span>
      <NPagination v-model:page="filters.page" :page-count="pages" />
    </template>
  </LsObjectDirectory>
</template>

<style scoped>
.product-price { color: var(--text-secondary); font-size: .875rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
</style>
