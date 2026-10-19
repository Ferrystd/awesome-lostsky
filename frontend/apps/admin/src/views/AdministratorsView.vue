<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { Plus } from '@lucide/vue'
import { computed, ref } from 'vue'

import { adminStatusLabel, adminStatusType } from '../status'
import type { AdminRole } from '../types'

interface Administrator { id: number; username: string; phone_masked: string; email_masked: string; is_banned: number; roles: AdminRole[] }
const routeAccess = useRouteAccess()
const query = useQuery({ queryKey: ['admin-administrators'], queryFn: () => api.get<Administrator[]>('/administrators'), enabled: computed(() => !routeAccess.restricted.value) })
const search = ref('')
const rows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return (query.data.value ?? []).filter(item => !keyword || `${item.username} ${item.phone_masked} ${item.email_masked}`.toLocaleLowerCase().includes(keyword))
})
</script>

<template>
  <LsObjectDirectory title="平台管理员" description="管理员的权限是其所有平台角色权限的并集；超级管理员拥有全部平台权限。">
    <template #actions>
      <LsPageLink :icon="Plus" label="添加管理员" to="/administrators/new" />
    </template>
    <template #toolbar>
      <LsListToolbar v-model="search" placeholder="搜索管理员" aria-label="搜索平台管理员" :count-label="routeAccess.restricted.value ? '0 位管理员' : `${rows.length} 位管理员`" />
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="4" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取平台管理员" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !rows.length" title="没有可显示的平台管理员" description="调整搜索词后查看。" />
    <LsResourceList v-else aria-label="平台管理员列表">
      <LsResourceRow v-for="admin in rows" :key="admin.id" :title="admin.username" :to="`/administrators/${admin.id}`" :description="`#${admin.id} · ${admin.phone_masked || admin.email_masked || '无联系方式'} · 角色：${admin.roles.map(role => role.name).join('、') || '未分配'}`">
        <template #status><LsStatusTag :label="adminStatusLabel(admin.is_banned ? 'banned' : 'active')" :type="adminStatusType(admin.is_banned ? 'banned' : 'active')" /></template>
      </LsResourceRow>
    </LsResourceList>
  </LsObjectDirectory>
</template>
