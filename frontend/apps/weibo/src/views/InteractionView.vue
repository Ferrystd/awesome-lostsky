<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft, SlidersHorizontal } from '@lucide/vue'

import { api, friendlyError } from '@lostsky/api/client'
import { readAccessReason } from '@lostsky/api/access-result'
import { formatAbilityDenied, formatPermissionDenied } from '@lostsky/api/error-format'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useQuery } from '@tanstack/vue-query'
import { NInput, NRadioButton, NRadioGroup } from 'naive-ui'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WeiboAccountField from '../components/WeiboAccountField.vue'
import WeiboCommentFields from '../components/WeiboCommentFields.vue'
import { apiPrefix, expectedEntity, hasWeiboPermission, loadAccess } from '../lib/workspace'
import { clearInteractionDrafts, interactionScopeKey, parseInteractionQuery, storeInteractionDraft, takeInteractionDraft, validStatusUrl } from '../lib/interactionDraft'
import type { WeiboAccount, WeiboCommentPreset, WeiboFeedItem, WeiboOperation } from '../types'

const route = useRoute()
const router = useRouter()
const personal = computed(() => route.meta.workspace === 'personal')
const prefix = computed(() => apiPrefix(personal.value))
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess(true), refetchInterval: 30_000 })
const scope = computed(() => interactionScopeKey(access.data.value, personal.value))
const task = ref(parseInteractionQuery(route.query, personal.value))
const draft = reactive({ action: task.value.action, statusUrl: task.value.statusUrl, comment: '', accountId: null as number | null })
const snapshot = () => JSON.stringify(draft)
const baseline = ref(snapshot())
const pending = ref(false)
const dirty = computed(() => pending.value || snapshot() !== baseline.value)
let epoch = 0
let preservedToken = ''
const permissionReason = computed(() => {
  if (access.isPending.value) return '正在核对访问权限，请稍候'
  if (access.isError.value) return friendlyError(access.error.value)
  const permission = personal.value ? 'weibo.personal.use' : 'weibo.team.manage'
  return hasWeiboPermission(access.data.value, permission) ? '' : formatPermissionDenied([permission])
})
const abilityReason = computed(() => {
  const ability = access.data.value?.abilities.weibo
  return ability?.enabled ? '' : formatAbilityDenied('weibo', ability?.label || '微博')
})
const accounts = useQuery({
  structuralSharing: false,
  queryKey: computed(() => ['weibo-interaction-accounts', scope.value]),
  queryFn: () => api.get<WeiboAccount[]>(`${prefix.value}/accounts`),
  enabled: computed(() => !permissionReason.value),
})
const presets = useQuery({
  structuralSharing: false,
  queryKey: computed(() => ['weibo-comment-presets', prefix.value, scope.value]),
  queryFn: () => api.get<WeiboCommentPreset[]>(`${prefix.value}/comment-presets`),
  enabled: computed(() => !permissionReason.value),
})
const feedPost = useQuery({
  structuralSharing: false,
  queryKey: computed(() => ['weibo-interaction-post', scope.value, task.value.feedPostId]),
  queryFn: () => api.get<WeiboFeedItem>(`/personal/feed/${task.value.feedPostId}`),
  enabled: computed(() => !permissionReason.value && !abilityReason.value && !task.value.error && task.value.feedPostId !== null),
  retry: false,
})
const accountReason = computed(() => permissionReason.value || readAccessReason(accounts.data.value))
const presetReason = computed(() => permissionReason.value || readAccessReason(presets.data.value))
const targetReason = computed(() => task.value.error || (task.value.feedPostId !== null
  ? permissionReason.value || abilityReason.value || readAccessReason(feedPost.data.value) || (feedPost.isError.value ? `点单微博无法读取：${friendlyError(feedPost.error.value)}` : feedPost.isPending.value ? '正在读取点单微博，请稍候' : feedPost.data.value?.restricted ? '当前只能查看点单预览，暂不可评论' : !feedPost.data.value || feedPost.data.value.id !== task.value.feedPostId ? '点单微博已失效，请重新选择' : '') : ''))
