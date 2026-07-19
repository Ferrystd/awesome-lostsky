<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { MailOpen, Pin } from '@lucide/vue'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface NoticeDetail {
  id: number
  title?: string | null
  content?: string | null
  is_pinned?: number
  is_read?: number
  create_time?: number | string | null
  created_at?: number | string | null
}

const route = useRoute()
const client = useQueryClient()
const noticeId = computed(() => Number(route.query.id || 0))
const confirmed = new Set<number>()
const detailQuery = useQuery({
  queryKey: computed(() => ['notice', noticeId.value]),
  queryFn: () => api.get<NoticeDetail>('/notice/get', { id: noticeId.value }),
  enabled: computed(() => noticeId.value > 0),
})
const confirmNotice = useMutation({
  mutationFn: (id: number) => api.post('/notice/confirm', { id }),
  onSuccess: async (_, id) => {
    client.setQueryData<NoticeDetail>(['notice', id], (current) => current ? { ...current, is_read: 1 } : current)
    await client.invalidateQueries({ queryKey: ['notices'] })
  },
  onError: (_, id) => confirmed.delete(id),
})

watch(() => detailQuery.data.value, (notice) => {
  if (!notice || notice.is_read === 1 || confirmed.has(notice.id)) return
  confirmed.add(notice.id)
  confirmNotice.mutate(notice.id)
}, { immediate: true })

function time(value: unknown) {
  if (!value) return '时间未知'
  const number = Number(value)
  return Number.isFinite(number)
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(number < 1e12 ? number * 1000 : number))
    : String(value)
}
</script>

<template>
  <article class="notice-detail-view">
    <AdminPageHeader title="阅读站内信" description="查看完整的系统提醒或团队消息。" back-to="/notice" back-label="返回站内信列表" />

    <p v-if="!noticeId" class="error" role="alert">缺少有效的站内信编号，请返回列表重新选择。</p>
    <p v-else-if="detailQuery.isError.value" class="error" role="alert">{{ friendlyError(detailQuery.error.value) }}</p>
    <div v-else-if="detailQuery.isPending.value" class="loading" aria-label="正在读取站内信"><span /><span /><span /></div>
    <template v-else-if="detailQuery.data.value">
      <header class="notice-header">
        <div class="notice-meta">
          <span v-if="detailQuery.data.value.is_pinned === 1" class="pinned"><Pin :size="15" />置顶消息</span>
          <time>{{ time(detailQuery.data.value.create_time ?? detailQuery.data.value.created_at) }}</time>
          <span class="read-state"><MailOpen :size="15" />{{ detailQuery.data.value.is_read === 1 ? '已确认' : '正在确认' }}</span>
        </div>
        <h1>{{ detailQuery.data.value.title || '无标题消息' }}</h1>
      </header>
      <section class="notice-content" aria-label="站内信正文">{{ detailQuery.data.value.content || '这封站内信没有正文。' }}</section>
    </template>

    <p v-if="confirmNotice.isError.value" class="error" role="alert">站内信已打开，但确认状态更新失败：{{ friendlyError(confirmNotice.error.value) }}</p>
  </article>
</template>

<style scoped>
.notice-detail-view{max-width:56rem;display:grid;gap:1.75rem}.notice-header{padding-bottom:1.5rem;border-bottom:1px solid var(--line)}.notice-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.75rem;color:var(--muted-ink);font-size:.8rem}.notice-meta>span{display:inline-flex;align-items:center;gap:.3rem}.notice-meta .pinned{color:var(--sky-lost-strong);font-weight:750}.read-state{color:var(--ink)}.notice-header h1{margin:1rem 0 0;font-size:clamp(1.75rem,4vw,2.5rem);line-height:1.18;letter-spacing:-.025em;text-wrap:balance}.notice-content{min-height:14rem;padding:1.5rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:12px;font-size:1rem;line-height:1.8;overflow-wrap:anywhere;white-space:pre-wrap}.loading{display:grid;gap:.75rem;padding:1.5rem;background:white;border:1px solid var(--line);border-radius:12px}.loading span{height:1rem;background:var(--surface-subtle);border-radius:999px;animation:pulse 1.3s infinite alternate}.loading span:first-child{width:55%}.loading span:last-child{width:72%}.error{padding:1rem;margin:0;color:var(--danger);background:white;border:1px solid color-mix(in oklch,var(--danger),white 70%);border-radius:10px}@keyframes pulse{to{opacity:.55}}@media(max-width:639px){.notice-detail-view{gap:1.25rem}.notice-content{padding:1.125rem}}@media(prefers-reduced-motion:reduce){.loading span{animation:none}}
</style>
