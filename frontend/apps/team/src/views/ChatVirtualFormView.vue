<script setup lang="ts">
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus, Trash2, Webhook } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { resourceUploadReason, useTeamAccess } from '../lib/teamAccess'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

interface Integration { id: number; name: string; endpoint_url: string; events: string[]; is_active: number }
interface VirtualEntity { slug: string; name: string; avatar: string | null; description: string | null; is_active: number; integrations?: Integration[] }
const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const access = useTeamAccess()
const routeAccess = useRouteAccess()
const uploadDisabledReason = computed(() => routeAccess.reason.value || resourceUploadReason(access.data.value))
const avatarUploading = ref(false)
const slug = computed(() => String(route.query.slug ?? ''))
const editing = computed(() => Boolean(slug.value))
const form = reactive({ slug: '', name: '', avatar: '', description: '', is_active: true })
const draftKey = () => teamDraftScope('ChatVirtualFormView', slug.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })
const saveDisabledReason = computed(() => routeAccess.reason.value || (avatarUploading.value ? '请等待头像上传完成' : !draft.dirty.value ? '尚未修改任何内容' : ''))

const detail = useQuery({
  queryKey: computed(() => ['chat-virtual', slug.value]),
  queryFn: () => routeAccess.read(() => api.get<VirtualEntity>('/chatVirtual/get', { slug: slug.value })),
  enabled: computed(() => editing.value && !routeAccess.restricted.value),
})
watch(() => detail.data.value, value => {
  if (!value || value.slug !== slug.value) return
    const next = { ...form }
  next.slug = value.slug
  next.name = value.name
  next.avatar = value.avatar ?? ''
  next.description = value.description ?? ''
  next.is_active = Boolean(value.is_active)
  draft.hydrate(next)
}, { immediate: true })
const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const targetSlug = slug.value
    const form = submitted.value
    const data = await ( editing.value
    ? api.post('/chatVirtual/update', { slug: slug.value, name: form.name, avatar: form.avatar || null, description: form.description || null, is_active: form.is_active ? 1 : 0 })
    : api.post<{ slug: string }>('/chatVirtual/create', { slug: form.slug, name: form.name, avatar: form.avatar || null, description: form.description || null })
    )
    return { data, submitted, targetSlug }
  },
  onSuccess: async ({ data, submitted, targetSlug }) => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    await client.invalidateQueries({ queryKey: ['chat-virtuals'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    if (!targetSlug) router.replace({ path: '/chat-virtual', query: { slug: (data as { slug: string }).slug } })
    else client.invalidateQueries({ queryKey: ['chat-virtual', targetSlug] })
  },
})
const remove = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    await api.post('/chatVirtual/delete', { slug: slug.value })
    return submitted
  },
  onSuccess: submitted => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    return router.replace('/chat-virtuals')
  },
})
function deleteVirtual() {
  if (routeAccess.restricted.value) return
  if (confirm('删除后具体 slug 权限会同步清理，slug 将永久保留。确认继续？')) remove.mutate()
}
function submit() {
  if (saveDisabledReason.value || save.isPending.value) return
  save.mutate()
}
</script>

