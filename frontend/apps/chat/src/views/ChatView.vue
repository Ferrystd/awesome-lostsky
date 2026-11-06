<script setup lang="ts">
import ChatScene from '../components/ChatScene.vue'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { identityUrl, teamScopedAppUrl, workspaceAppEntries } from '@lostsky/shared/navigation'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, Bot, Building2, CheckCheck, CircleX, Globe, House, MessageCircleMore, MoreHorizontal, Plus, Radio, ReceiptText, Reply, Send, Settings2, Store, UserRound, Users } from '@lucide/vue'
import { NButton, NDropdown, NInput } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { loadCentrifuge, type CentrifugeClient, type Subscription } from '../lib/centrifuge'
import { useChatIdentity } from '../lib/useChatIdentity'
import LsAppSwitcher from '@lostsky/ui/components/LsAppSwitcher.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'

interface Actor {
  type: 'entity' | 'customer' | 'team' | 'virtual'
  slug: string
  name: string
  avatar: string | null
  id: number
  team?: { id: number; slug: string; name: string } | null
}

interface AppOption {
  key: string
  label: string
  href?: string
  disabled?: boolean
  reason?: string
}

const identityManagement = { href: identityUrl(), label: '切换身份' }
const { expectedEntityId, identityKey, checkIdentity, actor: actorsQuery } = useChatIdentity(() => {
  realtimeSubscription?.unsubscribe()
  realtimeClient?.disconnect()
  content.value = ''
  replyTo.value = null
  conversationDrafts.clear()
})
const identityType = computed(() => String(auth.entity()?.type ?? ''))
const backendWorkspace = computed(() => ['team', 'teamMember', 'teamVirtual'].includes(identityType.value))
const customerWorkspace = computed(() => identityType.value === 'teamCustomer')
const baseAppOptions = computed<AppOption[]>(() => {
  if (customerWorkspace.value) return [
    { key: 'display', label: '展示' },
    ...workspaceAppEntries({ paths: { shop: '/customer/profile' } }).filter(item => ['shop', 'chat', 'community'].includes(item.key)),
  ]
  if (!backendWorkspace.value) return workspaceAppEntries({ states: Object.fromEntries(['team', 'shop', 'transaction', 'weibo'].map(key => [key, { disabled: true, reason: '请先领取团队身份' }])) })
  return workspaceAppEntries()
})
const appOptions = computed<AppOption[]>(() => baseAppOptions.value.map(item => {
  if (item.key === 'chat' || item.key === 'community') return item
  const team = activeIdentity.value?.team?.slug
  if (!team) return { ...item, href: '//account.lostsky.work/teams' }
  const path = item.key === 'shop' ? (customerWorkspace.value ? '/customer/profile' : '/manage') : '/'
  return { ...item, href: teamScopedAppUrl(team, item.key as 'display' | 'team' | 'shop' | 'transaction' | 'weibo', path) }
}))
const appDropdownOptions = computed(() => appOptions.value.map(({ key, label, disabled, reason }) => ({
  key,
  label: disabled && reason ? `${label}（${reason}）` : label,
  disabled,
})))
function switchApp(key: string) {
  const item = appOptions.value.find(option => option.key === key)
  if (item?.href && !item.disabled) location.href = item.href
}
function explainApp(item: AppOption) {
  feedback.info(item.reason || `${item.label}暂不可用`)
}
function appIcon(key: string) {
  if (key === 'team' || key === 'display') return House
  if (key === 'shop') return Store
  if (key === 'transaction') return ReceiptText
  if (key === 'community') return Globe
  if (key === 'weibo') return Radio
  return MessageCircleMore
}
interface Participant extends Actor {
  status: 'pending' | 'active' | 'rejected'
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
const actingSlug = computed(() => actorsQuery.data.value?.slug ?? '')
const content = ref('')
const replyTo = ref<Message | null>(null)
const conversationDrafts = new Map<string, { content: string; replyTo: Message | null }>()
const realtimeState = ref<'connecting' | 'live' | 'polling'>('connecting')
const messageList = ref<HTMLElement | null>(null)
let realtimeClient: CentrifugeClient | null = null
let realtimeSubscription: Subscription | null = null
let pollTimer = 0
let subscriptionEpoch = 0

const conversationsQuery = useQuery({
  queryKey: ['chat-conversations', identityKey],
  queryFn: ({ signal }) => api.get<Conversation[]>('/conversation', undefined, { signal }),
})
const conversations = computed(() => conversationsQuery.data.value ?? [])
const active = computed(() => conversations.value.find(item => item.uuid === activeUuid.value) ?? null)
const messagesQuery = useQuery({
  queryKey: computed(() => ['chat-messages', identityKey, activeUuid.value]),
  queryFn: ({ signal }) => api.get<Message[]>('/message', { conversation: activeUuid.value, limit: 100 }, { signal }),
  enabled: computed(() => Boolean(activeUuid.value)),
})
const messages = computed(() => messagesQuery.data.value ?? [])
const activeIdentity = computed(() => actorsQuery.data.value ?? null)

let resolvingLegacy = false
watch(conversations, async items => {
  if (activeUuid.value && items.some(item => item.uuid === activeUuid.value)) return
  if (conversationsQuery.isPending.value || resolvingLegacy) return
  const requested = activeUuid.value
  if (requested && items.length) {
    resolvingLegacy = true
    try {
      const resolved = await api.get<Conversation>('/conversation/get', { uuid: requested })
      if (checkIdentity() && activeUuid.value === requested) activeUuid.value = resolved.uuid
      return
    } catch (error) { feedback.error(friendlyError(error)) }
    finally { resolvingLegacy = false }
  }
  activeUuid.value = items[0]?.uuid ?? ''
}, { immediate: true })
watch(messages, async items => {
  await nextTick()
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight })
  const last = items.at(-1)
  if (last && actingSlug.value && checkIdentity()) {
    api.post('/message/read', {
      conversation: activeUuid.value,
      expected_entity_id: expectedEntityId.value,
      message_id: last.id,
    }).catch(() => undefined)
  }
})
watch(activeUuid, (uuid, previous) => {
  if (previous) conversationDrafts.set(previous, { content: content.value, replyTo: replyTo.value })
  const nextDraft = conversationDrafts.get(uuid)
  content.value = nextDraft?.content ?? ''
  replyTo.value = nextDraft?.replyTo ?? null
  const url = new URL(location.href)
  if (uuid) url.searchParams.set('conversation', uuid)
  else url.searchParams.delete('conversation')
  history.replaceState(null, '', `${url.pathname}${url.search}`)
  subscribeRealtime(uuid)
}, { flush: 'sync' })

