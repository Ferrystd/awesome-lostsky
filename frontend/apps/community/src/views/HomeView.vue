<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { communityActorKey, type Community, type CommunityPage, type CommunitySession } from '@lostsky/api/community'
import { identityUrl, loginUrl } from '@lostsky/shared/navigation'
import { NButton } from 'naive-ui'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import CommunityDirectory from '../components/CommunityDirectory.vue'
const actorKey = communityActorKey()
const official = useQuery({ queryKey: ['community-list', 'home-official', actorKey], queryFn: () => api.get<CommunityPage<Community>>('/communities', { official: 1, page: 1, limit: 4 }) })
const directory = useQuery({ queryKey: ['community-list', 'home-discover', actorKey], queryFn: () => api.get<CommunityPage<Community>>('/communities', { page: 1, limit: 4 }) })
const discoveries = computed(() => directory.data.value?.list.filter(item => !official.data.value?.list.some(known => known.id === item.id)) ?? [])
const session = useQuery({ queryKey: ['community-session', actorKey], queryFn: () => api.get<CommunitySession>('/session'), enabled: Boolean(auth.token()) })
const mine = useQuery({ queryKey: ['community-list', 'home-mine', actorKey], queryFn: () => api.get<CommunityPage<Community>>('/mine', { page: 1, limit: 3 }), enabled: computed(() => Boolean(session.data.value?.entity)) })
const identity = identityUrl(new URL('/', location.origin).href)
const identityHref = auth.token() ? identity : loginUrl({ redirect: new URL(identity, location.origin).href })
</script>
<template>
  <LsPageHeader title="社区" description="选择一个社区，阅读公开内容，参与感兴趣的讨论。" />
  <div class="community-home">
    <section class="community-home__official" aria-labelledby="official-title">
      <div class="community-home__section-heading"><h2 id="official-title">平台官方社区</h2><RouterLink class="community-home__link" to="/communities?official=1">查看全部官方社区 <span aria-hidden="true">→</span></RouterLink></div>
      <p class="community-home__hint">平台的公告、产品交流与用户反馈，从对应社区进入。</p>
      <LsAsyncState v-if="official.isPending.value" state="loading" />
      <LsAsyncState v-else-if="official.isError.value" state="error" title="官方社区暂时无法读取" :description="friendlyError(official.error.value)" />
      <CommunityDirectory v-else-if="official.data.value?.list.length" :communities="official.data.value.list" />
      <LsEmptyState v-else title="暂无官方社区" description="你仍可以发现其他公开社区。" />
    </section>
    <aside class="community-home__mine" aria-label="个人社区入口">
      <LsPanel><template #header><h2 class="community-home__aside-title">我加入的社区</h2></template>
        <LsAsyncState v-if="auth.token() && session.isPending.value" state="loading" />
        <LsAsyncState v-else-if="session.isError.value" state="error" :description="friendlyError(session.error.value)" />
        <template v-else-if="!session.data.value?.entity"><p class="community-home__hint">公开内容可直接阅读。选择人员身份后，回到你加入的社区继续交流。</p><NButton tag="a" :href="identityHref">{{ auth.token() ? '选择人员身份' : '登录并选择身份' }}</NButton></template>
        <LsAsyncState v-else-if="mine.isPending.value" state="loading" />
        <LsAsyncState v-else-if="mine.isError.value" state="error" :description="friendlyError(mine.error.value)" />
        <CommunityDirectory v-else-if="mine.data.value?.list.length" :communities="mine.data.value.list" />
        <LsEmptyState v-else title="还没有加入社区" description="先阅读感兴趣的社区，再选择加入。" />
        <template v-if="session.data.value?.entity" #footer><RouterLink class="community-home__link" to="/mine">查看我的社区 <span aria-hidden="true">→</span></RouterLink></template>
      </LsPanel>
    </aside>
    <section class="community-home__discover" aria-labelledby="discover-title">
      <div class="community-home__section-heading"><h2 id="discover-title">发现更多社区</h2><RouterLink class="community-home__link" to="/communities">浏览全部社区 <span aria-hidden="true">→</span></RouterLink></div>
      <p class="community-home__hint">查看社区介绍与所属平台或团队，选择你想了解的内容。</p>
      <LsAsyncState v-if="directory.isPending.value" state="loading" />
      <LsAsyncState v-else-if="directory.isError.value" state="error" title="社区目录暂时无法读取" :description="friendlyError(directory.error.value)" />
      <CommunityDirectory v-else-if="discoveries.length" :communities="discoveries" />
      <p v-else class="community-home__hint">当前没有更多社区入口，可以浏览完整社区目录。</p>
    </section>
  </div>
</template>
<style scoped>
.community-home{display:grid;grid-template-columns:minmax(0,2fr) minmax(16rem,1fr);gap:2rem;align-items:start}.community-home__official,.community-home__mine,.community-home__discover{display:grid;gap:1rem;min-width:0}.community-home__discover{grid-column:1/-1;border-top:1px solid var(--border);padding-top:1.5rem}.community-home__section-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}.community-home__section-heading h2,.community-home__aside-title{font-size:1.125rem;margin:0}.community-home__hint{margin:0;color:var(--text-secondary);font-size:.875rem;line-height:1.75;overflow-wrap:anywhere}.community-home__link{display:inline-flex;align-items:center;gap:.5rem;min-height:44px;color:var(--primary);font-size:.875rem;font-weight:600;overflow-wrap:anywhere}@media(max-width:899px){.community-home{grid-template-columns:minmax(0,1fr);gap:1.5rem}.community-home__mine{border-top:1px solid var(--border);padding-top:1.5rem}}
</style>
