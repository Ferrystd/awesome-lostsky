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
import { canManage, manageApi } from "../../lib";
import type { ManageCampaign } from "../../types";
const keyword = ref("");
const page = ref(1);
const query = useQuery({
  queryKey: computed(() => ["manage-campaigns", keyword.value, page.value]),
  queryFn: () =>
    manageApi.campaigns({
      keyword: keyword.value || undefined,
      page: page.value,
      limit: 20,
    }),
});
const rows = computed(() => query.data.value?.list ?? []);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)),
);
const mode = (v: number) =>
  ({ 1: "独立卡密", 2: "公共活动码", 3: "定向卡密" })[v] ?? "未知";
const columns: DataTableColumns<ManageCampaign> = [
  { title: "活动", key: "name", render: (r) => h("strong", r.name) },
  { title: "模式", key: "mode", render: (r) => mode(Number(r.mode)) },
  {
    title: "权益包",
    key: "package",
    render: (r) => r.package?.name ?? `#${r.package_id}`,
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
      h("span", { class: "row-actions" }, [
        h(
          RouterLink,
          { to: `/manage/campaigns/${r.id}` },
          { default: () => "编辑" },
        ),
        " · ",
        h(
          RouterLink,
          { to: `/manage/campaigns/${r.id}/codes` },
          { default: () => "兑换码" },
        ),
      ]),
  },
];
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      title="卡活动"
      description="配置服务权益卡的发行模式、领取窗口和兑换码。"
      ><template #actions>
        <RouterLink
          v-if="canManage('shop.product.write')"
          v-slot="{ navigate }"
          custom
          to="/manage/campaigns/new"
        >
          <LsButton @click="navigate">
            <template #icon><Plus :size="18" /></template>新建活动
          </LsButton>
        </RouterLink></template
      ></LsPageHeader
    ><LsListToolbar
      v-model="keyword"
      placeholder="搜索活动"
      aria-label="搜索卡活动"
      :count-label="`${query.data.value?.total ?? 0} 个活动`"
      @update:model-value="page = 1"
    /><LsAsyncState
      v-if="query.isPending.value"
      state="loading"
      :rows="5"
    /><LsAsyncState
      v-else-if="query.isError.value"
      state="error"
      title="暂时无法读取活动"
      :description="friendlyError(query.error.value)"
    /><LsEmptyState
      v-else-if="!rows.length"
      title="还没有卡活动"
      description="创建活动后即可发行服务卡密。"
    /><LsResponsiveDataTable
      v-else
      :columns="columns"
      :data="rows"
      :row-key="(r) => r.id"
      :scroll-x="760"
      ><template #mobile-title="{ row }">{{ row.name }}</template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="row.is_active ? '启用' : '停用'"
          :type="row.is_active ? 'success' : 'default'" /></template
      ><template #mobile="{ row }"
        ><dl>
          <dt>模式</dt>
          <dd>{{ mode(Number(row.mode)) }}</dd>
          <dt>权益包</dt>
          <dd>{{ row.package?.name ?? `#${row.package_id}` }}</dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`/manage/campaigns/${row.id}`">编辑</RouterLink> ·
            <RouterLink :to="`/manage/campaigns/${row.id}/codes`"
              >兑换码</RouterLink
            >
          </dd>
        </dl></template
      ></LsResponsiveDataTable
    >
    <div v-if="query.data.value?.total" class="pager">
      <span
        >共 {{ query.data.value.total }} 个活动，第 {{ page }} /
        {{ pages }} 页</span
      ><NPagination v-model:page="page" :page-count="pages" />
    </div>
  </div>
</template>
