<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, MessageCircleMore, UserRound, Users } from '@lucide/vue'
import { identityUrl } from '@lostsky/shared/navigation'

interface TeamItem {
  slug: string
  display_name: string
  as_member: boolean
  as_customer: boolean
  href: string
}
const teams = useQuery({ queryKey: ['chat-teams'], queryFn: () => api.get<TeamItem[]>('/team') })
</script>

<template>
  <main class="picker">
    <header>
      <a class="brand" href="//www.lostsky.work"><span>LostSky</span><strong>Chat</strong></a>
      <a class="identity-link" :href="identityUrl()">切换身份</a>
      <div class="hero-icon"><MessageCircleMore :size="34" /></div>
      <p class="eyebrow">YOUR CONVERSATIONS</p>
      <h1>从一个团队开始</h1>
      <p>成员工作区和客户会话汇总在同一处；进入团队后仍可切换你能使用的身份。</p>
    </header>

    <section aria-labelledby="teams-title">
      <div class="section-title">
        <h2 id="teams-title">可用团队</h2>
        <span>{{ teams.data.value?.length ?? 0 }}</span>
      </div>
      <p v-if="teams.isPending.value" class="state">正在载入团队…</p>
      <p v-else-if="teams.isError.value" class="state error" role="alert">{{ friendlyError(teams.error.value) }}</p>
      <div v-else-if="teams.data.value?.length" class="team-list">
        <a v-for="team in teams.data.value" :key="team.slug" :href="team.href">
          <div>
            <LsEntityIdentity type="team" :name="team.display_name || team.slug" :slug="team.slug" />
            <p>
              <span v-if="team.as_member"><Users :size="14" />成员</span>
              <span v-if="team.as_customer"><UserRound :size="14" />客户</span>
            </p>
          </div>
          <ArrowRight :size="20" />
        </a>
      </div>
      <LsEmptyState v-else title="还没有可用的聊天团队" description="加入团队成为成员，或在商店中建立客户关系后，这里会自动出现入口。" />
    </section>
  </main>
</template>

<style scoped>
.picker{width:min(100% - 2rem,56rem);margin:0 auto;padding:clamp(2rem,8vw,6rem) 0;display:grid;gap:2.5rem}.picker>header{text-align:center;display:grid;justify-items:center;gap:.6rem}.brand{display:flex;align-items:baseline;gap:.45rem;margin-bottom:.35rem}.brand span{font:700 1.5rem/1 'Barlow Condensed',sans-serif}.brand strong{color:var(--sky-lost-strong);font-size:.75rem;text-transform:uppercase;letter-spacing:.12em}.identity-link{color:var(--sky-lost-strong);font-size:.9rem;font-weight:650}.hero-icon{width:68px;height:68px;display:grid;place-items:center;color:white;background:var(--sky-night);border-radius:20px}.eyebrow{color:var(--sky-lost-strong);font:700 .72rem/1 'Barlow Condensed',sans-serif;letter-spacing:.13em}.picker h1,.picker p{margin:0}.picker h1{font-size:clamp(2rem,7vw,3.5rem);line-height:1}.picker>header>p:last-child{max-width:40rem;color:var(--muted-ink)}.picker>section{display:grid;gap:1rem}.section-title{display:flex;align-items:center;justify-content:space-between}.section-title h2{margin:0;font-size:1rem}.section-title span{min-width:30px;height:30px;display:grid;place-items:center;color:var(--muted-ink);background:white;border:1px solid var(--line);border-radius:999px;font-size:.8rem}.team-list{display:grid;overflow:hidden;background:white;border:1px solid var(--line);border-radius:14px}.team-list>a{min-height:88px;display:grid;grid-template-columns:minmax(0,1fr) 24px;align-items:center;gap:.85rem;padding:1rem;background:white;border-bottom:1px solid var(--line);transition:background-color var(--motion-fast) var(--ease-standard)}.team-list>a:last-child{border-bottom:0}.team-list>a:hover{background:var(--cloud)}.team-list strong,.team-list small{display:block;overflow:hidden;text-overflow:ellipsis}.team-list small{color:var(--muted-ink)}.team-list p{display:flex;gap:.45rem;margin-top:.3rem}.team-list p span{display:inline-flex;align-items:center;gap:.2rem;color:var(--muted-ink);font-size:.72rem}.state{padding:2rem;text-align:center;background:white;border:1px solid var(--line);border-radius:14px}.state.error{color:var(--danger)}.state h2{margin:0 0 .4rem;font-size:1.1rem}.state p{color:var(--muted-ink)}
.team-list>a{grid-template-columns:minmax(0,1fr) 24px}
</style>
