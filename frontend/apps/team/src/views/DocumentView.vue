<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { Pencil } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { resolveEntities } from '../lib/markdown'

const route = useRoute()
const id = computed(() => Number(route.query.id || 0))
const query = useQuery({ queryKey: computed(() => ['doc', id.value]), queryFn: () => api.get<Record<string, unknown>>('/doc/get', { id: id.value }), enabled: computed(() => id.value > 0) })
const back = computed(() => {
  const data = query.data.value
  const params = new URLSearchParams()
  if (data?.entity_id) params.set('entity_id', String(data.entity_id))
  return `/docs${params.size ? `?${params}` : ''}`
})
</script>

<template>
  <article class="document-view">
    <AdminPageHeader title="阅读文档" description="对象引用会根据当前有效状态解析，不可用对象只显示保存时的名称。" :back-to="back" back-label="返回文档列表">
      <template #actions><RouterLink v-if="id" class="edit-link" :to="`/doc-edit?id=${id}`"><Pencil :size="17" />编辑文档</RouterLink></template>
    </AdminPageHeader>
    <p v-if="!id" class="error" role="alert">缺少文档编号。</p>
    <p v-else-if="query.isError.value" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading" aria-label="正在加载文档" />
    <template v-else-if="query.data.value">
      <header class="document-header">
        <p>DOCUMENT · #{{ id }}</p>
        <h1>{{ query.data.value.title || '未命名文档' }}</h1>
        <span>最近更新 {{ query.data.value.update_time || query.data.value.create_time || '—' }}</span>
      </header>
      <LsMarkdownRenderer :content="String(query.data.value.content ?? '')" :resolve-entities="resolveEntities" />
    </template>
  </article>
</template>

<style scoped>
.document-view { max-width: 900px; display: grid; gap: 28px; }
.edit-link { min-height: 40px; display: inline-flex; align-items: center; gap: 7px; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); font-size: .86rem; font-weight: 650; text-decoration: none; }
.edit-link:hover { border-color: var(--primary); color: var(--primary); }
.document-header { padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.document-header p { margin: 0 0 10px; color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .13em; }
.document-header h1 { margin: 0 0 9px; font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.16; letter-spacing: -.035em; }
.document-header span { color: var(--text-tertiary); font-size: .82rem; }
.loading { height: 420px; border-radius: var(--radius-lg); background: var(--surface-subtle); }
.error { color: var(--danger); }
</style>
