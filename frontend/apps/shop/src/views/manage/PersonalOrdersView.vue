<script setup lang="ts">
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { formatDate, formatMoney, manageApi } from '../../lib'

const page = ref(1)
const statusFilter = ref<number | null>(null)
const routeAccess = useRouteAccess()
const query = useQuery({
  queryKey: computed(() => ['personal-orders', page.value, statusFilter.value]),
  queryFn: () => manageApi.personalOrders({ page: page.value, limit: 20, status: statusFilter.value ?? undefined }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)))
const status = (value: number) => ({ 1: '处理中', 2: '已完成', 3: '已取消' })[value] ?? '未知'
</script>

<template>
  <div class="personal-orders">
    <LsObjectDirectory title="我的业务订单" description="只显示当前人员接单或发单的订单。">
      <template #toolbar>
        <LsListToolbar embedded :searchable="false">
          <template #filters>
            <NSelect v-model:value="statusFilter" :options="[{label:'处理中',value:1},{label:'已完成',value:2},{label:'已取消',value:3}]" clearable placeholder="全部状态" @update:value="page=1" />
          </template>
        </LsListToolbar>
      </template>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6"/>
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取订单" :description="friendlyError(query.error.value)"/>
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" :title="routeAccess.restricted.value ? '没有可显示的业务订单' : '暂无相关业务订单'" description="当前人员成为订单的接单人或发单人后，会显示在这里。"/>
      <LsResourceList v-else aria-label="我的业务订单">
        <LsResourceRow v-for="order in query.data.value.list" :key="order.id" :title="order.product_name">
          <template #status>
            <LsStatusTag :label="status(order.status)" :type="order.status === 2 ? 'success' : order.status === 3 ? 'default' : 'warning'" />
          </template>
          <template #metadata>
            <span>#{{ order.id }}</span>
            <time>{{ formatDate(order.create_time) }}</time>
            <strong>{{ formatMoney(order.total_price) }}</strong>
          </template>
        </LsResourceRow>
      </LsResourceList>
      <template v-if="query.data.value?.total" #pagination>
        <span>共 {{ query.data.value.total }} 条</span>
        <NPagination v-model:page="page" :page-count="pages"/>
      </template>
    </LsObjectDirectory>
  </div>
</template>
