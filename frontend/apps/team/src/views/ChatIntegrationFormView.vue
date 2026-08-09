<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { KeyRound, RotateCw, Trash2 } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

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
const slug = computed(() => String(route.query.slug ?? ''))
const id = computed(() => Number(route.query.id ?? 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  name: '',
  endpoint_url: '',
  events: ['message.created'] as string[],
  is_active: true,
})
const credentials = reactive<Credentials>({ token: '', signing_secret: '' })
const detail = useQuery({
  queryKey: computed(() => ['chat-virtual', slug.value]),
  queryFn: () => api.get<VirtualEntity>('/chatVirtual/get', { slug: slug.value }),
  enabled: computed(() => Boolean(slug.value)),
})
const current = computed(() => detail.data.value?.integrations?.find(item => item.id === id.value))

watch(current, value => {
  if (!value) return
  form.name = value.name
  form.endpoint_url = value.endpoint_url
  form.events = Array.isArray(value.events) ? [...value.events] : []
  form.is_active = Boolean(value.is_active)
}, { immediate: true })

const save = useMutation({
  mutationFn: () => editing.value
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
      }),
  onSuccess: async data => {
    await client.invalidateQueries({ queryKey: ['chat-virtual', slug.value] })
    if (!editing.value) {
      const created = data as Credentials
      credentials.id = created.id
      credentials.token = created.token
      credentials.signing_secret = created.signing_secret
      await router.replace({ path: '/chat-integration', query: { slug: slug.value, id: created.id } })
    }
  },
})
const rotate = useMutation({
  mutationFn: () => api.post<Credentials>('/chatIntegration/rotate', { slug: slug.value, id: id.value }),
  onSuccess: data => {
    credentials.token = data.token
    credentials.signing_secret = data.signing_secret
  },
})
const remove = useMutation({
  mutationFn: () => api.post('/chatIntegration/delete', { slug: slug.value, id: id.value }),
  onSuccess: () => router.replace({ path: '/chat-virtual', query: { slug: slug.value } }),
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
  if (confirm('确认删除这个 Webhook 集成？')) remove.mutate()
}
</script>

<template>
    <div class="integration-form-page">
      <AdminPageHeader
        :title="editing ? '编辑 Webhook 集成' : '创建 Webhook 集成'"
        :description="`该集成仅代表 @${slug}，只能向这个虚拟实体已参与的会话发送消息。`"
        :back-to="{ path: '/chat-virtual', query: { slug } }"
        back-label="返回虚拟实体"
      >
        <template v-if="editing" #actions>
          <LsButton variant="danger" :loading="remove.isPending.value" @click="deleteIntegration">
            <Trash2 :size="16" />删除集成
          </LsButton>
        </template>
      </AdminPageHeader>

      <p v-if="detail.isError.value" class="error" role="alert">{{ friendlyError(detail.error.value) }}</p>
      <form v-else @submit.prevent="save.mutate()">
        <label>集成名称<NInput v-model:value="form.name" maxlength="50" placeholder="CRM 工作流" /></label>
        <label>HTTPS Webhook 地址<NInput v-model:value="form.endpoint_url" maxlength="1000" placeholder="https://example.com/lostsky/events" /></label>
        <LsCheckboxGroupField v-model="form.events" label="订阅事件" :options="eventOptions" />
        <LsSwitchField v-if="editing" v-model="form.is_active" label="启用集成" description="停用后不再接收事件，也不能使用 API Token 发送消息。" />
        <p v-if="save.isError.value || rotate.isError.value || remove.isError.value" class="error" role="alert">
          {{ friendlyError(save.error.value || rotate.error.value || remove.error.value) }}
        </p>
        <div class="actions">
          <LsButton type="submit" :loading="save.isPending.value">保存集成</LsButton>
          <LsButton v-if="editing" type="button" variant="secondary" :loading="rotate.isPending.value" @click="rotate.mutate()">
            <RotateCw :size="16" />轮换凭据
          </LsButton>
        </div>
      </form>

      <section v-if="credentials.token" class="credentials" role="status">
        <KeyRound :size="22" />
        <div>
          <h3>立即保存新凭据</h3>
          <p>API Token：<code>{{ credentials.token }}</code></p>
          <p>签名密钥：<code>{{ credentials.signing_secret }}</code></p>
          <small>明文只在创建或轮换后显示一次。</small>
        </div>
      </section>
    </div>
</template>

<style scoped>
.integration-form-page{display:grid;gap:1rem}
form{display:grid;gap:1rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}
form>label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}
.actions{display:flex;flex-wrap:wrap;gap:.6rem}
.credentials{display:grid;grid-template-columns:28px minmax(0,1fr);gap:.65rem;padding:1rem;color:oklch(.28 .07 150);background:oklch(.95 .04 150);border:1px solid oklch(.8 .08 150);border-radius:12px}
.credentials h3,.credentials p{margin:0}.credentials code{display:block;overflow-wrap:anywhere;color:var(--ink);user-select:all}.credentials small{color:var(--muted-ink)}
.error{margin:0;color:var(--danger)}
@media(max-width:520px){.actions{display:grid}.actions>*{width:100%}}
</style>
