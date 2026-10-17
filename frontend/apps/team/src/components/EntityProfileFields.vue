<script setup lang="ts">
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import { NInput } from 'naive-ui'
import { computed, ref } from 'vue'
import { searchEntities } from '../lib/markdown'

export interface EntityProfile {
  name?: string
  nickname?: string
  avatar: string
  description: string
  intro_image: string
  intro_video: string
  introduction_markdown: string
}

const profile = defineModel<EntityProfile>({ required: true })
const uploading = defineModel<boolean>('uploading', { default: false })
const props = withDefaults(defineProps<{
  draftKey: string
  idPrefix: string
  uploadFile: (file: File, source?: 'attachment' | 'markdown') => Promise<string>
  nameKey?: 'name' | 'nickname'
  nameLabel?: string
  uploadDisabledReason?: string
  editorReady?: boolean
  disabled?: boolean
}>(), {
  nameKey: 'name',
  nameLabel: '名称',
  uploadDisabledReason: '',
  editorReady: true,
  disabled: false,
})
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const displayName = computed({
  get: () => props.nameKey === 'nickname' ? profile.value.nickname ?? '' : profile.value.name ?? '',
  set: (value: string) => {
    if (props.nameKey === 'nickname') profile.value.nickname = value
    else profile.value.name = value
  },
})
const disabledReason = computed(() => {
  if (props.disabled) return '当前资料为只读模式'
  if (uploading.value) return '文件正在上传，请稍候'
  return props.uploadDisabledReason
})
const uploadDisabled = computed(() => props.disabled || uploading.value || Boolean(props.uploadDisabledReason))

function setUploading(value: boolean) {
  uploading.value = value
}

async function uploadMarkdownImage(file: File) {
  if (disabledReason.value) throw new Error(disabledReason.value)
  uploading.value = true
  try {
    return await props.uploadFile(file, 'markdown')
  } finally {
    uploading.value = false
  }
}

defineExpose({ clearDraft: () => editor.value?.clearDraft() })
</script>

<template>
  <div class="entity-profile-fields">
    <LsFormFields>
    <LsField :label="nameLabel" :for-id="`${idPrefix}-name`" required>
      <NInput :input-props="{ id: `${idPrefix}-name` }" v-model:value="displayName" autocomplete="name" maxlength="80" show-count :disabled="disabled" />
    </LsField>
    <LsField
      label="头像"
      :for-id="`${idPrefix}-avatar`"
    >
      <LsMediaUploadField
        :id="`${idPrefix}-avatar`"
        v-model="profile.avatar"
        :upload="uploadFile"
        placeholder="图片 URL 或上传文件"
        button-label="上传头像"
        accept="image/*"
        :disabled="uploadDisabled"
        :disabled-reason="disabledReason"
        @uploading="setUploading"
      />
    </LsField>
    <LsField label="简短介绍" :for-id="`${idPrefix}-description`">
      <NInput :input-props="{ id: `${idPrefix}-description` }" v-model:value="profile.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="500" show-count :disabled="disabled" />
    </LsField>
    <LsField
      label="介绍图片"
      :for-id="`${idPrefix}-intro-image`"
    >
      <LsMediaUploadField
        :id="`${idPrefix}-intro-image`"
        v-model="profile.intro_image"
        :upload="uploadFile"
        placeholder="图片 URL 或上传文件"
        button-label="上传介绍图片"
        accept="image/*"
        :disabled="uploadDisabled"
        :disabled-reason="disabledReason"
        @uploading="setUploading"
      />
    </LsField>
    <LsField
      label="介绍视频"
      :for-id="`${idPrefix}-intro-video`"
      hint="可粘贴已登记媒体 URL，或从本地上传视频。"
    >
      <LsMediaUploadField
        :id="`${idPrefix}-intro-video`"
        v-model="profile.intro_video"
        :upload="uploadFile"
        placeholder="视频 URL 或上传文件"
        button-label="上传介绍视频"
        accept="video/*"
        :disabled="uploadDisabled"
        :disabled-reason="disabledReason"
        @uploading="setUploading"
      />
    </LsField>
    </LsFormFields>
    <LsFormContent>
    <LsField label="详细介绍" :for-id="`${idPrefix}-introduction`">
      <LsMarkdownRenderer v-if="disabled" :id="`${idPrefix}-introduction`" :content="profile.introduction_markdown || '未填写'" />
      <LsMarkdownEditor
        v-else-if="editorReady"
        :id="`${idPrefix}-introduction`"
        ref="editor"
        v-model="profile.introduction_markdown"
        :draft-key="draftKey"
        :search-entities="searchEntities"
        :upload-image="uploadMarkdownImage"
        :upload-disabled-reason="disabledReason"
        placeholder="写下详细介绍，输入 @ 可引用团队或其他成员…"
      />
    </LsField>
    </LsFormContent>
  </div>
</template>

<style scoped>
.entity-profile-fields { min-width: 0; display: grid; }
</style>
