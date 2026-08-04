<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsResponsiveDataTable from "@lostsky/ui/components/LsResponsiveDataTable.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useQuery } from "@tanstack/vue-query";
import { Plus } from "@lucide/vue";
import { NPagination } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { computed, h, ref } from "vue";
import { RouterLink } from "vue-router";
import { canManage, formatMoney, manageApi } from "../../lib";
import type { ManageService } from "../../types";
const keyword = ref("");
const page = ref(1);
const query = useQuery({
  queryKey: computed(() => ["manage-services", keyword.value, page.value]),
  queryFn: () =>
    manageApi.services({
      keyword: keyword.value || undefined,
      page: page.value,
      limit: 20,
    }),
});
const rows = computed(() => query.data.value?.list ?? []);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)),
);
const columns: DataTableColumns<ManageService> = [
  { title: "服务", key: "name", render: (r) => h("strong", r.name) },
  {
    title: "默认价值",
    key: "price",
    render: (r) => formatMoney(r.default_total_price),
  },
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
        label: r.is_active ? "启用" : "停用",
        type: r.is_active ? "success" : "default",
      }),
  },
  {
    title: "操作",
    key: "action",
    render: (r) =>
      h(
        RouterLink,
        { to: `/manage/services/${r.id}` },
        { default: () => "编辑" },
      ),
  },
];
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      title="服务"
      description="定义可独立核销的服务及默认金额、分成和接单池。"
      ><template #actions>
        <RouterLink
          v-if="canManage('shop.product.write')"
          v-slot="{ navigate }"
          custom
          to="/manage/services/new"
        >
          <LsButton @click="navigate">
            <template #icon><Plus :size="18" /></template>新建服务
          </LsButton>
        </RouterLink></template
      ></LsPageHeader
    ><LsListToolbar
      v-model="keyword"
      placeholder="搜索服务名称"
      aria-label="搜索服务"
      :count-label="`${query.data.value?.total ?? 0} 个服务`"
      @update:model-value="page = 1"
    /><LsAsyncState
      v-if="query.isPending.value"
      state="loading"
      :rows="5"
    /><LsAsyncState
      v-else-if="query.isError.value"
      state="error"
      title="暂时无法读取服务"
      :description="friendlyError(query.error.value)"
    /><LsEmptyState
      v-else-if="!rows.length"
      title="还没有服务"
      description="先定义服务，再把它加入权益包。"
    /><LsResponsiveDataTable
      v-else
      :columns="columns"
      :data="rows"
      :row-key="(r) => r.id"
      :scroll-x="700"
      ><template #mobile-title="{ row }">{{ row.name }}</template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="row.is_active ? '启用' : '停用'"
          :type="row.is_active ? 'success' : 'default'" /></template
      ><template #mobile="{ row }"
        ><dl>
          <dt>默认价值</dt>
          <dd>{{ formatMoney(row.default_total_price) }}</dd>
          <dt>接单人</dt>
          <dd>{{ row.handlers?.length ?? 0 }} 位</dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`/manage/services/${row.id}`">编辑</RouterLink>
          </dd>
        </dl></template
      ></LsResponsiveDataTable
    >
    <div v-if="query.data.value?.total" class="pager">
      <span
        >共 {{ query.data.value.total }} 个服务，第 {{ page }} /
        {{ pages }} 页</span
      ><NPagination v-model:page="page" :page-count="pages" />
    </div>
  </div>
</template>
