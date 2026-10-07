<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { useCommunityListState } from '@lostsky/shared/useCommunityListState'
import { api, auth, friendlyError } from '@lostsky/api/client'
import type { Community, CommunityPage, CommunitySession } from '@lostsky/api/community'
import { identityUrl } from '@lostsky/shared/navigation'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { useQuery } from '@tanstack/vue-query'
import { NList, NListItem, NThing, NTag, NSpace, NPagination } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
const actorKey = communityActorKey()
const route = useRoute()
const mine = computed(() => route.path === '/mine')
const session = useQuery({ queryKey: ['community-session', actorKey], queryFn: () => api.get<CommunitySession>('/session'), enabled: Boolean(auth.token()) })
const { keyword, page, restoreScroll } = useCommunityListState(`community:${mine.value ? 'mine' : 'square'}`)
watch(keyword, () => { page.value = 1 })
const query = useQuery({ queryKey: ['community-list', mine, keyword, page, actorKey], queryFn: () => api.get<CommunityPage<Community>>(mine.value ? '/mine' : '/communities', { keyword: keyword.value, page: page.value, limit: 20 }), enabled: computed(() => !mine.value || Boolean(session.data.value?.entity)) })
watch(query.isSuccess, ready => { if (ready) void restoreScroll() }, { immediate: true })
</script>
<template>
  <LsPageHeader :title="mine ? '我加入的社区' : '社区广场'" description="围绕共同的话题，分享经验、提出问题，一起讨论。" />
  <LsListToolbar v-model="keyword" placeholder="搜索社区" aria-label="搜索社区" :count-label="`${query.data.value?.total ?? 0} 个社区`" />
  <template v-if="mine && (!auth.token() || (session.isSuccess.value && !session.data.value?.entity))"><LsEmptyState :title="auth.token() ? '选择人员身份后查看加入的社区' : '登录后查看加入的社区'" description="加入关系跟随当前人员身份，成员与顾客均可参与。" /><a :href="identityUrl()">{{ auth.token() ? '前往选择身份' : '前往登录' }}</a></template>
  <LsAsyncState v-else-if="mine && session.isError.value" state="error" :description="friendlyError(session.error.value)" />
  <LsAsyncState v-else-if="query.isPending.value" state="loading" />
  <template v-else-if="query.isError.value"><LsAsyncState state="error" :description="friendlyError(query.error.value)" /></template>
  <LsEmptyState v-else-if="!query.data.value?.list.length" title="没有找到社区" :description="mine ? '在社区广场发现感兴趣的话题，加入后会显示在这里。' : '试试其他搜索词。'" />
  <NList v-else bordered><NListItem v-for="community in query.data.value.list" :key="community.id"><NThing><template #header><RouterLink :to="`/c/${community.slug}`">{{ community.name }}</RouterLink></template><template #header-extra><NSpace><NTag v-if="community.is_official" type="info" size="small">官方</NTag><NTag v-if="community.status === 'Paused'" size="small">已暂停</NTag></NSpace></template><template #description>{{ community.owner?.name || 'LostSky 平台' }}</template>{{ community.description || '欢迎加入，一起交流。' }}</NThing></NListItem></NList>
  <NPagination v-if="(query.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="query.data.value?.total" simple />
</template>
