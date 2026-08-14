<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { Plus } from '@lucide/vue'
import { NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { can } from '../session'
import { adminStatusLabel, adminStatusType } from '../status'
import type { AdminRole } from '../types'

interface Administrator { id: number; username: string; phone_masked: string; email_masked: string; is_banned: number; roles: AdminRole[] }
const query = useQuery({ queryKey: ['admin-administrators'], queryFn: () => api.get<Administrator[]>('/administrators') })
const search = ref('')
const rows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return (query.data.value ?? []).filter(item => !keyword || `${item.username} ${item.phone_masked} ${item.email_masked}`.toLocaleLowerCase().includes(keyword))
})
const columns: DataTableColumns<Administrator> = [
  {
    title: '管理员', key: 'administrator', render: admin => h('div', { class: 'cell-primary' }, [
      h(RouterLink, { to: `/administrators/${admin.id}` }, { default: () => admin.username }), h('small', `#${admin.id}`),
    ]),
  },
  { title: '角色', key: 'roles', render: admin => h('div', { class: 'tag-group' }, admin.roles.map(role => h(NTag, { key: role.id, size: 'small' }, { default: () => role.name }))) },
  { title: '联系方式', key: 'contact', render: admin => admin.phone_masked || admin.email_masked || '—' },
  { title: '状态', key: 'status', render: admin => h(LsStatusTag, { label: adminStatusLabel(admin.is_banned ? 'banned' : 'active'), type: adminStatusType(admin.is_banned ? 'banned' : 'active') }) },
]
</script>

<template>
  <LsPageHeader title="平台管理员" description="管理员权限来自平台角色并集；超级管理员拥有全部平台权限。">
    <template #actions>
      <LsPagePrimaryAction v-if="can('admin.access.write')" :icon="Plus" label="添加管理员" to="/administrators/new" />
    </template>
  </LsPageHeader>
  <LsListToolbar v-model="search" placeholder="搜索管理员" aria-label="搜索平台管理员" :count-label="`${rows.length} 位管理员`" />
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="4" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取平台管理员" :description="friendlyError(query.error.value)" />
  <LsEmptyState v-else-if="!rows.length" title="没有匹配的平台管理员" description="调整搜索词后查看。" />
  <LsResponsiveDataTable v-else :columns="columns" :data="rows" :row-key="row => row.id" :scroll-x="680">
    <template #mobile-title="{ row: admin }"><RouterLink :to="`/administrators/${admin.id}`">{{ admin.username }}</RouterLink></template>
    <template #mobile-status="{ row: admin }"><LsStatusTag :label="adminStatusLabel(admin.is_banned ? 'banned' : 'active')" :type="adminStatusType(admin.is_banned ? 'banned' : 'active')" /></template>
    <template #mobile="{ row: admin }"><dl><dt>用户 ID</dt><dd>#{{ admin.id }}</dd><dt>角色</dt><dd>{{ admin.roles.map(role => role.name).join('、') || '未分配' }}</dd><dt>联系方式</dt><dd>{{ admin.phone_masked || admin.email_masked || '—' }}</dd></dl></template>
  </LsResponsiveDataTable>
</template>

<style scoped>.tag-group{display:flex;flex-wrap:wrap;gap:4px}</style>
