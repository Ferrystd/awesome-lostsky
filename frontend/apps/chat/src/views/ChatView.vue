<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, Bot, Building2, CheckCheck, CircleX, MessageCircleMore, Plus, Reply, Send, Settings2, UserRound, Users } from '@lucide/vue'
import { NConfigProvider, NInput, NSelect } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { loadCentrifuge, type CentrifugeClient, type Subscription } from '../lib/centrifuge'

interface Actor {
  type: 'entity' | 'customer' | 'team' | 'virtual'
  slug: string
  name: string
  avatar: string | null
  can_act: boolean
}
interface Participant extends Actor {
  joined_at: number
  left_at: number | null
  last_read_message_id: number | null
}
interface Conversation {
  uuid: string
  kind: 'direct' | 'group'
  title: string | null
  is_temporary: boolean
  is_closed: boolean
  expires_at: number | null
  last_message_at: number | null
  last_message: string | null
  participants: Participant[]
}
interface Message {
  id: number
  conversation: string
  sender: Actor
  content: string | null
  reply_id: number | null
  edited_at: number | null
  revoked_at: number | null
  create_time: number
}
interface RealtimeToken { token: string; url?: string; channel?: string }

const queryClient = useQueryClient()
const activeUuid = ref(new URLSearchParams(location.search).get('conversation') ?? '')
const actingSlug = ref(localStorage.getItem('lostsky_chat_actor') ?? '')
const content = ref('')
const replyTo = ref<Message | null>(null)
const realtimeState = ref<'connecting' | 'live' | 'polling'>('connecting')
const messageList = ref<HTMLElement | null>(null)
let realtimeClient: CentrifugeClient | null = null
let realtimeSubscription: Subscription | null = null
let pollTimer = 0

const conversationsQuery = useQuery({
  queryKey: ['chat-conversations'],
  queryFn: () => api.get<Conversation[]>('/conversation'),
})
const actorsQuery = useQuery({ queryKey: ['chat-actors'], queryFn: () => api.get<Actor[]>('/actor') })
const conversations = computed(() => conversationsQuery.data.value ?? [])
const actors = computed(() => actorsQuery.data.value ?? [])
const active = computed(() => conversations.value.find(item => item.uuid === activeUuid.value) ?? null)
const usableActors = computed(() => actors.value.filter(actor => actor.can_act))
const activeActors = computed(() => {
  if (!active.value) return usableActors.value
  const participantSlugs = new Set(active.value.participants
    .filter(participant => !participant.left_at)
    .map(participant => participant.slug))
  return usableActors.value.filter(actor => participantSlugs.has(actor.slug))
})
const usableActorOptions = computed(() => activeActors.value.map(actor => ({
  label: `${actor.name} · @${actor.slug}`,
  value: actor.slug,
})))
const messagesQuery = useQuery({
  queryKey: computed(() => ['chat-messages', activeUuid.value]),
  queryFn: () => api.get<Message[]>('/message', { conversation: activeUuid.value, limit: 100 }),
  enabled: computed(() => Boolean(activeUuid.value)),
})
const messages = computed(() => messagesQuery.data.value ?? [])
const activeIdentity = computed(() => actors.value.find(actor => actor.slug === actingSlug.value) ?? null)
const teamSlug = location.hostname.split('.')[0] || 'team'

watch(conversations, items => {
  if (activeUuid.value && items.some(item => item.uuid === activeUuid.value)) return
  const requested = new URLSearchParams(location.search).get('conversation')
  activeUuid.value = items.find(item => item.uuid === requested)?.uuid ?? items[0]?.uuid ?? ''
}, { immediate: true })
watch(activeActors, items => {
  if (items.some(actor => actor.slug === actingSlug.value)) return
  actingSlug.value = items[0]?.slug ?? ''
}, { immediate: true })
watch(actingSlug, slug => {
  if (slug) localStorage.setItem('lostsky_chat_actor', slug)
})
watch(messages, async items => {
  await nextTick()
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight })
  const last = items.at(-1)
  if (last && actingSlug.value) {
    api.post('/message/read', {
      conversation: activeUuid.value,
      actor_slug: actingSlug.value,
      message_id: last.id,
    }).catch(() => undefined)
  }
})
watch(activeUuid, uuid => {
  const url = new URL(location.href)
  if (uuid) url.searchParams.set('conversation', uuid)
  else url.searchParams.delete('conversation')
  history.replaceState(null, '', `${url.pathname}${url.search}`)
  subscribeRealtime(uuid)
})

