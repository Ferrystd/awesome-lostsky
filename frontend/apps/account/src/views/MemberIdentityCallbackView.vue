<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { identityUrl, safeRedirect } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { AlertTriangle, BadgeCheck, LoaderCircle } from '@lucide/vue'
import { useMutation } from '@tanstack/vue-query'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type MemberIssue = { token: string; identity: { type: string; id: number; slug: string; name: string } }

const route = useRoute()
const router = useRouter()
const teamSlug = computed(() => typeof route.query.team_slug === 'string' ? route.query.team_slug.trim() : '')
const reason = computed(() => route.query.reason === 'team_mismatch' ? 'team_mismatch' : 'missing')
const invalid = computed(() => !/^[A-Za-z][A-Za-z0-9_-]{1,49}$/.test(teamSlug.value))
const autoAttemptStopped = ref(false)
const attemptKey = computed(() => `lostsky:member-auto-attempt:${currentUserId()}:${teamSlug.value.toLowerCase()}`)
const receive = useMutation({
  mutationFn: () => api.post<MemberIssue>('/identity/member', { team_slug: teamSlug.value }),
  onSuccess: ({ token }) => {
    try { sessionStorage.removeItem(attemptKey.value) } catch { /* private browsing may disable storage */ }
    auth.save({ token })
    returnToOrigin()
  },
})

function currentUserId() {
  const user = auth.user<{ id?: number; user_id?: number }>()
  const stored = Number(user?.id ?? user?.user_id ?? 0)
  if (stored > 0) return String(stored)
  try {
    const part = auth.token().split('.')[1]
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { uid?: unknown }
    const uid = Number(payload.uid ?? 0)
    return uid > 0 ? String(uid) : 'unknown'
  } catch { return 'unknown' }
}

function returnToOrigin() {
  const target = safeRedirect(route.query.return_to, '')
  if (target) {
    location.replace(target)
  } else if (history.length > 1) {
    history.back()
  } else {
    void router.replace('/teams')
  }
}

function retry() {
  if (!invalid.value) receive.mutate()
}

function switchIdentity() {
  location.assign(identityUrl(safeRedirect(route.query.return_to, '')))
}

function switchTeam() {
  void router.push('/teams')
}

onMounted(() => {
  if (reason.value !== 'missing' || invalid.value) return
  try {
    if (sessionStorage.getItem(attemptKey.value)) {
      autoAttemptStopped.value = true
      return
    }
    sessionStorage.setItem(attemptKey.value, '1')
  } catch { /* without session storage, keep the existing one-shot page lifecycle */ }
  receive.mutate()
})
</script>

<template>
  <main class="callback-page">
    <section class="callback-card" :aria-busy="receive.isPending.value">
      <template v-if="invalid">
        <AlertTriangle class="status-icon warning" :size="30" aria-hidden="true" />
        <h1>无法确定要进入的团队</h1>
        <p class="description">回调地址缺少有效的团队标识。你的当前身份没有发生变化。</p>
        <LsButton @click="returnToOrigin">返回</LsButton>
      </template>

      <template v-else-if="reason === 'team_mismatch' && !receive.isPending.value && !receive.isError.value">
        <AlertTriangle class="status-icon warning" :size="30" aria-hidden="true" />
        <h1>切换到 {{ teamSlug }} 的成员身份？</h1>
        <p class="description">继续将放弃当前实体（Entity）身份，并领取该团队内与你账号关联的有效成员身份。</p>
        <div class="actions">
          <LsButton variant="secondary" @click="returnToOrigin">取消并保留当前身份</LsButton>
          <LsButton autofocus @click="retry">确认切换</LsButton>
        </div>
      </template>

      <template v-else-if="receive.isPending.value">
        <LoaderCircle class="status-icon spinner" :size="30" aria-hidden="true" />
        <h1>正在领取成员身份</h1>
        <p class="description">正在验证你在 {{ teamSlug }} 的成员资格，完成后将返回原页面。</p>
      </template>

      <template v-else-if="receive.isError.value || autoAttemptStopped">
        <AlertTriangle class="status-icon warning" :size="30" aria-hidden="true" />
        <h1>无法领取成员身份</h1>
        <p class="description" role="alert">{{ receive.isError.value ? friendlyError(receive.error.value) : '本次浏览会话已经尝试过自动领取，没有再次发送请求。' }}</p>
        <p class="assurance">请选择其他身份，或返回团队列表。新浏览会话可以重新自动尝试一次。</p>
        <div class="actions">
          <LsButton variant="secondary" @click="switchTeam">切换团队</LsButton>
          <LsButton @click="switchIdentity">切换身份</LsButton>
        </div>
      </template>

      <template v-else>
        <BadgeCheck class="status-icon" :size="30" aria-hidden="true" />
        <h1>准备领取成员身份</h1>
      </template>
    </section>
  </main>
</template>

<style scoped>
.callback-page{min-height:100dvh;display:grid;place-items:center;padding:1rem;background:var(--cloud)}.callback-card{width:min(100%,32rem);display:grid;justify-items:start;gap:.8rem;padding:clamp(1.5rem,6vw,2.5rem);background:white;border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 55px color-mix(in oklch,var(--sky-night),transparent 92%)}.status-icon{color:var(--sky-lost-strong)}.warning{color:var(--warning)}.spinner{animation:spin .9s linear infinite}.callback-card h1{margin:.35rem 0 0;font-size:clamp(1.55rem,6vw,2rem);line-height:1.2}.description,.assurance{margin:0;color:var(--muted-ink);line-height:1.65}.assurance{font-size:.82rem}.actions{width:100%;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.65rem;margin-top:.65rem}.actions>*{min-height:44px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:30rem){.actions{display:grid}.actions>*{width:100%}}@media(prefers-reduced-motion:reduce){.spinner{animation:none}}
</style>
