<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsEntitySelect from "@lostsky/ui/components/LsEntitySelect.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPagePrimaryAction from "@lostsky/ui/components/LsPagePrimaryAction.vue";
import LsResponsiveDataTable from "@lostsky/ui/components/LsResponsiveDataTable.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useQuery } from "@tanstack/vue-query";
import { Plus } from "@lucide/vue";
import { NDatePicker, NPagination, NSelect } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { computed, h, reactive } from "vue";
import { RouterLink } from "vue-router";
import { canManage, formatDate, formatMoney, manageApi } from "../../lib";
type Row = {
  id: number;
  product_name: string;
  quantity: number;
  total_price: string;
  status: number;
  create_time: number;
  customer?: { nickname?: string } | null;
  handler?: { name?: string } | null;
};
const filters = reactive({
  status: null as number | null,
  customer_id: null as number | null,
  handler_entity_id: null as number | null,
  range: null as [number, number] | null,
  page: 1,
  limit: 20,
});
const options = useQuery({
  queryKey: ["manage-options"],
  queryFn: manageApi.options,
});
const params = computed(() => ({
  status: filters.status ?? undefined,
  customer_id: filters.customer_id ?? undefined,
  handler_entity_id: filters.handler_entity_id ?? undefined,
  start_time: filters.range ? Math.floor(filters.range[0] / 1000) : undefined,
  end_time: filters.range
    ? Math.floor(filters.range[1] / 1000) + 86400
    : undefined,
  page: filters.page,
  limit: filters.limit,
}));
const query = useQuery({
  queryKey: computed(() => ["manage-orders", params.value]),
  queryFn: () => manageApi.orders(params.value),
});
const rows = computed(() => (query.data.value?.list ?? []) as Row[]);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)),
);
const status = (v: number) =>
  ({ 1: "处理中", 2: "已完成", 3: "已取消" })[v] ?? "未知";
const tone = (v: number) =>
  v === 2 ? "success" : v === 3 ? "default" : "warning";
const customerOptions = computed(() =>
  (options.data.value?.customers ?? []).map((c) => ({
    label: c.nickname || c.name || `顾客 #${c.id}`,
    value: c.id,
  })),
);
const columns: DataTableColumns<Row> = [
  {
    title: "订单",
    key: "product",
    render: (r) =>
      h("span", { class: "stack-cell" }, [
        h("strong", r.product_name),
        h("small", `#${r.id} · ${r.quantity} 件`),
      ]),
  },
  {
    title: "顾客",
    key: "customer",
    render: (r) => r.customer?.nickname ?? "未关联",
  },
  { title: "金额", key: "total", render: (r) => formatMoney(r.total_price) },
  { title: "创建时间", key: "time", render: (r) => formatDate(r.create_time) },
  {
    title: "状态",
    key: "status",
    render: (r) =>
      h(LsStatusTag, { label: status(r.status), type: tone(r.status) as any }),
  },
  {
    title: "操作",
    key: "action",
    render: (r) =>
      h(
        RouterLink,
        { to: `/manage/orders/${r.id}` },
        { default: () => "查看" },
      ),
  },
];
</script>
<template>
  <div class="manage-page">
    <LsPageHeader title="订单" description="查看销售记录并处理订单完成或取消。"
      ><template #actions>
        <LsPagePrimaryAction v-if="canManage('shop.order.write')" :icon="Plus" label="新建订单" to="/manage/orders/new" /></template
      ></LsPageHeader
    ><LsListToolbar
      :searchable="false"
      :count-label="`${query.data.value?.total ?? 0} 条订单`"
      ><template #filters
        ><NDatePicker
          v-model:value="filters.range"
          type="daterange"
          clearable
          @update:value="filters.page = 1" /><NSelect
          v-model:value="filters.status"
          :options="[
            { label: '处理中', value: 1 },
            { label: '已完成', value: 2 },
            { label: '已取消', value: 3 },
          ]"
          clearable
          placeholder="全部状态"
          @update:value="filters.page = 1" /><NSelect
          v-model:value="filters.customer_id"
          :options="customerOptions"
          filterable
          clearable
          placeholder="全部顾客"
          @update:value="filters.page = 1" /><LsEntitySelect
          v-model="filters.handler_entity_id"
          :entities="options.data.value?.entities ?? []"
          :loading="options.isPending.value"
          :disabled="options.isError.value"
          clearable
          placeholder="全部接单人"
          @update:model-value="filters.page = 1" /></template></LsListToolbar
    ><LsAsyncState
      v-if="query.isPending.value"
      state="loading"
      :rows="6"
    /><LsAsyncState
      v-else-if="query.isError.value"
      state="error"
      title="暂时无法读取订单"
      :description="friendlyError(query.error.value)"
    /><LsEmptyState
      v-else-if="!rows.length"
      title="没有匹配的订单"
      description="调整筛选条件，或手动创建订单。"
    /><LsResponsiveDataTable
      v-else
      :columns="columns"
      :data="rows"
      :row-key="(r) => r.id"
      :scroll-x="900"
      ><template #mobile-title="{ row }"
        >{{ row.product_name }} · #{{ row.id }}</template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="status(row.status)"
          :type="tone(row.status)" /></template
      ><template #mobile="{ row }"
        ><dl>
          <dt>数量</dt>
          <dd>{{ row.quantity }}</dd>
          <dt>顾客</dt>
          <dd>{{ row.customer?.nickname ?? "未关联" }}</dd>
          <dt>金额</dt>
          <dd>{{ formatMoney(row.total_price) }}</dd>
          <dt>时间</dt>
          <dd>{{ formatDate(row.create_time) }}</dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`/manage/orders/${row.id}`">查看</RouterLink>
          </dd>
        </dl></template
      ></LsResponsiveDataTable
    >
    <div v-if="query.data.value?.total" class="pager">
      <span
        >共 {{ query.data.value.total }} 条订单，第 {{ filters.page }} /
        {{ pages }} 页</span
      ><NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>
