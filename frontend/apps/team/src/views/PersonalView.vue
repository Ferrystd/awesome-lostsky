<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ArrowLeft, Bell, BookOpen, FileText, House, Save, ShieldCheck, UserRound } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { useRoute } from 'vue-router'
import MemberSelfDeparture from '../components/MemberSelfDeparture.vue'
import TeamShareLinks from '../components/TeamShareLinks.vue'
import EntityProfileFields from '../components/EntityProfileFields.vue'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import EntityPermissionsCard, { type EffectivePermission, type RoleAssignment, type RoleRecord } from '../components/EntityPermissionsCard.vue'
import { resourceUploadReason, useTeamAccess } from '../lib/teamAccess'

interface PersonalResult {
  identity: { entity_id: number; type: 'team' | 'teamMember' | 'teamVirtual'; slug: string | null; name: string; team: { name: string } }
  profile: { name: string; avatar?: string | null; description?: string | null; intro_image?: string | null; intro_video?: string | null; introduction_markdown?: string | null }
  custom_fields: EntityFieldDefinition[]
  custom_field_values: Record<string, unknown>[]
  role_assignments: RoleAssignment[]
  effective_permissions: EffectivePermission[]
}

const route = useRoute()
const section = computed(() => String(route.meta.personalSection ?? 'profile'))
const query = useQuery({ queryKey: ['team-personal'], queryFn: () => api.get<PersonalResult>('/personal') })
const form = reactive({ name: '', avatar: '', description: '', intro_image: '', intro_video: '', introduction_markdown: '', slug: '' })
const draftKey = () => teamDraftScope('PersonalView', section.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
const profileModel = computed({ get: () => form, set: value => Object.assign(form, value) })
const editor = ref<InstanceType<typeof EntityProfileFields> | null>(null)
const uploading = ref(false)
const access = useTeamAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
watch([() => query.data.value, section], ([data]) => {
  if (!data) return
  draft.hydrate({ name: data.profile.name, avatar: data.profile.avatar || '', description: data.profile.description || '', intro_image: data.profile.intro_image || '', intro_video: data.profile.intro_video || '', introduction_markdown: data.profile.introduction_markdown || '', slug: data.identity.slug || '' })
}, { immediate: true })
const expectedEntityId = computed(() => query.data.value?.identity.entity_id ?? 0)
const identityType = computed(() => query.data.value?.identity.type === 'team'
  ? '团队身份'
  : query.data.value?.identity.type === 'teamVirtual' ? '虚拟人员' : '团队成员')
const overviewTitle = computed(() => query.data.value?.identity.name || (query.isError.value ? '当前人员摘要暂时不可用' : '正在读取当前人员…'))
const overviewDescription = computed(() => query.data.value
  ? `${identityType.value} · 所属团队 ${query.data.value.identity.team.name}`
  : '正在读取当前身份；各功能入口保持可用，重新进入页面后会重新读取。')
const overviewEntries = [
  { key: 'notices', label: '收件箱', description: '查看发给当前人员的通知并标记已读。', to: '/personal/notices', icon: Bell },
  { key: 'profile', label: '资料', description: '维护当前人员的名称、头像、简介与公开介绍。', to: '/personal/profile', icon: UserRound },
  { key: 'fields', label: '对象字段', description: '填写当前人员类型允许维护的团队自定义字段。', to: '/personal/fields', icon: FileText },
  { key: 'access', label: '角色与权限', description: '查看当前身份所属角色及其实际生效的权限，仅可查看、不可修改。', to: '/personal/access', icon: ShieldCheck },
]

const fieldsDirty = ref(false)
watch(section, () => { fieldsDirty.value = false })
useUnsavedChangesGuard(computed(() => draft.dirty.value || fieldsDirty.value), { shouldConfirm: teamDraftNavigationChanged })
const saveProfile = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const form = submitted.value
    const expectedId = expectedEntityId.value
    if (!query.data.value?.identity.slug) await api.post('/personal/slug', { expected_entity_id: expectedId, slug: form.slug.trim() })
    if (!draft.isCurrent(submitted)) return submitted
    await api.post('/personal/profile', {
      expected_entity_id: expectedId,
      name: form.name.trim(), avatar: form.avatar || null, description: form.description || null,
      intro_image: form.intro_image || null, intro_video: form.intro_video || null,
      introduction_markdown: form.introduction_markdown || null,
    })
    return submitted
  },
  onSuccess: async submitted => { if (!draft.accept(submitted)) return; if (!draft.dirty.value) editor.value?.clearDraft(); await query.refetch(); if (!draft.isCurrent(submitted) || draft.dirty.value) return; feedback.success('个人资料已保存') },
})
const saveFields = useMutation({
  mutationFn: async (values: Record<number, unknown>) => {
    const submitted = draft.capture()
    await api.post('/personal/fields', { expected_entity_id: expectedEntityId.value, values })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.isCurrent(submitted)) return
 await query.refetch(); if (!draft.isCurrent(submitted)) return; feedback.success('对象字段已保存') },
})
const roles = computed(() => (query.data.value?.role_assignments ?? []).map(item => item.role).filter((item): item is RoleRecord => Boolean(item)))
</script>

