<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { managerScopeOptions, visibilityOptions } from '../lib/access'
import { searchEntities, uploadMarkdownImage } from '../lib/markdown'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  title: '',
  content: '',
  target_type: route.query.target_type === 'teamMember' ? 'teamMember' : 'team',
  target_id: Number(route.query.target_id || 0),
  manager_scope: route.query.target_type === 'teamMember' ? 2 : 1,
  visibility: route.query.target_type === 'teamMember' ? 3 : 1,
  sort: 0,
})

const detail = useQuery({
  queryKey: computed(() => ['doc', id.value]),
  queryFn: () => api.get<Record<string, unknown>>('/doc/get', { id: id.value }),
  enabled: editing,
})

const managerSelectOptions = managerScopeOptions as SelectOption[]
const visibilitySelectOptions = visibilityOptions as SelectOption[]

watch(() => detail.data.value, (data) => {
  if (!data) return
  form.title = String(data.title ?? '')
  form.content = String(data.content ?? '')
  form.target_type = data.target_type === 'teamMember' ? 'teamMember' : 'team'
  form.target_id = Number(data.target_id ?? 0)
  form.manager_scope = enumOptionValue(data.manager_scope, managerScopeOptions, 1)
  form.visibility = enumOptionValue(data.visibility, visibilityOptions, 1)
  form.sort = Number(data.sort ?? 0)
}, { immediate: true })

const save = useMutation({
  mutationFn: () => api.post<{ id?: number }>(editing.value ? '/doc/edit' : '/doc/create', {
    ...(editing.value ? { id: id.value } : {
      target_type: form.target_type,
      ...(form.target_type === 'teamMember' ? { target_id: form.target_id } : {}),
    }),
    title: form.title.trim(),
    content: form.content,
    manager_scope: form.manager_scope,
    visibility: form.visibility,
    sort: form.sort,
  }),
  onSuccess: async (result) => {
    editor.value?.clearDraft()
    await queryClient.invalidateQueries({ queryKey: ['docs'] })
    const savedId = editing.value ? id.value : Number(result?.id || 0)
    await router.push(savedId ? `/doc?id=${savedId}` : '/docs')
  },
})

const targetOptions = [
  { label: '团队文档', value: 'team' },
  { label: '成员文档', value: 'teamMember' },
]
</script>

<template>
  <div class="document-form-view">
    <AdminPageHeader
      :title="editing ? '编辑文档' : '新建文档'"
      description="使用可视化编辑器整理长期知识；输入 @ 可插入团队或成员对象。"
      back-to="/docs"
      back-label="返回文档列表"
    />

    <p v-if="detail.isError.value" class="feedback error" role="alert">{{ friendlyError(detail.error.value) }}</p>
    <form v-else class="document-form" @submit.prevent="save.mutate()">
      <label class="field full">
        <span>标题 <b>*</b></span>
        <NInput v-model:value="form.title" size="large" placeholder="一句话说明这份文档解决什么问题" maxlength="120" show-count required />
      </label>

      <div v-if="!editing" class="field-row">
        <label class="field">
          <span>归属对象</span>
          <NSelect v-model:value="form.target_type" :options="targetOptions" />
        </label>
        <label v-if="form.target_type === 'teamMember'" class="field">
          <span>成员 ID <b>*</b></span>
          <NInputNumber v-model:value="form.target_id" :min="1" :precision="0" class="control" />
        </label>
      </div>

      <label class="field full">
        <span>正文</span>
        <LsMarkdownEditor
          v-if="!editing || detail.isSuccess.value"
          ref="editor"
          v-model="form.content"
          :draft-key="`document:${editing ? id : 'new'}`"
          :search-entities="searchEntities"
          :upload-image="uploadMarkdownImage"
          placeholder="开始写作，或输入 @ 引用团队与成员…"
        />
      </label>

      <section class="policy" aria-labelledby="document-policy-title">
        <div>
          <h2 id="document-policy-title">访问规则</h2>
          <p>归属成员时可允许本人管理；公开可见会将正文暴露给未登录访客。</p>
        </div>
        <div class="field-row">
          <label class="field">
            <span>管理范围</span>
            <NSelect v-model:value="form.manager_scope" :options="managerSelectOptions" />
          </label>
          <label class="field">
            <span>可见范围</span>
            <NSelect v-model:value="form.visibility" :options="visibilitySelectOptions" />
          </label>
          <label class="field compact">
            <span>排序</span>
            <NInputNumber v-model:value="form.sort" :precision="0" class="control" />
          </label>
        </div>
      </section>

      <p v-if="save.isError.value" class="feedback error" role="alert">{{ friendlyError(save.error.value) }}</p>
      <div class="actions">
        <LsButton type="button" variant="secondary" @click="router.push('/docs')">取消</LsButton>
        <LsButton type="submit" size="lg" :loading="save.isPending.value" :disabled="!form.title.trim() || (form.target_type === 'teamMember' && !form.target_id)">
          保存文档
        </LsButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.document-form-view { display: grid; gap: 24px; }
.document-form { display: grid; gap: 22px; max-width: 920px; }
.field { display: grid; gap: 8px; min-width: 0; }
.field > span { color: var(--text-secondary); font-size: .875rem; font-weight: 650; }
.field b { color: var(--danger); }
.field-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.field-row .compact { grid-column: 1 / 2; }
.control { width: 100%; }
.policy { display: grid; gap: 18px; padding: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-subtle); }
.policy h2 { margin: 0 0 5px; font-size: 1rem; }
.policy p { margin: 0; color: var(--text-secondary); font-size: .875rem; }
.actions { display: flex; justify-content: flex-end; gap: 10px; padding-bottom: 36px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: var(--radius-md); }
.error { color: var(--danger); background: color-mix(in srgb, var(--danger) 9%, transparent); }
@media (max-width: 720px) {
  .field-row { grid-template-columns: 1fr; }
  .field-row .compact { grid-column: auto; }
  .policy { padding: 16px; }
  .actions > * { flex: 1; }
}
</style>
