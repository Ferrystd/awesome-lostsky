<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { NFormItem, NInput } from 'naive-ui'
import { ref } from 'vue'
import { searchEntities, uploadMarkdownImage } from '../lib/markdown'
import type { MemberProfileMediaKey } from '../composables/useMemberProfileUpload'

export interface MemberProfile {
  nickname: string
  avatar: string
  description: string
  intro_image: string
  intro_video: string
  introduction_markdown: string
}

const profile = defineModel<MemberProfile>({ required: true })
const props = defineProps<{
  draftKey: string
  uploadDisabledReason: string
  uploading: MemberProfileMediaKey | ''
  editorReady: boolean
}>()
const emit = defineEmits<{ upload: [key: MemberProfileMediaKey, event: Event] }>()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
defineExpose({ clearDraft: () => editor.value?.clearDraft() })
</script>

<template>
  <div class="member-profile-fields">
    <LsField label="团队昵称" for-id="member-profile-nickname" required>
      <NInput id="member-profile-nickname" v-model:value="profile.nickname" autocomplete="name" maxlength="80" show-count placeholder="在当前团队中显示的名称" />
    </LsField>
    <NFormItem label="头像"><LsUploadField v-model="profile.avatar" placeholder="图片 URL 或上传文件" button-label="上传图片" accept="image/*" :loading="uploading === 'avatar'" :disabled="Boolean(uploading) || Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" @change="emit('upload', 'avatar', $event)" /></NFormItem>
    <LsField label="简短介绍" for-id="member-profile-description">
      <NInput id="member-profile-description" v-model:value="profile.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="500" show-count />
    </LsField>
    <div class="member-profile-fields__media">
      <NFormItem label="介绍图片"><LsUploadField v-model="profile.intro_image" placeholder="图片 URL" button-label="上传" accept="image/*" :loading="uploading === 'intro_image'" :disabled="Boolean(uploading) || Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" :show-reason="false" @change="emit('upload', 'intro_image', $event)" /></NFormItem>
      <NFormItem label="介绍视频"><LsUploadField v-model="profile.intro_video" placeholder="视频 URL" button-label="上传" accept="video/*" :loading="uploading === 'intro_video'" :disabled="Boolean(uploading) || Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" :show-reason="false" @change="emit('upload', 'intro_video', $event)" /></NFormItem>
    </div>
    <NFormItem label="详细介绍"><LsMarkdownEditor v-if="props.editorReady" ref="editor" v-model="profile.introduction_markdown" :draft-key="draftKey" :search-entities="searchEntities" :upload-image="uploadMarkdownImage" :upload-disabled-reason="uploadDisabledReason" placeholder="写下详细介绍，输入 @ 可引用团队或其他成员…" /></NFormItem>
    <slot name="error" />
  </div>
</template>

<style scoped>
.member-profile-fields { display: grid; gap: 1rem; }
.member-profile-fields__media { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 680px) { .member-profile-fields__media { grid-template-columns: 1fr; } }
</style>
