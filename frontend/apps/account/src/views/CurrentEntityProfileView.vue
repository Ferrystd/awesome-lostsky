<script setup lang="ts">
import { ApiError, api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NAlert, NInput, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useUnsavedGuard } from '../composables/useUnsavedGuard'
import { currentEntityQueryKey, useCurrentEntityQuery, type CurrentProfile } from '../lib/current-entity'

interface Assignee { entity_id: number; name: string; slug: string; type: string }
interface FormState {
  name: string
  avatar: string
  description: string
  intro_image: string
  intro_video: string
  introduction_markdown: string
  assignee_entity_id: number | null
  slug: string
}

const query = useCurrentEntityQuery()
const loadedEntityId = ref(0)
const snapshot = ref('')
const stale = ref(false)
const uploading = ref<keyof CurrentProfile | ''>('')
const form = reactive<FormState>({
  name: '', avatar: '', description: '', intro_image: '', intro_video: '',
  introduction_markdown: '', assignee_entity_id: null, slug: '',
})
const serialized = computed(() => JSON.stringify(form))
const dirty = computed(() => loadedEntityId.value > 0 && serialized.value !== snapshot.value)
const identity = computed(() => query.data.value?.identity ?? null)
const isCustomer = computed(() => identity.value?.type === 'teamCustomer')
const hasPublicProfile = computed(() => ['teamMember', 'teamVirtual'].includes(identity.value?.type ?? ''))
const draftKey = computed(() => `lostsky:current-entity:profile:${loadedEntityId.value}`)
const markdownDraftKey = computed(() => `account-current-entity-${loadedEntityId.value}`)
const uploadDisabledReason = computed(() => query.data.value?.upload?.enabled
  ? ''
  : query.data.value?.upload?.reason || '当前实体不能上传文件')

const assignees = useQuery({
  queryKey: ['account-current-customer-assignees'],
  queryFn: () => api.get<Assignee[]>('/identity/current/customer-assignees'),
  enabled: isCustomer,
})
const assigneeOptions = computed(() => (assignees.data.value ?? []).map(item => ({
  value: item.entity_id,
  label: `${item.name} · @${item.slug}`,
})))

function hydrate() {
  const data = query.data.value
  if (!data?.identity || !data.profile) return
  const nextId = data.identity.entity_id
  if (loadedEntityId.value && loadedEntityId.value !== nextId && dirty.value) {
    stale.value = true
    return
  }
  if (dirty.value && loadedEntityId.value === nextId) return
  loadedEntityId.value = nextId
  stale.value = false
  Object.assign(form, {
    name: data.profile.name || '',
    avatar: data.profile.avatar || '',
    description: data.profile.description || '',
    intro_image: data.profile.intro_image || '',
    intro_video: data.profile.intro_video || '',
    introduction_markdown: data.profile.introduction_markdown || '',
    assignee_entity_id: data.customer?.assignee_entity_id ?? null,
    slug: data.identity.slug || '',
  })
  const stored = localStorage.getItem(`lostsky:current-entity:profile:${nextId}`)
  if (stored) {
    try { Object.assign(form, JSON.parse(stored) as Partial<FormState>) } catch { localStorage.removeItem(draftKey.value) }
  }
  snapshot.value = JSON.stringify({
    name: data.profile.name || '', avatar: data.profile.avatar || '',
    description: data.profile.description || '', intro_image: data.profile.intro_image || '',
    intro_video: data.profile.intro_video || '', introduction_markdown: data.profile.introduction_markdown || '',
    assignee_entity_id: data.customer?.assignee_entity_id ?? null, slug: data.identity.slug || '',
  })
}

watch(() => query.data.value, hydrate, { immediate: true, deep: true })
watch(serialized, value => {
  if (!loadedEntityId.value || value === snapshot.value) localStorage.removeItem(draftKey.value)
  else localStorage.setItem(draftKey.value, value)
})
useUnsavedGuard(dirty)

