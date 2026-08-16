<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { NCollapse, NCollapseItem, NEmpty } from 'naive-ui'
import { computed, ref, watch } from 'vue'

export interface PermissionRecord { permission_key?: string }
export interface RoleRecord {
  id: number
  name?: string
  role_key?: string
  description?: string
  permissions?: PermissionRecord[]
}
export interface RoleAssignment { role_id?: number; role?: RoleRecord }
export interface EffectivePermission { key: string; label?: string; group?: string }
export interface PermissionGroup { name: string; items: Array<{ key: string; label: string }> }
export interface AdvancedPermissionItem { key: string; label: string; covered_keys: string[] }

const props = withDefaults(defineProps<{
  assignments?: RoleAssignment[]
  roles?: RoleRecord[]
  effectivePermissions?: EffectivePermission[]
  catalog?: PermissionGroup[]
  advancedCatalog?: AdvancedPermissionItem[]
  canEdit?: boolean
  loading?: boolean
  saving?: boolean
  error?: unknown
  success?: boolean
}>(), {
  assignments: () => [],
  roles: () => [],
  effectivePermissions: () => [],
  catalog: () => [],
  advancedCatalog: () => [],
  canEdit: false,
  loading: false,
  saving: false,
  success: false,
})

const emit = defineEmits<{ save: [roleIds: number[]]; dirty: [value: boolean] }>()
const selected = ref<number[]>([])
const snapshot = ref('')
const isDirty = computed(() => JSON.stringify([...selected.value].sort((a, b) => a - b)) !== snapshot.value)
const roleOptions = computed(() => props.roles.map(role => ({
  value: Number(role.id),
  label: role.name || `角色 #${role.id}`,
  meta: role.role_key,
  description: role.description || undefined,
})))

watch(() => props.assignments, assignments => {
  selected.value = assignments.map(item => Number(item.role_id ?? item.role?.id)).filter(Boolean)
  snapshot.value = JSON.stringify([...selected.value].sort((a, b) => a - b))
  emit('dirty', false)
}, { immediate: true, deep: true })
watch(selected, () => emit('dirty', isDirty.value), { deep: true })
watch(() => props.success, success => {
  if (!success) return
  snapshot.value = JSON.stringify([...selected.value].sort((a, b) => a - b))
  emit('dirty', false)
})

const assignedRoles = computed(() => props.canEdit
  ? props.roles.filter(role => selected.value.includes(Number(role.id)))
  : props.assignments
      .map(item => props.roles.find(role => Number(role.id) === Number(item.role_id ?? item.role?.id)) ?? item.role)
      .filter((role): role is RoleRecord => Boolean(role)))

const labelMap = computed(() => {
  const result = new Map<string, { label: string; group: string }>()
  for (const group of props.catalog) {
    for (const item of group.items) result.set(item.key, { label: item.label, group: group.name })
  }
  for (const item of props.advancedCatalog) {
    const groups = new Set(item.covered_keys.map(key => result.get(key)?.group).filter(Boolean))
    const group = groups.size === 1 ? [...groups][0]! : '高级范围'
    result.set(item.key, { label: item.label, group })
  }
  return result
})
const advancedKeys = computed(() => new Set(props.advancedCatalog.map(item => item.key)))

function permissionMetadata(key: string) {
  const known = labelMap.value.get(key)
  if (known) return known
  if (/^team\.entity\.virtual\.[a-z0-9][a-z0-9_-]{0,49}(?:\.field)?$/.test(key)) {
    return { label: `覆盖 ${key} 下全部权限`, group: '实体管理' }
  }
  if (/^identity\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}$/.test(key)) {
    return { label: `覆盖 ${key} 下全部权限`, group: '实体委托' }
  }
  if (/^chat\.virtual\.[a-z0-9][a-z0-9_-]{0,49}$/.test(key)) {
    return { label: `覆盖 ${key} 下全部权限`, group: '聊天' }
  }
  if (/^identity\.(?:member|customer|virtual)\.(?:\*|[a-z0-9][a-z0-9_-]{0,49})\.assume$/.test(key)) {
    return { label: key, group: '实体委托' }
  }
  if (/^chat\.virtual\.(?:\*|[a-z0-9][a-z0-9_-]{0,49})\.act$/.test(key)) {
    return { label: key, group: '聊天' }
  }
  if (/^team\.entity\.virtual\.[a-z0-9][a-z0-9_-]{0,49}\.(?:manage|field\.manage)$/.test(key)) {
    return { label: key, group: '实体管理' }
  }
  return { label: key, group: '动态权限' }
}

function isAdvancedPermission(permission: EffectivePermission) {
  return permission.group === '高级范围'
    || advancedKeys.value.has(permission.key)
    || (/^identity\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}$/.test(permission.key))
    || (/^chat\.virtual\.[a-z0-9][a-z0-9_-]{0,49}$/.test(permission.key))
    || (/^team\.entity\.virtual\.[a-z0-9][a-z0-9_-]{0,49}(?:\.field)?$/.test(permission.key))
}

