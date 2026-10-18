<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from "@lostsky/api/client";
import { quantityScaleForStep } from "@lostsky/shared/quantity";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useQuery } from "@tanstack/vue-query";
import { Gift } from "@lucide/vue";
import { NPagination, NSelect } from "naive-ui";
import { computed, reactive } from "vue";

import { customerName, dateTime, entityName, serviceStatusCode, serviceStatusName } from "../lib";
import type { Pagination, ServiceRedemption } from "../types";

const routeAccess = useRouteAccess();

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
  enabled: computed(() => !routeAccess.restricted.value),
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
const rowStatus = (row: ServiceRedemption) => serviceStatusCode(row.status_code ?? row.status);
const statusType = (value: unknown) =>
  serviceStatusCode(value) === 3 ? "success" : serviceStatusCode(value) === 2 ? "warning" : "default";
</script>
<template>
  <div class="redemptions-view">
    <LsObjectDirectory title="权益核销" description="接单人员查看自己的任务；管理人员处理改派、取消审批与确认完成。">
      <template #actions>
        <LsPageLink :icon="Gift" label="赋予顾客权益" to="/entitlements/new" />
      </template>
      <template #toolbar>
        <LsListToolbar embedded
      v-model="filters.keyword"
      placeholder="搜索权益或顾客"
      aria-label="搜索权益核销"
      :count-label="routeAccess.restricted.value ? '0 个权益实例' : `${query.data.value?.total ?? 0} 个权益实例`"
      @update:model-value="filters.page = 1"
      >
          <template #filters
        >
            <NSelect
            v-model:value="filters.status"
            :options="statuses"
            clearable
            placeholder="全部状态"
            @update:value="filters.page = 1" />
          </template>
        </LsListToolbar
    >
      </template>
      <LsAsyncState
      v-if="!routeAccess.restricted.value && query.isError.value"
      state="error"
      title="无法读取核销"
      :description="friendlyError(query.error.value)"
      />
      <LsAsyncState
      v-else-if="!routeAccess.restricted.value && query.isPending.value"
      state="loading"
      :rows="6"
      />
      <LsEmptyState :source="query.data.value"
      v-else-if="routeAccess.restricted.value || !rows.length"
      :title="
      routeAccess.restricted.value ? '没有可显示的权益' : filters.keyword || filters.status
      ? '没有匹配的权益'
      : '没有待处理的权益'
      "
      :description="filters.keyword || filters.status
      ? '调整搜索或状态筛选后再试。'
      : '顾客发起核销后，任务会出现在这里。'
      "
      />
      <LsResourceList v-else aria-label="权益核销列表">
        <LsResourceRow v-for="row in rows" :key="row.id" :title="row.service.name" :to="`/services/${row.id}`" :description="`权益实例 #${row.id} · 顾客 ${customerName(row.customer, row.customer_id)} · 接单人 ${entityName(row.handler, row.handler_entity_id)}`">
          <template #status><LsStatusTag :label="serviceStatusName(rowStatus(row))" :type="statusType(rowStatus(row))" /></template>
          <template #metadata><span>履约 {{ Number(row.quantity).toFixed(quantityScaleForStep(row.entitlement?.quantity_step)) }} {{ row.entitlement?.unit_name || '单位' }}</span><span>发起于 {{ dateTime(row.started_at) }}</span></template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value?.total" #pagination>
        <span>第 {{ filters.page }} / {{ pages }} 页</span
        >
        <NPagination v-model:page="filters.page" :page-count="pages" />
      </template>
    </LsObjectDirectory>
  </div>
</template>