const save = useMutation({
  mutationFn: async () => {
    if (stale.value) throw new Error('身份已切换，未保存内容没有提交。请重新加载当前身份。')
    const expected_entity_id = loadedEntityId.value
    if (!form.name.trim()) throw new Error('名称不能为空')
    if (!identity.value?.slug) {
      if (!form.slug.trim()) throw new Error('请先填写实体标识')
      await api.post('/identity/current/slug', { expected_entity_id, slug: form.slug.trim() })
    }
    await api.post('/identity/current/profile', {
      expected_entity_id,
      name: form.name.trim(),
      avatar: form.avatar?.trim() || null,
      description: form.description?.trim() || null,
      ...(isCustomer.value ? { assignee_entity_id: form.assignee_entity_id } : {
        intro_image: form.intro_image?.trim() || null,
        intro_video: form.intro_video?.trim() || null,
        introduction_markdown: form.introduction_markdown || null,
      }),
    })
  },
  onSuccess: async () => {
    snapshot.value = serialized.value
    localStorage.removeItem(draftKey.value)
    localStorage.removeItem(`lostsky:markdown:${markdownDraftKey.value}`)
    await query.refetch()
    feedback.success('当前实体资料已保存')
  },
  onError: error => {
    if (error instanceof ApiError && error.status === 409) stale.value = true
  },
})

async function upload(field: keyof CurrentProfile, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !loadedEntityId.value) return
  uploading.value = field
  try {
    const result = await api.uploadTo<{ url: string }>(file, '/identity/current/upload', {
      expected_entity_id: loadedEntityId.value,
    })
    form[field] = result.url
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) stale.value = true
    feedback.error(friendlyError(error))
  } finally {
    uploading.value = ''
    input.value = ''
  }
}

async function uploadMarkdownImage(file: File) {
  const result = await api.uploadTo<{ url: string }>(file, '/identity/current/upload', {
    expected_entity_id: loadedEntityId.value,
  })
  return result.url
}

function reloadCurrent() {
  localStorage.removeItem(draftKey.value)
  localStorage.removeItem(`lostsky:markdown:${markdownDraftKey.value}`)
  snapshot.value = serialized.value
  stale.value = false
  void query.refetch().then(hydrate)
}
</script>

