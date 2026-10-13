<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { CircleDollarSign, ArrowUpRight } from '@lucide/vue'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'

import { customerName, money } from '../lib'
import type { Customer, TransactionOptions } from '../types'

const search = ref('')
const routeAccess = useRouteAccess()
const query = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options'), enabled: computed(() => !routeAccess.restricted.value) })
const customers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (query.data.value?.customers ?? []).filter(item => !term || String(item.nickname ?? item.id).toLowerCase().includes(term))
})
const columns: DataTableColumns<Customer> = [
  { title: '顾客', key: 'customer', render: row => h(LsEntityIdentity, { type: 'customer', name: customerName(row, row.id), slug: String((row as any).slug ?? ''), imageUrl: (row as any).avatar ?? null, size: 'sm' }) },
  { title: '可用余额', key: 'balance', render: row => h('strong', { class: 'ls-tabular' }, money(row.balance?.balance)) },
  { title: '累计充值', key: 'recharged', render: row => h('span', { class: 'ls-tabular' }, money(row.balance?.recharged)) },
  { title: '累计消费', key: 'spent', render: row => h('span', { class: 'ls-tabular' }, money(row.balance?.spent)) },
  { title: '操作', key: 'actions', render: row => h(LsPageLink, { to: `/balance?customer_id=${row.id}`, icon: ArrowUpRight, label: '查看明细' }) },
]
</script>

<template>
  <div class="balances-view">
    <LsCollectionPage title="顾客余额" description="查看每位顾客的可用余额、累计充值和累计消费；充值与明细在各自页面办理。">
      <template #actions>
        <LsPageLink :icon="CircleDollarSign" label="顾客充值" to="/recharge" />
      </template>
      <template #toolbar>
        <LsListToolbar v-model="search" placeholder="搜索顾客昵称" aria-label="搜索顾客余额" :count-label="routeAccess.restricted.value ? '0 位顾客' : `${customers.length} 位顾客`" />
      </template>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取顾客余额" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !customers.length" :title="routeAccess.restricted.value ? '没有可显示的顾客余额' : search ? '没有匹配的顾客' : '还没有顾客余额'" description="顾客产生充值记录后，可在这里查看余额及完整变动明细。" />
      <LsResponsiveDataTable v-else :columns="columns" :data="customers" :row-key="row => Number(row.id)" :scroll-x="720">
        <template #mobile-title="{ row }">{{ customerName(row, row.id) }}</template>
        <template #mobile="{ row }">
          <dl>
            <dt>可用余额</dt>
            <dd class="ls-tabular">
              <strong>{{ money(row.balance?.balance) }}</strong>
            </dd>
            <dt>累计充值</dt>
            <dd class="ls-tabular">{{ money(row.balance?.recharged) }}</dd>
            <dt>累计消费</dt>
            <dd class="ls-tabular">{{ money(row.balance?.spent) }}</dd>
            <dt>操作</dt>
            <dd>
              <LsPageLink :to="`/balance?customer_id=${row.id}`" :icon="ArrowUpRight" label="查看明细" />
            </dd>
          </dl>
        </template>
      </LsResponsiveDataTable>
    </LsCollectionPage>
  </div>
</template>
