<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { formatDate } from '@lostsky/shared/format'
import { api, friendlyError } from '@lostsky/api/client'
import { communityPath, communityInteractionReason, uploadCommunityImage, type Community, type CommunityPost, type CommunityComment, type CommunityPage } from '@lostsky/api/community'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useCommunityDraftIdentity } from '@lostsky/shared/useCommunityDraftIdentity'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { NList, NListItem, NThing, NSpace, NPagination, NTag, NButton, useDialog } from 'naive-ui'
import CommunityParticipation from '../components/CommunityParticipation.vue'
import CommunityPostMeta from '@lostsky/ui/community/CommunityPostMeta.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { Heart, MessageCircle, Pencil, Trash2 } from '@lucide/vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import CommunityContentState from '@lostsky/ui/community/CommunityContentState.vue'
import { feedback } from '@lostsky/ui/feedback'
const actorKey = communityActorKey()
const route = useRoute(), cache = useQueryClient(), dialog = useDialog()
const slug = String(route.params.slug), path = communityPath(slug), postId = Number(route.params.postId), base = `/c/${slug}`
const community = useQuery({ queryKey: ['community', slug, actorKey], queryFn: () => api.get<Community>(path) })
const draftEntityId = useCommunityDraftIdentity(() => community.data.value?.entity_id)
const post = useQuery({ queryKey: ['community-post', slug, postId, actorKey], queryFn: () => api.get<CommunityPost>(`${path}/posts/${postId}`) })
const page = ref(1)
const comments = useQuery({ queryKey: ['community-comments', slug, postId, page, actorKey], queryFn: () => api.get<CommunityPage<CommunityComment>>(`${path}/posts/${postId}/comments`, { page: page.value, limit: 20 }), enabled: computed(() => Boolean(post.data.value)) })
const composerOpen = ref(false), composer = ref<HTMLElement | null>(null)
async function openComposer() { if (!composerOpen.value) draftEntityId.value = community.data.value?.entity_id; composerOpen.value = true; await nextTick(); composer.value?.scrollIntoView({ block: 'center', behavior: 'instant' }); composer.value?.focus() }
const content = ref(''), editing = ref<number | null>(null), busy = ref(false)
const draft = useQueryDraft({ key: () => `${route.path}:${editing.value}`, read: () => content.value, apply: value => { content.value = value } })
const { canLeave } = useUnsavedChangesGuard(draft.dirty)
const interactionReason = computed(() => communityInteractionReason(community.data.value) || (post.data.value?.status !== 'Visible' ? '当前帖子不可继续评论' : ''))
const commentReason = computed(() => busy.value ? '正在提交' : interactionReason.value || (!content.value.trim() ? '请填写评论内容' : '') || (editing.value && !draft.dirty.value ? '没有待保存的修改' : ''))
function editComment(comment?: CommunityComment) { if (!canLeave()) return; draftEntityId.value = community.data.value?.entity_id; editing.value = comment?.id ?? null; draft.reset(comment?.content ?? ''); if (comment) void openComposer() }
function cancelComposer() { if (!canLeave()) return; editing.value = null; draft.reset(''); composerOpen.value = false }
async function refresh() { await Promise.all([post.refetch(), comments.refetch(), cache.invalidateQueries({ queryKey: ['community-posts', slug] })]) }
async function saveComment() {
  if (commentReason.value) return feedback.info(commentReason.value)
  busy.value = true; const submission = draft.capture()
  try { await api.post(editing.value ? `${path}/comments/${editing.value}` : `${path}/posts/${postId}/comments`, { content: submission.value, expected_entity_id: draftEntityId.value }); if (!draft.accept(submission) || draft.dirty.value) return; editing.value = null; draft.reset(''); composerOpen.value = false; await refresh(); feedback.success('评论已保存') } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
async function like() {
  if (busy.value || !post.data.value) return
  busy.value = true
  try { await api.post(`${path}/posts/${postId}/like`, { liked: !post.data.value.is_liked, expected_entity_id: community.data.value?.entity_id }); await Promise.all([post.refetch(), cache.invalidateQueries({ queryKey: ['community-posts', slug] })]) } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
function remove(comment?: CommunityComment) {
  dialog.warning({ title: comment ? '删除评论' : '删除帖子', content: '删除后保留作者和讨论记录，正文不再显示。', positiveText: '确认删除', negativeText: '取消', onPositiveClick: async () => {
    try { await api.post(comment ? `${path}/comments/${comment.id}/delete` : `${path}/posts/${postId}/delete`, { expected_entity_id: community.data.value?.entity_id }); await refresh(); feedback.success('已删除') } catch (error) { feedback.error(friendlyError(error)); return false }
  } })
}
</script>
<template>
  <LsAsyncState v-if="post.isPending.value" state="loading" /><template v-else-if="post.isError.value && !post.data.value"><LsPageHeader title="帖子详情" :back-to="base" /><LsAsyncState state="error" :description="friendlyError(post.error.value)" /></template>
  <template v-else-if="post.data.value">
    <LsAsyncState v-if="post.isError.value" state="error" title="暂时无法更新帖子" description="你的评论草稿仍然保留，网络恢复后将自动重新读取。" />
    <div class="community-reading">
      <LsPageHeader :title="post.data.value.status === 'Deleted' ? '作者已删除的帖子' : post.data.value.title" :back-to="base" />
      <LsPanel><template #header><CommunityPostMeta :author="post.data.value.author" :time="post.data.value.create_time" /></template>
        <div class="community-reading__body"><NTag v-if="post.data.value.pinned" type="info" size="small">置顶帖子</NTag><CommunityContentState :status="post.data.value.status" :reason="post.data.value.hidden_reason" /><LsMarkdownRenderer v-if="post.data.value.status !== 'Deleted'" :content="post.data.value.content" /></div>
        <template #footer><NSpace align="center" justify="space-between"><NSpace align="center"><LsButton variant="secondary" :disabled="Boolean(communityInteractionReason(community.data.value, 'like')) || busy || post.data.value.status !== 'Visible'" :disabled-reason="busy ? '正在提交' : communityInteractionReason(community.data.value, 'like') || '当前帖子不可点赞'" :aria-pressed="post.data.value.is_liked" @click="like"><template #icon><Heart :size="18" /></template>{{ post.data.value.is_liked ? '取消点赞' : '点赞' }} · {{ post.data.value.like_count }}</LsButton><span>{{ post.data.value.comment_count }} 条评论</span></NSpace><NSpace v-if="post.data.value.can_edit"><RouterLink class="community-post-edit" :to="`${base}/posts/${postId}/edit`"><Pencil :size="17" aria-hidden="true" />编辑帖子</RouterLink><LsButton variant="ghost" @click="remove()"><template #icon><Trash2 :size="17" /></template>删除帖子</LsButton></NSpace></NSpace></template>
      </LsPanel>
      <CommunityParticipation v-if="community.data.value" :community="community.data.value" />
      <section aria-labelledby="comments-title" class="community-comments">
        <div class="community-comments__heading"><h2 id="comments-title">评论 <span>{{ post.data.value.comment_count }}</span></h2><LsButton :disabled="Boolean(interactionReason)" :disabled-reason="interactionReason" @click="openComposer"><template #icon><MessageCircle :size="18" /></template>写评论</LsButton></div>
        <LsAsyncState v-if="comments.isPending.value" state="loading" /><LsAsyncState v-else-if="comments.isError.value" state="error" :description="friendlyError(comments.error.value)" /><LsEmptyState v-else-if="!comments.data.value?.list.length" title="还没有评论" description="分享你的看法，开始交流。" />
        <NList v-else bordered><NListItem v-for="comment in comments.data.value.list" :key="comment.id"><div class="community-comment"><CommunityPostMeta :author="comment.author" :time="comment.create_time" /><CommunityContentState :status="comment.status" :reason="comment.hidden_reason" /><LsMarkdownRenderer v-if="comment.status !== 'Deleted'" :content="comment.content" /><NSpace v-if="comment.can_edit"><LsButton variant="ghost" @click="editComment(comment)">编辑评论</LsButton><LsButton variant="ghost" @click="remove(comment)">删除评论</LsButton></NSpace></div></NListItem></NList>
        <NPagination v-if="(comments.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="comments.data.value?.total" simple />
      </section>
      <LsAsyncState v-if="community.isError.value" state="error" :description="friendlyError(community.error.value)" />
      <section v-if="composerOpen" ref="composer" tabindex="-1" aria-label="评论编辑区"><LsPanel><form @submit.prevent="saveComment"><LsField :label="editing ? '编辑评论' : '发表评论'" for-id="comment-content"><LsMarkdownEditor id="comment-content" v-model="content" placeholder="写下你的评论…" :upload-image="file => uploadCommunityImage(file, draftEntityId ?? null)" :upload-disabled-reason="interactionReason" /></LsField><LsFormActions><LsButton type="submit" :disabled="Boolean(commentReason)" :disabled-reason="commentReason">{{ editing ? '保存评论' : '发表评论' }}</LsButton><LsButton variant="secondary" @click="cancelComposer">取消{{ editing ? '编辑' : '' }}</LsButton></LsFormActions></form></LsPanel></section>
    </div>
  </template>
</template>

<style scoped>.community-reading{width:100%;max-width:75ch;margin-inline:auto;display:grid;gap:1.5rem;min-width:0}.community-reading__body{display:grid;gap:1rem;overflow-wrap:anywhere;line-height:1.8}.community-comments{display:grid;gap:1rem;min-width:0}.community-comments__heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.community-comments__heading h2{margin:0;font-size:1.125rem}.community-comments__heading h2 span{color:var(--text-secondary);font-size:.875rem;font-weight:400}.community-comment{display:grid;gap:.875rem;min-width:0;overflow-wrap:anywhere}.community-post-edit{display:inline-flex;align-items:center;gap:.45rem;min-height:44px;color:var(--primary)}</style>
