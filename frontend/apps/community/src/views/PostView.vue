<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { formatDate } from '@lostsky/shared/format'
import { api, friendlyError } from '@lostsky/api/client'
import { communityPath, communityInteractionReason, uploadCommunityImage, type Community, type CommunityPost, type CommunityComment, type CommunityPage } from '@lostsky/api/community'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { NList, NListItem, NThing, NSpace, NPagination, useDialog } from 'naive-ui'
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
const post = useQuery({ queryKey: ['community-post', slug, postId, actorKey], queryFn: () => api.get<CommunityPost>(`${path}/posts/${postId}`) })
const page = ref(1)
const comments = useQuery({ queryKey: ['community-comments', slug, postId, page, actorKey], queryFn: () => api.get<CommunityPage<CommunityComment>>(`${path}/posts/${postId}/comments`, { page: page.value, limit: 20 }), enabled: computed(() => Boolean(post.data.value)) })
const content = ref(''), editing = ref<number | null>(null), busy = ref(false)
const draft = useQueryDraft({ key: () => `${route.path}:${editing.value}`, read: () => content.value, apply: value => { content.value = value } })
const { canLeave } = useUnsavedChangesGuard(draft.dirty)
const interactionReason = computed(() => communityInteractionReason(community.data.value) || (post.data.value?.status !== 'Visible' ? '当前帖子不可继续评论' : ''))
const commentReason = computed(() => busy.value ? '正在提交' : interactionReason.value || (!content.value.trim() ? '请填写评论内容' : '') || (editing.value && !draft.dirty.value ? '没有待保存的修改' : ''))
function editComment(comment?: CommunityComment) { if (!canLeave()) return; editing.value = comment?.id ?? null; draft.reset(comment?.content ?? '') }
async function refresh() { await Promise.all([post.refetch(), comments.refetch(), cache.invalidateQueries({ queryKey: ['community-posts', slug] })]) }
async function saveComment() {
  if (commentReason.value) return feedback.info(commentReason.value)
  busy.value = true; const submission = draft.capture()
  try { await api.post(editing.value ? `${path}/comments/${editing.value}` : `${path}/posts/${postId}/comments`, { content: submission.value, expected_entity_id: community.data.value?.entity_id }); if (!draft.accept(submission) || draft.dirty.value) return; editing.value = null; draft.reset(''); await refresh(); feedback.success('评论已保存') } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
async function like() {
  if (busy.value || !post.data.value) return
  busy.value = true
  try { await api.post(`${path}/posts/${postId}/like`, { liked: !post.data.value.is_liked, expected_entity_id: community.data.value?.entity_id }); await post.refetch() } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
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
    <LsPageHeader :title="post.data.value.status === 'Deleted' ? '作者已删除的帖子' : post.data.value.title" :back-to="base"><template #actions><RouterLink v-if="post.data.value.can_edit" :to="`${base}/posts/${postId}/edit`">编辑帖子</RouterLink><LsButton v-if="post.data.value.can_edit" variant="danger" @click="remove()">删除帖子</LsButton></template></LsPageHeader>
    <NSpace><span>{{ post.data.value.author.name }}</span><time>{{ formatDate(post.data.value.create_time * 1000) }}</time><span v-if="post.data.value.pinned">置顶帖子</span></NSpace>
    <CommunityContentState :status="post.data.value.status" :reason="post.data.value.hidden_reason" />
    <LsMarkdownRenderer v-if="post.data.value.status !== 'Deleted'" :content="post.data.value.content" />
    <NSpace><LsButton variant="secondary" :disabled="Boolean(communityInteractionReason(community.data.value, 'like')) || busy || post.data.value.status !== 'Visible'" :disabled-reason="busy ? '正在提交' : communityInteractionReason(community.data.value, 'like') || '当前帖子不可点赞'" @click="like">{{ post.data.value.is_liked ? '取消点赞' : '点赞' }} · {{ post.data.value.like_count }}</LsButton><span>{{ post.data.value.comment_count }} 条评论</span></NSpace>
    <h2>评论</h2>
    <LsAsyncState v-if="comments.isPending.value" state="loading" /><template v-else-if="comments.isError.value"><LsAsyncState state="error" :description="friendlyError(comments.error.value)" /></template><LsEmptyState v-else-if="!comments.data.value?.list.length" title="还没有评论" description="分享你的看法，开始交流。" />
    <NList v-else bordered><NListItem v-for="comment in comments.data.value.list" :key="comment.id"><NThing :title="comment.author.name" :description="formatDate(comment.create_time * 1000)"><CommunityContentState :status="comment.status" :reason="comment.hidden_reason" /><LsMarkdownRenderer v-if="comment.status !== 'Deleted'" :content="comment.content" /><template #action><NSpace v-if="comment.can_edit"><LsButton variant="ghost" @click="editComment(comment)">编辑评论</LsButton><LsButton variant="ghost" @click="remove(comment)">删除评论</LsButton></NSpace></template></NThing></NListItem></NList>
    <NPagination v-if="(comments.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="comments.data.value?.total" simple />
    <LsAsyncState v-if="community.isError.value" state="error" :description="friendlyError(community.error.value)" />
    <form v-else @submit.prevent="saveComment"><LsField :label="editing ? '编辑评论' : '发表评论'" for-id="comment-content"><LsMarkdownEditor id="comment-content" v-model="content" placeholder="写下你的评论…" :upload-image="file => uploadCommunityImage(file, community.data.value?.entity_id ?? null)" :upload-disabled-reason="interactionReason" /></LsField><LsFormActions><LsButton type="submit" :disabled="Boolean(commentReason)" :disabled-reason="commentReason">{{ editing ? '保存评论' : '发表评论' }}</LsButton><LsButton v-if="editing" variant="secondary" @click="editComment()">取消编辑</LsButton></LsFormActions></form>
  </template>
</template>
