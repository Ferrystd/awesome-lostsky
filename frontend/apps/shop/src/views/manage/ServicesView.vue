<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsEntityTag from "@lostsky/ui/components/LsEntityTag.vue";
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
import { canManage, entitlementManagement, formatMoney } from "../../lib";
import type { ManageService } from "../../types";
import type { EntityType } from "@lostsky/ui/entity";
const keyword = ref("");
const page = ref(1);
const route = useRoute();
const scope = computed(() => route.meta.workspace === "personal" ? "personal" : "team");
const management = computed(() => entitlementManagement(scope.value));
const personal = computed(() => management.value.personal);
const query = useQuery({
  queryKey: computed(() => [scope.value, "manage-services", keyword.value, page.value]),
  queryFn: () =>
    management.value.services({
      keyword: keyword.value || undefined,
      page: page.value,
      limit: 20,
    }),
});
const rows = computed(() => query.data.value?.list ?? []);
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)),
);
const handlerSummary = (service: ManageService) => {
  const handlers = service.handlers ?? [];
  if (!handlers.length) return "不限";
  return handlers.map((handler) => handler.subject?.name || `Entity #${handler.entity_id}`).join("、");
};
const knownEntityTypes: EntityType[] = ["entity", "customer", "team", "virtual", "teamMember", "teamCustomer", "teamVirtual"];
const handlerType = (service: NonNullable<ManageService["handlers"]>[number]): EntityType =>
  knownEntityTypes.includes((service.subject?.type ?? service.subject?.entityable_type) as EntityType)
    ? (service.subject?.type ?? service.subject?.entityable_type) as EntityType
    : "unknown";
const visibleHandlers = (service: ManageService) => (service.handlers ?? []).slice(0, 2);
const hiddenHandlerCount = (service: ManageService) => Math.max(0, (service.handlers?.length ?? 0) - 2);
const renderHandlerTags = (service: ManageService) => h("div", {
  class: "service-handler-tags",
  title: handlerSummary(service),
}, service.handlers?.length
  ? [
      ...visibleHandlers(service).map(handler => h("span", { key: handler.entity_id, class: "service-handler-item" }, [
        h(LsEntityTag, {
          type: handlerType(handler),
          name: handler.subject?.name || `Entity #${handler.entity_id}`,
          slug: handler.subject?.slug || "",
        }),
      ])),
      hiddenHandlerCount(service) ? h("span", { class: "service-handler-count" }, [h(LsStatusTag, { label: `+${hiddenHandlerCount(service)}`, type: "info" })]) : null,
    ]
  : [h(LsStatusTag, { label: "不限", type: "info" })]);
const columns = computed<DataTableColumns<ManageService>>(() => [
  { title: "服务", key: "name", render: (r) => h("strong", r.name) },
  ...(!personal.value ? [{ title: "归属", key: "owner", render: (r: ManageService) => h(ResourceOwnerTag, { resource: r }) }] : []),
  {
    title: "默认价值",
    key: "price",
    render: (r) => formatMoney(r.default_total_price),
  },
  {
    title: "接单人",
    key: "handlers",
    width: 240,
    render: renderHandlerTags,
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
        { to: `${management.value.routePrefix}/services/${r.id}` },
        { default: () => "编辑" },
      ),
  },
]);
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      :title="personal ? '我的服务' : '服务'"
      :description="personal ? '定义当前 Entity 自己提供的服务、默认金额与接单池。' : '定义可独立核销的服务及默认金额、分成和接单池。'"
      ><template #actions>
        <LsPagePrimaryAction v-if="canManage(management.permission)" :icon="Plus" label="新建服务" :to="`${management.routePrefix}/services/new`" /></template
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
      :scroll-x="personal ? 700 : 820"
      ><template #mobile-title="{ row }">{{ row.name }}</template
      ><template #mobile-status="{ row }"
        ><LsStatusTag
          :label="row.is_active ? '启用' : '停用'"
          :type="row.is_active ? 'success' : 'default'" /></template
      ><template #mobile="{ row }"
        ><dl>
          <template v-if="!personal"><dt>归属</dt><dd><ResourceOwnerTag :resource="row" /></dd></template>
          <dt>默认价值</dt>
          <dd>{{ formatMoney(row.default_total_price) }}</dd>
          <dt>接单人</dt>
          <dd>
            <div class="service-handler-tags" :title="handlerSummary(row)">
              <template v-if="row.handlers?.length">
                <span v-for="handler in visibleHandlers(row)" :key="handler.entity_id" class="service-handler-item">
                  <LsEntityTag
                    :type="handlerType(handler)"
                    :name="handler.subject?.name || `Entity #${handler.entity_id}`"
                    :slug="handler.subject?.slug || ''"
                  />
                </span>
                <span v-if="hiddenHandlerCount(row)" class="service-handler-count"><LsStatusTag :label="`+${hiddenHandlerCount(row)}`" type="info" /></span>
              </template>
              <LsStatusTag v-else label="不限" type="info" />
            </div>
          </dd>
          <dt>操作</dt>
          <dd>
            <RouterLink :to="`${management.routePrefix}/services/${row.id}`">编辑</RouterLink>
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

<style>
.service-handler-tags{width:min(100%,220px);min-width:0;height:30px;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;overflow:hidden;white-space:nowrap}.service-handler-item{min-width:0;flex:1 1 0;overflow:hidden}.service-handler-count{flex:0 0 auto}
</style>
