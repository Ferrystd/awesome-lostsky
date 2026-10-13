<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import { api, auth, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { NInputNumber } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AdminRole } from '../types'

interface Administrator { id: number; username: string; roles: AdminRole[] }
const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const editingId = computed(() => Number(route.params.userId || 0))
const userId = ref<number | null>(editingId.value || null)
const roleIds = ref<number[]>([])
const queries = useQueries({ queries: [
  { queryKey: ['admin-administrators'], queryFn: () => api.get<Administrator[]>('/administrators'), enabled: computed(() => !routeAccess.restricted.value) },
  { queryKey: ['admin-roles'], queryFn: () => api.get<AdminRole[]>('/roles'), enabled: computed(() => !routeAccess.restricted.value) },
] })
const draft = useQueryDraft({ key: () => `${location.host}:${JSON.stringify(auth.entity())}:${editingId.value}`, read: () => ({ userId: userId.value, roleIds: [...roleIds.value] }), apply: value => { userId.value = value.userId; roleIds.value = value.roleIds }, initial: () => ({ userId: editingId.value || null, roleIds: [] as number[] }) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path })
watch([() => queries.value[0].data, editingId], ([rows]) => { const found = rows?.find(item => item.id === editingId.value); if (found) draft.hydrate({ userId: found.id, roleIds: found.roles.map(role => role.id) }) }, { immediate: true })
const current = computed(() => queries.value[0].data?.find(item => item.id === editingId.value))
const roleOptions = computed(() => (queries.value[1].data ?? []).map(role => ({
  value: role.id,
  label: role.name,
  meta: role.role_key,
  description: role.description || undefined,
})))
const loading = computed(() => !routeAccess.restricted.value && queries.value.some(query => query.isPending))
const loadError = computed(() => routeAccess.restricted.value ? null : queries.value.find(query => query.isError)?.error)
const mutation = useMutation({ mutationFn: async () => { const submitted = draft.capture(); await api.put(`/administrators/${Number(submitted.value.userId)}/roles`, { role_ids: submitted.value.roleIds }); return submitted }, onSuccess: submitted => { if (!draft.accept(submitted)) return; feedback.success('管理员角色已更新'); if (!draft.dirty.value) void router.push('/administrators') }, onError: error => feedback.error(friendlyError(error)) })
</script>

<template>
  <LsFormPage :title="editingId ? '编辑管理员角色' : '添加平台管理员'" description="通过用户 ID 绑定一个或多个平台角色。不能在后台修改自己的角色。">
    <template #actions>
      <LsPageLink to="/administrators" :icon="ArrowLeft" label="返回管理员列表" />
    </template>

  <LsAsyncState v-if="loading" state="loading" :rows="5" />
  <LsAsyncState v-else-if="loadError" state="error" title="暂时无法读取管理员角色" :description="friendlyError(loadError)" />
  <form v-else @submit.prevent="routeAccess.restricted.value ? feedback.info(routeAccess.reason.value) : mutation.mutate()">
    <LsPanel><div class="form-fields">
      <LsField label="用户 ID" for-id="administrator-user-id" :hint="routeAccess.restricted.value ? '-' : current ? `正在编辑 @${current.username}（#${current.id}）` : undefined" required><NInputNumber id="administrator-user-id" v-model:value="userId" :disabled="routeAccess.restricted.value || Boolean(editingId)" :min="1" :placeholder="routeAccess.restricted.value ? '-' : '输入现有用户 ID'" /></LsField>
      <LsCheckboxGroupField v-model="roleIds" label="平台角色" :options="roleOptions" />
    </div><template #footer><LsFormActions><LsPageLink to="/administrators" :icon="ArrowLeft" label="保留现状" /><LsButton type="submit" :loading="mutation.isPending.value" :disabled="routeAccess.restricted.value || !userId || !draft.dirty.value" :disabled-reason="routeAccess.reason.value">保存管理员角色</LsButton></LsFormActions></template></LsPanel>
  </form>
  </LsFormPage>
</template>

<style scoped>.form-fields{display:grid;gap:16px}</style>
