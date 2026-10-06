<script setup lang="ts">
import type { SiteMember } from '@lostsky/shared/siteContent'
import LsField from '@lostsky/ui/components/LsField.vue'
import { NDynamicTags, NInput } from 'naive-ui'

defineProps<{ member: SiteMember; index: number; readonly: boolean }>()
</script>

<template>
  <div class="member-fields">
    <LsField label="姓名" :for-id="`member-name-${index}`" required><NInput v-model:value="member.name" :input-props="{ id: `member-name-${index}` }" :disabled="readonly" :maxlength="60" /></LsField>
    <LsField label="职位" :for-id="`member-role-${index}`" required><NInput v-model:value="member.role" :input-props="{ id: `member-role-${index}` }" :disabled="readonly" :maxlength="100" /></LsField>
    <LsField label="简介" :for-id="`member-description-${index}`" required><NInput v-model:value="member.description" type="textarea" :input-props="{ id: `member-description-${index}` }" :disabled="readonly" :maxlength="2000" show-count /></LsField>
    <LsField label="标签" :for-id="`member-tags-${index}`" hint="最多 8 项，每项最多 30 字"><NDynamicTags v-model:value="member.tags" :id="`member-tags-${index}`" :disabled="readonly" :max="8" /></LsField>
    <LsField label="姓名缩写" :for-id="`member-initials-${index}`" hint="未设置头像时显示"><NInput v-model:value="member.initials" :input-props="{ id: `member-initials-${index}` }" :disabled="readonly" :maxlength="8" /></LsField>
    <LsField label="头像地址" :for-id="`member-avatar-${index}`" hint="填写已有图片的 HTTPS 地址；留空使用姓名缩写"><NInput v-model:value="member.avatar" :input-props="{ id: `member-avatar-${index}` }" :disabled="readonly" :maxlength="2048" /></LsField>
  </div>
</template>

<style scoped>
.member-fields { display: grid; gap: 16px; }
</style>