<template>
  <LsPage width="form" class="profile-page">
    <header class="task-heading">
      <div><p>当前实体</p><h1>资料</h1><span>{{ isCustomer ? '维护当前团队用于服务识别的客户资料。' : '维护当前实体的通用公开资料；展示开关仍由团队管理。' }}</span></div>
    </header>

    <NAlert v-if="stale" type="warning" title="身份已切换，未保存内容没有提交">
      <div class="stale-copy"><span>当前表单已冻结，避免把旧身份的内容写入新身份。</span><LsButton size="sm" variant="secondary" @click="reloadCurrent">重新加载</LsButton></div>
    </NAlert>

    <form @submit.prevent="save.mutate()">
      <LsPanel>
        <template #header><div class="section-heading"><h2>基本资料</h2><p>名称、头像和简介会跟随当前实体。</p></div></template>
        <div class="form-fields">
          <LsField label="名称" for-id="current-name" required>
            <NInput v-model:value="form.name" maxlength="50" :input-props="{ id: 'current-name' }" placeholder="当前实体名称" />
          </LsField>
          <LsField label="头像" for-id="current-avatar">
            <LsUploadField
              v-model="form.avatar"
              :loading="uploading === 'avatar'"
              :disabled="Boolean(uploading) || Boolean(uploadDisabledReason) || stale"
              :disabled-reason="stale ? '身份已切换，请重新加载' : uploadDisabledReason"
              show-reason
              accept="image/*"
              button-label="上传头像"
              @change="upload('avatar', $event)"
            />
          </LsField>
          <LsField label="简介" for-id="current-description">
            <NInput v-model:value="form.description" type="textarea" maxlength="500" show-count :input-props="{ id: 'current-description' }" :autosize="{ minRows: 3, maxRows: 7 }" placeholder="简要介绍当前实体" />
          </LsField>
          <LsField v-if="!identity?.slug && ['teamMember', 'teamCustomer'].includes(identity?.type || '')" label="实体标识" for-id="current-slug" hint="仅用于补全历史缺失标识，确定后不可修改。" required>
            <NInput v-model:value="form.slug" maxlength="50" :input-props="{ id: 'current-slug' }" placeholder="例如 sky-friend" />
          </LsField>
        </div>
      </LsPanel>

      <LsPanel v-if="hasPublicProfile">
        <template #header><div class="section-heading"><h2>介绍媒体</h2><p>成员与虚拟实体可维护相同的公开介绍内容。</p></div></template>
        <div class="form-fields">
          <LsField label="介绍图片" for-id="current-intro-image">
            <LsUploadField v-model="form.intro_image" accept="image/*" button-label="上传图片" :loading="uploading === 'intro_image'" :disabled="Boolean(uploading) || Boolean(uploadDisabledReason) || stale" :disabled-reason="stale ? '身份已切换，请重新加载' : uploadDisabledReason" @change="upload('intro_image', $event)" />
          </LsField>
          <LsField label="介绍视频" for-id="current-intro-video">
            <LsUploadField v-model="form.intro_video" accept="video/*" button-label="上传视频" :loading="uploading === 'intro_video'" :disabled="Boolean(uploading) || Boolean(uploadDisabledReason) || stale" :disabled-reason="stale ? '身份已切换，请重新加载' : uploadDisabledReason" @change="upload('intro_video', $event)" />
          </LsField>
          <LsField label="详细介绍" for-id="current-introduction">
            <LsMarkdownEditor v-model="form.introduction_markdown" :draft-key="markdownDraftKey" :upload-image="uploadMarkdownImage" :upload-disabled-reason="stale ? '身份已切换，请重新加载' : uploadDisabledReason" placeholder="用 Markdown 介绍当前实体…" />
          </LsField>
        </div>
      </LsPanel>

      <LsPanel v-if="isCustomer">
        <template #header><div class="section-heading"><h2>服务归属</h2><p>变更只影响之后的业务，不改写已有订单和流水。</p></div></template>
        <LsField label="当前归属实体" for-id="current-assignee" hint="候选仅包含当前团队可用的 Team、成员和虚拟实体。">
          <NSelect id="current-assignee" v-model:value="form.assignee_entity_id" :options="assigneeOptions" :loading="assignees.isPending.value" filterable clearable placeholder="未归属" />
        </LsField>
        <LsInlineError v-if="assignees.isError.value" :message="friendlyError(assignees.error.value)" />
      </LsPanel>

      <LsInlineError v-if="save.isError.value" :message="save.error.value instanceof Error ? save.error.value.message : friendlyError(save.error.value)" />
      <footer class="save-bar"><span>{{ dirty ? '有未保存的修改' : '所有修改已保存' }}</span><LsButton type="submit" :loading="save.isPending.value" :disabled="!dirty || stale || Boolean(uploading)">保存资料</LsButton></footer>
    </form>
  </LsPage>
</template>

<style scoped>
.profile-page{padding-bottom:5rem}.task-heading p,.task-heading h1,.task-heading span,.section-heading h2,.section-heading p{margin:0}.task-heading p{color:var(--sky-lost-strong);font-size:.72rem;font-weight:750;letter-spacing:.06em}.task-heading h1{margin-top:.2rem;font-size:1.55rem}.task-heading span,.section-heading p{color:var(--muted-ink);font-size:.85rem}.profile-page form,.form-fields{display:grid;gap:1rem}.section-heading h2{font-size:1rem}.section-heading p{margin-top:.25rem}.stale-copy{display:flex;align-items:center;justify-content:space-between;gap:1rem}.save-bar{position:fixed;z-index:var(--z-sticky);right:0;bottom:0;left:0;min-height:68px;display:flex;align-items:center;justify-content:flex-end;gap:1rem;padding:calc(.65rem + env(safe-area-inset-bottom)) max(1rem,calc((100vw - 76rem)/2));background:color-mix(in oklch,white,transparent 4%);border-top:1px solid var(--line)}.save-bar span{color:var(--muted-ink);font-size:.78rem}
@media(max-width:767px){.profile-page{padding-bottom:6rem}.save-bar{justify-content:space-between;padding:.65rem .75rem calc(.65rem + env(safe-area-inset-bottom))}.save-bar :deep(.ls-button){min-width:8rem}}
</style>
