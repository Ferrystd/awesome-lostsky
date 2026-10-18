<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityTag from '@lostsky/ui/components/LsEntityTag.vue'
import type { EntityType } from '@lostsky/ui/entity'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDirectoryActions from '@lostsky/ui/components/LsDirectoryActions.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { File, Trash2, Upload, ArrowUpRight } from '@lucide/vue'
import { NPagination, NFlex } from 'naive-ui'
import { computed, ref } from 'vue'

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

function fileActions() {
  return [
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
  if (key === 'delete') removeFile(Number(item.id))
}
</script>

<template>
  <LsObjectDirectory title="文件" :description="usageSummary">
    <template #actions>
      <LsPageLink v-if="canUpgrade" to="/abilities" :icon="ArrowUpRight" label="升级团队能力" />
      <LsUploadField :show-url="false" multiple button-label="上传文件" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @change="upload">
        <template #trigger="{ choose }">
          <LsButton variant="ghost" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @click="choose"><template #icon><Upload :size="18" /></template>上传文件</LsButton>
        </template>
      </LsUploadField>
    </template>
    <template #toolbar>
      <LsInlineError v-if="uploadError" :message="uploadError" />
      <LsListToolbar embedded v-model="keyword" placeholder="按文件名称搜索" aria-label="搜索文件" :count-label="routeAccess.restricted.value ? '0 个文件' : `${total} 个文件`" @update:model-value="page = 1" />
    </template>
    <Transition name="ls-state" mode="out-in">
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" key="error" state="error" title="暂时无法读取文件" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" key="loading" state="loading" :rows="6" />
      <LsEmptyState :source="query.data.value" v-else-if="!files.length" key="empty" :title="routeAccess.restricted.value ? '没有可显示的文件' : '还没有文件'" description="上传团队需要共享的第一份资料。" />
      <LsResourceList v-else key="list" aria-label="文件列表">
        <LsResourceRow v-for="item in files" :key="String(item.id)" :title="String(item.name || item.original_name || '未命名文件')" :description="`${fileSourceLabel(item.source)} · ${item.mime_type || item.ext || '未知格式'} · ${size(item.size)}`" :icon="File">
          <template #metadata>
            <LsEntityTag v-if="item.subject" :type="item.subject.entityable_type || 'unknown'" :name="item.subject.name || '未命名人员'" :slug="item.subject.slug" />
            <span v-else>{{ item.entity_id ? `人员 #${item.entity_id}（资料不可用）` : '来源人员未记录' }}</span>
            <time :title="`上传时间：${uploadTime(item.create_time)}`">{{ uploadTime(item.create_time) }}</time>
          </template>
          <template #actions>
            <NFlex align="center" justify="end" :size="12">
              <LsPageLink v-if="item.url" :href="String(item.url)" target="_blank" rel="noopener noreferrer" :icon="File" label="打开" />
              <LsDirectoryActions :label="`${item.name || item.original_name || '未命名文件'}的操作`" :actions="fileActions()" @select="runFileAction($event, item)" />
            </NFlex>
          </template>
        </LsResourceRow>
      </LsResourceList>
    </Transition>
    <template v-if="pages > 1" #pagination>
      <NPagination v-model:page="page" :page-count="pages" />
    </template>
  </LsObjectDirectory>
</template>
