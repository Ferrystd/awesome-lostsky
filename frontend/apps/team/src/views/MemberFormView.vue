<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { identityUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import EntityPermissionsCard, {
  type PermissionGroup,
  type RoleAssignment,
  type RoleRecord,
} from '../components/EntityPermissionsCard.vue'
import MemberProfileFields from '../components/MemberProfileFields.vue'
import { useMemberProfileUpload } from '../composables/useMemberProfileUpload'
import { fileUploadReason, useTeamAccess } from '../lib/teamAccess'

interface MemberCapabilities {
  member_edit: boolean
  field_manage: boolean
  role_read: boolean
  role_write: boolean
  member_block: boolean
  member_search: boolean
  member_slug: boolean
  member_remove: boolean
  identity_assume: boolean
}

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const editor = ref<InstanceType<typeof MemberProfileFields> | null>(null)
const access = useTeamAccess()
const uploadDisabledReason = computed(() => fileUploadReason(access.data.value))
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  user_id: null as number | null,
  nickname: '',
  avatar: '',
  description: '',
  intro_image: '',
  intro_video: '',
  introduction_markdown: '',
})
const profileModel = computed({ get: () => form, set: value => Object.assign(form, value) })
const { uploading, uploadError, upload } = useMemberProfileUpload(form, uploadDisabledReason)
const identityForm = reactive({ slug: '', search_override: 'inherit' as 'inherit' | '0' | '1' })
const profileSnapshot = ref('')
const fieldsDirty = ref(false)
const rolesDirty = ref(false)

const detail = useQuery({
  queryKey: computed(() => ['member', id.value]),
  queryFn: () => api.get<Record<string, unknown>>('/member/get', { member_id: id.value }),
  enabled: editing,
})
const memberSlug = computed(() => String(detail.data.value?.slug ?? ''))
const capabilities = computed<MemberCapabilities>(() => ({
  member_edit: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_edit),
  field_manage: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.field_manage),
  role_read: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.role_read),
  role_write: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.role_write),
  member_block: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_block),
  member_search: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_search),
  member_slug: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_slug),
  member_remove: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_remove),
  identity_assume: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.identity_assume),
}))
const canEditProfile = computed(() => !editing.value || capabilities.value.member_edit)
const managementVisible = computed(() => editing.value && (
  capabilities.value.member_block
  || capabilities.value.member_search
  || capabilities.value.member_slug
  || capabilities.value.member_remove
  || capabilities.value.identity_assume
))
const fields = useQuery({
  queryKey: ['entity-fields', 'entity'],
  queryFn: () => api.get<EntityFieldDefinition[]>('/entityField/index', { entity_type: 'entity' }),
  enabled: computed(() => editing.value && capabilities.value.field_manage),
})
const fieldValues = useQuery({
  queryKey: computed(() => ['entity-field-values', memberSlug.value]),
  queryFn: () => api.get<Record<string, unknown>[]>('/entityField/values', { slug: memberSlug.value }),
  enabled: computed(() => editing.value && capabilities.value.field_manage && Boolean(memberSlug.value)),
})
const roles = useQuery({
  queryKey: ['roles'],
  queryFn: () => api.get<RoleRecord[]>('/role/index'),
  enabled: computed(() => editing.value && capabilities.value.role_read),
})
const roleAssignments = useQuery({
  queryKey: computed(() => ['entity-roles', memberSlug.value]),
  queryFn: () => api.get<RoleAssignment[]>('/entityRole/index', { slug: memberSlug.value }),
  enabled: computed(() => editing.value && capabilities.value.role_read && Boolean(memberSlug.value)),
})
const permissionCatalog = useQuery({
  queryKey: ['permission-catalog'],
  queryFn: () => api.get<{ groups: PermissionGroup[] }>('/rolePermission/catalog'),
  enabled: computed(() => editing.value && capabilities.value.role_read),
})
const rolesWithPermissions = useQuery({
  queryKey: computed(() => ['roles', 'permissions', (roles.data.value ?? []).map(role => role.id).join(',')]),
  queryFn: async () => Promise.all((roles.data.value ?? []).map(async role => ({
    ...role,
    permissions: await api.get<Array<{ permission_key?: string }>>('/rolePermission/index', { role_id: role.id }),
  }))),
  enabled: computed(() => editing.value && capabilities.value.role_read && Boolean(roles.data.value?.length)),
})

function profileState() {
  return JSON.stringify(form)
}
const profileDirty = computed(() => Boolean(profileSnapshot.value) && profileState() !== profileSnapshot.value)
const hasUnsavedChanges = computed(() => profileDirty.value || fieldsDirty.value || rolesDirty.value)

