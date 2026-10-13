<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft, Eye, UserPlus } from '@lucide/vue'

import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import { identityUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import JoinApplicationFields, { type JoinField, type FieldValue } from '../components/JoinApplicationFields.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { NFlex, NInput, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import EntityPermissionsCard, { type AdvancedPermissionItem, type PermissionGroup, type RoleAssignment, type RoleRecord } from '../components/EntityPermissionsCard.vue'
import { memberStatusCode, memberStatusLabel } from '../lib/memberStatus'
import { fileAvailabilityReason, type FileUploadAvailability, hasPermission, permissionReason, resourceUploadReason, useTeamAccess } from '../lib/teamAccess'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

interface MemberCapabilities {
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
const access = useTeamAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => route.path === '/member-edit')
const form = reactive({
  join_code: '',
})
const fillJoinForm = ref(false)
const joinValues = ref<Record<string, FieldValue>>({})
const draftKey = () => teamDraftScope('MemberFormView', id.value)
const draft = useQueryDraft({ key: draftKey, read: () => ({ ...form, fillJoinForm: fillJoinForm.value, joinValues: joinValues.value }), apply: ({ fillJoinForm: fill, joinValues: values, ...value }) => { Object.assign(form, value); fillJoinForm.value = fill; joinValues.value = values } })
const uploading = ref(false)
const identityForm = reactive({
  slug: '',
  search_override: 'inherit' as 'inherit' | '0' | '1',
})
const slugDraft = useQueryDraft({ key: draftKey, read: () => identityForm.slug, apply: value => { identityForm.slug = value } })
const searchDraft = useQueryDraft({ key: draftKey, read: () => identityForm.search_override, apply: value => { identityForm.search_override = value } })
const fieldsDirty = ref(false)
const rolesDirty = ref(false)

const detail = useQuery({
  queryKey: computed(() => ['member', id.value]),
  queryFn: () => api.get<Record<string, unknown>>('/member/get', { member_id: id.value }),
  enabled: computed(() => editing.value && Number.isInteger(id.value) && id.value > 0),
})
const memberSlug = computed(() => String(detail.data.value?.slug ?? ''))
const lifecycleStatus = computed(() => (detail.data.value ? memberStatusCode(detail.data.value) : 'active'))
const capabilities = computed<MemberCapabilities>(() => ({
  field_manage: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.field_manage),
  role_read: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.role_read),
  role_write: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.role_write),
  member_block: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_block),
  member_search: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_search),
  member_slug: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_slug),
  member_remove: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.member_remove),
  identity_assume: Boolean((detail.data.value?.capabilities as Partial<MemberCapabilities> | undefined)?.identity_assume),
}))
const canInvite = computed(() => hasPermission(access.data.value, 'team.member.invite'))
const validJoinCode = computed(() => /^[A-F0-9]{20}$/i.test(form.join_code.trim()))
const joinForm = useQuery({
  queryKey: ['member-join-form'],
  queryFn: () => api.get<{ fields: JoinField[]; file_upload: FileUploadAvailability }>('/member/joinForm'),
  enabled: computed(() => !editing.value && fillJoinForm.value && canInvite.value),
})
const joinFormReady = computed(() => !fillJoinForm.value || (joinForm.isSuccess.value && !joinForm.isFetching.value && !(joinForm.data.value?.fields ?? []).some(field => {
  if (!field.is_apply_required) return false
  const value = joinValues.value[field.field_key || String(field.id ?? '')]
  return Array.isArray(value) ? value.length === 0 : value == null || String(value).trim() === ''
})))
async function uploadJoinFile(file: File) {
  const body = new FormData()
  body.append('file', file)
  const result = await api.post<{ id: number }>('/member/joinUpload', body)
  await joinForm.refetch()
  return String(result.id)
}
useRouteAccess(computed(() => editing.value && detail.data.value?.capabilities && !detail.isError.value && !capabilities.value.role_read ? permissionReason('team.role.read') : ''))
const fields = useQuery({
  queryKey: ['entity-fields', 'entity'],
  queryFn: () =>
    api.get<EntityFieldDefinition[]>('/entityField/index', {
      entity_type: 'entity',
    }),
  enabled: computed(() => editing.value && capabilities.value.field_manage),
})
const fieldValues = useQuery({
  queryKey: computed(() => ['entity-field-values', memberSlug.value]),
  queryFn: () =>
    api.get<Record<string, unknown>[]>('/entityField/values', {
      slug: memberSlug.value,
    }),
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
  queryFn: () =>
    api.get<{
      groups: PermissionGroup[]
      advanced_items: AdvancedPermissionItem[]
    }>('/rolePermission/catalog'),
  enabled: computed(() => editing.value && capabilities.value.role_read),
})
const rolesWithPermissions = useQuery({
  queryKey: computed(() => ['roles', 'permissions', (roles.data.value ?? []).map((role) => role.id).join(',')]),
  queryFn: async () =>
    Promise.all(
      (roles.data.value ?? []).map(async (role) => ({
        ...role,
        permissions: await api.get<Array<{ permission_key?: string }>>('/rolePermission/index', { role_id: role.id }),
      })),
    ),
  enabled: computed(() => editing.value && capabilities.value.role_read && Boolean(roles.data.value?.length)),
})

