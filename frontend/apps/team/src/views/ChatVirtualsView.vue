<script setup lang="ts">
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { Plus } from '@lucide/vue'
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
    <LsAsyncState v-if="!routeAccess.restricted.value && virtuals.isError.value" state="error" title="暂时无法读取虚拟人员" :description="friendlyError(virtuals.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && virtuals.isPending.value" state="loading" :rows="4" />
    <LsResourceList v-else-if="rows.length" aria-label="虚拟人员列表">
      <LsResourceRow v-for="item in rows" :key="item.slug" :to="{ path: '/chat-virtual', query: { slug: item.slug } }" :description="item.description || '还没有简介。'">
        <template #identity><LsEntityIdentity type="teamVirtual" :name="item.name" :slug="item.slug" :image-url="item.avatar"><template #status><LsStatusTag :label="item.is_active ? '启用' : '停用'" :type="item.is_active ? 'success' : 'default'" /></template></LsEntityIdentity></template>
        <template #metadata><span>{{ item.integrations?.length ?? 0 }} 个集成</span></template>
      </LsResourceRow>
    </LsResourceList>
    <LsEmptyState v-else :source="virtuals.data.value" :title="routeAccess.restricted.value ? '没有可显示的虚拟人员' : '还没有虚拟人员'" description="请先创建虚拟人员。" />
  </div>
</template>

<style scoped>
.virtual-list-page { display: grid; gap: 1.5rem; }
</style>
