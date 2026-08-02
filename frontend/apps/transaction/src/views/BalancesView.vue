<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { customerName, money } from '../lib'
import type { TransactionOptions } from '../types'

const search = ref('')
const query = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options') })
const customers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (query.data.value?.customers ?? []).filter(item => !term || String(item.nickname ?? item.id).toLowerCase().includes(term))
})
</script>

<template>
  <div class="balances-view">
    <PageHeader title="客户余额" description="查看客户的可用预存款、累计充值与累计消费；充值和明细使用独立任务页。">
      <template #actions><RouterLink class="primary-link" to="/recharge">客户充值</RouterLink></template>
    </PageHeader>
    <LsListToolbar v-model="search" placeholder="搜索客户昵称" aria-label="搜索客户余额" :count-label="`${customers.length} 位客户`" />
    <p v-if="query.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <LsEmptyState v-else-if="!customers.length" :title="search ? '没有匹配的客户' : '还没有客户余额'" description="客户产生充值记录后，可在这里查看余额及完整变动明细。" />
    <div v-else class="table-wrap"><table class="data-table"><thead><tr><th>客户</th><th>可用余额</th><th>累计充值</th><th>累计消费</th><th>操作</th></tr></thead><tbody><tr v-for="item in customers" :key="item.id"><td>{{ customerName(item, item.id) }}</td><td class="ls-tabular amount">{{ money(item.balance?.balance) }}</td><td class="ls-tabular">{{ money(item.balance?.recharged) }}</td><td class="ls-tabular">{{ money(item.balance?.spent) }}</td><td><RouterLink :to="`/balance?customer_id=${item.id}`">查看明细</RouterLink></td></tr></tbody></table></div>
  </div>
</template>

<style scoped>.balances-view{display:grid;gap:1.25rem}.balance-search{max-width:30rem;padding:.7rem}.amount{font-weight:750}</style>