const permissions = computed<EffectivePermission[]>(() => {
  if (!props.canEdit) return props.effectivePermissions
  const result: EffectivePermission[] = []
  for (const role of assignedRoles.value) {
    for (const permission of role.permissions ?? []) {
      if (permission.permission_key) {
        result.push({ key: permission.permission_key, ...permissionMetadata(permission.permission_key) })
      }
    }
  }
  return result
})

const groupedPermissions = computed(() => {
  const groups = new Map<string, EffectivePermission[]>()
  for (const permission of permissions.value) {
    const group = permission.group || '其他权限'
    groups.set(group, [...(groups.get(group) ?? []), permission])
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }))
})

</script>

<template>
  <LsPanel><section class="permissions-card" aria-labelledby="entity-permissions-title">
    <header>
      <div>
        <h2 id="entity-permissions-title">角色与权限</h2>
        <p>{{ canEdit ? '角色决定该实体（Entity）在当前团队能够执行的操作。' : '以下按当前团队分配角色中的权限（Permission）记录逐条展示。' }}</p>
      </div>
      <LsButton v-if="canEdit" class="permissions-save" variant="secondary" :loading="saving" :disabled="loading || !isDirty" @click="emit('save', selected)">
        保存角色
      </LsButton>
    </header>

    <p v-if="loading" class="state">正在读取角色与权限…</p>
    <template v-else>
      <LsCheckboxGroupField
        v-if="canEdit && roles.length"
        v-model="selected"
        label="可分配角色"
        :options="roleOptions"
      />
      <div v-else-if="assignedRoles.length" class="role-summary">
        <span v-for="role in assignedRoles" :key="role.id">
          <strong>{{ role.name || `角色 #${role.id}` }}</strong>
          <small>{{ role.description || role.role_key || '暂无说明' }}</small>
        </span>
      </div>
      <NEmpty v-else description="当前实体尚未分配角色" />

      <div class="effective">
        <div class="effective-heading">
          <h3>有效权限</h3>
          <span>{{ permissions.length }} 项</span>
        </div>
        <NCollapse v-if="groupedPermissions.length" class="permission-groups">
          <NCollapseItem v-for="group in groupedPermissions" :key="group.name" :title="group.name" :name="group.name">
            <ul>
              <li v-for="(permission, index) in group.items" :key="`${permission.key}-${index}`">
                <span class="permission-label">
                  {{ permission.label || permission.key }}
                  <small v-if="isAdvancedPermission(permission)">高级范围</small>
                </span>
                <code>{{ permission.key }}</code>
              </li>
            </ul>
          </NCollapseItem>
        </NCollapse>
        <p v-else class="state">当前角色没有授予业务权限。</p>
      </div>
    </template>

    <LsInlineError v-if="error" :message="friendlyError(error)" />
  </section></LsPanel>
</template>

<style scoped>
.permissions-card{min-width:0;display:grid;gap:1rem}.permissions-card>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.permissions-card h2,.permissions-card h3,.permissions-card p{margin:0}.permissions-card h2{font-size:1.05rem}.permissions-card header p{max-width:65ch;margin-top:.25rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.role-summary{display:flex;flex-wrap:wrap;gap:.5rem}.role-summary>span{min-width:10rem;display:grid;gap:.25rem;padding:.75rem;background:var(--cloud);border-radius:8px}.role-summary small{color:var(--muted-ink);font-size:.75rem}.effective{min-width:0;display:grid;gap:.75rem;padding-top:.25rem;border-top:1px solid var(--line)}.effective-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:.75rem}.effective h3{font-size:.92rem}.effective-heading>span{color:var(--muted-ink);font-size:.78rem}.permission-groups{min-width:0}.effective :deep(.n-collapse-item){min-width:0}.effective :deep(.n-collapse-item__header){min-height:48px}.effective ul{display:grid;gap:.5rem;margin:0 0 1rem;padding:0;list-style:none}.effective li{display:grid;grid-template-columns:minmax(8rem,.35fr) minmax(0,1fr);gap:1rem;padding:.5rem 0;border-bottom:1px solid var(--line);font-size:.82rem}.permission-label{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}.permission-label small{padding:.15rem .4rem;color:color-mix(in oklch,var(--warning),black 35%);background:color-mix(in oklch,var(--warning),white 90%);border-radius:999px;font-size:.68rem;font-weight:700}.effective code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.75rem}.state{padding:1rem;color:var(--muted-ink);background:var(--cloud);border-radius:8px;text-align:center}
@media(max-width:639px){.permissions-card>header{align-items:stretch;flex-direction:column}.permissions-save{width:100%}.effective li{grid-template-columns:1fr;gap:.25rem}}
</style>
