<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { formatAbilityDenied, formatPermissionDenied } from '@lostsky/api/error-format'
import { ExternalLink, MessageCircle } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useQuery } from '@tanstack/vue-query'
import { NPagination } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { queryPositiveInteger } from '@lostsky/shared/routeQuery'
import { feedPosition, saveFeedPosition } from '../lib/feedNavigation'
import { hasWeiboPermission, loadAccess } from '../lib/workspace'
import type { WeiboFeedItem, WeiboFeedPage } from '../types'

const route = useRoute()
const router = useRouter()
const scope = `${location.host}:${auth.entity()?.type}:${auth.entity()?.id}`
const previous = feedPosition(scope)
const page = computed(() => route.query.page === undefined ? previous.page : queryPositiveInteger(route.query.page) ?? 1)
const visible = ref(!document.hidden)
let restoreTop: number | null = previous.top
onBeforeRouteLeave(() => { saveFeedPosition(scope, page.value, window.scrollY) })
watch(() => route.query.page, () => { restoreTop = null; window.scrollTo({ top: 0 }) })
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess(true), refetchInterval: 30_000 })
const accessReason = computed(() => {
  if (access.isPending.value) return '正在核对访问权限，请稍候'
  if (access.isError.value) return friendlyError(access.error.value)
  if (!hasWeiboPermission(access.data.value, 'weibo.personal.use')) return formatPermissionDenied(['weibo.personal.use'])
  const ability = access.data.value?.abilities.weibo
  return ability?.enabled ? '' : formatAbilityDenied('weibo', ability?.label || '微博')
})
const feed = useQuery({
  queryKey: computed(() => ['weibo-feed', page.value, accessReason.value]),
  queryFn: () => api.get<WeiboFeedPage>('/personal/feed', { page: page.value, limit: 20 }),
  enabled: computed(() => !access.isPending.value),
  refetchInterval: computed(() => visible.value ? 30_000 : false),
})
const displayedItems = computed(() => feed.data.value?.list || [])
const actionReason = (item: WeiboFeedItem) => accessReason.value || (item.restricted || feed.data.value?.restricted ? '当前只能查看点单预览，暂不可打开原帖' : '')
function commentTarget(item: WeiboFeedItem) {
  return { path: '/personal/interactions', query: { action: 'comment', from: 'feed', ...(!actionReason(item) ? { feed_post_id: String(item.id) } : {}) } }
}
function changePage(value: number) {
  void router.push({ path: '/personal/feed', query: { page: String(value) } })
}
watch(() => feed.isPending.value, async pending => {
  if (pending || restoreTop === null) return
  await nextTick()
  requestAnimationFrame(() => { if (restoreTop !== null) { window.scrollTo({ top: restoreTop }); restoreTop = null } })
}, { immediate: true, flush: 'post' })
let fallback: ReturnType<typeof setTimeout> | undefined
function cancelFallback() { if (fallback) clearTimeout(fallback); fallback = undefined }
function onVisibility() {
  visible.value = !document.hidden
  if (document.hidden) cancelFallback()
  else if (!feed.isFetching.value) void feed.refetch()
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
function openPost(item: WeiboFeedItem) {
  if (actionReason(item)) return feedback.info(actionReason(item))
  if (!item.status_url) return
  cancelFallback()
  if (!item.app_url) { window.location.assign(item.status_url); return }
  window.addEventListener('pagehide', cancelFallback, { once: true })
  fallback = setTimeout(() => { if (!document.hidden) window.location.assign(item.status_url!); cancelFallback() }, 1500)
  window.location.assign(item.app_url)
}
onBeforeUnmount(() => { cancelFallback(); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('pagehide', cancelFallback) })
</script>

<template>
  <div class="weibo-stack">
    <LsPageHeader title="点单信息流" description="查看最新点单，前往互动页回复。" />
    <LsAsyncState v-if="feed.isPending.value" state="loading" :rows="8" />
    <template v-else>
      <LsAsyncState v-if="feed.isError.value && !displayedItems.length" state="error" title="点单信息流加载失败" :description="friendlyError(feed.error.value)" />
      <template v-else-if="!displayedItems.length">
        <LsAsyncState v-if="feed.data.value?.poll_status === 'failed'" state="error" title="点单来源更新暂时失败" description="暂时无法获取点单内容，恢复后会自动更新。" />
        <LsEmptyState v-else-if="feed.data.value?.poll_status === 'unconfigured'" title="点单来源尚未配置" description="请联系管理员配置来源，准备好后会自动显示点单。" />
        <LsEmptyState v-else title="暂无点单微博" description="新点单会自动出现在这里。" />
      </template>
      <template v-if="displayedItems.length">
        <LsInlineError v-if="feed.isError.value" :message="`点单更新失败：${friendlyError(feed.error.value)}。已有内容仍可查看。`" />
        <LsInlineError v-else-if="feed.data.value?.poll_status === 'failed'" message="点单来源更新暂时失败，已有内容仍可查看。" />
        <p v-else-if="!feed.isError.value && feed.data.value?.poll_status === 'unconfigured'" class="feed-status" role="status">点单来源尚未配置，已有内容仍可查看。</p>
        <LsListToolbar :searchable="false" :count-label="`共 ${feed.data.value?.total ?? displayedItems.length} 条`" />
        <p v-if="feed.data.value?.updated_at" class="feed-status">最近更新：<time :datetime="new Date(feed.data.value.updated_at * 1000).toISOString()">{{ new Date(feed.data.value.updated_at * 1000).toLocaleString() }}</time></p>
        <section class="ls-list" aria-label="点单微博">
        <article v-for="item in displayedItems" :key="item.id" class="feed-post">
          <div class="feed-meta"><strong v-if="item.author_name">{{ item.author_name }}</strong><time :datetime="new Date(item.posted_at * 1000).toISOString()">{{ new Date(item.posted_at * 1000).toLocaleString() }}</time></div>
          <p class="feed-text">{{ item.text }}</p>
          <div class="weibo-actions">
            <LsButton variant="ghost" :disabled="Boolean(actionReason(item))" :disabled-reason="actionReason(item)" @click="openPost(item)"><template #icon><ExternalLink :size="18" /></template>打开微博</LsButton>
            <RouterLink class="feed-comment-link" :to="commentTarget(item)"><MessageCircle :size="18" />去评论</RouterLink>
          </div>
        </article>
      </section>
      <NPagination v-if="feed.data.value && feed.data.value.total > 20" :page="page" :page-size="20" :item-count="feed.data.value.total" :page-slot="5" simple @update:page="changePage" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.feed-status { margin: 0; color: var(--text-secondary); font-size: .875rem; overflow-wrap: anywhere; }
.feed-comment-link { display: inline-flex; align-items: center; gap: .5rem; min-height: 44px; padding-inline: .875rem; font-size: .875rem; font-weight: 650; }
.feed-comment-link:hover { color: var(--primary); }
.feed-post { min-width: 0; padding: 1.25rem 1rem; }
.feed-meta { display: flex; flex-wrap: wrap; gap: .5rem 1rem; color: var(--text-secondary); font-size: .875rem; }
.feed-text { max-width: 75ch; margin: .75rem 0 1rem; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.75; }
</style>
