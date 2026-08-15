<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Save, Trash2 } from '@lucide/vue'
import {
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
} from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { coveringPermission, permissionsForSave, selectPermissionScope } from '../lib/permissionHierarchy'

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
type SpecialPermissionGroup = '实体（Entity）管理' | '实体（Entity）委托'
type DynamicPermissionId = 'manage' | 'field-manage' | 'assume'
interface DynamicPermissionDefinition {
  id: DynamicPermissionId
  label: string
  template: string
  virtualOnly: boolean
  group: SpecialPermissionGroup
}

const dynamicPermissionDefinitions: DynamicPermissionDefinition[] = [
  { id: 'manage', label: '管理指定虚拟实体（Virtual Entity）', template: 'team.entity.virtual.<slug>.manage', virtualOnly: true, group: '实体（Entity）管理' },
  { id: 'field-manage', label: '管理指定虚拟实体（Virtual Entity）字段', template: 'team.entity.virtual.<slug>.field.manage', virtualOnly: true, group: '实体（Entity）管理' },
  { id: 'assume', label: '领取指定实体（Entity）身份', template: 'identity.<type>.<slug>.assume', virtualOnly: false, group: '实体（Entity）委托' },
]
const entityDelegationGroupName = '实体（Entity）委托'
const entityManagementGroupName = '实体（Entity）管理'

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const roleId = computed(() => Number(route.params.id))
const form = reactive({ name: '', description: '', sort: 0, is_displayed: false })
const permissionKeys = ref<string[]>([])
const initialPermissionKeys = ref<string[]>([])
const dynamicAdvancedItems = ref<AdvancedPermissionItem[]>([])
const advancedSearch = ref('')
const showAdvancedConfirm = ref(false)
const pendingPermissionKeys = ref<string[]>([])
const targetSlug = ref('')
const targetEntities = ref<EntityDisplay[]>([])

const roleQuery = useQuery({
  queryKey: computed(() => ['role', roleId.value]),
  queryFn: () => api.get<RoleRecord>('/role/get', { id: roleId.value }),
  enabled: computed(() => roleId.value > 0),
})
const permissionsQuery = useQuery({
  queryKey: computed(() => ['role-permissions', roleId.value]),
  queryFn: () => api.get<Array<{ permission_key?: string; key?: string }>>('/rolePermission/index', { role_id: roleId.value }),
  enabled: computed(() => roleId.value > 0),
})
const catalogQuery = useQuery({
  queryKey: ['role-permission-catalog'],
  queryFn: () => api.get<PermissionCatalog>('/rolePermission/catalog'),
})
const groups = computed(() => Array.isArray(catalogQuery.data.value?.groups) ? catalogQuery.data.value.groups : [])
const catalogGroupNames = computed(() => new Set(groups.value.map(group => group.name)))
const staticGroups = computed(() => groups.value.map(group => ({
  ...group,
  items: group.items.filter(item => !isDynamicLeafPermission(item.key)),
})).filter(group => ![entityManagementGroupName, entityDelegationGroupName].includes(group.name) && group.items.length))
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
        label: `覆盖 ${key} 下全部权限（Permission）`,
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
const specialPermissionGroups = computed(() => ([entityManagementGroupName, entityDelegationGroupName] as SpecialPermissionGroup[]).map(name => {
  const group = groups.value.find(candidate => candidate.name === name)
  return {
    id: name === entityManagementGroupName ? 'entity-management' : 'entity-delegation',
    name,
    items: group?.items.filter(item => !isDynamicLeafPermission(item.key)) ?? [],
    options: dynamicOptions.value.filter(option => option.group === name),
  }
}))

watch(() => roleQuery.data.value, (role) => {
  if (!role) return
  form.name = String(role.name ?? '')
  form.description = String(role.description ?? '')
  form.sort = Number(role.sort ?? 0)
  form.is_displayed = Number(role.is_displayed ?? 0) === 1
}, { immediate: true })
watch(() => permissionsQuery.data.value, (items) => {
  if (!items) return
  const keys = items.map(item => String(item.permission_key ?? item.key ?? '')).filter(Boolean)
  permissionKeys.value = keys
  initialPermissionKeys.value = [...keys]
}, { immediate: true })

