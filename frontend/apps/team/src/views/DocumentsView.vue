<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { BookOpen, Pencil, Plus, Search, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const route = useRoute()
const client = useQueryClient()
const page = ref(1)
const keyword = ref('')
const entityId = computed(() => Number(route.query.entity_id || 0))
const query = useQuery({
  queryKey: computed(() => ['docs', page.value, keyword.value, entityId.value]),
  queryFn: () => api.get<Record<string, unknown>>('/doc', {
    page: page.value,
    limit: 12,
    keyword: keyword.value,
    ...(entityId.value ? { entity_id: entityId.value } : {}),
  }),
})
const docs = computed<Record<string, unknown>[]>(() => Array.isArray(query.data.value?.list) ? query.data.value.list as Record<string, unknown>[] : [])
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? docs.value.length) / 12)))
const createTo = computed(() => {
  const query = new URLSearchParams()
  if (entityId.value) query.set('entity_id', String(entityId.value))
  return `/doc-create?${query}`
})
const remove = useMutation({ mutationFn: (id: number) => api.post('/doc/delete', { id }), onSuccess: () => client.invalidateQueries({ queryKey: ['docs'] }) })

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
      :description="entityId ? `?? #${entityId} ?????????` : '???????????????'"
    >
      <template #actions><RouterLink class="primary-link" :to="createTo"><Plus :size="17" />新建文档</RouterLink></template>
    </AdminPageHeader>

    <label class="search-field">
      <Search :size="18" aria-hidden="true" />
      <span class="ls-sr-only">搜索文档</span>
      <input v-model="keyword" type="search" placeholder="搜索标题和内容" @input="page = 1">
    </label>

    <p v-if="query.isError.value" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading" aria-label="正在加载文档"><span v-for="i in 4" :key="i" /></div>
    <section v-else-if="!docs.length" class="empty">
      <BookOpen :size="34" />
      <h2>文档库还是空的</h2>
      <p>创建第一份文档，编辑时无需手写 Markdown 语法。</p>
      <RouterLink class="primary-link" :to="createTo">新建文档</RouterLink>
    </section>
    <section v-else class="document-list">
      <article v-for="item in docs" :key="String(item.id)">
        <RouterLink class="document-main" :to="`/doc?id=${item.id}`">
          <small>{{ date(item.update_time ?? item.create_time) }}</small>
          <h2>{{ item.title || '未命名文档' }}</h2>
          <p>{{ summary(item).slice(0, 150) || '这份文档还没有正文。' }}</p>
        </RouterLink>
        <footer>
          <span>可见范围 {{ item.visibility ?? 1 }}</span>
          <RouterLink class="icon-link" :to="`/doc-edit?id=${item.id}`" aria-label="编辑文档"><Pencil :size="17" /></RouterLink>
          <button type="button" class="icon-button danger" aria-label="删除文档" @click="removeDoc(item)"><Trash2 :size="17" /></button>
        </footer>
      </article>
    </section>
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
.search-field { max-width: 520px; min-height: 44px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.search-field:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 13%, transparent); }
.search-field input { width: 100%; border: 0; outline: 0; color: var(--text); background: transparent; font: inherit; }
.document-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.document-list article { display: grid; min-height: 210px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); transition: transform .16s ease, border-color .16s ease; }
.document-list article:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 32%, var(--border)); }
.document-main { padding: 21px; color: inherit; text-decoration: none; }
.document-main small, .document-list footer span { color: var(--text-tertiary); font-size: .78rem; }
.document-main h2 { margin: 9px 0 8px; font-size: 1.05rem; }
.document-main p { margin: 0; color: var(--text-secondary); line-height: 1.65; }
.document-list footer { align-self: end; display: flex; align-items: center; gap: 7px; padding: 10px 13px 10px 20px; border-top: 1px solid var(--border); }
.document-list footer span { margin-right: auto; }
.icon-link, .icon-button { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: var(--radius-md); color: var(--text-secondary); background: transparent; cursor: pointer; }
.icon-link:hover, .icon-button:hover { background: var(--surface-subtle); color: var(--primary); }
.icon-button.danger:hover { color: var(--danger); }
.empty { display: grid; justify-items: center; gap: 8px; padding: 54px 20px; border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-secondary); text-align: center; }
.empty h2, .empty p { margin: 0; }
.empty .primary-link { margin-top: 8px; }
.loading { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.loading span { height: 210px; border-radius: var(--radius-lg); background: var(--surface-subtle); animation: pulse 1.3s infinite alternate; }
.pager { display: flex; align-items: center; justify-content: center; gap: 14px; color: var(--text-secondary); }
.error { color: var(--danger); }
@keyframes pulse { to { opacity: .55; } }
@media (max-width: 720px) { .document-list, .loading { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .document-list article { transition: none; } .loading span { animation: none; } }
</style>
