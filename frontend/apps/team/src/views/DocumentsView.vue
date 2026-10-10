<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { BookOpen, Pencil, Plus, Trash2 } from '@lucide/vue'
import { NPagination, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const client = useQueryClient()
const page = ref(1)
const keyword = ref('')
const visibility = ref<number | 'all'>('all')
const visibilityOptions = [
  { label: '全部分类', value: 'all' },
  { label: '团队管理可见', value: 1 },
  { label: '主体与管理可见', value: 3 },
  { label: '团队成员可见', value: 4 },
  { label: '公开文档', value: 5 },
  { label: '指定对象可见', value: 6 },
]
const visibilityLabels: Record<number, string> = {
  1: '团队管理可见',
  3: '主体与管理可见',
  4: '团队成员可见',
  5: '公开文档',
  6: '指定对象可见',
}
const entityId = computed(() => Number(route.query.entity_id || 0))
const query = useQuery({
  queryKey: computed(() => ['docs', page.value, keyword.value, visibility.value, entityId.value]),
  queryFn: () => api.get<Record<string, unknown>>('/doc', {
    page: page.value,
    limit: 12,
    keyword: keyword.value,
    visibility: visibility.value === 'all' ? undefined : visibility.value,
    ...(entityId.value ? { entity_id: entityId.value } : {}),
  }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const docs = computed<Record<string, unknown>[]>(() => Array.isArray(query.data.value?.list) ? query.data.value.list as Record<string, unknown>[] : [])
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? docs.value.length) / 12)))
const createTo = computed(() => {
  const query = new URLSearchParams()
  if (entityId.value) query.set('entity_id', String(entityId.value))
  const suffix = query.toString()
  return suffix ? `/doc-create?${suffix}` : '/doc-create'
})
const remove = useMutation({
  mutationFn: (id: number) => api.post('/doc/delete', { id }),
  onSuccess: async () => {
    feedback.success('文档已删除')
    await client.invalidateQueries({ queryKey: ['docs'] })
  },
  onError: error => feedback.error(friendlyError(error)),
})

function summary(item: Record<string, unknown>) {
  return String(item.content ?? '').replace(/[#>*_`\[\]()~-]/g, ' ').replace(/\s+/g, ' ').trim()
}
function date(value: unknown) {
  const stamp = Number(value)
  if (!stamp) return '刚刚更新'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(stamp * 1000))
}
function removeDoc(item: Record<string, unknown>) {
  if (confirm(`确认删除“${String(item.title ?? '未命名文档')}”？`)) remove.mutate(Number(item.id))
}
function documentActions() {
  return [
    { key: 'edit', label: '编辑', icon: Pencil },
    { key: 'delete', label: '删除', icon: Trash2, danger: true },
  ]
}
function runDocumentAction(key: string, item: Record<string, unknown>) {
  if (key === 'edit') void router.push(`/doc-edit?id=${item.id}`)
  if (key === 'delete') removeDoc(item)
}
</script>

<template>
    <AdminPageHeader
      title="文档"
      :description="entityId ? `查看对象 #${entityId} 的可见文档。` : '搜索、分类并维护团队知识文档。'"
    >
      <template #actions><LsPagePrimaryAction :icon="Plus" label="新建文档" :to="createTo" /></template>
    </AdminPageHeader>

    <LsListToolbar
      v-model="keyword"
      placeholder="搜索标题或正文"
      aria-label="搜索文档"
      :count-label="routeAccess.restricted.value ? '0 份文档' : `${Number(query.data.value?.total ?? docs.length)} 份文档`"
      @update:model-value="page = 1"
    >
      <template #filters>
        <NSelect v-model:value="visibility" :options="visibilityOptions" aria-label="文档分类" @update:value="page = 1" />
      </template>
    </LsListToolbar>

    <Transition name="ls-state" mode="out-in">
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" key="error" state="error" title="暂时无法读取文档" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" key="loading" state="loading" :rows="4" />
      <LsEmptyState :source="query.data.value"
        v-else-if="!docs.length"
        key="empty"
        :title="routeAccess.restricted.value ? '没有可显示的文档' : keyword || visibility !== 'all' ? '没有匹配的文档' : '文档库还是空的'"
        :description="keyword || visibility !== 'all' ? '尝试更短的关键词或切换文档分类。' : '创建第一份文档，编辑时无需手写 Markdown 语法。'"
      />
      <LsResourceList v-else key="list" aria-label="文档列表">
        <LsResourceRow v-for="item in docs" :key="String(item.id)" :title="String(item.title || '未命名文档')" :description="summary(item).slice(0, 150) || '这份文档还没有正文。'" :icon="BookOpen" :to="`/doc?id=${item.id}`">
          <template #metadata><time>{{ date(item.update_time ?? item.create_time) }}</time></template>
          <template #status><LsStatusTag :label="visibilityLabels[Number(item.visibility)] ?? '可见范围未设置'" /></template>
          <template #actions><LsResponsiveActions :actions="documentActions()" primary-key="edit" @select="runDocumentAction($event, item)" /></template>
        </LsResourceRow>
      </LsResourceList>
    </Transition>
    <footer v-if="pages > 1" class="pager"><NPagination v-model:page="page" :page-count="pages" /></footer>
</template>

<style scoped>
.pager { display: flex; justify-content: center; }
</style>
