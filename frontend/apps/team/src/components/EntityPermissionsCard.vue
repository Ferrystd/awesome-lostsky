<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { NCheckbox, NCollapse, NCollapseItem, NEmpty } from 'naive-ui'
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

const props = withDefaults(defineProps<{
  assignments?: RoleAssignment[]
  roles?: RoleRecord[]
  effectivePermissions?: EffectivePermission[]
  catalog?: PermissionGroup[]
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
  canEdit: false,
  loading: false,
  saving: false,
  success: false,
})

const emit = defineEmits<{ save: [roleIds: number[]]; dirty: [value: boolean] }>()
const selected = ref<number[]>([])
const snapshot = ref('')
const isDirty = computed(() => JSON.stringify([...selected.value].sort((a, b) => a - b)) !== snapshot.value)

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
  return result
})

const permissions = computed<EffectivePermission[]>(() => {
  if (!props.canEdit && props.effectivePermissions.length) return props.effectivePermissions
  const keys = new Set<string>()
  for (const role of assignedRoles.value) {
    for (const permission of role.permissions ?? []) {
      if (permission.permission_key) keys.add(permission.permission_key)
    }
  }
  return [...keys].sort().map(key => ({
    key,
    label: labelMap.value.get(key)?.label ?? key,
    group: labelMap.value.get(key)?.group ?? '动态权限',
  }))
})

const groupedPermissions = computed(() => {
  const groups = new Map<string, EffectivePermission[]>()
  for (const permission of permissions.value) {
    const group = permission.group || '其他权限'
    groups.set(group, [...(groups.get(group) ?? []), permission])
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }))
})

function toggle(id: number, checked: boolean) {
  selected.value = checked
    ? [...new Set([...selected.value, id])]
    : selected.value.filter(item => item !== id)
}
</script>

<template>
  <section class="permissions-card" aria-labelledby="entity-permissions-title">
    <header>
      <div>
        <h2 id="entity-permissions-title">角色与权限</h2>
        <p>{{ canEdit ? '角色决定该实体在当前团队能够执行的操作。' : '以下权限由当前团队分配的角色合并得出。' }}</p>
      </div>
      <LsButton v-if="canEdit" variant="secondary" :loading="saving" :disabled="loading || !isDirty" @click="emit('save', selected)">
        保存角色
      </LsButton>
    </header>

    <p v-if="loading" class="state">正在读取角色与权限…</p>
    <template v-else>
      <div v-if="canEdit && roles.length" class="role-options" aria-label="可分配角色">
        <NCheckbox
          v-for="role in roles"
          :key="role.id"
          :checked="selected.includes(Number(role.id))"
          @update:checked="toggle(Number(role.id), $event)"
        >
          <span>
            <strong>{{ role.name || `角色 #${role.id}` }}</strong>
            <small>{{ role.description || role.role_key || '暂无说明' }}</small>
          </span>
        </NCheckbox>
      </div>
      <div v-else-if="assignedRoles.length" class="role-summary">
        <span v-for="role in assignedRoles" :key="role.id">
          <strong>{{ role.name || `角色 #${role.id}` }}</strong>
          <small>{{ role.description || role.role_key || '暂无说明' }}</small>
        </span>
      </div>
      <NEmpty v-else description="当前实体尚未分配角色" />

      <div class="effective">
        <div>
          <h3>有效权限</h3>
          <span>{{ permissions.length }} 项</span>
        </div>
        <NCollapse v-if="groupedPermissions.length">
          <NCollapseItem v-for="group in groupedPermissions" :key="group.name" :title="group.name" :name="group.name">
            <ul>
              <li v-for="permission in group.items" :key="permission.key">
                <span>{{ permission.label || permission.key }}</span>
                <code>{{ permission.key }}</code>
              </li>
            </ul>
          </NCollapseItem>
        </NCollapse>
        <p v-else class="state">当前角色没有授予业务权限。</p>
      </div>
    </template>

    <p v-if="error" class="feedback error" role="alert">{{ friendlyError(error) }}</p>
  </section>
</template>

<style scoped>
.permissions-card{display:grid;gap:1rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}.permissions-card>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.permissions-card h2,.permissions-card h3,.permissions-card p{margin:0}.permissions-card h2{font-size:1.05rem}.permissions-card header p{max-width:65ch;margin-top:.3rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.role-options{display:grid;overflow:hidden;border:1px solid var(--line);border-radius:8px}.role-options :deep(.n-checkbox){min-height:60px;align-items:center;padding:.65rem .75rem;border-bottom:1px solid var(--line)}.role-options :deep(.n-checkbox:last-child){border-bottom:0}.role-options span,.role-summary>span{display:grid;gap:.18rem}.role-options small,.role-summary small{color:var(--muted-ink);font-size:.75rem}.role-summary{display:flex;flex-wrap:wrap;gap:.5rem}.role-summary>span{min-width:10rem;padding:.65rem .75rem;background:var(--cloud);border-radius:8px}.effective{display:grid;gap:.75rem;padding-top:.25rem;border-top:1px solid var(--line)}.effective>div{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:.75rem}.effective h3{font-size:.92rem}.effective>div>span{color:var(--muted-ink);font-size:.78rem}.effective :deep(.n-collapse-item__header){min-height:48px}.effective ul{display:grid;gap:.5rem;margin:0 0 1rem;padding:0;list-style:none}.effective li{display:grid;grid-template-columns:minmax(8rem,.35fr) minmax(0,1fr);gap:1rem;padding:.45rem 0;border-bottom:1px solid var(--line);font-size:.82rem}.effective code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.75rem}.state{padding:1rem;color:var(--muted-ink);background:var(--cloud);border-radius:8px;text-align:center}.feedback{padding:.75rem;border-radius:8px}.error{color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%)}
@media(max-width:639px){.permissions-card{padding:1rem}.permissions-card>header{align-items:stretch;flex-direction:column}.permissions-card>header :deep(.ls-button){width:100%}.effective li{grid-template-columns:1fr;gap:.2rem}}
</style>
