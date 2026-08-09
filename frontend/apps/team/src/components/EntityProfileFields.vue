<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import { NFormItem, NInput } from 'naive-ui'
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
  uploadFile: (file: File) => Promise<string>
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
    return await props.uploadFile(file)
  } finally {
    uploading.value = false
  }
}

defineExpose({ clearDraft: () => editor.value?.clearDraft() })
</script>

<template>
  <div class="entity-profile-fields">
    <LsField :label="nameLabel" :for-id="`${idPrefix}-name`" required>
      <NInput :id="`${idPrefix}-name`" v-model:value="displayName" autocomplete="name" maxlength="80" show-count :disabled="disabled" />
    </LsField>
    <NFormItem label="头像">
      <LsMediaUploadField
        v-model="profile.avatar"
        :upload="uploadFile"
        placeholder="图片 URL 或上传文件"
        button-label="上传图片"
        accept="image/*"
        :disabled="uploadDisabled"
        :disabled-reason="disabledReason"
        @uploading="setUploading"
      />
    </NFormItem>
    <LsField label="简短介绍" :for-id="`${idPrefix}-description`">
      <NInput :id="`${idPrefix}-description`" v-model:value="profile.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="500" show-count :disabled="disabled" />
    </LsField>
    <div class="entity-profile-fields__media">
      <NFormItem label="介绍图片">
        <LsMediaUploadField
          v-model="profile.intro_image"
          :upload="uploadFile"
          placeholder="图片 URL 或上传文件"
          button-label="上传图片"
          accept="image/*"
          :disabled="uploadDisabled"
          :disabled-reason="disabledReason"
          @uploading="setUploading"
        />
      </NFormItem>
      <NFormItem label="介绍视频">
        <LsMediaUploadField
          v-model="profile.intro_video"
          :upload="uploadFile"
          placeholder="视频 URL 或上传文件"
          button-label="上传视频"
          accept="video/*"
          :disabled="uploadDisabled"
          :disabled-reason="disabledReason"
          @uploading="setUploading"
        />
      </NFormItem>
    </div>
    <NFormItem label="详细介绍">
      <LsMarkdownRenderer v-if="disabled" :content="profile.introduction_markdown || '未填写'" />
      <LsMarkdownEditor
        v-else-if="editorReady"
        ref="editor"
        v-model="profile.introduction_markdown"
        :draft-key="draftKey"
        :search-entities="searchEntities"
        :upload-image="uploadMarkdownImage"
        :upload-disabled-reason="disabledReason"
        placeholder="写下详细介绍，输入 @ 可引用团队或其他成员…"
      />
    </NFormItem>
  </div>
</template>

<style scoped>
.entity-profile-fields { display: grid; gap: 1rem; }
.entity-profile-fields__media { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 680px) { .entity-profile-fields__media { grid-template-columns: 1fr; } }
</style>
