<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsDirectoryIdentity from '@lostsky/ui/components/LsDirectoryIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { CircleDollarSign } from '@lucide/vue'
import { computed, ref } from 'vue'

import { customerName, money } from '../lib'
import type { TransactionOptions } from '../types'

const search = ref('')
const routeAccess = useRouteAccess()
const query = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options'), enabled: computed(() => !routeAccess.restricted.value) })
const customers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (query.data.value?.customers ?? []).filter(item => !term || String(item.nickname ?? item.id).toLowerCase().includes(term))
})
</script>

<template>
  <div class="balances-view">
    <LsObjectDirectory title="顾客余额" description="查看每位顾客的可用余额、累计充值和累计消费；充值与明细在各自页面办理。">
      <template #actions>
        <LsPageLink :icon="CircleDollarSign" label="顾客充值" to="/recharge" />
      </template>
      <template #toolbar>
        <LsListToolbar embedded v-model="search" placeholder="搜索顾客昵称" aria-label="搜索顾客余额" :count-label="routeAccess.restricted.value ? '0 位顾客' : `${customers.length} 位顾客`" />
      </template>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取顾客余额" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !customers.length" :title="routeAccess.restricted.value ? '没有可显示的顾客余额' : search ? '没有匹配的顾客' : '还没有顾客余额'" description="顾客产生充值记录后，可在这里查看余额及完整变动明细。" />
      <LsResourceList v-else aria-label="顾客余额列表">
        <LsResourceRow v-for="row in customers" :key="row.id" :to="`/balance?customer_id=${row.id}`">
          <template #identity><LsDirectoryIdentity type="customer" :name="customerName(row, row.id)" :slug="String((row as any).slug ?? '')" :image-url="(row as any).avatar ?? null">
            <template #context><span>可用 {{ money(row.balance?.balance) }} · 累计充值 {{ money(row.balance?.recharged) }} · 累计消费 {{ money(row.balance?.spent) }}</span></template>
          </LsDirectoryIdentity></template>
        </LsResourceRow>
      </LsResourceList>
    </LsObjectDirectory>
  </div>
</template>