const sendMessage = useMutation({
  mutationFn: (draft: { conversation: string; content: string; reply_id: number | null }) => api.post<Message>('/message/send', { ...draft, expected_entity_id: expectedEntityId.value }),
  onSuccess: async (message, draft) => {
    if (!checkIdentity()) return
    if (activeUuid.value === draft.conversation && content.value === draft.content && (replyTo.value?.id ?? null) === draft.reply_id) { content.value = ''; replyTo.value = null }
    const savedDraft = conversationDrafts.get(draft.conversation)
    if (savedDraft?.content === draft.content && (savedDraft.replyTo?.id ?? null) === draft.reply_id) conversationDrafts.delete(draft.conversation)
    queryClient.setQueryData<Message[]>(['chat-messages', identityKey, draft.conversation], current => [
      ...(current ?? []).filter(item => item.id !== message.id),
      message,
    ])
    await queryClient.invalidateQueries({ queryKey: ['chat-conversations', identityKey] })
  },
})
async function blockParticipant() {
  const other = active.value?.participants.find(item => item.slug !== actingSlug.value)
  if (!other || !confirm(`屏蔽 ${other.name}？双方将无法发送单聊消息或发起新的群邀请，已有聊天记录仍保留。`)) return
  try {
    await api.post('/block/create', { expected_entity_id: expectedEntityId.value, entity_slug: other.slug })
    feedback.success('已屏蔽对方')
  } catch (error) { feedback.error(friendlyError(error)) }
}
const closeConversation = useMutation({
  mutationFn: () => api.post('/conversation/leave', { uuid: activeUuid.value, expected_entity_id: expectedEntityId.value }),
  onSuccess: () => { activeUuid.value = ''; return queryClient.invalidateQueries({ queryKey: ['chat-conversations', identityKey] }) },
  onError: error => feedback.error(friendlyError(error)),
})

