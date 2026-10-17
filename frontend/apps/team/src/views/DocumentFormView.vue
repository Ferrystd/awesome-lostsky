<script setup lang="ts">
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { managerScopeOptions, visibilityOptions } from '../lib/access'
import {
  createDocumentTagDraft,
  documentTagDrafts,
  documentTagError,
  documentTagsPayload,
  hasDocumentTagErrors,
  type DocumentTagDraft,
} from '../lib/documentTags'
import { searchEntities, uploadMarkdownImage } from '../lib/markdown'
import { resourceUploadReason, useTeamAccess } from '../lib/teamAccess'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const access = useTeamAccess()
const routeAccess = useRouteAccess()
const uploadDisabledReason = computed(() => resourceUploadReason(access.data.value))
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  title: '',
  content: '',
  entity_id: Number(route.query.entity_id || 0),
  manager_scope: route.query.entity_id ? 2 : 1,
  visibility: route.query.entity_id ? 3 : 1,
  sort: 0,
  tags: [] as DocumentTagDraft[],
})
const draftKey = () => teamDraftScope('DocumentFormView', id.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })

const tagValidationSubmitted = ref(false)

interface EntityOption {
  entity_id: number
  type: 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
  slug: string
  name: string
}
const entities = useQuery({
  queryKey: ['entity-options'],
  queryFn: () => api.get<EntityOption[]>('/entity/options'),
  enabled: computed(() => !routeAccess.restricted.value),
})
watch(() => entities.data.value, (items) => {
  if (!editing.value && !form.entity_id && items?.length) draft.hydrate({ ...form, entity_id: items[0].entity_id })
}, { immediate: true })

const detail = useQuery({
  queryKey: computed(() => ['doc', id.value]),
  queryFn: () => routeAccess.read(() => api.get<Record<string, unknown>>('/doc/get', { id: id.value })),
  enabled: computed(() => editing.value && !routeAccess.restricted.value),
})

const managerSelectOptions = managerScopeOptions as SelectOption[]
const visibilitySelectOptions = visibilityOptions as SelectOption[]

watch(() => detail.data.value, (data) => {
  if (!data) return
    const next = { ...form }
  next.title = String(data.title ?? '')
  next.content = String(data.content ?? '')
  next.entity_id = Number(data.entity_id ?? 0)
  next.manager_scope = enumOptionValue(data.manager_scope, managerScopeOptions, 1)
  next.visibility = enumOptionValue(data.visibility, visibilityOptions, 1)
  next.sort = Number(data.sort ?? 0)
  next.tags = documentTagDrafts(data.tags)
  draft.hydrate(next)
}, { immediate: true })

const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const targetId = id.value
    const form = submitted.value
    const data = await ( api.post<{ id?: number }>(editing.value ? '/doc/edit' : '/doc/create', {
    ...(editing.value ? { id: id.value } : { entity_id: form.entity_id }),
    title: form.title.trim(),
    content: form.content,
    manager_scope: form.manager_scope,
    visibility: form.visibility,
    sort: form.sort,
    tags: documentTagsPayload(form.tags),
  })
    )
    return { data, submitted, targetId }
  },
  onSuccess: async ({ data: result, submitted, targetId }) => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    editor.value?.clearDraft()
    await queryClient.invalidateQueries({ queryKey: ['docs'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    const savedId = targetId || Number(result?.id || 0)
    await router.push(savedId ? `/doc?id=${savedId}` : '/docs')
  },
})

const tagKey = (item: DocumentTagDraft) => item.key
const createTag = () => createDocumentTagDraft()
const tagFieldError = (item: DocumentTagDraft, index: number) => documentTagError(item, form.tags, index, tagValidationSubmitted.value)

async function submit() {
  if (routeAccess.restricted.value) return
  tagValidationSubmitted.value = true
  if (hasDocumentTagErrors(form.tags)) {
    await nextTick()
    document.querySelector<HTMLElement>('.document-tags [data-invalid="true"] input')?.focus()
    return
  }
  save.mutate()
}

</script>

