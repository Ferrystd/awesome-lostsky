<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import EntityPermissionsCard, {
  type EffectivePermission,
  type RoleAssignment,
  type RoleRecord,
} from '../components/EntityPermissionsCard.vue'
import { searchEntities, uploadMarkdownImage } from '../lib/markdown'
import { fileUploadReason, useTeamAccess } from '../lib/teamAccess'

const client = useQueryClient()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const access = useTeamAccess()
const uploadDisabledReason = computed(() => fileUploadReason(access.data.value))
const query = useQuery({ queryKey: ['me'], queryFn: () => api.get<Record<string, unknown>>('/me/get') })
const form = reactive({ nickname: '', avatar: '', description: '', intro_image: '', intro_video: '', introduction_markdown: '' })
const slug = ref('')
const uploading = ref('')
const uploadError = ref('')
const profileSnapshot = ref('')
const fieldsDirty = ref(false)

function profileState() {
  return JSON.stringify(form)
}
const profileDirty = computed(() => Boolean(profileSnapshot.value) && profileState() !== profileSnapshot.value)
const hasUnsavedChanges = computed(() => profileDirty.value || fieldsDirty.value)

watch(() => query.data.value, (data) => {
  form.nickname = String(data?.nickname ?? '')
  form.avatar = String(data?.avatar ?? '')
  form.description = String(data?.description ?? '')
  form.intro_image = String(data?.intro_image ?? '')
  form.intro_video = String(data?.intro_video ?? '')
  form.introduction_markdown = String(data?.introduction_markdown ?? '')
  if (data?.slug) slug.value = String(data.slug)
  profileSnapshot.value = profileState()
}, { immediate: true })

