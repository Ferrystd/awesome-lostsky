<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { ArrowLeft, BookOpen, Clock3, FileText, Pencil, UserRound } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { NTag } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
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
  <section class="document-reading-page" aria-label="文档阅读">
      <nav class="document-navigation" aria-label="文档操作">
        <LsPageLink :icon="ArrowLeft" label="返回文档列表" :to="back" />
        <LsPageLink v-if="id" :icon="Pencil" label="编辑文档" :to="`/doc-edit?id=${id}`" />
      </nav>
    <article class="document-view">

      <LsPanel v-if="!id"><section class="state-panel error" role="alert">
        <FileText :size="24" />
        <div><h1 class="state-title" tabindex="-1">无法打开文档</h1><p>链接中缺少有效的文档编号，请返回列表重新选择。</p></div>
      </section></LsPanel>

      <LsPanel v-else-if="query.isError.value && !routeAccess.restricted.value"><section class="state-panel error" role="alert">
        <FileText :size="24" />
        <div><h1 class="state-title" tabindex="-1">文档加载失败</h1><p>{{ friendlyError(query.error.value) }}</p></div>
      </section></LsPanel>

      <LsPanel v-else-if="query.isPending.value && !routeAccess.restricted.value"><section class="document-sheet loading" aria-label="正在加载文档">
        <h1 class="state-title" tabindex="-1">正在加载文档</h1>
        <div class="loading-meta ls-skeleton" />
        <div class="loading-title ls-skeleton" />
        <div class="loading-line ls-skeleton" />
        <div class="loading-body ls-skeleton" />
      </section></LsPanel>

      <section v-else-if="document || routeAccess.restricted.value" class="document-sheet">
        <header class="document-header">
          <div class="document-kicker">
            <span><BookOpen :size="16" />文档 #{{ routeAccess.restricted.value ? '-' : id }}</span>
            <NTag v-if="visibilityLabel" size="small" :bordered="false">{{ visibilityLabel }}</NTag>
          </div>
          <h1 tabindex="-1">{{ routeAccess.restricted.value ? '文档' : title }}</h1>
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
      <LsPanel v-else><h1 class="state-title" tabindex="-1">暂无文档内容</h1><p>请返回列表重新选择文档。</p></LsPanel>
    </article>
  </section>
</template>

<style scoped>
.document-reading-page{width:min(100%,72ch);margin-inline:auto;display:grid;gap:clamp(1.5rem,4vw,3rem);padding-block:1rem 3rem;min-width:0}
.document-navigation{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem}
.state-title{margin:0;font-size:1.25rem;line-height:1.4}
.document-view{min-width:0;display:grid;gap:1.5rem}
.document-sheet{min-width:0;color:var(--text-primary)}
.document-header{display:grid;gap:1rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)}
.document-kicker,.document-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.75rem;color:var(--text-secondary);font-size:.8rem}
.document-kicker>span,.document-meta>span,.document-meta>time{display:inline-flex;align-items:center;gap:.4rem;min-width:0}
.document-header h1{margin:0;font-size:clamp(1.75rem,4vw,2.75rem);line-height:1.25;text-wrap:balance;overflow-wrap:anywhere}
.document-content{max-width:72ch;padding-top:1.5rem;margin-inline:auto;overflow-wrap:anywhere}
.empty-content{display:grid;place-items:center;align-content:center;gap:.5rem;padding:2rem 0;text-align:center;color:var(--text-secondary)}
.empty-content strong{color:var(--text-primary);font-size:1rem}.empty-content p{max-width:34rem;margin:0;font-size:.875rem}
.state-panel{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:1rem}
.state-panel svg{color:var(--danger)}.state-panel strong,.state-panel p{margin:0}.state-panel p{margin-top:.2rem;color:var(--text-secondary);font-size:.875rem}
.loading{display:grid;align-content:start;gap:1rem}.loading-meta,.loading-title,.loading-line,.loading-body{max-width:100%;background:var(--surface-subtle);border-radius:var(--radius-sm)}
.loading-meta{width:8rem;height:1rem}.loading-title{width:min(75%,30rem);height:3rem}.loading-line{width:18rem;height:1rem}.loading-body{height:17rem;margin-top:1rem}
</style>
