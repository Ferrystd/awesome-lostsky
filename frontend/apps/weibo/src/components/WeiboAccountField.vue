<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { NSelect } from 'naive-ui'
import { computed } from 'vue'
import type { WeiboAccount } from '../types'

const props = withDefaults(defineProps<{ modelValue: number | null; accounts: WeiboAccount[]; id: string; label?: string; loading?: boolean; error?: string; disabledReason?: string }>(), { label: '微博账号' })
defineEmits<{ 'update:modelValue': [value: number | null] }>()
const options = computed(() => props.disabledReason ? [] : props.accounts.map(account => ({ label: account.screen_name || account.uid, value: account.id })))
</script>

<template>
  <div class="account-field">
    <LsInlineError v-if="error && !disabledReason" :message="`微博账号加载失败：${error}`" />
    <LsField :label="label" :for-id="id" required>
      <NSelect :id="id" :value="disabledReason ? null : modelValue" :options="options" :loading="!disabledReason && loading" :disabled="Boolean(disabledReason)" :placeholder="disabledReason ? '-' : '选择账号'" @update:value="$emit('update:modelValue', $event)" />
    </LsField>
  </div>
</template>

<style scoped>
.account-field { display: grid; gap: .75rem; min-width: 0; }
</style>