watch(() => detail.data.value, (data) => {
  if (!data) return
  form.user_id = Number(data.user_id || 0) || null
  form.nickname = String(data.nickname ?? '')
  form.avatar = String(data.avatar ?? '')
  form.description = String(data.description ?? '')
  form.intro_image = String(data.intro_image ?? '')
  form.intro_video = String(data.intro_video ?? '')
  form.introduction_markdown = String(data.introduction_markdown ?? '')
  identityForm.slug = String(data.slug ?? '')
  identityForm.search_override = data.search_override == null ? 'inherit' : String(Number(data.search_override)) as '0' | '1'
  profileSnapshot.value = profileState()
}, { immediate: true })

const save = useMutation({
  mutationFn: () => api.post(editing.value ? '/member/edit' : '/member/add', {
    ...(editing.value ? { member_id: id.value } : { user_id: form.user_id }),
    nickname: form.nickname.trim(),
    avatar: form.avatar || null,
    description: form.description || null,
    intro_image: form.intro_image || null,
    intro_video: form.intro_video || null,
    introduction_markdown: form.introduction_markdown || null,
  }),
  onSuccess: async () => {
    editor.value?.clearDraft()
    profileSnapshot.value = profileState()
    await queryClient.invalidateQueries({ queryKey: ['members'] })
    feedback.success(editing.value ? '成员资料已保存' : '成员已添加')
    await router.push('/members')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const claim = useMutation({
  mutationFn: () => api.post<{ slug: string }>('/member/slug', { member_id: id.value, slug: identityForm.slug.trim() }),
  onSuccess: async () => {
    await detail.refetch()
    feedback.success('对象标识已确认')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const saveSearch = useMutation({
  mutationFn: () => api.post('/member/search', { member_id: id.value, search_override: identityForm.search_override === 'inherit' ? null : Number(identityForm.search_override) }),
  onSuccess: async () => {
    await detail.refetch()
    feedback.success('成员搜索设置已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const saveFields = useMutation({
  mutationFn: (values: Record<number, unknown>) => api.post('/entityField/values', { slug: memberSlug.value, values }),
  onSuccess: async () => {
    await fieldValues.refetch()
    feedback.success('对象字段已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const saveRoles = useMutation({
  mutationFn: (role_ids: number[]) => api.post('/entityRole/save', { slug: memberSlug.value, role_ids }),
  onSuccess: async () => {
    await roleAssignments.refetch()
    feedback.success('角色分配已保存')
  },
  onError: error => feedback.error(friendlyError(error)),
})
const memberAction = useMutation({
  mutationFn: (endpoint: string) => api.post(endpoint, { member_id: id.value }),
  onSuccess: async (_, endpoint) => {
    await queryClient.invalidateQueries({ queryKey: ['members'] })
    if (endpoint === '/member/remove') {
      await router.push('/members')
    } else {
      await detail.refetch()
    }
    feedback.success(endpoint === '/member/remove'
      ? '成员已移出团队'
      : endpoint === '/member/block' ? '成员已封禁' : '成员封禁已解除')
  },
  onError: error => feedback.error(friendlyError(error)),
})

const searchOptions = [
  { label: '继承团队默认值', value: 'inherit' },
  { label: '禁止被搜索', value: '0' },
  { label: '允许被搜索', value: '1' },
]

function confirmAction(endpoint: string, message: string) {
  if (confirm(message)) memberAction.mutate(endpoint)
}

function switchIdentity() {
  if (!memberSlug.value) return
  location.assign(identityUrl(location.href, memberSlug.value))
}

function setFieldsDirty(value: boolean) {
  fieldsDirty.value = value
  if (value) saveFields.reset()
}

function setRolesDirty(value: boolean) {
  rolesDirty.value = value
  if (value) saveRoles.reset()
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
  <div class="member-form-view">
    <AdminPageHeader
      :title="editing ? '编辑成员' : '添加成员'"
      :description="editing ? '维护成员资料、对象字段、角色权限与管理状态。' : '先将已有用户加入当前团队，再维护其公开资料。'"
      back-to="/members"
      back-label="返回成员列表"
    >
      <template v-if="canEditProfile" #actions>
        <div class="member-primary-actions">
          <LsButton type="button" variant="secondary" @click="router.push('/members')">取消</LsButton>
          <LsButton
            type="submit"
            form="member-profile-form"
            :loading="save.isPending.value"
            :disabled="!form.nickname.trim() || (!editing && !form.user_id) || Boolean(uploading)"
          >
            {{ editing ? '保存成员' : '添加成员' }}
          </LsButton>
        </div>
      </template>
    </AdminPageHeader>

    <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
    <form v-else id="member-profile-form" class="member-form" @submit.prevent="save.mutate()">
      <LsPanel><section class="member-profile-section">
        <div class="section-heading">
          <div><h2>成员公开资料</h2><p>展示在当前团队中的名称、头像和介绍。</p></div>
          <span v-if="editing">成员 #{{ id }}</span>
        </div>

        <template v-if="canEditProfile">
          <LsField v-if="!editing" label="用户 ID" for-id="member-user-id" required><NInputNumber id="member-user-id" v-model:value="form.user_id" :min="1" :precision="0" class="control" placeholder="输入 LostSky 用户 ID" /></LsField>
          <MemberProfileFields
            ref="editor"
            v-model="profileModel"
            :draft-key="`member-profile:${editing ? id : 'new'}`"
            :upload-disabled-reason="uploadDisabledReason"
            :uploading="uploading"
            :editor-ready="!editing || detail.isSuccess.value"
            @upload="upload"
          ><template #error><LsInlineError v-if="uploadError" :message="uploadError" /></template></MemberProfileFields>
        </template>
        <dl v-else class="readonly-profile">
          <div><dt>团队昵称</dt><dd>{{ form.nickname || '未填写' }}</dd></div>
          <div><dt>头像</dt><dd>{{ form.avatar || '未填写' }}</dd></div>
          <div><dt>简短介绍</dt><dd>{{ form.description || '未填写' }}</dd></div>
          <div><dt>介绍图片</dt><dd>{{ form.intro_image || '未填写' }}</dd></div>
          <div><dt>介绍视频</dt><dd>{{ form.intro_video || '未填写' }}</dd></div>
          <div class="readonly-markdown"><dt>详细介绍</dt><dd><LsMarkdownRenderer :content="form.introduction_markdown || '未填写'" /></dd></div>
        </dl>
      </section></LsPanel>

    </form>

    <EntityFieldsCard
      v-if="editing && capabilities.field_manage && memberSlug"
      :fields="fields.data.value ?? []"
      :stored-values="fieldValues.data.value ?? []"
      mode="manager"
      :loading="fields.isPending.value || fieldValues.isPending.value"
      :saving="saveFields.isPending.value"
      :error="fields.error.value || fieldValues.error.value"
      :success="saveFields.isSuccess.value"
      @save="saveFields.mutate"
      @dirty="setFieldsDirty"
    />

    <EntityPermissionsCard
      v-if="editing && capabilities.role_read && memberSlug"
      :assignments="roleAssignments.data.value ?? []"
      :roles="rolesWithPermissions.data.value ?? roles.data.value ?? []"
      :catalog="permissionCatalog.data.value?.groups ?? []"
      :can-edit="capabilities.role_write"
      :loading="roles.isPending.value || (Boolean(roles.data.value?.length) && rolesWithPermissions.isPending.value) || roleAssignments.isPending.value || permissionCatalog.isPending.value"
      :saving="saveRoles.isPending.value"
      :error="roles.error.value || rolesWithPermissions.error.value || roleAssignments.error.value || permissionCatalog.error.value"
      :success="saveRoles.isSuccess.value"
      @save="saveRoles.mutate"
      @dirty="setRolesDirty"
    />

    <section
      v-if="editing && !memberSlug && (capabilities.field_manage || capabilities.role_read)"
      class="identity-required"
      role="status"
    >
      <strong>请先补全成员 slug</strong>
      <p>确认对象标识后，才能维护该成员的对象字段和角色权限。</p>
    </section>

    <LsPanel
      v-if="managementVisible && detail.data.value"
      aria-labelledby="member-management-title"
    >
      <section class="management">
      <div class="section-heading">
        <div><h2 id="member-management-title">管理操作</h2><p>成员状态、搜索范围与实体身份操作。</p></div>
        <span>{{ Number(detail.data.value.is_blocked) ? '已封禁' : '正常' }}</span>
      </div>
      <form v-if="!detail.data.value.slug && capabilities.member_slug" class="inline-form" @submit.prevent="claim.mutate()">
        <LsField label="补全对象标识" for-id="member-slug"><NInput id="member-slug" v-model:value="identityForm.slug" placeholder="例如 zhang-san" autocapitalize="none" /></LsField>
        <LsButton type="submit" variant="secondary" :loading="claim.isPending.value" :disabled="!identityForm.slug.trim()">确认标识</LsButton>
      </form>
      <div v-else class="identity-status"><span>对象标识</span><strong>@{{ detail.data.value.slug }}</strong><small>创建后不可修改</small></div>

      <form v-if="capabilities.member_search" class="inline-form search-form" @submit.prevent="saveSearch.mutate()">
        <LsField label="成员搜索状态" for-id="member-search"><NSelect id="member-search" v-model:value="identityForm.search_override" :options="searchOptions" /></LsField>
        <LsButton type="submit" variant="secondary" :loading="saveSearch.isPending.value" :disabled="!detail.data.value.slug">保存搜索设置</LsButton>
      </form>

      <div class="management-actions">
        <LsButton
          v-if="capabilities.member_block && !Number(detail.data.value.is_blocked)"
          type="button"
          variant="secondary"
          :loading="memberAction.isPending.value"
          @click="confirmAction('/member/block', '确认封禁该成员？封禁后该实体暂时无法使用。')"
        >
          封禁成员
        </LsButton>
        <LsButton
          v-if="capabilities.member_block && Number(detail.data.value.is_blocked)"
          type="button"
          variant="secondary"
          :loading="memberAction.isPending.value"
          @click="confirmAction('/member/unblock', '确认解除该成员的封禁？')"
        >
          解除封禁
        </LsButton>
        <LsButton v-if="capabilities.identity_assume && memberSlug" type="button" variant="secondary" @click="switchIdentity">
          切换为该实体
        </LsButton>
      </div>

      <div v-if="capabilities.member_remove" class="danger-zone">
        <div><strong>移出团队</strong><p>移出后成员资料停止使用，已占用的对象标识仍会保留。</p></div>
        <LsButton
          type="button"
          variant="danger"
          :loading="memberAction.isPending.value"
          @click="confirmAction('/member/remove', '确认将该成员移出团队？此操作会删除成员资料和岗位关联。')"
        >
          移出成员
        </LsButton>
      </div>
      </section>
    </LsPanel>
  </div>
</template>

<style scoped>
.member-form-view, .member-form { min-width: 0; display: grid; gap: 22px; }
.member-primary-actions { display: flex; gap: 10px; }
.member-profile-section, .management { display: grid; gap: 18px; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.section-heading p { max-width: 65ch; margin: 5px 0 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.55; }
.section-heading h2 { margin: 0; font-size: 1.05rem; }
.section-heading > span { color: var(--text-tertiary); font-size: .8rem; }
.control { width: 100%; }
.media-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.upload-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.upload-action { min-height: 36px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); background: var(--surface-subtle); font-size: .85rem; font-weight: 650; cursor: pointer; }
.upload-action:hover { border-color: var(--primary); color: var(--primary); }
.upload-action.disabled { opacity: .48; cursor: not-allowed; }
.upload-action:focus-visible { outline: 3px solid color-mix(in srgb, var(--primary) 25%, transparent); outline-offset: 2px; }
.upload-action input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.post-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.readonly-profile { display: grid; margin: 0; border-top: 1px solid var(--border); }
.readonly-profile > div { display: grid; grid-template-columns: minmax(9rem, .36fr) minmax(0, 1fr); gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.readonly-profile dt { color: var(--text-secondary); font-size: .82rem; font-weight: 650; }
.readonly-profile dd { min-width: 0; margin: 0; overflow-wrap: anywhere; line-height: 1.55; }
.readonly-markdown { align-items: start; }
.role-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.role-summary > span { padding: 7px 10px; border-radius: var(--radius-md); color: var(--text-secondary); background: var(--surface-subtle); font-size: .85rem; }
.identity-required { display: grid; gap: 5px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-subtle); }
.identity-required strong, .identity-required p { margin: 0; }
.identity-required p { color: var(--text-secondary); font-size: .85rem; line-height: 1.55; }
.inline-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 12px; }
.identity-status { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md); background: var(--surface-subtle); }
.identity-status span, .identity-status small, .muted { color: var(--text-secondary); font-size: .85rem; }
.identity-status strong { color: var(--primary); }
.management-actions { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 2px; }
.danger-zone { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
.danger-zone strong, .danger-zone p { margin: 0; }
.danger-zone p { max-width: 55ch; margin-top: 4px; color: var(--text-secondary); font-size: .82rem; line-height: 1.55; }
@media (max-width: 680px) {
  .member-form-view { padding-bottom: calc(76px + env(safe-area-inset-bottom)); }
  .member-primary-actions { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--surface); border-top: 1px solid var(--border); }
  .member-primary-actions > * { width: 100%; }
  .media-row, .post-grid, .inline-form, .upload-field { grid-template-columns: 1fr; }
  .readonly-profile > div { grid-template-columns: 1fr; gap: 5px; }
  .identity-status { align-items: flex-start; grid-template-columns: 1fr; }
  .management-actions { display: grid; }
  .danger-zone { align-items: stretch; flex-direction: column; }
  .danger-zone :deep(.ls-button) { width: 100%; }
}
</style>
