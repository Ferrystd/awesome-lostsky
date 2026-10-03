<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { MailOpen, Pin } from '@lucide/vue'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { resolveEntities } from '../lib/markdown'

interface NoticeDetail {
  id: number
  entity_id?: number | null
  title?: string | null
  content?: string | null
  is_pinned?: number
  is_read?: number
  create_time?: number | string | null
  created_at?: number | string | null
}

type NoticeScope = 'team' | 'entity' | 'sent'

const route = useRoute()
const routeAccess = useRouteAccess()
const client = useQueryClient()
const noticeId = computed(() => Number(route.query.id || 0))
const scope = computed<NoticeScope>(() => route.meta.noticeScope as NoticeScope)
const copy = computed(() => scope.value === 'sent'
  ? { title: '通知查看情况', description: '查看通知正文及收件人的已读状态。', noun: '通知', backTo: '/notices/sent', backLabel: '返回已发送通知' }
  : scope.value === 'team'
  ? {
      title: '阅读站内通知',
      description: '阅读 LostSky 发给团队的通知，打开后自动标记已读。',
      noun: '站内通知',
      backTo: '/notices/team',
      backLabel: '返回站内通知列表',
    }
  : {
      title: '阅读通知',
      description: '阅读团队发给你的完整通知，打开后自动标记已读。',
      noun: '通知',
      backTo: '/personal/notices',
      backLabel: '返回通知列表',
    })
const confirmed = new Set<string>()
const detailQuery = useQuery({
  queryKey: computed(() => ['notice', scope.value, noticeId.value]),
  queryFn: () => routeAccess.read(() => api.get<NoticeDetail>('/notice/get', { scope: scope.value, id: noticeId.value })),
  enabled: computed(() => noticeId.value > 0 && !routeAccess.restricted.value),
})
const confirmNotice = useMutation({
  mutationFn: ({ id, noticeScope }: { id: number; noticeScope: NoticeScope }) => api.post('/notice/confirm', { id, scope: noticeScope }),
  onSuccess: async (_, { id, noticeScope }) => {
    client.setQueryData<NoticeDetail>(['notice', noticeScope, id], (current) => current ? { ...current, is_read: 1 } : current)
    await client.invalidateQueries({ queryKey: ['notices', noticeScope] })
  },
  onError: (_, { id, noticeScope }) => confirmed.delete(`${noticeScope}:${id}`),
})

watch(() => detailQuery.data.value, (notice) => {
  const key = `${scope.value}:${notice?.id ?? 0}`
  if (scope.value === 'sent' || !notice || notice.is_read === 1 || confirmed.has(key)) return
  confirmed.add(key)
  confirmNotice.mutate({ id: notice.id, noticeScope: scope.value })
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
    <AdminPageHeader :title="copy.title" :description="copy.description" :back-to="copy.backTo" :back-label="copy.backLabel" />

    <p v-if="!noticeId && !routeAccess.restricted.value" class="error" role="alert">缺少有效的{{ copy.noun }}编号，请返回列表重新选择。</p>
    <p v-else-if="!routeAccess.restricted.value && detailQuery.isError.value" class="error" role="alert">{{ friendlyError(detailQuery.error.value) }}</p>
    <div v-else-if="!routeAccess.restricted.value && detailQuery.isPending.value" class="loading" :aria-label="`正在读取${copy.noun}`"><span /><span /><span /></div>
    <template v-else-if="routeAccess.restricted.value"><header class="notice-header"><div class="notice-meta"><time>-</time><span class="read-state"><MailOpen :size="15" />-</span></div><h1>-</h1></header><section class="notice-content" :aria-label="`${copy.noun}正文`">-</section></template>
    <template v-else-if="detailQuery.data.value">
      <header class="notice-header">
        <div class="notice-meta">
          <span v-if="detailQuery.data.value.is_pinned === 1" class="pinned"><Pin :size="15" />置顶消息</span>
          <time>{{ time(detailQuery.data.value.create_time ?? detailQuery.data.value.created_at) }}</time>
          <span v-if="scope === 'sent'">收件人员 #{{ detailQuery.data.value.entity_id }}</span>
          <span class="read-state"><MailOpen :size="15" />{{ detailQuery.data.value.is_read === 1 ? '已读' : scope === 'sent' ? '未读' : '正在标记已读' }}</span>
        </div>
        <h1>{{ detailQuery.data.value.title || '无标题消息' }}</h1>
      </header>
      <section class="notice-content" :aria-label="`${copy.noun}正文`">
        <LsMarkdownRenderer
          :content="detailQuery.data.value.content || `这条${copy.noun}没有正文。`"
          :resolve-entities="resolveEntities"
        />
      </section>
    </template>

    <p v-if="confirmNotice.isError.value" class="error" role="alert">{{ copy.noun }}已打开，但已读状态更新失败：{{ friendlyError(confirmNotice.error.value) }}</p>
  </article>
</template>

<style scoped>
.notice-detail-view{max-width:56rem;display:grid;gap:1.75rem}.notice-header{padding-bottom:1.5rem;border-bottom:1px solid var(--line)}.notice-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.75rem;color:var(--muted-ink);font-size:.8rem}.notice-meta>span{display:inline-flex;align-items:center;gap:.3rem}.notice-meta .pinned{color:var(--sky-lost-strong);font-weight:750}.read-state{color:var(--ink)}.notice-header h1{margin:1rem 0 0;font-size:clamp(1.75rem,4vw,2.5rem);line-height:1.18;letter-spacing:-.025em;text-wrap:balance}.notice-content{min-height:14rem;padding:1.5rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:12px;overflow-wrap:anywhere}.notice-content :deep(.markdown){--markdown-h1-size:1.75rem;--markdown-h2-size:1.4rem;--markdown-h3-size:1.15rem;--markdown-h4-size:1rem}.loading{display:grid;gap:.75rem;padding:1.5rem;background:white;border:1px solid var(--line);border-radius:12px}.loading span{height:1rem;background:var(--surface-subtle);border-radius:999px;animation:pulse 1.3s infinite alternate}.loading span:first-child{width:55%}.loading span:last-child{width:72%}.error{padding:1rem;margin:0;color:var(--danger);background:white;border:1px solid color-mix(in oklch,var(--danger),white 70%);border-radius:10px}@keyframes pulse{to{opacity:.55}}@media(max-width:639px){.notice-detail-view{gap:1.25rem}.notice-content{padding:1.125rem}}@media(prefers-reduced-motion:reduce){.loading span{animation:none}}
</style>
