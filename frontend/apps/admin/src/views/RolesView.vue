<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { Plus } from '@lucide/vue'
import { NButton, NTag } from 'naive-ui'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import { can } from '../session'
import type { AdminRole } from '../types'
const query=useQuery({queryKey:['admin-roles'],queryFn:()=>api.get<AdminRole[]>('/roles')})
</script>
<template>
  <PageHeader title="平台角色" description="权限目录由代码维护；自定义角色组合固定权限后分配给平台管理员。"><NButton v-if="can('admin.access.write')" type="primary" tag="a" href="/roles/new"><template #icon><Plus /></template>创建角色</NButton></PageHeader>
  <section class="panel">
    <div v-if="query.isPending.value" class="state">正在读取平台角色…</div><RetryState v-else-if="query.isError.value" :error="query.error.value" @retry="query.refetch()" />
    <div v-else-if="!query.data.value?.length" class="state">暂无平台角色</div>
    <div v-else class="role-list"><RouterLink v-for="role in query.data.value" :key="role.id" :to="`/roles/${role.id}`"><div><strong>{{ role.name }}</strong><small>{{ role.description||role.role_key }}</small></div><div><NTag v-if="role.is_system" size="small" type="info">系统角色</NTag><span>{{ role.administrator_count }} 位管理员 · {{ role.permissions?.length||0 }} 项权限</span></div></RouterLink></div>
  </section>
</template>
<style scoped>.role-list{display:grid}.role-list>a{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid var(--line)}.role-list>a:last-child{border-bottom:0}.role-list>a:hover{background:var(--admin-row-hover)}.role-list strong,.role-list small{display:block}.role-list small,.role-list a>div:last-child span{color:var(--muted-ink);font-size:.78rem}.role-list a>div:last-child{text-align:right}.role-list .n-tag{margin-bottom:4px}</style>
