<script setup lang="ts">
import { NAlert } from 'naive-ui'
defineProps<{ status: 'Visible' | 'Deleted' | 'Hidden'; reason?: string }>()
</script>
<template>
  <NAlert v-if="status === 'Deleted'" type="default" title="作者已删除此内容">作者与讨论记录仍然保留。</NAlert>
  <NAlert v-else-if="status === 'Hidden'" type="warning" title="此内容已被隐藏">处理原因：{{ reason || '未填写' }}</NAlert>
</template>
