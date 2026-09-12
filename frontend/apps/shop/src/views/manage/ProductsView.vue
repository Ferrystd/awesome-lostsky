<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPagePrimaryAction from "@lostsky/ui/components/LsPagePrimaryAction.vue";
import LsResponsiveDataTable from "@lostsky/ui/components/LsResponsiveDataTable.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Plus } from "@lucide/vue";
import { NPagination, NSelect } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { computed, h, reactive } from "vue";
import { RouterLink, useRoute } from "vue-router";
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
  ({ 1: "普通商品", 2: "套餐", 3: "卡密", 4: "核销商品" })[Number(value)] ??
  String(value);
const columns: DataTableColumns<Row> = [
  { title: "商品", key: "name", render: (r) => h("strong", r.name) },
  { title: "类型", key: "kind", render: (r) => kind(r.kind) },
  { title: "售价", key: "price", render: (r) => formatMoney(r.price) },
  {
    title: "接单人",
    key: "handlers",
    render: (r) => `${r.handlers?.length ?? 0} 位`,
  },
  {
    title: "状态",
    key: "status",
    render: (r) =>
      h(LsStatusTag, {
        label: r.is_active ? "已上架" : "已下架",
        type: r.is_active ? "success" : "default",
      }),
  },
  {
    title: "操作",
    key: "action",
    render: (r) =>
      h(
        RouterLink,
        { to: `${management.value.routeBase}/${r.id}` },
        { default: () => "编辑" },
      ),
  },
];
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      :title="personal ? '我的商品' : '商品'"
      :description="personal ? '只管理专属人员为当前身份的商品、履约方式与接单配置。' : '维护公开售卖内容、价格、履约方式与接单配置。'"
      ><template #actions>
        <LsPagePrimaryAction :icon="Plus" label="新建商品" :to="`${management.routeBase}/new`" /></template
      ></LsPageHeader
    ><LsListToolbar
      v-model="filters.keyword"
      placeholder="搜索商品名称"
      aria-label="搜索商品"
      :count-label="routeAccess.restricted.value ? '0 个商品' : `${query.data.value?.total ?? 0} 个商品`"
      @update:model-value="filters.page = 1"
      ><template #filters
        ><NSelect
          v-model:value="filters.is_active"
          :options="[
            { label: '已上架', value: 1 },
            { label: '已下架', value: 0 },
          ]"
          clearable
          placeholder="全部状态"
          @update:value="filters.page = 1" /></template></LsListToolbar
    ><LsAsyncState
      v-if="!routeAccess.restricted.value && query.isPending.value"
      state="loading"
      :rows="6"
    /><LsAsyncState
      v-else-if="!routeAccess.restricted.value && query.isError.value"
      state="error"
      title="暂时无法读取商品"
      :description="friendlyError(query.error.value)"
    /><LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !rows.length"
      :title="routeAccess.restricted.value ? '没有可显示的商品' : personal ? '还没有匹配的本人商品' : '还没有匹配的商品'"
      :description="personal ? '新建商品后会自动归属当前人员，并可在这里配置销售与履约方式。' : '新建商品后可在这里配置销售与履约方式。'"
    /><LsResponsiveDataTable
      v-else
      :columns="columns"
      :data="rows"
      :row-key="(r) => r.id"
      :scroll-x="760"
      ><template #mobile-title="{ row }">{{ row.name }}</template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="row.is_active ? '已上架' : '已下架'"
          :type="row.is_active ? 'success' : 'default'" /></template
      ><template #mobile="{ row }"
        ><dl>
          <dt>类型</dt>
          <dd>{{ kind(row.kind) }}</dd>
          <dt>售价</dt>
          <dd>{{ formatMoney(row.price) }}</dd>
          <dt>接单人</dt>
          <dd>{{ row.handlers?.length ?? 0 }} 位</dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`${management.routeBase}/${row.id}`">编辑</RouterLink>
          </dd>
        </dl></template
      ></LsResponsiveDataTable
    >
    <div v-if="query.data.value?.total" class="pager">
      <span
        >共 {{ query.data.value.total }} 个商品，第 {{ filters.page }} /
        {{ pages }} 页</span
      ><NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>
