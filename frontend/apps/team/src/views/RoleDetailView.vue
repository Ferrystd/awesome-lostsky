<script setup lang="ts">
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import { useQueryDraft, type DraftSubmission } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import TeamCategoryLayout from '../components/TeamCategoryLayout.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, ChevronDown, Save, Trash2 } from '@lucide/vue'
import {
  NCheckbox,
  NForm,
  NInput,
  NInputNumber,
  NModal,
} from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { coveringPermission, permissionsForSave, selectPermissionScope } from '../lib/permissionHierarchy'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

type EntityType = 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
interface RoleRecord { id: number; name?: string; role_key?: string; description?: string; sort?: number; is_displayed?: number }
interface PermissionItem { key: string; label: string }
interface AdvancedPermissionItem { key: string; label: string; covered_keys: string[] }
interface PermissionCatalog {
  groups: Array<{ name: string; items: PermissionItem[] }>
  advanced_items: AdvancedPermissionItem[]
}
interface TeamEntityOption {
  type: EntityType
  slug: string
  name: string
  avatar?: string | null
}
type SpecialPermissionGroup = '文档管理' | '人员管理' | '人员委托'
type DynamicPermissionId = 'document-manage' | 'manage' | 'field-manage' | 'assume'
interface DynamicPermissionDefinition {
  id: DynamicPermissionId
  label: string
  template: string
  virtualOnly: boolean
  group: SpecialPermissionGroup
}

