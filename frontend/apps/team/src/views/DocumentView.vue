<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { BookOpen, Clock3, FileText, Pencil, UserRound } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { NTag } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { visibilityOptions } from '../lib/access'
import { resolveEntities } from '../lib/markdown'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

interface DocumentSubject {
  id?: number
  name?: string | null
  slug?: string | null
}

interface DocumentDetail {
  id?: number
  title?: string | null
  content?: string | null
  entity_id?: number
  visibility?: number | string | null
  create_time?: number | string | null
  update_time?: number | string | null
  subject?: DocumentSubject | null
}

function documentDetail(payload: unknown, id: number): DocumentDetail | null {
  if (Array.isArray(payload)) {
    const match = payload.find(item => Number(documentDetail(item, id)?.id) === id)
    return match ? documentDetail(match, id) : null
  }
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if ('title' in record || 'content' in record || 'entity_id' in record || 'subject' in record) {
    return record as DocumentDetail
  }
  const nested = record.data
  if (nested && typeof nested === 'object') {
    const detail = documentDetail(nested, id)
    if (detail) return detail
  }
  if (Array.isArray(record.list)) {
    const match = record.list.find(item => Number(documentDetail(item, id)?.id) === id)
    return match ? documentDetail(match, id) : null
  }
  return null
}

function formatTime(value: unknown) {
  if (!value) return '时间未知'
  const numeric = Number(value)
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 1e12 ? numeric * 1000 : numeric)
    : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const route = useRoute()
const routeAccess = useRouteAccess()
const id = computed(() => Number(route.query.id || 0))
const query = useQuery({
  queryKey: computed(() => ['doc', id.value]),
  queryFn: () => routeAccess.read(() => api.get<unknown>('/doc/get', { id: id.value })),
  enabled: computed(() => id.value > 0 && !routeAccess.restricted.value),
  select: payload => documentDetail(payload, id.value),
})
const document = computed(() => query.data.value)
const title = computed(() => (typeof document.value?.title === 'string' ? document.value.title.trim() : '') || '未命名文档')
const content = computed(() => (typeof document.value?.content === 'string' ? document.value.content.trim() : ''))
const subjectName = computed(() => (typeof document.value?.subject?.name === 'string' ? document.value.subject.name.trim() : ''))
const visibilityLabel = computed(() => {
  const raw = document.value?.visibility
  if (typeof raw === 'string' && raw.trim() && Number.isNaN(Number(raw))) return raw.trim()
  const value = Number(raw)
  return visibilityOptions.find(option => Number(option.value) === value)?.label ?? ''
})
const updatedAt = computed(() => formatTime(document.value?.update_time ?? document.value?.create_time))
const back = computed(() => {
  const params = new URLSearchParams()
  if (document.value?.entity_id) params.set('entity_id', String(document.value.entity_id))
  return `/docs${params.size ? `?${params}` : ''}`
})
</script>

<template>
  <article class="document-view">
    <AdminPageHeader title="文档" description="浏览文档。" :back-to="back" back-label="返回文档列表">
      <template #actions>
        <RouterLink v-if="id" class="edit-link" :to="`/doc-edit?id=${id}`">
          <Pencil :size="17" />编辑文档
        </RouterLink>
      </template>
    </AdminPageHeader>

    <section v-if="!id" class="state-panel error" role="alert">
      <FileText :size="24" />
      <div><strong>无法打开文档</strong><p>链接中缺少有效的文档编号，请返回列表重新选择。</p></div>
    </section>

    <section v-else-if="query.isError.value && !routeAccess.restricted.value" class="state-panel error" role="alert">
      <FileText :size="24" />
      <div><strong>文档加载失败</strong><p>{{ friendlyError(query.error.value) }}</p></div>
    </section>

    <section v-else-if="query.isPending.value && !routeAccess.restricted.value" class="document-sheet loading" aria-label="正在加载文档">
      <div class="loading-meta ls-skeleton" />
      <div class="loading-title ls-skeleton" />
      <div class="loading-line ls-skeleton" />
      <div class="loading-body ls-skeleton" />
    </section>

    <section v-else-if="document || routeAccess.restricted.value" class="document-sheet">
      <header class="document-header">
        <div class="document-kicker">
          <span><BookOpen :size="16" />文档 #{{ routeAccess.restricted.value ? '-' : id }}</span>
          <NTag v-if="visibilityLabel" size="small" :bordered="false">{{ visibilityLabel }}</NTag>
        </div>
        <h1>{{ routeAccess.restricted.value ? '-' : title }}</h1>
        <div class="document-meta">
          <span v-if="subjectName"><UserRound :size="16" />{{ subjectName }}</span>
          <time :datetime="String(document?.update_time ?? document?.create_time ?? '')">
            <Clock3 :size="16" />更新于 {{ routeAccess.restricted.value ? '-' : updatedAt }}
          </time>
        </div>
      </header>

      <div v-if="routeAccess.restricted.value" class="document-content">-</div>
      <div v-else-if="content" class="document-content">
        <LsMarkdownRenderer context="document" :content="content" :resolve-entities="resolveEntities" />
      </div>
      <div v-else class="empty-content">
        <FileText :size="28" />
        <strong>这篇文档还没有正文</strong>
        <p>可以进入编辑页补充内容，标题和访问规则会保持不变。</p>
      </div>
    </section>
  </article>
