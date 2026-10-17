<script setup lang="ts">
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { CircleDollarSign } from '@lucide/vue'
import { NPagination } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import { balanceLogType, customerName, dateTime, money } from '../lib'
import type { BalanceLog, Pagination, TransactionOptions } from '../types'

const route = useRoute()
const routeAccess = useRouteAccess()
const customerId = computed(() => Number(route.query.customer_id || 0))
const page = ref(1)
const options = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options'), enabled: computed(() => !routeAccess.restricted.value) })
const customer = computed(() => (options.data.value?.customers ?? []).find(item => Number(item.id) === customerId.value))
const query = useQuery({
  queryKey: computed(() => ['balance-logs', customerId.value, page.value]),
  queryFn: () => api.get<Pagination<BalanceLog>>('/transaction/balance/logs', { customer_id: customerId.value, page: page.value, limit: 20 }),
  enabled: computed(() => customerId.value > 0 && !routeAccess.restricted.value),
})
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)))
const columns: DataTableColumns<BalanceLog> = [
  { title: '时间', key: 'create_time', render: row => dateTime(row.create_time) },
  { title: '类型', key: 'type', render: row => balanceLogType(row.type) },
  { title: '金额', key: 'amount', render: row => h('strong', { class: Number(row.amount) >= 0 ? 'amount-positive' : 'amount-negative' }, `${Number(row.amount) >= 0 ? '+' : ''}${money(row.amount)}`) },
  { title: '变动后余额', key: 'balance_after', render: row => h('span', { class: 'ls-tabular' }, money(row.balance_after)) },
  { title: '备注', key: 'memo', render: row => row.memo || '—' },
]
</script>

<template>
    <LsDetailPage :title="routeAccess.restricted.value || !customerId ? '顾客余额明细' : `${customerName(customer, customerId)}的余额明细`" description="按发生时间查看充值、消费、退款和手动调整。" back-to="/balances" back-label="返回顾客余额" aside-label="顾客余额账户">
      <template #actions>
        <LsPageLink :icon="CircleDollarSign" label="为该顾客充值" :to="`/recharge?customer_id=${customerId}`" />
      </template>
      <LsInlineError v-if="!customerId && !routeAccess.restricted.value" message="缺少顾客 ID。" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取余额明细" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" :title="routeAccess.restricted.value ? '没有可显示的余额变动' : '还没有余额变动'" description="充值或使用预存款后，记录会出现在这里。" />
      <LsResponsiveDataTable v-else :columns="columns" :data="query.data.value.list" :row-key="row => Number(row.id)" :scroll-x="700">
        <template #mobile-title="{ row }">{{ dateTime(row.create_time) }} · {{ balanceLogType(row.type) }}</template>
        <template #mobile="{ row }">
          <dl>
            <dt>金额</dt>
            <dd :class="Number(row.amount) >= 0 ? 'amount-positive' : 'amount-negative'">{{ Number(row.amount) >= 0 ? '+' : '' }}{{ money(row.amount) }}</dd>
            <dt>变动后余额</dt>
            <dd class="ls-tabular">{{ money(row.balance_after) }}</dd>
            <dt>备注</dt>
            <dd>{{ row.memo || '—' }}</dd>
          </dl>
        </template>
      </LsResponsiveDataTable>
      <div v-if="!routeAccess.restricted.value && query.data.value?.total" class="balance-log-pagination">
        <span>共 {{ query.data.value.total }} 条</span>
        <NPagination v-model:page="page" :page-count="pages" />
      </div>
      <template #aside>
        <LsPanel>
          <div class="balance-context">
            <LsSectionHeader title="顾客账户" description="当前余额与累计收支，供核对变动记录。" />
            <template v-if="routeAccess.restricted.value">
              <LsDescriptionList><dt>顾客</dt><dd>-</dd><dt>可用余额</dt><dd>-</dd><dt>累计充值</dt><dd>-</dd><dt>累计消费</dt><dd>-</dd></LsDescriptionList>
            </template>
            <p v-else-if="!customerId" class="balance-context-note">请从顾客余额列表选择需要查看的顾客。</p>
            <LsAsyncState v-else-if="options.isPending.value" state="loading" :rows="3" />
            <LsAsyncState v-else-if="options.isError.value" state="error" title="暂时无法读取顾客账户" :description="friendlyError(options.error.value)" />
            <template v-else-if="customer">
              <LsEntityIdentity type="teamCustomer" :name="customerName(customer, customerId)" />
              <LsDescriptionList>
                <dt>可用余额</dt><dd class="ls-tabular">{{ customer.balance ? money(customer.balance.balance) : '-' }}</dd>
                <dt>累计充值</dt><dd class="ls-tabular">{{ customer.balance ? money(customer.balance.recharged) : '-' }}</dd>
                <dt>累计消费</dt><dd class="ls-tabular">{{ customer.balance ? money(customer.balance.spent) : '-' }}</dd>
              </LsDescriptionList>
            </template>
            <p v-else class="balance-context-note">当前没有可显示的顾客账户资料。</p>
          </div>
        </LsPanel>
      </template>
    </LsDetailPage>
</template>

<style scoped>
.balance-context { min-width: 0; display: grid; gap: 1rem; }
.balance-context-note { margin: 0; color: var(--muted-ink); }
.balance-log-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }
</style>
