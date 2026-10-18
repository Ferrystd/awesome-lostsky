<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsDirectoryIdentity from '@lostsky/ui/components/LsDirectoryIdentity.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { LogOut, Plus } from '@lucide/vue'
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
      <LsObjectDirectory title="我的团队" description="选择要进入的团队">
        <template #actions><NButton text @click="dialog = true"><template #icon><Plus :size="18" /></template>新建团队</NButton></template>
      <template #toolbar><LsListToolbar embedded :searchable="false" :count-label="`${query.data.value?.length ?? 0} 个团队`">
        <template #actions>
      <p class="join-code" aria-live="polite">
        <NButton text :disabled="generateJoinCode.isPending.value" :aria-label="validJoinCode ? '复制入队码' : '生成入队码'" @click="validJoinCode ? copyJoinCode() : generateJoinCode.mutate()">入队码：<span class="join-code-value">{{ validJoinCode?.code ?? (generateJoinCode.isPending.value ? '生成中' : '暂不可用，点击生成') }}</span></NButton>
      </p>
        </template>
      </LsListToolbar></template>
      <p v-if="query.isError.value" class="state error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="3" />
      <LsEmptyState v-else-if="!query.data.value?.length" title="还没有工作空间" description="创建一个团队，或等待管理员邀请你加入。" />
      <LsResourceList v-else aria-label="我的团队">
        <LsResourceRow v-for="team in query.data.value" :key="String(team.id)">
          <template #identity>
            <a class="team-entry" :href="team.slug ? `//${String(team.slug)}.team.lostsky.work/` : '//team.lostsky.work/'">
              <LsDirectoryIdentity type="team" :name="String(team.display_name || team.name || '未命名团队')" :slug="String(team.slug || '')" />
            </a>
          </template>
        </LsResourceRow>
      </LsResourceList>
      </LsObjectDirectory>
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
.teams { min-height: 100dvh; background: var(--cloud); }
.teams > header { height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; background: var(--surface); border-bottom: 1px solid var(--line); }
.wordmark { font-family: 'Barlow Condensed'; font-size: 1.4rem; font-weight: 700; }
.wordmark span { margin-left: .4rem; color: var(--muted-ink); font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: .7rem; font-weight: 500; }
.teams-main { width: min(100% - 2rem, 64rem); margin: auto; padding: 2.5rem 0; }
.join-code { margin: 0; color: var(--muted-ink); font-size: .8125rem; }
.join-code > .n-button { min-height: 44px; }
.join-code-value { color: var(--ink); user-select: all; overflow-wrap: anywhere; }
.team-entry { display: block; min-width: 0; color: inherit; text-decoration: none; }
.team-entry:focus-visible { outline: 2px solid var(--sky-lost-strong); outline-offset: 4px; border-radius: var(--radius-sm); }
.state.error, .dialog-error { color: var(--danger); }
.team-dialog form { display: grid; gap: 1rem; }
.dialog-intro { margin: 0; color: var(--sky-lost-strong); font-size: .8rem; font-weight: 700; }
.dialog-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
.dialog-error { margin: 0; font-size: .88rem; }
</style>
