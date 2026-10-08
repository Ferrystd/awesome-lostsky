<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { useCommunityListState } from '@lostsky/shared/useCommunityListState'
import { api, friendlyError } from '@lostsky/api/client'
import { communityInteractionReason, communityPath, type Community, type CommunityBoard, type CommunityAnnouncement, type CommunityPost, type CommunityPage } from '@lostsky/api/community'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NPagination, NTag, NSpace, NCollapse, NCollapseItem, NTabs, NTab, NButton } from 'naive-ui'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import CommunityTabs from '@lostsky/ui/community/CommunityTabs.vue'
import CommunityParticipation from '../components/CommunityParticipation.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { SquarePen, Settings, LogOut } from '@lucide/vue'
import CommunityPostList from '@lostsky/ui/community/CommunityPostList.vue'
import { feedback } from '@lostsky/ui/feedback'
const actorKey = communityActorKey()
const route = useRoute(), router = useRouter(), cache = useQueryClient()
const slug = String(route.params.slug), path = communityPath(slug), base = `/c/${slug}`
const query = useQuery({ queryKey: ['community', slug, actorKey], queryFn: () => api.get<Community>(path) })
const boards = useQuery({ queryKey: ['community-boards', slug, actorKey], queryFn: () => api.get<CommunityPage<CommunityBoard>>(`${path}/boards`, { limit: 100 }) })
const announcements = useQuery({ queryKey: ['community-announcements', slug, actorKey], queryFn: () => api.get<CommunityPage<CommunityAnnouncement>>(`${path}/announcements`, { limit: 100 }) })
const { board, keyword, page, restoreScroll } = useCommunityListState(`community:${slug}:posts`)
const busy = ref(false)
watch([board, keyword], () => { page.value = 1 })
const posts = useQuery({ queryKey: ['community-posts', slug, board, keyword, page, actorKey], queryFn: () => api.get<CommunityPage<CommunityPost>>(`${path}/posts`, { board_id: board.value, keyword: keyword.value, page: page.value, limit: 20 }) })
const joinReason = computed(() => query.data.value?.is_joined ? '' : communityInteractionReason(query.data.value, 'join'))
async function toggleJoin() {
  if (!query.data.value || busy.value) return
  busy.value = true
  try { await api.post(`${path}/${query.data.value.is_joined ? 'leave' : 'join'}`, { expected_entity_id: query.data.value.entity_id }); await Promise.all([query.refetch(), cache.invalidateQueries({ queryKey: ['community-list'] })]); feedback.success(query.data.value.is_joined ? '已加入社区' : '已退出社区') }
  catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
watch(posts.isSuccess, ready => { if (ready) void restoreScroll() }, { immediate: true })
</script>
<template>
  <LsPageHeader v-if="query.isPending.value || query.isError.value" title="社区" back-to="/" back-label="社区广场" />
  <LsAsyncState v-if="query.isPending.value" state="loading" />
  <template v-else-if="query.isError.value"><LsAsyncState state="error" :description="friendlyError(query.error.value)" /></template>
  <template v-else-if="query.data.value">
    <LsPageHeader :title="query.data.value.name" :description="query.data.value.description" back-to="/" back-label="社区广场"><template #actions><LsButton @click="router.push(`${base}/posts/new`)"><template #icon><SquarePen :size="18" /></template>发布帖子</LsButton></template></LsPageHeader>
    <NSpace align="center"><NTag v-if="query.data.value.is_official" type="info">官方社区</NTag><NTag v-if="query.data.value.is_joined" type="success">已加入</NTag><span>{{ query.data.value.owner?.name || 'LostSky 平台' }}</span><RouterLink v-if="query.data.value.can_manage" class="community-management-entry" :to="`${base}/manage/boards`"><Settings :size="17" aria-hidden="true" />管理社区</RouterLink><LsButton v-if="query.data.value.is_joined" variant="ghost" :disabled="busy" disabled-reason="正在更新加入状态" @click="toggleJoin"><template #icon><LogOut :size="17" /></template>退出社区</LsButton></NSpace>
    <CommunityParticipation :community="query.data.value" />
    <LsAsyncState v-if="announcements.isError.value" state="error" title="公告读取失败" :description="friendlyError(announcements.error.value)" />
    <LsPanel v-else-if="announcements.data.value?.list.length"><template #header><h2 class="community-section-title">社区公告</h2></template><NCollapse :default-expanded-names="announcements.data.value.list.filter(item => item.pinned).map(item => item.id)"><NCollapseItem v-for="item in announcements.data.value.list" :key="item.id" :name="item.id" :title="`${item.pinned ? '置顶 · ' : ''}${item.title}`"><LsMarkdownRenderer :content="item.content" /></NCollapseItem></NCollapse></LsPanel>
    <LsAsyncState v-if="boards.isError.value" state="error" title="板块读取失败" :description="friendlyError(boards.error.value)" />
    <CommunityTabs v-else :value="board ?? 'all'" :items="[{ key: 'all', label: '全部讨论' }, ...(boards.data.value?.list ?? []).map(item => ({ key: item.id, label: `${item.name}${item.enabled ? '' : '（已停用）'}` }))]" label="社区板块" @change="board = $event === 'all' ? null : Number($event)" />
    <LsListToolbar v-model="keyword" placeholder="搜索帖子" aria-label="搜索帖子" :count-label="`${posts.data.value?.total ?? 0} 篇帖子`" />
    <LsAsyncState v-if="posts.isPending.value" state="loading" /><template v-else-if="posts.isError.value"><LsAsyncState state="error" :description="friendlyError(posts.error.value)" /></template><CommunityPostList v-else :posts="posts.data.value?.list ?? []" :base-path="base" :boards="boards.data.value?.list" :filtered="Boolean(keyword || board)" />
    <NPagination v-if="(posts.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="posts.data.value?.total" simple />
  </template>
</template>

<style scoped>.community-section-title{margin:0;font-size:1rem;font-weight:650}.community-management-entry{display:inline-flex;align-items:center;gap:.45rem;min-height:44px;color:var(--primary)}</style>
