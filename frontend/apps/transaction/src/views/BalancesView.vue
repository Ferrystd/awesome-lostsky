<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useQuery } from '@tanstack/vue-query'
import { CircleDollarSign } from '@lucide/vue'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { customerName, money } from '../lib'
import type { Customer, TransactionOptions } from '../types'

const search = ref('')
const query = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options') })
const customers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (query.data.value?.customers ?? []).filter(item => !term || String(item.nickname ?? item.id).toLowerCase().includes(term))
})
const columns: DataTableColumns<Customer> = [
  { title: '顾客', key: 'customer', render: row => h(LsEntityIdentity, { type: 'customer', name: customerName(row, row.id), slug: String((row as any).slug ?? ''), imageUrl: (row as any).avatar ?? null, size: 'sm' }) },
  { title: '可用余额', key: 'balance', render: row => h('strong', { class: 'ls-tabular' }, money(row.balance?.balance)) },
  { title: '累计充值', key: 'recharged', render: row => h('span', { class: 'ls-tabular' }, money(row.balance?.recharged)) },
  { title: '累计消费', key: 'spent', render: row => h('span', { class: 'ls-tabular' }, money(row.balance?.spent)) },
  { title: '操作', key: 'actions', render: row => h(RouterLink, { to: `/balance?customer_id=${row.id}` }, { default: () => '查看明细' }) },
]
</script>

<template>
  <div class="balances-view">
    <LsPageHeader title="顾客余额" description="查看顾客的可用预存款、累计充值与累计消费；充值和明细使用独立任务页。">
      <template #actions><LsPagePrimaryAction :icon="CircleDollarSign" label="顾客充值" to="/recharge" /></template>
    </LsPageHeader>
    <LsListToolbar v-model="search" placeholder="搜索顾客昵称" aria-label="搜索顾客余额" :count-label="`${customers.length} 位顾客`" />
    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取顾客余额" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="5" />
    <LsEmptyState v-else-if="!customers.length" :title="search ? '没有匹配的顾客' : '还没有顾客余额'" description="顾客产生充值记录后，可在这里查看余额及完整变动明细。" />
    <LsResponsiveDataTable v-else :columns="columns" :data="customers" :row-key="row => Number(row.id)" :scroll-x="720">
      <template #mobile-title="{ row }">{{ customerName(row, row.id) }}</template>
      <template #mobile="{ row }">
        <dl>
          <dt>可用余额</dt><dd class="ls-tabular"><strong>{{ money(row.balance?.balance) }}</strong></dd>
          <dt>累计充值</dt><dd class="ls-tabular">{{ money(row.balance?.recharged) }}</dd>
          <dt>累计消费</dt><dd class="ls-tabular">{{ money(row.balance?.spent) }}</dd>
          <dt>操作</dt><dd><RouterLink :to="`/balance?customer_id=${row.id}`">查看明细</RouterLink></dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
  </div>
</template>

<style scoped>.balances-view{display:grid;gap:1.25rem}.balance-search{max-width:30rem;padding:.7rem}.amount{font-weight:750}</style>