const visiblePost = computed(() => targetReason.value ? undefined : feedPost.data.value)
const selectedAccount = computed(() => accountReason.value ? undefined : accounts.data.value?.find(item => item.id === draft.accountId))
const operationLabel = computed(() => draft.action === 'like' ? '点赞微博' : '发表评论')
const submitReason = computed(() => permissionReason.value || abilityReason.value || targetReason.value || accountReason.value
  || (pending.value ? '正在执行互动，请稍候' : accounts.isError.value ? '账号加载失败，请稍后再试' : accounts.isPending.value ? '正在加载账号，请稍候' : !selectedAccount.value ? '请选择微博账号' : !task.value.feedPostId && !validStatusUrl(draft.statusUrl.trim()) ? '请输入有效的微博帖子链接' : draft.action === 'comment' && !draft.comment.trim() ? '请输入评论内容' : ''))

useUnsavedChangesGuard(dirty, {
  shouldConfirm: (to, from) => {
    if (preservedToken && to.path === `${prefix.value}/interactions/comment-presets` && to.query.draft === preservedToken && to.query.from === 'interaction') return false
    return to.path !== from.path || JSON.stringify(parseInteractionQuery(to.query, personal.value)) !== JSON.stringify(parseInteractionQuery(from.query, personal.value)) || to.query.draft !== from.query.draft
  },
})

function initialize() {
  epoch++
  pending.value = false
  task.value = parseInteractionQuery(route.query, personal.value)
  Object.assign(draft, { action: task.value.action, statusUrl: task.value.statusUrl, comment: '', accountId: null })
  baseline.value = snapshot()
  restore()
}
function restore() {
  if (!scope.value || access.isPending.value) return
  const saved = takeInteractionDraft(route.query.draft, scope.value, task.value)
  if (!saved) return
  task.value = saved.task
  Object.assign(draft, saved.draft)
  baseline.value = saved.baseline
  if (permissionReason.value) { draft.accountId = null; draft.comment = '' }
}
watch(() => JSON.stringify([route.path, parseInteractionQuery(route.query, personal.value), route.query.draft]), initialize)
watch(scope, (next, previous) => {
  if (previous && previous !== next) { clearInteractionDrafts(); initialize() }
  else restore()
}, { immediate: true })
watch(permissionReason, (reason, previous) => {
  if (reason && !previous) {
    epoch++
    pending.value = false
    draft.accountId = null
    draft.comment = ''
    clearInteractionDrafts()
  }
})
async function managePresets() {
  if (pending.value) return feedback.info('正在执行互动，请稍候')
  if (!scope.value) return feedback.info(permissionReason.value || '正在核对当前身份，请稍候')
  preservedToken = storeInteractionDraft(scope.value, route.query, task.value, draft, baseline.value)
  const failure = await router.push({ path: `${prefix.value}/interactions/comment-presets`, query: { from: 'interaction', draft: preservedToken } })
  if (failure) { takeInteractionDraft(preservedToken, scope.value); preservedToken = '' }
}
async function submit() {
  if (submitReason.value) return feedback.info(submitReason.value)
  const submitted = snapshot()
  const currentEpoch = epoch
  const currentScope = scope.value
  const action = draft.action
  const feedId = task.value.feedPostId
  const path = feedId ? `/personal/feed/${feedId}/comments` : `${prefix.value}/${action === 'like' ? 'likes' : 'comments'}`
  const payload = { account_id: draft.accountId, comment: draft.comment.trim(), ...(feedId ? {} : { status_url: draft.statusUrl.trim() }), ...expectedEntity(access.data.value, personal.value) }
  pending.value = true
  try {
    const result = await api.post<WeiboOperation>(path, payload)
    if (epoch !== currentEpoch || scope.value !== currentScope) return
    if (result.status === 'Succeeded') {
      baseline.value = submitted
      feedback.success(action === 'like' ? '已点赞微博' : '评论已发表')
    } else if (result.status === 'Failed') feedback.error(result.remote_message || result.reason || '互动未完成，请检查账号和执行日志')
    else feedback.warning(result.status === 'Unknown' ? '互动结果尚未确认，请先查看微博或执行日志，避免重复发送' : '互动正在处理，请先查看执行日志，避免重复发送')
  } catch (error) { if (epoch === currentEpoch && scope.value === currentScope) feedback.error(friendlyError(error)) }
  finally { if (epoch === currentEpoch) pending.value = false }
}
onBeforeUnmount(() => { epoch++ })
</script>

