<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQueries } from '@tanstack/vue-query'
import { NCheckbox, NCheckboxGroup, NFormItem, NInput, useDialog } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { can } from '../session'
import type { AdminRole } from '../types'

interface Catalog { groups: Array<{ name: string; items: Array<{ key: string; label: string }> }> }
const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const id = computed(() => Number(route.params.id || 0))
const key = ref('')
const name = ref('')
const description = ref('')
const permissions = ref<string[]>([])
const queries = useQueries({ queries: [
  { queryKey: ['admin-role', id], queryFn: () => api.get<AdminRole>(`/roles/${id.value}`), enabled: computed(() => id.value > 0) },
  { queryKey: ['admin-permissions'], queryFn: () => api.get<Catalog>('/permissions') },
] })
watchEffect(() => { const role = queries.value[0].data; if (role) { key.value = role.role_key; name.value = role.name; description.value = role.description || ''; permissions.value = [...(role.permissions || [])] } })
const role = computed(() => queries.value[0].data)
const writable = computed(() => can('admin.access.write') && !role.value?.is_system)
const loading = computed(() => queries.value.some((query, index) => index === 0 && !id.value ? false : query.isPending))
const loadError = computed(() => queries.value.find((query, index) => !(index === 0 && !id.value) && query.isError)?.error)
const save = useMutation({ mutationFn: async () => { if (id.value) { await api.put(`/roles/${id.value}`, { name: name.value, description: description.value, permission_keys: permissions.value }); return id.value } const created = await api.post<{ id: number }>('/roles', { role_key: key.value, name: name.value, description: description.value, permission_keys: permissions.value }); return created.id }, onSuccess: savedId => { feedback.success('平台角色已保存'); router.replace(`/roles/${savedId}`) } })
const remove = useMutation({ mutationFn: () => api.delete(`/roles/${id.value}`), onSuccess: () => { feedback.success('平台角色已删除'); router.push('/roles') } })
function confirmDelete() { dialog.warning({ title: '删除这个平台角色？', content: '只有未分配给管理员的自定义角色才能删除。', positiveText: '删除角色', negativeText: '保留角色', onPositiveClick: () => remove.mutate() }) }
</script>

<template>
  <LsPageHeader :title="id ? '编辑平台角色' : '创建平台角色'" description="角色标识创建后不可修改；系统角色始终拥有固定的平台权限。" back-to="/roles">
    <template #actions><LsButton v-if="id && writable" variant="danger" @click="confirmDelete">删除角色</LsButton></template>
  </LsPageHeader>
  <LsAsyncState v-if="loading" state="loading" :rows="5" />
  <LsAsyncState v-else-if="loadError" state="error" title="暂时无法读取平台角色" :description="friendlyError(loadError)" />
  <form v-else class="role-form" @submit.prevent="save.mutate()">
    <LsPanel><template #header><h2>角色资料</h2></template><div class="form-fields">
      <LsField label="角色标识" for-id="role-key" required><NInput v-model:value="key" :input-props="{ id: 'role-key' }" :disabled="Boolean(id)" placeholder="例如 support_operator" /></LsField>
      <LsField label="角色名称" for-id="role-name" required><NInput v-model:value="name" :input-props="{ id: 'role-name' }" :disabled="!writable && Boolean(id)" placeholder="例如 支持运营" maxlength="50" /></LsField>
      <LsField label="角色说明" for-id="role-description"><NInput v-model:value="description" :input-props="{ id: 'role-description' }" :disabled="!writable && Boolean(id)" type="textarea" maxlength="255" show-count /></LsField>
    </div></LsPanel>
    <LsPanel><template #header><div><h2>权限</h2><p>同一管理员的多个角色按权限并集生效。</p></div></template>
      <NFormItem label="平台权限"><NCheckboxGroup v-model:value="permissions" :disabled="!writable && Boolean(id)"><div v-for="group in queries[1].data?.groups" :key="group.name" class="permission-group"><h3>{{ group.name }}</h3><NCheckbox v-for="item in group.items" :key="item.key" :value="item.key"><span>{{ item.label }}</span><small>{{ item.key }}</small></NCheckbox></div></NCheckboxGroup></NFormItem>
    </LsPanel>
    <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
    <LsFormActions v-if="writable || !id"><RouterLink to="/roles">保留现状</RouterLink><LsButton type="submit" :loading="save.isPending.value" :disabled="!name || (!id && !key)">保存平台角色</LsButton></LsFormActions>
  </form>
</template>

<style scoped>.role-form,.form-fields{display:grid;gap:16px}:deep(.ls-panel__header h2),:deep(.ls-panel__header p){margin:0}:deep(.ls-panel__header p){color:var(--muted-ink);font-size:.82rem}.permission-group{display:grid;gap:2px;padding:14px 0;border-bottom:1px solid var(--line)}.permission-group:last-child{border-bottom:0}.permission-group h3{margin:0 0 6px;font-size:.9rem}.permission-group .n-checkbox{min-height:44px;padding:6px}.permission-group span,.permission-group small{display:block}.permission-group small{color:var(--muted-ink);font-size:.72rem}</style>
