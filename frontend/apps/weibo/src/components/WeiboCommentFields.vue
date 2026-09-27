<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { NInput, NSelect } from 'naive-ui'
import { computed } from 'vue'
import type { WeiboCommentPreset } from '../types'

const props = defineProps<{ modelValue: string; presets: WeiboCommentPreset[]; idPrefix: string; feedRail?: boolean; loading?: boolean; error?: string; disabledReason?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const options = computed(() => props.disabledReason ? [] : props.presets.map(item => ({ label: `${item.scope === 'team' ? '团队' : '个人'} · ${item.content}`, value: item.id })))
function selectPreset(id: number) {
  if (props.disabledReason) return
  const preset = props.presets.find(item => item.id === id)
  if (preset) emit('update:modelValue', preset.content)
}
</script>

<template>
  <div class="comment-fields" :class="{ 'comment-fields--rail': feedRail }">
    <LsInlineError v-if="error && !disabledReason" :message="`预设评论加载失败，可直接填写评论：${error}`" />
    <template v-if="feedRail">
      <NSelect :id="`${idPrefix}-preset`" aria-label="预设评论" :value="null" :options="options" :loading="!disabledReason && loading" :disabled="Boolean(disabledReason)" :placeholder="disabledReason ? '-' : '选择预设'" @update:value="selectPreset" />
      <NInput :input-props="{ id: `${idPrefix}-comment`, 'aria-label': '评论内容' }" :value="modelValue" type="textarea" :maxlength="500" placeholder="输入评论内容" :autosize="{ minRows: 1, maxRows: 3 }" @update:value="$emit('update:modelValue', $event)" />
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
.comment-fields--rail { grid-template-columns: minmax(8rem, 14rem) minmax(0, 1fr); align-items: start; gap: .5rem; }
.comment-fields--rail > .ls-inline-error { grid-column: 1 / -1; }
@media (max-width: 767px) {
  .comment-fields--rail { grid-template-columns: minmax(0, 1fr); }
}
</style>
