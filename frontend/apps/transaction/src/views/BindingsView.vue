<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus, Unlink } from '@lucide/vue'
import type { DataTableColumns } from 'naive-ui'
import { customerName, dateTime, entityName } from '../lib'
import type { SenderBinding } from '../types'
import { computed, h, ref } from 'vue'

const client = useQueryClient()
const query = useQuery({ queryKey: ['sender-bindings'], queryFn: () => api.get<SenderBinding[]>('/transaction/sender/all') })
const search = ref('')
const rows = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return (query.data.value ?? []).filter(item => !keyword || `${entityName(item.subject, item.entity_id)} ${customerName(item.customer, item.customer_id)}`.toLocaleLowerCase().includes(keyword)) })
const remove = useMutation({
  mutationFn: (id: number) => api.post('/transaction/sender/unbind', { id }),
  onSuccess: () => client.invalidateQueries({ queryKey: ['sender-bindings'] }),
})
function unbind(id: number) {
  if (confirm('确认解除这组发单人和客户的绑定？')) remove.mutate(id)
}
const columns: DataTableColumns<SenderBinding> = [
  { title: '发单人', key: 'subject', render: row => h(LsEntityIdentity, { type: (row.subject as any)?.type ?? 'entity', name: entityName(row.subject, row.entity_id), slug: String((row.subject as any)?.slug ?? ''), imageUrl: (row.subject as any)?.avatar ?? null, size: 'sm' }) },
  { title: '客户', key: 'customer', render: row => h(LsEntityIdentity, { type: 'customer', name: customerName(row.customer, row.customer_id), slug: String((row.customer as any)?.slug ?? ''), imageUrl: (row.customer as any)?.avatar ?? null, size: 'sm' }) },
  { title: '绑定时间', key: 'create_time', render: row => dateTime(row.create_time) },
  { title: '操作', key: 'actions', render: row => h(LsButton, { variant: 'danger', size: 'sm', onClick: () => unbind(Number(row.id)) }, { icon: () => h(Unlink, { size: 16 }), default: () => '解绑' }) },
]
</script>

<template>
  <div class="bindings-view">
    <LsPageHeader title="发单绑定" description="绑定后，发单人可以在自己的客户范围内查询和协作。此页需要团队管理权限。">
      <template #actions><RouterLink class="primary-link" to="/binding-new"><Plus :size="18" />新增绑定</RouterLink></template>
    </LsPageHeader>
    <LsListToolbar v-model="search" placeholder="搜索发单人或客户" aria-label="搜索发单绑定" :count-label="`${rows.length} 条绑定`" />
    <LsInlineError v-if="remove.isError.value" :message="friendlyError(remove.error.value)" />
    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取发单绑定" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="5" />
    <LsEmptyState v-else-if="!rows.length" :title="search ? '没有匹配的发单绑定' : '还没有发单绑定'" description="将客户绑定给负责发单的人员，便于维护客户关系。" />
    <LsResponsiveDataTable v-else :columns="columns" :data="rows" :row-key="row => Number(row.id)" :scroll-x="720">
      <template #mobile-title="{ row }">{{ entityName(row.subject, row.entity_id) }}</template>
      <template #mobile="{ row }">
        <dl>
          <dt>客户</dt><dd>{{ customerName(row.customer, row.customer_id) }}</dd>
          <dt>绑定时间</dt><dd>{{ dateTime(row.create_time) }}</dd>
          <dt>操作</dt><dd><LsButton variant="danger" size="sm" @click="unbind(Number(row.id))"><template #icon><Unlink :size="16" /></template>解绑</LsButton></dd>
        </dl>
      </template>
    </LsResponsiveDataTable>
  </div>
</template>

<style scoped>.bindings-view{display:grid;gap:1.25rem}</style>
