<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useQuery } from '@tanstack/vue-query'
import { Bot, FileText, MessageCircleMore, Pencil } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { NSelect, NFlex } from 'naive-ui'
import { computed, ref } from 'vue'

import { hasPermission, useTeamAccess } from '../lib/teamAccess'

type Entity = {
  id: number
  slug: string
  entityable_type: string
  entityable_id: number
  is_internal_visible: number
  profile?: { name?: string; avatar?: string }
}

const type = ref<string | null>(null)
const search = ref('')
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
  teamCustomer: '顾客',
  teamVirtual: '虚拟人员',
}
const options = [
  { label: '全部人员', value: '' },
  ...Object.entries(labels).map(([value, label]) => ({ label, value })),
]
const rows = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  const list = query.data.value?.list ?? []
  return keyword ? list.filter(entity => `${entity.profile?.name ?? ''} ${entity.slug} ${labels[entity.entityable_type] ?? ''}`.toLocaleLowerCase().includes(keyword)) : list
})
function entityLocation(entity: Entity, manage = false) {
  return entity.entityable_type === 'teamMember'
    ? { path: manage ? '/member-edit' : '/member-detail', query: { id: entity.entityable_id } }
    : { path: '/entity', query: { id: entity.id } }
}
</script>

<template>
  <LsCollectionPage title="人员" description="查看团队内有权查看的人员。">
    <template #actions>
      <LsPageLink :icon="FileText" label="对象字段" to="/fields" />
      <LsPageLink :icon="Bot" label="虚拟人员" to="/chat-virtuals" />
    </template>
    <template #toolbar>
      <LsListToolbar v-model="search" placeholder="搜索人员名称或 slug" aria-label="搜索人员" :count-label="`${rows.length} 位人员`">
        <template #filters>
          <NSelect v-model:value="type" :options="options" clearable placeholder="全部类型" />
        </template>
      </LsListToolbar>
    </template>
    <LsAsyncState v-if="query.isPending.value" state="loading" />
    <LsAsyncState v-else-if="query.isError.value" state="error" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="!rows.length" title="没有可查看的人员" description="调整搜索词或人员类型筛选后查看。" />
    <LsResourceList v-else aria-label="人员列表">
      <LsResourceRow v-for="entity in rows" :key="entity.id" :to="entityLocation(entity)">
        <template #identity>
          <LsEntityIdentity :type="entity.entityable_type as 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'" :name="entity.profile?.name || '未命名人员'" :slug="entity.slug" :image-url="entity.profile?.avatar" />
        </template>
        <template #actions>
          <NFlex align="center" justify="end" :size="12">
            <LsPageLink :href="chatWorkspaceUrl('/new', { participant: entity.slug })" :icon="MessageCircleMore" label="对话" />
            <LsPageLink :to="entityLocation(entity, true)" :icon="Pencil" :label="canManage ? '管理' : '查看'" />
          </NFlex>
        </template>
      </LsResourceRow>
    </LsResourceList>
  </LsCollectionPage>
</template>
