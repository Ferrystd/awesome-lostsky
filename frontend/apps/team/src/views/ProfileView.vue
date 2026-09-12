<script setup lang="ts">
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Save } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { useUnsavedChangesGuard } from '../composables/useUnsavedChangesGuard'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import EntityPermissionsCard, {
  type EffectivePermission,
  type RoleAssignment,
  type RoleRecord,
} from '../components/EntityPermissionsCard.vue'
import EntityProfileFields from '../components/EntityProfileFields.vue'
import { resourceUploadReason, useTeamAccess } from '../lib/teamAccess'

const client = useQueryClient()
const editor = ref<InstanceType<typeof EntityProfileFields> | null>(null)
const access = useTeamAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const query = useQuery({ queryKey: ['me'], queryFn: () => api.get<Record<string, unknown>>('/me/get') })
const form = reactive({ nickname: '', avatar: '', description: '', intro_image: '', intro_video: '', introduction_markdown: '' })
const profileModel = computed({ get: () => form, set: value => Object.assign(form, value) })
const slug = ref('')
const uploading = ref(false)
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

useUnsavedChangesGuard(hasUnsavedChanges)
</script>

<template>
  <div class="profile-view">
    <AdminPageHeader title="我的资料" description="维护你在当前团队中的公开资料、对象字段，并查看当前角色权限（Permission）。">
      <template #actions>
        <div class="profile-primary-actions">
          <LsPagePrimaryAction
            :icon="Save"
            label="保存资料"
            type="submit"
            form="my-profile-form"
            :loading="save.isPending.value"
            :disabled="!form.nickname.trim() || Boolean(uploading)"
          />
        </div>
      </template>
    </AdminPageHeader>
    <section class="identity-card">
      <div class="avatar"><img v-if="form.avatar" :src="form.avatar" alt="当前成员头像"><span v-else>{{ initials }}</span></div>
      <div><p>当前成员</p><h1>{{ form.nickname || '未设置昵称' }}</h1><span>User #{{ query.data.value?.user_id ?? '—' }}</span></div>
    </section>

    <LsPanel><section class="self-identity" aria-labelledby="self-identity-title">
      <LsSectionHeader id="self-identity-title" title="我的对象标识" description="用于对象引用和人员身份切换。"><template #aside><span class="section-state">本人可见</span></template></LsSectionHeader>
      <p class="muted">设置后，其他成员可以在 Markdown 中通过 @slug 引用你。标识首次确认后永久不变。</p>
      <div v-if="query.data.value?.slug" class="claimed"><span>已认领</span><strong>@{{ query.data.value.slug }}</strong><small>不可修改或释放</small></div>
      <form v-else class="claim-form" @submit.prevent="claim.mutate()">
        <LsField label="我的 slug" for-id="profile-slug"><NInput id="profile-slug" v-model:value="slug" placeholder="例如 zhang-san" autocapitalize="none" /></LsField>
        <LsButton type="submit" :loading="claim.isPending.value" :disabled="!slug.trim()">确认认领</LsButton>
      </form>
    </section></LsPanel>

    <form id="my-profile-form" @submit.prevent="save.mutate()"><LsPanel><div class="profile-form">
      <LsSectionHeader title="公开资料" description="展示在当前团队中的名称、头像和介绍。" />
      <EntityProfileFields ref="editor" v-model="profileModel" v-model:uploading="uploading" draft-key="my-profile" id-prefix="my-profile" name-key="nickname" name-label="团队昵称" :upload-file="uploadFileUrl" :upload-disabled-reason="uploadDisabledReason" :editor-ready="query.isSuccess.value" />
    </div></LsPanel></form>

    <EntityFieldsCard
      v-if="query.data.value?.slug"
      :fields="customFields"
      :stored-values="customFieldValues"
      mode="self"
      :loading="query.isPending.value"
      :saving="saveFields.isPending.value"
      :success="saveFields.isSuccess.value"
      :upload-disabled-reason="uploadDisabledReason"
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
.self-identity, .profile-form { display: grid; gap: 18px; }
.section-state { color: var(--text-tertiary); font-size: .8rem; }
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
.identity-required { display: grid; gap: 5px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-subtle); }
.identity-required strong, .identity-required p { margin: 0; }
.identity-required p { color: var(--text-secondary); font-size: .85rem; line-height: 1.55; }
@media (max-width: 680px) {
  .profile-view { padding-bottom: calc(76px + env(safe-area-inset-bottom)); }
  .profile-primary-actions { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--surface); border-top: 1px solid var(--border); }
  .profile-primary-actions > * { width: 100%; }
  .media-row, .upload-field, .claim-form { grid-template-columns: 1fr; }
  .claimed { align-items: flex-start; flex-direction: column; }
}
</style>
