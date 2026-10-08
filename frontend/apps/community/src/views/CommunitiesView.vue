<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { useCommunityListState } from '@lostsky/shared/useCommunityListState'
import { api, auth, friendlyError } from '@lostsky/api/client'
import type { Community, CommunityPage, CommunitySession } from '@lostsky/api/community'
import { identityUrl, loginUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { useQuery } from '@tanstack/vue-query'
import { NList, NListItem, NThing, NTag, NSpace, NPagination, NAvatar, NButton } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
const actorKey = communityActorKey()
const route = useRoute()
const identityHref = computed(() => { const target = identityUrl(new URL(route.fullPath, location.origin).href); return auth.token() ? target : loginUrl({ redirect: new URL(target, location.origin).href }) })
const mine = computed(() => route.path === '/mine')
const session = useQuery({ queryKey: ['community-session', actorKey], queryFn: () => api.get<CommunitySession>('/session'), enabled: Boolean(auth.token()) })
const { keyword, page, restoreScroll } = useCommunityListState(`community:${mine.value ? 'mine' : 'square'}`)
watch(keyword, () => { page.value = 1 })
const query = useQuery({ queryKey: ['community-list', mine, keyword, page, actorKey], queryFn: () => api.get<CommunityPage<Community>>(mine.value ? '/mine' : '/communities', { keyword: keyword.value, page: page.value, limit: 20 }), enabled: computed(() => !mine.value || Boolean(session.data.value?.entity)) })
watch(query.isSuccess, ready => { if (ready) void restoreScroll() }, { immediate: true })
</script>
<template>
  <LsPageHeader :title="mine ? '我加入的社区' : '社区广场'" :description="mine ? '回到你关心的话题，继续上次的讨论。' : '发现共同的话题，分享经验，也让好问题得到回应。'" />
  <LsListToolbar v-model="keyword" placeholder="搜索社区" aria-label="搜索社区" :count-label="`${query.data.value?.total ?? 0} 个社区`" />
  <template v-if="mine && (!auth.token() || (session.isSuccess.value && !session.data.value?.entity))"><LsEmptyState :title="auth.token() ? '选择人员身份后查看加入的社区' : '登录后查看加入的社区'" description="加入关系跟随当前人员身份，成员与顾客均可参与。" /><NButton tag="a" :href="identityHref">{{ auth.token() ? '前往选择身份' : '前往登录' }}</NButton></template>
  <LsAsyncState v-else-if="mine && session.isError.value" state="error" :description="friendlyError(session.error.value)" />
  <LsAsyncState v-else-if="query.isPending.value" state="loading" />
  <template v-else-if="query.isError.value"><LsAsyncState state="error" :description="friendlyError(query.error.value)" /></template>
  <LsEmptyState v-else-if="!query.data.value?.list.length" :title="keyword ? '没有找到匹配的社区' : mine ? '还没有加入社区' : '社区正在准备中'" :description="keyword ? '换个关键词，看看其他话题。' : mine ? '在社区广场发现感兴趣的话题，加入后会显示在这里。' : '平台与团队创建的公开社区会展示在这里，欢迎稍后再来。'" />
  <NList v-else bordered><NListItem v-for="community in query.data.value.list" :key="community.id"><NThing>
    <template #avatar><NAvatar :size="48" :bordered="true">{{ community.name.slice(0, 1) }}</NAvatar></template>
    <template #header><RouterLink class="community-directory-link" :to="`/c/${community.slug}`">{{ community.name }}</RouterLink></template>
    <template #description><NSpace align="center"><span>{{ community.owner?.name || 'LostSky 平台' }}</span><NTag v-if="community.is_official" type="info" size="small">官方</NTag><NTag v-if="community.is_joined" type="success" size="small">已加入</NTag><NTag v-if="community.status === 'Paused'" size="small">已暂停</NTag></NSpace></template>
    <p class="community-directory-description">{{ community.description || '欢迎加入，一起交流。' }}</p>
    <template #action><RouterLink class="community-directory-link" :to="`/c/${community.slug}`">进入社区<span aria-hidden="true"> →</span></RouterLink></template>
  </NThing></NListItem></NList>
  <RouterLink v-if="mine && !keyword && !query.data.value?.list.length" class="community-directory-link" to="/">去社区广场发现话题</RouterLink>
  <LsButton v-if="keyword && query.isSuccess.value && !query.data.value?.list.length" variant="secondary" @click="keyword = ''">清除搜索</LsButton>
  <NPagination v-if="(query.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="query.data.value?.total" simple />
</template>

<style scoped>.community-directory-link{display:inline-flex;align-items:center;min-height:44px;overflow-wrap:anywhere;color:var(--primary)}.community-directory-description{margin:.5rem 0 0;line-height:1.75;overflow-wrap:anywhere;color:var(--text-secondary)}</style>