<template>
    <div class="virtual-form-page">
      <AdminPageHeader :title="editing ? '编辑虚拟人员' : '创建虚拟人员'" description="您需要为虚拟人员设置标识。" back-to="/chat-virtuals" back-label="返回虚拟人员">
        <template v-if="editing" #actions><LsButton variant="danger" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="remove.isPending.value" @click="deleteVirtual"><Trash2 :size="16" />删除人员</LsButton></template>
      </AdminPageHeader>
      <form @submit.prevent="submit"><LsPanel><div class="virtual-fields">
        <h3>基本信息</h3>
        <LsField label="永久 slug" for-id="virtual-slug" required><NInput id="virtual-slug" v-model:value="form.slug" :disabled="editing" maxlength="50" placeholder="sales-assistant" /></LsField>
        <LsField label="显示名称" for-id="virtual-name" required><NInput id="virtual-name" v-model:value="form.name" maxlength="50" placeholder="销售助手" /></LsField>
        <LsField label="头像" for-id="virtual-avatar"><LsMediaUploadField id="virtual-avatar" v-model="form.avatar" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传头像" :disabled="avatarUploading || Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" @uploading="avatarUploading = $event" /></LsField>
        <LsField label="简介" for-id="virtual-description"><NInput id="virtual-description" v-model:value="form.description" type="textarea" maxlength="500" :autosize="{ minRows: 3, maxRows: 7 }" /></LsField>
        <LsSwitchField v-if="editing" v-model="form.is_active" label="启用人员" description="停用后不能参与新操作。" />
        <LsInlineError v-if="(save.isError.value || remove.isError.value) && !routeAccess.restricted.value" :message="friendlyError(save.error.value || remove.error.value)" />
        <LsButton type="submit" :loading="save.isPending.value" :disabled="Boolean(saveDisabledReason)" :disabled-reason="saveDisabledReason">保存人员</LsButton>
      </div></LsPanel></form>

      <template v-if="editing">
        <LsPanel>
          <template #header><header>
            <div><h3>Webhook 集成</h3><p>同一虚拟人员可以同时由成员操作并连接多个外部系统。</p></div>
            <LsButton v-if="routeAccess.restricted.value" size="sm" :disabled="true" :disabled-reason="routeAccess.reason.value"><Plus :size="16" />创建集成</LsButton>
            <RouterLink v-else :to="{ path: '/chat-integration-new', query: { slug } }">
              <LsButton size="sm"><Plus :size="16" />创建集成</LsButton>
            </RouterLink>
          </header></template>
          <div v-if="detail.data.value?.integrations?.length" class="integration-list">
            <article v-for="item in detail.data.value.integrations" :key="item.id">
              <Webhook :size="19" />
              <div><strong>{{ item.name }}</strong><small>{{ item.endpoint_url }}</small></div>
              <span :class="{ inactive: !item.is_active }">{{ item.is_active ? '启用' : '停用' }}</span>
              <RouterLink :to="{ path: '/chat-integration', query: { slug, id: item.id } }">编辑</RouterLink>
            </article>
          </div>
          <p v-else class="empty-integrations">还没有集成。创建后会一次性显示 API Token 与签名密钥。</p>
        </LsPanel>
      </template>
    </div>
</template>

<style scoped>
.virtual-form-page{max-width:60rem;display:grid;gap:1rem}
.virtual-fields{display:grid;gap:1rem}.virtual-fields h3,.virtual-fields p{margin:0}
header p{color:var(--muted-ink);font-size:.75rem;font-weight:400}
.virtual-fields>.ls-button{width:fit-content}header{display:flex;align-items:center;justify-content:space-between;gap:1rem}header h3,header p{margin:0}
.integration-list{display:grid;gap:.5rem}
.integration-list article{display:grid;grid-template-columns:24px minmax(0,1fr) auto auto;align-items:center;gap:.65rem;padding:.65rem;background:var(--cloud);border-radius:9px}
.integration-list article>svg{color:var(--sky-lost-strong)}
.integration-list strong,.integration-list small{display:block;overflow:hidden;text-overflow:ellipsis}.integration-list small{color:var(--muted-ink)}
.integration-list article>span{padding:.12rem .45rem;color:var(--success);background:color-mix(in oklch,var(--success),white 91%);border-radius:999px;font-size:.67rem}
.integration-list article>span.inactive{color:var(--muted-ink);background:white}
.integration-list article>a{min-height:40px;display:inline-flex;align-items:center;padding:0 .7rem;color:var(--sky-lost-strong);background:white;border:1px solid var(--line);border-radius:8px;font-size:.8rem;font-weight:650}
.empty-integrations{padding:1rem;text-align:center;background:var(--cloud);border-radius:9px}
@media(max-width:560px){header{align-items:stretch;flex-direction:column}header a,header .ls-button{width:100%}.integration-list article{grid-template-columns:24px minmax(0,1fr) auto}.integration-list article>span{display:none}.integration-list article>a{padding-inline:.5rem}}
</style>
