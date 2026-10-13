<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { Plus, UserRoundCog } from '@lucide/vue'

import { computed, ref } from 'vue'

interface RoleRecord {
  id: number
  name?: string
  role_key?: string
  description?: string
  is_displayed?: number
}

const routeAccess = useRouteAccess()
const query = useQuery({
  queryKey: ['roles'],
  queryFn: () => api.get<RoleRecord[]>('/role/index'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const roles = computed(() => query.data.value ?? [])
const search = ref('')
const filtered = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return roles.value.filter(role => !keyword || `${role.name ?? ''} ${role.role_key ?? ''} ${role.description ?? ''}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
  <div class="roles-page">
    <LsCollectionPage title="角色与权限" description="角色是权限的载体。">
      <template #actions>
        <LsPageLink :to="'/roles/entities'" :icon="UserRoundCog" label="人员角色分配" />
        <LsPageLink :icon="Plus" label="新建角色" to="/roles/new" />
      </template>
      <template #toolbar>
        <LsListToolbar v-model="search" placeholder="搜索角色名称或标识" aria-label="搜索角色" :count-label="routeAccess.restricted.value ? '0 个角色' : `${filtered.length} 个角色`" />
      </template>
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取角色" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="4" />
      <LsEmptyState v-else-if="routeAccess.restricted.value || !filtered.length" :source="query.data.value" :title="routeAccess.restricted.value ? '没有可显示的角色' : '还没有角色'" description="先创建角色，再为它选择完成工作所需的最小权限。" />
      <LsResourceList v-else aria-label="角色列表">
        <LsResourceRow v-for="role in filtered" :key="role.id" :title="role.name || `角色 #${role.id}`" :description="role.description || '暂无角色说明'" :to="`/roles/${role.id}`" :icon="UserRoundCog">
          <template #status>
            <LsStatusTag :label="Number(role.is_displayed) === 1 ? '公开展示' : '仅内部'" :type="Number(role.is_displayed) === 1 ? 'info' : 'default'" />
          </template>
          <template #metadata>
            <span>{{ role.role_key }}</span>
          </template>
        </LsResourceRow>
      </LsResourceList>
    </LsCollectionPage>
  </div>
</template>
