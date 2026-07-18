<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowRight, LogOut, Plus, Trash2, Users } from '@lucide/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const queryClient = useQueryClient()
const dialog = ref<HTMLDialogElement | null>(null)
const displayName = ref('')
const slug = ref('')
const query = useQuery({ queryKey: ['account-teams'], queryFn: () => api.get<Record<string, unknown>[]>('/team/index') })
const createTeam = useMutation({
  mutationFn: () => api.post<Record<string, unknown>>('/team/add', { display_name: displayName.value.trim(), slug: slug.value.trim().toLowerCase() }),
  onSuccess: async (team) => {
    await queryClient.invalidateQueries({ queryKey: ['account-teams'] })
    dialog.value?.close()
    displayName.value = ''
    slug.value = ''
    open(team)
  },
})
const deleteTeam = useMutation({ mutationFn: (id: number) => api.post('/team/delete', { team_id: id }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-teams'] }) })

function open(team: Record<string, unknown>) {
  const teamSlug = String(team.slug ?? '')
  location.href = teamSlug ? `//${teamSlug}.team.lostsky.work/` : '//team.lostsky.work/'
}
async function logout() { try { await api.post('/devices/quit', {}) } catch { /* local logout still continues */ } auth.clear(); router.replace('/login') }
function submit() { if (displayName.value.trim() && slug.value.trim()) createTeam.mutate() }
function remove(team: Record<string, unknown>) { if (window.confirm(`确认解散“${team.display_name ?? team.name ?? '这个团队'}”？`)) deleteTeam.mutate(Number(team.id)) }
</script>

<template>
  <main class="teams">
    <header>
      <div class="wordmark">LostSky <span>失落青空</span></div>
      <button type="button" @click="logout"><LogOut :size="18" />退出</button>
    </header>
    <section class="teams-main">
      <div class="title">
        <div><p>工作空间</p><h1>选择要进入的团队</h1></div>
        <button type="button" @click="dialog?.showModal()"><Plus :size="18" />新建团队</button>
      </div>
      <p v-if="query.isError.value" class="state error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <div v-else-if="query.isPending.value" class="team-list" aria-label="正在加载"><div v-for="i in 3" :key="i" class="skeleton" /></div>
      <div v-else-if="!query.data.value?.length" class="state"><Users :size="30" /><h2>还没有工作空间</h2><p>创建一个团队，或等待管理员邀请你加入。</p></div>
      <div v-else class="team-list">
        <article v-for="team in query.data.value" :key="String(team.id)"><button type="button" @click="open(team)">
          <span class="team-mark">{{ String(team.display_name ?? team.name ?? '团').slice(0, 1) }}</span>
          <span><strong>{{ team.display_name || team.name || '未命名团队' }}</strong><small>{{ team.slug || team.type || '工作空间' }}</small></span>
          <ArrowRight :size="20" />
        </button><button v-if="team.is_owner" type="button" class="delete-team" aria-label="解散团队" :disabled="deleteTeam.isPending.value" @click="remove(team)"><Trash2 :size="17" /></button></article>
      </div>
    </section>
    <dialog ref="dialog" @click.self="dialog?.close()">
      <form @submit.prevent="submit">
        <div class="dialog-head"><div><small>建立新的天空坐标</small><h2>新建团队</h2></div><button type="button" aria-label="关闭" @click="dialog?.close()">×</button></div>
        <LsField label="团队名称" for-id="team-name" required><LsInput id="team-name" v-model="displayName" autocomplete="organization" placeholder="例如：失落青空工作室" required /></LsField>
        <LsField label="团队标识" for-id="team-slug" hint="字母开头，仅使用字母、数字、下划线和连字符。" required><LsInput id="team-slug" v-model="slug" autocomplete="off" pattern="[A-Za-z][A-Za-z0-9_-]+" minlength="2" maxlength="50" placeholder="lostsky" required /></LsField>
        <p v-if="createTeam.isError.value" class="dialog-error" role="alert">{{ friendlyError(createTeam.error.value) }}</p>
        <div class="dialog-actions"><LsButton type="button" variant="secondary" @click="dialog?.close()">取消</LsButton><LsButton type="submit" :loading="createTeam.isPending.value">创建并进入</LsButton></div>
      </form>
    </dialog>
  </main>
</template>

<style scoped>
.teams{min-height:100dvh;background:var(--cloud)}header{height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;background:white;border-bottom:1px solid var(--line)}.wordmark{font-family:'Barlow Condensed';font-size:1.4rem;font-weight:700}.wordmark span{margin-left:.4rem;color:var(--muted-ink);font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:.7rem;font-weight:500}header button,.title button{min-height:44px;display:inline-flex;align-items:center;gap:.45rem;border:0;border-radius:8px;cursor:pointer}header button{color:var(--muted-ink);background:transparent}.teams-main{width:min(100% - 2rem,60rem);margin:auto;padding:2.5rem 0}.title{display:flex;flex-direction:column;gap:1rem}.title p{margin:0;color:var(--sky-lost-strong);font-size:.8rem;font-weight:750}.title h1{margin:.25rem 0 0;font-size:1.8rem}.title button{align-self:flex-start;padding:0 1rem;color:white;background:var(--sky-lost-strong);font-weight:680}.team-list{display:grid;gap:.75rem;margin-top:2rem}.team-list>article{position:relative}.team-list article>button:first-child{width:100%;min-height:82px;display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:1rem;padding:1rem 3.5rem 1rem 1rem;text-align:left;background:white;border:1px solid var(--line);border-radius:10px;cursor:pointer}.team-list article>button:first-child:hover{border-color:var(--sky-lost)}.delete-team{position:absolute;right:.35rem;top:50%;width:44px;height:44px;display:grid;place-items:center;color:var(--danger);background:transparent;border:0;border-radius:7px;transform:translateY(-50%)}.delete-team:hover{background:color-mix(in oklch,var(--danger),white 92%)}.team-mark{width:48px;height:48px;display:grid;place-items:center;color:white;background:var(--sky-lost-strong);border-radius:9px;font-weight:750}.team-list strong,.team-list small{display:block}.team-list small{margin-top:.2rem;color:var(--muted-ink)}.state{margin-top:2rem;padding:4rem 1rem;text-align:center;background:white;border:1px solid var(--line);border-radius:12px}.state svg{color:var(--sky-lost-strong)}.state h2{font-size:1.15rem}.state p{color:var(--muted-ink)}.error,.dialog-error{color:var(--danger)}.skeleton{height:82px;border-radius:10px;background:linear-gradient(90deg,var(--line),white,var(--line));background-size:200%;animation:shimmer 1.3s infinite}@keyframes shimmer{to{background-position:-200%}}dialog{width:min(92vw,30rem);padding:0;border:0;border-radius:12px;box-shadow:0 12px 32px oklch(.1 0 0/.28)}dialog::backdrop{background:oklch(.06 0 0/.64)}dialog form{display:grid;gap:1rem;padding:1.25rem}.dialog-head,.dialog-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}.dialog-head small{color:var(--sky-lost-strong);font-weight:700}.dialog-head h2{margin:.2rem 0 0}.dialog-head>button{width:44px;height:44px;background:transparent;border:0;font-size:1.5rem}.dialog-actions{justify-content:flex-end;margin-top:.5rem}.dialog-error{margin:0;font-size:.88rem}@media(min-width:640px){.title{flex-direction:row;align-items:end;justify-content:space-between}.title button{align-self:auto}.teams-main{padding-top:4rem}}@media(prefers-reduced-motion:reduce){.skeleton{animation:none}}
</style>
