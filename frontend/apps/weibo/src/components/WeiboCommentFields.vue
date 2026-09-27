<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { NButton, NInput, NScrollbar, NSelect } from 'naive-ui'
import { ArrowUp } from '@lucide/vue'
import { feedback } from '@lostsky/ui/feedback'
import { computed } from 'vue'
import type { WeiboCommentPreset } from '../types'

const props = defineProps<{ modelValue: string; presets: WeiboCommentPreset[]; idPrefix: string; feedRail?: boolean; loading?: boolean; error?: string; disabledReason?: string; sending?: boolean; submitReason?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: [] }>()
const options = computed(() => props.disabledReason ? [] : props.presets.map(item => ({ label: `${item.scope === 'team' ? '团队' : '个人'} · ${item.content}`, value: item.id })))
function selectPreset(id: number) {
  if (props.disabledReason) return
  const preset = props.presets.find(item => item.id === id)
  if (preset) emit('update:modelValue', preset.content)
}
function submit() {
  const reason = props.submitReason || (props.sending ? '正在发表评论，请稍候' : '')
  if (reason) return feedback.info(reason)
  emit('submit')
}
</script>

<template>
  <div class="comment-fields" :class="{ 'comment-fields--rail': feedRail }">
    <LsInlineError v-if="error && !disabledReason" :message="`预设评论加载失败，可直接填写评论：${error}`" />
    <template v-if="feedRail">
      <NScrollbar v-if="presets.length && !disabledReason" :id="`${idPrefix}-presets`" x-scrollable role="group" aria-label="预设评论">
        <div class="preset-rail">
          <LsButton v-for="preset in presets" :key="preset.id" variant="secondary" :aria-pressed="modelValue === preset.content" :aria-label="`${preset.scope === 'team' ? '团队' : '个人'} · ${preset.content}`" :title="`${preset.scope === 'team' ? '团队' : '个人'} · ${preset.content}`" @click="selectPreset(preset.id)">
            <span class="preset-bubble__label">{{ preset.content }}</span>
          </LsButton>
        </div>
      </NScrollbar>
      <span v-else-if="loading && !disabledReason" class="preset-loading" role="status">正在加载预设…</span>
      <NInput class="comment-compose" size="large" :input-props="{ id: `${idPrefix}-comment`, 'aria-label': '评论内容' }" :value="modelValue" type="textarea" :maxlength="500" placeholder="输入评论内容" :autosize="{ minRows: 1, maxRows: 3 }" @update:value="$emit('update:modelValue', $event)">
        <template #suffix>
          <NButton circle type="primary" :loading="sending" :secondary="Boolean(submitReason)" :aria-disabled="Boolean(submitReason || sending)" aria-label="发表评论" title="发表评论" @click="submit"><template #icon><ArrowUp :size="20" aria-hidden="true" /></template></NButton>
        </template>
      </NInput>
    </template>
    <template v-else>
      <LsField label="预设评论" :for-id="`${idPrefix}-preset`" hint="选择团队或个人预设后仍可修改，也可以直接填写评论。">
        <NSelect :id="`${idPrefix}-preset`" :value="null" :options="options" :loading="!disabledReason && loading" :disabled="Boolean(disabledReason)" :placeholder="disabledReason ? '-' : '选择团队或个人预设'" @update:value="selectPreset" />
      </LsField>
      <LsField label="评论内容" :for-id="`${idPrefix}-comment`" required>
        <NInput :input-props="{ id: `${idPrefix}-comment` }" :value="modelValue" type="textarea" :maxlength="500" show-count placeholder="输入评论内容" :autosize="{ minRows: 4, maxRows: 8 }" @update:value="$emit('update:modelValue', $event)" />
      </LsField>
    </template>
  </div>
</template>

<style scoped>
.comment-fields { display: grid; gap: 1rem; min-width: 0; }
.comment-fields--rail { gap: .25rem; }
.preset-rail { display: flex; gap: .5rem; width: max-content; padding-block: .25rem; }
.preset-bubble__label { display: block; min-width: 0; max-width: 5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preset-loading { color: var(--text-secondary); font-size: .875rem; }
.comment-compose { min-width: 0; }
</style>
