<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { identityUrl, safeRedirect } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import type { EntityType } from '@lostsky/ui/entity'
import { AlertTriangle, ArrowRight, LoaderCircle } from '@lucide/vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface WarningContext {
  team: { id: number; slug: string; name: string }
  identity: { type: string; entity_id: number; slug?: string | null; name: string }
  can_continue: boolean
  entry_warning: { required: boolean; kind: string | null; ttl_seconds: number }
}

const route = useRoute()
const router = useRouter()
const teamSlug = computed(() => typeof route.query.team_slug === 'string' ? route.query.team_slug.trim().toLowerCase() : '')
const invalid = computed(() => !/^[a-z][a-z0-9_-]{1,49}$/.test(teamSlug.value))
const returnUrl = computed(() => safeRedirect(route.query.redirect, '/teams'))
const context = useQuery({
  queryKey: computed(() => ['workspace-warning', teamSlug.value]),
  queryFn: () => api.get<WarningContext>('/identity/workspace-warning', { team_slug: teamSlug.value }),
  enabled: computed(() => !invalid.value),
})
const acknowledge = useMutation({
  mutationFn: () => api.post('/identity/workspace-warning/acknowledge', { team_slug: teamSlug.value }),
  onSuccess: () => location.replace(returnUrl.value),
})

function switchIdentity() {
  location.assign(identityUrl(returnUrl.value))
}

function switchTeam() {
  void router.push('/teams')
}

function continueToWorkspace() {
  if (!context.data.value?.entry_warning.required) {
    location.replace(returnUrl.value)
    return
  }
  acknowledge.mutate()
}
</script>

<template>
  <main class="warning-page">
    <section v-if="invalid" class="warning-card">
      <AlertTriangle class="warning-icon" :size="32" aria-hidden="true" />
      <h1>无法确定目标团队</h1>
      <p>警告地址缺少有效的团队标识，当前身份没有发生变化。</p>
      <div class="actions"><LsButton @click="switchTeam">切换团队</LsButton></div>
    </section>

    <section v-else-if="context.isPending.value" class="warning-card" aria-busy="true">
      <LoaderCircle class="spinner" :size="32" aria-hidden="true" />
      <h1>正在核对工作台访问资格</h1>
      <p>我们正在确认当前 Entity 是否获得了 {{ teamSlug }} 的团队角色。</p>
    </section>

    <section v-else-if="context.isError.value" class="warning-card">
      <LsEmptyState title="当前身份不能继续" :description="friendlyError(context.error.value)" />
      <div class="actions">
        <LsButton variant="secondary" @click="switchTeam">切换团队</LsButton>
        <LsButton @click="switchIdentity">切换身份</LsButton>
      </div>
    </section>

    <section v-else-if="context.data.value" class="warning-card" :aria-busy="acknowledge.isPending.value">
      <AlertTriangle class="warning-icon" :size="32" aria-hidden="true" />
      <div>
        <h1>你正在使用外部身份</h1>
        <p>当前代表的是其他团队的 Entity。继续后，业务操作将使用目标团队授予该 Entity 的 Permission。</p>
      </div>
      <div class="identity-pair" aria-label="当前身份与目标团队">
        <LsEntityIdentity
          :type="context.data.value.identity.type as EntityType"
          :name="context.data.value.identity.name"
          :slug="context.data.value.identity.slug || ''"
          fallback="initial"
        />
        <ArrowRight :size="20" aria-hidden="true" />
        <LsEntityIdentity type="team" :name="context.data.value.team.name" :slug="context.data.value.team.slug" fallback="initial" />
      </div>
      <p class="assurance">确认只会在当前 Entity 与目标团队组合下免提示 {{ Math.round(context.data.value.entry_warning.ttl_seconds / 3600) }} 小时，不会改变角色或权限。</p>
      <p v-if="acknowledge.isError.value" class="error" role="alert">{{ friendlyError(acknowledge.error.value) }}</p>
      <div class="actions">
        <LsButton variant="ghost" @click="switchTeam">切换团队</LsButton>
        <LsButton variant="secondary" @click="switchIdentity">切换身份</LsButton>
        <LsButton :loading="acknowledge.isPending.value" @click="continueToWorkspace">继续前往</LsButton>
      </div>
    </section>
  </main>
</template>

<style scoped>
.warning-page{min-height:100dvh;display:grid;place-items:center;padding:1rem;background:var(--cloud)}.warning-card{width:min(100%,38rem);display:grid;gap:1.25rem;padding:clamp(1.5rem,6vw,2.75rem);background:white;border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 55px color-mix(in oklch,var(--sky-night),transparent 92%)}.warning-card h1,.warning-card p{margin:0}.warning-card h1{font-size:clamp(1.6rem,6vw,2.15rem);line-height:1.2}.warning-card p{max-width:70ch;color:var(--muted-ink);line-height:1.65}.warning-icon{color:var(--warning)}.spinner{color:var(--sky-lost-strong);animation:spin .9s linear infinite}.identity-pair{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:1rem;padding:1rem;background:var(--cloud);border-radius:12px}.identity-pair>svg{color:var(--muted-ink)}.assurance{font-size:.85rem}.error{color:var(--danger)!important}.actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.65rem}.actions>*{min-height:44px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:34rem){.identity-pair{grid-template-columns:1fr}.identity-pair>svg{transform:rotate(90deg)}.actions{display:grid}.actions>*{width:100%}}@media(prefers-reduced-motion:reduce){.spinner{animation:none}}
</style>
