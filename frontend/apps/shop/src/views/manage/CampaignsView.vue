<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsListToolbar from "@lostsky/ui/components/LsListToolbar.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPagePrimaryAction from "@lostsky/ui/components/LsPagePrimaryAction.vue";
import LsResponsiveDataTable from "@lostsky/ui/components/LsResponsiveDataTable.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { useQuery } from "@tanstack/vue-query";
import { Plus } from "@lucide/vue";
import { NPagination } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { computed, h, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import ResourceOwnerTag from "../../components/ResourceOwnerTag.vue";
import { canManage, entitlementManagement } from "../../lib";
import type { ManageCampaign } from "../../types";
const keyword = ref("");
const page = ref(1);
const route = useRoute();
const scope = computed(() => route.meta.workspace === "personal" ? "personal" : "team");
const management = computed(() => entitlementManagement(scope.value));
const personal = computed(() => management.value.personal);
const query = useQuery({
  queryKey: computed(() => [scope.value, "manage-campaigns", keyword.value, page.value]),
  queryFn: () =>
    management.value.campaigns({
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
const columns = computed<DataTableColumns<ManageCampaign>>(() => [
  { title: "活动", key: "name", render: (r) => h("strong", r.name) },
  ...(!personal.value ? [{ title: "归属", key: "owner", render: (r: ManageCampaign) => h(ResourceOwnerTag, { resource: r }) }] : []),
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
          { to: `${management.value.routePrefix}/campaigns/${r.id}` },
          { default: () => "编辑" },
        ),
        " · ",
        h(
          RouterLink,
          { to: `${management.value.routePrefix}/campaigns/${r.id}/codes` },
          { default: () => "兑换码" },
        ),
      ]),
  },
]);
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      :title="personal ? '我的卡活动' : '卡活动'"
      :description="personal ? '使用本人或团队公用权益包配置卡活动，并发行自己的服务卡密。(实验性功能，使用可能造成资产损失)' : '配置服务权益卡的发行模式、领取窗口和兑换码。(实验性功能，使用可能造成资产损失)'"
      ><template #actions>
        <LsPagePrimaryAction v-if="canManage(management.permission)" :icon="Plus" label="新建活动" :to="`${management.routePrefix}/campaigns/new`" /></template
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
      :scroll-x="personal ? 760 : 880"
      ><template #mobile-title="{ row }">{{ row.name }}</template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="row.is_active ? '启用' : '停用'"
          :type="row.is_active ? 'success' : 'default'" /></template
      ><template #mobile="{ row }"
        ><dl>
          <template v-if="!personal"><dt>归属</dt><dd><ResourceOwnerTag :resource="row" /></dd></template>
          <dt>模式</dt>
          <dd>{{ mode(Number(row.mode)) }}</dd>
          <dt>权益包</dt>
          <dd>{{ row.package?.name ?? `#${row.package_id}` }}</dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`${management.routePrefix}/campaigns/${row.id}`">编辑</RouterLink> ·
            <RouterLink :to="`${management.routePrefix}/campaigns/${row.id}/codes`"
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
