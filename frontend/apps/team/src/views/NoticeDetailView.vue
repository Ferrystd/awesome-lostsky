<script setup lang="ts">
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { MailOpen, Pin } from '@lucide/vue'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import { resolveEntities } from '../lib/markdown'
import { noticeListPath, noticeListQuery, noticeListState, type NoticeScope } from '../lib/noticeNavigation'
import { queryPositiveInteger } from '@lostsky/shared/routeQuery'

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

interface NoticeResult { scope: NoticeScope; id: number; notice: NoticeDetail | null }

const route = useRoute()
const routeAccess = useRouteAccess()
const client = useQueryClient()
const noticeId = computed(() => queryPositiveInteger(route.query.id) ?? 0)
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
const backTo = computed(() => ({ path: noticeListPath(scope.value), query: noticeListQuery(noticeListState(route.query)) }))
const detailQuery = useQuery({
  queryKey: computed(() => ['notice', scope.value, noticeId.value] as const),
  queryFn: async ({ queryKey: [, originScope, id] }): Promise<NoticeResult> => ({ scope: originScope, id, notice: await routeAccess.read(() => api.get<NoticeDetail>('/notice/get', { scope: originScope, id })) ?? null }),
  enabled: computed(() => noticeId.value > 0 && !routeAccess.restricted.value),
})
const notice = computed(() => detailQuery.data.value?.scope === scope.value && detailQuery.data.value?.id === noticeId.value ? detailQuery.data.value.notice : null)
const confirmNotice = useMutation({
  mutationFn: ({ id, noticeScope }: { id: number; noticeScope: NoticeScope }) => api.post('/notice/confirm', { id, scope: noticeScope }),
  onSuccess: async (_, { id, noticeScope }) => {
    client.setQueryData<NoticeResult>(['notice', noticeScope, id], (current) => current?.notice ? { ...current, notice: { ...current.notice, is_read: 1 } } : current)
    await client.invalidateQueries({ queryKey: ['notices', noticeScope] })
  },
  onError: (_, { id, noticeScope }) => confirmed.delete(`${noticeScope}:${id}`),
})

watch(notice, (value) => {
  const key = `${scope.value}:${value?.id ?? 0}`
  if (scope.value === 'sent' || !value || value.id !== noticeId.value || value.is_read === 1 || confirmed.has(key)) return
  confirmed.add(key)
  confirmNotice.mutate({ id: value.id, noticeScope: scope.value })
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
  <LsDetailPage :title="copy.title" :description="copy.description" :back-to="backTo" :back-label="copy.backLabel">
    <article class="notice-detail-view">

      <LsInlineError v-if="!noticeId && !routeAccess.restricted.value" :message="`缺少有效的${copy.noun}编号，请返回列表重新选择。`" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && detailQuery.isError.value" state="error" :description="friendlyError(detailQuery.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && detailQuery.isPending.value" state="loading" :rows="3" />
      <LsEmptyState v-else-if="routeAccess.restricted.value" :source="notice" title="暂无可显示的通知" description="返回通知列表查看其他通知。" />
      <template v-else-if="notice">
        <header class="notice-header">
          <div class="notice-meta">
            <span v-if="notice.is_pinned === 1" class="pinned"><Pin :size="15" />置顶消息</span>
            <time>{{ time(notice.create_time ?? notice.created_at) }}</time>
            <span v-if="scope === 'sent'">收件人员 #{{ notice.entity_id }}</span>
            <span class="read-state"><MailOpen :size="15" />{{ notice.is_read === 1 ? '已读' : scope === 'sent' ? '未读' : '正在标记已读' }}</span>
          </div>
          <h2>{{ notice.title || '无标题消息' }}</h2>
        </header>
        <LsPanel><section class="notice-content" :aria-label="`${copy.noun}正文`">
          <LsMarkdownRenderer
            context="document"
            :content="notice.content || `这条${copy.noun}没有正文。`"
            :resolve-entities="resolveEntities"
          />
        </section></LsPanel>
      </template>

      <LsInlineError v-if="confirmNotice.isError.value && confirmNotice.variables.value?.noticeScope === scope && confirmNotice.variables.value?.id === noticeId" :message="`${copy.noun}已打开，但已读状态更新失败：${friendlyError(confirmNotice.error.value)}`" />
    </article>
  </LsDetailPage>
</template>

<style scoped>
.notice-detail-view{display:grid;gap:1.5rem}.notice-header{padding-bottom:1.5rem;border-bottom:1px solid var(--line)}.notice-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.75rem;color:var(--muted-ink);font-size:.8rem}.notice-meta>span{display:inline-flex;align-items:center;gap:.3rem}.notice-meta .pinned{color:var(--sky-lost-strong);font-weight:750}.read-state{color:var(--ink)}.notice-header h2{margin:1rem 0 0;font-size:1.5rem;line-height:1.35;text-wrap:balance}.notice-content{max-width:72ch;min-height:14rem;margin-inline:auto;overflow-wrap:anywhere}@media(max-width:639px){.notice-detail-view{gap:1.25rem}}
</style>
