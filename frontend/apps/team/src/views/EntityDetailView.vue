<script setup lang="ts">
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
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
import {
  createDocumentTagGroupDraft,
  documentTagDescriptionError,
  documentTagError,
  documentTagGroupDrafts,
  documentTagGroupsPayload,
  hasDocumentTagGroupErrors,
  type DocumentTagGroupDraft,
} from '../lib/documentTags'
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
const profileModel = computed({ get: () => form, set: value => Object.assign(form, value) })
const editor = ref<InstanceType<typeof EntityProfileFields> | null>(null)
const uploading = ref(false)
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const tagValidationSubmitted = ref(false)
const isDisplayed = ref(false)
const isInternalVisible = ref(true)
const canManage = computed(() => Boolean(detail.data.value?.capabilities?.manage_profile))
const manageReason = permissionReason('team.entity.profile.manage')
const canDisplay = computed(() => (
  ['teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? ''))
))
const supportsPublicDocuments = computed(() => (
  ['team', 'teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? ''))
))
const canToggleInternal = computed(() =>
  ['teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? ''))
)
const internalFixedMessage = computed(() =>
  detail.data.value?.entityable_type === 'teamCustomer'
    ? 'Customer 属于敏感目录，始终需要 team.entity.read 才能查看。'
    : 'Team 实体始终在团队内部可见。'
)
const displayUrl = computed(() => (
  detail.data.value?.is_displayed && canDisplay.value
    ? `//${window.location.hostname.split('.')[0]}.display.lostsky.work/entity/${detail.data.value.slug}`
    : ''
))
const chatUrl = computed(() => (
  detail.data.value?.slug
    ? chatWorkspaceUrl('/new', { participant: detail.data.value.slug })
    : ''
))

const profileSave = useMutation({
  mutationFn: () => {
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
    return api.post('/entity/profile', payload)
  },
  onSuccess: () => {
    editor.value?.clearDraft()
    feedback.success('实体资料已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: error => feedback.error(friendlyError(error)),
})
const displaySave = useMutation({
  mutationFn: () => api.post('/entity/display', {
    entity_id: id.value,
    is_displayed: isDisplayed.value ? 1 : 0,
  }),
  onSuccess: () => {
    feedback.success('公开展示设置已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: error => feedback.error(friendlyError(error)),
})
const visibilitySave = useMutation({
  mutationFn: () => api.post('/entity/visibility', {
    entity_id: id.value,
    is_internal_visible: isInternalVisible.value ? 1 : 0,
  }),
  onSuccess: () => {
    feedback.success('团队内可见设置已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: error => feedback.error(friendlyError(error)),
})

watch(() => detail.data.value, (data) => {
  if (!data) return
  isDisplayed.value = Number(data.is_displayed) === 1
  isInternalVisible.value = data.entityable_type === 'team' || Number(data.is_internal_visible) === 1
  const profile = data.profile
  if (profile) {
    Object.assign(form, {
      name: profile.name || '',
      avatar: profile.avatar || '',
      description: profile.description || '',
      intro_image: profile.intro_image || '',
      intro_video: profile.intro_video || '',
      introduction_markdown: profile.introduction_markdown || '',
      document_tags: documentTagGroupDrafts(profile.document_tags),
    })
  }
}, { immediate: true })

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
  profileSave.mutate()
}
</script>

<template>
  <div class="entity-detail">
    <AdminPageHeader
      :title="canManage ? '管理实体资料' : '查看实体资料'"
      description="团队内可见、全局搜索和公开主页是三套互相独立的展示范围。"
      back-to="/entities"
      back-label="返回实体"
    >
      <template #actions>
        <a v-if="chatUrl" class="chat-action" :href="chatUrl"><MessageCircleMore :size="17" />发起对话</a>
      </template>
    </AdminPageHeader>
    <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
    <template v-else-if="detail.data.value">
      <p v-if="!canManage" id="entity-manage-reason" class="permission-note" role="note">
        当前为只读模式。{{ manageReason }}
      </p>

      <form @submit.prevent="submitProfile"><LsPanel><div class="profile-panel">
        <LsSectionHeader :title="`${detail.data.value.entityable_type} · @${detail.data.value.slug}`" description="这些资料用于实体详情；公开页面仍受“公开主页展示”控制。">
          <template v-if="displayUrl" #aside><a class="public-link" :href="displayUrl" target="_blank" rel="noopener noreferrer">查看公开主页<ExternalLink :size="16" /></a></template>
        </LsSectionHeader>
        <EntityProfileFields
          ref="editor"
          v-model="profileModel"
          v-model:uploading="uploading"
          :draft-key="`entity-profile:${id}`"
          id-prefix="entity-profile"
          :upload-file="uploadFileUrl"
          :upload-disabled-reason="uploadDisabledReason"
          :disabled="!canManage"
        />
        <section v-if="supportsPublicDocuments" class="document-tag-groups" aria-labelledby="document-tag-groups-title">
          <div>
            <h3 id="document-tag-groups-title">公开文档分组</h3>
            <p>按这里的顺序组织该实体的公开文档；说明会显示在对应分组标题下方。</p>
          </div>
          <LsFormList
            v-model="form.document_tags"
            :item-key="tagKey"
            :create-item="createTagGroup"
            item-label="展示标签"
            add-label="添加展示标签"
            empty-text="尚未配置公开文档分组"
            :disabled="!canManage"
          >
            <template #item="{ item, index }">
              <div class="document-tag-group-fields">
                <LsField
                  label="标签"
                  :for-id="`entity-document-tag-${item.key}`"
                  :error="tagFieldError(item, index)"
                  required
                >
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
                <LsField
                  label="说明（可选）"
                  :for-id="`entity-document-tag-description-${item.key}`"
                  :error="descriptionFieldError(item)"
                >
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
        <span :tabindex="canManage ? -1 : 0" :aria-describedby="canManage ? undefined : 'entity-manage-reason'">
          <LsButton type="submit" :disabled="!canManage || uploading" :loading="profileSave.isPending.value">保存资料</LsButton>
        </span>
      </div></LsPanel></form>

      <LsPanel><section class="setting">
        <LsSwitchField
          v-if="canToggleInternal"
          v-model="isInternalVisible"
          label="团队内可见"
          aria-label="在团队工作空间内可见"
          :heading-level="2"
          description="控制普通成员是否能在当前团队工作空间发现该实体；具有 team.entity.read 的角色仍可查看。它不影响全局搜索或公开主页。"
          :disabled="!canManage"
          checked-text="可见"
          unchecked-text="隐藏"
        />
        <div v-else>
          <h2>团队内可见</h2>
          <p>控制普通成员是否能在当前团队工作空间发现该实体；具有 <code>team.entity.read</code> 的角色仍可查看。它不影响全局搜索或公开主页。</p>
          <p class="fixed-state">{{ internalFixedMessage }}</p>
        </div>
        <span v-if="canToggleInternal" :tabindex="canManage ? -1 : 0" :aria-describedby="canManage ? undefined : 'entity-manage-reason'">
          <LsButton variant="secondary" :disabled="!canManage" :loading="visibilitySave.isPending.value" @click="visibilitySave.mutate()">保存团队内可见设置</LsButton>
        </span>
      </section></LsPanel>

      <LsPanel><section class="setting">
        <LsSwitchField
          v-if="canDisplay"
          v-model="isDisplayed"
          label="公开主页展示"
          aria-label="在公开主页展示"
          :heading-level="2"
          description="控制互联网访客能否在 Display 公开主页浏览该实体。它不影响团队内目录或全局搜索。"
          :disabled="!canManage"
          checked-text="公开"
          unchecked-text="隐藏"
        />
        <div v-else>
          <h2>公开主页展示</h2>
          <p>Team 主页始终公开；客户实体为保护隐私不支持公开展示。</p>
        </div>
        <span v-if="canDisplay" :tabindex="canManage ? -1 : 0" :aria-describedby="canManage ? undefined : 'entity-manage-reason'">
          <LsButton variant="secondary" :disabled="!canManage" :loading="displaySave.isPending.value" @click="displaySave.mutate()">保存公开设置</LsButton>
        </span>
      </section></LsPanel>
    </template>
  </div>
</template>

<style scoped>
.entity-detail{display:grid;gap:22px}.chat-action{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .875rem;color:white;background:var(--sky-lost-strong);border-radius:8px;font-size:.875rem;font-weight:650}.profile-panel,.setting{display:grid;gap:16px}.profile-panel h2,.profile-panel p,.setting h2,.setting p,.document-tag-groups h3,.document-tag-groups p{margin:0}.profile-panel h2,.setting h2{font-size:1.05rem}.profile-panel label{display:grid;gap:7px;color:var(--text-secondary);font-weight:650}.setting>div p{max-width:68ch;margin-top:.4rem;color:var(--text-secondary);font-size:.84rem;line-height:1.6}.public-link{min-height:44px;display:inline-flex;align-items:center;gap:.4rem;color:var(--primary);font-size:.82rem;font-weight:650;white-space:nowrap}.document-tag-groups{display:grid;gap:16px;padding-top:4px}.document-tag-groups h3{font-size:1rem}.document-tag-groups>div>p{max-width:68ch;margin-top:5px;color:var(--text-secondary);font-size:.84rem;line-height:1.55}.document-tag-group-fields{min-width:0;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);align-items:start;gap:12px}.profile-panel>span{justify-self:start}.profile-panel>span:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 65%);outline-offset:3px;border-radius:8px}.permission-note{margin:0;padding:.8rem 1rem;color:var(--muted-ink);background:color-mix(in oklch,var(--sky-lost),white 92%);border:1px solid color-mix(in oklch,var(--sky-lost),white 65%);border-radius:8px;font-size:.84rem}.fixed-state{color:var(--muted-ink);font-size:.84rem}.feedback{padding:.75rem;border-radius:8px}.error{color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%)}code{font-size:.8em}
@media(max-width:639px){.document-tag-group-fields{grid-template-columns:1fr}.profile-panel>span,.profile-panel :deep(.ls-button){width:100%}}
</style>
