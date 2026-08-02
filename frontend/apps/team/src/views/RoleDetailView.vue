<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Save, Trash2, X } from '@lucide/vue'
import {
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
} from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

type EntityType = 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
interface RoleRecord { id: number; name?: string; role_key?: string; description?: string; sort?: number; is_displayed?: number }
interface PermissionItem { key: string; label: string }
interface PermissionCatalog { groups: Array<{ name: string; items: PermissionItem[] }> }
interface EntitySummary {
  type: EntityType
  slug: string
  name: string
  is_external: boolean
}
interface SearchEntitySummary {
  type: EntityType
  slug: string
  display_name: string
  avatar?: string | null
  available: boolean
}

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const roleId = computed(() => Number(route.params.id))
const form = reactive({ name: '', description: '', sort: 0, is_displayed: false })
const permissionKeys = ref<string[]>([])
const targetSlug = ref('')
const targetEntities = ref<EntityDisplay[]>([])
const localError = ref('')

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
const catalogKeys = computed(() => new Set(groups.value.flatMap(group => group.items.map(item => item.key))))
const exactAssumeKeys = computed(() => permissionKeys.value.filter(key =>
  /^identity\.(?:member|customer|virtual)\.[a-z0-9][a-z0-9_-]{0,49}\.assume$/.test(key)
  && !catalogKeys.value.has(key),
))