const hasUnsavedChanges = computed(() => (!editing.value && Boolean(form.join_code || fillJoinForm.value || Object.keys(joinValues.value).length)) || draft.dirty.value || slugDraft.dirty.value || searchDraft.dirty.value || fieldsDirty.value || rolesDirty.value)

watch(
  () => detail.data.value,
  (data) => {
    if (!data) return
    slugDraft.hydrate(String(data.slug ?? ''))
    searchDraft.hydrate(data.search_override == null ? 'inherit' : (String(Number(data.search_override)) as '0' | '1'))
  },
  { immediate: true },
)

const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const form = submitted.value
    await api.post('/member/add', { join_code: form.join_code.trim().toUpperCase(), ...(form.fillJoinForm ? { join_form: { values: form.joinValues } } : {}) })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.accept(submitted)) return
    if (!editing.value && !draft.dirty.value) {
      form.join_code = ''
      fillJoinForm.value = false
      joinValues.value = {}
      draft.reset()
    }
    await queryClient.invalidateQueries({ queryKey: ['members'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    feedback.success('成员已添加')
    if (!hasUnsavedChanges.value) await router.push('/members')
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
const claim = useMutation({
  mutationFn: async () => {
    const submitted = slugDraft.capture()
    await
    api.post<{ slug: string }>('/member/slug', {
      member_id: id.value,
      slug: submitted.value.trim(),
    })
    return submitted
  },
  onSuccess: async submitted => {
    if (!slugDraft.accept(submitted)) return
    await detail.refetch()
    if (!slugDraft.isCurrent(submitted) || slugDraft.dirty.value) return
    feedback.success('对象标识已确认')
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
const saveSearch = useMutation({
  mutationFn: async () => {
    const submitted = searchDraft.capture()
    await
    api.post('/member/search', {
      member_id: id.value,
      search_override: submitted.value === 'inherit' ? null : Number(submitted.value),
    })
    return submitted
  },
  onSuccess: async submitted => {
    if (!searchDraft.accept(submitted)) return
    await detail.refetch()
    if (!searchDraft.isCurrent(submitted) || searchDraft.dirty.value) return
    feedback.success('成员搜索设置已保存')
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
const saveFields = useMutation({
  mutationFn: async (values: Record<number, unknown>) => {
    const submitted = draft.capture()
    await api.post('/entityField/values', { slug: memberSlug.value, values })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.isCurrent(submitted)) return

    await fieldValues.refetch()
    if (!draft.isCurrent(submitted)) return
    feedback.success('对象字段已保存')
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
const saveRoles = useMutation({
  mutationFn: async (role_ids: number[]) => {
    const submitted = draft.capture()
    await api.post('/entityRole/save', { slug: memberSlug.value, role_ids })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.isCurrent(submitted)) return

    await roleAssignments.refetch()
    if (!draft.isCurrent(submitted)) return
    feedback.success('角色分配已保存')
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
const memberAction = useMutation({
  mutationFn: async (endpoint: string) => {
    const submitted = draft.capture()
    await api.post(endpoint, { member_id: id.value })
    return submitted
  },
  onSuccess: async (submitted, endpoint) => {
    if (!draft.isCurrent(submitted)) return
    await queryClient.invalidateQueries({ queryKey: ['members'] })
    if (!draft.isCurrent(submitted)) return
    await detail.refetch()
    if (!draft.isCurrent(submitted)) return
    feedback.success(endpoint === '/memberDeparture/depart' ? '成员已离职' : endpoint === '/member/block' ? '成员已封禁' : '成员封禁已解除')
  },
  onError: (error) => feedback.error(friendlyError(error)),
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
  if (value && !saveFields.isPending.value) saveFields.reset()
}

function setRolesDirty(value: boolean) {
  rolesDirty.value = value
  if (value && !saveRoles.isPending.value) saveRoles.reset()
}

useUnsavedChangesGuard(hasUnsavedChanges, { shouldConfirm: teamDraftNavigationChanged })

const submitReason = computed(() => {
  if (editing.value) return '请在人员资料页维护成员资料'
  if (!canInvite.value) return permissionReason('team.member.invite')
  if (save.isPending.value) return '正在保存成员，请稍候'
  if (uploading.value) return '文件正在上传，请稍候'
  if (!form.join_code.trim()) return '请填写个人入队码'
  if (!validJoinCode.value) return '请填写有效的 20 位个人入队码'
  if (fillJoinForm.value) {
    if (joinForm.isError.value) return '入职表单加载失败，请稍后再试或关闭代填'
    if (!joinForm.isSuccess.value || joinForm.isFetching.value) return '正在读取入职表单，请稍候'
    if (!joinFormReady.value) return '请补齐入职表单必填项'
  }
  return ''
})

function submit() {
  if (submitReason.value) return feedback.info(submitReason.value)
  save.mutate()
}
</script>

<template>
  <LsFormPage :title="editing ? '管理成员' : '添加成员'" :description="editing ? '管理成员状态、对象字段与角色权限。' : '填写对方的个人入队码，直接加入当前团队。'">
    <template #actions>
      <LsPageLink to="/members" :icon="ArrowLeft" label="返回成员列表" />
      <LsFormActions v-if="!editing">
          <LsPageLink to="/members" :icon="ArrowLeft" label="取消" />
          <LsPagePrimaryAction :icon="UserPlus" label="添加成员" type="submit" form="member-profile-form" :loading="save.isPending.value" :disabled="Boolean(submitReason)" :disabled-reason="submitReason" />
        </LsFormActions>
    </template>

    <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
    <LsInlineError v-else-if="editing && (!Number.isInteger(id) || id <= 0)" message="缺少有效的成员编号，请返回成员列表重新选择。" />
    <LsAsyncState v-else-if="editing && detail.isPending.value" state="loading" aria-label="正在读取成员" />
    <LsSectionHeader v-else-if="editing && detail.data.value" :title="String(detail.data.value.name || `成员 #${id}`)" description="名称、头像和介绍统一在人员资料页维护。">
      <template #aside>
        <LsPageLink v-if="detail.data.value.entity_id" :to="`/entity?id=${detail.data.value.entity_id}`" :icon="Eye" label="查看人员资料" />
        <LsButton v-else variant="ghost" disabled disabled-reason="该成员缺少人员标识，请联系管理员检查。"><template #icon><Eye :size="16" /></template>查看人员资料</LsButton>
      </template>
    </LsSectionHeader>
    <form v-else-if="!editing" id="member-profile-form" class="member-form" @submit.prevent="submit">
      <LsPanel>
        <NFlex vertical size="large">
        <LsField label="个人入队码" for-id="member-join-code" hint="请对方在账号的团队选择页生成入队码，30 分钟内有效，成功加入后失效。" required><LsInput id="member-join-code" v-model="form.join_code" :disabled="save.isPending.value" autocomplete="off" spellcheck="false" placeholder="粘贴对方的个人入队码" required /></LsField>
        <LsSwitchField v-model="fillJoinForm" label="代填入职表单" description="可选。填写后随成员一并保存，无需再次审核；不代填也可直接添加成员。" :disabled="save.isPending.value || uploading" />
        <template v-if="fillJoinForm">
          <LsAsyncState v-if="joinForm.isPending.value" state="loading" aria-label="正在读取入职表单" />
          <LsInlineError v-else-if="joinForm.isError.value" :message="friendlyError(joinForm.error.value)" />
          <template v-else>
            <LsEmptyState v-if="!joinForm.data.value?.fields.length" :source="joinForm.data.value?.fields" title="暂无可代填的入职字段" description="可以直接添加成员。需要收集资料时，请先在入职字段中配置。" />
            <JoinApplicationFields v-else v-model="joinValues" v-model:uploading="uploading" :fields="joinForm.data.value?.fields ?? []" :upload-file="uploadJoinFile" :upload-disabled-reason="fileAvailabilityReason(joinForm.data.value?.file_upload)" :disabled="save.isPending.value" />
          </template>
        </template>
        </NFlex>
      </LsPanel>
    </form>

    <EntityFieldsCard :key="`${draftKey()}:fields`" v-if="editing && capabilities.field_manage && memberSlug" :fields="fields.data.value ?? []" :stored-values="fieldValues.data.value ?? []" mode="manager" :loading="fields.isPending.value || fieldValues.isPending.value" :saving="saveFields.isPending.value" :upload-disabled-reason="uploadDisabledReason" :error="fields.error.value || fieldValues.error.value" :success="saveFields.isSuccess.value" @save="saveFields.mutate" @dirty="setFieldsDirty" />
    <LsPanel v-else-if="editing && !capabilities.field_manage">
      <LsSectionHeader title="对象字段" description="按当前团队配置维护该成员的对象字段。" />
      <LsDescriptionList
        ><dt>数据</dt>
        <dd>-</dd></LsDescriptionList
      >
    </LsPanel>

    <EntityPermissionsCard :key="`${draftKey()}:roles`" v-if="editing && capabilities.role_read && memberSlug" :assignments="roleAssignments.data.value ?? []" :roles="rolesWithPermissions.data.value ?? roles.data.value ?? []" :catalog="permissionCatalog.data.value?.groups ?? []" :advanced-catalog="permissionCatalog.data.value?.advanced_items ?? []" :can-edit="capabilities.role_write" :edit-reason="permissionReason('team.role.write')" :loading="roles.isPending.value || (Boolean(roles.data.value?.length) && rolesWithPermissions.isPending.value) || roleAssignments.isPending.value || permissionCatalog.isPending.value" :saving="saveRoles.isPending.value" :error="roles.error.value || rolesWithPermissions.error.value || roleAssignments.error.value || permissionCatalog.error.value" :success="saveRoles.isSuccess.value" @save="saveRoles.mutate" @dirty="setRolesDirty" />
    <LsEmptyState :source="roles.data.value" :access-reason="permissionReason('team.role.read')" v-else-if="editing && !capabilities.role_read" title="暂无角色与权限" description="当前没有角色数据。" />

    <section v-if="editing && !memberSlug && (capabilities.field_manage || capabilities.role_read)" class="identity-required" role="status">
      <strong>请先补全成员 slug</strong>
      <p>确认对象标识后，才能维护该成员的对象字段和角色权限。</p>
    </section>

    <LsPanel v-if="editing && detail.data.value" aria-labelledby="member-management-title">
      <section class="management">
        <LsSectionHeader id="member-management-title" title="管理操作" description="成员状态、搜索范围与人员身份操作。"
          ><template #aside
            ><span class="section-state">{{ memberStatusLabel(detail.data.value) }}</span></template
          ></LsSectionHeader
        >
        <form v-if="!detail.data.value.slug" class="inline-form" @submit.prevent="capabilities.member_slug && claim.mutate()">
          <LsField label="补全对象标识" for-id="member-slug"><NInput id="member-slug" v-model:value="identityForm.slug" placeholder="例如 zhang-san" autocapitalize="none" /></LsField>
          <LsButton type="submit" variant="secondary" :loading="claim.isPending.value" :disabled="!capabilities.member_slug || !identityForm.slug.trim()" :disabled-reason="!capabilities.member_slug ? permissionReason('team.member.update') : undefined">确认标识</LsButton>
        </form>
        <div v-else class="identity-status">
          <span>对象标识</span><strong>@{{ detail.data.value.slug }}</strong
          ><small>创建后不可修改</small>
        </div>

        <form class="inline-form search-form" @submit.prevent="capabilities.member_search && saveSearch.mutate()">
          <LsField label="成员搜索状态" for-id="member-search"><NSelect id="member-search" v-model:value="identityForm.search_override" :options="searchOptions" :disabled="!capabilities.member_search" /></LsField>
          <LsButton type="submit" variant="secondary" :loading="saveSearch.isPending.value" :disabled="!capabilities.member_search || !detail.data.value.slug" :disabled-reason="!capabilities.member_search ? permissionReason('team.member.update') : undefined">保存搜索设置</LsButton>
        </form>

        <div class="management-actions">
          <LsButton v-if="lifecycleStatus === 'active'" type="button" variant="secondary" :loading="memberAction.isPending.value" :disabled="!capabilities.member_block" :disabled-reason="!capabilities.member_block ? permissionReason('team.member.update') : undefined" @click="confirmAction('/member/block', '确认封禁该成员？封禁后该人员暂时无法使用。')"> 封禁成员 </LsButton>
          <LsButton v-if="lifecycleStatus === 'blocked'" type="button" variant="secondary" :loading="memberAction.isPending.value" :disabled="!capabilities.member_block" :disabled-reason="!capabilities.member_block ? permissionReason('team.member.update') : undefined" @click="confirmAction('/member/unblock', '确认解除该成员的封禁？')"> 解除封禁 </LsButton>
          <LsButton v-if="memberSlug" type="button" variant="secondary" :disabled="!capabilities.identity_assume" :disabled-reason="!capabilities.identity_assume ? permissionReason(`identity.member.${memberSlug}.assume`) : undefined" @click="switchIdentity"> 切换为该人员 </LsButton>
        </div>

        <div v-if="lifecycleStatus !== 'departed'" class="danger-zone">
          <div>
            <strong>离职</strong>
            <p>确认后成员立即进入已离队状态，现有会话失效；资料、角色、对象标识和全部业务关系都会保留。</p>
          </div>
          <LsButton type="button" variant="danger" class="member-depart-action" :loading="memberAction.isPending.value" :disabled="!capabilities.member_remove" :disabled-reason="!capabilities.member_remove ? permissionReason('team.member.remove') : undefined" @click="confirmAction('/memberDeparture/depart', '确认将该成员设为已离职？操作后该成员的现有会话会立即失效，且不再等待审核。')"> 离职 </LsButton>
        </div>
      </section>
    </LsPanel>
  </LsFormPage>
</template>

<style scoped>
.member-form {
  min-width: 0;
  display: grid;
  gap: 22px;
}
.management {
  display: grid;
  gap: 18px;
}
.section-state {
  color: var(--text-tertiary);
  font-size: 0.8rem;
}
.role-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.role-summary > span {
  padding: 7px 10px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: var(--surface-subtle);
  font-size: 0.85rem;
}
.identity-required {
  display: grid;
  gap: 5px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-subtle);
}
.identity-required strong,
.identity-required p {
  margin: 0;
}
.identity-required p {
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.55;
}
.inline-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
}
.identity-status {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
}
.identity-status span,
.identity-status small,
.muted {
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.identity-status strong {
  color: var(--primary);
}
.management-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 2px;
}
.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}
.danger-zone strong,
.danger-zone p {
  margin: 0;
}
.danger-zone p {
  max-width: 55ch;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}
@media (max-width: 680px) {
  .inline-form {
    grid-template-columns: 1fr;
  }
  .identity-status {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }
  .management-actions {
    display: grid;
  }
  .danger-zone {
    align-items: stretch;
    flex-direction: column;
  }
  .member-depart-action {
    width: 100%;
  }
}
</style>