function conversationName(conversation: Conversation) {
  if (conversation.title) return conversation.title
  const others = conversation.participants.filter(item => item.slug !== actingSlug.value && !item.left_at && item.status === 'active')
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
  if (!checkIdentity()) return
  if (!content.value.trim() || !activeUuid.value || !actingSlug.value || sendMessage.isPending.value) return
  sendMessage.mutate({ conversation: activeUuid.value, content: content.value, reply_id: replyTo.value?.id ?? null })
}
async function edit(message: Message) {
  const next = prompt('编辑消息', message.content ?? '')
  if (!next?.trim()) return
  await api.post('/message/edit', { expected_entity_id: expectedEntityId.value, message_id: message.id, content: next })
  await queryClient.invalidateQueries({ queryKey: ['chat-messages', identityKey, activeUuid.value] })
}
async function revoke(message: Message) {
  if (!confirm('确认撤回这条消息？')) return
  await api.post('/message/revoke', { expected_entity_id: expectedEntityId.value, message_id: message.id })
  await queryClient.invalidateQueries({ queryKey: ['chat-messages', identityKey, activeUuid.value] })
}
function selectConversation(uuid: string) {
  activeUuid.value = uuid
}
function goBack() {
  activeUuid.value = ''
}
function closeActiveConversation() {
  if (active.value?.is_closed || !confirm('确认退出这个群聊？退出后将不能继续读取消息。')) return
  closeConversation.mutate()
}
async function refreshConversation() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['chat-messages', identityKey, activeUuid.value] }),
    queryClient.invalidateQueries({ queryKey: ['chat-conversations', identityKey] }),
  ])
}
async function ensureRealtimeClient() {
  if (realtimeClient) return realtimeClient
  if (!expectedEntityId.value) await actorsQuery.refetch()
  const Ctor = await loadCentrifuge()
  if (!checkIdentity()) throw new Error('身份已改变')
  const initial = await api.post<RealtimeToken>('/realtime/connect', { expected_entity_id: expectedEntityId.value })
  if (!checkIdentity()) throw new Error('身份已改变')
  realtimeClient = new Ctor(String(initial.url), {
    token: initial.token,
    getToken: async () => (await api.post<RealtimeToken>('/realtime/connect', { expected_entity_id: expectedEntityId.value })).token,
  })
  realtimeClient.connect()
  return realtimeClient
}
async function subscribeRealtime(uuid: string) {
  const epoch = ++subscriptionEpoch
  realtimeSubscription?.unsubscribe()
  realtimeSubscription = null
  if (!uuid) return
  realtimeState.value = 'connecting'
  try {
    const client = await ensureRealtimeClient()
    const initial = await api.post<RealtimeToken>('/realtime/subscribe', { conversation: uuid, expected_entity_id: expectedEntityId.value })
    if (epoch !== subscriptionEpoch || !checkIdentity()) return
    realtimeSubscription = client.newSubscription(String(initial.channel), {
      token: initial.token,
      getToken: async () => (await api.post<RealtimeToken>('/realtime/subscribe', { conversation: uuid, expected_entity_id: expectedEntityId.value })).token,
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
    if (!checkIdentity()) return
    if (activeUuid.value && realtimeState.value !== 'live') refreshConversation()
  }, 10000)
  if (activeUuid.value) subscribeRealtime(activeUuid.value)
})
onUnmounted(() => {
  ++subscriptionEpoch
  clearInterval(pollTimer)
  realtimeSubscription?.unsubscribe()
  realtimeClient?.disconnect()
})
</script>

