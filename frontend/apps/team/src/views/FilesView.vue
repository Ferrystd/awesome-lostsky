<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityTag from '@lostsky/ui/components/LsEntityTag.vue'
import type { EntityType } from '@lostsky/ui/entity'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { File, Trash2, Upload } from '@lucide/vue'
import { NPagination } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fileSourceLabel } from '../lib/fileSource'
import { fileUploadReason, hasPermission, permissionReason, useTeamAccess, type FileUploadAvailability } from '../lib/teamAccess'

const client = useQueryClient()
const access = useTeamAccess()
const routeAccess = useRouteAccess()
const page = ref(1)
const keyword = ref('')
const uploading = ref(false)
type FileRecord = Record<string, unknown> & {
  subject?: { name?: string; slug?: string; avatar?: string; entityable_type: EntityType } | null
}
const uploadError = ref('')
const usage = useQuery({
  queryKey: ['file-usage'],
  queryFn: () => api.get<FileUploadAvailability>('/file/usage'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const query = useQuery({
  queryKey: computed(() => ['files', page.value, keyword.value]),
  queryFn: () =>
    api.get<Record<string, unknown>>('/file/index', {
      page: page.value,
      limit: 18,
      keyword: keyword.value,
    }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const files = computed<FileRecord[]>(() => (Array.isArray(query.data.value?.list) ? (query.data.value.list as FileRecord[]) : []))
const total = computed(() => Number(query.data.value?.total ?? files.value.length))
const pages = computed(() => Math.max(1, Math.ceil(total.value / 18)))
const uploadReason = computed(() => {
  if (routeAccess.reason.value) return routeAccess.reason.value
  if (access.isPending.value || access.isError.value) return ''
  return fileUploadReason({
    ...access.data.value,
    file_upload: usage.data.value ?? access.data.value?.file_upload,
  })
})
const canUpgrade = computed(() => (usage.data.value ?? access.data.value?.file_upload)?.reason === 'quota' && hasPermission(access.data.value, 'team.ability.redeem'))
const usageSummary = computed(() => {
  const state = usage.data.value
  if (routeAccess.restricted.value) return '已使用 - / 容量 - · 0 个文件'
  if (!state) return `正在读取容量 · ${total.value} 个文件`
  const used = size(state?.total_size ?? 0)
  const capacity = state?.size_limit == null ? '不限容量' : `容量 ${size(state.size_limit)}`
  return `已使用 ${used} / ${capacity} · ${state?.count ?? total.value} 个文件`
})
const deleteReason = computed(() => routeAccess.reason.value || (access.isPending.value || access.isError.value || hasPermission(access.data.value, 'file.delete') ? '' : permissionReason('file.delete')))

const remove = useMutation({
  mutationFn: (id: number) => api.post('/file/delete', { id }),
  onSuccess: async () => {
    feedback.success('文件已删除')
    await Promise.all([client.invalidateQueries({ queryKey: ['files'] }), client.invalidateQueries({ queryKey: ['file-usage'] }), client.invalidateQueries({ queryKey: ['team-access'] })])
  },
  onError: (error) => feedback.error(friendlyError(error)),
})

async function upload(event: Event) {
  const list = Array.from((event.target as HTMLInputElement).files ?? [])
  if (!list.length || uploadReason.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    for (const file of list) await api.uploadTo(file, '/file/upload')
    await Promise.all([client.invalidateQueries({ queryKey: ['files'] }), client.invalidateQueries({ queryKey: ['file-usage'] }), client.invalidateQueries({ queryKey: ['team-access'] })])
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

function uploadTime(value: unknown) {
  const seconds = Number(value)
  const date = new Date(seconds * 1000)
  if (!Number.isFinite(seconds) || seconds <= 0 || Number.isNaN(date.getTime())) return '未记录'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function removeFile(id: number) {
  if (!deleteReason.value && window.confirm('确认删除此文件？')) remove.mutate(id)
}

function fileActions(item: Record<string, unknown>) {
  return [
    ...(item.url ? [{ key: 'open', label: '打开', icon: File }] : []),
    {
      key: 'delete',
      label: '删除',
      icon: Trash2,
      danger: true,
      disabled: Boolean(deleteReason.value),
      reason: deleteReason.value,
    },
  ]
}
function runFileAction(key: string, item: Record<string, unknown>) {
  if (key === 'open' && item.url) window.open(String(item.url), '_blank', 'noopener,noreferrer')
  if (key === 'delete') removeFile(Number(item.id))
}
</script>

<template>
    <LsPageHeader title="文件" :description="usageSummary">
      <template #actions>
        <RouterLink v-if="canUpgrade" class="secondary-link" to="/abilities">升级团队能力</RouterLink>
        <LsUploadField :show-url="false" multiple button-label="上传文件" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @change="upload">
          <template #trigger="{ choose }"><LsPagePrimaryAction :icon="Upload" label="上传文件" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @click="choose" /></template>
        </LsUploadField>
      </template>
    </LsPageHeader>
    <LsInlineError v-if="uploadError" :message="uploadError" />

    <LsListToolbar v-model="keyword" placeholder="按文件名称搜索" aria-label="搜索文件" :count-label="routeAccess.restricted.value ? '0 个文件' : `${total} 个文件`" @update:model-value="page = 1" />
    <Transition name="ls-state" mode="out-in">
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" key="error" state="error" title="暂时无法读取文件" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" key="loading" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value" v-else-if="!files.length" key="empty" :title="routeAccess.restricted.value ? '没有可显示的文件' : '还没有文件'" description="上传团队需要共享的第一份资料。" />
      <LsResourceList v-else key="list" aria-label="文件列表">
        <LsResourceRow v-for="item in files" :key="String(item.id)" :title="String(item.name || item.original_name || '未命名文件')" :description="`${fileSourceLabel(item.source)} · ${item.mime_type || item.ext || '未知格式'} · ${size(item.size)}`" :icon="File">
          <template #metadata>
            <dl class="file-metadata">
              <div><dt>来源人员</dt><dd><LsEntityTag v-if="item.subject" :type="item.subject.entityable_type || 'unknown'" :name="item.subject.name || '未命名人员'" :slug="item.subject.slug" /><span v-else>{{ item.entity_id ? `人员 #${item.entity_id}（资料不可用）` : '未记录' }}</span></dd></div>
              <div><dt>上传时间</dt><dd><time>{{ uploadTime(item.create_time) }}</time></dd></div>
            </dl>
          </template>
          <template #actions><LsResponsiveActions :actions="fileActions(item)" :primary-key="item.url ? 'open' : ''" @select="runFileAction($event, item)" /></template>
        </LsResourceRow>
      </LsResourceList>
    </Transition>
    <footer v-if="pages > 1" class="pager">
      <NPagination v-model:page="page" :page-count="pages" />
    </footer>
</template>

<style scoped>
.secondary-link { min-height: 44px; display: inline-flex; align-items: center; color: var(--primary); font-weight: 600; }
.file-metadata { min-width: 0; display: flex; flex-wrap: wrap; gap: .5rem 1rem; margin: 0; }
.file-metadata > div { min-width: 0; max-width: 100%; display: flex; align-items: center; gap: .5rem; }
.file-metadata > div:first-child { max-width: min(15rem, 100%); }
.file-metadata dt { flex-shrink: 0; }
.file-metadata dd { min-width: 0; margin: 0; }
.pager { display: flex; justify-content: center; }
</style>
