<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { NButton, NCheckbox, NCheckboxGroup, NInputNumber } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import type { AdminRole } from '../types'
interface Administrator { id:number; username:string; roles:AdminRole[] }
const route=useRoute(); const router=useRouter()
const editingId=computed(()=>Number(route.params.userId||0)); const userId=ref<number|null>(editingId.value||null); const roleIds=ref<number[]>([])
const queries=useQueries({queries:[
  {queryKey:['admin-administrators'],queryFn:()=>api.get<Administrator[]>('/administrators')},
  {queryKey:['admin-roles'],queryFn:()=>api.get<AdminRole[]>('/roles')},
]})
watchEffect(()=>{if(editingId.value&&queries.value[0].data){const found=queries.value[0].data.find(a=>a.id===editingId.value);if(found){userId.value=found.id;roleIds.value=found.roles.map(r=>r.id)}}})
const current=computed(()=>queries.value[0].data?.find(a=>a.id===editingId.value))
const mutation=useMutation({mutationFn:()=>api.put(`/administrators/${Number(userId.value)}/roles`,{role_ids:roleIds.value}),onSuccess:()=>{feedback.success('管理员角色已更新');router.push('/administrators')}})
function retryQueries(){queries.value.forEach(query=>query.refetch())}
</script>
<template>
  <PageHeader :title="editingId?'编辑管理员角色':'添加平台管理员'" description="通过用户 ID 绑定一个或多个平台角色。不能在后台修改自己的角色。" back="/administrators" />
  <section class="panel form-panel">
    <div v-if="queries.some(q=>q.isPending)" class="state">正在读取角色…</div><RetryState v-else-if="queries.some(q=>q.isError)" :error="queries.find(q=>q.error)?.error" @retry="retryQueries" />
    <form v-else @submit.prevent="mutation.mutate()">
      <label>用户 ID<NInputNumber v-model:value="userId" :disabled="Boolean(editingId)" :min="1" placeholder="输入现有用户 ID" /></label>
      <p v-if="current" class="field-hint">正在编辑 @{{ current.username }}（#{{ current.id }}）</p>
      <fieldset><legend>平台角色</legend><NCheckboxGroup v-model:value="roleIds"><div class="role-options"><NCheckbox v-for="role in queries[1].data" :key="role.id" :value="role.id" :label="role.name"><span>{{ role.name }}</span><small>{{ role.description||role.role_key }}</small></NCheckbox></div></NCheckboxGroup></fieldset>
      <p v-if="mutation.isError.value" class="error-state" role="alert">{{ friendlyError(mutation.error.value) }}</p>
      <div class="form-actions"><NButton tag="a" href="/administrators">保留现状</NButton><NButton type="primary" attr-type="submit" :loading="mutation.isPending.value" :disabled="!userId">保存管理员角色</NButton></div>
    </form>
  </section>
</template>
<style scoped>.form-panel form{display:grid;gap:10px;padding:20px}.form-panel label,.form-panel legend{font-weight:680}.form-panel label .n-input-number{display:block;margin-top:6px;font-weight:400}.form-panel fieldset{display:grid;gap:8px;margin:12px 0 0;padding:0;border:0}.field-hint{margin:0;color:var(--muted-ink);font-size:.8rem}.role-options{display:grid;border:1px solid var(--line);border-radius:10px}.role-options .n-checkbox{min-height:62px;display:flex;padding:10px 12px;border-bottom:1px solid var(--line)}.role-options .n-checkbox:last-child{border-bottom:0}.role-options span,.role-options small{display:block}.role-options small{color:var(--muted-ink)}.form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}</style>