const sendMessage = useMutation({
  mutationFn: () => api.post<Message>('/message/send', {
    conversation: activeUuid.value,
    actor_slug: actingSlug.value,
    content: content.value,
    reply_id: replyTo.value?.id ?? null,
  }),
  onSuccess: async message => {
    content.value = ''
    replyTo.value = null
    queryClient.setQueryData<Message[]>(['chat-messages', activeUuid.value], current => [
      ...(current ?? []).filter(item => item.id !== message.id),
      message,
    ])
    await queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
  },
})
const closeConversation = useMutation({
  mutationFn: () => api.post('/conversation/close', { uuid: activeUuid.value }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }),
})

function conversationName(conversation: Conversation) {
  if (conversation.title) return conversation.title
  const others = conversation.participants.filter(item => item.slug !== actingSlug.value && !item.left_at)
  return others.map(item => item.name).join('、') || '会话'
}
function actorIcon(type: Actor['type']) {
  return type === 'virtual' ? Bot : type === 'customer' ? UserRound : type === 'team' ? Building2 : Users
}
function time(value: number | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(value * 1000)
}
function dayTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(value * 1000)
}
function submit() {
  if (!content.value.trim() || !activeUuid.value || !actingSlug.value || sendMessage.isPending.value) return
  sendMessage.mutate()
}
async function edit(message: Message) {
  const next = prompt('编辑消息', message.content ?? '')
  if (!next?.trim()) return
  await api.post('/message/edit', { message_id: message.id, content: next })
  await queryClient.invalidateQueries({ queryKey: ['chat-messages', activeUuid.value] })
}
async function revoke(message: Message) {
  if (!confirm('确认撤回这条消息？')) return
  await api.post('/message/revoke', { message_id: message.id })
  await queryClient.invalidateQueries({ queryKey: ['chat-messages', activeUuid.value] })
}
function selectConversation(uuid: string) {
  activeUuid.value = uuid
}
function goBack() {
  activeUuid.value = ''
}
function closeActiveConversation() {
  if (active.value?.is_closed || !confirm('关闭后将不能继续发送消息，确认关闭这段会话？')) return
  closeConversation.mutate()
}
async function refreshConversation() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['chat-messages', activeUuid.value] }),
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }),
  ])
}
async function ensureRealtimeClient() {
  if (realtimeClient) return realtimeClient
  const Ctor = await loadCentrifuge()
  const initial = await api.post<RealtimeToken>('/realtime/connect')
  realtimeClient = new Ctor(String(initial.url), {
    token: initial.token,
    getToken: async () => (await api.post<RealtimeToken>('/realtime/connect')).token,
  })
  realtimeClient.connect()
  return realtimeClient
}
async function subscribeRealtime(uuid: string) {
  realtimeSubscription?.unsubscribe()
  realtimeSubscription = null
  if (!uuid) return
  realtimeState.value = 'connecting'
  try {
    const client = await ensureRealtimeClient()
    const initial = await api.post<RealtimeToken>('/realtime/subscribe', { conversation: uuid })
    realtimeSubscription = client.newSubscription(String(initial.channel), {
      token: initial.token,
      getToken: async () => (await api.post<RealtimeToken>('/realtime/subscribe', { conversation: uuid })).token,
    })
      .on('publication', refreshConversation)
      .on('subscribed', () => { realtimeState.value = 'live' })
      .on('unsubscribed', () => { realtimeState.value = 'polling' })
      .on('error', () => { realtimeState.value = 'polling' })
    realtimeSubscription.subscribe()
  } catch {
    realtimeState.value = 'polling'
  }
}
onMounted(() => {
  pollTimer = window.setInterval(() => {
    if (activeUuid.value && realtimeState.value !== 'live') refreshConversation()
  }, 10000)
  if (activeUuid.value) subscribeRealtime(activeUuid.value)
})
onUnmounted(() => {
  clearInterval(pollTimer)
  realtimeSubscription?.unsubscribe()
  realtimeClient?.disconnect()
})
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme">
    <main class="chat-app">
      <header class="topbar">
        <a class="brand" href="//chat.lostsky.work"><MessageCircleMore :size="22" /><strong>LostSky Chat</strong></a>
        <span class="team">@{{ teamSlug }}</span>
        <nav>
          <a href="/profile"><UserRound :size="18" />资料</a>
          <a class="new-chat" href="/new"><Plus :size="18" />新会话</a>
        </nav>
      </header>

      <div class="workspace">
        <aside :class="['conversation-pane', { hidden: activeUuid }]">
          <div class="pane-heading">
            <div><p>CONVERSATIONS</p><h1>消息</h1></div>
            <a href="/new" aria-label="创建会话"><Plus /></a>
          </div>
          <p v-if="conversationsQuery.isError.value" class="error" role="alert">{{ friendlyError(conversationsQuery.error.value) }}</p>
          <div v-else-if="conversations.length" class="conversation-list">
            <button v-for="conversation in conversations" :key="conversation.uuid" type="button" :class="{ active: conversation.uuid === activeUuid }" @click="selectConversation(conversation.uuid)">
              <span class="avatar"><component :is="conversation.kind === 'group' ? Users : MessageCircleMore" :size="20" /></span>
              <span>
                <strong>{{ conversationName(conversation) }}</strong>
                <small>{{ conversation.is_temporary ? '临时 · ' : '' }}{{ conversation.last_message || '还没有消息' }}</small>
              </span>
              <time>{{ time(conversation.last_message_at) }}</time>
            </button>
          </div>
          <div v-else class="empty">
            <MessageCircleMore :size="32" />
            <strong>从第一段对话开始</strong>
            <p>创建单聊、群聊或会自动关闭的临时会话。</p>
            <a href="/new">创建会话</a>
          </div>
        </aside>

        <section :class="['message-pane', { visible: activeUuid }]">
          <template v-if="active">
            <header>
              <button class="mobile-back" type="button" aria-label="返回会话列表" @click="goBack"><ArrowLeft /></button>
              <div>
                <h2>{{ conversationName(active) }}</h2>
                <p>{{ active.participants.filter(item => !item.left_at).length }} 位参与者 · <span :class="realtimeState">{{ realtimeState === 'live' ? '实时' : realtimeState === 'polling' ? '定时更新' : '连接中' }}</span></p>
              </div>
              <button v-if="!active.is_closed" type="button" aria-label="关闭会话" :disabled="closeConversation.isPending.value" @click="closeActiveConversation"><CircleX /></button>
            </header>
            <div ref="messageList" class="messages" aria-live="polite">
              <p v-if="messagesQuery.isPending.value" class="timeline-state">正在读取消息…</p>
              <p v-else-if="messagesQuery.isError.value" class="timeline-state error">{{ friendlyError(messagesQuery.error.value) }}</p>
              <article v-for="message in messages" :key="message.id" :class="{ own: message.sender.slug === actingSlug, revoked: message.revoked_at }">
                <span class="sender-avatar"><component :is="actorIcon(message.sender.type)" :size="17" /></span>
                <div>
                  <header><strong>{{ message.sender.name }}</strong><time>{{ dayTime(message.create_time) }}</time></header>
                  <p v-if="message.revoked_at" class="bubble">消息已撤回</p>
                  <p v-else class="bubble">{{ message.content }}</p>
                  <small v-if="message.edited_at">已编辑</small>
                  <footer v-if="!message.revoked_at">
                    <button type="button" @click="replyTo = message"><Reply :size="14" />回复</button>
                    <button v-if="message.sender.slug === actingSlug" type="button" @click="edit(message)">编辑</button>
                    <button v-if="message.sender.slug === actingSlug" type="button" @click="revoke(message)">撤回</button>
                  </footer>
                </div>
              </article>
              <div v-if="!messages.length && !messagesQuery.isPending.value" class="timeline-state">这里还很安静，发一条消息吧。</div>
            </div>
            <form v-if="!active.is_closed" class="composer" @submit.prevent="submit">
              <div v-if="replyTo" class="replying"><span>回复 {{ replyTo.sender.name }}：{{ replyTo.content }}</span><button type="button" @click="replyTo = null">取消</button></div>
              <div class="identity-row">
                <label for="actor">以此身份发送</label>
                <NSelect id="actor" v-model:value="actingSlug" :options="usableActorOptions" size="small" />
              </div>
              <div class="compose-row">
                <NInput v-model:value="content" type="textarea" :autosize="{ minRows: 1, maxRows: 5 }" maxlength="10000" placeholder="输入消息，Enter 发送" @keydown.enter.exact.prevent="submit" />
                <button type="submit" :disabled="!content.trim() || !actingSlug || sendMessage.isPending.value" aria-label="发送消息"><Send :size="20" /></button>
              </div>
              <p v-if="sendMessage.isError.value" class="error" role="alert">{{ friendlyError(sendMessage.error.value) }}</p>
            </form>
            <div v-else class="closed-state">这段会话已经关闭，只能查看历史消息。</div>
          </template>
          <div v-else class="empty center-empty"><MessageCircleMore :size="38" /><strong>选择一段会话</strong><p>消息和实时更新会显示在这里。</p></div>
        </section>

        <aside v-if="active" class="detail-pane">
          <div class="detail-heading"><Settings2 :size="18" /><strong>会话详情</strong></div>
          <section><h3>当前身份</h3><div v-if="activeIdentity" class="identity-card"><component :is="actorIcon(activeIdentity.type)" /><span><strong>{{ activeIdentity.name }}</strong><small>@{{ activeIdentity.slug }}</small></span></div><p v-else class="muted">你还没有可用身份，请先完善资料或联系管理员授权。</p></section>
          <section><h3>参与者</h3><ul><li v-for="participant in active.participants.filter(item => !item.left_at)" :key="participant.slug"><span class="mini-avatar"><component :is="actorIcon(participant.type)" :size="15" /></span><span><strong>{{ participant.name }}</strong><small>@{{ participant.slug }}</small></span><CheckCheck v-if="participant.last_read_message_id" :size="15" aria-label="已读" /></li></ul></section>
          <section v-if="active.is_temporary"><h3>临时会话</h3><p class="muted">{{ active.expires_at ? `将在 ${dayTime(active.expires_at)} 到期` : '由参与者手动关闭' }}</p></section>
        </aside>
      </div>
    </main>
  </NConfigProvider>
