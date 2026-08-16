<script setup lang="ts">
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

interface Integration { id: number; name: string; endpoint_url: string; events: string[]; is_active: number }
interface VirtualEntity { slug: string; name: string; avatar: string | null; description: string | null; is_active: number; integrations?: Integration[] }
const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const access = useTeamAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const avatarUploading = ref(false)
const slug = computed(() => String(route.query.slug ?? ''))
const editing = computed(() => Boolean(slug.value))
const form = reactive({ slug: '', name: '', avatar: '', description: '', is_active: true })
const detail = useQuery({
  queryKey: computed(() => ['chat-virtual', slug.value]),
  queryFn: () => api.get<VirtualEntity>('/chatVirtual/get', { slug: slug.value }),
  enabled: editing,
})
watch(() => detail.data.value, value => {
  if (!value) return
  form.slug = value.slug
  form.name = value.name
  form.avatar = value.avatar ?? ''
  form.description = value.description ?? ''
  form.is_active = Boolean(value.is_active)
}, { immediate: true })
const save = useMutation({
  mutationFn: () => editing.value
    ? api.post('/chatVirtual/update', { slug: slug.value, name: form.name, avatar: form.avatar || null, description: form.description || null, is_active: form.is_active ? 1 : 0 })
    : api.post<{ slug: string }>('/chatVirtual/create', { slug: form.slug, name: form.name, avatar: form.avatar || null, description: form.description || null }),
  onSuccess: async data => {
    await client.invalidateQueries({ queryKey: ['chat-virtuals'] })
    if (!editing.value) router.replace({ path: '/chat-virtual', query: { slug: (data as { slug: string }).slug } })
    else client.invalidateQueries({ queryKey: ['chat-virtual', slug.value] })
  },
})
const remove = useMutation({
  mutationFn: () => api.post('/chatVirtual/delete', { slug: slug.value }),
  onSuccess: () => router.replace('/chat-virtuals'),
})
function deleteVirtual() {
  if (confirm('删除后具体 slug 权限会同步清理，slug 将永久保留。确认继续？')) remove.mutate()
}
</script>

<template>
    <div class="virtual-form-page">
      <AdminPageHeader :title="editing ? '编辑虚拟实体' : '创建虚拟实体'" description="slug 用于 URL、权限（Permission）和集成身份；确定后不可修改或复用。" back-to="/chat-virtuals" back-label="返回虚拟实体">
        <template v-if="editing" #actions><LsButton variant="danger" :loading="remove.isPending.value" @click="deleteVirtual"><Trash2 :size="16" />删除实体</LsButton></template>
      </AdminPageHeader>
      <form @submit.prevent="save.mutate()"><LsPanel><div class="virtual-fields">
        <h3>基本信息</h3>
        <LsField label="永久 slug" for-id="virtual-slug" required><NInput id="virtual-slug" v-model:value="form.slug" :disabled="editing" maxlength="50" placeholder="sales-assistant" /></LsField>
        <LsField label="显示名称" for-id="virtual-name" required><NInput id="virtual-name" v-model:value="form.name" maxlength="50" placeholder="销售助手" /></LsField>
        <LsField label="头像" for-id="virtual-avatar"><LsMediaUploadField id="virtual-avatar" v-model="form.avatar" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传头像" :disabled="avatarUploading || Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" @uploading="avatarUploading = $event" /></LsField>
        <LsField label="简介" for-id="virtual-description"><NInput id="virtual-description" v-model:value="form.description" type="textarea" maxlength="500" :autosize="{ minRows: 3, maxRows: 7 }" /></LsField>
        <LsSwitchField v-if="editing" v-model="form.is_active" label="启用实体" description="停用后不能参与新操作。" />
        <LsInlineError v-if="save.isError.value || remove.isError.value" :message="friendlyError(save.error.value || remove.error.value)" />
        <LsButton type="submit" :loading="save.isPending.value" :disabled="avatarUploading">保存实体</LsButton>
      </div></LsPanel></form>

      <template v-if="editing">
        <LsPanel>
          <template #header><header>
            <div><h3>Webhook 集成</h3><p>同一虚拟实体（Virtual Entity）可以同时由成员操作并连接多个外部系统。</p></div>
            <RouterLink :to="{ path: '/chat-integration-new', query: { slug } }">
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