<template>
  <LsFormPage title="互动" description="选择微博和账号，点赞或填写评论后手动发送。">
    <template #actions>
      <LsPageLink v-if="task.fromFeed" to="/personal/feed" :icon="ArrowLeft" label="返回点单信息流" />
      <template v-if="!personal"><LsButton variant="ghost" @click="managePresets"><template #icon><SlidersHorizontal :size="16" /></template>管理预设评论</LsButton></template>
    </template>

    <form class="weibo-form" @submit.prevent="submit">
      <LsFormSection title="微博互动" description="确认目标、账号和内容后执行一次互动。">
        <LsInlineError v-if="task.error" :message="task.error" />
        <LsField label="操作" for-id="weibo-interaction" required>
          <NRadioGroup id="weibo-interaction" v-model:value="draft.action" :disabled="task.feedPostId !== null">
            <NRadioButton value="like">点赞</NRadioButton><NRadioButton value="comment">评论</NRadioButton>
          </NRadioGroup>
        </LsField>
        <template v-if="task.feedPostId !== null">
          <LsInlineError v-if="feedPost.isError.value" :message="targetReason" />
          <LsField label="点单微博" for-id="interaction-post"><output id="interaction-post" class="interaction-post">{{ visiblePost?.text || '-' }}</output></LsField>
        </template>
        <LsField v-else label="微博帖子链接" for-id="weibo-status-url" required hint="请粘贴 weibo.com 或 m.weibo.cn 的微博正文页链接。">
          <NInput v-model:value="draft.statusUrl" :maxlength="2048" placeholder="https://weibo.com/..." :input-props="{ id: 'weibo-status-url', 'aria-label': '微博帖子链接' }" />
        </LsField>
        <WeiboAccountField id="weibo-account" v-model="draft.accountId" :accounts="accounts.data.value || []" :loading="accounts.isPending.value" :error="accounts.isError.value ? friendlyError(accounts.error.value) : ''" :disabled-reason="accountReason" />
        <WeiboCommentFields v-if="draft.action === 'comment'" id-prefix="weibo" v-model="draft.comment" :presets="presets.data.value || []" :loading="presets.isPending.value" :error="presets.isError.value ? friendlyError(presets.error.value) : ''" :disabled-reason="presetReason" />
        <LsDescriptionList>
          <dt>账号</dt><dd>{{ selectedAccount?.screen_name || selectedAccount?.uid || (accountReason ? '-' : '未选择') }}</dd>
          <dt>目标</dt><dd>{{ task.feedPostId ? (visiblePost?.status_url || '-') : draft.statusUrl || '未填写' }}</dd>
          <dt>内容</dt><dd>{{ draft.action === 'comment' ? draft.comment || '评论未填写' : '为目标微博点赞' }}</dd>
        </LsDescriptionList>
        <LsFormActions><LsButton type="submit" :loading="pending" :disabled="Boolean(submitReason)" :disabled-reason="submitReason">{{ operationLabel }}</LsButton></LsFormActions>
      </LsFormSection>
    </form>
  </LsFormPage>
</template>

<style scoped>
.interaction-post { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
