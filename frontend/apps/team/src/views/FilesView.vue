<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import TeamResourceWorkspace from '../components/TeamResourceWorkspace.vue'
import TeamResourceEntry from '../components/TeamResourceEntry.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'

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
import { NPagination, NProgress } from 'naive-ui'
import { computed, ref, watch } from 'vue'

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
const selectedId = ref<string | null>(null)
const selectedFile = computed(() => files.value.find(item => String(item.id) === selectedId.value) ?? null)
watch(files, items => {
  if (!items.some(item => String(item.id) === selectedId.value)) selectedId.value = items.length ? String(items[0].id) : null
}, { immediate: true })
const usagePercent = computed(() => {
  const state = usage.data.value
  return state?.size_limit ? Math.min(100, Math.max(0, state.total_size / state.size_limit * 100)) : null
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
  <TeamResourceWorkspace title="文件" description="查找团队文件，查看来源并管理存储空间。" context-label="文件资料与容量">
    <template #actions>
      <LsUploadField :show-url="false" multiple button-label="上传文件" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @change="upload">
        <template #trigger="{ choose }">
          <LsButton variant="ghost" :disabled="Boolean(uploadReason)" :disabled-reason="uploadReason" :loading="uploading" @click="choose"><template #icon><Upload :size="18" /></template>上传文件</LsButton>
        </template>
      </LsUploadField>
    </template>
    <template #toolbar>
      <LsInlineError v-if="uploadError" :message="uploadError" />
      <LsListToolbar v-model="keyword" placeholder="按文件名称搜索" aria-label="搜索文件" :count-label="routeAccess.restricted.value ? '0 个文件' : `${total} 个文件`" @update:model-value="page = 1" />
    </template>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取文件" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="3" />
    <LsEmptyState v-else-if="!files.length" :source="query.data.value" :title="keyword ? '没有匹配的文件' : '还没有文件'" :description="keyword ? '换一个文件名称试试。' : '上传团队需要共享的第一份资料。'" />
    <ul v-else class="file-directory" aria-label="文件列表">
      <TeamResourceEntry v-for="item in files" :key="String(item.id)" :title="String(item.name || item.original_name || '未命名文件')" :icon="File" href="#file-details" :selected="selectedId === String(item.id)" @select="selectedId = String(item.id)">
        <span>{{ item.mime_type || item.ext || '未知格式' }}</span><span>{{ size(item.size) }}</span>
        <template #actions>
          <LsPageLink v-if="item.url" :href="String(item.url)" target="_blank" rel="noopener noreferrer" :icon="ArrowUpRight" label="打开" />
          <LsDirectoryActions :label="`${item.name || item.original_name || '未命名文件'}的操作`" :actions="fileActions()" @select="runFileAction($event, item)" />
        </template>
      </TeamResourceEntry>
    </ul>
    <template v-if="pages > 1" #pagination><NPagination v-model:page="page" :page-count="pages" /></template>
    <template #context>
      <LsPanel>
        <section id="file-details" class="file-context" tabindex="-1" aria-label="所选文件资料">
          <LsSectionHeader title="文件资料" />
          <template v-if="selectedFile">
            <h3 class="file-context__name">{{ selectedFile.name || selectedFile.original_name || '未命名文件' }}</h3>
            <dl class="file-context__facts">
              <dt>来源</dt><dd>{{ fileSourceLabel(selectedFile.source) }}</dd>
              <dt>来源人员</dt><dd><LsEntityTag v-if="selectedFile.subject" :type="selectedFile.subject.entityable_type || 'unknown'" :name="selectedFile.subject.name || '未命名人员'" :slug="selectedFile.subject.slug" /><span v-else>{{ selectedFile.entity_id ? `人员 #${selectedFile.entity_id}（资料不可用）` : '未记录' }}</span></dd>
              <dt>上传时间</dt><dd><time>{{ uploadTime(selectedFile.create_time) }}</time></dd>
            </dl>
          </template>
          <p v-else class="file-context__hint">{{ files.length ? '选择文件名称，查看来源资料。' : '文件的来源人员和上传时间会显示在这里。' }}</p>
        </section>
      </LsPanel>
      <LsPanel>
        <section class="file-context" aria-label="存储空间">
          <LsSectionHeader title="存储空间" />
          <LsAsyncState v-if="usage.isPending.value && !routeAccess.restricted.value" state="loading" :rows="1" />
          <LsInlineError v-else-if="usage.isError.value" :message="friendlyError(usage.error.value)" />
          <template v-else-if="usage.data.value && !routeAccess.restricted.value">
            <p class="file-context__usage"><strong>{{ size(usage.data.value.total_size) }}</strong><span> / {{ usage.data.value.size_limit == null ? '不限容量' : size(usage.data.value.size_limit) }}</span></p>
            <NProgress v-if="usagePercent !== null" type="line" :percentage="usagePercent" :show-indicator="false" :height="4" aria-label="存储使用比例" />
            <p class="file-context__hint">{{ usage.data.value.count }} 个文件<span v-if="usage.data.value.remaining_size != null"> · 剩余 {{ size(usage.data.value.remaining_size) }}</span></p>
          </template>
          <p v-else class="file-context__hint">容量信息不可用</p>
          <LsPageLink v-if="canUpgrade" to="/abilities" :icon="ArrowUpRight" label="升级团队能力" />
        </section>
      </LsPanel>
    </template>
  </TeamResourceWorkspace>
</template>

<style scoped>
.file-directory { padding: 0; margin: 0; }
.file-context { min-width: 0; display: grid; gap: 1rem; scroll-margin-top: 1.5rem; }
.file-context__name { font-size: 1rem; line-height: 1.5; font-weight: 600; overflow-wrap: anywhere; margin: 0; }
.file-context__facts { display: grid; gap: .25rem; margin: 0; font-size: .875rem; }
.file-context__facts dt { color: var(--text-secondary); font-size: .8125rem; }
.file-context__facts dt:not(:first-child) { margin-top: .75rem; }
.file-context__facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.file-context__hint { margin: 0; color: var(--text-secondary); font-size: .8125rem; line-height: 1.65; }
.file-context__usage { margin: 0; font-size: .8125rem; color: var(--text-secondary); }
.file-context__usage strong { color: var(--text); font-size: 1.125rem; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
