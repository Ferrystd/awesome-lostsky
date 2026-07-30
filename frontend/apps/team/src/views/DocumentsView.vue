<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { BookOpen, Pencil, Plus, Trash2 } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const route = useRoute()
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
</script>

<template>
  <div class="documents-view">
    <AdminPageHeader
      title="文档"
      :description="entityId ? `查看对象 #${entityId} 的可见文档。` : '搜索、分类并维护团队知识文档。'"
    >
      <template #actions><RouterLink class="primary-link" :to="createTo"><Plus :size="17" />新建文档</RouterLink></template>
    </AdminPageHeader>

    <LsListToolbar
      v-model="keyword"
      placeholder="搜索标题或正文"
      aria-label="搜索文档"
      :count-label="`${Number(query.data.value?.total ?? docs.length)} 份文档`"
      @update:model-value="page = 1"
    >
      <template #filters>
        <NSelect v-model:value="visibility" class="category-select" :options="visibilityOptions" aria-label="文档分类" @update:value="page = 1" />
      </template>
    </LsListToolbar>

    <Transition name="ls-state" mode="out-in">
      <p v-if="query.isError.value" key="error" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <div v-else-if="query.isPending.value" key="loading" class="loading" aria-label="正在加载文档"><span v-for="i in 4" :key="i" class="ls-skeleton" /></div>
      <section v-else-if="!docs.length" key="empty" class="empty">
        <BookOpen :size="34" />
        <h2>{{ keyword || visibility !== 'all' ? '没有匹配的文档' : '文档库还是空的' }}</h2>
        <p>{{ keyword || visibility !== 'all' ? '尝试更短的关键词或切换文档分类。' : '创建第一份文档，编辑时无需手写 Markdown 语法。' }}</p>
        <RouterLink v-if="!keyword && visibility === 'all'" class="primary-link" :to="createTo">新建文档</RouterLink>
      </section>
      <TransitionGroup v-else key="list" name="ls-list" tag="section" class="document-list">
        <article v-for="item in docs" :key="String(item.id)">
          <RouterLink class="document-main" :to="`/doc?id=${item.id}`">
            <BookOpen :size="19" aria-hidden="true" />
            <span>
              <small>{{ date(item.update_time ?? item.create_time) }}</small>
              <h2>{{ item.title || '未命名文档' }}</h2>
              <p>{{ summary(item).slice(0, 150) || '这份文档还没有正文。' }}</p>
            </span>
          </RouterLink>
          <footer>
            <span>{{ visibilityLabels[Number(item.visibility)] ?? '可见范围未设置' }}</span>
            <RouterLink class="icon-link" :to="`/doc-edit?id=${item.id}`" aria-label="编辑文档"><Pencil :size="17" /></RouterLink>
            <button type="button" class="icon-button danger" aria-label="删除文档" @click="removeDoc(item)"><Trash2 :size="17" /></button>
          </footer>
        </article>
      </TransitionGroup>
    </Transition>
    <footer v-if="pages > 1" class="pager">
      <LsButton variant="secondary" size="sm" :disabled="page <= 1" @click="page--">上一页</LsButton>
      <span>第 {{ page }} / {{ pages }} 页</span>
      <LsButton variant="secondary" size="sm" :disabled="page >= pages" @click="page++">下一页</LsButton>
    </footer>
  </div>
</template>

<style scoped>
.documents-view { display: grid; gap: 22px; }
.primary-link { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 16px; border-radius: var(--radius-md); color: white; background: var(--primary); font-size: .88rem; font-weight: 700; text-decoration: none; }
.primary-link:hover { background: var(--primary-hover); }
.category-select { width: 12rem; }
.document-list { display: grid; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.document-list article { display: grid; grid-template-columns:minmax(0,1fr) auto; min-height: 116px; border-bottom: 1px solid var(--border); background: var(--surface); transition: background-color var(--motion-fast) var(--ease-standard), opacity var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out); }
.document-list article:last-child { border-bottom: 0; }
.document-list article:hover { background: var(--surface-subtle); }
.document-main { min-width:0; display:grid; grid-template-columns:auto minmax(0,1fr); align-items:start; gap:14px; padding: 17px 19px; color: inherit; text-decoration: none; }
.document-main>svg { margin-top:4px; color:var(--primary); }
.document-main small, .document-list footer span { color: var(--text-tertiary); font-size: .78rem; }
.document-main h2 { margin: 3px 0 4px; font-size: 1rem; }
.document-main p { margin: 0; overflow:hidden; color: var(--text-secondary); font-size:.84rem; line-height: 1.55; text-overflow:ellipsis; white-space:nowrap; }
.document-list footer { display: flex; align-items: center; justify-content:flex-end; gap: 7px; padding: 12px 13px; }
.icon-link, .icon-button { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: var(--radius-md); color: var(--text-secondary); background: transparent; cursor: pointer; }
.icon-link:hover, .icon-button:hover { background: var(--surface-subtle); color: var(--primary); }
.icon-button.danger:hover { color: var(--danger); }
.empty { display: grid; justify-items: center; gap: 8px; padding: 54px 20px; border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-secondary); text-align: center; }
.empty h2, .empty p { margin: 0; }
.empty .primary-link { margin-top: 8px; }
.loading { display: grid; gap: 1px; overflow:hidden; border-radius:var(--radius-lg); }
.loading span { height: 116px; background: var(--surface-subtle); }
.pager { display: flex; align-items: center; justify-content: center; gap: 14px; color: var(--text-secondary); }
.error { color: var(--danger); }
@media (max-width: 720px) { .document-list article { grid-template-columns:1fr; }.document-list footer{border-top:1px solid var(--border)} }
</style>
