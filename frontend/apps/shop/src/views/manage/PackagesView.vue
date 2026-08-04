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
import type { ManagePackage } from "../../types";
const keyword = ref("");
const page = ref(1);
const query = useQuery({
  queryKey: computed(() => ["manage-packages", keyword.value, page.value]),
  queryFn: () =>
    manageApi.packages({
      keyword: keyword.value || undefined,
      page: page.value,
      limit: 20,
    }),
});
const rows = computed(() => query.data.value?.list ?? []);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)),
);
const columns: DataTableColumns<ManagePackage> = [
  { title: "权益包", key: "name", render: (r) => h("strong", r.name) },
  {
    title: "包含服务",
    key: "services",
    render: (r) => `${r.services?.length ?? 0} 项`,
  },
  {
    title: "发放次数",
    key: "quantity",
    render: (r) =>
      `${(r.services ?? []).reduce((n, i) => n + Number(i.quantity), 0)} 次`,
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
        { to: `/manage/packages/${r.id}` },
        { default: () => "编辑" },
      ),
  },
];
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      title="权益包"
      description="把一个或多个服务组合成商品或卡密可交付的权益。"
      ><template #actions>
        <RouterLink
          v-if="canManage('shop.product.write')"
          v-slot="{ navigate }"
          custom
          to="/manage/packages/new"
        >
          <LsButton @click="navigate">
            <template #icon><Plus :size="18" /></template>新建权益包
          </LsButton>
        </RouterLink></template
      ></LsPageHeader
    ><LsListToolbar
      v-model="keyword"
      placeholder="搜索权益包"
      aria-label="搜索权益包"
      :count-label="`${query.data.value?.total ?? 0} 个权益包`"
      @update:model-value="page = 1"
    /><LsAsyncState
      v-if="query.isPending.value"
      state="loading"
      :rows="5"
    /><LsAsyncState
      v-else-if="query.isError.value"
      state="error"
      title="暂时无法读取权益包"
      :description="friendlyError(query.error.value)"
    /><LsEmptyState
      v-else-if="!rows.length"
      title="还没有权益包"
      description="先建立服务，再组合第一份权益包。"
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
          <dt>服务项目</dt>
          <dd>{{ row.services?.length ?? 0 }} 项</dd>
          <dt>总次数</dt>
          <dd>
            {{
              (row.services ?? []).reduce((n, i) => n + Number(i.quantity), 0)
            }}
            次
          </dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`/manage/packages/${row.id}`">编辑</RouterLink>
          </dd>
        </dl></template
      ></LsResponsiveDataTable
    >
    <div v-if="query.data.value?.total" class="pager">
      <span
        >共 {{ query.data.value.total }} 个权益包，第 {{ page }} /
        {{ pages }} 页</span
      ><NPagination v-model:page="page" :page-count="pages" />
    </div>
  </div>
</template>
