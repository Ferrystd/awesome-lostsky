<script setup lang="ts">
import { readAccessReason } from '@lostsky/api/access-result'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import WeiboAccountField from '../components/WeiboAccountField.vue'
import WeiboFeedCommentComposer from '../components/WeiboFeedCommentComposer.vue'
import { interactionScopeKey } from '../lib/interactionDraft'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { formatAbilityDenied, formatPermissionDenied } from '@lostsky/api/error-format'
import { ExternalLink, MessageCircle } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NFlex, NList, NListItem, NSpin } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { clearFeedDraft, feedPosition, saveFeedDraft, saveFeedPosition, takeFeedDraft, type FeedCommentDraft } from '../lib/feedNavigation'
import { expectedEntity, hasWeiboPermission, loadAccess } from '../lib/workspace'
import type { WeiboAccount, WeiboCommentPreset, WeiboOperation, WeiboFeedItem, WeiboFeedPage } from '../types'

const router = useRouter()
const queryClient = useQueryClient()
const scope = `${location.host}:${auth.entity()?.type}:${auth.entity()?.id}`
const previous = feedPosition(scope)
const visible = ref(!document.hidden)
const nextPageError = ref<unknown>(null)
const loadingMore = ref(false)
let restoreTop: number | null = previous.top
onBeforeRouteLeave(() => { saveFeedPosition(scope, window.scrollY) })
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess(true), refetchInterval: computed(() => visible.value ? 30_000 : false) })
const accessMode = computed(() => {
  if (access.isPending.value) return undefined
  if (access.isError.value) return 'unavailable'
  if (!hasWeiboPermission(access.data.value, 'weibo.personal.use')) return 'permission'
  return access.data.value?.abilities.weibo?.enabled ? 'full' : 'ability'
})
const accessReason = computed(() => {
  if (access.isPending.value) return '正在核对访问权限，请稍候'
  if (access.isError.value) return friendlyError(access.error.value)
  if (!hasWeiboPermission(access.data.value, 'weibo.personal.use')) return formatPermissionDenied(['weibo.personal.use'])
  const ability = access.data.value?.abilities.weibo
  return ability?.enabled ? '' : formatAbilityDenied('weibo', ability?.label || '微博')
})
const feed = useInfiniteQuery({
  queryKey: computed(() => ['weibo-feed', scope, accessMode.value]),
  initialPageParam: 1,
  queryFn: ({ pageParam, signal }) => api.get<WeiboFeedPage>('/personal/feed', { page: pageParam, limit: 20 }, { signal }),
  getNextPageParam: (last, _pages, lastPageParam) => last.list.length && lastPageParam * last.limit < last.total ? lastPageParam + 1 : undefined,
  enabled: computed(() => accessMode.value !== undefined && accessMode.value !== 'unavailable'),
  staleTime: 30_000,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchInterval: computed(() => visible.value ? 30_000 : false),
})
const feedSummary = computed(() => feed.data.value?.pages[0])
const feedRestricted = computed(() => feed.data.value?.pages.some(page => page.restricted) ?? false)
const displayedItems = computed(() => {
  const seen = new Set<number>()
  return (feed.data.value?.pages ?? []).flatMap(page => (feedRestricted.value || accessMode.value !== 'full') && !page.restricted ? [] : page.list)
    .filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
})
watch(computed(() => {
  if (!displayedItems.value.length) return ''
  if (feed.isError.value && !feed.isFetchNextPageError.value) return `点单更新失败：${friendlyError(feed.error.value)}。已有内容仍可查看。`
  return feedSummary.value?.poll_status === 'failed' ? '点单来源更新暂时失败，已有内容仍可查看。' : ''
}), message => { if (message) feedback.error(message) }, { immediate: true })
watch(accessMode, mode => {
  if (mode === undefined) return
  // Also discard obsolete scopes when permission changed while this page was unmounted.
  const obsolete = queryClient.getQueryCache().findAll({ queryKey: ['weibo-feed', scope] })
    .filter(query => query.queryKey[2] !== mode)
  for (const query of obsolete) queryClient.removeQueries({ queryKey: query.queryKey, exact: true })
  if (obsolete.some(query => query.queryKey[2] !== undefined)) {
    saveFeedPosition(scope, 0)
    nextPageError.value = null
    restoreTop = 0
  }
}, { immediate: true, flush: 'sync' })
const dateTimeFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
const formatTime = (timestamp: number) => dateTimeFormat.format(new Date(timestamp * 1000))
const actionReason = (item: WeiboFeedItem) => accessReason.value || (item.restricted || feedRestricted.value ? '当前只能查看点单预览，暂不可打开原帖' : '')
const commentScope = computed(() => interactionScopeKey(access.data.value, true))
const accountId = ref<number | null>(null)
const drafts = reactive<Record<number, FeedCommentDraft>>({})
let commentEpoch = 0
const accounts = useQuery({
  structuralSharing: false,
  queryKey: computed(() => ['weibo-feed-accounts', commentScope.value]),
  queryFn: ({ signal }) => api.get<WeiboAccount[]>('/personal/accounts', undefined, { signal }),
  enabled: computed(() => accessMode.value === 'full'),
})
const presets = useQuery({
  structuralSharing: false,
  queryKey: computed(() => ['weibo-feed-presets', commentScope.value]),
  queryFn: ({ signal }) => api.get<WeiboCommentPreset[]>('/personal/comment-presets', undefined, { signal }),
  enabled: computed(() => accessMode.value === 'full' && Object.values(drafts).some(draft => draft.expanded)),
})
const accountReason = computed(() => accessReason.value || readAccessReason(accounts.data.value))
const presetReason = computed(() => accessReason.value || readAccessReason(presets.data.value))
const selectedAccount = computed(() => accountReason.value ? undefined : accounts.data.value?.find(account => account.id === accountId.value))
watch([accountReason, accounts.data], ([reason, candidates]) => {
  if (reason || (candidates && !candidates.some(account => account.id === accountId.value))) accountId.value = null
})
let preservingDraft = false
useUnsavedChangesGuard(computed(() => Object.values(drafts).some(draft => draft.pending || draft.text !== draft.baseline)), {
  shouldConfirm: to => !(preservingDraft && to.path === '/personal/interactions/comment-presets'),
})
watch([commentScope, access.isFetching, feed.isPending, accessMode], () => {
  if (preservingDraft || !commentScope.value || access.isFetching.value || feed.isPending.value) return
  const saved = takeFeedDraft(commentScope.value)
  if (!saved || accessMode.value !== 'full' || feedRestricted.value) return
  accountId.value = saved.accountId
  for (const item of displayedItems.value) {
    if (!item.restricted && saved.drafts[item.id]) drafts[item.id] = saved.drafts[item.id]
  }
}, { immediate: true })
async function managePresets() {
  if (Object.values(drafts).some(draft => draft.pending)) return feedback.info('正在发表评论，请稍候')
  if (commentScope.value) saveFeedDraft(commentScope.value, accountId.value, drafts)
  preservingDraft = true
  try {
    const failure = await router.push('/personal/interactions/comment-presets')
    if (failure) clearFeedDraft()
  } finally { preservingDraft = false }
}
watch(commentScope, (next, previous) => {
  if (previous && next !== previous) {
    commentEpoch++
    accountId.value = null
    for (const id of Object.keys(drafts)) delete drafts[Number(id)]
  }
})
watch([accessMode, feedRestricted], ([mode, restricted]) => {
  if (mode !== 'full' || restricted) {
    for (const draft of Object.values(drafts)) draft.expanded = false
  }
})
function toggleComment(item: WeiboFeedItem) {
  if (actionReason(item)) return feedback.info(actionReason(item))
  const draft = drafts[item.id] ??= { text: '', baseline: '', expanded: false, pending: false, error: '' }
  draft.expanded = !draft.expanded
}
function submitReason(item: WeiboFeedItem) {
  return actionReason(item) || accountReason.value || (drafts[item.id]?.pending ? '正在发表评论，请稍候' : accounts.isError.value ? '微博账号加载失败，请稍后再试' : accounts.isPending.value ? '正在加载微博账号，请稍候' : !selectedAccount.value ? '请选择评论使用的微博账号' : !drafts[item.id]?.text.trim() ? '请输入评论内容' : '')
}
async function submitComment(item: WeiboFeedItem) {
  const reason = submitReason(item)
  if (reason) return feedback.info(reason)
  const draft = drafts[item.id]!
  const submitted = draft.text
  const epoch = commentEpoch
  const submittedScope = commentScope.value
  const payload = { account_id: accountId.value, comment: submitted.trim(), ...expectedEntity(access.data.value, true) }
  draft.pending = true
  draft.error = ''
  try {
    const result = await api.post<WeiboOperation>(`/personal/feed/${item.id}/comments`, payload)
    if (!active || epoch !== commentEpoch || submittedScope !== commentScope.value) return
    if (result.status === 'Succeeded') {
      draft.baseline = submitted
      if (draft.text === submitted) { draft.text = ''; draft.baseline = '' }
      feedback.success('评论已发表')
    } else if (result.status === 'Failed') {
      draft.error = result.remote_message || result.reason || '评论未完成，请检查账号和执行日志'
    } else {
      draft.error = result.status === 'Unknown' ? '评论结果尚未确认，请先查看微博或执行日志，避免重复发送' : '评论正在处理，请先查看执行日志，避免重复发送'
    }
  } catch (error) {
    if (active && epoch === commentEpoch) draft.error = `${friendlyError(error)}。请先核对微博或执行日志，避免重复发送`
  } finally {
    if (epoch === commentEpoch) draft.pending = false
  }
}
watch(() => feed.isPending.value, async pending => {
  if (pending || restoreTop === null) return
  await nextTick()
  requestAnimationFrame(() => {
    if (active && restoreTop !== null) { window.scrollTo({ top: restoreTop }); restoreTop = null; loadMore() }
  })
}, { immediate: true, flush: 'post' })
const sentinel = ref<HTMLElement | null>(null)
const nearEnd = ref(false)
let observer: IntersectionObserver | undefined
let active = true
async function loadMore(manual = false) {
  if (!active || !visible.value || restoreTop !== null || loadingMore.value || feed.isFetching.value || !feed.hasNextPage.value) return
  if (!manual) {
    if (nextPageError.value || !nearEnd.value || !sentinel.value) return
    // Recheck the updated layout after an append: the observer callback may still describe the old position.
    const bounds = sentinel.value.getBoundingClientRect()
    if (bounds.top > window.innerHeight + 240 || bounds.bottom < 0) return
  }
  const requestedMode = accessMode.value
  nextPageError.value = null
  loadingMore.value = true
  try {
    const result = await feed.fetchNextPage({ cancelRefetch: false })
    if (active && requestedMode === accessMode.value && result.isFetchNextPageError) nextPageError.value = result.error
  } finally {
    loadingMore.value = false
  }
}
watch(sentinel, (element, previousElement) => {
  if (previousElement) observer?.unobserve(previousElement)
  nearEnd.value = false
  if (element) observer?.observe(element)
}, { flush: 'post' })
watch([nearEnd, visible, feed.isFetching, loadingMore, feed.hasNextPage], () => {
  if (!feed.isFetching.value && !loadingMore.value && feed.isSuccess.value && !feed.hasNextPage.value) nextPageError.value = null
  void loadMore()
}, { flush: 'post' })
let fallback: ReturnType<typeof setTimeout> | undefined
function cancelFallback() { if (fallback) clearTimeout(fallback); fallback = undefined }
async function onVisibility() {
  visible.value = !document.hidden
  if (document.hidden) cancelFallback()
  else {
    await access.refetch()
    if (active && visible.value && !access.isError.value && !feed.isFetching.value) void feed.refetch({ cancelRefetch: false })
  }
}
onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  observer = new IntersectionObserver(entries => { nearEnd.value = entries[0]?.isIntersecting ?? false }, { rootMargin: '240px 0px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
function openPost(item: WeiboFeedItem) {
  if (actionReason(item)) return feedback.info(actionReason(item))
  if (!item.status_url) return
  cancelFallback()
  if (!item.app_url) { window.location.assign(item.status_url); return }
  window.addEventListener('pagehide', cancelFallback, { once: true })
  fallback = setTimeout(() => { if (!document.hidden) window.location.assign(item.status_url!); cancelFallback() }, 1500)
  window.location.assign(item.app_url)
}
onBeforeUnmount(() => { active = false; observer?.disconnect(); cancelFallback(); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('pagehide', cancelFallback) })
</script>

<template>
  <div class="weibo-stack">
    <LsPageHeader title="点单信息流" description="浏览最新点单，展开帖子即可发表评论。">
      <template #actions><LsButton variant="secondary" @click="managePresets">管理预设评论</LsButton></template>
    </LsPageHeader>
    <WeiboAccountField id="feed-comment-account" label="评论使用的微博账号" v-model="accountId" :accounts="accounts.data.value || []" :loading="accounts.isPending.value" :error="accounts.isError.value ? friendlyError(accounts.error.value) : ''" :disabled-reason="accountReason" />
    <LsAsyncState v-if="access.isError.value" state="error" title="访问权限加载失败" :description="friendlyError(access.error.value)" />
    <LsAsyncState v-else-if="feed.isPending.value" state="loading" :rows="8" />
    <template v-else>
      <LsAsyncState v-if="feed.isError.value && !displayedItems.length" state="error" title="点单信息流加载失败" :description="friendlyError(feed.error.value)" />
      <template v-else-if="!displayedItems.length">
        <LsAsyncState v-if="feedSummary?.poll_status === 'failed'" state="error" title="点单来源更新暂时失败" description="暂时无法获取点单内容，恢复后会自动更新。" />
        <LsEmptyState v-else-if="feedSummary?.poll_status === 'unconfigured'" title="点单来源尚未配置" description="请联系管理员配置来源，准备好后会自动显示点单。" />
        <LsEmptyState v-else title="暂无点单微博" description="新点单会自动出现在这里。" />
      </template>
      <template v-if="displayedItems.length">
        <p v-if="!feed.isError.value && feedSummary?.poll_status === 'unconfigured'" class="feed-status" role="status">点单来源尚未配置，已有内容仍可查看。</p>
        <section class="feed-results" aria-label="点单微博">
          <NFlex class="feed-summary" justify="space-between" align="center" :size="8">
            <span role="status">共 <strong>{{ feedSummary?.total ?? displayedItems.length }}</strong> 条点单</span>
            <span v-if="feedSummary?.updated_at">最近更新 <time :datetime="new Date(feedSummary.updated_at * 1000).toISOString()" :title="new Date(feedSummary.updated_at * 1000).toLocaleString()">{{ formatTime(feedSummary.updated_at) }}</time></span>
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
                  <LsButton variant="ghost" :disabled="Boolean(actionReason(item))" :disabled-reason="actionReason(item)" @click="openPost(item)"><template #icon><ExternalLink :size="18" aria-hidden="true" /></template>前往</LsButton>
                  <LsButton variant="ghost" :disabled="Boolean(actionReason(item))" :disabled-reason="actionReason(item)" :aria-expanded="Boolean(drafts[item.id]?.expanded)" :aria-controls="`feed-comment-${item.id}`" @click="toggleComment(item)"><template #icon><MessageCircle :size="18" aria-hidden="true" /></template>{{ drafts[item.id]?.expanded ? '收起评论' : '评论' }}</LsButton>
                </NFlex>
                <Transition name="feed-rail">
                  <form v-if="drafts[item.id]?.expanded && !actionReason(item)" :id="`feed-comment-${item.id}`" class="feed-comment" aria-label="发表评论" @submit.prevent="submitComment(item)">
                    <WeiboFeedCommentComposer :id-prefix="`feed-${item.id}`" v-model="drafts[item.id]!.text" :presets="presets.data.value || []" :loading="presets.isPending.value" :error="presets.isError.value ? friendlyError(presets.error.value) : ''" :disabled-reason="presetReason" :sending="drafts[item.id]!.pending" :submit-reason="submitReason(item)" @submit="submitComment(item)" />
                    <LsInlineError v-if="drafts[item.id]!.error" :message="drafts[item.id]!.error" />
                  </form>
                </Transition>
              </article>
            </NListItem>
          </NList>
          <div ref="sentinel" class="feed-tail" :aria-busy="feed.isFetchingNextPage.value">
            <template v-if="nextPageError">
              <LsInlineError :message="`更多点单加载失败：${friendlyError(nextPageError)}。已加载的内容仍可查看。`" />
              <LsButton variant="secondary" :disabled="feed.isFetching.value" disabled-reason="正在加载，请稍候" @click="loadMore(true)">继续加载</LsButton>
            </template>
            <NFlex v-else-if="feed.isFetchingNextPage.value" align="center" justify="center" :size="8" role="status"><NSpin size="small" />正在加载更多点单…</NFlex>
            <p v-else-if="!feed.hasNextPage.value" role="status">已看完当前点单</p>
            <p v-else role="status">继续下滑，加载更多点单</p>
          </div>
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
.feed-comment { display: grid; grid-column: 1 / -1; gap: .375rem; min-width: 0; padding-block-start: .25rem; }
.feed-rail-enter-active, .feed-rail-leave-active { transition: opacity var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out); }
.feed-rail-enter-from, .feed-rail-leave-to { opacity: 0; transform: translateY(-.25rem); }
.feed-tail { display: grid; justify-items: center; gap: .5rem; padding-block: .75rem; color: var(--text-secondary); font-size: .875rem; }
.feed-tail p { margin: 0; }
@media (prefers-reduced-motion: reduce) {
  .feed-rail-enter-active, .feed-rail-leave-active { transition: none; }
}
@media (min-width: 768px) {
  .feed-post { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
}
</style>
