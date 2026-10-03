<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import { NInputNumber } from 'naive-ui'

defineProps<{ idPrefix: string }>()
const unusedMinutes = defineModel<number | null>('unusedMinutes', { default: null })
const confirmationMinutes = defineModel<number | null>('confirmationMinutes', { default: null })
</script>

<template>
  <LsField label="未发起核销时限（分钟）" :for-id="`${idPrefix}-unused-auto-complete`" hint="留空关闭。从购买或获赠权益起计时；到期仅结清未使用且未预占的额度，接单分成归团队。">
    <NInputNumber :id="`${idPrefix}-unused-auto-complete`" v-model:value="unusedMinutes" :min="1" :max="5256000" :precision="0" clearable placeholder="不自动结单" />
  </LsField>
  <LsField label="顾客确认时限（分钟）" :for-id="`${idPrefix}-auto-complete`" hint="留空须由顾客手动确认。从接单人请求结单起计时；顾客未处理且到期后自动结单，拒绝后停止本次计时。">
    <NInputNumber :id="`${idPrefix}-auto-complete`" v-model:value="confirmationMinutes" :min="1" :max="5256000" :precision="0" clearable placeholder="不自动结单" />
  </LsField>
</template>
