<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { safeRedirect, communityWorkspaceUrl } from '@lostsky/shared/navigation'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Bot, LogOut, ShieldUser, UserRound } from '@lucide/vue'
import { NButton, NSkeleton } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Identity = {
  type: 'teamMember' | 'teamCustomer' | 'team' | 'teamVirtual'
  id: number
  slug: string
  name: string
  team: { id: number; slug: string; name: string } | null
}

const route = useRoute()
const router = useRouter()
const activeEntity = ref(auth.entity())
const returnUrl = computed(() => safeRedirect(route.query.redirect, ''))
const targetSlug = computed(() => typeof route.query.target === 'string' ? route.query.target.trim().toLowerCase() : '')
const candidates = useQuery({
  queryKey: ['identity-candidates'],
  queryFn: () => api.get<Identity[]>('/identity/candidates'),
})
const receive = useMutation({
  mutationFn: (slug: string) => api.post<{ token: string; identity: Identity }>('/identity/receive', { slug }),
  onSuccess: async ({ token, identity }) => {
    auth.save({ token })
    activeEntity.value = identity
    await candidates.refetch()
  },
})
const drop = useMutation({
  mutationFn: () => api.post<{ token: string }>('/identity/drop'),
  onSuccess: async ({ token }) => {
    auth.save({ token })
    activeEntity.value = null
    await candidates.refetch()
  },
})
const icons = { teamMember: ShieldUser, teamCustomer: UserRound, team: Building2, teamVirtual: Bot }
const orderedCandidates = computed(() => [...(candidates.data.value ?? [])].sort((a, b) => {
  if (a.slug === targetSlug.value) return -1
  if (b.slug === targetSlug.value) return 1
  return a.name.localeCompare(b.name, 'zh-CN')
}))
const targetAvailable = computed(() => !targetSlug.value || orderedCandidates.value.some(item => item.slug === targetSlug.value))
function label(type: Identity['type']) {
  return ({ teamMember: '成员', teamCustomer: '顾客', team: '团队', teamVirtual: '虚拟人员' })[type]
}
async function logout() {
  try { await api.post('/devices/quit', {}) } catch { /* local logout still continues */ }
  auth.clear()
  await router.replace('/login')
}
</script>

<template>
    <main class="identity-page">
      <nav class="page-actions" aria-label="账号操作">
        <a :href="communityWorkspaceUrl()">社区广场</a>
        <a class="back" href="/teams"><ArrowLeft :size="18" />返回团队列表</a>
        <NButton quaternary @click="logout"><template #icon><LogOut :size="18" /></template>退出登录</NButton>
      </nav>
      <header>
        <p class="eyebrow">身份</p>
        <h1>选择当前身份</h1>
        <p>业务操作使用你登录的人员。</p>
      </header>

      <section v-if="activeEntity" class="active-card">
        <div><strong>当前正在使用人员身份</strong><p>{{ activeEntity.type }} · #{{ activeEntity.id }}</p></div>
        <NButton type="primary" secondary :loading="drop.isPending.value" @click="drop.mutate()">放弃身份</NButton>
      </section>
      <p v-if="drop.isError.value" class="error" role="alert">{{ friendlyError(drop.error.value) }}</p>

      <section class="candidate-heading">
        <div>
          <h2>{{ activeEntity ? '可切换身份' : '可领取身份' }}</h2>
          <p>{{ activeEntity ? '列表由其他团队或当前团队授予该人员的身份委托权限决定。' : '您的业务操作需要您领取人员身份。' }}</p>
        </div>
      </section>
      <p v-if="targetSlug && targetAvailable" class="target-note">请确认切换为 <strong>@{{ targetSlug }}</strong>。切换后可继续选择其他身份。</p>
      <p v-else-if="targetSlug && !candidates.isPending.value && !targetAvailable" class="error" role="alert">当前身份没有切换为 @{{ targetSlug }} 的权限。</p>

      <div class="candidate-results">
        <section v-if="candidates.isPending.value" class="state skeletons" aria-label="正在加载身份">
          <NSkeleton v-for="index in 3" :key="index" text height="44px" />
        </section>
        <section v-else-if="candidates.isError.value" class="state error" role="alert">
          <p>{{ friendlyError(candidates.error.value) }}</p>
        </section>
        <section v-else-if="orderedCandidates.length" class="identity-list" aria-label="可领取身份">
          <article v-for="item in orderedCandidates" :key="item.slug" :class="{ targeted: item.slug === targetSlug }">
            <component :is="icons[item.type]" :size="23" aria-hidden="true" />
            <div>
              <strong>{{ item.name }}</strong>
              <small>@{{ item.slug }} · {{ label(item.type) }}</small>
              <small v-if="item.team" class="team-name">{{ item.team.name }} · {{ item.team.slug }}</small>
            </div>
            <NButton type="primary" :loading="receive.isPending.value" @click="receive.mutate(item.slug)">
              <template #icon><BadgeCheck :size="17" /></template>{{ item.slug === targetSlug ? '切换为此人员' : activeEntity ? '切换' : '领取' }}
            </NButton>
          </article>
        </section>
        <LsEmptyState
          v-else
          :title="activeEntity ? '暂无可切换身份' : '暂无可领取身份'"
          :description="activeEntity ? '当前人员尚未获得任何团队授予的身份委托权限。' : '使用该人员身份前，需要先补全其全局标识。'"
        />
        <p v-if="receive.isError.value" class="error" role="alert">{{ friendlyError(receive.error.value) }}</p>
      </div>
      <footer v-if="returnUrl" class="return-action">
        <a class="return-link" :href="returnUrl">
          前往页面<ArrowRight :size="18" aria-hidden="true" />
        </a>
      </footer>
    </main>
