<script setup lang="ts">
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { BookOpen, FileText, House, ShieldCheck, UserRound } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
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
const profileModel = computed({ get: () => form, set: value => Object.assign(form, value) })
const editor = ref<InstanceType<typeof EntityProfileFields> | null>(null)
const uploading = ref(false)
const access = useTeamAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
watch(() => query.data.value, data => {
  if (!data) return
  Object.assign(form, data.profile, { slug: data.identity.slug || '' })
}, { immediate: true })
const expectedEntityId = computed(() => query.data.value?.identity.entity_id ?? 0)
const identityType = computed(() => query.data.value?.identity.type === 'team'
  ? '团队实体'
  : query.data.value?.identity.type === 'teamVirtual' ? '虚拟实体' : '团队成员')
const overviewTitle = computed(() => query.data.value?.identity.name || (query.isError.value ? '当前 Entity 摘要暂时不可用' : '正在读取当前 Entity…'))
const overviewDescription = computed(() => query.data.value
  ? `${identityType.value} · 所属团队 ${query.data.value.identity.team.name}`
  : '资料、对象字段和权限（Permission）入口保持可用；重新进入页面后会再次读取当前身份。')
const overviewActions = computed(() => [
  { key: 'team', label: '进入团队工作台', to: '/', icon: House, primary: true },
  { key: 'docs', label: '使用文档', href: '//doc.lostsky.work', target: '_blank', rel: 'noopener', icon: BookOpen },
])
const overviewEntries = [
  { key: 'profile', label: '资料', description: '维护当前 Entity 的名称、头像、简介与公开介绍。', to: '/personal/profile', icon: UserRound },
  { key: 'fields', label: '对象字段', description: '填写当前 Entity 类型允许维护的团队自定义字段。', to: '/personal/fields', icon: FileText },
  { key: 'access', label: '角色与权限', description: '只读查看角色来源与当前实际生效的 Permission。', to: '/personal/access', icon: ShieldCheck },
]

const saveProfile = useMutation({
  mutationFn: async () => {
    if (!query.data.value?.identity.slug) await api.post('/personal/slug', { expected_entity_id: expectedEntityId.value, slug: form.slug.trim() })
    await api.post('/personal/profile', {
      expected_entity_id: expectedEntityId.value,
      name: form.name.trim(), avatar: form.avatar || null, description: form.description || null,
      intro_image: form.intro_image || null, intro_video: form.intro_video || null,
      introduction_markdown: form.introduction_markdown || null,
    })
  },
  onSuccess: async () => { editor.value?.clearDraft(); await query.refetch(); feedback.success('个人资料已保存') },
})
const saveFields = useMutation({
  mutationFn: (values: Record<number, unknown>) => api.post('/personal/fields', { expected_entity_id: expectedEntityId.value, values }),
  onSuccess: async () => { await query.refetch(); feedback.success('对象字段已保存') },
})
const roles = computed(() => (query.data.value?.role_assignments ?? []).map(item => item.role).filter((item): item is RoleRecord => Boolean(item)))
</script>

<template>
  <div class="personal-view">
    <template v-if="section === 'overview'">
      <LsWorkspaceOverview
        :eyebrow="`个人工作台 · ${identityType}`"
        :title="overviewTitle"
        :description="overviewDescription"
        :actions="overviewActions"
        :entries="overviewEntries"
        :scope-notes="['所有资料和业务范围都以当前已领取的 Entity 为主体。', '切换身份后，系统会重新核对 Entity 类型、角色与有效权限。']"
      />
      <LsInlineError v-if="query.isError.value" :message="friendlyError(query.error.value)" />
    </template>
    <template v-else>
      <AdminPageHeader :title="section === 'profile' ? '资料' : section === 'fields' ? '对象字段' : '角色与权限'" description="所有内容均属于当前已领取的 Entity；切换身份后会自动重新核对。" />
      <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
      <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取当前实体" :description="friendlyError(query.error.value)" />
      <template v-else-if="query.data.value">
      <form v-if="section === 'profile'" class="profile-form" @submit.prevent="saveProfile.mutate()">
        <LsPanel>
          <div class="identity-summary"><LsEntityIdentity :type="query.data.value.identity.type" :name="query.data.value.identity.name" :slug="query.data.value.identity.slug || ''" :image-url="query.data.value.profile.avatar" fallback="initial" /><small>所属团队：{{ query.data.value.identity.team.name }}</small></div>
          <div v-if="!query.data.value.identity.slug" class="slug-field"><label>对象标识<NInput v-model:value="form.slug" placeholder="首次确认后不可修改" /></label></div>
          <EntityProfileFields ref="editor" v-model="profileModel" v-model:uploading="uploading" draft-key="personal-profile" id-prefix="personal-profile" :upload-file="uploadFileUrl" :upload-disabled-reason="uploadDisabledReason" />
        </LsPanel>
        <LsInlineError v-if="saveProfile.isError.value" :message="friendlyError(saveProfile.error.value)" />
        <LsFormActions><LsButton type="submit" :loading="saveProfile.isPending.value" :disabled="uploading || !form.name.trim() || (!query.data.value.identity.slug && !form.slug.trim())">保存资料</LsButton></LsFormActions>
      </form>
      <EntityFieldsCard v-else-if="section === 'fields'" :fields="query.data.value.custom_fields" :stored-values="query.data.value.custom_field_values" mode="self" :saving="saveFields.isPending.value" :error="saveFields.error.value" :upload-disabled-reason="uploadDisabledReason" @save="saveFields.mutate" />
      <EntityPermissionsCard v-else-if="section === 'access'" :assignments="query.data.value.role_assignments" :roles="roles" :effective-permissions="query.data.value.effective_permissions" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.personal-view,.profile-form{display:grid;gap:1rem}.identity-summary{display:grid;gap:.65rem;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}.identity-summary>small{color:var(--muted-ink);font-size:.78rem}.slug-field{margin-bottom:1rem}.slug-field label{display:grid;gap:.4rem;color:var(--ink);font-size:.82rem;font-weight:650}
</style>