const saveInfo = useMutation({
  mutationFn: () => api.post('/role/edit', {
    id: roleId.value,
    name: form.name.trim(),
    description: form.description.trim() || null,
    sort: Number(form.sort),
    is_displayed: form.is_displayed ? 1 : 0,
  }),
  onSuccess: async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['role', roleId.value] }),
      client.invalidateQueries({ queryKey: ['roles'] }),
    ])
    feedback.success('角色资料已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const savePermissions = useMutation({
  mutationFn: (keys: string[]) => api.post('/rolePermission/save', {
    role_id: roleId.value,
    permission_keys: keys,
  }),
  onSuccess: (_data, keys) => {
    permissionKeys.value = [...keys]
    initialPermissionKeys.value = [...keys]
    pendingPermissionKeys.value = []
    showAdvancedConfirm.value = false
    feedback.success('角色权限（Permission）已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const remove = useMutation({
  mutationFn: () => api.post('/role/delete', { id: roleId.value }),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['roles'] })
    feedback.success('角色已删除')
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
function selectedCount(items: PermissionItem[]) {
  return items.filter(item => permissionKeys.value.includes(item.key) || coveringParent(item.key)).length
}
function requestPermissionSave() {
  pendingPermissionKeys.value = permissionsForSave(permissionKeys.value)
  if (newlyAddedAdvanced.value.length) showAdvancedConfirm.value = true
  else savePermissions.mutate([...pendingPermissionKeys.value])
}
function confirmPermissionSave() {
  savePermissions.mutate([...pendingPermissionKeys.value])
}
function deleteRole() {
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
  return /^team\.entity\.virtual\.[a-z0-9][a-z0-9_-]{0,49}\.(?:manage|field\.manage)$/.test(key)
    || /^identity\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}\.assume$/.test(key)
}
function dynamicPermissionGroup(key: string): SpecialPermissionGroup | null {
  if (/^team\.entity(?:\.|$)/.test(key)) return entityManagementGroupName
  if (/^identity(?:\.|$)/.test(key)) return entityDelegationGroupName
  return null
}
function assignedDynamicKeys(group: string) {
  return permissionKeys.value.filter(key => isDynamicLeafPermission(key) && dynamicPermissionGroup(key) === group)
}
function configuredSpecialCount(group: string) {
  return permissionKeys.value.filter(key => leafGroups.value.get(key) === group || dynamicPermissionGroup(key) === group).length
}
function dynamicPermissionKey(definition: DynamicPermissionDefinition, entity: EntityDisplay): string | null {
  if (definition.virtualOnly) {
    if (entity.type !== 'teamVirtual') return null
    const action = definition.id === 'field-manage' ? 'field.manage' : definition.id
    return `team.entity.virtual.${entity.slug}.${action}`
  }
  const type = ({ teamMember: 'member', teamCustomer: 'customer', teamVirtual: 'virtual' } as const)[entity.type as Exclude<EntityType, 'team'>]
  return type ? `identity.${type}.${entity.slug}.assume` : null
}
function toggleDynamicPermission(key: string | null, checked: boolean) {
  if (!key) return
  togglePermission(key, checked)
  if (checked && key.startsWith('identity.') && key.endsWith('.assume')) {
    const parent = key.replace(/\.assume$/, '')
    if (!dynamicAdvancedItems.value.some(item => item.key === parent)) {
      dynamicAdvancedItems.value.push({ key: parent, label: `覆盖 ${parent} 下全部权限（Permission）`, covered_keys: [key] })
    }
  }
}
function dynamicPermissionLabel(key: string) {
  return leafLabels.value.get(key)
    || (key.endsWith('.field.manage') ? '管理指定虚拟实体（Virtual Entity）字段'
      : key.endsWith('.manage') ? '管理指定虚拟实体（Virtual Entity）'
        : '领取指定实体（Entity）身份')
}
</script>

