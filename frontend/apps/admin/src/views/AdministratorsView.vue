<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { Plus } from '@lucide/vue'
import { NButton, NTag } from 'naive-ui'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { can } from '../session'
import type { AdminRole } from '../types'
interface Administrator { id:number; username:string; phone_masked:string; email_masked:string; is_banned:number; roles:AdminRole[] }
const query=useQuery({queryKey:['admin-administrators'],queryFn:()=>api.get<Administrator[]>('/administrators')})
</script>
<template>
  <PageHeader title="平台管理员" description="管理员权限来自平台角色并集；超级管理员拥有全部平台权限。"><NButton v-if="can('admin.access.write')" type="primary" tag="a" href="/administrators/new"><template #icon><Plus /></template>添加管理员</NButton></PageHeader>
  <section class="panel">
    <div v-if="query.isPending.value" class="state">正在读取平台管理员…</div><RetryState v-else-if="query.isError.value" :error="query.error.value" @retry="query.refetch()" />
    <div v-else-if="!query.data.value?.length" class="state"><h2>还没有平台管理员</h2><p>先通过 CLI 授予首位超级管理员。</p></div>
    <template v-else>
      <div class="mobile-records"><RouterLink v-for="admin in query.data.value" :key="admin.id" class="mobile-record" :to="`/administrators/${admin.id}`"><header><strong>{{ admin.username }}</strong><StatusBadge :status="admin.is_banned?'banned':'active'" /></header><div><NTag v-for="role in admin.roles" :key="role.id" size="small">{{ role.name }}</NTag></div><small>{{ admin.phone_masked||admin.email_masked||'—' }}</small></RouterLink></div>
      <table class="data-table desktop-table"><thead><tr><th>管理员</th><th>角色</th><th>联系方式</th><th>状态</th></tr></thead><tbody><tr v-for="admin in query.data.value" :key="admin.id"><td class="cell-primary"><RouterLink :to="`/administrators/${admin.id}`">{{ admin.username }}</RouterLink><small>#{{ admin.id }}</small></td><td><NTag v-for="role in admin.roles" :key="role.id" size="small">{{ role.name }}</NTag></td><td>{{ admin.phone_masked||admin.email_masked||'—' }}</td><td><StatusBadge :status="admin.is_banned?'banned':'active'" /></td></tr></tbody></table>
    </template>
  </section>
</template>
<style scoped>.n-tag{margin:2px 6px 2px 0}</style>
