<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus, Unlink } from '@lucide/vue'
import { NButton } from 'naive-ui'
import PageHeader from '../components/PageHeader.vue'
import { customerName, dateTime, entityName } from '../lib'
import type { SenderBinding } from '../types'
import { computed, ref } from 'vue'

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
</script>

<template>
  <div class="bindings-view">
    <PageHeader title="发单绑定" description="绑定后，发单人可以在自己的客户范围内查询和协作。此页需要团队管理权限。">
      <template #actions><RouterLink class="primary-link" to="/binding-new"><Plus :size="18" />新增绑定</RouterLink></template>
    </PageHeader>
    <LsListToolbar v-model="search" placeholder="搜索发单人或客户" aria-label="搜索发单绑定" :count-label="`${rows.length} 条绑定`" />
    <p v-if="query.isError.value || remove.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value || remove.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <LsEmptyState v-else-if="!rows.length" :title="search ? '没有匹配的发单绑定' : '还没有发单绑定'" description="将客户绑定给负责发单的人员，便于维护客户关系。" />
    <div v-else class="table-wrap"><table class="data-table"><thead><tr><th>发单人</th><th>客户</th><th>绑定时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in rows" :key="item.id"><td>{{ entityName(item.subject, item.entity_id) }}</td><td>{{ customerName(item.customer, item.customer_id) }}</td><td>{{ dateTime(item.create_time) }}</td><td><NButton type="error" secondary @click="unbind(Number(item.id))"><template #icon><Unlink :size="16" /></template>解绑</NButton></td></tr></tbody></table></div>
  </div>
</template>

<style scoped>.bindings-view{display:grid;gap:1.25rem}</style>
