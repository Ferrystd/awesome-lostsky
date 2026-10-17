<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft, Save } from '@lucide/vue'

import { api, friendlyError } from '@lostsky/api/client'

import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { expectedEntity, loadAccess } from '../lib/workspace'
import { interactionPresetQuery } from '../lib/interactionDraft'
import { useCommentPresets } from '../lib/useCommentPresets'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import type { WeiboCommentPreset } from '../types'

const route = useRoute()
const { personal, prefix, scope, query, accessReason, restricted } = useCommentPresets()
const creating = computed(() => route.meta.presetMode === 'new')
const listPath = computed(() => ({ path: `${prefix.value}/interactions/comment-presets`, query: interactionPresetQuery(route.query) }))
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess() })
const client = useQueryClient()
let nextKey = 0
const createPreset = (content = '') => ({ key: ++nextKey, content })
const draft = ref<ReturnType<typeof createPreset>[]>([])
const contents = computed(() => draft.value.map(item => item.content))
const baseline = ref('[]')
const initialized = ref(false)
const restrictedDraft = ref('')
const pendingScopes = ref(new Set<string>())
const pending = computed(() => pendingScopes.value.has(prefix.value))
const dirty = computed(() => JSON.stringify(contents.value) !== baseline.value || Boolean(restrictedDraft.value))
useUnsavedChangesGuard(computed(() => dirty.value || pending.value), { shouldConfirm: (to, from) => to.path !== from.path })
watch(() => route.path, () => { draft.value = []; baseline.value = '[]'; initialized.value = false; restrictedDraft.value = '' }, { flush: 'sync' })
watch([query.data, () => route.path], ([data]) => {
  if (!data || restricted.value || (initialized.value && dirty.value)) return
  const saved = data.filter(item => item.scope === scope.value).map(item => item.content)
  baseline.value = JSON.stringify(saved)
  draft.value = saved.map(createPreset)
  if (creating.value && !initialized.value) {
    draft.value.push(createPreset(restrictedDraft.value))
    restrictedDraft.value = ''
  }
  initialized.value = true
}, { immediate: true })
const editReason = computed(() => query.isPending.value ? '正在加载预设评论，请稍候' : query.isError.value ? '预设评论加载失败，请稍后再试' : pending.value ? '正在保存，请稍候' : '')
const reason = computed(() => accessReason.value || editReason.value || (!dirty.value ? '没有未保存的修改' : draft.value.length > 20 ? '最多保存 20 条预设，请移除多余项' : draft.value.some(item => !item.content.trim()) ? '请填写每条预设内容，或移除空白项' : ''))
async function save() {
  if (reason.value) return feedback.info(reason.value)
  const submitted = contents.value.map(item => item.trim())
  const localSnapshot = JSON.stringify(contents.value)
  const submittedPrefix = prefix.value
  const submittedPath = route.fullPath
  const submittedScope = scope.value
  const entity = expectedEntity(access.data.value, personal.value)
  pendingScopes.value.add(submittedPrefix)
  try {
    const data = await api.post<WeiboCommentPreset[]>(`${submittedPrefix}/comment-presets`, { contents: submitted, ...entity })
    const saved = data.filter(item => item.scope === submittedScope).map(item => item.content)
    if (prefix.value === submittedPrefix && route.fullPath === submittedPath) {
      baseline.value = JSON.stringify(saved)
      if (JSON.stringify(contents.value) === localSnapshot) draft.value = saved.map(createPreset)
    }
    client.setQueryData(['weibo-comment-presets', submittedPrefix], data)
    await client.invalidateQueries({ queryKey: ['weibo-comment-presets'] })
    feedback.success('预设评论已保存')
  } catch (error) { feedback.error(friendlyError(error)) }
  finally { pendingScopes.value.delete(submittedPrefix) }
}
</script>

<template>
  <LsFormPage :title="creating ? '添加预设' : '编辑预设'" description="维护常用回复，修改后统一保存。">
    <template #actions>
      <LsPageLink :to="listPath" :icon="ArrowLeft" label="返回预设评论" />
    </template>

    <LsAsyncState v-if="query.isError.value" state="error" title="预设评论加载失败" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-if="!restricted && query.isPending.value" state="loading" :rows="5" />
    <form v-else-if="restricted || !query.isError.value || query.data.value || dirty" class="weibo-form" @submit.prevent="save">
      <LsFormSection :title="personal ? '个人预设' : '团队预设'" description="最多 20 条，每条最多 500 字。修改后统一保存。">
        <template v-if="restricted">
          <LsField label="已保存的预设" for-id="saved-presets"><output id="saved-presets">-</output></LsField>
          <LsField v-if="creating" label="新增预设" for-id="preset-0" required>
            <NInput v-model:value="restrictedDraft" type="textarea" :maxlength="500" show-count :input-props="{ id: 'preset-0' }" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="输入常用评论" />
          </LsField>
        </template>
        <LsFormList v-else v-model="draft" :item-key="item => item.key" :create-item="createPreset" item-label="预设" add-label="添加预设" empty-text="尚未添加预设评论" :disabled="Boolean(editReason)" :disabled-reason="editReason">
          <template #item="{ item, index }">
            <LsField :label="`预设 ${index + 1}`" :for-id="`preset-${index}`" required>
              <NInput v-model:value="item.content" type="textarea" :maxlength="500" show-count :input-props="{ id: `preset-${index}` }" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="输入常用评论" />
            </LsField>
          </template>
        </LsFormList>
        <LsInlineError v-if="!restricted && draft.length > 20" message="最多保存 20 条预设，请移除多余项。" />
      </LsFormSection>
      <LsFormSection title="保存预设" description="当前列表中的增删与修改将一起保存。">
      <LsFormActions><LsButton type="submit" :loading="pending" :disabled="Boolean(reason)" :disabled-reason="reason"><template #icon><Save :size="18" /></template>保存预设评论</LsButton></LsFormActions>
      </LsFormSection>
    </form>
  </LsFormPage>
</template>
