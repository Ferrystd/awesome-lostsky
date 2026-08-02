<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { NCheckbox, NCheckboxGroup, NFormItem, NInputNumber } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AdminRole } from '../types'

interface Administrator { id: number; username: string; roles: AdminRole[] }
const route = useRoute()
const router = useRouter()
const editingId = computed(() => Number(route.params.userId || 0))
const userId = ref<number | null>(editingId.value || null)
const roleIds = ref<number[]>([])
const queries = useQueries({ queries: [
  { queryKey: ['admin-administrators'], queryFn: () => api.get<Administrator[]>('/administrators') },
  { queryKey: ['admin-roles'], queryFn: () => api.get<AdminRole[]>('/roles') },
] })
watchEffect(() => { if (editingId.value && queries.value[0].data) { const found = queries.value[0].data.find(item => item.id === editingId.value); if (found) { userId.value = found.id; roleIds.value = found.roles.map(role => role.id) } } })
const current = computed(() => queries.value[0].data?.find(item => item.id === editingId.value))
const loading = computed(() => queries.value.some(query => query.isPending))
const loadError = computed(() => queries.value.find(query => query.isError)?.error)
const mutation = useMutation({ mutationFn: () => api.put(`/administrators/${Number(userId.value)}/roles`, { role_ids: roleIds.value }), onSuccess: () => { feedback.success('管理员角色已更新'); router.push('/administrators') } })
</script>

<template>
  <LsPageHeader :title="editingId ? '编辑管理员角色' : '添加平台管理员'" description="通过用户 ID 绑定一个或多个平台角色。不能在后台修改自己的角色。" back-to="/administrators" />
  <LsAsyncState v-if="loading" state="loading" :rows="5" />
  <LsAsyncState v-else-if="loadError" state="error" title="暂时无法读取管理员角色" :description="friendlyError(loadError)" />
  <form v-else @submit.prevent="mutation.mutate()">
    <LsPanel><div class="form-fields">
      <LsField label="用户 ID" for-id="administrator-user-id" :hint="current ? `正在编辑 @${current.username}（#${current.id}）` : undefined" required><NInputNumber id="administrator-user-id" v-model:value="userId" :disabled="Boolean(editingId)" :min="1" placeholder="输入现有用户 ID" /></LsField>
      <NFormItem label="平台角色"><NCheckboxGroup v-model:value="roleIds"><div class="role-options"><NCheckbox v-for="role in queries[1].data" :key="role.id" :value="role.id" :label="role.name"><span>{{ role.name }}</span><small>{{ role.description || role.role_key }}</small></NCheckbox></div></NCheckboxGroup></NFormItem>
      <LsInlineError v-if="mutation.isError.value" :message="friendlyError(mutation.error.value)" />
    </div><template #footer><div class="form-actions"><RouterLink to="/administrators">保留现状</RouterLink><LsButton type="submit" :loading="mutation.isPending.value" :disabled="!userId">保存管理员角色</LsButton></div></template></LsPanel>
  </form>
</template>

<style scoped>.form-fields{display:grid;gap:16px}.role-options{display:grid;border:1px solid var(--line);border-radius:10px}.role-options .n-checkbox{min-height:62px;display:flex;padding:10px 12px;border-bottom:1px solid var(--line)}.role-options .n-checkbox:last-child{border-bottom:0}.role-options span,.role-options small{display:block}.role-options small{color:var(--muted-ink)}.form-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px}</style>
