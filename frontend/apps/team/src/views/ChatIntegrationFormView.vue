<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft, KeyRound, RotateCw, Trash2 } from '@lucide/vue'

import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { NInput } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

interface Integration {
  id: number
  name: string
  endpoint_url: string
  events: string[]
  is_active: number
}
interface VirtualEntity {
  slug: string
  name: string
  integrations?: Integration[]
}
interface Credentials {
  id?: number
  token: string
  signing_secret: string
}

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const routeAccess = useRouteAccess()
const slug = computed(() => String(route.query.slug ?? ''))
const id = computed(() => Number(route.query.id ?? 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  name: '',
  endpoint_url: '',
  events: ['message.created'] as string[],
  is_active: true,
})
const draftKey = () => teamDraftScope('ChatIntegrationFormView', [slug.value, id.value])
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })

const credentials = reactive<Credentials>({ token: '', signing_secret: '' })
const detail = useQuery({
  queryKey: computed(() => ['chat-virtual', slug.value]),
  queryFn: () => routeAccess.read(() => api.get<VirtualEntity>('/chatVirtual/get', { slug: slug.value })),
  enabled: computed(() => Boolean(slug.value) && !routeAccess.restricted.value),
})
const current = computed(() => detail.data.value?.integrations?.find(item => item.id === id.value))

watch(current, value => {
  if (!value) return
    const next = { ...form }
  next.name = value.name
  next.endpoint_url = value.endpoint_url
  next.events = Array.isArray(value.events) ? [...value.events] : []
  next.is_active = Boolean(value.is_active)
  draft.hydrate(next)
}, { immediate: true })

const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const targetSlug = slug.value
    const targetId = id.value
    const form = submitted.value
    const data = await ( editing.value
    ? api.post('/chatIntegration/update', {
        slug: slug.value,
        id: id.value,
        name: form.name,
        endpoint_url: form.endpoint_url,
        events: form.events,
        is_active: form.is_active ? 1 : 0,
      })
    : api.post<Credentials>('/chatIntegration/create', {
        slug: slug.value,
        name: form.name,
        endpoint_url: form.endpoint_url,
        events: form.events,
      })
    )
    return { data, submitted, targetSlug, targetId }
  },
  onSuccess: async ({ data, submitted, targetSlug, targetId }) => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    await client.invalidateQueries({ queryKey: ['chat-virtual', targetSlug] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    if (!targetId) {
      const created = data as Credentials
      credentials.id = created.id
      credentials.token = created.token
      credentials.signing_secret = created.signing_secret
      await router.replace({ path: '/chat-integration', query: { slug: targetSlug, id: created.id } })
    }
  },
})
const rotate = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const data = await api.post<Credentials>('/chatIntegration/rotate', { slug: slug.value, id: id.value })
    return { data, submitted }
  },
  onSuccess: ({ data, submitted }) => {
    if (!draft.isCurrent(submitted)) return
    credentials.token = data.token
    credentials.signing_secret = data.signing_secret
  },
})
const remove = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    await api.post('/chatIntegration/delete', { slug: slug.value, id: id.value })
    return submitted
  },
  onSuccess: submitted => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    return router.replace({ path: '/chat-virtual', query: { slug: slug.value } })
  },
})

const eventOptions = [
  { value: 'conversation.created', label: '会话创建' },
  { value: 'conversation.closed', label: '会话关闭' },
  { value: 'conversation.participants.added', label: '参与者加入' },
  { value: 'conversation.participant.removed', label: '参与者移出' },
  { value: 'message.created', label: '新消息' },
  { value: 'message.updated', label: '消息编辑' },
  { value: 'message.revoked', label: '消息撤回' },
]

function deleteIntegration() {
  if (routeAccess.restricted.value) return
  if (confirm('确认删除这个 Webhook 集成？')) remove.mutate()
}
function submit() {
  if (routeAccess.restricted.value) return
  save.mutate()
}
function rotateCredentials() {
  if (routeAccess.restricted.value) return
  rotate.mutate()
}
</script>

<template>
  <LsFormPage :title="editing ? '编辑 Webhook 集成' : '创建 Webhook 集成'" :description="`该集成仅代表 @${slug}，只能向这个虚拟人员已参与的会话发送消息。`">
    <template #actions>
      <LsPageLink :to="{ path: '/chat-virtual', query: { slug } }" :icon="ArrowLeft" label="返回虚拟人员" />
      <template v-if="editing">
          <LsButton variant="danger" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="remove.isPending.value" @click="deleteIntegration">
            <Trash2 :size="16" />删除集成
          </LsButton>
        </template>
    </template>

      <p v-if="detail.isError.value && !routeAccess.restricted.value" class="error" role="alert">{{ friendlyError(detail.error.value) }}</p>
      <LsPanel v-else><form class="integration-form" @submit.prevent="submit">
        <LsField label="集成名称" for-id="integration-name"><NInput :input-props="{ id: 'integration-name' }" v-model:value="form.name" maxlength="50" placeholder="CRM 工作流" /></LsField>
        <LsField label="HTTPS Webhook 地址" for-id="integration-endpoint"><NInput :input-props="{ id: 'integration-endpoint' }" v-model:value="form.endpoint_url" maxlength="1000" placeholder="https://example.com/lostsky/events" /></LsField>
        <LsCheckboxGroupField v-model="form.events" label="订阅事件" :options="eventOptions" />
        <LsSwitchField v-if="editing" v-model="form.is_active" label="启用集成" description="停用后不再接收事件，也不能使用 API Token 发送消息。" />
        <p v-if="(save.isError.value || rotate.isError.value || remove.isError.value) && !routeAccess.restricted.value" class="error" role="alert">
          {{ friendlyError(save.error.value || rotate.error.value || remove.error.value) }}
        </p>
        <LsFormActions>
          <LsButton type="submit" :disabled="routeAccess.restricted.value || !draft.dirty.value" :disabled-reason="routeAccess.reason.value" :loading="save.isPending.value">保存集成</LsButton>
          <LsButton v-if="editing" type="button" variant="secondary" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="rotate.isPending.value" @click="rotateCredentials">
            <RotateCw :size="16" />轮换凭据
          </LsButton>
        </LsFormActions>
      </form></LsPanel>

      <LsPanel v-if="credentials.token" role="status"><div class="credentials">
        <KeyRound :size="22" />
        <div>
          <h3>立即保存新凭据</h3>
          <p>API Token：<code>{{ credentials.token }}</code></p>
          <p>签名密钥：<code>{{ credentials.signing_secret }}</code></p>
          <small>明文只在创建或轮换后显示一次。</small>
        </div>
      </div></LsPanel>
  </LsFormPage>
</template>

<style scoped>

.integration-form{display:grid;gap:1rem}
.credentials{display:grid;grid-template-columns:28px minmax(0,1fr);gap:.65rem;color:var(--text-primary)}
.credentials h3,.credentials p{margin:0}.credentials code{display:block;overflow-wrap:anywhere;color:var(--ink);user-select:all}.credentials small{color:var(--muted-ink)}
.error{margin:0;color:var(--danger)}
</style>
