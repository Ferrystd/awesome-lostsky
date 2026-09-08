<script setup lang="ts">
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ExternalLink, MessageCircleMore } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import EntityProfileFields from '../components/EntityProfileFields.vue'
import { useUnsavedChangesGuard } from '../composables/useUnsavedChangesGuard'
import { createDocumentTagGroupDraft, documentTagDescriptionError, documentTagError, documentTagGroupDrafts, documentTagGroupsPayload, hasDocumentTagGroupErrors, type DocumentTagGroupDraft } from '../lib/documentTags'
import { permissionReason, resourceUploadReason, useTeamAccess } from '../lib/teamAccess'

type EntityDetail = {
  id: number
  slug: string
  entityable_type: string
  is_displayed: number
  is_internal_visible: number
  capabilities?: { read_all: boolean; manage_profile: boolean }
  profile?: {
    name?: string
    avatar?: string
    description?: string
    intro_image?: string
    intro_video?: string
    introduction_markdown?: string
    document_tags?: Array<{ tag: string; description: string | null }>
  }
}

type VisibilityState = {
  is_internal_visible: number
  is_displayed: number
}

type VisibilityPayload = VisibilityState & { entity_id: number }

const route = useRoute()
const client = useQueryClient()
const access = useTeamAccess()
const id = computed(() => Number(route.query.id || 0))
const detail = useQuery({
  queryKey: computed(() => ['entity', id.value]),
  queryFn: () => api.get<EntityDetail>('/entity/get', { entity_id: id.value }),
})
const form = reactive({
  name: '',
  avatar: '',
  description: '',
  intro_image: '',
  intro_video: '',
  introduction_markdown: '',
  document_tags: [] as DocumentTagGroupDraft[],
})
const profileModel = computed({
  get: () => form,
  set: (value) => Object.assign(form, value),
})
const editor = ref<InstanceType<typeof EntityProfileFields> | null>(null)
const uploading = ref(false)
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const tagValidationSubmitted = ref(false)
const isDisplayed = ref(false)
const isInternalVisible = ref(true)
const profileSnapshot = ref('')
const visibilitySnapshot = ref('')
const hydratedEntityId = ref(0)
const canManage = computed(() => Boolean(detail.data.value?.capabilities?.manage_profile))
const manageReason = permissionReason('team.entity.profile.manage')
const canDisplay = computed(() => ['teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? '')))
const supportsPublicDocuments = computed(() => ['team', 'teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? '')))
const canToggleInternal = computed(() => ['teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? '')))
const internalFixedMessage = computed(() => (detail.data.value?.entityable_type === 'teamCustomer' ? 'Customer 属于敏感目录，始终需要 team.entity.read 才能查看。' : 'Team 实体始终在团队内部可见。'))
const publicFixedMessage = computed(() => (detail.data.value?.entityable_type === 'teamCustomer' ? 'Customer 包含敏感资料，不支持互联网公开主页。' : 'Team 主页由团队公开入口管理，此处不单独设置。'))
const entityTypeLabel = computed(
  () =>
    (
      ({
        team: '团队',
        teamMember: '成员',
        teamCustomer: '顾客',
        teamVirtual: '虚拟实体',
      }) as Record<string, string>
    )[String(detail.data.value?.entityable_type ?? '')] ?? '实体',
)
const displayUrl = computed(() => (detail.data.value?.is_displayed && canDisplay.value ? `//${window.location.hostname.split('.')[0]}.display.lostsky.work/entity/${detail.data.value.slug}` : ''))
const chatUrl = computed(() => (detail.data.value?.slug ? chatWorkspaceUrl('/new', { participant: detail.data.value.slug }) : ''))

function buildProfilePayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    entity_id: id.value,
    name: form.name,
    avatar: form.avatar,
    description: form.description,
    intro_image: form.intro_image,
    intro_video: form.intro_video,
    introduction_markdown: form.introduction_markdown,
  }
  if (supportsPublicDocuments.value) payload.document_tags = documentTagGroupsPayload(form.document_tags)
  return payload
}

function profileFingerprint(payload = buildProfilePayload()): string {
  const profile = { ...payload }
  delete profile.entity_id
  return JSON.stringify(profile)
}

function buildVisibilityPayload(): VisibilityPayload {
  return {
    entity_id: id.value,
    is_internal_visible: isInternalVisible.value ? 1 : 0,
    is_displayed: isDisplayed.value ? 1 : 0,
  }
}

function visibilityFingerprint(state: Pick<VisibilityState, 'is_internal_visible' | 'is_displayed'> = buildVisibilityPayload()): string {
  return JSON.stringify({
    is_internal_visible: Number(state.is_internal_visible) === 1 ? 1 : 0,
    is_displayed: Number(state.is_displayed) === 1 ? 1 : 0,
  })
}

const profileDirty = computed(() => Boolean(profileSnapshot.value) && profileFingerprint() !== profileSnapshot.value)
const visibilityDirty = computed(() => Boolean(visibilitySnapshot.value) && visibilityFingerprint() !== visibilitySnapshot.value)
const hasUnsavedChanges = computed(() => profileDirty.value || visibilityDirty.value)

useUnsavedChangesGuard(hasUnsavedChanges)

const profileSave = useMutation({
  mutationFn: (payload: Record<string, unknown>) => api.post('/entity/profile', payload),
  onSuccess: (_, payload) => {
    profileSnapshot.value = profileFingerprint(payload)
    if (!profileDirty.value) editor.value?.clearDraft()
    feedback.success('实体资料已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: (error) => feedback.error(friendlyError(error)),
})
const visibilitySave = useMutation({
  mutationFn: (payload: VisibilityPayload) => api.post<VisibilityState>('/entity/presentation', payload),
  onSuccess: (saved, payload) => {
    const submitted = visibilityFingerprint(payload)
    visibilitySnapshot.value = visibilityFingerprint(saved)
    if (visibilityFingerprint() === submitted) {
      isInternalVisible.value = Number(saved.is_internal_visible) === 1
      isDisplayed.value = Number(saved.is_displayed) === 1
    }
    client.setQueryData<EntityDetail>(['entity', id.value], (current) =>
      current
        ? {
            ...current,
            is_internal_visible: saved.is_internal_visible,
            is_displayed: saved.is_displayed,
          }
        : current,
    )
    feedback.success('可见性设置已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: (error) => feedback.error(friendlyError(error)),
})

watch(
  () => detail.data.value,
  (data) => {
    if (!data) return
    const entityChanged = hydratedEntityId.value !== id.value
    if (entityChanged || !visibilityDirty.value) {
      isDisplayed.value = Number(data.is_displayed) === 1
      isInternalVisible.value = data.entityable_type === 'team' || Number(data.is_internal_visible) === 1
      visibilitySnapshot.value = visibilityFingerprint()
    }
    const profile: NonNullable<EntityDetail['profile']> = data.profile ?? {}
    if (entityChanged || !profileDirty.value) {
      Object.assign(form, {
        name: profile.name || '',
        avatar: profile.avatar || '',
        description: profile.description || '',
        intro_image: profile.intro_image || '',
        intro_video: profile.intro_video || '',
        introduction_markdown: profile.introduction_markdown || '',
        document_tags: documentTagGroupDrafts(profile.document_tags),
      })
      profileSnapshot.value = profileFingerprint()
    }
    hydratedEntityId.value = id.value
  },
  { immediate: true },
)

const tagKey = (item: DocumentTagGroupDraft) => item.key
const createTagGroup = () => createDocumentTagGroupDraft()
const tagFieldError = (item: DocumentTagGroupDraft, index: number) => documentTagError(item, form.document_tags, index, tagValidationSubmitted.value)
const descriptionFieldError = (item: DocumentTagGroupDraft) => documentTagDescriptionError(item, tagValidationSubmitted.value)

async function submitProfile() {
  if (!canManage.value) return
  tagValidationSubmitted.value = true
  if (supportsPublicDocuments.value && hasDocumentTagGroupErrors(form.document_tags)) {
    await nextTick()
    document.querySelector<HTMLElement>('.document-tag-groups [data-invalid="true"] input, .document-tag-groups [data-invalid="true"] textarea')?.focus()
    return
  }
  profileSave.mutate(buildProfilePayload())
}
</script>

<template>
  <div class="entity-detail">
    <AdminPageHeader :title="canManage ? '管理实体资料' : '查看实体资料'" description="团队内可见、全局搜索和公开主页是三套互相独立的展示范围。" back-to="/entities" back-label="返回实体">
      <template #actions>
        <LsPagePrimaryAction v-if="chatUrl" :icon="MessageCircleMore" label="发起对话" :href="chatUrl" />
      </template>
    </AdminPageHeader>
    <LsAsyncState v-if="detail.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="detail.isError.value" state="error" title="暂时无法读取实体资料" :description="friendlyError(detail.error.value)" />
    <template v-else-if="detail.data.value">
      <form @submit.prevent="submitProfile">
        <LsPanel
          ><div class="profile-panel">
            <LsSectionHeader :title="`${entityTypeLabel} · @${detail.data.value.slug}`" description="这些资料用于实体（Entity）详情；公开页面仍受“公开主页展示”控制。">
              <template v-if="displayUrl" #aside
                ><a class="public-link" :href="displayUrl" target="_blank" rel="noopener noreferrer">查看公开主页<ExternalLink :size="16" /></a
              ></template>
            </LsSectionHeader>
            <EntityProfileFields ref="editor" v-model="profileModel" v-model:uploading="uploading" :draft-key="`entity-profile:${id}`" id-prefix="entity-profile" :upload-file="uploadFileUrl" :upload-disabled-reason="uploadDisabledReason" :disabled="!canManage" />
            <section v-if="supportsPublicDocuments" class="document-tag-groups" aria-labelledby="document-tag-groups-title">
              <div>
                <h3 id="document-tag-groups-title">公开文档分组</h3>
                <p>按这里的顺序组织该实体的公开文档；说明会显示在对应分组标题下方。</p>
              </div>
              <LsFormList v-model="form.document_tags" :item-key="tagKey" :create-item="createTagGroup" item-label="展示标签" add-label="添加展示标签" empty-text="尚未配置公开文档分组" :disabled="!canManage">
                <template #item="{ item, index }">
                  <div class="document-tag-group-fields">
                    <LsField label="标签" :for-id="`entity-document-tag-${item.key}`" :error="tagFieldError(item, index)" required>
                      <NInput
                        :id="`entity-document-tag-${item.key}`"
                        v-model:value="item.tag"
                        placeholder="例如：精选"
                        maxlength="50"
                        show-count
                        :disabled="!canManage"
                        :status="tagFieldError(item, index) ? 'error' : undefined"
                        @blur="item.touched = true; item.tag = item.tag.trim()"
                      />
                    </LsField>
                    <LsField label="说明（可选）" :for-id="`entity-document-tag-description-${item.key}`" :error="descriptionFieldError(item)">
                      <NInput
                        :id="`entity-document-tag-description-${item.key}`"
                        v-model:value="item.description"
                        maxlength="255"
                        show-count
                        :disabled="!canManage"
                        :status="descriptionFieldError(item) ? 'error' : undefined"
                        @blur="item.descriptionTouched = true; item.description = item.description.trim()"
                      />
                    </LsField>
                  </div>
                </template>
              </LsFormList>
            </section>
            <LsFormActions>
              <LsButton type="submit" :disabled="!canManage || uploading || !profileDirty" :disabled-reason="!canManage ? manageReason : uploading ? '文件正在上传，请稍候' : ''" :loading="profileSave.isPending.value">保存资料</LsButton>
            </LsFormActions>
          </div></LsPanel
        >
      </form>

      <LsPanel
        ><section class="visibility-settings">
          <LsSectionHeader title="可见性设置" description="分别控制团队工作空间与互联网公开主页中的发现范围。" :heading-level="2" />
          <div class="visibility-list">
            <LsSwitchField v-if="canToggleInternal" v-model="isInternalVisible" label="团队内可见" :heading-level="3" description="控制普通成员是否能在当前团队工作空间发现该实体；具有 team.entity.read 的角色仍可查看。它不影响全局搜索或公开主页。" :disabled="!canManage" :loading="visibilitySave.isPending.value" :disabled-reason="!canManage ? manageReason : ''" />
            <LsSwitchField v-else :model-value="detail.data.value.entityable_type === 'team'" label="团队内可见" :heading-level="3" description="控制普通成员是否能在当前团队工作空间发现该实体；它不影响全局搜索或公开主页。" read-only :disabled-reason="internalFixedMessage" />

            <LsSwitchField v-if="canDisplay" v-model="isDisplayed" label="公开主页展示" :heading-level="3" description="控制互联网访客能否在 Display 公开主页浏览该实体。它不影响团队内目录或全局搜索。" :disabled="!canManage" :loading="visibilitySave.isPending.value" :disabled-reason="!canManage ? manageReason : ''" />
            <LsSwitchField v-else :model-value="detail.data.value.entityable_type === 'team'" label="公开主页展示" :heading-level="3" description="控制互联网访客能否在 Display 公开主页浏览该实体。" read-only :disabled-reason="publicFixedMessage" />
          </div>
          <LsFormActions v-if="canToggleInternal">
            <LsButton variant="secondary" :disabled="!canManage || !visibilityDirty" :disabled-reason="!canManage ? manageReason : ''" :loading="visibilitySave.isPending.value" @click="visibilitySave.mutate(buildVisibilityPayload())">保存可见性</LsButton>
          </LsFormActions>
        </section></LsPanel
      >
    </template>
  </div>
</template>

<style scoped>
.entity-detail {
  display: grid;
  gap: 22px;
}
.profile-panel,
.visibility-settings,
.visibility-list {
  display: grid;
  gap: 16px;
}
.profile-panel h2,
.profile-panel p,
.document-tag-groups h3,
.document-tag-groups p {
  margin: 0;
}
.profile-panel h2 {
  font-size: 1.05rem;
}
.profile-panel label {
  display: grid;
  gap: 7px;
  color: var(--text-secondary);
  font-weight: 650;
}
.public-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 650;
  white-space: nowrap;
}
.document-tag-groups {
  display: grid;
  gap: 16px;
  padding-top: 4px;
}
.document-tag-groups h3 {
  font-size: 1rem;
}
.document-tag-groups > div > p {
  max-width: 68ch;
  margin-top: 5px;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.55;
}
.document-tag-group-fields {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 12px;
}
code {
  font-size: 0.8em;
}
@media (max-width: 639px) {
  .document-tag-group-fields {
    grid-template-columns: 1fr;
  }
}
</style>