</template>

<style scoped>
.chat-app{min-height:100dvh;background:var(--cloud)}.topbar{height:64px;display:flex;align-items:center;gap:1rem;padding:0 1rem;color:white;background:var(--sky-night);border-bottom:1px solid color-mix(in oklch,var(--sky-lost),transparent 75%)}.brand{display:flex;align-items:center;gap:.55rem}.brand strong{font-family:'Barlow Condensed',sans-serif;font-size:1.15rem;letter-spacing:.02em}.team{color:oklch(.72 .02 210);font-size:.78rem}.topbar nav{display:flex;align-items:center;gap:.35rem;margin-left:auto}.topbar nav a{min-height:40px;display:flex;align-items:center;gap:.35rem;padding:0 .65rem;color:oklch(.86 .012 210);border-radius:8px;font-size:.8rem}.topbar nav a:hover{background:color-mix(in oklch,var(--sky-lost),transparent 78%)}.topbar .new-chat{color:var(--sky-night);background:var(--afterglow);font-weight:700}.workspace{height:calc(100dvh - 64px);display:grid;grid-template-columns:minmax(260px,320px) minmax(0,1fr) minmax(230px,280px);overflow:hidden}.conversation-pane,.detail-pane,.message-pane{min-width:0;background:white}.conversation-pane{border-right:1px solid var(--line);overflow:auto}.pane-heading,.message-pane>header{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:1rem;border-bottom:1px solid var(--line)}.pane-heading p,.pane-heading h1,.message-pane h2,.message-pane header p{margin:0}.pane-heading p{color:var(--sky-lost-strong);font:700 .67rem/1 'Barlow Condensed',sans-serif;letter-spacing:.1em}.pane-heading h1{font-size:1.35rem}.pane-heading>a,.message-pane>header>button{width:42px;height:42px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border:0;border-radius:10px}.conversation-list{padding:.55rem}.conversation-list button{width:100%;min-height:76px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:.65rem;padding:.65rem;text-align:left;color:var(--ink);background:transparent;border:1px solid transparent;border-radius:10px}.conversation-list button:hover{background:var(--cloud)}.conversation-list button.active{background:color-mix(in oklch,var(--sky-lost),white 91%);border-color:color-mix(in oklch,var(--sky-lost),white 62%)}.avatar,.sender-avatar,.mini-avatar{display:grid;place-items:center;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 87%);border-radius:10px}.avatar{width:42px;height:42px}.conversation-list strong,.conversation-list small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.conversation-list small{color:var(--muted-ink);font-size:.73rem}.conversation-list time{align-self:start;color:var(--muted-ink);font-size:.68rem}.message-pane{display:grid;grid-template-rows:auto minmax(0,1fr) auto}.message-pane>header{padding-inline:1.1rem}.message-pane>header>div{min-width:0;flex:1}.message-pane h2{font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.message-pane header p{color:var(--muted-ink);font-size:.72rem}.message-pane header .live{color:var(--success)}.message-pane header .polling{color:var(--warning)}.mobile-back{display:none!important}.messages{overflow:auto;padding:1.25rem clamp(.75rem,3vw,2.5rem);scrollbar-gutter:stable}.messages article{display:grid;grid-template-columns:34px minmax(0,34rem);gap:.55rem;margin-bottom:1rem}.messages article.own{grid-template-columns:minmax(0,34rem);justify-content:end}.messages article.own>.sender-avatar{display:none}.sender-avatar{width:34px;height:34px;border-radius:9px}.messages article header{display:flex;align-items:baseline;gap:.5rem}.messages article header strong{font-size:.78rem}.messages article header time,.messages article>div>small{color:var(--muted-ink);font-size:.65rem}.bubble{width:fit-content;margin:.25rem 0 0;padding:.55rem .75rem;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--cloud);border-radius:4px 12px 12px 12px}.own .bubble{margin-left:auto;color:white;background:var(--sky-lost-strong);border-radius:12px 4px 12px 12px}.revoked .bubble{color:var(--muted-ink);background:transparent;border:1px dashed var(--line);font-style:italic}.messages footer{display:flex;gap:.55rem;margin-top:.25rem;opacity:0}.messages article:hover footer,.messages article:focus-within footer{opacity:1}.messages footer button{padding:0;color:var(--muted-ink);background:transparent;border:0;font-size:.68rem}.messages footer button:first-child{display:flex;align-items:center;gap:.2rem}.composer{padding:.75rem 1rem 1rem;border-top:1px solid var(--line);background:white}.identity-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.45rem}.identity-row label{color:var(--muted-ink);font-size:.7rem}.identity-row select{max-width:15rem;color:var(--sky-lost-strong);background:transparent;border:0;font-size:.72rem;font-weight:650}.compose-row{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:end;gap:.55rem}.compose-row>button{width:44px;height:44px;display:grid;place-items:center;color:white;background:var(--sky-lost-strong);border:0;border-radius:10px}.compose-row>button:disabled{opacity:.45}.replying{display:flex;justify-content:space-between;gap:.5rem;padding:.4rem .55rem;margin-bottom:.45rem;color:var(--muted-ink);background:var(--cloud);border-radius:7px;font-size:.72rem}.replying span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.replying button{color:var(--sky-lost-strong);background:transparent;border:0}.detail-pane{border-left:1px solid var(--line);overflow:auto}.detail-heading{height:76px;display:flex;align-items:center;gap:.45rem;padding:1rem;border-bottom:1px solid var(--line)}.detail-pane section{padding:1rem;border-bottom:1px solid var(--line)}.detail-pane h3{margin:0 0 .65rem;color:var(--muted-ink);font-size:.72rem;text-transform:uppercase;letter-spacing:.07em}.identity-card,.detail-pane li{display:flex;align-items:center;gap:.55rem}.identity-card>svg{width:36px;height:36px;padding:8px;color:var(--sky-lost-strong);background:var(--cloud);border-radius:9px}.identity-card span,.detail-pane li>span:nth-child(2){min-width:0;flex:1}.identity-card strong,.identity-card small,.detail-pane li strong,.detail-pane li small{display:block;overflow:hidden;text-overflow:ellipsis}.identity-card small,.detail-pane li small{color:var(--muted-ink);font-size:.7rem}.detail-pane ul{display:grid;gap:.7rem;margin:0;padding:0;list-style:none}.mini-avatar{width:30px;height:30px;border-radius:8px}.detail-pane li>svg{color:var(--sky-lost)}.empty,.timeline-state{padding:2rem;text-align:center;color:var(--muted-ink)}.empty{min-height:240px;display:grid;place-items:center;align-content:center;gap:.45rem}.empty strong{color:var(--ink)}.empty p{max-width:16rem;margin:0}.empty a{margin-top:.4rem;padding:.55rem .8rem;color:white;background:var(--sky-lost-strong);border-radius:8px}.center-empty{height:100%}.error{color:var(--danger)}.muted{margin:0;color:var(--muted-ink);font-size:.8rem}
.identity-row :deep(.n-select){width:15rem;max-width:100%}
.closed-state{padding:1rem;text-align:center;color:var(--muted-ink);background:var(--cloud);border-top:1px solid var(--line);font-size:.8rem}
@media(max-width:1050px){.workspace{grid-template-columns:minmax(250px,310px) minmax(0,1fr)}.detail-pane{display:none}}
@media(max-width:720px){.topbar{height:58px}.team{display:none}.topbar nav a:first-child{font-size:0}.workspace{height:calc(100dvh - 58px);display:block}.conversation-pane,.message-pane{height:100%}.conversation-pane.hidden{display:none}.message-pane{display:none}.message-pane.visible{display:grid}.mobile-back{display:grid!important}.messages footer{opacity:1}.pane-heading,.message-pane>header{min-height:68px}.composer{padding-bottom:max(1rem,env(safe-area-inset-bottom))}}
</style>
