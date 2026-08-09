<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { NInputNumber } from 'naive-ui'
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
const roleOptions = computed(() => (queries.value[1].data ?? []).map(role => ({
  value: role.id,
  label: role.name,
  meta: role.role_key,
  description: role.description || undefined,
})))
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
      <LsCheckboxGroupField v-model="roleIds" label="平台角色" :options="roleOptions" />
      <LsInlineError v-if="mutation.isError.value" :message="friendlyError(mutation.error.value)" />
    </div><template #footer><LsFormActions><RouterLink to="/administrators">保留现状</RouterLink><LsButton type="submit" :loading="mutation.isPending.value" :disabled="!userId">保存管理员角色</LsButton></LsFormActions></template></LsPanel>
  </form>
</template>

<style scoped>.form-fields{display:grid;gap:16px}</style>
