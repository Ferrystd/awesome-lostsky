<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
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
  if (!editing.value && !form.entity_id && items?.length) form.entity_id = items[0].entity_id
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
  form.title = String(data.title ?? '')
  form.content = String(data.content ?? '')
  form.entity_id = Number(data.entity_id ?? 0)
  form.manager_scope = enumOptionValue(data.manager_scope, managerScopeOptions, 1)
  form.visibility = enumOptionValue(data.visibility, visibilityOptions, 1)
  form.sort = Number(data.sort ?? 0)
  form.tags = documentTagDrafts(data.tags)
}, { immediate: true })

const save = useMutation({
  mutationFn: () => api.post<{ id?: number }>(editing.value ? '/doc/edit' : '/doc/create', {
    ...(editing.value ? { id: id.value } : { entity_id: form.entity_id }),
    title: form.title.trim(),
    content: form.content,
    manager_scope: form.manager_scope,
    visibility: form.visibility,
    sort: form.sort,
    tags: documentTagsPayload(form.tags),
  }),
  onSuccess: async (result) => {
    editor.value?.clearDraft()
    await queryClient.invalidateQueries({ queryKey: ['docs'] })
    const savedId = editing.value ? id.value : Number(result?.id || 0)
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
  <div class="document-form-view">
    <AdminPageHeader
      :title="editing ? '编辑文档' : '新建文档'"
      description="使用可视化编辑器整理长期知识；输入 @ 可插入团队或成员对象。"
      back-to="/docs"
      back-label="返回文档列表"
    />

    <LsInlineError v-if="detail.isError.value && !routeAccess.restricted.value" :message="friendlyError(detail.error.value)" />
    <form v-else class="document-form" @submit.prevent="submit">
      <LsField label="标题" for-id="document-title" required><NInput id="document-title" v-model:value="form.title" placeholder="一句话说明这份文档解决什么问题" maxlength="120" show-count required /></LsField>

      <div v-if="!editing" class="field-row">
        <LsField label="归属对象" for-id="document-entity"><LsEntitySelect id="document-entity" v-model="form.entity_id" :entities="entities.data.value ?? []" :loading="entities.isPending.value" :disabled="routeAccess.restricted.value || entities.isError.value || !entities.data.value?.length" :placeholder="routeAccess.restricted.value ? '-' : '选择归属对象'" /></LsField>
      </div>

      <section class="document-tags" aria-labelledby="document-tags-title">
        <div>
          <h2 id="document-tags-title">文档标签</h2>
          <p>用于公开页面的文档分组；标签是独立资料，无需输入 #。</p>
        </div>
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

      <NFormItem label="正文">
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
      </NFormItem>

      <section class="policy" aria-labelledby="document-policy-title">
        <div>
          <h2 id="document-policy-title">访问规则</h2>
          <p>归属成员时可允许本人管理；公开可见会将正文暴露给未登录访客。</p>
        </div>
        <div class="field-row">
          <LsField label="管理范围" for-id="document-manager-scope"><NSelect id="document-manager-scope" v-model:value="form.manager_scope" :options="managerSelectOptions" /></LsField>
          <LsField label="可见范围" for-id="document-visibility"><NSelect id="document-visibility" v-model:value="form.visibility" :options="visibilitySelectOptions" /></LsField>
          <LsField label="排序" for-id="document-sort"><NInputNumber id="document-sort" v-model:value="form.sort" :precision="0" class="control" /></LsField>
        </div>
      </section>

      <LsInlineError v-if="save.isError.value && !routeAccess.restricted.value" :message="friendlyError(save.error.value)" />
      <div class="actions">
        <LsButton type="button" variant="secondary" @click="router.push('/docs')">取消</LsButton>
        <LsButton type="submit" size="lg" :loading="save.isPending.value" :disabled="routeAccess.restricted.value || !form.title.trim() || (!editing && !form.entity_id)" :disabled-reason="routeAccess.reason.value">
          保存文档
        </LsButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.document-form-view { display: grid; gap: 24px; }
.document-form { display: grid; gap: 22px; max-width: 920px; }
.field-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.field-row .compact { grid-column: 1 / 2; }
.control { width: 100%; }
.document-tags { display: grid; gap: 16px; }
.document-tags h2 { margin: 0 0 5px; font-size: 1rem; }
.document-tags p { margin: 0; color: var(--text-secondary); font-size: .875rem; line-height: 1.55; }
.policy { display: grid; gap: 18px; padding: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-subtle); }
.policy h2 { margin: 0 0 5px; font-size: 1rem; }
.policy p { margin: 0; color: var(--text-secondary); font-size: .875rem; }
.actions { display: flex; justify-content: flex-end; gap: 10px; padding-bottom: 36px; }
.error { color: var(--danger); background: color-mix(in srgb, var(--danger) 9%, transparent); }
@media (max-width: 720px) {
  .field-row { grid-template-columns: 1fr; }
  .field-row .compact { grid-column: auto; }
  .policy { padding: 16px; }
  .actions > * { flex: 1; }
}
</style>
