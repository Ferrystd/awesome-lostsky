<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
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
      <div v-if="presets.length && !disabledReason" :id="`${idPrefix}-presets`" class="preset-rail" role="group" aria-label="预设评论">
        <LsButton v-for="preset in presets" :key="preset.id" class="preset-bubble" size="sm" variant="secondary" :title="`${preset.scope === 'team' ? '团队' : '个人'} · ${preset.content}`" @click="selectPreset(preset.id)">
          <span class="preset-bubble__label">{{ preset.scope === 'team' ? '团队' : '个人' }} · {{ preset.content }}</span>
        </LsButton>
      </div>
      <span v-else-if="loading && !disabledReason" class="preset-loading" role="status">正在加载预设…</span>
      <div class="comment-compose">
        <NInput :input-props="{ id: `${idPrefix}-comment`, 'aria-label': '评论内容' }" :value="modelValue" type="textarea" :maxlength="500" placeholder="输入评论内容" :autosize="{ minRows: 1, maxRows: 3 }" @update:value="$emit('update:modelValue', $event)" />
        <slot name="feed-action" />
      </div>
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
.comment-fields--rail { gap: .375rem; }
.preset-rail { display: flex; gap: .375rem; min-width: 0; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.preset-rail::-webkit-scrollbar { height: 4px; }
.preset-rail::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.preset-bubble { flex: none; max-width: 12rem; min-height: 44px; border-radius: 999px; }
.preset-bubble__label { display: block; min-width: 0; max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preset-loading { color: var(--text-secondary); font-size: .875rem; }
.comment-compose { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: .375rem; min-width: 0; }
.comment-compose > :first-child { min-width: 0; min-height: 44px; }
.comment-compose > :slotted(.ls-button) { min-height: 44px; }
</style>
