<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { NInput, NSelect } from 'naive-ui'
import { computed } from 'vue'
import type { WeiboCommentPreset } from '../types'

const props = defineProps<{ modelValue: string; presets: WeiboCommentPreset[]; idPrefix: string; loading?: boolean; error?: string; disabledReason?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const options = computed(() => props.disabledReason ? [] : props.presets.map(item => ({ label: `${item.scope === 'team' ? '团队' : '个人'} · ${item.content}`, value: item.id })))
function selectPreset(id: number) {
  if (props.disabledReason) return
  const preset = props.presets.find(item => item.id === id)
  if (preset) emit('update:modelValue', preset.content)
}
</script>

<template>
  <div class="comment-fields">
    <LsInlineError v-if="error && !disabledReason" :message="`预设评论加载失败，可直接填写评论：${error}`" />
    <LsField label="预设评论" :for-id="`${idPrefix}-preset`" hint="选择团队或个人预设后仍可修改，也可以直接填写评论。">
      <NSelect :id="`${idPrefix}-preset`" :value="null" :options="options" :loading="!disabledReason && loading" :disabled="Boolean(disabledReason)" :placeholder="disabledReason ? '-' : '选择团队或个人预设'" @update:value="selectPreset" />
    </LsField>
    <LsField label="评论内容" :for-id="`${idPrefix}-comment`" required>
      <NInput :input-props="{ id: `${idPrefix}-comment` }" :value="modelValue" type="textarea" :maxlength="500" show-count placeholder="输入评论内容" :autosize="{ minRows: 4, maxRows: 8 }" @update:value="$emit('update:modelValue', $event)" />
    </LsField>
  </div>
</template>

<style scoped>
.comment-fields { display: grid; gap: 1rem; min-width: 0; }
</style>
