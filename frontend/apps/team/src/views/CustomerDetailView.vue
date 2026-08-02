<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { MessageCircleMore, Save } from '@lucide/vue'
import { NButton, NInput, NSelect, NSwitch } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPage from '../components/AdminPage.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { abilityReason, hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'

interface EntitySummary {
  entity_id: number
  slug: string
  type: string
  name: string
}
interface CustomerDetail {
  id: number
  slug: string
  name: string
  avatar?: string | null
  description?: string | null
  is_blocked: boolean
  create_time: number
  balance: { balance: string; recharged: string; spent: string }
  assignee?: EntitySummary | null
  summary: {
    transaction_count: number
    transaction_total: string
    order_count: number
    order_total: string
  }
  can_manage: boolean
}

const route = useRoute()
const id = computed(() => Number(route.params.id))
const client = useQueryClient()
const access = useTeamAccess()
const query = useQuery({
  queryKey: computed(() => ['team-customer', id.value]),
  queryFn: () => api.get<CustomerDetail>(`/customer/${id.value}`),
})
const canManage = computed(() => Boolean(query.data.value?.can_manage))
const assignees = useQuery({
  queryKey: ['team-customer-assignees'],
  queryFn: () => api.get<EntitySummary[]>('/customer/assignees'),
  enabled: canManage,
})
const form = reactive({
  name: '',
  avatar: '',
  description: '',
  assignee_entity_id: null as number | null,
  is_blocked: false,
})
watch(() => query.data.value, value => {
  if (!value) return
  Object.assign(form, {
    name: value.name,
    avatar: value.avatar ?? '',
    description: value.description ?? '',
    assignee_entity_id: value.assignee?.entity_id ?? null,
    is_blocked: value.is_blocked,
  })
}, { immediate: true })
const save = useMutation({
  mutationFn: () => api.post<void>(`/customer/${id.value}`, {
    name: form.name.trim(),
    avatar: form.avatar.trim() || null,
    description: form.description.trim() || null,
    assignee_entity_id: form.assignee_entity_id,
    is_blocked: form.is_blocked ? 1 : 0,
  }),
  onSuccess: async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['team-customer', id.value] }),
      client.invalidateQueries({ queryKey: ['team-customers'] }),
    ])
  },
})
const assigneeOptions = computed(() => (assignees.data.value ?? []).map(item => ({
  label: `${item.name} · @${item.slug}`,
  value: item.entity_id,
})))
const chatReason = computed(() => {
  const snapshot = access.data.value
  if (!snapshot || !snapshot.permissions) return ''
  const chat = snapshot.abilities?.chat
  if (chat && !chat.enabled) return abilityReason('chat', chat.label || '聊天')
  if (!hasPermission(snapshot, 'chat.conversation.create')) return permissionReason('chat.conversation.create')
  return ''
})
const chatUrl = computed(() => query.data.value?.slug
  ? chatWorkspaceUrl('/new', { participant: query.data.value.slug })
  : '')
const money = (value: string) => new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
}).format(Number(value))
</script>

<template>
  <AdminPage width="content">
    <AdminPageHeader
      :title="query.data.value?.name || '客户详情'"
      description="查看客户归属、余额和经营摘要；历史订单与流水保留创建时的发单归属。"
      back-to="/customers"
      back-label="返回客户列表"
    >
      <template #actions>
        <a v-if="!chatReason && chatUrl" class="chat-link" :href="chatUrl"><MessageCircleMore :size="18" />发起对话</a>
        <NButton v-else secondary class="chat-link" :title="chatReason" disabled><template #icon><MessageCircleMore :size="18" /></template>发起对话</NButton>
      </template>
    </AdminPageHeader>

    <p v-if="query.isError.value || save.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value || save.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <template v-else-if="query.data.value">
      <section class="summary-grid" aria-label="客户经营摘要">
        <article><span>可用余额</span><strong>{{ money(query.data.value.balance.balance) }}</strong><small>累计充值 {{ money(query.data.value.balance.recharged) }}</small></article>
        <article><span>流水</span><strong>{{ query.data.value.summary.transaction_count }} 笔</strong><small>{{ money(query.data.value.summary.transaction_total) }}</small></article>
        <article><span>订单</span><strong>{{ query.data.value.summary.order_count }} 笔</strong><small>{{ money(query.data.value.summary.order_total) }}</small></article>
      </section>

      <section class="detail-panel">
        <header><div><h3>客户资料</h3><p>@{{ query.data.value.slug }}</p></div><span>{{ canManage ? '可维护' : '只读' }}</span></header>
        <form @submit.prevent="save.mutate()">
          <label>客户昵称<NInput v-model:value="form.name" :disabled="!canManage" maxlength="50" /></label>
          <label>头像地址<NInput v-model:value="form.avatar" :disabled="!canManage" placeholder="可选" /></label>
          <label>说明<NInput v-model:value="form.description" :disabled="!canManage" type="textarea" maxlength="500" /></label>
          <label>当前归属人
            <NSelect
              v-model:value="form.assignee_entity_id"
              :options="assigneeOptions"
              :disabled="!canManage"
              filterable
              clearable
              placeholder="未归属"
            />
            <small>变更只影响之后创建的订单和流水，不修改历史发单人。</small>
          </label>
          <label class="switch-field">
            <span><strong>封禁客户</strong><small>封禁后客户现有身份会话不能继续使用。</small></span>
            <NSwitch v-model:value="form.is_blocked" :disabled="!canManage" />
          </label>
          <NButton v-if="canManage" attr-type="submit" type="primary" :loading="save.isPending.value"><Save :size="18" />保存客户资料</NButton>
        </form>
      </section>
    </template>
  </AdminPage>
</template>

<style scoped>
.chat-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .9rem;border:0;border-radius:9px;color:white;background:var(--sky-lost-strong);font-size:.875rem;font-weight:700}.chat-link.disabled{color:var(--muted-ink);background:var(--cloud);cursor:not-allowed}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.summary-grid article{display:grid;gap:.25rem;padding:1.1rem;border-right:1px solid var(--line)}.summary-grid article:last-child{border-right:0}.summary-grid span,.summary-grid small{color:var(--muted-ink);font-size:.76rem}.summary-grid strong{font-size:1.1rem;font-variant-numeric:tabular-nums}.detail-panel{padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}.detail-panel>header{display:flex;align-items:start;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--line)}.detail-panel h3,.detail-panel p{margin:0}.detail-panel p{margin-top:.2rem;color:var(--muted-ink);font-size:.8rem}.detail-panel>header>span{padding:.2rem .5rem;border-radius:999px;background:var(--cloud);font-size:.72rem;font-weight:700}.detail-panel form{max-width:42rem;display:grid;gap:1rem;margin-top:1rem}.detail-panel label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}.detail-panel label>small,.switch-field small{color:var(--muted-ink);font-weight:400;line-height:1.5}.switch-field{grid-template-columns:1fr auto!important;align-items:center;padding:.85rem;background:var(--cloud);border-radius:10px}.switch-field span,.switch-field strong,.switch-field small{display:block}
@media(max-width:640px){.summary-grid{grid-template-columns:1fr}.summary-grid article{border-right:0;border-bottom:1px solid var(--line)}.summary-grid article:last-child{border-bottom:0}}
</style>
