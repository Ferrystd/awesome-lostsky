<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CheckCheck, Mail, MailOpen, Pin, RefreshCw, Send } from '@lucide/vue'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface NoticeItem {
  id: number
  title?: string | null
  content?: string | null
  is_pinned?: number
  is_read?: number
  create_time?: number | string | null
  created_at?: number | string | null
}

interface NoticeList {
  list?: NoticeItem[]
  total?: number
  can_send?: boolean
}

const client = useQueryClient()
const filter = ref<'all' | 'unread'>('all')
const query = useQuery({ queryKey: ['notices'], queryFn: () => api.get<NoticeList>('/notice/index') })
const notices = computed(() => Array.isArray(query.data.value?.list) ? query.data.value.list : [])
const visible = computed(() => filter.value === 'unread' ? notices.value.filter((item) => item.is_read !== 1) : notices.value)
const unreadCount = computed(() => notices.value.filter((item) => item.is_read !== 1).length)
const confirmAll = useMutation({
  mutationFn: () => api.post('/notice/confirmAll', {}),
  onSuccess: () => client.invalidateQueries({ queryKey: ['notices'] }),
})

function time(value: unknown) {
  if (!value) return '时间未知'
  const number = Number(value)
  return Number.isFinite(number)
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(number < 1e12 ? number * 1000 : number))
    : String(value)
}
</script>

<template>
  <div class="notices-view">
    <AdminPageHeader title="站内信" :description="`显示当前身份的收件箱：Team 接收 LostSky 通知，其他 Entity 接收 Team 通知。目前有 ${unreadCount} 封未读。`">
      <template #actions>
        <LsButton variant="secondary" size="sm" @click="query.refetch()"><RefreshCw :size="16" />刷新</LsButton>
        <LsButton size="sm" :loading="confirmAll.isPending.value" :disabled="unreadCount === 0" @click="confirmAll.mutate()"><CheckCheck :size="16" />全部确认</LsButton>
        <RouterLink v-if="query.data.value?.can_send" class="send-link" to="/notice-send"><Send :size="16" aria-hidden="true" />发送通知</RouterLink>
      </template>
    </AdminPageHeader>

    <div class="filter" aria-label="站内信筛选">
      <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">全部</button>
      <button type="button" :aria-pressed="filter === 'unread'" @click="filter = 'unread'">未读</button>
    </div>

    <p v-if="query.isError.value" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading" aria-label="正在加载站内信"><span v-for="i in 4" :key="i" /></div>
    <section v-else-if="visible.length" class="notice-list" aria-label="站内信列表">
      <RouterLink
        v-for="item in visible"
        :key="item.id"
        :to="`/notice-detail?id=${item.id}`"
        :class="{ unread: item.is_read !== 1 }"
      >
        <span class="notice-icon" aria-hidden="true"><Mail v-if="item.is_read !== 1" :size="20" /><MailOpen v-else :size="20" /></span>
        <span class="notice-copy">
          <span class="notice-meta">
            <span v-if="item.is_pinned === 1" class="pinned"><Pin :size="14" />置顶</span>
            <time>{{ time(item.create_time ?? item.created_at) }}</time>
          </span>
          <strong>{{ item.title || '无标题消息' }}</strong>
          <span class="summary">{{ String(item.content ?? '').slice(0, 120) || '这封站内信没有正文。' }}</span>
        </span>
        <span v-if="item.is_read !== 1" class="unread-label">未读</span>
      </RouterLink>
    </section>
    <section v-else class="empty">
      <MailOpen :size="34" aria-hidden="true" />
      <h3>{{ filter === 'unread' ? '没有未读站内信' : '目前没有站内信' }}</h3>
      <p>{{ filter === 'unread' ? '新的提醒会继续显示在这里。' : '系统提醒和团队消息会显示在这里。' }}</p>
    </section>

    <p v-if="confirmAll.isError.value" class="error" role="alert">{{ friendlyError(confirmAll.error.value) }}</p>
  </div>
</template>

<style scoped>
.notices-view{display:grid;gap:1.5rem}.send-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.45rem .75rem;color:white;background:var(--sky-lost-strong);border-radius:var(--radius-sm);font-size:.875rem;font-weight:650;text-decoration:none;transition:background-color .18s ease}.send-link:hover{background:color-mix(in oklch,var(--sky-lost-strong),black 12%)}.send-link:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:2px}.filter{width:fit-content;display:flex;gap:.25rem;padding:3px;background:white;border:1px solid var(--line);border-radius:9px}.filter button{min-height:44px;padding:0 1rem;color:var(--muted-ink);background:transparent;border:0;border-radius:7px;cursor:pointer}.filter button[aria-pressed=true]{color:white;background:var(--sky-lost-strong)}.notice-list{display:grid;gap:.75rem}.notice-list>a{min-height:104px;display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1rem 1.125rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:12px;text-decoration:none;transition:border-color .16s ease,box-shadow .16s ease}.notice-list>a:hover{border-color:color-mix(in oklch,var(--sky-lost),var(--line) 50%);box-shadow:0 6px 18px color-mix(in oklch,var(--ink),transparent 94%)}.notice-list>a:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:2px}.notice-list>a.unread{border-color:color-mix(in oklch,var(--sky-lost),var(--line) 55%)}.notice-icon{width:44px;height:44px;display:grid;place-items:center;color:var(--ink);background:var(--cloud);border-radius:10px}.unread .notice-icon{color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 90%)}.notice-copy{min-width:0;display:grid;gap:.35rem}.notice-meta{display:flex;align-items:center;gap:.625rem;color:var(--muted-ink);font-size:.75rem}.pinned{display:inline-flex;align-items:center;gap:.25rem;color:var(--sky-lost-strong);font-weight:700}.notice-copy strong{font-size:1rem}.summary{overflow:hidden;color:var(--muted-ink);font-size:.86rem;line-height:1.55;text-overflow:ellipsis;white-space:nowrap}.unread-label{padding:.25rem .55rem;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 90%);border-radius:999px;font-size:.72rem;font-weight:750}.empty{display:grid;justify-items:center;gap:.5rem;padding:3.5rem 1rem;color:var(--muted-ink);background:white;border:1px dashed var(--line);border-radius:12px;text-align:center}.empty h3,.empty p{margin:0}.loading{display:grid;gap:.75rem}.loading span{height:104px;background:var(--surface-subtle);border-radius:12px;animation:pulse 1.3s infinite alternate}.error{padding:1rem;margin:0;color:var(--danger);background:white;border:1px solid color-mix(in oklch,var(--danger),white 70%);border-radius:10px}@keyframes pulse{to{opacity:.55}}@media(max-width:639px){.notices-view{gap:1rem}.notice-list>a{grid-template-columns:44px minmax(0,1fr);padding:1rem}.unread-label{grid-column:2;width:fit-content}.summary{display:-webkit-box;overflow:hidden;white-space:normal;-webkit-box-orient:vertical;-webkit-line-clamp:2}}@media(prefers-reduced-motion:reduce){.send-link,.notice-list>a{transition:none}.loading span{animation:none}}
</style>
