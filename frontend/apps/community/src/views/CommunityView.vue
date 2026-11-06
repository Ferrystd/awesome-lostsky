<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { useCommunityListState } from '@lostsky/shared/useCommunityListState'
import { api, friendlyError } from '@lostsky/api/client'
import { communityPath, type Community, type CommunityBoard, type CommunityAnnouncement, type CommunityPost, type CommunityPage } from '@lostsky/api/community'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NPagination, NTag } from 'naive-ui'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import CommunityTabs from '@lostsky/ui/community/CommunityTabs.vue'
import CommunityParticipation from '../components/CommunityParticipation.vue'
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
const descriptionExpanded = ref(false)
const description = computed(() => query.data.value?.description || '这里的讨论公开可读，加入后可以参与交流。')
async function toggleJoin() {
  if (!query.data.value || busy.value) return
  busy.value = true
  try { await api.post(`${path}/${query.data.value.is_joined ? 'leave' : 'join'}`, { expected_entity_id: query.data.value.entity_id }); await Promise.all([query.refetch(), cache.invalidateQueries({ queryKey: ['community-list'] })]); feedback.success(query.data.value.is_joined ? '已加入社区' : '已退出社区') }
  catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
watch(posts.isSuccess, ready => { if (ready) void restoreScroll() }, { immediate: true })
</script>
<template>
  <LsPageHeader v-if="query.isPending.value || query.isError.value" title="社区" back-to="/communities" back-label="发现社区" />
  <LsAsyncState v-if="query.isPending.value" state="loading" />
  <template v-else-if="query.isError.value"><LsAsyncState state="error" :description="friendlyError(query.error.value)" /></template>
  <div v-else-if="query.data.value" class="community-detail">
    <header class="community-detail__heading">
      <LsPageHeader :title="query.data.value.name"><template #actions><LsButton @click="router.push(`${base}/posts/new`)"><template #icon><SquarePen :size="18" /></template>发布帖子</LsButton></template></LsPageHeader>
      <div class="community-detail__identity">
        <NTag v-if="query.data.value.is_official" size="small">官方社区</NTag><span>{{ query.data.value.owner?.name || 'LostSky 平台' }}</span><NTag v-if="query.data.value.is_joined" size="small">已加入</NTag>
        <RouterLink class="community-detail__secondary" to="/communities">发现社区</RouterLink>
        <RouterLink v-if="query.data.value.can_manage" class="community-detail__secondary" :to="`${base}/manage/boards`"><Settings :size="16" aria-hidden="true" />管理社区</RouterLink>
        <LsButton v-if="query.data.value.is_joined" variant="ghost" :disabled="busy" disabled-reason="正在更新加入状态" @click="toggleJoin"><template #icon><LogOut :size="16" /></template>退出社区</LsButton>
      </div>
      <p class="community-detail__description">{{ descriptionExpanded || description.length <= 100 ? description : `${description.slice(0, 100)}…` }} <LsButton v-if="description.length > 100" variant="ghost" :aria-expanded="descriptionExpanded" @click="descriptionExpanded = !descriptionExpanded">{{ descriptionExpanded ? '收起简介' : '展开简介' }}</LsButton></p>
    </header>
    <CommunityParticipation :community="query.data.value" />
    <section class="community-discussions" aria-label="社区讨论">
      <LsAsyncState v-if="announcements.isError.value" state="error" title="公告读取失败" :description="friendlyError(announcements.error.value)" />
      <div v-else-if="announcements.data.value?.list.length" class="community-announcements" aria-label="社区公告"><details v-for="item in announcements.data.value.list" :key="item.id"><summary>{{ item.pinned ? '置顶公告' : '公告' }} · {{ item.title }}</summary><LsMarkdownRenderer :content="item.content" /></details></div>
      <div class="community-discussions__toolbar">
        <LsAsyncState v-if="boards.isError.value" state="error" title="板块读取失败" :description="friendlyError(boards.error.value)" />
        <CommunityTabs v-else :value="board ?? 'all'" :items="[{ key: 'all', label: '全部讨论' }, ...(boards.data.value?.list ?? []).map(item => ({ key: item.id, label: `${item.name}${item.enabled ? '' : '（已停用）'}` }))]" label="社区板块" @change="board = $event === 'all' ? null : Number($event)" />
        <LsListToolbar v-model="keyword" embedded placeholder="搜索帖子" aria-label="搜索帖子" />
      </div>
      <LsAsyncState v-if="posts.isPending.value" state="loading" /><LsAsyncState v-else-if="posts.isError.value" state="error" :description="friendlyError(posts.error.value)" /><CommunityPostList v-else :posts="posts.data.value?.list ?? []" :base-path="base" :boards="boards.data.value?.list" :filtered="Boolean(keyword || board)" />
      <NPagination v-if="(posts.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="posts.data.value?.total" simple />
    </section>
  </div>
</template>
<style scoped>
.community-detail{display:grid;gap:.75rem;min-width:0;font-family:var(--font-ui)}.community-detail__heading{display:grid;gap:.125rem;min-width:0}.community-detail__identity{display:flex;align-items:center;gap:.25rem .75rem;flex-wrap:wrap;min-width:0;color:var(--text-secondary);font-size:.8125rem}.community-detail__identity>span{overflow-wrap:anywhere}.community-detail__secondary{display:inline-flex;align-items:center;gap:.35rem;min-height:44px;color:var(--text-secondary)}.community-detail__secondary:hover{color:var(--primary)}.community-detail__description{margin:0;color:var(--text-secondary);font-size:.875rem;line-height:1.6;overflow-wrap:anywhere}.community-discussions{display:grid;gap:.75rem;min-width:0}.community-announcements{padding:.5rem .75rem;border-block:1px solid var(--border);min-width:0}.community-announcements summary{min-height:44px;box-sizing:border-box;padding:.625rem 0;cursor:pointer;font-size:.875rem;line-height:1.5;overflow-wrap:anywhere}.community-discussions__toolbar{display:grid;grid-template-columns:minmax(0,1fr) minmax(12rem,20rem);gap:.75rem;align-items:center;min-width:0}@media(max-width:639px){.community-discussions__toolbar{grid-template-columns:minmax(0,1fr);gap:.375rem}}
</style>
