<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { Plus, UserRoundCog } from '@lucide/vue'
import { NTag } from 'naive-ui'
import { computed, ref } from 'vue'
import type { AdminRole } from '../types'

const routeAccess = useRouteAccess()
const query = useQuery({ queryKey: ['admin-roles'], queryFn: () => api.get<AdminRole[]>('/roles'), enabled: computed(() => !routeAccess.restricted.value) })
const search = ref('')
const rows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return (query.data.value ?? []).filter(role => !keyword || `${role.name} ${role.role_key} ${role.description ?? ''}`.toLocaleLowerCase().includes(keyword))
})
</script>

<template>
  <LsObjectDirectory title="平台角色" description="可选权限由代码统一维护；自定义角色从固定权限中组合，再分配给平台管理员。">
    <template #actions>
      <LsPageLink :icon="Plus" label="创建角色" to="/roles/new" />
    </template>
    <template #toolbar>
      <LsListToolbar v-model="search" placeholder="搜索角色名称或标识" aria-label="搜索平台角色" :count-label="routeAccess.restricted.value ? '0 个角色' : `${rows.length} 个角色`" />
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="4" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取平台角色" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !rows.length" title="没有可显示的平台角色" description="调整搜索词后查看，或创建新的平台角色。" />
    <LsResourceList v-else aria-label="平台角色列表">
      <LsResourceRow v-for="role in rows" :key="role.id" :title="role.name" :description="role.description || role.role_key" :to="`/roles/${role.id}`" :icon="UserRoundCog">
        <template #status>
          <NTag v-if="role.is_system" size="small" type="info">系统角色</NTag>
        </template>
        <template #metadata>
          <span>{{ role.administrator_count }} 位管理员 · {{ role.permissions?.length || 0 }} 项权限</span>
        </template>
      </LsResourceRow>
    </LsResourceList>
  </LsObjectDirectory>
</template>
