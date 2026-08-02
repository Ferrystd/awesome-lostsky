<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ExternalLink, Search, ShieldCheck } from '@lucide/vue'
import { NButton, NCheckbox, NEmpty, NSkeleton, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

type EntityType = 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
interface RoleRecord { id: number; name?: string; role_key?: string; description?: string }
interface EntitySummary {
  type: EntityType
  id: number
  slug: string
  name: string
  team?: { id: number; slug: string; name: string }
  is_external: boolean
}
interface SearchEntitySummary {
  type: EntityType
  slug: string
  display_name: string
  avatar?: string | null
  available: boolean
  href?: string | null
}

const route = useRoute()
const router = useRouter()
const sourceSlug = ref('')
const selectedEntity = ref<EntitySummary | null>(null)
const inputEntities = ref<EntityDisplay[]>([])
const profileLinks = new Map<string, string>()
const roleIds = ref<number[]>([])

const rolesQuery = useQuery({
  queryKey: ['roles'],
  queryFn: () => api.get<RoleRecord[]>('/role/index'),
})
const roles = computed(() => rolesQuery.data.value ?? [])
const resolveEntity = useMutation({
  mutationFn: async (slug: string) => {
    const [entity, assignments] = await Promise.all([
      api.get<EntitySummary>('/entityRole/resolve', { slug }),
      api.get<Array<{ role_id?: number; role?: { id?: number } }>>('/entityRole/index', { slug }),
    ])
    return {
      entity,
      roleIds: assignments.map(item => Number(item.role_id ?? item.role?.id)).filter(Boolean),
    }
  },
  onSuccess: ({ entity, roleIds: assigned }) => {
    selectedEntity.value = entity
    inputEntities.value = [{ slug: entity.slug, type: entity.type, name: entity.name }]
    roleIds.value = assigned
  },
})
const save = useMutation({
  mutationFn: () => api.post('/entityRole/save', {
    slug: selectedEntity.value?.slug,
    role_ids: roleIds.value,
  }),
  onSuccess: () => feedback.success('实体角色已保存'),
  onError: error => feedback.error(friendlyError(error)),
})
const requestError = computed(() => rolesQuery.error.value || resolveEntity.error.value)

watch(() => route.query.slug, (value) => {
  if (typeof value !== 'string' || !value.trim()) return
  const slug = value.trim().toLowerCase()
  sourceSlug.value = slug
  if (selectedEntity.value?.slug !== slug && !resolveEntity.isPending.value) resolveEntity.mutate(slug)
}, { immediate: true })

function submit() {
  const slug = sourceSlug.value.trim().toLowerCase()
  if (!slug) return
  selectedEntity.value = null
  if (route.query.slug === slug) resolveEntity.mutate(slug)
  else router.push({ path: '/roles/entities', query: { slug } })
}
async function searchEntities(keyword: string): Promise<EntityDisplay[]> {
  const found = await api.get<SearchEntitySummary[]>('/entity/search', { keyword, limit: 6 })
  return found.filter(entity => entity.available).map(entity => {
    if (entity.href) profileLinks.set(entity.slug, entity.href)
    return { slug: entity.slug, type: entity.type, name: entity.display_name, avatar: entity.avatar }
  })
}
function selectInputEntities(entities: EntityDisplay[]) {
  inputEntities.value = entities
  const entity = entities[0]
  if (entity) {
    sourceSlug.value = entity.slug
    submit()
    return
  }
  sourceSlug.value = ''
  selectedEntity.value = null
  roleIds.value = []
  if (route.query.slug) router.replace({ path: '/roles/entities' })
}
function startChat(entity: EntityDisplay) {
  location.assign(chatWorkspaceUrl('/new', { participant: entity.slug }))
}
function openProfile(entity: EntityDisplay) {
  const href = profileLinks.get(entity.slug)
  if (href) location.assign(href)
}
function toggleRole(id: number, checked: boolean) {
  roleIds.value = checked
    ? [...new Set([...roleIds.value, id])]
    : roleIds.value.filter(item => item !== id)
}
function entityTypeLabel(type: EntityType) {
  return ({ team: '团队', teamMember: '成员', teamCustomer: '客户', teamVirtual: '虚拟实体' })[type]
}
</script>

<template>
    <div class="entity-roles">
      <AdminPageHeader
        title="实体角色分配"
        description="按名称或全局 slug 搜索实体并授予当前团队角色。成员、客户、团队和虚拟实体在这里使用同一套分配流程。"
        back-to="/roles"
        back-label="返回角色列表"
      />

      <form class="lookup" @submit.prevent="submit">
        <label for="source-slug">搜索实体</label>
        <p>输入名称或 slug 查看带类型与全局标识的候选；也可直接提交准确 slug 查找未公开搜索的实体。</p>
        <div class="lookup-control">
          <LsEntityInput
            :model-value="inputEntities"
            :query="sourceSlug"
            :search-entities="searchEntities"
            input-id="source-slug"
            placeholder="按名称或 slug 搜索实体"
            @update:model-value="selectInputEntities"
            @update:query="sourceSlug = $event"
            @chat="startChat"
            @profile="openProfile"
          />
          <NButton attr-type="submit" type="primary" :loading="resolveEntity.isPending.value" :disabled="!sourceSlug.trim()">
            <template #icon><Search :size="17" /></template>查找实体
          </NButton>
        </div>
      </form>

      <p v-if="requestError" class="error" role="alert">{{ friendlyError(requestError) }}</p>
      <section v-if="resolveEntity.isPending.value || rolesQuery.isPending.value" class="loading" aria-label="正在加载实体角色">
        <NSkeleton text width="38%" /><NSkeleton text width="55%" />
        <NSkeleton v-for="index in 3" :key="index" height="58px" />
      </section>
      <section v-else-if="selectedEntity" class="assignment">
        <header>
          <ShieldCheck :size="22" aria-hidden="true" />
          <div>
            <h3>{{ selectedEntity.name }}</h3>
            <p>@{{ selectedEntity.slug }} · {{ entityTypeLabel(selectedEntity.type) }}</p>
            <small v-if="selectedEntity.team">{{ selectedEntity.team.name }} · @{{ selectedEntity.team.slug }}</small>
          </div>
          <NTag v-if="selectedEntity.is_external" type="warning" round><template #icon><ExternalLink :size="14" /></template>跨团队实体</NTag>
          <NTag v-else type="success" round>当前团队</NTag>
        </header>

        <div class="assignment-heading">
          <div><h3>当前团队角色</h3><p>勾选后保存完整角色集合；未勾选表示撤销该角色。</p></div>
          <NButton type="primary" :loading="save.isPending.value" :disabled="!roles.length" @click="save.mutate()">保存分配</NButton>
        </div>
        <div v-if="roles.length" class="role-options">
          <NCheckbox
            v-for="role in roles"
            :key="role.id"
            :checked="roleIds.includes(Number(role.id))"
            @update:checked="toggleRole(Number(role.id), $event)"
          >
            <span><strong>{{ role.name }}</strong><code>{{ role.role_key }}</code><small>{{ role.description || '暂无说明' }}</small></span>
          </NCheckbox>
        </div>
        <NEmpty v-else description="还没有可分配的角色">
          <template #extra><RouterLink to="/roles/new">新建角色</RouterLink></template>
        </NEmpty>
      </section>
      <section v-else class="empty">
        <NEmpty description="输入实体 slug 后，可查看归属并分配角色" />
      </section>
    </div>
</template>

<style scoped>
.entity-roles{display:grid;gap:1.5rem}.lookup,.assignment,.empty,.loading{padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}.lookup{display:grid;gap:.4rem}.lookup label{font-size:.9rem;font-weight:700}.lookup p{margin:0;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.lookup-control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:.75rem;margin-top:.45rem}.assignment{display:grid;gap:1.25rem}.assignment>header{display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:start;gap:.75rem;padding-bottom:1.1rem;border-bottom:1px solid var(--line)}.assignment>header>svg{color:var(--sky-lost-strong)}.assignment h3,.assignment p,.assignment small{margin:0}.assignment>header h3{font-size:1rem}.assignment>header p,.assignment>header small{display:block;margin-top:.2rem;color:var(--muted-ink);font-size:.8rem}.assignment-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.assignment-heading h3{font-size:1rem}.assignment-heading p{max-width:60ch;margin-top:.3rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.role-options{display:grid;gap:1px;overflow:hidden;background:var(--line);border:1px solid var(--line);border-radius:8px}.role-options :deep(.n-checkbox){min-height:64px;align-items:center;padding:.65rem .75rem;background:white}.role-options :deep(.n-checkbox:hover){background:var(--cloud)}.role-options span{display:grid;grid-template-columns:auto 1fr;gap:.15rem .6rem}.role-options strong{font-size:.875rem}.role-options code{align-self:center;color:var(--muted-ink);font-size:.72rem}.role-options small{grid-column:1/-1;color:var(--muted-ink);font-size:.75rem}.empty{padding-block:3.5rem}.loading{display:grid;gap:1rem}.error{margin:0;padding:1rem;color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%);border-radius:8px}
@media(max-width:639px){.lookup-control{grid-template-columns:1fr}.assignment>header{grid-template-columns:24px minmax(0,1fr)}.assignment>header :deep(.n-tag){grid-column:2;justify-self:start}.assignment-heading{align-items:stretch;flex-direction:column}.assignment-heading :deep(.n-button){width:100%}}
</style>