<template>
    <div class="role-detail">
      <AdminPageHeader
        :title="roleQuery.data.value?.name || '编辑角色权限（Permission）'"
        :description="roleQuery.data.value?.role_key ? `角色标识：${roleQuery.data.value.role_key}` : '维护角色资料与最小权限（Permission）集合。'"
        back-to="/roles"
        back-label="返回角色列表"
      />

      <LsInlineError v-if="requestError" :message="friendlyError(requestError)" />
      <LsAsyncState v-if="pending" state="loading" :rows="7" />

      <template v-else>
        <LsPanel>
          <template #header><header>
            <div><h3>角色资料</h3><p>名称和说明帮助管理者理解角色用途，角色标识保持不变。</p></div>
          </header></template>
          <NForm label-placement="top" @submit.prevent="saveInfo.mutate()">
            <NFormItem label="角色名称" required>
              <NInput v-model:value="form.name" aria-label="角色名称" />
            </NFormItem>
            <NFormItem label="说明">
              <NInput v-model:value="form.description" aria-label="说明" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" />
            </NFormItem>
            <NFormItem label="显示顺序">
              <NInputNumber v-model:value="form.sort" aria-label="显示顺序" :min="0" :show-button="false" />
              <template #feedback>数字越小越靠前。</template>
            </NFormItem>
            <LsSwitchField v-model="form.is_displayed" label="公开主页展示" aria-label="在公开实体（Entity）资料中展示此角色" description="开启后，获得此角色的公开成员或虚拟实体（Virtual Entity）会展示角色名称和说明；角色权限（Permission）不会公开。" />
            <footer>
              <LsButton variant="danger" :loading="remove.isPending.value" @click="deleteRole"><template #icon><Trash2 :size="17" /></template>删除角色</LsButton>
              <LsButton type="submit" :loading="saveInfo.isPending.value" :disabled="!form.name.trim()"><template #icon><Save :size="17" /></template>保存资料</LsButton>
            </footer>
          </NForm>
        </LsPanel>

        <LsPanel><section class="permissions-panel">
          <header>
            <div><h3>角色权限（Permission）</h3><p>权限（Permission）按工作领域折叠展示，展开需要调整的分组即可。</p></div>
            <LsButton :loading="savePermissions.isPending.value" @click="requestPermissionSave">保存权限（Permission）</LsButton>
          </header>

          <NCollapse class="permission-groups" arrow-placement="right">
            <NCollapseItem
              v-for="group in staticGroups"
              :key="group.name"
              :name="group.name"
              :title="`${group.name} · 已选择 ${selectedCount(group.items)}/${group.items.length}`"
            >
              <div class="permission-list">
                <NCheckbox
                  v-for="item in group.items"
                  :key="item.key"
                  :checked="permissionKeys.includes(item.key) || Boolean(coveringParent(item.key))"
                  :disabled="Boolean(coveringParent(item.key))"
                  :aria-disabled="Boolean(coveringParent(item.key))"
                  @update:checked="togglePermission(item.key, $event)"
                >
                  <span class="permission-copy">
                    <strong>{{ item.label }}</strong>
                    <code>{{ item.key }}</code>
                    <small v-if="coveringParent(item.key)">由 {{ coveringParent(item.key) }} 覆盖</small>
                  </span>
                </NCheckbox>
              </div>
            </NCollapseItem>
            <NCollapseItem
              v-for="specialGroup in specialPermissionGroups"
              :key="specialGroup.id"
              :name="specialGroup.id"
              :title="`${specialGroup.name} · 已配置 ${configuredSpecialCount(specialGroup.name)} 项`"
            >
              <div class="dynamic-editor">
                <section v-if="specialGroup.items.length" class="delegation-static" :aria-labelledby="`${specialGroup.id}-static-title`">
                  <header>
                    <div>
                      <h4 :id="`${specialGroup.id}-static-title`">通用{{ specialGroup.name }}</h4>
                      <p>通配 Permission 覆盖一类实体（Entity）；保存时会移除已被覆盖的指定 slug。</p>
                    </div>
                  </header>
                  <div class="permission-list">
                    <NCheckbox
                      v-for="item in specialGroup.items"
                      :key="item.key"
                      :checked="permissionKeys.includes(item.key) || Boolean(coveringParent(item.key))"
                      :disabled="Boolean(coveringParent(item.key))"
                      :aria-disabled="Boolean(coveringParent(item.key))"
                      @update:checked="togglePermission(item.key, $event)"
                    >
                      <span class="permission-copy">
                        <strong>{{ item.label }}</strong>
                        <code>{{ item.key }}</code>
                        <small v-if="coveringParent(item.key)">由 {{ coveringParent(item.key) }} 覆盖</small>
                      </span>
                    </NCheckbox>
                  </div>
                </section>
                <section class="dynamic-target" :aria-labelledby="`${specialGroup.id}-target-title`">
                  <header>
                    <div>
                      <h4 :id="`${specialGroup.id}-target-title`">指定实体（Entity）</h4>
                      <p>选择实体（Entity）后可配置精确权限（Permission）；选择目标本身不会产生授权。</p>
                    </div>
                    <span v-if="selectedTarget" class="dynamic-target__status">当前目标 @{{ selectedTarget.slug }}</span>
                  </header>
                  <div class="target-selector">
                    <label :for="`${specialGroup.id}-target-slug`">选择权限（Permission）目标</label>
                    <LsEntityInput
                      :model-value="targetEntities"
                      :query="targetSlug"
                      :search-entities="searchEntities"
                      :input-id="`${specialGroup.id}-target-slug`"
                      placeholder="按名称或 slug 搜索当前团队实体（Team Entity）"
                      @update:model-value="selectTargetEntities"
                      @update:query="targetSlug = $event"
                    />
                  </div>
                </section>
                <p class="dynamic-guidance">
                  {{ selectedTarget ? `正在为 @${selectedTarget.slug} 配置${specialGroup.name}，勾选后立即进入角色权限（Permission）草稿。` : `请先选择目标实体（Entity），再配置${specialGroup.name}。` }}
                </p>
                <div class="permission-list dynamic-permission-list">
                  <NCheckbox
                    v-for="option in specialGroup.options"
                    :key="option.id"
                    :checked="option.checked"
                    :disabled="option.disabled"
                    :aria-disabled="option.disabled"
                    @update:checked="toggleDynamicPermission(option.key, $event)"
                  >
                    <span class="permission-copy">
                      <strong>{{ option.label }}</strong>
                      <code>{{ option.key || option.template }}</code>
                      <small v-if="option.coveredBy">由 {{ option.coveredBy }} 覆盖</small>
                      <small v-else-if="!selectedTarget">先选择目标实体（Entity）</small>
                      <small v-else-if="!option.key">仅适用于虚拟实体（Virtual Entity）</small>
                    </span>
                  </NCheckbox>
                </div>
                <section v-if="assignedDynamicKeys(specialGroup.name).length" class="assigned-dynamic" :aria-labelledby="`${specialGroup.id}-assigned-title`">
                  <header>
                    <div>
                      <h4 :id="`${specialGroup.id}-assigned-title`">已进入角色草稿</h4>
                      <p>如需调整，请在上方重新选择对应实体（Entity）。</p>
                    </div>
                    <span>{{ assignedDynamicKeys(specialGroup.name).length }} 项</span>
                  </header>
                  <ul>
                    <li v-for="key in assignedDynamicKeys(specialGroup.name)" :key="key">
                      <span><strong>{{ dynamicPermissionLabel(key) }}</strong><code>{{ key }}</code></span>
                    </li>
                  </ul>
                </section>
              </div>
            </NCollapseItem>
          </NCollapse>

          <NCollapse class="advanced-permissions" arrow-placement="right">
            <NCollapseItem name="advanced" title="高级范围权限（Permission）">
              <div class="advanced-content">
                <p class="advanced-warning">父级 Permission 会覆盖当前及未来新增的同前缀子权限（Permission）。只在职责边界稳定、确实需要整段授权时使用。</p>
                <NInput
                  v-model:value="advancedSearch"
                  clearable
                  :input-props="{ 'aria-label': '搜索高级范围权限（Permission）' }"
                  placeholder="搜索父级 Permission 或被覆盖权限（Permission）"
                />
                <p v-if="!advancedGroups.length" class="advanced-empty">没有匹配的高级范围权限（Permission）。</p>
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
                          <small v-else>当前覆盖 {{ item.covered_keys.length }} 项；未来同前缀权限（Permission）也会自动生效</small>
                        </span>
                      </NCheckbox>
                      <details>
                        <summary>查看当前覆盖</summary>
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
            </NCollapseItem>
          </NCollapse>
        </section></LsPanel>
      </template>

      <NModal
        v-model:show="showAdvancedConfirm"
        preset="card"
        title="确认授予高级范围权限（Permission）"
        :mask-closable="false"
        class="advanced-confirm"
      >
        <p>以下父级 Permission 会同时覆盖当前列出的权限（Permission），以及未来新增的同前缀权限（Permission）：</p>
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

