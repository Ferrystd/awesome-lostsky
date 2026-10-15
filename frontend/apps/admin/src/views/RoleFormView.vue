<script setup lang="ts">
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import { api, auth, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import TeamCategoryLayout from '../../../team/src/components/TeamCategoryLayout.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { ArrowLeft, Save, Trash2 } from '@lucide/vue'
import { NInput, useDialog } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { can, permissionReason } from '../session'
import type { AdminRole } from '../types'

interface Catalog { groups: Array<{ name: string; items: Array<{ key: string; label: string }> }> }
const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const dialog = useDialog()
const id = computed(() => Number(route.params.id || 0))
const key = ref('')
const name = ref('')
const description = ref('')
const permissions = ref<string[]>([])
const currentCategory = ref('profile')
const emptyBaseline = () => ({ key: '', name: '', description: '', permissions: [] as string[] })
const categoryBaseline = ref(emptyBaseline())
const queries = useQueries({ queries: [
  { queryKey: ['admin-role', id], queryFn: () => routeAccess.read(() => api.get<AdminRole>(`/roles/${id.value}`)), enabled: computed(() => id.value > 0 && !routeAccess.restricted.value) },
  { queryKey: ['admin-permissions'], queryFn: () => api.get<Catalog>('/permissions'), enabled: computed(() => !routeAccess.restricted.value) },
] })
const draft = useQueryDraft({ key: () => `${location.host}:${JSON.stringify(auth.entity())}:${id.value}`, read: () => ({ key: key.value, name: name.value, description: description.value, permissions: [...permissions.value] }), apply: value => { key.value = value.key; name.value = value.name; description.value = value.description; permissions.value = value.permissions } })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path })
watch(() => queries.value[0].data, role => {
  if (!role) return
  const value = { key: role.role_key, name: role.name, description: role.description || '', permissions: [...(role.permissions || [])] }
  if (draft.hydrate(value)) categoryBaseline.value = value
}, { immediate: true })
watch(id, () => { currentCategory.value = 'profile'; categoryBaseline.value = emptyBaseline() }, { flush: 'sync' })
const role = computed(() => queries.value[0].data)
const writable = computed(() => can('admin.access.write') && !role.value?.is_system)
const loading = computed(() => !routeAccess.restricted.value && queries.value.some((query, index) => index === 0 && !id.value ? false : query.isPending))
const loadError = computed(() => routeAccess.restricted.value ? null : queries.value.find((query, index) => !(index === 0 && !id.value) && query.isError)?.error)
const save = useMutation({ mutationFn: async () => { const submitted = draft.capture(); const targetId = id.value; const body = { name: submitted.value.name, description: submitted.value.description, permission_keys: submitted.value.permissions }; if (targetId) { await api.put(`/roles/${targetId}`, body); return { savedId: targetId, submitted } } const created = await api.post<{ id: number }>('/roles', { role_key: submitted.value.key, ...body }); return { savedId: created.id, submitted } }, onSuccess: ({ savedId, submitted }) => { if (!draft.accept(submitted)) return; categoryBaseline.value = { ...submitted.value, permissions: [...submitted.value.permissions] }; feedback.success('平台角色已保存'); if (!draft.dirty.value) void router.replace(`/roles/${savedId}`) }, onError: error => feedback.error(friendlyError(error)) })
const remove = useMutation({ mutationFn: () => api.delete(`/roles/${id.value}`), onSuccess: () => { feedback.success('平台角色已删除'); router.push('/roles') }, onError: error => feedback.error(friendlyError(error)) })
function confirmDelete() { dialog.warning({ title: '删除这个平台角色？', content: '只有未分配给管理员的自定义角色才能删除。', positiveText: '删除角色', negativeText: '保留角色', onPositiveClick: () => remove.mutate() }) }
const permissionGroups = computed(() => (queries.value[1].data?.groups ?? []).map((group, index) => ({
  key: `permissions:${index}`,
  label: group.name,
  options: group.items.map(item => ({ value: item.key, label: item.label, meta: item.key })),
})))
function permissionSelectionChanged(keys?: Set<string>) {
  const selected = (values: string[]) => values.filter(value => !keys || keys.has(value)).sort()
  return JSON.stringify(selected(permissions.value)) !== JSON.stringify(selected(categoryBaseline.value.permissions))
}
const categoryItems = computed(() => [
  { key: 'profile', label: '角色资料', dirty: JSON.stringify([key.value, name.value, description.value]) !== JSON.stringify([categoryBaseline.value.key, categoryBaseline.value.name, categoryBaseline.value.description]) },
  { key: 'permissions', label: '全部权限', dirty: permissionSelectionChanged() },
  ...permissionGroups.value.map(group => ({ key: group.key, label: group.label, dirty: permissionSelectionChanged(new Set(group.options.map(option => option.value))) })),
])
const visiblePermissionGroups = computed(() => permissionGroups.value.filter(group => currentCategory.value === 'permissions' || group.key === currentCategory.value))
function groupPermissions(options: Array<{ value: string }>) {
  const keys = new Set(options.map(option => option.value))
  return permissions.value.filter(value => keys.has(value))
}
function updateGroupPermissions(options: Array<{ value: string }>, values: Array<string | number>) {
  const keys = new Set(options.map(option => option.value))
  const selected = values.map(String)
  const existing = new Set(permissions.value)
  permissions.value = [
    ...permissions.value.filter(value => !keys.has(value) || selected.includes(value)),
    ...selected.filter(value => !existing.has(value)),
  ]
}
watch(categoryItems, items => { if (!items.some(item => item.key === currentCategory.value)) currentCategory.value = 'permissions' })
</script>

