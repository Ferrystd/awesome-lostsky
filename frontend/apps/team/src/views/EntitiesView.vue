<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import { useQuery } from '@tanstack/vue-query'
import { MessageCircleMore, Pencil } from '@lucide/vue'
import { NSelect, NSpin } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { hasPermission, useTeamAccess } from '../lib/teamAccess'

type Entity = {
  id: number
  slug: string
  entityable_type: string
  is_internal_visible: number
  profile?: { name?: string; avatar?: string }
}

const type = ref<string | null>(null)
const search = ref('')
const access = useTeamAccess()
const router = useRouter()
const canManage = computed(() => hasPermission(access.data.value, 'team.entity.profile.manage'))
const query = useQuery({
  queryKey: computed(() => ['entities', type.value]),
  queryFn: () => api.get<{ list: Entity[] }>('/entity/index', {
    type: type.value || undefined,
    limit: 100,
  }),
})
const labels: Record<string, string> = {
  team: '团队',
  teamMember: '成员',
  teamCustomer: '顾客',
  teamVirtual: '虚拟实体',
}
const options = [
  { label: '全部实体', value: '' },
  ...Object.entries(labels).map(([value, label]) => ({ label, value })),
]
const rows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  const list = query.data.value?.list ?? []
  return keyword ? list.filter(entity => `${entity.profile?.name ?? ''} ${entity.slug} ${labels[entity.entityable_type] ?? ''}`.toLocaleLowerCase().includes(keyword)) : list
})
function entityActions(entity: Entity) {
  return [
    { key: 'chat', label: '对话', icon: MessageCircleMore },
    { key: 'manage', label: canManage.value ? '管理' : '查看', icon: Pencil },
  ]
}
function handleAction(key: string, entity: Entity) {
  if (key === 'chat') window.location.href = chatWorkspaceUrl('/new', { participant: entity.slug })
  else void router.push({ path: '/entity', query: { id: entity.id } })
}
</script>

<template>
  <div class="entities-view">
    <AdminPageHeader title="实体" description="浏览团队、成员、顾客与虚拟实体（Virtual Entity）。具有全量读取权限（Permission）时也会列出团队内隐藏实体。" />
    <LsListToolbar v-model="search" placeholder="搜索实体名称或 slug" aria-label="搜索实体" :count-label="`${rows.length} 个实体`"><template #filters><NSelect v-model:value="type" :options="options" clearable placeholder="全部类型" /></template></LsListToolbar>
    <NSpin v-if="query.isPending.value" size="large" />
    <p v-else-if="query.isError.value" class="feedback" role="alert">{{ friendlyError(query.error.value) }}</p>
    <LsEmptyState v-else-if="!rows.length" title="没有可查看的实体" description="调整搜索词或实体类型筛选后查看。" />
    <div v-else class="entity-list">
      <article
        v-for="entity in rows"
        :key="entity.id"
        class="entity-row"
      >
        <RouterLink :to="{ path: '/entity', query: { id: entity.id } }" class="entity-main">
          <LsEntityIdentity :type="entity.entityable_type as 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'" :name="entity.profile?.name || '未命名实体'" :slug="entity.slug" :image-url="entity.profile?.avatar" />
        </RouterLink>
        <LsResponsiveActions :actions="entityActions(entity)" primary-key="manage" @select="handleAction($event, entity)" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.entities-view{display:grid;gap:22px}.filter{display:grid;gap:7px;max-width:22rem}.filter span{font-size:.875rem;font-weight:650;color:var(--text-secondary)}.entity-list{display:grid;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--surface)}.entity-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;min-height:76px;padding:8px 12px 8px 16px;border-bottom:1px solid var(--border);transition:background-color var(--motion-fast) var(--ease-standard)}.entity-row:last-of-type{border-bottom:0}.entity-row:hover{background:var(--surface-subtle)}.entity-main{min-width:0;min-height:56px;display:grid;align-items:center;color:inherit;text-decoration:none}.feedback{color:var(--danger)}.empty{padding:28px 16px;margin:0;color:var(--text-secondary)}
@media(max-width:560px){.entity-row{grid-template-columns:minmax(0,1fr)}.entity-row nav{justify-content:flex-end;padding-top:.25rem;border-top:1px solid var(--border)}}
</style>
