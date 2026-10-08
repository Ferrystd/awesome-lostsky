<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { api, friendlyError } from '@lostsky/api/client'
import { communityPath, communityInteractionReason, uploadCommunityImage, type Community, type CommunityBoard, type CommunityPost, type CommunityPage } from '@lostsky/api/community'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { NInput, NSelect } from 'naive-ui'
import CommunityParticipation from '../components/CommunityParticipation.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { feedback } from '@lostsky/ui/feedback'
const actorKey = communityActorKey()
const route = useRoute(), router = useRouter(), cache = useQueryClient()
const slug = String(route.params.slug), path = communityPath(slug), postId = Number(route.params.postId), base = `/c/${slug}`
const community = useQuery({ queryKey: ['community', slug, actorKey], queryFn: () => api.get<Community>(path) })
const boards = useQuery({ queryKey: ['community-boards', slug, actorKey], queryFn: () => api.get<CommunityPage<CommunityBoard>>(`${path}/boards`, { limit: 100 }) })
const post = useQuery({ queryKey: ['community-post', slug, postId, actorKey], queryFn: () => api.get<CommunityPost>(`${path}/posts/${postId}`), enabled: Boolean(postId) })
const form = reactive({ title: '', content: '', board_id: null as number | null }), busy = ref(false)
const draft = useQueryDraft({ key: () => route.path, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty)
watch(post.data, value => { if (value) draft.hydrate({ title: value.title, content: value.content, board_id: value.board_id }) }, { immediate: true })
watch(boards.data, value => { const available = value?.list.filter(board => board.enabled) ?? []; if (!postId && form.board_id == null && available.length === 1 && !draft.dirty.value) draft.reset({ ...form, board_id: available[0].id }) }, { immediate: true })
const reason = computed(() => busy.value ? '正在保存帖子' : communityInteractionReason(community.data.value) || (postId && !post.data.value?.can_edit ? '只有作者可以编辑自己的帖子' : '') || (!form.title.trim() ? '请填写帖子标题' : !form.content.trim() ? '请填写帖子正文' : !form.board_id ? ((boards.data.value?.list ?? []).some(board => board.enabled) ? '请选择板块' : '当前没有启用的板块，暂时不能发布帖子') : !postId && !boards.data.value?.list.find(board => board.id === form.board_id)?.enabled ? '所选板块已停用，请选择其他板块' : '') || (postId && !draft.dirty.value ? '没有待保存的修改' : ''))
async function save() {
  if (reason.value) return feedback.info(reason.value)
  const submission = draft.capture(); busy.value = true
  try { const saved = await api.post<CommunityPost>(`${path}/posts${postId ? `/${postId}` : ''}`, { ...submission.value, expected_entity_id: community.data.value?.entity_id }); if (!draft.accept(submission) || draft.dirty.value) return; await cache.invalidateQueries({ queryKey: ['community-posts', slug] }); await cache.invalidateQueries({ queryKey: ['community-post', slug] }); feedback.success('帖子已保存'); await router.push(`${base}/posts/${postId || saved.id}`) } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
</script>
<template>
  <LsPageHeader :title="postId ? '编辑帖子' : '发布帖子'" :back-to="postId ? `${base}/posts/${postId}` : base" :description="community.data.value ? `在「${community.data.value.name}」${postId ? '修改你的讨论' : '发起新的讨论'}` : undefined" />
  <CommunityParticipation v-if="community.data.value" :community="community.data.value" />
  <LsAsyncState v-if="draft.dirty.value && (community.isError.value || boards.isError.value || post.isError.value)" state="error" title="暂时无法更新资料" description="已输入内容保留，网络恢复后将自动重新读取。" />
  <LsAsyncState v-if="community.isPending.value || boards.isPending.value || (postId && post.isPending.value)" state="loading" />
  <template v-else-if="(community.isError.value && !community.data.value) || (boards.isError.value && !boards.data.value) || (postId && post.isError.value && !post.data.value)"><LsAsyncState state="error" :description="friendlyError(community.error.value || boards.error.value || post.error.value)" /></template>
  <form v-else @submit.prevent="save"><LsFormSection title="帖子内容"><LsField label="板块" for-id="post-board" required><NSelect id="post-board" v-model:value="form.board_id" :disabled="Boolean(postId)" :options="(boards.data.value?.list ?? []).filter(board => board.enabled || board.id === form.board_id).map(board => ({ label: board.name, value: board.id }))" placeholder="选择板块" /></LsField><LsField label="标题" for-id="post-title" required><NInput :input-props="{ id: 'post-title' }" v-model:value="form.title" maxlength="200" placeholder="用一句话说清你想讨论什么" show-count /></LsField><LsField label="正文" for-id="post-content" required><LsMarkdownEditor id="post-content" v-model="form.content" placeholder="写下你的想法…" :upload-image="file => uploadCommunityImage(file, community.data.value?.entity_id ?? null)" :upload-disabled-reason="community.data.value?.entity_id ? '' : '请先选择有效人员身份'" /></LsField></LsFormSection><LsFormActions><LsButton type="submit" :disabled="Boolean(reason)" :disabled-reason="reason">{{ postId ? '保存修改' : '发布帖子' }}</LsButton><LsButton variant="secondary" @click="router.push(postId ? `${base}/posts/${postId}` : base)">取消</LsButton></LsFormActions></form>
</template>
