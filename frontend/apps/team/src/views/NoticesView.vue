<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CheckCheck, Mail, MailOpen, Pin } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
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

type NoticeScope = 'team' | 'entity'

const route = useRoute()
const client = useQueryClient()
const filter = ref<'all' | 'unread'>('all')
const filterOptions = [{ label: '全部', value: 'all' }, { label: '未读', value: 'unread' }]
const search = ref('')
const scope = computed<NoticeScope>(() => route.meta.noticeScope === 'team' ? 'team' : 'entity')
const copy = computed(() => scope.value === 'team'
  ? {
      title: '站内通知',
      description: 'LostSky 发给 Team 的共享通知',
      noun: '站内通知',
      empty: '目前没有站内通知',
      emptyDescription: 'LostSky 发给 Team 的通知会显示在这里。',
    }
  : {
      title: '通知',
      description: '当前实体收到的 Team 单向通知',
      noun: '通知',
      empty: '目前没有通知',
      emptyDescription: 'Team 发给当前实体的通知会显示在这里。',
    })
const query = useQuery({
  queryKey: computed(() => ['notices', scope.value]),
  queryFn: () => api.get<NoticeList>('/notice/index', { scope: scope.value }),
})
const notices = computed(() => Array.isArray(query.data.value?.list) ? query.data.value.list : [])
const visible = computed(() => {
  const scoped = filter.value === 'unread' ? notices.value.filter((item) => item.is_read !== 1) : notices.value
  const keyword = search.value.trim().toLocaleLowerCase()
  return keyword ? scoped.filter(item => `${item.title ?? ''} ${item.content ?? ''}`.toLocaleLowerCase().includes(keyword)) : scoped
})
const unreadCount = computed(() => notices.value.filter((item) => item.is_read !== 1).length)
const confirmAll = useMutation({
  mutationFn: () => api.post('/notice/confirmAll', { scope: scope.value }),
  onSuccess: () => client.invalidateQueries({ queryKey: ['notices', scope.value] }),
})

function time(value: unknown) {
  if (!value) return '时间未知'
  const number = Number(value)
  return Number.isFinite(number)
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(number < 1e12 ? number * 1000 : number))
    : String(value)
}

function summary(content: string | null | undefined) {
  return String(content ?? '').replace(/[#>*_`\[\]()~-]/g, ' ').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="notices-view">
    <AdminPageHeader :title="copy.title" :description="`${copy.description}。目前有 ${unreadCount} 条未读。`">
      <template #actions>
        <LsButton size="sm" :loading="confirmAll.isPending.value" :disabled="unreadCount === 0" @click="confirmAll.mutate()"><CheckCheck :size="16" />全部标为已读</LsButton>
      </template>
    </AdminPageHeader>

    <LsListToolbar v-model="search" :placeholder="`搜索${copy.noun}`" :aria-label="`搜索${copy.noun}`" :count-label="`${visible.length} 条`">
      <template #filters><NSelect v-model:value="filter" class="notice-filter" :options="filterOptions" :aria-label="`${copy.noun}筛选`" /></template>
    </LsListToolbar>

    <p v-if="query.isError.value" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading" :aria-label="`正在加载${copy.noun}`"><span v-for="i in 4" :key="i" /></div>
    <section v-else-if="visible.length" class="notice-list" :aria-label="`${copy.noun}列表`">
      <RouterLink
        v-for="item in visible"
        :key="item.id"
        :to="`/notices/${scope}/detail?id=${item.id}`"
        :class="{ unread: item.is_read !== 1 }"
      >
        <span class="notice-icon" aria-hidden="true"><Mail v-if="item.is_read !== 1" :size="20" /><MailOpen v-else :size="20" /></span>
        <span class="notice-copy">
          <span class="notice-meta">
            <span v-if="item.is_pinned === 1" class="pinned"><Pin :size="14" />置顶</span>
            <time>{{ time(item.create_time ?? item.created_at) }}</time>
          </span>
          <strong>{{ item.title || '无标题消息' }}</strong>
          <span class="summary">{{ summary(item.content).slice(0, 120) || `这条${copy.noun}没有正文。` }}</span>
        </span>
        <LsStatusTag v-if="item.is_read !== 1" label="未读" type="info" />
      </RouterLink>
    </section>
    <LsEmptyState
      v-else
      :title="filter === 'unread' ? `没有未读${copy.noun}` : copy.empty"
      :description="filter === 'unread' ? '新的通知会继续显示在这里。' : copy.emptyDescription"
    />

    <p v-if="confirmAll.isError.value" class="error" role="alert">{{ friendlyError(confirmAll.error.value) }}</p>
  </div>
</template>

<style scoped>
.notices-view{display:grid;gap:1.5rem}.notice-filter{width:10rem}.notice-list{display:grid;overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.notice-list>a{min-height:104px;display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1rem 1.125rem;color:var(--ink);background:white;border-bottom:1px solid var(--line);text-decoration:none;transition:background-color var(--motion-fast) var(--ease-standard)}.notice-list>a:last-child{border-bottom:0}.notice-list>a:hover{background:var(--cloud)}.notice-list>a:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 72%);outline-offset:-3px}.notice-list>a.unread{background:color-mix(in oklch,var(--sky-lost),white 97%)}.notice-icon{width:44px;height:44px;display:grid;place-items:center;color:var(--ink);background:var(--cloud);border-radius:10px}.unread .notice-icon{color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 90%)}.notice-copy{min-width:0;display:grid;gap:.35rem}.notice-meta{display:flex;align-items:center;gap:.625rem;color:var(--muted-ink);font-size:.75rem}.pinned{display:inline-flex;align-items:center;gap:.25rem;color:var(--sky-lost-strong);font-weight:700}.notice-copy strong{font-size:1rem}.summary{overflow:hidden;color:var(--muted-ink);font-size:.86rem;line-height:1.55;text-overflow:ellipsis;white-space:nowrap}.empty{display:grid;justify-items:center;gap:.5rem;padding:3.5rem 1rem;color:var(--muted-ink);background:white;border:1px dashed var(--line);border-radius:12px;text-align:center}.empty h3,.empty p{margin:0}.loading{display:grid;gap:.75rem}.loading span{height:104px;background:var(--surface-subtle);border-radius:12px;animation:pulse 1.3s infinite alternate}.error{padding:1rem;margin:0;color:var(--danger);background:white;border:1px solid color-mix(in oklch,var(--danger),white 70%);border-radius:10px}@keyframes pulse{to{opacity:.55}}@media(max-width:639px){.notices-view{gap:1rem}.notice-filter{width:100%}.notice-list>a{grid-template-columns:44px minmax(0,1fr);padding:1rem}.notice-list :deep(.n-tag){grid-column:2;width:fit-content}.summary{display:-webkit-box;overflow:hidden;white-space:normal;-webkit-box-orient:vertical;-webkit-line-clamp:2}}@media(prefers-reduced-motion:reduce){.notice-list>a{transition:none}.loading span{animation:none}}
</style>