<template>
  <LsFormPage aside-label="文档发布摘要" :title="editing ? '编辑文档' : '新建文档'" description="用可视化编辑器撰写团队文档，输入 @ 可引用团队或人员。">
    <template #actions>
      <LsPageLink to="/docs" :icon="ArrowLeft" label="返回文档列表" />
    </template>

    <LsInlineError v-if="detail.isError.value && !routeAccess.restricted.value" :message="friendlyError(detail.error.value)" />
    <form v-else class="document-form" @submit.prevent="submit">
      <LsFormSection title="文档内容">
      <LsFormFields>
        <LsField label="标题" for-id="document-title" required><NInput :input-props="{ id: 'document-title' }" v-model:value="form.title" placeholder="一句话说明这份文档解决什么问题" maxlength="120" show-count required /></LsField>

        <template v-if="!editing">
          <LsField label="归属对象" for-id="document-entity"><LsEntitySelect :input-props="{ id: 'document-entity' }" v-model="form.entity_id" :entities="entities.data.value ?? []" :loading="entities.isPending.value" :disabled="routeAccess.restricted.value || entities.isError.value || !entities.data.value?.length" :placeholder="routeAccess.restricted.value ? '-' : '选择归属对象'" /></LsField>
        </template>

      </LsFormFields>
      <section class="document-tags" aria-labelledby="document-tags-title">
        <LsSectionHeader id="document-tags-title" title="文档标签" description="用于公开页面的文档分组；标签是独立资料，无需输入 #。" />
        <LsFormList
          v-model="form.tags"
          :item-key="tagKey"
          :create-item="createTag"
          item-label="文档标签"
          add-label="添加标签"
          empty-text="尚未添加文档标签"
        >
          <template #item="{ item, index }">
            <LsField
              label="标签"
              :for-id="`document-tag-${item.key}`"
              :error="tagFieldError(item, index)"
              required
            >
              <NInput
                :id="`document-tag-${item.key}`"
                v-model:value="item.tag"
                placeholder="例如：指南"
                maxlength="50"
                show-count
                :status="tagFieldError(item, index) ? 'error' : undefined"
                @blur="item.touched = true; item.tag = item.tag.trim()"
              />
            </LsField>
          </template>
        </LsFormList>
      </section>

      <LsFormContent title="正文">
        <LsMarkdownEditor
          v-if="routeAccess.restricted.value || !editing || detail.isSuccess.value"
          ref="editor"
          v-model="form.content"
          :draft-key="`document:${editing ? id : 'new'}`"
          :search-entities="searchEntities"
          :upload-image="uploadMarkdownImage"
          :upload-disabled-reason="uploadDisabledReason"
          placeholder="开始写作，或输入 @ 引用团队与成员…"
        />
      </LsFormContent>
      </LsFormSection>

      <LsFormSection id="document-policy-title" title="访问规则" description="归属成员时可允许本人管理；公开可见会将正文暴露给未登录访客。">
        <LsFormFields>
          <LsField label="管理范围" for-id="document-manager-scope"><NSelect id="document-manager-scope" v-model:value="form.manager_scope" :options="managerSelectOptions" /></LsField>
          <LsField label="可见范围" for-id="document-visibility"><NSelect id="document-visibility" v-model:value="form.visibility" :options="visibilitySelectOptions" /></LsField>
          <LsField label="排序" for-id="document-sort"><NInputNumber :input-props="{ id: 'document-sort' }" v-model:value="form.sort" :precision="0" /></LsField>
        </LsFormFields>
      </LsFormSection>

      <LsInlineError v-if="save.isError.value && !routeAccess.restricted.value" :message="friendlyError(save.error.value)" />
      <LsFormActions>
        <LsPageLink to="/docs" :icon="ArrowLeft" label="取消" />
        <LsButton type="submit" :loading="save.isPending.value" :disabled="routeAccess.restricted.value || !draft.dirty.value || !form.title.trim() || (!editing && !form.entity_id)" :disabled-reason="routeAccess.reason.value">
          保存文档
        </LsButton>
      </LsFormActions>
    </form>
  <template #aside><p v-if="editing && !(routeAccess.restricted.value) && detail.isPending.value" role="status">正在读取资料…</p><p v-else-if="editing && !(routeAccess.restricted.value) && detail.isError.value" role="status">资料暂不可用，请恢复读取后查看摘要。</p><template v-else><LsPanel><LsSectionHeader title="文档设置" description="当前草稿，保存后生效。" /><LsDescriptionList><dt>归属人员</dt><dd>{{ routeAccess.restricted.value ? '-' : (entities.data.value?.find(item => item.entity_id === form.entity_id)?.name || '尚未选择') }}</dd><dt>可见范围</dt><dd>{{ routeAccess.restricted.value ? '-' : (visibilityOptions.find(item => item.value === form.visibility)?.label || '-' ) }}</dd><dt>管理范围</dt><dd>{{ routeAccess.restricted.value ? '-' : (managerScopeOptions.find(item => item.value === form.manager_scope)?.label || '-' ) }}</dd><dt>公开分组</dt><dd>{{ routeAccess.restricted.value ? '-' : (`${form.tags.length} 个标签`) }}</dd></LsDescriptionList></LsPanel></template></template>
  </LsFormPage>
</template>

<style scoped>

.document-form { display: grid; gap: 22px; }
.document-tags { display: grid; gap: 16px; }
</style>