</template>

<style scoped>
.document-view{width:100%;display:grid;gap:1.5rem;margin-inline:auto}.edit-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 1rem;color:var(--sky-lost-strong);background:white;border:1px solid var(--line);border-radius:9px;font-size:.875rem;font-weight:700;text-decoration:none;transition:color var(--motion-fast) var(--ease-standard),border-color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}.edit-link:hover{color:var(--ink);background:var(--cloud);border-color:color-mix(in oklch,var(--sky-lost-strong),transparent 45%)}.edit-link:active{background:color-mix(in oklch,var(--cloud),var(--sky-lost) 8%)}.document-sheet{padding:clamp(1.5rem,4vw,3rem);color:var(--ink);background:white;border:1px solid var(--line);border-radius:14px}.document-header{display:grid;gap:1.25rem;padding-bottom:2rem;border-bottom:1px solid var(--line)}.document-kicker,.document-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.75rem}.document-kicker{color:var(--sky-lost-strong);font-size:.8rem;font-weight:750}.document-kicker>span,.document-meta>span,.document-meta>time{display:inline-flex;align-items:center;gap:.4rem}.visibility{padding:.22rem .55rem;color:var(--muted-ink);background:var(--cloud);border-radius:999px;font-weight:650}.document-header h1{max-width:22ch;margin:0;font-size:2.25rem;line-height:1.18;letter-spacing:-.03em;text-wrap:balance;overflow-wrap:anywhere}.document-meta{color:var(--muted-ink);font-size:.82rem}.document-content{max-width:72ch;padding-top:2rem;margin-inline:auto}.empty-content{min-height:16rem;display:grid;place-items:center;align-content:center;gap:.5rem;padding:2rem;text-align:center;color:var(--muted-ink)}.empty-content svg{color:var(--sky-lost-strong)}.empty-content strong{color:var(--ink);font-size:1rem}.empty-content p{max-width:34rem;margin:0;font-size:.875rem}.state-panel{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1.25rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:12px}.state-panel svg{color:var(--danger)}.state-panel strong,.state-panel p{margin:0}.state-panel p{margin-top:.2rem;color:var(--muted-ink);font-size:.875rem}.loading{min-height:28rem;display:grid;align-content:start;gap:1rem}.loading-meta,.loading-title,.loading-line,.loading-body{background:var(--cloud);border-radius:8px}.loading-meta{width:8rem;height:1rem}.loading-title{width:min(75%,30rem);height:3rem}.loading-line{width:18rem;height:1rem}.loading-body{height:17rem;margin-top:1rem}@media(max-width:639px){.document-view{gap:1rem}.document-sheet{padding:1.25rem;border-radius:12px}.document-header{gap:1rem;padding-bottom:1.5rem}.document-header h1{font-size:1.8rem}.document-content{padding-top:1.5rem}.state-panel{grid-template-columns:auto minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.edit-link{transition:none}}
</style>