<style scoped>
.role-detail{display:grid;gap:1.5rem}.permissions-panel{display:grid;gap:1.25rem}.role-detail header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.role-detail h3,.role-detail h4,.role-detail p{margin:0}.role-detail h3{font-size:1.05rem}.role-detail header p{max-width:65ch;margin-top:.3rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.role-detail :deep(.n-form-item-label){font-weight:650}.role-detail :deep(.n-input-number){width:100%}.role-detail footer{display:flex;align-items:center;justify-content:flex-end;gap:.75rem;padding-top:.25rem}.saved{display:inline-flex;align-items:center;gap:.4rem;margin:0 auto 0 0;color:var(--success);font-size:.82rem;font-weight:650}.delegation-static{display:grid;gap:.75rem}.delegation-static>header{align-items:center}.delegation-static h4{font-size:.9rem}.dynamic-target{display:grid;border:1px solid var(--line);border-radius:10px}.dynamic-target>header{padding:1rem;background:var(--cloud);border-radius:9px 9px 0 0}.dynamic-target h4{font-size:.95rem}.dynamic-target__status{flex:none;color:var(--sky-lost-strong);font-size:.78rem;font-weight:700}.target-selector{display:grid;gap:.45rem;padding:1rem;background:var(--cloud);border-top:1px solid var(--line);border-radius:0 0 9px 9px}.target-selector label{font-size:.8rem;font-weight:700}.permission-groups{border-top:1px solid var(--line)}.permission-groups :deep(.n-collapse-item){margin:0;border-bottom:1px solid var(--line)}.permission-groups :deep(.n-collapse-item__header){min-height:56px;padding:0}.permission-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1px;margin-bottom:1rem;overflow:hidden;background:var(--line);border:1px solid var(--line);border-radius:8px}.permission-list :deep(.n-checkbox){min-height:58px;align-items:center;padding:.65rem .75rem;background:white}.permission-list :deep(.n-checkbox:hover){background:var(--cloud)}.permission-list :deep(.n-checkbox.n-checkbox--disabled){opacity:1}.permission-copy{display:grid;gap:.15rem}.permission-copy strong{font-size:.875rem}.permission-copy code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.permission-copy small{color:var(--muted-ink);font-size:.72rem}.dynamic-editor{display:grid;gap:1rem;padding-bottom:1rem}.dynamic-guidance{padding:.75rem .875rem;background:var(--cloud);border-radius:8px;color:var(--muted-ink);font-size:.8rem;line-height:1.55}.dynamic-permission-list{margin-bottom:0}.dynamic-apply{display:flex;align-items:center;justify-content:space-between;gap:1rem}.dynamic-apply p{color:var(--muted-ink);font-size:.78rem;line-height:1.5}.assigned-dynamic{display:grid;border-top:1px solid var(--line)}.assigned-dynamic>header{align-items:center;padding:.875rem 0}.assigned-dynamic h4{font-size:.875rem}.assigned-dynamic>header>span{color:var(--muted-ink);font-size:.75rem}.assigned-dynamic ul{display:grid;margin:0;padding:0;border:1px solid var(--line);border-radius:8px;list-style:none}.assigned-dynamic li{padding:.65rem .75rem}.assigned-dynamic li+li{border-top:1px solid var(--line)}.assigned-dynamic li>span{display:grid;gap:.15rem}.assigned-dynamic strong{font-size:.82rem}.assigned-dynamic code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.advanced-permissions{border-top:1px solid var(--line)}.advanced-permissions :deep(.n-collapse-item__header){min-height:56px;padding:0}.advanced-content{display:grid;gap:1rem;padding-bottom:1rem}.advanced-warning{padding:.875rem;color:color-mix(in oklch,var(--warning),black 38%);background:color-mix(in oklch,var(--warning),white 91%);border-radius:8px;font-size:.82rem;line-height:1.6}.advanced-empty{padding:1rem;color:var(--muted-ink);text-align:center}.advanced-group{display:grid;gap:.5rem}.advanced-group>header{min-height:36px;align-items:center}.advanced-group>header code,.advanced-group>header strong{font-size:.82rem;font-weight:700}.advanced-group>header span{color:var(--muted-ink);font-size:.75rem}.advanced-list{display:grid;overflow:hidden;border:1px solid var(--line);border-radius:8px}.advanced-list article{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:1rem;padding:.75rem;background:white}.advanced-list article+article{border-top:1px solid var(--line)}.advanced-list :deep(.n-checkbox){min-height:44px;align-items:flex-start}.advanced-list :deep(.n-checkbox.n-checkbox--disabled){opacity:1}.advanced-list details{min-width:8rem}.advanced-list summary{min-height:44px;display:flex;align-items:center;justify-content:flex-end;color:var(--sky-lost-strong);font-size:.78rem;font-weight:650;cursor:pointer}.advanced-list ul{grid-column:1/-1;display:grid;gap:.45rem;margin:.35rem 0 0;padding:.65rem 0 0;border-top:1px solid var(--line);list-style:none}.advanced-list li{display:grid;grid-template-columns:minmax(8rem,.35fr) minmax(0,1fr);gap:1rem;font-size:.78rem}.advanced-list li code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.advanced-confirm{width:min(34rem,calc(100vw - 2rem))}.advanced-confirm>p{line-height:1.6}.advanced-confirm ul{display:grid;gap:.65rem;margin:1rem 0 0;padding:0;list-style:none}.advanced-confirm li{display:grid;gap:.2rem;padding:.65rem .75rem;background:var(--cloud);border-radius:8px}.advanced-confirm li code{overflow-wrap:anywhere}.advanced-confirm li span{color:var(--muted-ink);font-size:.78rem}.confirm-actions{display:flex;justify-content:flex-end;gap:.75rem}
.dynamic-target{gap:.75rem;padding:.875rem;background:var(--cloud);border:0;border-radius:8px}
.dynamic-target>header{padding:0;background:transparent;border-radius:0}
.dynamic-target h4{font-size:.9rem}
.target-selector{padding:0;background:transparent;border:0;border-radius:0}
@media(max-width:639px){.role-detail header,.role-detail footer{align-items:stretch;flex-direction:column}.role-detail header :deep(.n-button),.role-detail footer :deep(.n-button){width:100%}.role-detail footer .saved{margin:0}.permission-list{grid-template-columns:1fr}.dynamic-apply{align-items:stretch;flex-direction:column}.dynamic-apply :deep(.n-button){width:100%}.advanced-list article{align-items:stretch;grid-template-columns:1fr}.advanced-list details{min-width:0}.advanced-list summary{justify-content:flex-start}.advanced-list li{grid-template-columns:1fr;gap:.2rem}.confirm-actions{flex-direction:column-reverse}.confirm-actions :deep(.n-button){width:100%}}
</style>
