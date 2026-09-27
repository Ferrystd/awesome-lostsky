<script setup lang="ts">
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { NButton, NInput, NScrollbar, NTag } from 'naive-ui'
import { ArrowUp } from '@lucide/vue'
import { feedback } from '@lostsky/ui/feedback'
import type { WeiboCommentPreset } from '../types'

const props = defineProps<{ modelValue: string; presets: WeiboCommentPreset[]; idPrefix: string; loading?: boolean; error?: string; disabledReason?: string; sending?: boolean; submitReason?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: [] }>()
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
  <div class="feed-composer">
    <LsInlineError v-if="error && !disabledReason" :message="`预设评论加载失败，可直接填写评论：${error}`" />
    <NScrollbar v-if="presets.length && !disabledReason" :id="`${idPrefix}-presets`" x-scrollable role="group" aria-label="预设评论">
      <div class="preset-rail">
        <NTag v-for="preset in presets" :key="preset.id" class="preset-chip" checkable round :checked="modelValue === preset.content" role="button" tabindex="0" :aria-pressed="modelValue === preset.content" :aria-label="`${preset.scope === 'team' ? '团队' : '个人'} · ${preset.content}`" :title="`${preset.scope === 'team' ? '团队' : '个人'} · ${preset.content}`" @update:checked="selectPreset(preset.id)" @keydown.enter.prevent="selectPreset(preset.id)" @keydown.space.prevent="selectPreset(preset.id)">
          <span class="preset-bubble__label">{{ preset.content }}</span>
        </NTag>
      </div>
    </NScrollbar>
    <span v-else-if="loading && !disabledReason" class="preset-loading" role="status">正在加载预设…</span>
    <NInput class="comment-compose" size="large" :input-props="{ id: `${idPrefix}-comment`, 'aria-label': '评论内容' }" :value="modelValue" type="textarea" :maxlength="500" placeholder="输入评论内容" :autosize="{ minRows: 1, maxRows: 3 }" @update:value="$emit('update:modelValue', $event)">
      <template #suffix>
        <NButton circle type="primary" :loading="sending" :secondary="Boolean(submitReason)" :aria-disabled="Boolean(submitReason || sending)" aria-label="发表评论" title="发表评论" @click="submit"><template #icon><ArrowUp :size="20" aria-hidden="true" /></template></NButton>
      </template>
    </NInput>
  </div>
</template>

<style scoped>
.feed-composer { display: grid; gap: .25rem; min-width: 0; }
.preset-rail { display: flex; gap: .5rem; width: max-content; padding: .25rem; }
.preset-chip:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.preset-bubble__label { display: block; min-width: 0; max-width: 5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preset-loading { color: var(--text-secondary); font-size: .875rem; }
.comment-compose { min-width: 0; }
</style>
