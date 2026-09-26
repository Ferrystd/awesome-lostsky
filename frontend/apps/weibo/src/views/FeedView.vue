<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { formatAbilityDenied, formatPermissionDenied } from '@lostsky/api/error-format'
import { ExternalLink, MessageCircle } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useQuery } from '@tanstack/vue-query'
import { NButton, NFlex, NList, NListItem, NPagination } from 'naive-ui'
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
const dateTimeFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
const formatTime = (timestamp: number) => dateTimeFormat.format(new Date(timestamp * 1000))
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
    <LsPageHeader title="点单信息流" description="浏览最新点单，选择微博继续评论。" />
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
        <section class="feed-results" aria-label="点单微博">
          <NFlex class="feed-summary" justify="space-between" align="center" :size="8">
            <span role="status">共 <strong>{{ feed.data.value?.total ?? displayedItems.length }}</strong> 条点单</span>
            <span v-if="feed.data.value?.updated_at">最近更新 <time :datetime="new Date(feed.data.value.updated_at * 1000).toISOString()" :title="new Date(feed.data.value.updated_at * 1000).toLocaleString()">{{ formatTime(feed.data.value.updated_at) }}</time></span>
          </NFlex>
          <NList bordered size="small">
            <NListItem v-for="item in displayedItems" :key="item.id">
              <article class="feed-post">
                <div class="feed-content">
                  <p class="feed-text">{{ item.text }}</p>
                  <NFlex class="feed-meta" align="center" :size="[12, 4]">
                    <time :datetime="new Date(item.posted_at * 1000).toISOString()" :title="new Date(item.posted_at * 1000).toLocaleString()">{{ formatTime(item.posted_at) }}</time>
                    <span v-if="item.author_name">{{ item.author_name }}</span>
                  </NFlex>
                </div>
                <NFlex class="feed-actions" align="center" :size="4">
                  <LsButton variant="ghost" :disabled="Boolean(actionReason(item))" :disabled-reason="actionReason(item)" @click="openPost(item)"><template #icon><ExternalLink :size="18" aria-hidden="true" /></template>打开微博</LsButton>
                  <RouterLink v-slot="{ href, navigate }" :to="commentTarget(item)" custom>
                    <NButton tag="a" :href="href" quaternary @click="navigate"><template #icon><MessageCircle :size="18" aria-hidden="true" /></template>去评论</NButton>
                  </RouterLink>
                </NFlex>
              </article>
            </NListItem>
          </NList>
          <NFlex v-if="feed.data.value && feed.data.value.total > 20" justify="end">
            <NPagination :page="page" :page-size="20" :item-count="feed.data.value.total" :page-slot="5" simple @update:page="changePage" />
          </NFlex>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.feed-status { margin: 0; color: var(--text-secondary); font-size: .875rem; overflow-wrap: anywhere; }
.feed-results { display: grid; gap: .75rem; min-width: 0; }
.feed-summary { color: var(--text-secondary); font-size: .875rem; font-variant-numeric: tabular-nums; }
.feed-summary strong { color: var(--text); font-weight: 600; }
.feed-post { display: grid; gap: .5rem 1.5rem; min-width: 0; }
.feed-content { display: grid; gap: .5rem; min-width: 0; }
.feed-meta { color: var(--text-secondary); font-size: .875rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.feed-text { max-width: 75ch; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 1rem; line-height: 1.65; }
.feed-actions { justify-self: end; }
@media (min-width: 768px) {
  .feed-post { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
}
</style>
