<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import { useQuery } from '@tanstack/vue-query'
import { MessageCircleMore } from '@lucide/vue'
import { NSelect, NSpin } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
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
const access = useTeamAccess()
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
  teamCustomer: '客户',
  teamVirtual: '虚拟实体',
}
const options = [
  { label: '全部实体', value: '' },
  ...Object.entries(labels).map(([value, label]) => ({ label, value })),
]
</script>

<template>
  <div class="entities-view">
    <AdminPageHeader title="实体" description="浏览团队、成员、客户与虚拟实体。具有全量读取权限时也会列出团队内隐藏实体。" />
    <label class="filter"><span>实体类型</span><NSelect v-model:value="type" :options="options" clearable /></label>
    <NSpin v-if="query.isPending.value" size="large" />
    <p v-else-if="query.isError.value" class="feedback" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else class="entity-list">
      <article
        v-for="entity in query.data.value?.list ?? []"
        :key="entity.id"
        class="entity-row"
      >
        <RouterLink :to="{ path: '/entity', query: { id: entity.id } }" class="entity-main">
          <span class="avatar">{{ entity.profile?.name?.slice(0, 1) || '—' }}</span>
          <span>
            <strong>{{ entity.profile?.name || '未命名实体' }}</strong>
            <small>
              {{ labels[entity.entityable_type] }} · @{{ entity.slug }}
              <em v-if="entity.entityable_type !== 'team' && Number(entity.is_internal_visible) !== 1">团队内隐藏</em>
            </small>
          </span>
        </RouterLink>
        <nav :aria-label="`${entity.profile?.name || entity.slug} 操作`">
          <a
            :href="chatWorkspaceUrl('/new', { participant: entity.slug })"
            :aria-label="`与 ${entity.profile?.name || entity.slug} 对话`"
          ><MessageCircleMore :size="17" /><span>对话</span></a>
          <RouterLink :to="{ path: '/entity', query: { id: entity.id } }">{{ canManage ? '管理' : '查看' }}</RouterLink>
        </nav>
      </article>
      <p v-if="!query.data.value?.list?.length" class="empty">当前筛选下没有可查看的实体。</p>
    </div>
  </div>
</template>

<style scoped>
.entities-view{display:grid;gap:22px}.filter{display:grid;gap:7px;max-width:22rem}.filter span{font-size:.875rem;font-weight:650;color:var(--text-secondary)}.entity-list{display:grid;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--surface)}.entity-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;min-height:76px;padding:8px 12px 8px 16px;border-bottom:1px solid var(--border)}.entity-row:last-of-type{border-bottom:0}.entity-row:hover{background:var(--surface-subtle)}.entity-main{min-width:0;min-height:56px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:center;color:inherit;text-decoration:none}.entity-row strong,.entity-row small{display:block}.entity-row small{margin-top:3px;color:var(--text-secondary)}.entity-row small em{margin-left:.45rem;padding:.1rem .35rem;color:var(--muted-ink);background:var(--cloud);border-radius:999px;font-size:.68rem;font-style:normal}.entity-row nav{display:flex;align-items:center;gap:.25rem}.entity-row nav a{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.35rem;padding:0 .65rem;color:var(--primary);border-radius:8px;font-size:.82rem;font-weight:650}.entity-row nav a:hover{background:color-mix(in oklch,var(--sky-lost),white 90%)}.avatar{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--surface-subtle);color:var(--primary);font-weight:700}.feedback{color:var(--danger)}.empty{padding:28px 16px;margin:0;color:var(--text-secondary)}
@media(max-width:560px){.entity-row{grid-template-columns:minmax(0,1fr)}.entity-row nav{justify-content:flex-end;padding-top:.25rem;border-top:1px solid var(--border)}}
</style>
