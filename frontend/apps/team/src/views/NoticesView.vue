<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import TeamCategoryLayout from '../components/TeamCategoryLayout.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { noticeSections } from '../lib/workspaceNavigation'
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Send, CheckCheck, Mail, MailOpen } from '@lucide/vue'
import { NPagination, NSelect } from 'naive-ui'
import { computed, nextTick, reactive, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { noticeListPath, noticeListQuery, noticeListState, noticeScroll, rememberNoticeScroll, type NoticeScope, type NoticeListState } from '../lib/noticeNavigation'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface NoticeItem {
  id: number
  entity_id?: number | null
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

const route = useRoute()
const router = useRouter()
const routeAccess = useRouteAccess()
const client = useQueryClient()
const filterOptions = [{ label: '全部', value: 'all' }, { label: '未读', value: 'unread' }]
const scope = computed<NoticeScope>(() => route.meta.noticeScope as NoticeScope)
const state = computed(() => noticeListState(route.query))
function updateState(patch: Partial<NoticeListState>, replace = false) {
  const next = { ...state.value, ...patch }
  void router[replace ? 'replace' : 'push']({ path: noticeListPath(scope.value), query: noticeListQuery(next) })
}
const filter = computed({ get: () => state.value.filter, set: value => updateState({ filter: value, page: 1 }) })
const search = computed({ get: () => state.value.keyword, set: value => updateState({ keyword: value.slice(0, 200), page: 1 }, true) })
const page = computed({ get: () => state.value.page, set: value => updateState({ page: value }) })
const categories = noticeSections.map(item => ({ key: item.to, ...item }))
const scrollKey = () => `${location.host}:${auth.user()?.id}:${auth.entity()?.type}:${auth.entity()?.id}:${noticeListPath(scope.value)}:${JSON.stringify(state.value)}`
let restorePosition = true
onBeforeRouteLeave(() => { rememberNoticeScroll(scrollKey(), window.scrollY) })
onBeforeRouteUpdate(() => { rememberNoticeScroll(scrollKey(), window.scrollY); restorePosition = true })
const copy = computed(() => scope.value === 'sent'
  ? { title: '已发送通知', description: '查看团队已发送通知及收件人的查看情况', noun: '已发送通知', empty: '还没有已发送通知', emptyDescription: '团队发送的通知会显示在这里。' }
  : scope.value === 'team'
  ? {
      title: '站内通知',
      description: 'LostSky 发给团队的共享通知，团队内统一查阅。',
      noun: '站内通知',
      empty: '目前没有站内通知',
      emptyDescription: '还没有通知；LostSky 会在这里下发贵团队通知。',
    }
  : {
      title: '通知',
      description: '当前人员收到的团队通知。',
      noun: '通知',
      empty: '目前没有通知',
      emptyDescription: '还没有通知；团队发给你后会显示在这里。',
    })
const query = useQuery({
  queryKey: computed(() => ['notices', scope.value, page.value, search.value, filter.value] as const),
  queryFn: ({ queryKey: [, originScope, originPage, keyword, originFilter] }) => api.get<NoticeList>('/notice/index', { scope: originScope, page: originPage, keyword, is_read: originFilter === 'unread' ? 0 : '' }),
  enabled: computed(() => !routeAccess.restricted.value),
})
watch([() => query.isFetching.value, () => route.fullPath], async () => {
  if (!restorePosition || query.isFetching.value) return
  restorePosition = false
  const path = route.fullPath
  const top = noticeScroll(scrollKey())
  await nextTick()
  requestAnimationFrame(() => { if (route.fullPath === path) window.scrollTo({ top }) })
}, { immediate: true, flush: 'post' })
const notices = computed(() => !routeAccess.restricted.value && Array.isArray(query.data.value?.list) ? query.data.value.list : [])
const visible = computed(() => {
  const scoped = filter.value === 'unread' ? notices.value.filter((item) => item.is_read !== 1) : notices.value
  const keyword = search.value.trim().toLocaleLowerCase()
  return keyword ? scoped.filter(item => `${item.title ?? ''} ${item.content ?? ''}`.toLocaleLowerCase().includes(keyword)) : scoped
})
const unreadCount = computed(() => notices.value.filter((item) => item.is_read !== 1).length)
const errors = reactive<Partial<Record<NoticeScope, string>>>({})
const confirmAll = useMutation({
  mutationFn: (originScope: NoticeScope) => api.post('/notice/confirmAll', { scope: originScope }),
  onMutate: originScope => { delete errors[originScope] },
  onSuccess: (_, originScope) => client.invalidateQueries({ queryKey: ['notices', originScope] }),
  onError: (error, originScope) => { errors[originScope] = friendlyError(error) },
})
const description = computed(() => scope.value === 'sent' ? copy.value.description : `${copy.value.description}当前页有 ${routeAccess.restricted.value ? 0 : unreadCount.value} 条未读。`)
const headerSlot = computed(() => scope.value === 'entity' ? 'actions' : 'aside')
function detailTo(id: number) {
  return { path: `${noticeListPath(scope.value)}/detail`, query: { id: String(id), ...noticeListQuery(state.value) } }
}

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
    <AdminPageHeader v-if="scope !== 'entity'" title="通知中心" description="查看团队收到的站内通知与已发送通知。" />
    <component :is="scope === 'entity' ? 'div' : TeamCategoryLayout" v-bind="scope === 'entity' ? {} : { items: categories, current: route.path, label: '通知分类' }">
    <section class="notice-list-content" :aria-label="scope === 'entity' ? '收件箱' : copy.title">
    <component :is="scope === 'entity' ? AdminPageHeader : LsSectionHeader" class="notice-content-header" :title="scope === 'entity' ? '收件箱' : copy.title" :description="description">
      <template #[headerSlot]>
        <LsPagePrimaryAction v-if="scope !== 'entity'" :icon="Send" label="发送通知" to="/notices/send" />
        <LsPagePrimaryAction v-if="scope !== 'sent'" :icon="CheckCheck" label="全部标为已读" :loading="confirmAll.isPending.value && confirmAll.variables.value === scope" :disabled="confirmAll.isPending.value || routeAccess.restricted.value || unreadCount === 0" :disabled-reason="routeAccess.reason.value || (confirmAll.isPending.value ? '请等待当前标记操作完成' : '当前页没有未读消息')" @click="confirmAll.mutate(scope)" />
      </template>
    </component>
    <LsInlineError v-if="errors[scope]" :message="errors[scope]!" />

    <LsListToolbar v-model="search" :placeholder="`搜索${copy.noun}`" :aria-label="`搜索${copy.noun}`" :count-label="routeAccess.restricted.value ? '0 条' : `${visible.length} 条`">
      <template #filters><NSelect v-model:value="filter" :options="filterOptions" :aria-label="`${copy.noun}筛选`" /></template>
    </LsListToolbar>

    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" />
    <LsResourceList v-else-if="visible.length" :aria-label="`${copy.noun}列表`">
      <LsResourceRow v-for="item in visible" :key="item.id" :title="item.title || '无标题消息'" :description="summary(item.content).slice(0, 120) || `这条${copy.noun}没有正文。`" :icon="item.is_read !== 1 ? Mail : MailOpen" :unread="item.is_read !== 1" :to="detailTo(item.id)">
        <template #status><LsStatusTag :label="item.is_read === 1 ? '已读' : '未读'" :type="item.is_read === 1 ? 'success' : 'info'" /><LsStatusTag v-if="item.is_pinned === 1" label="置顶" /></template>
        <template #metadata><span v-if="scope === 'sent'">收件人员 #{{ item.entity_id }}</span><time>{{ time(item.create_time ?? item.created_at) }}</time></template>
      </LsResourceRow>
    </LsResourceList>
    <LsEmptyState :source="query.data.value"
      v-else
      :title="routeAccess.restricted.value ? `没有可显示的${copy.noun}` : filter === 'unread' ? `没有未读${copy.noun}` : copy.empty"
      :description="filter === 'unread' ? '新的通知会继续显示在这里。' : copy.emptyDescription"
    />

    <div class="notice-pagination"><NPagination v-if="!routeAccess.restricted.value && (query.data.value?.total ?? 0) > 20" v-model:page="page" :item-count="query.data.value?.total ?? 0" :page-size="20" :page-slot="5" /></div>
    </section>
    </component>
  </div>
</template>

<style scoped>
.notices-view, .notice-list-content { min-width: 0; display: grid; gap: 1.5rem; }
.notice-pagination { min-width: 0; overflow-x: auto; }
</style>
