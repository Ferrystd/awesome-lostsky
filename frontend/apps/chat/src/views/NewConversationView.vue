<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ArrowLeft, MessageCircleMore } from '@lucide/vue'
import { NCheckbox, NConfigProvider, NDatePicker, NInput, NRadioButton, NRadioGroup, NSelect } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'

interface Actor {
  type: 'member' | 'customer' | 'virtual'
  slug: string
  name: string
  can_act: boolean
}
interface Created { uuid: string; existing: boolean }

const kind = ref<'direct' | 'group'>('direct')
const actorSlug = ref(localStorage.getItem('lostsky_chat_actor') ?? '')
const participants = ref<string | string[]>('')
const title = ref('')
const temporary = ref(false)
const expiresAt = ref<number | null>(null)
const actorsQuery = useQuery({ queryKey: ['chat-actors'], queryFn: () => api.get<Actor[]>('/actor') })
const actors = computed(() => actorsQuery.data.value ?? [])
const actorOptions = computed(() => actors.value.filter(item => item.can_act).map(item => ({ label: `${item.name} · @${item.slug}`, value: item.slug })))
const participantOptions = computed(() => actors.value.filter(item => item.slug !== actorSlug.value).map(item => ({ label: `${item.name} · @${item.slug}`, value: item.slug })))
const selectedParticipants = computed(() => Array.isArray(participants.value)
  ? participants.value
  : participants.value
    ? [participants.value]
    : [])
watch(actorOptions, options => {
  if (!options.some(item => item.value === actorSlug.value)) actorSlug.value = options[0]?.value ?? ''
}, { immediate: true })
watch(kind, value => {
  participants.value = value === 'direct'
    ? selectedParticipants.value[0] ?? ''
    : selectedParticipants.value
})
watch(actorSlug, slug => {
  const available = selectedParticipants.value.filter(participant => participant !== slug)
  participants.value = kind.value === 'direct' ? available[0] ?? '' : available
})
const create = useMutation({
  mutationFn: () => api.post<Created>('/conversation/create', {
    kind: kind.value,
    title: kind.value === 'group' ? title.value : null,
    actor_slug: actorSlug.value,
    participants: selectedParticipants.value,
    is_temporary: temporary.value ? 1 : 0,
    expires_at: expiresAt.value ? Math.floor(expiresAt.value / 1000) : null,
  }),
  onSuccess: data => {
    localStorage.setItem('lostsky_chat_actor', actorSlug.value)
    location.href = `/?conversation=${encodeURIComponent(data.uuid)}`
  },
})
const valid = computed(() => Boolean(actorSlug.value)
  && selectedParticipants.value.length >= 1
  && (kind.value === 'group' || selectedParticipants.value.length === 1))
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme">
    <main class="task-page">
      <a class="back" href="/"><ArrowLeft :size="18" />返回消息</a>
      <header><span><MessageCircleMore /></span><p>NEW CONVERSATION</p><h1>创建会话</h1><small>选择你要使用的身份，并邀请成员、客户或虚拟实体参与。</small></header>
      <form @submit.prevent="create.mutate()">
        <label>会话形式<NRadioGroup v-model:value="kind"><NRadioButton value="direct">单聊</NRadioButton><NRadioButton value="group">群聊</NRadioButton></NRadioGroup></label>
        <label>你的身份<NSelect v-model:value="actorSlug" :options="actorOptions" placeholder="选择可操作身份" /></label>
        <label>{{ kind === 'direct' ? '聊天对象' : '参与者' }}<NSelect v-model:value="participants" :options="participantOptions" filterable :multiple="kind === 'group'" :max-tag-count="3" placeholder="按名称或 slug 搜索" /></label>
        <label v-if="kind === 'group'">群聊名称<NInput v-model:value="title" maxlength="100" placeholder="可选" /></label>
        <label class="check"><NCheckbox v-model:checked="temporary">临时会话</NCheckbox><small>临时会话可以重复创建，并可设置自动关闭时间。</small></label>
        <label v-if="temporary">到期时间<NDatePicker v-model:value="expiresAt" type="datetime" clearable /></label>
        <p v-if="actorsQuery.isError.value || create.isError.value" class="error" role="alert">{{ friendlyError(actorsQuery.error.value || create.error.value) }}</p>
        <button type="submit" :disabled="!valid || create.isPending.value">{{ create.isPending.value ? '正在创建…' : '创建会话' }}</button>
      </form>
    </main>
  </NConfigProvider>
</template>

<style scoped>
.task-page{width:min(100% - 2rem,42rem);margin:0 auto;padding:2rem 0 4rem;display:grid;gap:1.5rem}.back{width:fit-content;min-height:44px;display:flex;align-items:center;gap:.4rem;color:var(--sky-lost-strong);font-weight:650}.task-page>header{text-align:center;display:grid;justify-items:center;gap:.45rem}.task-page>header>span{width:58px;height:58px;display:grid;place-items:center;color:white;background:var(--sky-night);border-radius:17px}.task-page header p,.task-page header h1,.task-page header small{margin:0}.task-page header p{color:var(--sky-lost-strong);font:700 .7rem/1 'Barlow Condensed',sans-serif;letter-spacing:.12em}.task-page header h1{font-size:2rem}.task-page header small{max-width:34rem;color:var(--muted-ink);font-size:.84rem}form{display:grid;gap:1rem;padding:clamp(1rem,4vw,1.75rem);background:white;border:1px solid var(--line);border-radius:14px}form>label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}.check{padding:.85rem;background:var(--cloud);border-radius:10px}.check small{color:var(--muted-ink);font-weight:400}form>button{min-height:46px;color:white;background:var(--sky-lost-strong);border:0;border-radius:10px;font-weight:700}form>button:disabled{opacity:.5}.error{margin:0;padding:.65rem;color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%);border-radius:8px;font-size:.8rem}
</style>