watch(() => roleQuery.data.value, (role) => {
  if (!role) return
  form.name = String(role.name ?? '')
  form.description = String(role.description ?? '')
  form.sort = Number(role.sort ?? 0)
  form.is_displayed = Number(role.is_displayed ?? 0) === 1
}, { immediate: true })
watch(() => permissionsQuery.data.value, (items) => {
  if (!items) return
  permissionKeys.value = items.map(item => String(item.permission_key ?? item.key ?? '')).filter(Boolean)
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
  mutationFn: () => api.post('/rolePermission/save', {
    role_id: roleId.value,
    permission_keys: permissionKeys.value,
  }),
  onSuccess: () => feedback.success('角色权限已保存'),
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
const resolveTarget = useMutation({
  mutationFn: async () => {
    const slug = targetSlug.value.trim().toLowerCase()
    const entity = await api.get<EntitySummary>('/entityRole/resolve', { slug })
    const prefix = ({ teamMember: 'member', teamCustomer: 'customer', teamVirtual: 'virtual' } as const)[entity.type as Exclude<EntityType, 'team'>]
    return {
      entity,
      key: entity.type === 'team' ? 'identity.team.assume' : `identity.${prefix}.${entity.slug}.assume`,
    }
  },
  onSuccess: ({ entity, key }) => {
    if (entity.is_external) {
      localError.value = '精确委托目标必须属于当前团队；跨团队实体应在实体角色分配页中作为授权来源。'
      return
    }
    togglePermission(key, true)
    targetSlug.value = ''
    targetEntities.value = []
    localError.value = ''
  },
})

const requestError = computed(() =>
  roleQuery.error.value
  || permissionsQuery.error.value
  || catalogQuery.error.value
  || resolveTarget.error.value,
)
const pending = computed(() =>
  roleQuery.isPending.value
  || permissionsQuery.isPending.value
  || catalogQuery.isPending.value,
)

function togglePermission(key: string, checked: boolean) {
  permissionKeys.value = checked
    ? [...new Set([...permissionKeys.value, key])]
    : permissionKeys.value.filter(item => item !== key)
}
function selectedCount(items: PermissionItem[]) {
  return items.filter(item => permissionKeys.value.includes(item.key)).length
}
function deleteRole() {
  if (window.confirm(`确认删除角色“${roleQuery.data.value?.name || roleId.value}”？`)) remove.mutate()
}
async function searchEntities(keyword: string): Promise<EntityDisplay[]> {
  const found = await api.get<SearchEntitySummary[]>('/entity/search', { keyword, limit: 6 })
  return found.filter(entity => entity.available).map(entity => ({
    slug: entity.slug,
    type: entity.type,
    name: entity.display_name,
    avatar: entity.avatar,
  }))
}
function selectTargetEntities(entities: EntityDisplay[]) {
  targetEntities.value = entities
  targetSlug.value = entities[0]?.slug ?? ''
}
</script>

<template>
    <div class="role-detail">
      <AdminPageHeader
        :title="roleQuery.data.value?.name || '编辑角色权限'"
        :description="roleQuery.data.value?.role_key ? `角色标识：${roleQuery.data.value.role_key}` : '维护角色资料与最小权限集合。'"
        back-to="/roles"
        back-label="返回角色列表"
      />

      <LsInlineError v-if="requestError || localError" :message="localError || friendlyError(requestError)" />
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
            <NFormItem label="公开主页展示">
              <NSwitch
                v-model:value="form.is_displayed"
                aria-label="在公开实体资料中展示此角色"
              >
                <template #checked>公开</template>
                <template #unchecked>隐藏</template>
              </NSwitch>
              <template #feedback>开启后，获得此角色的公开成员或虚拟实体会展示角色名称和说明；角色权限不会公开。</template>
            </NFormItem>
            <footer>
              <LsButton variant="danger" :loading="remove.isPending.value" @click="deleteRole"><template #icon><Trash2 :size="17" /></template>删除角色</LsButton>
              <LsButton type="submit" :loading="saveInfo.isPending.value" :disabled="!form.name.trim()"><template #icon><Save :size="17" /></template>保存资料</LsButton>
            </footer>
          </NForm>
        </LsPanel>

        <LsPanel><section class="permissions-panel">
          <header>
            <div><h3>角色权限</h3><p>权限按工作领域折叠展示，展开需要调整的分组即可。</p></div>
            <LsButton :loading="savePermissions.isPending.value" @click="savePermissions.mutate()">保存权限</LsButton>
          </header>

          <div class="slug-tool">
            <div>
              <label for="target-slug">添加精确委托目标</label>
              <p>输入当前团队实体的准确 slug，只授予领取该目标身份的权限。</p>
            </div>
            <div class="slug-controls">
              <LsEntityInput
                :model-value="targetEntities"
                :query="targetSlug"
                :search-entities="searchEntities"
                input-id="target-slug"
                placeholder="按 slug 搜索当前团队实体"
                @update:model-value="selectTargetEntities"
                @update:query="targetSlug = $event"
              />
              <LsButton variant="secondary" :loading="resolveTarget.isPending.value" :disabled="!targetSlug.trim()" @click="resolveTarget.mutate()">解析并添加</LsButton>
            </div>
          </div>

          <div v-if="exactAssumeKeys.length" class="exact-permissions">
            <h4>精确委托</h4>
            <div v-for="key in exactAssumeKeys" :key="key">
              <span><strong>@{{ key.split('.')[2] }}</strong><code>{{ key }}</code></span>
              <NButton quaternary circle :aria-label="`移除 ${key}`" @click="togglePermission(key, false)"><template #icon><X :size="18" /></template></NButton>
            </div>
          </div>

          <NCollapse class="permission-groups" arrow-placement="right">
            <NCollapseItem
              v-for="group in groups"
              :key="group.name"
              :name="group.name"
              :title="`${group.name} · 已选择 ${selectedCount(group.items)}/${group.items.length}`"
            >
              <div class="permission-list">
                <NCheckbox
                  v-for="item in group.items"
                  :key="item.key"
                  :checked="permissionKeys.includes(item.key)"
                  @update:checked="togglePermission(item.key, $event)"
                >
                  <span class="permission-copy"><strong>{{ item.label }}</strong><code>{{ item.key }}</code></span>
                </NCheckbox>
              </div>
            </NCollapseItem>
          </NCollapse>
        </section></LsPanel>
      </template>
    </div>
</template>

<style scoped>
.role-detail{display:grid;gap:1.5rem}.permissions-panel{display:grid;gap:1.25rem}.role-detail header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.role-detail h3,.role-detail h4,.role-detail p{margin:0}.role-detail h3{font-size:1.05rem}.role-detail header p,.slug-tool p{max-width:65ch;margin-top:.3rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.role-detail :deep(.n-form-item-label){font-weight:650}.role-detail :deep(.n-input-number){width:100%}.role-detail footer{display:flex;align-items:center;justify-content:flex-end;gap:.75rem;padding-top:.25rem}.saved{display:inline-flex;align-items:center;gap:.4rem;margin:0 auto 0 0;color:var(--success);font-size:.82rem;font-weight:650}.slug-tool{display:grid;gap:.75rem;padding:1rem;background:var(--cloud);border-radius:10px}.slug-tool label{font-size:.875rem;font-weight:700}.slug-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem}.exact-permissions{display:grid;gap:.5rem}.exact-permissions h4{font-size:.9rem}.exact-permissions>div{min-height:52px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.65rem .75rem;border-bottom:1px solid var(--line)}.exact-permissions span,.permission-copy{display:grid;gap:.15rem}.exact-permissions strong,.permission-copy strong{font-size:.875rem}.exact-permissions code,.permission-copy code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.72rem}.exact-permissions button{width:44px;height:44px;display:grid;place-items:center;flex:none;color:var(--muted-ink);background:transparent;border:0;border-radius:8px;cursor:pointer}.exact-permissions button:hover{color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%)}.permission-groups{border-top:1px solid var(--line)}.permission-groups :deep(.n-collapse-item){margin:0;border-bottom:1px solid var(--line)}.permission-groups :deep(.n-collapse-item__header){min-height:56px;padding:0}.permission-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1px;margin-bottom:1rem;overflow:hidden;background:var(--line);border:1px solid var(--line);border-radius:8px}.permission-list :deep(.n-checkbox){min-height:58px;align-items:center;padding:.65rem .75rem;background:white}.permission-list :deep(.n-checkbox:hover){background:var(--cloud)}
@media(max-width:639px){.role-detail header,.role-detail footer{align-items:stretch;flex-direction:column}.role-detail header :deep(.n-button),.role-detail footer :deep(.n-button){width:100%}.role-detail footer .saved{margin:0}.slug-controls{grid-template-columns:1fr}.permission-list{grid-template-columns:1fr}}
</style>
