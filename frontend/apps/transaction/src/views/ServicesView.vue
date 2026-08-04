<script setup lang="ts">
import { api, friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsEntityIdentity from "@lostsky/ui/components/LsEntityIdentity.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsResponsiveDataTable from "@lostsky/ui/components/LsResponsiveDataTable.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useQuery } from "@tanstack/vue-query";
import { NPagination, NSelect } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { computed, h, reactive } from "vue";
import { RouterLink } from "vue-router";
import { customerName, dateTime, entityName } from "../lib";
import type { Pagination, ServiceRedemption } from "../types";

const filters = reactive({
  keyword: "",
  status: null as number | null,
  page: 1,
  limit: 20,
});
const params = computed(() => ({
  keyword: filters.keyword.trim() || undefined,
  page: filters.page,
  limit: filters.limit,
  status: filters.status ?? undefined,
}));
const query = useQuery({
  queryKey: computed(() => ["service-redemptions", params.value]),
  queryFn: () =>
    api.get<Pagination<ServiceRedemption>>("/service", params.value),
});
const rows = computed(() => query.data.value?.list ?? []);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / filters.limit)),
);
const statuses = [
  { label: "未核销", value: 1 },
  { label: "核销中", value: 2 },
  { label: "已核销", value: 3 },
];
const statusName = (value: number) =>
  statuses.find((item) => item.value === value)?.label ?? "未知";
const statusType = (value: number) =>
  value === 3 ? "success" : value === 2 ? "warning" : "default";
const columns: DataTableColumns<ServiceRedemption> = [
  {
    title: "服务",
    key: "service",
    render: (r) =>
      h(
        RouterLink,
        { to: `/services/${r.id}`, class: "service-cell" },
        {
          default: () => [
            h("strong", r.service.name),
            h("small", `实例 #${r.id}`),
          ],
        },
      ),
  },
  {
    title: "客户",
    key: "customer",
    render: (r) =>
      h(LsEntityIdentity, {
        type: "customer",
        name: customerName(r.customer, r.customer_id),
        slug: String((r.customer as any)?.slug ?? ""),
        imageUrl: (r.customer as any)?.avatar ?? null,
        size: "sm",
      }),
  },
  {
    title: "接单人",
    key: "handler",
    render: (r) =>
      h(LsEntityIdentity, {
        type: (r.handler as any)?.type ?? "entity",
        name: entityName(r.handler, r.handler_entity_id),
        slug: String((r.handler as any)?.slug ?? ""),
        imageUrl: (r.handler as any)?.avatar ?? null,
        size: "sm",
      }),
  },
  {
    title: "发起时间",
    key: "started_at",
    render: (r) => dateTime(r.started_at),
  },
  {
    title: "状态",
    key: "status",
    render: (r) =>
      h(LsStatusTag, {
        label: statusName(r.status),
        type: statusType(r.status) as any,
      }),
  },
  {
    title: "操作",
    key: "action",
    render: (r) =>
      h(RouterLink, { to: `/services/${r.id}` }, { default: () => "查看任务" }),
  },
];
</script>
<template>
  <div class="redemptions-view">
    <LsPageHeader
      title="服务核销"
      description="接单 Entity 查看自己的任务；管理 Entity 处理改派、取消审批与确认完成。"
    /><LsListToolbar
      v-model="filters.keyword"
      placeholder="搜索服务或客户"
      aria-label="搜索服务核销"
      :count-label="`${query.data.value?.total ?? 0} 个服务实例`"
      @update:model-value="filters.page = 1"
      ><template #filters
        ><NSelect
          v-model:value="filters.status"
          :options="statuses"
          clearable
          placeholder="全部状态"
          @update:value="filters.page = 1" /></template></LsListToolbar
    ><LsAsyncState
      v-if="query.isError.value"
      state="error"
      title="无法读取核销"
      :description="friendlyError(query.error.value)"
    /><LsAsyncState
      v-else-if="query.isPending.value"
      state="loading"
      :rows="6"
    /><LsEmptyState
      v-else-if="!rows.length"
      :title="
        filters.keyword || filters.status
          ? '没有匹配的服务'
          : '没有待处理的服务'
      "
      :description="
        filters.keyword || filters.status
          ? '调整搜索或状态筛选后再试。'
          : '客户发起核销后，任务会出现在这里。'
      "
    /><LsResponsiveDataTable
      v-else
      :columns="columns"
      :data="rows"
      :row-key="(r) => r.id"
      :scroll-x="900"
      ><template #mobile-title="{ row }"
        ><RouterLink :to="`/services/${row.id}`"
          >{{ row.service.name }} · #{{ row.id }}</RouterLink
        ></template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="statusName(row.status)"
          :type="statusType(row.status)" /></template
      ><template #mobile="{ row }"
        ><dl>
          <dt>客户</dt>
          <dd>{{ customerName(row.customer, row.customer_id) }}</dd>
          <dt>接单人</dt>
          <dd>{{ entityName(row.handler, row.handler_entity_id) }}</dd>
          <dt>发起时间</dt>
          <dd>{{ dateTime(row.started_at) }}</dd>
          <dt>操作</dt>
          <dd><RouterLink :to="`/services/${row.id}`">查看任务</RouterLink></dd>
        </dl></template
      ></LsResponsiveDataTable
    >
    <div v-if="query.data.value?.total" class="pager">
      <span>第 {{ filters.page }} / {{ pages }} 页</span
      ><NPagination v-model:page="filters.page" :page-count="pages" />
    </div>
  </div>
</template>
<style scoped>
.redemptions-view {
  display: grid;
  gap: 1.25rem;
}
.redemptions-view :deep(.service-cell > *) {
  display: block;
}
.redemptions-view :deep(.service-cell small) {
  margin-top: 0.15rem;
  color: var(--muted-ink);
  font-size: 0.75rem;
}
</style>