<template>
  <div class="role-workspace">
    <LsPageHeader :title="id ? '编辑平台角色' : '创建平台角色'" description="角色标识保存后不能再修改；系统角色的权限固定，不可调整。">
      <template #actions><LsPageLink to="/roles" :icon="ArrowLeft" label="返回平台角色" /></template>
    </LsPageHeader>
    <TeamCategoryLayout :items="categoryItems" :current="currentCategory" label="平台角色分类" @select="currentCategory = $event">
      <LsAsyncState v-if="loading" state="loading" :rows="5" />
      <LsAsyncState v-else-if="loadError" state="error" title="暂时无法读取平台角色" :description="friendlyError(loadError)" />
      <form v-else class="role-form" @submit.prevent="routeAccess.restricted.value ? feedback.info(routeAccess.reason.value) : save.mutate()">
        <LsPanel>
          <template #header>
            <LsSectionHeader :title="categoryItems.find(item => item.key === currentCategory)?.label || '权限'" :description="currentCategory === 'profile' ? '填写角色名称和用途；切换到权限分类后继续配置，最后统一保存。' : '同一管理员的多个角色按权限并集生效；切换分类保留草稿，保存时统一提交。'" />
            <p v-if="draft.dirty.value" class="draft-status" role="status">有未保存的修改</p>
          </template>
          <div v-if="currentCategory === 'profile'" class="form-fields">
            <LsField label="角色标识" for-id="role-key" required><NInput v-model:value="key" :input-props="{ id: 'role-key' }" :disabled="Boolean(id)" placeholder="例如 support_operator" /></LsField>
            <LsField label="角色名称" for-id="role-name" required><NInput v-model:value="name" :input-props="{ id: 'role-name' }" :disabled="!writable && Boolean(id)" placeholder="例如 支持运营" maxlength="50" /></LsField>
            <LsField label="角色说明" for-id="role-description"><NInput v-model:value="description" :input-props="{ id: 'role-description' }" :disabled="!writable && Boolean(id)" type="textarea" maxlength="255" show-count /></LsField>
          </div>
          <LsEmptyState v-else-if="routeAccess.restricted.value" :access-reason="routeAccess.reason.value" title="没有可显示的平台权限" description="当前无法读取角色的权限配置。" />
          <div v-else-if="visiblePermissionGroups.length" class="permission-groups">
            <LsCheckboxGroupField v-for="group in visiblePermissionGroups" :key="group.key" :model-value="groupPermissions(group.options)" :label="group.label" :options="group.options" :disabled="!writable && Boolean(id)" @update:model-value="updateGroupPermissions(group.options, $event)" />
          </div>
          <LsEmptyState v-else :source="queries[1].data" title="没有可配置的平台权限" description="当前没有可配置的权限分组。" />
          <template v-if="!role?.is_system" #footer>
            <LsFormActions>
              <LsButton v-if="id && currentCategory === 'profile'" variant="danger" :disabled="!writable" :disabled-reason="permissionReason('admin.access.write')" :loading="remove.isPending.value" @click="confirmDelete"><template #icon><Trash2 :size="17" /></template>删除角色</LsButton>
              <LsPageLink v-else to="/roles" :icon="ArrowLeft" label="保留现状" />
              <LsButton type="submit" :loading="save.isPending.value" :disabled="routeAccess.restricted.value || !writable || !name || (!id && !key) || !draft.dirty.value" :disabled-reason="routeAccess.reason.value || (!writable ? permissionReason('admin.access.write') : '')"><template #icon><Save :size="17" /></template>保存平台角色</LsButton>
            </LsFormActions>
          </template>
        </LsPanel>
      </form>
    </TeamCategoryLayout>
  </div>
</template>

<style scoped>
.role-workspace { min-width: 0; display: grid; gap: 1.5rem; }
.role-form, .form-fields, .permission-groups { min-width: 0; display: grid; gap: 1rem; }
.draft-status { margin: .75rem 0 0; color: var(--text-secondary); font-size: .8125rem; overflow-wrap: anywhere; }
</style>
