<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { safeRedirect } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { AlertTriangle, BadgeCheck, LoaderCircle } from '@lucide/vue'
import { useMutation } from '@tanstack/vue-query'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type MemberIssue = { token: string; identity: { type: string; id: number; slug: string; name: string } }

const route = useRoute()
const router = useRouter()
const teamSlug = computed(() => typeof route.query.team_slug === 'string' ? route.query.team_slug.trim() : '')
const reason = computed(() => route.query.reason === 'team_mismatch' ? 'team_mismatch' : 'missing')
const invalid = computed(() => !/^[A-Za-z][A-Za-z0-9_-]{1,49}$/.test(teamSlug.value))
const receive = useMutation({
  mutationFn: () => api.post<MemberIssue>('/identity/member', { team_slug: teamSlug.value }),
  onSuccess: ({ token }) => {
    auth.save({ token })
    returnToOrigin()
  },
})

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

onMounted(() => {
  if (reason.value === 'missing' && !invalid.value) receive.mutate()
})
</script>

<template>
  <main class="callback-page">
    <section class="callback-card" :aria-busy="receive.isPending.value">
      <template v-if="invalid">
        <AlertTriangle class="status-icon warning" :size="30" aria-hidden="true" />
        <p class="eyebrow">身份错误</p>
        <h1>无法确定要进入的团队</h1>
        <p class="description">回调地址缺少有效的团队标识。你的当前身份没有发生变化。</p>
        <LsButton @click="returnToOrigin">返回</LsButton>
      </template>

      <template v-else-if="reason === 'team_mismatch' && !receive.isPending.value && !receive.isError.value">
        <AlertTriangle class="status-icon warning" :size="30" aria-hidden="true" />
        <p class="eyebrow">确认切换</p>
        <h1>切换到 {{ teamSlug }} 的成员身份？</h1>
        <p class="description">继续将放弃当前实体（Entity）身份，并领取该团队内与你账号关联的有效成员身份。</p>
        <div class="actions">
          <LsButton variant="secondary" @click="returnToOrigin">取消并保留当前身份</LsButton>
          <LsButton autofocus @click="retry">确认切换</LsButton>
        </div>
      </template>

      <template v-else-if="receive.isPending.value">
        <LoaderCircle class="status-icon spinner" :size="30" aria-hidden="true" />
        <p class="eyebrow">身份</p>
        <h1>正在领取成员身份</h1>
        <p class="description">正在验证你在 {{ teamSlug }} 的成员资格，完成后将返回原页面。</p>
      </template>

      <template v-else-if="receive.isError.value">
        <AlertTriangle class="status-icon warning" :size="30" aria-hidden="true" />
        <p class="eyebrow">身份错误</p>
        <h1>暂时无法领取成员身份</h1>
        <p class="description" role="alert">{{ friendlyError(receive.error.value) }}</p>
        <p class="assurance">原实体身份仍然保留，请返回后稍后再次进入。</p>
        <div class="actions">
          <LsButton variant="secondary" @click="returnToOrigin">返回</LsButton>
        </div>
      </template>

      <template v-else>
        <BadgeCheck class="status-icon" :size="30" aria-hidden="true" />
        <p class="eyebrow">身份</p>
        <h1>准备领取成员身份</h1>
      </template>
    </section>
  </main>
</template>

<style scoped>
.callback-page{min-height:100dvh;display:grid;place-items:center;padding:1rem;background:var(--cloud)}.callback-card{width:min(100%,32rem);display:grid;justify-items:start;gap:.8rem;padding:clamp(1.5rem,6vw,2.5rem);background:white;border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 55px color-mix(in oklch,var(--sky-night),transparent 92%)}.status-icon{color:var(--sky-lost-strong)}.warning{color:var(--warning)}.spinner{animation:spin .9s linear infinite}.eyebrow{margin:.35rem 0 0;color:var(--sky-lost-strong);font:700 .72rem/1 'Barlow Condensed',sans-serif;letter-spacing:.12em}.callback-card h1{margin:0;font-size:clamp(1.55rem,6vw,2rem);line-height:1.2}.description,.assurance{margin:0;color:var(--muted-ink);line-height:1.65}.assurance{font-size:.82rem}.actions{width:100%;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.65rem;margin-top:.65rem}.actions>*{min-height:44px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:30rem){.actions{display:grid}.actions>*{width:100%}}@media(prefers-reduced-motion:reduce){.spinner{animation:none}}
</style>
