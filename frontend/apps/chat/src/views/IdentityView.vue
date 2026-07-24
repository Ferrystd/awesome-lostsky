<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ArrowLeft, BadgeCheck, Building2, Bot, ShieldUser, UserRound } from '@lucide/vue'
import { NButton, NConfigProvider } from 'naive-ui'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'

type Identity = { type: 'teamMember' | 'teamCustomer' | 'team' | 'teamVirtual'; id: number; slug: string; name: string }
const router = useRouter()
const candidates = useQuery({ queryKey: ['identity-candidates'], queryFn: () => api.get<Identity[]>('/identity/candidates') })
const receive = useMutation({
  mutationFn: (slug: string) => api.post<{ token: string; identity: Identity }>('/identity/receive', { slug }),
  onSuccess: ({ token }) => { auth.save({ token }); router.push('/') },
})
const drop = useMutation({
  mutationFn: () => api.post<{ token: string }>('/identity/drop'),
  onSuccess: ({ token }) => { auth.save({ token }); router.push('/') },
})
const icon = computed(() => ({ teamMember: ShieldUser, teamCustomer: UserRound, team: Building2, teamVirtual: Bot }))
function label(type: Identity['type']) { return ({ teamMember: '成员', teamCustomer: '客户', team: '团队', teamVirtual: '虚拟实体' })[type] }
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme">
    <main class="identity-page">
    <a class="back" href="/"><ArrowLeft :size="18" /> 返回团队</a>
    <header>
      <p class="eyebrow">IDENTITY</p>
      <h1>选择当前身份</h1>
      <p>领取后，后续操作将以该实体的独立角色执行；个人账户与设备设置仍使用你的用户身份。</p>
    </header>
    <NButton class="drop" text type="primary" :loading="drop.isPending.value" @click="drop.mutate()">使用用户身份</NButton>

    <p v-if="candidates.isPending.value" class="state">正在加载可领取身份…</p>
    <p v-else-if="candidates.isError.value" class="state error" role="alert">{{ friendlyError(candidates.error.value) }}</p>
    <section v-else-if="candidates.data.value?.length" class="identity-list" aria-label="可领取身份">
      <article v-for="item in candidates.data.value" :key="item.slug">
        <component :is="icon[item.type]" :size="23" aria-hidden="true" />
        <div>
          <strong>{{ item.name }}</strong>
          <small>@{{ item.slug }} · {{ label(item.type) }}</small>
        </div>
        <NButton type="primary" :loading="receive.isPending.value" @click="receive.mutate(item.slug)">
          <template #icon><BadgeCheck :size="17" /></template>领取
        </NButton>
      </article>
    </section>
    <section v-else class="state empty">
      <h2>暂无可领取身份</h2>
      <p>成员和客户需要先完成公开 slug；团队及虚拟实体需要由团队角色授予领取权限。</p>
    </section>
    <p v-if="receive.isError.value" class="error action-error" role="alert">{{ friendlyError(receive.error.value) }}</p>
    <p v-if="drop.isError.value" class="error action-error" role="alert">{{ friendlyError(drop.error.value) }}</p>
    </main>
  </NConfigProvider>
</template>

<style scoped>
.identity-page{width:min(100% - 2rem,42rem);margin:0 auto;padding:clamp(2rem,7vw,4.5rem) 0;display:grid;gap:1.5rem}.back{display:inline-flex;align-items:center;gap:.4rem;width:max-content;color:var(--sky-lost-strong);font-weight:650}.identity-page header{display:grid;gap:.65rem;max-width:42rem}.identity-page h1,.identity-page p{margin:0}.identity-page h1{font-size:2rem;line-height:1.15}.identity-page header>p:last-child{color:var(--muted-ink);line-height:1.65}.eyebrow{font:700 .72rem/1 Inter,sans-serif;letter-spacing:.12em;color:var(--sky-lost-strong)}.drop{justify-self:start;min-height:40px;padding:0;border:0;background:transparent;color:var(--sky-lost-strong);font:650 .9rem/1 Inter,sans-serif;cursor:pointer}.drop:hover{text-decoration:underline}.drop:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),white 65%);outline-offset:3px;border-radius:4px}.drop:disabled{opacity:.62;cursor:not-allowed}.identity-list{display:grid;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:white}.identity-list article{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:1rem;align-items:center;padding:1rem;border-bottom:1px solid var(--line)}.identity-list article:last-child{border-bottom:0}.identity-list article>svg{color:var(--sky-lost-strong)}.identity-list strong,.identity-list small{display:block}.identity-list small{margin-top:.2rem;color:var(--muted-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.identity-list button{min-height:40px;display:inline-flex;align-items:center;gap:.4rem;padding:0 .8rem;border:0;border-radius:9px;background:var(--sky-lost-strong);color:white;font:650 .9rem/1 Inter,sans-serif;cursor:pointer;transition:background .18s ease,opacity .18s ease}.identity-list button:hover{background:var(--sky-lost)}.identity-list button:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),white 65%);outline-offset:2px}.identity-list button:disabled{opacity:.62;cursor:not-allowed}.state{margin:0;padding:2rem;text-align:center;border:1px solid var(--line);border-radius:12px;background:white}.state h2{margin:0 0 .5rem;font-size:1.05rem}.state p{color:var(--muted-ink);line-height:1.6}.error{color:var(--danger)}.action-error{margin:0}.empty{display:grid;gap:.35rem}@media (max-width:32rem){.identity-list article{grid-template-columns:24px minmax(0,1fr);gap:.75rem}.identity-list button{grid-column:2;justify-self:start}.identity-list small{white-space:normal}}
</style>