<template>
    <ChatScene><main class="chat-app">
      <header class="topbar">
        <a class="brand" href="//chat.lostsky.work"><MessageCircleMore :size="22" /><strong>LostSky Chat</strong></a>
        <nav class="app-links" aria-label="应用切换">
          <template v-for="item in appOptions" :key="item.key">
            <NButton
              v-if="item.disabled"
              quaternary
              class="app-link app-link--disabled"
              :title="item.reason"
              :aria-label="`${item.label}不可用：${item.reason}`"
              @click="explainApp(item)"
            ><component :is="appIcon(item.key)" :size="17" /><span>{{ item.label }}</span></NButton>
            <a v-else class="app-link" :class="{ active: item.key === 'chat' }" :href="item.href" :aria-current="item.key === 'chat' ? 'page' : undefined"><component :is="appIcon(item.key)" :size="17" /><span>{{ item.label }}</span></a>
          </template>
        </nav>
        <div class="app-menu">
          <LsAppSwitcher :actions="appOptions" current-app="chat" @select="switchApp" />
        </div>
        <span class="team">{{ activeIdentity?.name }}</span>
        <nav class="account-links">
          <a :href="identityManagement.href"><UserRound :size="18" />{{ identityManagement.label }}</a>
          <a href="/requests">邀请与屏蔽</a>
          <a class="new-chat" href="/new"><Plus :size="18" />新会话</a>
        </nav>
      </header>

      <div class="workspace">
        <aside :class="['conversation-pane', { 'conversation-pane--hidden': activeUuid }]">
          <div class="pane-heading">
            <h1>消息</h1>
            <a href="/new" aria-label="创建会话"><Plus /></a>
          </div>
          <p v-if="conversationsQuery.isError.value" class="error" role="alert">{{ friendlyError(conversationsQuery.error.value) }}</p>
          <div v-else-if="conversations.length" class="conversation-list">
            <NButton v-for="conversation in conversations" :key="conversation.uuid" quaternary :class="{ active: conversation.uuid === activeUuid }" @click="selectConversation(conversation.uuid)">
              <span class="avatar"><component :is="conversation.kind === 'group' ? Users : MessageCircleMore" :size="20" /></span>
              <span>
                <strong>{{ conversationName(conversation) }}</strong>
                <small>{{ conversation.is_temporary ? '临时 · ' : '' }}{{ conversation.last_message || '还没有消息' }}</small>
              </span>
              <time>{{ time(conversation.last_message_at) }}</time>
            </NButton>
          </div>
          <LsEmptyState v-else title="从第一段对话开始" description="发起单聊，或接受团队发来的群聊邀请。" />
        </aside>

        <section :class="['message-pane', { visible: activeUuid }]">
          <template v-if="active">
            <header>
              <NButton class="mobile-back" quaternary circle aria-label="返回会话列表" @click="goBack"><template #icon><ArrowLeft /></template></NButton>
              <div>
                <h2>{{ conversationName(active) }}</h2>
                <p>{{ active.participants.filter(item => !item.left_at && item.status === 'active').length }} 位参与者 · <span :class="realtimeState">{{ realtimeState === 'live' ? '实时' : realtimeState === 'polling' ? '定时更新' : '连接中' }}</span></p>
              </div>
              <NButton v-if="active.kind === 'direct'" quaternary @click="blockParticipant">屏蔽</NButton>
              <NButton v-if="active.kind === 'group' && !active.is_closed" quaternary circle aria-label="退出群聊" :loading="closeConversation.isPending.value" @click="closeActiveConversation"><template #icon><CircleX /></template></NButton>
            </header>
        <details class="conversation-details">
          <summary><Settings2 :size="18" />参与者与会话详情</summary><div class="conversation-details__body">
          <section><h3>当前身份</h3><div v-if="activeIdentity" class="identity-card"><component :is="actorIcon(activeIdentity.type)" /><span><strong>{{ activeIdentity.name }}</strong><small>@{{ activeIdentity.slug }}</small></span></div><p v-else class="muted">你还没有可用身份，请先完善资料或联系管理员授权。</p></section>
          <section><h3>参与者</h3><ul><li v-for="participant in active.participants.filter(item => !item.left_at && item.status === 'active')" :key="participant.slug"><span class="mini-avatar"><component :is="actorIcon(participant.type)" :size="15" /></span><span><strong>{{ participant.name }}</strong><small>@{{ participant.slug }}</small></span><CheckCheck v-if="participant.last_read_message_id" :size="15" aria-label="已读" /></li></ul></section>
          <section v-if="active.is_temporary"><h3>临时会话</h3><p class="muted">{{ active.expires_at ? `将在 ${dayTime(active.expires_at)} 到期` : '由参与者手动关闭' }}</p></section>
        </div></details>
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
                    <NButton size="tiny" quaternary @click="replyTo = message"><template #icon><Reply :size="14" /></template>回复</NButton>
                    <NButton v-if="message.sender.slug === actingSlug" size="tiny" quaternary @click="edit(message)">编辑</NButton>
                    <NButton v-if="message.sender.slug === actingSlug" size="tiny" quaternary @click="revoke(message)">撤回</NButton>
                  </footer>
                </div>
              </article>
              <div v-if="!messages.length && !messagesQuery.isPending.value" class="timeline-state">这里还很安静，发一条消息吧。</div>
            </div>
            <form v-if="!active.is_closed" class="composer" @submit.prevent="submit">
              <div v-if="replyTo" class="replying"><span>回复 {{ replyTo.sender.name }}：{{ replyTo.content }}</span><NButton size="tiny" quaternary @click="replyTo = null">取消</NButton></div>
              <div class="identity-row"><span>当前身份：{{ activeIdentity?.name }} · @{{ actingSlug }}</span><a :href="identityManagement.href">切换身份</a></div>
              <div class="compose-row">
                <NInput v-model:value="content" type="textarea" :autosize="{ minRows: 1, maxRows: 5 }" maxlength="10000" placeholder="输入消息，Enter 发送" @keydown.enter.exact.prevent="submit" />
                <NButton attr-type="submit" type="primary" :disabled="!content.trim() || !actingSlug" :loading="sendMessage.isPending.value" aria-label="发送消息"><template #icon><Send :size="20" /></template></NButton>
              </div>
              <p v-if="sendMessage.isError.value" class="error" role="alert">{{ friendlyError(sendMessage.error.value) }}</p>
            </form>
            <div v-else class="closed-state">这段会话已经关闭，只能查看历史消息。</div>
          </template>
