<script setup lang="ts">
import { NButton, NInput, NModal } from 'naive-ui'
import { computed, ref, watch } from 'vue'
const props = defineProps<{
  show: boolean; title: string; consequence: string; actionLabel: string; danger?: boolean; loading?: boolean
}>()
const emit = defineEmits<{ 'update:show': [value: boolean]; confirm: [reason: string] }>()
const reason = ref('')
watch(() => props.show, (show) => { if (show) reason.value = '' })
const valid = computed(() => reason.value.trim().length >= 5 && reason.value.trim().length <= 500)
</script>
<template>
  <NModal :show="show" preset="card" :title="title" class="reason-dialog" @update:show="emit('update:show', $event)">
    <p class="reason-consequence">{{ consequence }}</p>
    <label>操作原因
      <NInput v-model:value="reason" type="textarea" :autosize="{ minRows: 3, maxRows: 7 }" maxlength="500" show-count placeholder="请填写 5–500 个字符，原因会写入审计日志" />
    </label>
    <div class="dialog-actions">
      <NButton :disabled="loading" @click="emit('update:show', false)">保留现状</NButton>
      <NButton :type="danger ? 'error' : 'primary'" :loading="loading" :disabled="!valid" @click="emit('confirm', reason.trim())">{{ actionLabel }}</NButton>
    </div>
  </NModal>
</template>
