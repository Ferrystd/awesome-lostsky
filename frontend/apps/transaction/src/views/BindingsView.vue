<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Handshake, Plus, Unlink } from '@lucide/vue'
import PageHeader from '../components/PageHeader.vue'
import { customerName, dateTime, entityName } from '../lib'
import type { SenderBinding } from '../types'

const client = useQueryClient()
const query = useQuery({ queryKey: ['sender-bindings'], queryFn: () => api.get<SenderBinding[]>('/transaction/sender/all') })
const remove = useMutation({
  mutationFn: (id: number) => api.post('/transaction/sender/unbind', { id }),
  onSuccess: () => client.invalidateQueries({ queryKey: ['sender-bindings'] }),
})
function unbind(id: number) {
  if (confirm('确认解除这组发单人和客户的绑定？')) remove.mutate(id)
}
</script>

<template>
  <div class="bindings-view">
    <PageHeader title="发单绑定" description="绑定后，发单人可以在自己的客户范围内查询和协作。此页需要团队管理权限。">
      <template #actions><RouterLink class="primary-link" to="/binding-new"><Plus :size="18" />新增绑定</RouterLink></template>
    </PageHeader>
    <p v-if="query.isError.value || remove.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value || remove.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <section v-else-if="!query.data.value?.length" class="empty"><Handshake :size="34" /><h3>还没有发单绑定</h3><p>将客户绑定给负责发单的人员，便于维护客户关系。</p></section>
    <div v-else class="table-wrap"><table class="data-table"><thead><tr><th>发单人</th><th>客户</th><th>绑定时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in query.data.value" :key="item.id"><td>{{ entityName(item.subject, item.entity_id) }}</td><td>{{ customerName(item.customer, item.customer_id) }}</td><td>{{ dateTime(item.create_time) }}</td><td><button class="unlink" type="button" @click="unbind(Number(item.id))"><Unlink :size="16" />解绑</button></td></tr></tbody></table></div>
  </div>
</template>

<style scoped>.bindings-view{display:grid;gap:1.25rem}.unlink{min-height:40px;display:inline-flex;align-items:center;gap:.35rem;padding:0 .65rem;border:0;border-radius:8px;color:var(--danger);background:transparent;font-weight:650}.unlink:hover{background:color-mix(in oklch,var(--danger),white 92%)}</style>
