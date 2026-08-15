<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import { useQuery } from '@tanstack/vue-query'
import { Plus } from '@lucide/vue'
import { NTag } from 'naive-ui'
import { computed, ref } from 'vue'
import { can } from '../session'
import type { AdminRole } from '../types'

const query = useQuery({ queryKey: ['admin-roles'], queryFn: () => api.get<AdminRole[]>('/roles') })
const search = ref('')
const rows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return (query.data.value ?? []).filter(role => !keyword || `${role.name} ${role.role_key} ${role.description ?? ''}`.toLocaleLowerCase().includes(keyword))
})
</script>

<template>
  <LsPageHeader title="平台角色" description="权限（Permission）目录由代码维护；自定义角色组合固定权限（Permission）后分配给平台管理员。">
    <template #actions><LsPagePrimaryAction v-if="can('admin.access.write')" :icon="Plus" label="创建角色" to="/roles/new" /></template>
  </LsPageHeader>
  <LsListToolbar v-model="search" placeholder="搜索角色名称或标识" aria-label="搜索平台角色" :count-label="`${rows.length} 个角色`" />
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="4" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取平台角色" :description="friendlyError(query.error.value)" />
  <LsEmptyState v-else-if="!rows.length" title="没有匹配的平台角色" description="调整搜索词后查看，或创建新的平台角色。" />
  <section v-else class="role-list">
    <RouterLink v-for="role in rows" :key="role.id" :to="`/roles/${role.id}`"><div><strong>{{ role.name }}</strong><small>{{ role.description || role.role_key }}</small></div><div><NTag v-if="role.is_system" size="small" type="info">系统角色</NTag><span>{{ role.administrator_count }} 位管理员 · {{ role.permissions?.length || 0 }} 项权限（Permission）</span></div></RouterLink>
  </section>
</template>

<style scoped>.role-list{display:grid;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden}.role-list>a{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid var(--line)}.role-list>a:last-child{border-bottom:0}.role-list>a:hover{background:var(--admin-row-hover)}.role-list strong,.role-list small{display:block}.role-list small,.role-list a>div:last-child span{color:var(--muted-ink);font-size:.78rem}.role-list a>div:last-child{text-align:right}.role-list .n-tag{margin-bottom:4px}</style>
