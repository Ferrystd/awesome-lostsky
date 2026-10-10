<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import TeamSectionNav from '../components/TeamSectionNav.vue'
import { noticeSections } from '../lib/workspaceNavigation'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { feedback } from '@lostsky/ui/feedback'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Send, CheckCheck, Mail, MailOpen } from '@lucide/vue'
import { NPagination, NSelect } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
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

type NoticeScope = 'team' | 'entity' | 'sent'

const route = useRoute()
const routeAccess = useRouteAccess()
const client = useQueryClient()
const filter = ref<'all' | 'unread'>('all')
const filterOptions = [{ label: '全部', value: 'all' }, { label: '未读', value: 'unread' }]
const search = ref('')
const page = ref(1)
watch([filter, search, () => route.meta.noticeScope], () => { page.value = 1 })
const scope = computed<NoticeScope>(() => route.meta.noticeScope as NoticeScope)
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
  queryKey: computed(() => ['notices', scope.value, page.value, search.value, filter.value]),
  queryFn: () => api.get<NoticeList>('/notice/index', { scope: scope.value, page: page.value, keyword: search.value, is_read: filter.value === 'unread' ? 0 : '' }),
  enabled: computed(() => !routeAccess.restricted.value),
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
  onError: error => feedback.error(friendlyError(error)),
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
    <AdminPageHeader :title="scope === 'entity' ? '收件箱' : '通知中心'" :description="scope === 'sent' ? copy.description : routeAccess.restricted.value ? `${copy.description}。目前有 0 条未读。` : `${copy.description}。当前列表有 ${unreadCount} 条未读。`">
      <template #actions>
        <LsPagePrimaryAction v-if="scope !== 'entity'" :icon="Send" label="发送通知" to="/notices/send" />
        <LsPagePrimaryAction v-if="scope !== 'sent'" :icon="CheckCheck" label="全部标为已读" :loading="confirmAll.isPending.value" :disabled="routeAccess.restricted.value || unreadCount === 0" :disabled-reason="routeAccess.reason.value || '当前没有未读消息'" @click="confirmAll.mutate()" />
      </template>
    </AdminPageHeader>
    <TeamSectionNav v-if="scope !== 'entity'" label="通知分类" :items="noticeSections" />

    <LsListToolbar v-model="search" :placeholder="`搜索${copy.noun}`" :aria-label="`搜索${copy.noun}`" :count-label="routeAccess.restricted.value ? '0 条' : `${visible.length} 条`">
      <template #filters><NSelect v-model:value="filter" :options="filterOptions" :aria-label="`${copy.noun}筛选`" /></template>
    </LsListToolbar>

    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" />
    <LsResourceList v-else-if="visible.length" :aria-label="`${copy.noun}列表`">
      <LsResourceRow v-for="item in visible" :key="item.id" :title="item.title || '无标题消息'" :description="summary(item.content).slice(0, 120) || `这条${copy.noun}没有正文。`" :icon="item.is_read !== 1 ? Mail : MailOpen" :unread="item.is_read !== 1" :to="`${scope === 'entity' ? '/personal/notices' : `/notices/${scope}`}/detail?id=${item.id}`">
        <template #status><LsStatusTag :label="item.is_read === 1 ? '已读' : '未读'" :type="item.is_read === 1 ? 'success' : 'info'" /><LsStatusTag v-if="item.is_pinned === 1" label="置顶" /></template>
        <template #metadata><span v-if="scope === 'sent'">收件人员 #{{ item.entity_id }}</span><time>{{ time(item.create_time ?? item.created_at) }}</time></template>
      </LsResourceRow>
    </LsResourceList>
    <LsEmptyState :source="query.data.value"
      v-else
      :title="routeAccess.restricted.value ? `没有可显示的${copy.noun}` : filter === 'unread' ? `没有未读${copy.noun}` : copy.empty"
      :description="filter === 'unread' ? '新的通知会继续显示在这里。' : copy.emptyDescription"
    />

    <NPagination v-if="!routeAccess.restricted.value && (query.data.value?.total ?? 0) > 20" v-model:page="page" :item-count="query.data.value?.total ?? 0" :page-size="20" :page-slot="5" />


</template>