</template>

<style scoped>
.page-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.return-action{display:flex;justify-content:flex-end;padding-top:.5rem}
.return-link{min-height:44px;display:inline-flex;align-items:center;gap:.4rem;color:var(--sky-lost-strong);font-weight:650;text-underline-offset:.2em}.return-link:hover{text-decoration:underline}.return-link:focus-visible{outline:2px solid var(--sky-lost-strong);outline-offset:3px;border-radius:4px}
.identity-page{width:min(100% - 2rem,42rem);margin:0 auto;padding:2.5rem 0 4rem;display:grid;gap:1.5rem}.back{min-height:44px;display:inline-flex;align-items:center;gap:.4rem;width:max-content;color:var(--sky-lost-strong);font-weight:650}.identity-page header{display:grid;gap:.65rem}.identity-page h1,.identity-page h2,.identity-page p{margin:0}.identity-page h1{font-size:2rem;line-height:1.2}.identity-page header>p:last-child,.candidate-heading p{max-width:65ch;color:var(--muted-ink);line-height:1.65}.eyebrow{font:700 .72rem/1 'Barlow Condensed',sans-serif;letter-spacing:.12em;color:var(--sky-lost-strong)}.active-card,.identity-list,.state{background:white;border:1px solid var(--line);border-radius:12px}.active-card{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem}.active-card p{margin-top:.25rem;color:var(--muted-ink);font-size:.8rem}.candidate-heading{display:flex;align-items:end;justify-content:space-between;gap:1rem}.candidate-heading h2{font-size:1.125rem}.candidate-heading p{margin-top:.35rem;font-size:.875rem}.target-note{padding:.8rem 1rem;color:var(--ink);background:var(--cloud);border-radius:8px;font-size:.875rem}.candidate-results{display:grid;gap:1rem}.identity-list{display:grid;overflow:hidden}.identity-list article{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:1rem;align-items:center;padding:1rem;border-bottom:1px solid var(--line)}.identity-list article.targeted{background:var(--cloud);outline:2px solid var(--sky-lost-strong);outline-offset:-2px}.identity-list article:last-child{border-bottom:0}.identity-list article>svg{color:var(--sky-lost-strong)}.identity-list strong,.identity-list small{display:block}.identity-list small{margin-top:.2rem;color:var(--muted-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.identity-list .team-name{color:var(--ink)}.state{padding:2rem;text-align:center}.state h2{margin:0 0 .5rem;font-size:1.05rem}.state p{color:var(--muted-ink);line-height:1.6}.state.error{display:grid;justify-items:center;gap:1rem}.skeletons{display:grid;gap:.75rem;text-align:left}.error{margin:0;color:var(--danger)}@media(max-width:32rem){.identity-page{padding-top:1.5rem}.active-card{align-items:stretch;flex-direction:column}.identity-list article{grid-template-columns:24px minmax(0,1fr);gap:.75rem}.identity-list article :deep(.n-button){grid-column:2;justify-self:start;min-height:44px}.identity-list small{white-space:normal}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
