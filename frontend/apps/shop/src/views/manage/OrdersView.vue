<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsEntitySelect from "@lostsky/ui/components/LsEntitySelect.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Plus } from "@lucide/vue";
import { NDatePicker, NPagination, NSelect } from "naive-ui";
import { computed, reactive } from "vue";

import { formatDate, formatMoney, manageApi } from "../../lib";
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
const routeAccess = useRouteAccess();
const options = useQuery({
  queryKey: ["manage-options"],
  queryFn: manageApi.options,
  enabled: computed(() => !routeAccess.restricted.value),
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
  enabled: computed(() => !routeAccess.restricted.value),
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
</script>
<template>
  <div class="manage-page">
    <LsObjectDirectory title="订单" description="查看销售记录并处理订单完成或取消。">
      <template #actions>
        <LsPageLink :icon="Plus" label="新建订单" to="/manage/orders/new" />
      </template
      >
      <template #toolbar>
        <LsListToolbar embedded
      :searchable="false"
      :count-label="routeAccess.restricted.value ? '0 条订单' : `${query.data.value?.total ?? 0} 条订单`"
      >
          <template #filters
        >
            <NDatePicker
            v-model:value="filters.range"
            type="daterange"
            clearable
            @update:value="filters.page = 1" />
            <NSelect
            v-model:value="filters.status"
            :options="[
            { label: '处理中', value: 1 },
            { label: '已完成', value: 2 },
            { label: '已取消', value: 3 },
            ]"
            clearable
            placeholder="全部状态"
            @update:value="filters.page = 1" />
            <NSelect
            v-model:value="filters.customer_id"
            :options="customerOptions"
            filterable
            clearable
            placeholder="全部顾客"
            @update:value="filters.page = 1" />
            <LsEntitySelect
            v-model="filters.handler_entity_id"
            :entities="options.data.value?.entities ?? []"
            :loading="options.isPending.value"
            :disabled="options.isError.value"
            clearable
            placeholder="全部接单人"
            @update:model-value="filters.page = 1" />
          </template>
        </LsListToolbar
    >
      </template>
      <LsAsyncState
      v-if="!routeAccess.restricted.value && query.isPending.value"
      state="loading"
      :rows="6"
      />
      <LsAsyncState
      v-else-if="!routeAccess.restricted.value && query.isError.value"
      state="error"
      title="暂时无法读取订单"
      :description="friendlyError(query.error.value)"
      />
      <LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !rows.length"
      :title="routeAccess.restricted.value ? '没有可显示的订单' : '没有匹配的订单'"
      description="调整筛选条件，或手动创建订单。"
      />
      <LsResourceList v-else aria-label="订单列表">
        <LsResourceRow v-for="row in rows" :key="row.id" :title="row.product_name" :to="`/manage/orders/${row.id}`" :description="`#${row.id} · ${row.quantity} 件 · 顾客 ${row.customer?.nickname ?? '未关联'} · ${formatDate(row.create_time)}`">
          <template #status><LsStatusTag :label="status(row.status)" :type="tone(row.status)" /></template>
          <template #metadata><strong class="ls-tabular">{{ formatMoney(row.total_price) }}</strong></template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value?.total" #pagination>
        <span
        >共 {{ query.data.value.total }} 条订单，第 {{ filters.page }} /
        {{ pages }} 页</span
        >
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsObjectDirectory>
  </div>
</template>