const dynamicPermissionDefinitions: DynamicPermissionDefinition[] = [
  { id: 'document-manage', label: '管理指定人员文档', template: 'team.document.<type>.<slug>.manage', virtualOnly: false, group: '文档管理' },
  { id: 'manage', label: '管理指定虚拟人员', template: 'team.entity.virtual.<slug>.manage', virtualOnly: true, group: '人员管理' },
  { id: 'field-manage', label: '管理指定虚拟人员字段', template: 'team.entity.virtual.<slug>.field.manage', virtualOnly: true, group: '人员管理' },
  { id: 'assume', label: '领取指定人员身份', template: 'identity.<type>.<slug>.assume', virtualOnly: false, group: '人员委托' },
]
const entityDelegationGroupName = '人员委托'
const entityManagementGroupName = '人员管理'
const documentManagementGroupName = '文档管理'

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const routeAccess = useRouteAccess()
const roleId = computed(() => Number(route.params.id))
const form = reactive({ name: '', description: '', sort: 0 as number | null, is_displayed: false })
const permissionKeys = ref<string[]>([])
const initialPermissionKeys = ref<string[]>([])
const draftKey = () => teamDraftScope('role', roleId.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
const permissionsDraft = useQueryDraft({ key: draftKey, read: () => [...permissionKeys.value].sort(), apply: value => { permissionKeys.value = value } })
useUnsavedChangesGuard(computed(() => draft.dirty.value || permissionsDraft.dirty.value), { shouldConfirm: teamDraftNavigationChanged })
const dynamicAdvancedItems = ref<AdvancedPermissionItem[]>([])
const advancedSearch = ref('')
const showAdvancedConfirm = ref(false)
const pendingPermissionKeys = ref<string[]>([])
let pendingPermissionSubmission: DraftSubmission<string[]> | undefined
watch(draftKey, () => {
  showAdvancedConfirm.value = false
  pendingPermissionKeys.value = []
  pendingPermissionSubmission = undefined
}, { flush: 'sync' })
const targetSlug = ref('')
const targetEntities = ref<EntityDisplay[]>([])

const roleQuery = useQuery({
  queryKey: computed(() => ['role', roleId.value]),
  queryFn: () => routeAccess.read(() => api.get<RoleRecord>('/role/get', { id: roleId.value })),
  enabled: computed(() => roleId.value > 0 && !routeAccess.restricted.value),
})
const permissionsQuery = useQuery({
  queryKey: computed(() => ['role-permissions', roleId.value]),
  queryFn: () => api.get<Array<{ permission_key?: string; key?: string }>>('/rolePermission/index', { role_id: roleId.value }),
  enabled: computed(() => roleId.value > 0 && !routeAccess.restricted.value),
})
const catalogQuery = useQuery({
  queryKey: ['role-permission-catalog'],
  queryFn: () => api.get<PermissionCatalog>('/rolePermission/catalog'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const groups = computed(() => Array.isArray(catalogQuery.data.value?.groups) ? catalogQuery.data.value.groups : [])
const catalogGroupNames = computed(() => new Set(groups.value.map(group => group.name)))
const staticGroups = computed(() => groups.value.map(group => ({
  ...group,
  items: group.items.filter(item => !isDynamicLeafPermission(item.key)),
})).filter(group => ![documentManagementGroupName, entityManagementGroupName, entityDelegationGroupName].includes(group.name) && group.items.length))
const leafLabels = computed(() => new Map(groups.value.flatMap(group => (
  group.items.map(item => [item.key, item.label] as const)
))))
const leafGroups = computed(() => new Map(groups.value.flatMap(group => (
  group.items.map(item => [item.key, group.name] as const)
))))
const advancedItems = computed(() => {
  const items = new Map<string, AdvancedPermissionItem>()
  for (const item of catalogQuery.data.value?.advanced_items ?? []) items.set(item.key, item)
  for (const item of dynamicAdvancedItems.value) items.set(item.key, item)
  for (const key of permissionKeys.value) {
    if (/^identity\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}$/.test(key) && !items.has(key)) {
      items.set(key, {
        key,
        label: `覆盖 ${key} 下全部权限`,
        covered_keys: [`${key}.assume`],
      })
    }
  }
  return [...items.values()]
})
const advancedGroups = computed(() => {
  const keyword = advancedSearch.value.trim().toLocaleLowerCase()
  const result = new Map<string, AdvancedPermissionItem[]>()
  for (const item of advancedItems.value) {
    const searchable = `${item.key} ${item.label} ${item.covered_keys.join(' ')}`.toLocaleLowerCase()
    if (keyword && !searchable.includes(keyword)) continue
    const coveredGroups = new Set(item.covered_keys.map(key => leafGroups.value.get(key)).filter(Boolean))
    const groupName = coveredGroups.size === 1
      ? [...coveredGroups][0]!
      : dynamicPermissionGroup(item.key) ?? item.key.split('.')[0]
    result.set(groupName, [...(result.get(groupName) ?? []), item])
  }
  return [...result.entries()].map(([name, items]) => ({ name, items }))
})
const newlyAddedAdvanced = computed(() => advancedItems.value.filter(item => (
  permissionKeys.value.includes(item.key) && !initialPermissionKeys.value.includes(item.key)
)))
const selectedTarget = computed(() => targetEntities.value[0] ?? null)
const dynamicOptions = computed(() => dynamicPermissionDefinitions.map(definition => {
  const key = selectedTarget.value ? dynamicPermissionKey(definition, selectedTarget.value) : null
  const coveredBy = key ? coveringParent(key) : null
  return {
    ...definition,
    key,
    coveredBy,
    checked: Boolean(key && (permissionKeys.value.includes(key) || coveredBy)),
    disabled: !key || Boolean(coveredBy),
  }
}))
const specialPermissionGroups = computed(() => ([documentManagementGroupName, entityManagementGroupName, entityDelegationGroupName] as SpecialPermissionGroup[]).map(name => {
  const group = groups.value.find(candidate => candidate.name === name)
  return {
    id: name === documentManagementGroupName
      ? 'document-management'
      : name === entityManagementGroupName ? 'entity-management' : 'entity-delegation',
    name,
    items: group?.items.filter(item => !isDynamicLeafPermission(item.key)) ?? [],
    options: dynamicOptions.value.filter(option => option.group === name),
  }
}))

const currentCategory = ref('profile')
function groupDirty(name: string) {
  const select = (keys: string[]) => keys.filter(key => leafGroups.value.get(key) === name || dynamicPermissionGroup(key) === name).sort()
  return JSON.stringify(select(permissionKeys.value)) !== JSON.stringify(select(initialPermissionKeys.value))
}
const categoryItems = computed(() => [
  { key: 'profile', label: '角色资料', dirty: draft.dirty.value },
  ...staticGroups.value.map(group => ({ key: `group:${group.name}`, label: group.name, dirty: groupDirty(group.name) })),
  ...specialPermissionGroups.value.map(group => ({ key: group.id, label: group.name, dirty: groupDirty(group.name) })),
  { key: 'advanced', label: '高级范围权限', dirty: JSON.stringify(permissionKeys.value.filter(key => advancedItems.value.some(item => item.key === key)).sort()) !== JSON.stringify(initialPermissionKeys.value.filter(key => advancedItems.value.some(item => item.key === key)).sort()) },
])
const visibleStaticGroups = computed(() => staticGroups.value.filter(group => currentCategory.value === `group:${group.name}`))
const visibleSpecialGroups = computed(() => specialPermissionGroups.value.filter(group => currentCategory.value === group.id))
const currentCategoryLabel = computed(() => categoryItems.value.find(item => item.key === currentCategory.value)?.label || '角色权限')
const validInfo = computed(() => Boolean(form.name.trim()) && form.sort !== null && Number.isSafeInteger(form.sort) && form.sort >= 0)
const infoDisabledReason = computed(() => routeAccess.reason.value || (!validInfo.value ? '请填写角色名称和有效的显示顺序。' : !draft.dirty.value ? '角色资料尚未修改。' : undefined))
const permissionDisabledReason = computed(() => routeAccess.reason.value || (!permissionsDraft.dirty.value ? '角色权限尚未修改。' : undefined))
watch(draftKey, () => { currentCategory.value = 'profile' })

watch(() => roleQuery.data.value, (role) => {
  if (!role) return
  draft.hydrate({ name: String(role.name ?? ''), description: String(role.description ?? ''), sort: Number(role.sort ?? 0), is_displayed: Number(role.is_displayed ?? 0) === 1 })
}, { immediate: true })
watch(() => permissionsQuery.data.value, (items) => {
  if (!items) return
  const keys = items.map(item => String(item.permission_key ?? item.key ?? '')).filter(Boolean)
  if (permissionsDraft.hydrate(keys.sort())) initialPermissionKeys.value = [...keys]
}, { immediate: true })

const saveInfo = useMutation({
  mutationFn: async () => {
    if (!validInfo.value) throw new Error('请填写角色名称和有效的显示顺序。')
    const submitted = draft.capture()
    const form = submitted.value
    await api.post('/role/edit', {
    id: roleId.value,
    name: form.name.trim(),
    description: form.description.trim() || null,
    sort: Number(form.sort),
    is_displayed: form.is_displayed ? 1 : 0,
    })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.accept(submitted)) return
    await Promise.all([
      client.invalidateQueries({ queryKey: ['role', roleId.value] }),
      client.invalidateQueries({ queryKey: ['roles'] }),
    ])
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    feedback.success('角色资料已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const savePermissions = useMutation({
  mutationFn: async (keys: string[]) => {
    const submitted = pendingPermissionSubmission!
    await api.post('/rolePermission/save', {
    role_id: roleId.value,
    permission_keys: [...keys],
    })
    return { submitted, keys: [...keys].sort() }
  },
  onSuccess: ({ submitted, keys }) => {
    if (!permissionsDraft.accept(submitted, keys)) return
    initialPermissionKeys.value = keys
    pendingPermissionKeys.value = []
    showAdvancedConfirm.value = false
    feedback.success('角色权限已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const remove = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    await api.post('/role/delete', { id: roleId.value })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    await client.invalidateQueries({ queryKey: ['roles'] })
    feedback.success('角色已删除')
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    await router.replace('/roles')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const requestError = computed(() =>
  roleQuery.error.value
  || permissionsQuery.error.value
  || catalogQuery.error.value,
)
const pending = computed(() =>
  roleQuery.isPending.value
  || permissionsQuery.isPending.value
  || catalogQuery.isPending.value,
)

function togglePermission(key: string, checked: boolean) {
  if (!checked) {
    permissionKeys.value = permissionKeys.value.filter(item => item !== key)
    return
  }
  permissionKeys.value = selectPermissionScope(permissionKeys.value, key)
}
function coveringParent(key: string) {
  return coveringPermission(permissionKeys.value, key)
}
function requestPermissionSave() {
  if (routeAccess.restricted.value) return
  pendingPermissionSubmission = permissionsDraft.capture()
  pendingPermissionKeys.value = permissionsForSave(pendingPermissionSubmission.value)
  if (newlyAddedAdvanced.value.length) showAdvancedConfirm.value = true
  else savePermissions.mutate([...pendingPermissionKeys.value])
}
function confirmPermissionSave() {
  if (routeAccess.restricted.value || !pendingPermissionSubmission || !permissionsDraft.isCurrent(pendingPermissionSubmission)) return
  savePermissions.mutate([...pendingPermissionKeys.value])
}
function deleteRole() {
  if (routeAccess.restricted.value) return
  if (window.confirm(`确认删除角色“${roleQuery.data.value?.name || roleId.value}”？`)) remove.mutate()
}
async function searchEntities(_keyword: string): Promise<EntityDisplay[]> {
  const found = await client.fetchQuery({
    queryKey: ['team-entity-options'],
    queryFn: () => api.get<TeamEntityOption[]>('/entity/options'),
    staleTime: 60_000,
  })
  return found.filter(entity => entity.type !== 'team').map(entity => ({
    slug: entity.slug,
    type: entity.type,
    name: entity.name,
    avatar: entity.avatar,
  }))
}
function selectTargetEntities(entities: EntityDisplay[]) {
  targetEntities.value = entities
  targetSlug.value = ''
}
function isDynamicLeafPermission(key: string) {
  return /^team\.document\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}\.manage$/.test(key)
    || /^team\.entity\.virtual\.[a-z0-9][a-z0-9_-]{0,49}\.(?:manage|field\.manage)$/.test(key)
    || /^identity\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}\.assume$/.test(key)
}
function dynamicPermissionGroup(key: string): SpecialPermissionGroup | null {
  if (/^team\.document(?:\.|$)/.test(key)) return documentManagementGroupName
  if (/^team\.entity(?:\.|$)/.test(key)) return entityManagementGroupName
  if (/^identity(?:\.|$)/.test(key)) return entityDelegationGroupName
  return null
}
function assignedDynamicKeys(group: string) {
  return permissionKeys.value.filter(key => isDynamicLeafPermission(key) && dynamicPermissionGroup(key) === group)
}
function dynamicPermissionKey(definition: DynamicPermissionDefinition, entity: EntityDisplay): string | null {
  const type = ({ teamMember: 'member', teamCustomer: 'customer', teamVirtual: 'virtual' } as const)[entity.type as Exclude<EntityType, 'team'>]
  if (definition.id === 'document-manage') {
    return type ? `team.document.${type}.${entity.slug}.manage` : null
  }
  if (definition.virtualOnly) {
    if (entity.type !== 'teamVirtual') return null
    const action = definition.id === 'field-manage' ? 'field.manage' : definition.id
    return `team.entity.virtual.${entity.slug}.${action}`
  }
  return type ? `identity.${type}.${entity.slug}.assume` : null
}
function toggleDynamicPermission(key: string | null, checked: boolean) {
  if (!key) return
  togglePermission(key, checked)
  if (checked && key.startsWith('identity.') && key.endsWith('.assume')) {
    const parent = key.replace(/\.assume$/, '')
    if (!dynamicAdvancedItems.value.some(item => item.key === parent)) {
      dynamicAdvancedItems.value.push({ key: parent, label: `覆盖 ${parent} 下全部权限`, covered_keys: [key] })
    }
  }
}
function dynamicPermissionLabel(key: string) {
  return leafLabels.value.get(key)
    || (key.startsWith('team.document.') ? '管理指定人员文档'
      : key.endsWith('.field.manage') ? '管理指定虚拟人员字段'
      : key.endsWith('.manage') ? '管理指定虚拟人员'
        : '领取指定人员身份')
}

function permissionOptions(items: PermissionItem[]) {
  return items.map(item => ({ value: item.key, label: item.label, meta: item.key, disabled: Boolean(coveringParent(item.key)), description: coveringParent(item.key) ? `由 ${coveringParent(item.key)} 覆盖` : undefined }))
}
function checkedPermissions(items: PermissionItem[]) {
  return items.filter(item => permissionKeys.value.includes(item.key) || coveringParent(item.key)).map(item => item.key)
}
function updatePermissionGroup(items: PermissionItem[], values: Array<string | number>) {
  if (routeAccess.restricted.value) return
  const checked = checkedPermissions(items)
  const item = items.find(item => !coveringParent(item.key) && checked.includes(item.key) !== values.includes(item.key))
  if (item) togglePermission(item.key, values.includes(item.key))
}
type DynamicOption = (typeof dynamicOptions.value)[number]
function targetOptions(options: DynamicOption[]) {
  return options.map(option => ({ value: option.id, label: option.label, meta: option.key || option.template, disabled: option.disabled, description: option.coveredBy ? `由 ${option.coveredBy} 覆盖` : !selectedTarget.value ? '先选择目标人员' : !option.key ? '仅适用于虚拟人员' : undefined }))
}
function updateTargetPermissions(options: DynamicOption[], values: Array<string | number>) {
  if (routeAccess.restricted.value) return
  const option = options.find(option => !option.disabled && option.checked !== values.includes(option.id))
  if (option) toggleDynamicPermission(option.key, values.includes(option.id))
}
</script>

<template>
    <div class="role-detail">
      <LsPageHeader
        :title="roleQuery.data.value?.name || '编辑角色权限'"
        :description="roleQuery.data.value?.role_key ? `角色标识：${roleQuery.data.value.role_key}` : '保存角色对外展示资料、权限等。'"
      >
        <template #actions><LsPageLink to="/roles" :icon="ArrowLeft" label="返回角色列表" /></template>
      </LsPageHeader>
      <TeamCategoryLayout :items="categoryItems" :current="currentCategory" label="角色分类" @select="currentCategory = $event">
        <LsAsyncState v-if="requestError && !routeAccess.restricted.value" state="error" title="暂时无法读取角色" :description="friendlyError(requestError)" />
        <LsAsyncState v-else-if="pending && !routeAccess.restricted.value" state="loading" :rows="7" />
        <LsEmptyState v-else-if="!routeAccess.restricted.value && !roleQuery.data.value" :source="roleQuery.data.value" title="没有可显示的角色" description="此角色暂不可用。" />
        <template v-else>
        <LsPanel v-if="currentCategory === 'profile'">
          <template #header><LsSectionHeader title="角色资料" description="名称和说明帮助管理者理解角色用途，角色标识保持不变。" /></template>
          <NForm class="role-info-form" label-placement="top" @submit.prevent="routeAccess.restricted.value || saveInfo.mutate()">
            <LsFormFields>
              <LsField label="角色名称" for-id="role-detail-name" required>
                <NInput :value="routeAccess.restricted.value ? '-' : form.name" :disabled="routeAccess.restricted.value" :input-props="{ id: 'role-detail-name' }" @update:value="form.name = $event" />
              </LsField>
              <LsField label="说明" for-id="role-detail-description">
                <NInput :value="routeAccess.restricted.value ? '-' : form.description" :disabled="routeAccess.restricted.value" :input-props="{ id: 'role-detail-description' }" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" @update:value="form.description = $event" />
              </LsField>
              <LsField v-slot="{ describedBy }" label="显示顺序" for-id="role-detail-sort" hint="数字越小越靠前。">
                <NInputNumber :value="routeAccess.restricted.value ? null : form.sort" :disabled="routeAccess.restricted.value" placeholder="-" :input-props="{ 'aria-describedby': describedBy, id: 'role-detail-sort' }" :min="0" :show-button="false" @update:value="form.sort = $event" />

              </LsField>
              <LsSwitchField :model-value="routeAccess.restricted.value ? false : form.is_displayed" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" label="公开主页展示" aria-label="在公开人员资料中展示此角色" description="开启后，获得此角色的公开成员或虚拟人员会展示角色名称和说明；角色权限不会公开。" @update:model-value="form.is_displayed = $event" />
            </LsFormFields>
            <LsFormActions>
              <template #destructive>
                <LsButton variant="danger-ghost" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="remove.isPending.value" @click="deleteRole"><template #icon><Trash2 :size="17" /></template>删除角色</LsButton>
              </template>
              <LsButton type="submit" :loading="saveInfo.isPending.value" :disabled="routeAccess.restricted.value || !draft.dirty.value || !validInfo" :disabled-reason="infoDisabledReason">保存资料</LsButton>
            </LsFormActions>
          </NForm>
        </LsPanel>

        <LsPanel v-else><section class="permissions-panel">
          <LsSectionHeader :title="currentCategoryLabel" :description="currentCategory === 'advanced' ? '勾选后将授予对应范围内的全部权限；新增同范围权限也会自动生效。' : '切换分类会保留草稿，保存时统一提交全部角色权限。'"><template #aside><span v-if="permissionsDraft.dirty.value" role="status">有未保存的权限修改</span></template></LsSectionHeader>
          <LsEmptyState v-if="routeAccess.restricted.value" :access-reason="routeAccess.reason.value" title="没有可显示的权限" description="此角色暂不可用。" />
          <template v-else>
          <template v-for="group in visibleStaticGroups" :key="group.name">
              <LsCheckboxGroupField :model-value="checkedPermissions(group.items)" :label="group.name" :options="permissionOptions(group.items)" :disabled="routeAccess.restricted.value" @update:model-value="updatePermissionGroup(group.items, $event)" />
          </template>
          <template v-for="specialGroup in visibleSpecialGroups" :key="specialGroup.id">
              <div class="dynamic-editor">
                <section v-if="specialGroup.items.length" class="delegation-static" :aria-labelledby="`${specialGroup.id}-static-title`">
                  <LsSectionHeader :id="`${specialGroup.id}-static-title`" :title="`通用${specialGroup.name}`" description="通用权限与所涵盖的专门权限相冲突，保存时会自动覆盖。" :heading-level="3" />
                  <LsCheckboxGroupField :model-value="checkedPermissions(specialGroup.items)" :label="specialGroup.name" :options="permissionOptions(specialGroup.items)" :disabled="routeAccess.restricted.value" @update:model-value="updatePermissionGroup(specialGroup.items, $event)" />
                </section>
                <section class="dynamic-target" :aria-labelledby="`${specialGroup.id}-target-title`">
                  <LsSectionHeader :id="`${specialGroup.id}-target-title`" title="指定人员" description="选择人员后可配置精确权限；选择目标本身不会产生授权。" :heading-level="3"><template #aside><span v-if="selectedTarget" class="dynamic-target__status">当前目标 @{{ selectedTarget.slug }}</span></template></LsSectionHeader>
                  <div class="target-selector">
                    <label :for="`${specialGroup.id}-target-slug`">选择权限目标</label>
                    <LsEntityInput
                      :model-value="targetEntities"
                      :query="targetSlug"
                      :search-entities="searchEntities"
                      :input-id="`${specialGroup.id}-target-slug`"
                      placeholder="按名称或 slug 搜索当前团队人员"
                      @update:model-value="selectTargetEntities"
                      @update:query="targetSlug = $event"
                    />
                  </div>
                </section>
                <p class="dynamic-guidance">
                  {{ selectedTarget ? `正在为 @${selectedTarget.slug} 配置${specialGroup.name}，勾选后立即进入角色权限草稿。` : `请先选择目标人员，再配置${specialGroup.name}。` }}
                </p>
                <LsCheckboxGroupField :model-value="specialGroup.options.filter(option => option.checked).map(option => option.id)" :label="`指定人员${specialGroup.name}`" :options="targetOptions(specialGroup.options)" :disabled="routeAccess.restricted.value" @update:model-value="updateTargetPermissions(specialGroup.options, $event)" />
                <section v-if="assignedDynamicKeys(specialGroup.name).length" class="assigned-dynamic" :aria-labelledby="`${specialGroup.id}-assigned-title`">
                  <LsSectionHeader :id="`${specialGroup.id}-assigned-title`" title="已进入角色草稿" description="如需调整，请在上方重新选择对应人员。" :heading-level="3"><template #aside><span>{{ assignedDynamicKeys(specialGroup.name).length }} 项</span></template></LsSectionHeader>
                  <ul>
                    <li v-for="key in assignedDynamicKeys(specialGroup.name)" :key="key">
                      <span><strong>{{ dynamicPermissionLabel(key) }}</strong><code>{{ key }}</code></span>
                    </li>
                  </ul>
                </section>
              </div>
          </template>
          <template v-if="currentCategory === 'advanced'">
              <div class="advanced-content">
                <NInput
                  v-model:value="advancedSearch"
                  clearable
                  :input-props="{ 'aria-label': '搜索高级范围权限' }"
                  placeholder="搜索父级 Permission 或被覆盖权限"
                />
                <LsEmptyState v-if="!advancedGroups.length" title="没有匹配的高级范围权限" description="换一个关键词查看其他权限范围。" />
                <template v-else>
                  <section v-for="advancedGroup in advancedGroups" :key="advancedGroup.name" class="advanced-group">
                    <header>
                      <strong v-if="catalogGroupNames.has(advancedGroup.name)">{{ advancedGroup.name }}</strong>
                      <code v-else>{{ advancedGroup.name }}</code>
                      <span>{{ advancedGroup.items.length }} 项</span>
                    </header>
                    <div class="advanced-list">
                      <article v-for="item in advancedGroup.items" :key="item.key">
                      <NCheckbox
                        :checked="permissionKeys.includes(item.key) || Boolean(coveringParent(item.key))"
                        :disabled="Boolean(coveringParent(item.key))"
                        :aria-disabled="Boolean(coveringParent(item.key))"
                        @update:checked="togglePermission(item.key, $event)"
                      >
                        <span class="permission-copy">
                          <strong>{{ item.label }}</strong>
                          <code>{{ item.key }}</code>
                          <small v-if="coveringParent(item.key)">由 {{ coveringParent(item.key) }} 覆盖</small>
                          <small v-else>当前覆盖 {{ item.covered_keys.length }} 项；未来同前缀权限也会自动生效</small>
                        </span>
                      </NCheckbox>
                      <details>
                        <summary><ChevronDown :size="16" aria-hidden="true" />查看当前覆盖</summary>
                        <ul>
                          <li v-for="coveredKey in item.covered_keys" :key="coveredKey">
                            <span>{{ leafLabels.get(coveredKey) || coveredKey }}</span>
                            <code>{{ coveredKey }}</code>
                          </li>
                        </ul>
                      </details>
                      </article>
                    </div>
                  </section>
                </template>
              </div>
          </template>
          </template>
          <LsFormActions><LsButton :disabled="routeAccess.restricted.value || !permissionsDraft.dirty.value" :disabled-reason="permissionDisabledReason" :loading="savePermissions.isPending.value" @click="requestPermissionSave"><template #icon><Save :size="17" /></template>保存权限</LsButton></LsFormActions>
        </section></LsPanel>
        </template>
      </TeamCategoryLayout>

      <NModal
        v-model:show="showAdvancedConfirm"
        preset="card"
        title="确认授予高级范围权限"
        :mask-closable="false"
        class="advanced-confirm"
      >
        <p>以下权限会覆盖同前缀下的现有权限：</p>
        <ul>
          <li v-for="item in newlyAddedAdvanced" :key="item.key">
            <code>{{ item.key }}</code>
            <span>当前覆盖 {{ item.covered_keys.length }} 项</span>
          </li>
        </ul>
        <template #footer>
          <div class="confirm-actions">
            <LsButton variant="secondary" @click="showAdvancedConfirm = false">返回检查</LsButton>
            <LsButton :loading="savePermissions.isPending.value" @click="confirmPermissionSave">确认并保存</LsButton>
          </div>
        </template>
      </NModal>
    </div>
</template>

<style scoped>.role-info-form{display:grid;gap:1rem}

.role-detail{display:grid;gap:1.5rem}.permissions-panel{display:grid;gap:1.25rem}.advanced-group>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.saved{display:inline-flex;align-items:center;gap:.4rem;margin:0 auto 0 0;color:var(--success);font-size:.82rem;font-weight:650}.delegation-static{display:grid;gap:.75rem}.delegation-static>header{align-items:center}.dynamic-target{display:grid;border:1px solid var(--line);border-radius:10px}.dynamic-target>header{padding:1rem;background:var(--cloud);border-radius:9px 9px 0 0}.dynamic-target__status{flex:none;color:var(--sky-lost-strong);font-size:.78rem;font-weight:700}.target-selector{display:grid;gap:.45rem;padding:1rem;background:var(--cloud);border-top:1px solid var(--line);border-radius:0 0 9px 9px}.target-selector label{font-size:.8rem;font-weight:700}.permission-copy{display:grid;gap:.15rem}.permission-copy strong{font-size:.875rem}.permission-copy code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.permission-copy small{color:var(--muted-ink);font-size:.72rem}.dynamic-editor{display:grid;gap:1rem;padding-bottom:1rem}.dynamic-guidance{padding:.75rem .875rem;background:var(--cloud);border-radius:8px;color:var(--muted-ink);font-size:.8rem;line-height:1.55}.dynamic-apply{display:flex;align-items:center;justify-content:space-between;gap:1rem}.dynamic-apply p{color:var(--muted-ink);font-size:.78rem;line-height:1.5}.assigned-dynamic{display:grid;border-top:1px solid var(--line)}.assigned-dynamic>header{align-items:center;padding:.875rem 0}.assigned-dynamic>header>span{color:var(--muted-ink);font-size:.75rem}.assigned-dynamic ul{display:grid;margin:0;padding:0;border:1px solid var(--line);border-radius:8px;list-style:none}.assigned-dynamic li{padding:.65rem .75rem}.assigned-dynamic li+li{border-top:1px solid var(--line)}.assigned-dynamic li>span{display:grid;gap:.15rem}.assigned-dynamic strong{font-size:.82rem}.assigned-dynamic code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.advanced-content{display:grid;gap:1rem;padding-bottom:1rem}.advanced-group{display:grid;gap:.5rem}.advanced-group>header{min-height:36px;align-items:center}.advanced-group>header code,.advanced-group>header strong{font-size:.82rem;font-weight:700}.advanced-group>header span{color:var(--muted-ink);font-size:.75rem}.advanced-list{display:grid;overflow:hidden;border:1px solid var(--line);border-radius:8px}.advanced-list article{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:1rem;padding:.75rem;background:var(--surface)}.advanced-list article+article{border-top:1px solid var(--line)}.advanced-list details{min-width:8rem}.advanced-list summary{min-height:44px;display:flex;align-items:center;justify-content:flex-end;gap:.4rem;color:var(--text-secondary);font-size:.78rem;font-weight:500;cursor:pointer}.advanced-list summary:hover{color:var(--primary)}.advanced-list summary:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:4px}.advanced-list details[open] summary svg{transform:rotate(180deg)}.advanced-list ul{grid-column:1/-1;display:grid;gap:.45rem;margin:.35rem 0 0;padding:.65rem 0 0;border-top:1px solid var(--line);list-style:none}.advanced-list li{display:grid;grid-template-columns:minmax(8rem,.35fr) minmax(0,1fr);gap:1rem;font-size:.78rem}.advanced-list li code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.advanced-confirm{width:min(34rem,calc(100vw - 2rem))}.advanced-confirm>p{line-height:1.6}.advanced-confirm ul{display:grid;gap:.65rem;margin:1rem 0 0;padding:0;list-style:none}.advanced-confirm li{display:grid;gap:.2rem;padding:.65rem .75rem;background:var(--cloud);border-radius:8px}.advanced-confirm li code{overflow-wrap:anywhere}.advanced-confirm li span{color:var(--muted-ink);font-size:.78rem}.confirm-actions{display:flex;justify-content:flex-end;gap:.75rem}
.dynamic-target{gap:.75rem;padding:.875rem;background:var(--cloud);border:0;border-radius:8px}
.dynamic-target>header{padding:0;background:transparent;border-radius:0}

.target-selector{padding:0;background:transparent;border:0;border-radius:0}
@media(max-width:639px){.advanced-group>header,.dynamic-apply{align-items:stretch;flex-direction:column}.advanced-list article{align-items:stretch;grid-template-columns:1fr}.advanced-list details{min-width:0}.advanced-list summary{justify-content:flex-start}.advanced-list li{grid-template-columns:1fr;gap:.2rem}.confirm-actions{flex-direction:column-reverse}}
</style>
