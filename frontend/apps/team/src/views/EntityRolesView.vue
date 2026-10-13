<script setup lang="ts">
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ArrowLeft, ExternalLink, Plus, Save, Search, ShieldCheck } from '@lucide/vue'
import { NEmpty, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

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
const routeAccess = useRouteAccess()
const sourceSlug = ref('')
const selectedEntity = ref<EntitySummary | null>(null)
const inputEntities = ref<EntityDisplay[]>([])
const profileLinks = new Map<string, string>()
const roleIds = ref<number[]>([])

const rolesQuery = useQuery({
  queryKey: ['roles'],
  queryFn: () => api.get<RoleRecord[]>('/role/index'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const roles = computed(() => rolesQuery.data.value ?? [])
const roleOptions = computed(() => roles.value.map(role => ({
  value: Number(role.id),
  label: role.name || `角色 #${role.id}`,
  meta: role.role_key,
  description: role.description || undefined,
})))
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
  onSuccess: () => feedback.success('人员角色已保存'),
  onError: error => feedback.error(friendlyError(error)),
})
const requestError = computed(() => rolesQuery.error.value || resolveEntity.error.value)

watch(() => route.query.slug, (value) => {
  if (routeAccess.restricted.value) return
  if (typeof value !== 'string' || !value.trim()) return
  const slug = value.trim().toLowerCase()
  sourceSlug.value = slug
  if (selectedEntity.value?.slug !== slug && !resolveEntity.isPending.value) resolveEntity.mutate(slug)
}, { immediate: true })

function submit() {
  if (routeAccess.restricted.value) return
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
function entityTypeLabel(type: EntityType) {
  return ({ team: '团队', teamMember: '成员', teamCustomer: '顾客', teamVirtual: '虚拟人员' })[type]
}
</script>

<template>
  <div class="entity-roles">
      <LsPageHeader
        title="人员角色分配"
        description="人员被授予角色后，获取角色的权限，方可执行特定的业务。"
      >
        <template #actions>
          <LsPageLink to="/roles" :icon="ArrowLeft" label="返回角色列表" />
          <LsSceneMotionControl />
        </template>
      </LsPageHeader>

      <LsPanel>
        <template #header><LsSectionHeader title="搜索人员" description="输入名称或 slug 查看带类型与全局标识的候选；也可直接提交准确 slug 查找未公开搜索的人员。" /></template>
        <form class="lookup" @submit.prevent="submit">
        <label for="source-slug">人员</label>
        <div class="lookup-control">
          <LsEntityInput
            :model-value="inputEntities"
            :query="sourceSlug"
            :search-entities="searchEntities"
            input-id="source-slug"
            placeholder="按名称或 slug 搜索人员"
            @update:model-value="selectInputEntities"
            @update:query="sourceSlug = $event"
            @chat="startChat"
            @profile="openProfile"
          />
          <LsButton type="submit" :loading="resolveEntity.isPending.value" :disabled="routeAccess.restricted.value || !sourceSlug.trim()" :disabled-reason="routeAccess.reason.value">
            <template #icon><Search :size="17" /></template>查找人员
          </LsButton>
        </div>
        </form>
      </LsPanel>

      <LsInlineError v-if="requestError && !routeAccess.restricted.value" :message="friendlyError(requestError)" />
      <LsAsyncState v-if="!routeAccess.restricted.value && (resolveEntity.isPending.value || rolesQuery.isPending.value)" state="loading" :rows="5" aria-label="正在加载人员角色" />
      <LsPanel v-else-if="selectedEntity"><section class="assignment">
        <header>
          <ShieldCheck :size="22" aria-hidden="true" />
          <div>
            <h3>{{ selectedEntity.name }}</h3>
            <p>@{{ selectedEntity.slug }} · {{ entityTypeLabel(selectedEntity.type) }}</p>
            <small v-if="selectedEntity.team">{{ selectedEntity.team.name }} · @{{ selectedEntity.team.slug }}</small>
          </div>
          <div class="assignment-status">
            <NTag v-if="selectedEntity.is_external" type="warning" round><template #icon><ExternalLink :size="14" /></template>跨团队身份</NTag>
            <NTag v-else type="success" round>当前团队</NTag>
          </div>
        </header>

        <LsSectionHeader title="当前团队角色" description="勾选后保存完整角色集合；未勾选表示撤销该角色。"><template #aside>
          <LsButton :loading="save.isPending.value" :disabled="routeAccess.restricted.value || !roles.length" :disabled-reason="routeAccess.reason.value" @click="save.mutate()"><template #icon><Save :size="17" /></template>保存分配</LsButton>
        </template></LsSectionHeader>
        <LsCheckboxGroupField v-if="roles.length" v-model="roleIds" label="当前团队角色" :options="roleOptions" />
        <NEmpty v-else description="还没有可分配的角色">
          <template #extra><LsPageLink to="/roles/new" :icon="Plus" label="新建角色" /></template>
        </NEmpty>
      </section></LsPanel>
      <LsEmptyState v-else :access-reason="routeAccess.reason.value" title="尚未选择人员" description="输入人员 slug 后，可查看归属并分配角色。" />
  </div>
</template>

<style scoped>
.entity-roles{min-width:0;display:grid;gap:1.5rem}.lookup{min-width:0;display:grid;gap:.5rem}.lookup label{font-size:.875rem;font-weight:650}.lookup-control{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:.75rem}.assignment{min-width:0;display:grid;gap:1.25rem}.assignment>header{min-width:0;display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:start;gap:.75rem;padding-bottom:1rem;border-bottom:1px solid var(--line)}.assignment>header>svg{color:var(--primary)}.assignment h3,.assignment p,.assignment small{margin:0;overflow-wrap:anywhere}.assignment>header h3{font-size:1rem}.assignment>header p,.assignment>header small{display:block;margin-top:.2rem;color:var(--text-secondary);font-size:.8125rem}.assignment-status{min-width:0}
@media(max-width:639px){.lookup-control{grid-template-columns:1fr}.assignment>header{grid-template-columns:24px minmax(0,1fr)}.assignment-status{grid-column:2;justify-self:start}}
</style>
