<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
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

<template><div class="personal-orders"><LsPageHeader title="我的业务订单" description="仅显示当前 Entity 作为接单人或发单人参与的订单；范围由服务端固定。"><template #actions><NSelect v-model:value="statusFilter" :options="[{label:'处理中',value:1},{label:'已完成',value:2},{label:'已取消',value:3}]" clearable placeholder="全部状态" @update:value="page=1" /></template></LsPageHeader><LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6"/><LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取订单" :description="friendlyError(query.error.value)"/><LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" :title="routeAccess.restricted.value ? '没有可显示的业务订单' : '暂无相关业务订单'" description="当前 Entity 成为订单的接单人或发单人后，会显示在这里。"/><div v-else class="order-list"><LsPanel v-for="order in query.data.value.list" :key="order.id"><div class="order"><div><small>#{{ order.id }}</small><strong>{{ order.product_name }}</strong><span>{{ formatDate(order.create_time) }}</span></div><div><strong>{{ formatMoney(order.total_price) }}</strong><LsStatusTag :label="status(order.status)" :type="order.status===2?'success':order.status===3?'default':'warning'"/></div></div></LsPanel></div><div v-if="query.data.value?.total" class="pager"><span>共 {{ query.data.value.total }} 条</span><NPagination v-model:page="page" :page-count="pages"/></div></div></template>
<style scoped>.personal-orders,.order-list{display:grid;gap:1rem}.order{display:flex;align-items:center;justify-content:space-between;gap:1rem}.order>div{display:grid;gap:.25rem}.order>div:last-child{justify-items:end}.order small,.order span{color:var(--muted-ink);font-size:.76rem}.pager{display:flex;align-items:center;justify-content:space-between;color:var(--muted-ink)}@media(max-width:560px){.order{align-items:flex-start}.pager{align-items:flex-start;flex-direction:column;gap:.75rem}}</style>
