<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { NButton, NCheckbox, NCheckboxGroup, NInput, useDialog } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import { can } from '../session'
import type { AdminRole } from '../types'
interface Catalog { groups:Array<{name:string;items:Array<{key:string;label:string}>}> }
const route=useRoute(); const router=useRouter(); const dialog=useDialog()
const id=computed(()=>Number(route.params.id||0)); const key=ref(''); const name=ref(''); const description=ref(''); const permissions=ref<string[]>([])
const queries=useQueries({queries:[
  {queryKey:['admin-role',id],queryFn:()=>api.get<AdminRole>(`/roles/${id.value}`),enabled:computed(()=>id.value>0)},
  {queryKey:['admin-permissions'],queryFn:()=>api.get<Catalog>('/permissions')},
]})
watchEffect(()=>{const role=queries.value[0].data;if(role){key.value=role.role_key;name.value=role.name;description.value=role.description||'';permissions.value=[...(role.permissions||[])]}})
const role=computed(()=>queries.value[0].data); const writable=computed(()=>can('admin.access.write')&&!role.value?.is_system)
const loading=computed(()=>queries.value.some((query,index)=>index===0&&!id.value?false:query.isPending))
const loadError=computed(()=>queries.value.find((query,index)=>!(index===0&&!id.value)&&query.isError)?.error)
const save=useMutation({mutationFn:async()=>{if(id.value){await api.put(`/roles/${id.value}`,{name:name.value,description:description.value,permission_keys:permissions.value});return id.value}const created=await api.post<{id:number}>('/roles',{role_key:key.value,name:name.value,description:description.value,permission_keys:permissions.value});return created.id},onSuccess:(savedId)=>{feedback.success('平台角色已保存');router.replace(`/roles/${savedId}`)}})
const remove=useMutation({mutationFn:()=>api.delete(`/roles/${id.value}`),onSuccess:()=>{feedback.success('平台角色已删除');router.push('/roles')}})
function confirmDelete(){dialog.warning({title:'删除这个平台角色？',content:'只有未分配给管理员的自定义角色才能删除。',positiveText:'删除角色',negativeText:'保留角色',onPositiveClick:()=>remove.mutate()})}
function retryQueries(){queries.value.forEach((query,index)=>{if(index!==0||id.value)query.refetch()})}
</script>
<template>
  <PageHeader :title="id?'编辑平台角色':'创建平台角色'" description="角色标识创建后不可修改；系统角色始终拥有固定的平台权限。" back="/roles"><NButton v-if="id&&writable" type="error" ghost @click="confirmDelete">删除角色</NButton></PageHeader>
  <div v-if="loading" class="panel state">正在读取角色…</div><RetryState v-else-if="loadError" class="panel" :error="loadError" @retry="retryQueries" />
  <form v-else class="role-form" @submit.prevent="save.mutate()">
    <section class="panel form-section"><h2>角色资料</h2><label>角色标识<NInput v-model:value="key" :disabled="Boolean(id)" placeholder="例如 support_operator" /></label><label>角色名称<NInput v-model:value="name" :disabled="!writable&&Boolean(id)" placeholder="例如 支持运营" maxlength="50" /></label><label>角色说明<NInput v-model:value="description" :disabled="!writable&&Boolean(id)" type="textarea" maxlength="255" show-count /></label></section>
    <section class="panel form-section"><h2>权限</h2><p>同一管理员的多个角色按权限并集生效。</p><NCheckboxGroup v-model:value="permissions" :disabled="!writable&&Boolean(id)"><div v-for="group in queries[1].data?.groups" :key="group.name" class="permission-group"><h3>{{ group.name }}</h3><NCheckbox v-for="item in group.items" :key="item.key" :value="item.key"><span>{{ item.label }}</span><small>{{ item.key }}</small></NCheckbox></div></NCheckboxGroup></section>
    <p v-if="save.isError.value" class="error-state" role="alert">{{ friendlyError(save.error.value) }}</p>
    <div v-if="writable||!id" class="form-actions"><NButton tag="a" href="/roles">保留现状</NButton><NButton type="primary" attr-type="submit" :loading="save.isPending.value" :disabled="!name||(!id&&!key)">保存平台角色</NButton></div>
  </form>
</template>
<style scoped>.role-form{display:grid;gap:16px}.form-section{display:grid;gap:8px;padding:18px}.form-section h2,.form-section p{margin:0}.form-section p{color:var(--muted-ink);font-size:.82rem}.form-section label{margin-top:6px;font-weight:680}.form-section label .n-input{margin-top:6px;font-weight:400}.permission-group{display:grid;gap:2px;padding:14px 0;border-bottom:1px solid var(--line)}.permission-group:last-child{border-bottom:0}.permission-group h3{margin:0 0 6px;font-size:.9rem}.permission-group .n-checkbox{min-height:44px;padding:6px}.permission-group span,.permission-group small{display:block}.permission-group small{color:var(--muted-ink);font-size:.72rem}.form-actions{display:flex;justify-content:flex-end;gap:8px}</style>
