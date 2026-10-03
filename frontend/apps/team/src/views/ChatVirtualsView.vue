<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { ChevronRight, Plus, Webhook } from '@lucide/vue'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface Integration { id: number; name: string; is_active: number }
interface VirtualEntity {
  slug: string
  name: string
  description: string | null
  avatar: string | null
  is_active: number
  integrations?: Integration[]
}
const routeAccess = useRouteAccess()
const virtuals = useQuery({ queryKey: ['chat-virtuals'], queryFn: () => api.get<VirtualEntity[]>('/chatVirtual/index'), enabled: computed(() => !routeAccess.restricted.value) })
const search = ref('')
const rows = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return (virtuals.data.value ?? []).filter(item => !keyword || `${item.name} ${item.slug} ${item.description ?? ''}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
  <div class="virtual-list-page">
    <AdminPageHeader back-to="/entities" back-label="返回人员" title="虚拟人员" description="为团队建立虚拟人员，分配角色后用于业务操作与外部集成。">
      <template #actions><LsPagePrimaryAction :icon="Plus" label="创建虚拟人员" to="/chat-virtual-new" /></template>
    </AdminPageHeader>
    <LsListToolbar v-model="search" placeholder="搜索虚拟人员名称或 slug" aria-label="搜索虚拟人员" :count-label="routeAccess.restricted.value ? '0 个虚拟人员' : `${rows.length} 个虚拟人员`" />
    <p v-if="!routeAccess.restricted.value && virtuals.isError.value" class="state error" role="alert">{{ friendlyError(virtuals.error.value) }}</p>
    <div v-else-if="rows.length" class="virtual-list">
      <RouterLink v-for="item in rows" :key="item.slug" :to="{ path: '/chat-virtual', query: { slug: item.slug } }">
        <LsEntityIdentity type="teamVirtual" :name="item.name" :slug="item.slug" :image-url="item.avatar" />
        <p>{{ item.description || '还没有简介。' }}</p>
        <span class="integration-count"><Webhook :size="14" />{{ item.integrations?.length ?? 0 }} 个集成</span>
        <LsStatusTag :label="item.is_active ? '启用' : '停用'" :type="item.is_active ? 'success' : 'default'" />
        <ChevronRight :size="18" />
      </RouterLink>
    </div>
    <LsEmptyState :source="virtuals.data.value" v-else :title="routeAccess.restricted.value ? '没有可显示的虚拟人员' : '还没有虚拟人员'" description="请先创建虚拟人员。" />
  </div>
</template>

<style scoped>
.virtual-list-page{display:grid;gap:1.25rem}.virtual-list{display:grid;overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.virtual-list>a{min-width:0;min-height:80px;display:grid;grid-template-columns:minmax(13rem,1fr) minmax(10rem,1fr) auto auto 20px;align-items:center;gap:1rem;padding:.75rem 1rem;background:white;border-bottom:1px solid var(--line);transition:background-color var(--motion-fast) var(--ease-standard)}.virtual-list>a:last-child{border-bottom:0}.virtual-list>a:hover{background:var(--cloud)}.virtual-list p{min-width:0;margin:0;overflow:hidden;color:var(--muted-ink);font-size:.8rem;text-overflow:ellipsis;white-space:nowrap}.integration-count{display:flex;align-items:center;gap:.3rem;color:var(--muted-ink);font-size:.75rem}.state{padding:2rem;text-align:center;background:white;border:1px solid var(--line);border-radius:12px}.state.error{color:var(--danger)}.empty{display:grid;justify-items:center;gap:.35rem}.empty h3,.empty p{margin:0}.empty p{max-width:32rem;color:var(--muted-ink)}@media(max-width:760px){.virtual-list>a{grid-template-columns:minmax(0,1fr) auto 20px}.virtual-list p{grid-column:1/-1;grid-row:2}.integration-count{grid-column:1;grid-row:3}.virtual-list :deep(.n-tag){grid-column:2;grid-row:1}.virtual-list>a>svg{grid-column:3;grid-row:1}}
</style>