const save = useMutation({
  mutationFn: () => api.post('/me/edit', {
    ...form,
    avatar: form.avatar || null,
    description: form.description || null,
    intro_image: form.intro_image || null,
    intro_video: form.intro_video || null,
    introduction_markdown: form.introduction_markdown || null,
  }),
  onSuccess: async () => {
    editor.value?.clearDraft()
    profileSnapshot.value = profileState()
    await client.invalidateQueries({ queryKey: ['me'] })
    feedback.success('资料已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const claim = useMutation({
  mutationFn: () => api.post<{ slug: string }>('/me/slug', { slug: slug.value.trim() }),
  onSuccess: async () => {
    await query.refetch()
    feedback.success('对象标识已认领')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const saveFields = useMutation({
  mutationFn: (values: Record<number, unknown>) => api.post('/me/fields', { values }),
  onSuccess: async () => {
    await query.refetch()
    feedback.success('对象字段已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const initials = computed(() => (form.nickname || 'L').slice(0, 1))
const customFields = computed(() => (query.data.value?.custom_fields ?? []) as EntityFieldDefinition[])
const customFieldValues = computed(() => (query.data.value?.custom_field_values ?? []) as Record<string, unknown>[])
const roleAssignments = computed(() => (query.data.value?.role_assignments ?? []) as RoleAssignment[])
const assignedRoles = computed(() => roleAssignments.value
  .map(assignment => assignment.role)
  .filter((role): role is RoleRecord => Boolean(role)))
const effectivePermissions = computed(() => (
  query.data.value?.effective_permissions ?? []
) as EffectivePermission[])

function setFieldsDirty(value: boolean) {
  fieldsDirty.value = value
  if (value) saveFields.reset()
}

async function upload(key: 'avatar' | 'intro_image' | 'intro_video', event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (uploadDisabledReason.value) {
    uploadError.value = uploadDisabledReason.value
    return
  }
  uploading.value = key
  uploadError.value = ''
  try {
    const result = await api.upload<Record<string, unknown>>(file)
    form[key] = String(result.url ?? result.path ?? result.id ?? '')
  } catch (error) {
    uploadError.value = friendlyError(error)
  } finally {
    uploading.value = ''
    ;(event.target as HTMLInputElement).value = ''
  }
}

function beforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => !hasUnsavedChanges.value || confirm('页面上还有未保存的修改，确认离开？'))
</script>

<template>
  <div class="profile-view">
    <AdminPageHeader title="我的资料" description="维护你在当前团队中的公开资料、对象字段，并查看当前角色权限。">
      <template #actions>
        <div class="profile-primary-actions">
          <LsButton
            type="submit"
            form="my-profile-form"
            :loading="save.isPending.value"
            :disabled="!form.nickname.trim() || Boolean(uploading)"
          >
            保存资料
          </LsButton>
        </div>
      </template>
    </AdminPageHeader>
    <section class="identity-card">
      <div class="avatar"><img v-if="form.avatar" :src="form.avatar" alt="当前成员头像"><span v-else>{{ initials }}</span></div>
      <div><p>当前成员</p><h1>{{ form.nickname || '未设置昵称' }}</h1><span>User #{{ query.data.value?.user_id ?? '—' }}</span></div>
    </section>

    <section class="panel self-identity" aria-labelledby="self-identity-title">
      <div class="section-heading"><div><h2 id="self-identity-title">我的对象标识</h2><p>用于对象引用和实体身份切换。</p></div><span>本人可见</span></div>
      <p class="muted">设置后，其他成员可以在 Markdown 中通过 @slug 引用你。标识首次确认后永久不变。</p>
      <div v-if="query.data.value?.slug" class="claimed"><span>已认领</span><strong>@{{ query.data.value.slug }}</strong><small>不可修改或释放</small></div>
      <form v-else class="claim-form" @submit.prevent="claim.mutate()">
        <label class="field"><span>我的 slug</span><NInput v-model:value="slug" placeholder="例如 zhang-san" autocapitalize="none" /></label>
        <LsButton type="submit" :loading="claim.isPending.value" :disabled="!slug.trim()">确认认领</LsButton>
      </form>
    </section>

    <form id="my-profile-form" class="panel profile-form" @submit.prevent="save.mutate()">
      <div class="section-heading">
        <div><h2>公开资料</h2><p>展示在当前团队中的名称、头像和介绍。</p></div>
      </div>
      <label class="field"><span>团队昵称</span><NInput v-model:value="form.nickname" autocomplete="name" maxlength="80" show-count /></label>
      <label class="field">
        <span>头像</span>
        <LsUploadField v-model="form.avatar" placeholder="图片 URL" button-label="上传图片" accept="image/*" :disabled="Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" :loading="uploading === 'avatar'" @change="upload('avatar', $event)" />
      </label>
      <label class="field"><span>简短介绍</span><NInput v-model:value="form.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="500" show-count /></label>
      <div class="media-row">
        <label class="field"><span>介绍图片</span><LsUploadField v-model="form.intro_image" placeholder="图片 URL" button-label="上传" accept="image/*" :disabled="Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" :show-reason="false" :loading="uploading === 'intro_image'" @change="upload('intro_image', $event)" /></label>
        <label class="field"><span>介绍视频</span><LsUploadField v-model="form.intro_video" placeholder="视频 URL" button-label="上传" accept="video/*" :disabled="Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" :show-reason="false" :loading="uploading === 'intro_video'" @change="upload('intro_video', $event)" /></label>
      </div>
      <p v-if="uploadError" class="feedback error" role="alert">{{ uploadError }}</p>
      <div class="field" role="group" aria-labelledby="profile-introduction-label">
        <span id="profile-introduction-label">详细介绍</span>
        <LsMarkdownEditor
          v-if="query.isSuccess.value"
          ref="editor"
          v-model="form.introduction_markdown"
          draft-key="my-profile"
          :search-entities="searchEntities"
          :upload-image="uploadMarkdownImage"
          :upload-disabled-reason="uploadDisabledReason"
          placeholder="写下你的详细介绍，输入 @ 可引用对象…"
        />
      </div>
    </form>

    <EntityFieldsCard
      v-if="query.data.value?.slug"
      :fields="customFields"
      :stored-values="customFieldValues"
      mode="self"
      :loading="query.isPending.value"
      :saving="saveFields.isPending.value"
      :success="saveFields.isSuccess.value"
      @save="saveFields.mutate"
      @dirty="setFieldsDirty"
    />

    <EntityPermissionsCard
      v-if="query.data.value?.slug"
      :assignments="roleAssignments"
      :roles="assignedRoles"
      :effective-permissions="effectivePermissions"
      :loading="query.isPending.value"
    />

    <section v-if="query.isSuccess.value && !query.data.value?.slug" class="identity-required" role="status">
      <strong>请先领取 slug</strong>
      <p>确认对象标识后，才能保存对象字段并查看当前角色权限。</p>
    </section>
  </div>
</template>

<style scoped>
.profile-view { min-width: 0; display: grid; gap: 22px; }
.profile-primary-actions { display: flex; }
.identity-card { display: flex; align-items: center; gap: 16px; padding: 5px 0 12px; }
.avatar { width: 64px; height: 64px; display: grid; place-items: center; overflow: hidden; border-radius: 12px; color: white; background: var(--primary); font-size: 1.35rem; font-weight: 800; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.identity-card p { margin: 0 0 4px; color: var(--text-tertiary); font-size: .75rem; }
.identity-card h1 { margin: 0 0 4px; font-size: 1.45rem; }
.identity-card span { color: var(--text-secondary); font-size: .82rem; }
.panel { display: grid; gap: 18px; padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.section-heading { display: flex; justify-content: space-between; gap: 16px; }
.section-heading p { max-width: 65ch; margin: 5px 0 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.55; }
.section-heading h2 { margin: 0; font-size: 1.05rem; }
.section-heading > span { color: var(--text-tertiary); font-size: .8rem; }
.field { display: grid; gap: 8px; min-width: 0; }
.field > span { color: var(--text-secondary); font-size: .875rem; font-weight: 650; }
.claim-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 12px; }
.claimed { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md); background: var(--surface-subtle); }
.claimed strong { color: var(--primary); }
.claimed span, .claimed small, .muted { color: var(--text-secondary); font-size: .85rem; }
.media-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.upload-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.upload-action { min-height: 36px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); background: var(--surface-subtle); font-size: .85rem; font-weight: 650; cursor: pointer; }
.upload-action.disabled { opacity: .48; cursor: not-allowed; }
.upload-action:focus-visible { outline: 3px solid color-mix(in srgb, var(--primary) 25%, transparent); outline-offset: 2px; }
.upload-action input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.feedback { margin: 0; padding: 11px 13px; border-radius: var(--radius-md); }
.feedback.access { color: var(--text-secondary); background: var(--surface-subtle); }
.identity-required { display: grid; gap: 5px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-subtle); }
.identity-required strong, .identity-required p { margin: 0; }
.identity-required p { color: var(--text-secondary); font-size: .85rem; line-height: 1.55; }
.error { color: var(--danger); background: color-mix(in srgb, var(--danger) 9%, transparent); }
@media (max-width: 680px) {
  .profile-view { padding-bottom: calc(76px + env(safe-area-inset-bottom)); }
  .profile-primary-actions { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--surface); border-top: 1px solid var(--border); }
  .profile-primary-actions > * { width: 100%; }
  .panel { padding: 17px; }
  .media-row, .upload-field, .claim-form { grid-template-columns: 1fr; }
  .claimed { align-items: flex-start; flex-direction: column; }
}
</style>