<template>
  <div class="personal-view">
    <template v-if="section === 'overview'">
      <LsPageHeader
        :title="overviewTitle"
        :description="overviewDescription"
      >
        <template #actions>
          <LsPageLink to="/" :icon="House" label="进入团队工作台" />
          <LsPageLink href="//doc.lostsky.work" :icon="BookOpen" label="使用文档" target="_blank" rel="noopener" />
          <LsSceneMotionControl />
        </template>
      </LsPageHeader>
      <TeamShareLinks />
      <LsMetricGrid aria-label="个人身份摘要" :items="[
        { key: 'roles', label: '已分配角色', value: query.isSuccess.value && query.data.value?.role_assignments ? query.data.value.role_assignments.length : '-' },
        { key: 'fields', label: '资料字段', value: query.isSuccess.value && query.data.value?.custom_fields ? query.data.value.custom_fields.length : '-' },
        { key: 'permissions', label: '有效权限', value: query.isSuccess.value && query.data.value?.effective_permissions ? query.data.value.effective_permissions.length : '-' },
      ]" />
      <LsPanel>
        <template #header><LsSectionHeader title="工作入口" /></template>
        <nav class="personal-entries" aria-label="工作入口">
          <div v-for="entry in overviewEntries" :key="entry.key" class="personal-entry">
            <LsPageLink :to="entry.to" :icon="entry.icon" :label="entry.label" />
            <p>{{ entry.description }}</p>
          </div>
        </nav>
        <template #footer>
          <p class="scope-note">此处是你在团队中的个人中心。部分内容受团队管理或需要权限。</p>
        </template>
      </LsPanel>
      <LsInlineError v-if="query.isError.value" :message="friendlyError(query.error.value)" />
    </template>
    <LsDetailPage v-else :title="section === 'profile' ? '资料' : section === 'fields' ? '对象字段' : '角色与权限'" description="所有内容均属于当前已领取的人员；切换身份后会自动重新核对。" back-to="/personal" back-label="返回个人概览" aside-label="当前人员身份">
      <template #actions><MemberSelfDeparture v-if="section === 'profile' && query.data.value?.identity.type === 'teamMember'" /></template>
      <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
      <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取当前人员" :description="friendlyError(query.error.value)" />
      <template v-else-if="query.data.value">
      <form v-if="section === 'profile'" class="profile-form" @submit.prevent="saveProfile.mutate()">
        <LsPanel>
          <template #header><LsSectionHeader title="个人资料" /></template>
          <div v-if="!query.data.value.identity.slug" class="slug-field"><LsFormFields><LsField label="对象标识" for-id="personal-slug"><NInput v-model:value="form.slug" :input-props="{ id: 'personal-slug' }" placeholder="首次确认后不可修改" /></LsField></LsFormFields></div>
          <EntityProfileFields ref="editor" v-model="profileModel" v-model:uploading="uploading" draft-key="personal-profile" id-prefix="personal-profile" :upload-file="uploadFileUrl" :upload-disabled-reason="uploadDisabledReason" />
          <LsInlineError v-if="saveProfile.isError.value" :message="friendlyError(saveProfile.error.value)" />
          <template #footer><LsFormActions><LsButton type="submit" :loading="saveProfile.isPending.value" :disabled="!draft.dirty.value || uploading || !form.name.trim() || (!query.data.value.identity.slug && !form.slug.trim())"><template #icon><Save :size="17" /></template>保存资料</LsButton></LsFormActions></template>
        </LsPanel>
      </form>
      <EntityFieldsCard v-if="section === 'fields'" :fields="query.data.value.custom_fields" :stored-values="query.data.value.custom_field_values" mode="self" :saving="saveFields.isPending.value" :error="saveFields.error.value" :upload-disabled-reason="uploadDisabledReason" :key="draftKey()" :success="saveFields.isSuccess.value" @dirty="fieldsDirty = $event" @save="saveFields.mutate" />
      <EntityPermissionsCard v-else-if="section === 'access'" :assignments="query.data.value.role_assignments" :roles="roles" :effective-permissions="query.data.value.effective_permissions" />
      </template>
      <template #aside><LsPanel><LsSectionHeader title="当前身份" description="已保存的身份与授权信息" /><template v-if="query.isSuccess.value && query.data.value"><LsEntityIdentity :type="query.data.value.identity.type" :name="query.data.value.identity.name" :slug="query.data.value.identity.slug || ''" :image-url="query.data.value.profile.avatar" fallback="initial" /><LsDescriptionList><dt>所属团队</dt><dd>{{ query.data.value.identity.team.name }}</dd><dt>角色</dt><dd>{{ roles.length }} 个</dd><dt>有效权限</dt><dd>{{ query.data.value.effective_permissions?.length ?? 0 }} 项</dd></LsDescriptionList></template><p v-else>当前身份暂不可用。</p></LsPanel></template>
    </LsDetailPage>
  </div>
</template>

<style scoped>
.personal-view,.profile-form{min-width:0;display:grid;gap:1.5rem}.slug-field{margin-bottom:1rem}.personal-entries{min-width:0;display:grid}.personal-entry{min-width:0;padding:.75rem 0}.personal-entry:first-child{padding-top:0}.personal-entry:last-child{padding-bottom:0}.personal-entry+.personal-entry{border-top:1px solid var(--border)}.personal-entry p,.scope-note{margin:0;color:var(--text-secondary);font-size:.8125rem;line-height:1.6;overflow-wrap:anywhere}
</style>
