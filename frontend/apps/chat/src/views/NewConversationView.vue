<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ArrowLeft, MessageCircleMore } from '@lucide/vue'
import { NCheckbox, NDatePicker, NInput, NRadioButton, NRadioGroup, NSelect } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'

interface Actor extends EntityDisplay {
  type: 'entity' | 'customer' | 'team' | 'virtual'
  can_act: boolean
}
interface Conversation { participants: Actor[] }
interface Created { uuid: string; existing: boolean }

const kind = ref<'direct' | 'group'>('direct')
const actorSlug = ref(localStorage.getItem('lostsky_chat_actor') ?? '')
const participants = ref<EntityDisplay[]>([])
const title = ref('')
const temporary = ref(false)
const expiresAt = ref<number | null>(null)
const requestedParticipant = new URLSearchParams(location.search).get('participant')?.toLowerCase() ?? ''
const actorsQuery = useQuery({ queryKey: ['chat-actors'], queryFn: () => api.get<Actor[]>('/actor') })
const conversationsQuery = useQuery({ queryKey: ['chat-conversations'], queryFn: () => api.get<Conversation[]>('/conversation') })
const actors = computed(() => actorsQuery.data.value ?? [])
const actorOptions = computed(() => actors.value.filter(item => item.can_act).map(item => ({ label: `${item.name} · @${item.slug}`, value: item.slug })))
const participantCandidates = computed(() => actors.value.filter(item => item.slug !== actorSlug.value))
const recentParticipants = computed(() => {
  const seen = new Set<string>()
  return (conversationsQuery.data.value ?? []).flatMap(conversation => conversation.participants)
    .filter(item => item.slug !== actorSlug.value && participantCandidates.value.some(candidate => candidate.slug === item.slug))
    .filter(item => !seen.has(item.slug) && Boolean(seen.add(item.slug)))
    .slice(0, 6)
})
watch(actorOptions, options => {
  if (!options.some(item => item.value === actorSlug.value)) actorSlug.value = options[0]?.value ?? ''
}, { immediate: true })
watch(kind, value => {
  participants.value = value === 'direct' ? participants.value.slice(0, 1) : participants.value
})
watch(actorSlug, slug => {
  participants.value = participants.value.filter(participant => participant.slug !== slug)
})
watch(participantCandidates, candidates => {
  if (participants.value.length || !requestedParticipant) return
  const requested = candidates.find(candidate => candidate.slug === requestedParticipant)
  if (requested) participants.value = [requested]
}, { immediate: true })
const create = useMutation({
  mutationFn: () => api.post<Created>('/conversation/create', {
    kind: kind.value,
    title: kind.value === 'group' ? title.value : null,
    actor_slug: actorSlug.value,
    participants: participants.value.map(participant => participant.slug),
    is_temporary: temporary.value ? 1 : 0,
    expires_at: expiresAt.value ? Math.floor(expiresAt.value / 1000) : null,
  }),
  onSuccess: data => {
    localStorage.setItem('lostsky_chat_actor', actorSlug.value)
    location.href = `/?conversation=${encodeURIComponent(data.uuid)}`
  },
})
const valid = computed(() => Boolean(actorSlug.value)
  && participants.value.length >= 1
  && (kind.value === 'group' || participants.value.length === 1))
</script>

<template>
    <main class="task-page">
      <a class="back" href="/"><ArrowLeft :size="18" />返回消息</a>
      <header><span><MessageCircleMore /></span><p>NEW CONVERSATION</p><h1>创建会话</h1><small>选择你要使用的身份，并邀请成员、客户或虚拟实体参与。</small></header>
      <form @submit.prevent="create.mutate()">
        <label>会话形式<NRadioGroup v-model:value="kind"><NRadioButton value="direct">单聊</NRadioButton><NRadioButton value="group">群聊</NRadioButton></NRadioGroup></label>
        <label>你的身份<NSelect v-model:value="actorSlug" :options="actorOptions" placeholder="选择可操作身份" /></label>
        <label>{{ kind === 'direct' ? '聊天对象' : '参与者' }}
          <LsEntityInput v-model="participants" :candidates="participantCandidates" :recent="recentParticipants" :multiple="kind === 'group'" placeholder="输入 slug 搜索" @chat="kind = 'direct'" />
        </label>
        <label v-if="kind === 'group'">群聊名称<NInput v-model:value="title" maxlength="100" placeholder="可选" /></label>
        <label class="check"><NCheckbox v-model:checked="temporary">临时会话</NCheckbox><small>临时会话可以重复创建，并可设置自动关闭时间。</small></label>
        <label v-if="temporary">到期时间<NDatePicker v-model:value="expiresAt" type="datetime" clearable /></label>
        <p v-if="actorsQuery.isError.value || conversationsQuery.isError.value || create.isError.value" class="error" role="alert">{{ friendlyError(actorsQuery.error.value || conversationsQuery.error.value || create.error.value) }}</p>
        <LsButton type="submit" size="lg" :disabled="!valid" :loading="create.isPending.value">创建会话</LsButton>
      </form>
    </main>
</template>

<style scoped>
.task-page{width:min(100% - 2rem,42rem);margin:0 auto;padding:2rem 0 4rem;display:grid;gap:1.5rem}.back{width:fit-content;min-height:44px;display:flex;align-items:center;gap:.4rem;color:var(--sky-lost-strong);font-weight:650}.task-page>header{text-align:center;display:grid;justify-items:center;gap:.45rem}.task-page>header>span{width:58px;height:58px;display:grid;place-items:center;color:white;background:var(--sky-night);border-radius:17px}.task-page header p,.task-page header h1,.task-page header small{margin:0}.task-page header p{color:var(--sky-lost-strong);font:700 .7rem/1 'Barlow Condensed',sans-serif;letter-spacing:.12em}.task-page header h1{font-size:2rem}.task-page header small{max-width:34rem;color:var(--muted-ink);font-size:.84rem}form{display:grid;gap:1rem;padding:clamp(1rem,4vw,1.75rem);background:white;border:1px solid var(--line);border-radius:14px}form>label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}.check{padding:.85rem;background:var(--cloud);border-radius:10px}.check small{color:var(--muted-ink);font-weight:400}.error{margin:0;padding:.65rem;color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%);border-radius:8px;font-size:.8rem}
</style>
