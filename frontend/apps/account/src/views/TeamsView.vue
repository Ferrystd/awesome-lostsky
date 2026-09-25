<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowRight, LogOut, Plus } from '@lucide/vue'
import { NButton, NModal } from 'naive-ui'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const queryClient = useQueryClient()
const dialog = ref(false)
const displayName = ref('')
const slug = ref('')
const joinCode = ref<{ code: string; expires_at: number } | null>(null)
const now = ref(Date.now())
let joinCodeTimer: ReturnType<typeof setInterval> | undefined
const validJoinCode = computed(() => joinCode.value && joinCode.value.expires_at * 1000 > now.value ? joinCode.value : null)
async function copyJoinCode() {
  if (!validJoinCode.value) return
  try {
    await navigator.clipboard.writeText(validJoinCode.value.code)
    feedback.success('入队码已复制，交给管理员即可加入团队')
  } catch {
    feedback.info('请选中入队码手动复制')
  }
}
const generateJoinCode = useMutation({
  mutationFn: () => {
    joinCode.value = null
    return api.post<{ code: string; expires_at: number }>('/team/join-code', {})
  },
  onSuccess: (result) => {
    joinCode.value = result
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
onMounted(() => {
  generateJoinCode.mutate()
  joinCodeTimer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => clearInterval(joinCodeTimer))
watch(validJoinCode, (value, previous) => {
  if (!value && previous && !generateJoinCode.isPending.value) generateJoinCode.mutate()
})
const query = useQuery({ queryKey: ['account-teams'], queryFn: () => api.get<Record<string, unknown>[]>('/team/index') })
const createTeam = useMutation({
  mutationFn: () => api.post<Record<string, unknown>>('/team/add', { display_name: displayName.value.trim(), slug: slug.value.trim().toLowerCase() }),
  onSuccess: async (team) => {
    await queryClient.invalidateQueries({ queryKey: ['account-teams'] })
    dialog.value = false
    displayName.value = ''
    slug.value = ''
    open(team)
  },
})

function open(team: Record<string, unknown>) {
  const teamSlug = String(team.slug ?? '')
  location.href = teamSlug ? `//${teamSlug}.team.lostsky.work/` : '//team.lostsky.work/'
}
async function logout() { try { await api.post('/devices/quit', {}) } catch { /* local logout still continues */ } auth.clear(); router.replace('/login') }
function submit() { if (displayName.value.trim() && slug.value.trim()) createTeam.mutate() }
</script>

<template>
  <main class="teams">
    <header>
      <div class="wordmark">LostSky <span>失落青空</span></div>
      <NButton quaternary @click="logout"><template #icon><LogOut :size="18" /></template>退出</NButton>
    </header>
    <section class="teams-main">
      <div class="title">
        <div><p>工作空间</p><h1>选择要进入的团队</h1></div>
        <LsPagePrimaryAction :icon="Plus" label="新建团队" @click="dialog = true" />
      </div>
      <p class="join-code" aria-live="polite">
        <NButton text :disabled="generateJoinCode.isPending.value" :aria-label="validJoinCode ? '复制入队码' : '生成入队码'" @click="validJoinCode ? copyJoinCode() : generateJoinCode.mutate()">入队码：<span class="join-code-value">{{ validJoinCode?.code ?? (generateJoinCode.isPending.value ? '生成中' : '暂不可用，点击生成') }}</span></NButton>
      </p>
      <p v-if="query.isError.value" class="state error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <div v-else-if="query.isPending.value" class="team-list" aria-label="正在加载"><div v-for="i in 3" :key="i" class="skeleton" /></div>
      <LsEmptyState v-else-if="!query.data.value?.length" title="还没有工作空间" description="创建一个团队，或等待管理员邀请你加入。" />
      <div v-else class="team-list">
        <article v-for="team in query.data.value" :key="String(team.id)"><NButton quaternary class="team-entry" @click="open(team)">
          <LsEntityIdentity type="team" :name="String(team.display_name || team.name || '未命名团队')" :slug="String(team.slug || '')" fallback="initial" />
          <ArrowRight :size="20" />
        </NButton></article>
      </div>
    </section>
    <NModal v-model:show="dialog" preset="card" class="team-dialog" title="新建团队">
      <form @submit.prevent="submit">
        <p class="dialog-intro">建立新的天空坐标</p>
        <LsField label="团队名称" for-id="team-name" required><LsInput id="team-name" v-model="displayName" autocomplete="organization" placeholder="例如：失落青空工作室" required /></LsField>
        <LsField label="团队标识" for-id="team-slug" hint="字母开头，仅使用字母、数字、下划线和连字符。" required><LsInput id="team-slug" v-model="slug" autocomplete="off" pattern="[A-Za-z][A-Za-z0-9_-]+" minlength="2" maxlength="50" placeholder="lostsky" required /></LsField>
        <p v-if="createTeam.isError.value" class="dialog-error" role="alert">{{ friendlyError(createTeam.error.value) }}</p>
        <div class="dialog-actions"><LsButton type="button" variant="secondary" @click="dialog = false">取消</LsButton><LsButton type="submit" :loading="createTeam.isPending.value">创建并进入</LsButton></div>
      </form>
    </NModal>
  </main>
</template>

<style scoped>
.join-code { margin: 12px 0 0; color: var(--muted-ink); font-size: 0.8125rem; }
.join-code > .n-button { min-height: 44px; }
.join-code-value { color: var(--ink); user-select: all; overflow-wrap: anywhere; }
.teams{min-height:100dvh;background:var(--cloud)}header{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;background:white;border-bottom:1px solid var(--line)}.wordmark{font-family:'Barlow Condensed';font-size:1.4rem;font-weight:700}.wordmark span{margin-left:.4rem;color:var(--muted-ink);font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:.7rem;font-weight:500}.teams-main{width:min(100% - 2rem,60rem);margin:auto;padding:2.5rem 0}.title{display:flex;flex-direction:column;gap:1rem}.title p{margin:0;color:var(--sky-lost-strong);font-size:.8rem;font-weight:750}.title h1{margin:.25rem 0 0;font-size:1.8rem}.team-list{display:grid;overflow:hidden;margin-top:2rem;background:white;border:1px solid var(--line);border-radius:12px}.team-list>article{border-bottom:1px solid var(--line)}.team-list>article:last-child{border-bottom:0}.team-entry{width:100%;min-height:82px;justify-content:stretch;padding:1rem;text-align:left}.team-entry:hover{background:var(--cloud)}.team-entry :deep(.n-button__content){width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem}.state{margin-top:2rem;padding:4rem 1rem;text-align:center;background:white;border:1px solid var(--line);border-radius:12px}.state svg{color:var(--sky-lost-strong)}.state h2{font-size:1.15rem}.state p{color:var(--muted-ink)}.error,.dialog-error{color:var(--danger)}.skeleton{height:82px;background:linear-gradient(90deg,var(--line),white,var(--line));background-size:200%;animation:shimmer 1.3s infinite}@keyframes shimmer{to{background-position:-200%}}.team-dialog form{display:grid;gap:1rem}.dialog-intro{margin:0;color:var(--sky-lost-strong);font-size:.8rem;font-weight:700}.dialog-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.5rem}.dialog-error{margin:0;font-size:.88rem}@media(min-width:640px){.title{flex-direction:row;align-items:end;justify-content:space-between}.teams-main{padding-top:4rem}}@media(prefers-reduced-motion:reduce){.skeleton{animation:none}}
</style>
