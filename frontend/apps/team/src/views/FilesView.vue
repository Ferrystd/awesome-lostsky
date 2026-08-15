<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { File, Trash2, Upload } from '@lucide/vue'
import { NPagination } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fileUploadReason, hasPermission, permissionReason, useTeamAccess, type FileUploadAvailability } from '../lib/teamAccess'

const client = useQueryClient()
const access = useTeamAccess()
const page = ref(1)
const keyword = ref('')
const uploading = ref(false)
const uploadError = ref('')
const usage = useQuery({
  queryKey: ['file-usage'],
  queryFn: () => api.get<FileUploadAvailability>('/file/usage'),
})
const query = useQuery({
  queryKey: computed(() => ['files', page.value, keyword.value]),
  queryFn: () => api.get<Record<string, unknown>>('/file/index', {
    page: page.value,
    limit: 18,
    keyword: keyword.value,
  }),
})
const files = computed<Record<string, unknown>[]>(() => (
  Array.isArray(query.data.value?.list) ? query.data.value.list as Record<string, unknown>[] : []
))
const total = computed(() => Number(query.data.value?.total ?? files.value.length))
const pages = computed(() => Math.max(1, Math.ceil(total.value / 18)))
const uploadReason = computed(() => {
  if (access.isPending.value || access.isError.value) return ''
  return fileUploadReason({
    ...access.data.value,
    file_upload: usage.data.value ?? access.data.value?.file_upload,
  })
})
const canUpgrade = computed(() => (
  (usage.data.value ?? access.data.value?.file_upload)?.reason === 'quota'
  && hasPermission(access.data.value, 'team.ability.redeem')
))
const usageSummary = computed(() => {
  const state = usage.data.value
  if (!state) return `正在读取容量 · ${total.value} 个文件`
  const used = size(state?.total_size ?? 0)
  const capacity = state?.size_limit == null ? '不限容量' : `容量 ${size(state.size_limit)}`
  return `已使用 ${used} / ${capacity} · ${state?.count ?? total.value} 个文件`
})
const deleteReason = computed(() => (
  access.isPending.value || access.isError.value || hasPermission(access.data.value, 'file.delete')
    ? ''
    : permissionReason('file.delete')
))

const remove = useMutation({
  mutationFn: (id: number) => api.post('/file/delete', { id }),
  onSuccess: async () => {
    feedback.success('文件已删除')
    await Promise.all([
      client.invalidateQueries({ queryKey: ['files'] }),
      client.invalidateQueries({ queryKey: ['file-usage'] }),
      client.invalidateQueries({ queryKey: ['team-access'] }),
    ])
  },
  onError: error => feedback.error(friendlyError(error)),
})

async function upload(event: Event) {
  const list = Array.from((event.target as HTMLInputElement).files ?? [])
  if (!list.length || uploadReason.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    for (const file of list) await api.uploadTo(file, '/file/upload')
    await Promise.all([
      client.invalidateQueries({ queryKey: ['files'] }),
      client.invalidateQueries({ queryKey: ['file-usage'] }),
      client.invalidateQueries({ queryKey: ['team-access'] }),
    ])
    feedback.success(list.length > 1 ? `${list.length} 个文件已上传` : '文件已上传')
  } catch (error) {
    uploadError.value = friendlyError(error)
    feedback.error(uploadError.value)
  } finally {
    uploading.value = false
  }
}

function size(value: unknown) {
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function removeFile(id: number) {
  if (!deleteReason.value && window.confirm('确认删除此文件？')) remove.mutate(id)
}

function fileActions(item: Record<string, unknown>) {
  return [
    ...(item.url ? [{ key: 'open', label: '打开', icon: File }] : []),
    { key: 'delete', label: '删除', icon: Trash2, danger: true, disabled: Boolean(deleteReason.value), reason: deleteReason.value },
  ]
}
function runFileAction(key: string, item: Record<string, unknown>) {
  if (key === 'open' && item.url) window.open(String(item.url), '_blank', 'noopener,noreferrer')
  if (key === 'delete') removeFile(Number(item.id))
}
</script>

<template>
  <div class="files">
    <header>
      <div>
        <p>{{ usageSummary }}</p>
        <h2>团队文件</h2>
      </div>
      <div class="header-actions">
        <RouterLink v-if="canUpgrade" class="secondary-link" to="/abilities">升级团队能力（Ability）</RouterLink>
        <LsUploadField :show-url="false" multiple button-label="上传文件" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @change="upload">
          <template #trigger="{ choose }"><LsPagePrimaryAction :icon="Upload" label="上传文件" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @click="choose" /></template>
        </LsUploadField>
      </div>
    </header>
    <LsInlineError v-if="uploadError" :message="uploadError" />

    <LsListToolbar
      v-model="keyword"
      placeholder="按文件名称搜索"
      aria-label="搜索文件"
      :count-label="`${total} 个文件`"
      @update:model-value="page = 1"
    />
    <Transition name="ls-state" mode="out-in">
      <LsAsyncState v-if="query.isError.value" key="error" state="error" title="暂时无法读取文件" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="query.isPending.value" key="loading" state="loading" :rows="6" />
      <LsEmptyState
        v-else-if="!files.length"
        key="empty"
        title="还没有文件"
        :description="uploadReason ? '当前可查看团队文件，但不能上传本地文件。' : '上传团队需要共享的第一份资料。'"
      />
      <TransitionGroup v-else key="list" name="ls-list" tag="div" class="file-list">
        <article v-for="item in files" :key="String(item.id)">
          <div class="file-icon"><File /></div>
          <div>
            <strong>{{ item.name || item.original_name || '未命名文件' }}</strong>
            <small>{{ item.mime_type || item.ext || '未知格式' }} · {{ size(item.size) }}</small>
          </div>
          <LsResponsiveActions :actions="fileActions(item)" :primary-key="item.url ? 'open' : ''" @select="runFileAction($event, item)" />
        </article>
      </TransitionGroup>
    </Transition>
    <footer v-if="pages > 1"><NPagination v-model:page="page" :page-count="pages" /></footer>
  </div>
</template>

<style scoped>
.files{display:grid;gap:1rem}header{display:flex;align-items:end;justify-content:space-between;gap:1rem;flex-wrap:wrap}header p,header h2{margin:0}header p{color:var(--muted-ink);font-size:.82rem}header h2{margin-top:.2rem}.header-actions{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}.secondary-link{min-height:40px;display:inline-flex;align-items:center;color:var(--sky-lost-strong);font-weight:650}.file-list{display:grid;gap:0;overflow:hidden;background:white;border:1px solid var(--line);border-radius:10px}.file-list article{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:.75rem;padding:.85rem;border-bottom:1px solid var(--line);background:white;transition:background-color var(--motion-fast) var(--ease-standard),opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}.file-list article:last-child{border-bottom:0}.file-list article:hover{background:var(--cloud)}.file-icon{width:44px;height:44px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border-radius:8px}.file-list strong,.file-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-list small{margin-top:.2rem;color:var(--muted-ink);font-size:.75rem}footer{display:flex;align-items:center;justify-content:center;gap:1rem;color:var(--muted-ink);font-size:.8rem}
</style>