<div v-else class="message-placeholder"><LsEmptyState title="选择一段会话" description="消息和实时更新会显示在这里。" /></div>
        </section>


      </div>
    </main></ChatScene>
</template>

<style scoped>
.message-placeholder{grid-row:1/-1;display:grid;align-content:center;min-height:16rem}
.conversation-details{border-bottom:1px solid var(--line);min-width:0}.conversation-details summary{display:flex;gap:.5rem;align-items:center;min-height:44px;padding:.5rem 1rem;cursor:pointer;color:var(--muted-ink)}.conversation-details summary:focus-visible{outline:2px solid var(--sky-lost-strong);outline-offset:-2px}.conversation-details__body{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));max-height:35dvh;overflow:auto}.workspace{gap:1rem;padding:1rem}.conversation-pane,.message-pane{border:1px solid var(--line);border-radius:12px;overflow:hidden}.conversation-pane{overflow:auto}@media(max-width:720px){.workspace{padding:.5rem}.conversation-details__body{max-height:30dvh}}
.app-menu{display:none}.app-links{display:flex;align-items:center;gap:.1rem}.app-link{min-height:44px;display:inline-flex;align-items:center;gap:.35rem;padding:0 .6rem;color:oklch(.86 .012 210);border-radius:8px;font-size:.8rem;font-weight:650}.app-link:hover,.app-link.active{color:white;background:color-mix(in oklch,var(--sky-lost),transparent 78%)}.app-link--disabled{color:oklch(.56 .012 210);cursor:not-allowed}.app-link--disabled :deep(.n-button__content){display:flex;align-items:center;gap:.35rem}
.chat-app{min-height:100dvh;background:transparent}.topbar{height:64px;display:flex;align-items:center;gap:1rem;padding:0 1rem;color:white;background:var(--sky-night);border-bottom:1px solid color-mix(in oklch,var(--sky-lost),transparent 75%)}.brand{display:flex;align-items:center;gap:.55rem}.brand strong{font-family:'Barlow Condensed',sans-serif;font-size:1.15rem;letter-spacing:.02em}.team{color:oklch(.72 .02 210);font-size:.78rem}.account-links{display:flex;align-items:center;gap:.35rem;margin-left:auto}.account-links a{min-height:40px;display:flex;align-items:center;gap:.35rem;padding:0 .65rem;color:oklch(.86 .012 210);border-radius:8px;font-size:.8rem}.account-links a:hover{background:color-mix(in oklch,var(--sky-lost),transparent 78%)}.topbar .new-chat{color:var(--ink);background:transparent;font-weight:650}.workspace{height:calc(100dvh - 64px);display:grid;grid-template-columns:minmax(16rem,20rem) minmax(0,1fr);overflow:hidden}.conversation-pane,.conversation-details,.message-pane{min-width:0;background:var(--panel-material,var(--surface))}.conversation-pane{border-right:1px solid var(--line);overflow:auto}.pane-heading,.message-pane>header{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:1rem;border-bottom:1px solid var(--line)}.pane-heading p,.pane-heading h1,.message-pane h2,.message-pane header p{margin:0}.pane-heading p{color:var(--sky-lost-strong);font:700 .67rem/1 'Barlow Condensed',sans-serif;letter-spacing:.1em}.pane-heading h1{font-size:1.35rem}.pane-heading>a,.message-pane>header>button{width:42px;height:42px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border:0;border-radius:10px}.conversation-list{padding:.55rem}.conversation-list button{width:100%;min-height:76px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:.65rem;padding:.65rem;text-align:left;color:var(--ink);background:transparent;border:1px solid transparent;border-radius:10px}.conversation-list button:hover{background:var(--cloud)}.conversation-list button.active{background:color-mix(in oklch,var(--sky-lost),var(--surface) 91%);border-color:color-mix(in oklch,var(--sky-lost),var(--surface) 62%)}.avatar,.sender-avatar,.mini-avatar{display:grid;place-items:center;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),var(--surface) 87%);border-radius:10px}.avatar{width:42px;height:42px}.conversation-list strong,.conversation-list small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.conversation-list small{color:var(--muted-ink);font-size:.73rem}.conversation-list time{align-self:start;color:var(--muted-ink);font-size:.68rem}.message-pane{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto}.message-pane>header{padding-inline:1.1rem}.message-pane>header>div{min-width:0;flex:1}.message-pane h2{font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.message-pane header p{color:var(--muted-ink);font-size:.72rem}.message-pane header .live{color:var(--success)}.message-pane header .polling{color:var(--warning)}.mobile-back{display:none!important}.messages{overflow:auto;padding:1.25rem clamp(.75rem,3vw,2.5rem);scrollbar-gutter:stable}.messages article{display:grid;grid-template-columns:34px minmax(0,34rem);gap:.55rem;margin-bottom:1rem}.messages article.own{grid-template-columns:minmax(0,34rem);justify-content:end}.messages article.own>.sender-avatar{display:none}.sender-avatar{width:34px;height:34px;border-radius:9px}.messages article header{display:flex;align-items:baseline;gap:.5rem}.messages article header strong{font-size:.78rem}.messages article header time,.messages article>div>small{color:var(--muted-ink);font-size:.65rem}.bubble{width:fit-content;margin:.25rem 0 0;padding:.55rem .75rem;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--cloud);border-radius:4px 12px 12px 12px}.own .bubble{margin-left:auto;color:white;background:var(--sky-lost-strong);border-radius:12px 4px 12px 12px}.revoked .bubble{color:var(--muted-ink);background:transparent;border:1px dashed var(--line);font-style:italic}.messages footer{display:flex;gap:.55rem;margin-top:.25rem;opacity:0}.messages article:hover footer,.messages article:focus-within footer{opacity:1}.messages footer button{padding:0;color:var(--muted-ink);background:transparent;border:0;font-size:.68rem}.messages footer button:first-child{display:flex;align-items:center;gap:.2rem}.composer{padding:.75rem 1rem 1rem;border-top:1px solid var(--line);background:var(--panel-material,var(--surface))}.identity-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.45rem}.identity-row label{color:var(--muted-ink);font-size:.7rem}.identity-row select{max-width:15rem;color:var(--sky-lost-strong);background:transparent;border:0;font-size:.72rem;font-weight:650}.compose-row{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:end;gap:.55rem}.compose-row>button{width:44px;height:44px;display:grid;place-items:center;color:white;background:var(--sky-lost-strong);border:0;border-radius:10px}.compose-row>button:disabled{opacity:.45}.replying{display:flex;justify-content:space-between;gap:.5rem;padding:.4rem .55rem;margin-bottom:.45rem;color:var(--muted-ink);background:var(--cloud);border-radius:7px;font-size:.72rem}.replying span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.replying button{color:var(--sky-lost-strong);background:transparent;border:0}.conversation-details section{padding:1rem;border-bottom:1px solid var(--line)}.conversation-details h3{margin:0 0 .65rem;color:var(--muted-ink);font-size:.72rem;text-transform:uppercase;letter-spacing:.07em}.identity-card,.conversation-details li{display:flex;align-items:center;gap:.55rem}.identity-card>svg{width:36px;height:36px;padding:8px;color:var(--sky-lost-strong);background:var(--cloud);border-radius:9px}.identity-card span,.conversation-details li>span:nth-child(2){min-width:0;flex:1}.identity-card strong,.identity-card small,.conversation-details li strong,.conversation-details li small{display:block;overflow:hidden;text-overflow:ellipsis}.identity-card small,.conversation-details li small{color:var(--muted-ink);font-size:.7rem}.conversation-details ul{display:grid;gap:.7rem;margin:0;padding:0;list-style:none}.mini-avatar{width:30px;height:30px;border-radius:8px}.conversation-details li>svg{color:var(--sky-lost)}.empty,.timeline-state{padding:2rem;text-align:center;color:var(--muted-ink)}.empty{min-height:240px;display:grid;place-items:center;align-content:center;gap:.45rem}.empty strong{color:var(--ink)}.empty p{max-width:16rem;margin:0}.empty a{margin-top:.4rem;padding:.55rem .8rem;color:white;background:var(--sky-lost-strong);border-radius:8px}.center-empty{height:100%}.error{color:var(--danger)}.muted{margin:0;color:var(--muted-ink);font-size:.8rem}
.identity-row{flex-wrap:wrap;font-size:.8125rem}.identity-row a{min-height:44px;display:inline-flex;align-items:center}
.conversation-list :deep(.n-button){justify-content:stretch}
.conversation-list :deep(.n-button__content){width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:.65rem}
.closed-state{padding:1rem;text-align:center;color:var(--muted-ink);background:var(--cloud);border-top:1px solid var(--line);font-size:.8rem}
@media(max-width:1050px){.workspace{grid-template-columns:minmax(250px,310px) minmax(0,1fr)}}
@media(max-width:900px){.app-links{display:none}.app-menu{display:block}}
@media(max-width:720px){.topbar{height:58px;gap:.5rem}.brand strong,.team{display:none}.account-links{gap:.15rem}.account-links a{min-height:44px}.account-links a:first-child{font-size:0}.workspace{height:calc(100dvh - 58px);display:block}.conversation-pane,.message-pane{height:100%}.conversation-pane--hidden{display:none}.message-pane{display:none}.message-pane.visible{display:grid}.mobile-back{display:grid!important}.messages footer{opacity:1}.pane-heading,.message-pane>header{min-height:68px}.composer{padding-bottom:max(1rem,env(safe-area-inset-bottom))}}
</style>
