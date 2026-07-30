<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { File, Trash2, Upload } from '@lucide/vue'
import { computed, ref } from 'vue'
import { abilityReason, hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'

const client = useQueryClient()
const access = useTeamAccess()
const page = ref(1)
const keyword = ref('')
const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const usage = useQuery({
  queryKey: ['file-usage'],
  queryFn: () => api.get<Record<string, unknown>>('/file/usage'),
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
const fileAbility = computed(() => access.data.value?.abilities.file)
const uploadReason = computed(() => {
  if (access.isPending.value || access.isError.value) return ''
  if (!fileAbility.value?.enabled) return abilityReason('file', fileAbility.value?.label ?? '文件上传')
  if (!hasPermission(access.data.value, 'file.upload')) return permissionReason('file.upload')
  return ''
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
    for (const file of list) await api.upload(file)
    await Promise.all([
      client.invalidateQueries({ queryKey: ['files'] }),
      client.invalidateQueries({ queryKey: ['file-usage'] }),
    ])
    feedback.success(list.length > 1 ? `${list.length} 个文件已上传` : '文件已上传')
  } catch (error) {
    uploadError.value = friendlyError(error)
    feedback.error(uploadError.value)
  } finally {
    uploading.value = false
    if (input.value) input.value.value = ''
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
function explain(reason: string) {
  if (reason) feedback.info(reason)
}
</script>

<template>
  <div class="files">
    <header>
      <div>
        <p>已使用 {{ size(usage.data.value?.total_size ?? usage.data.value?.totalSize) }} · {{ usage.data.value?.count ?? total }} 个文件</p>
        <h2>团队文件</h2>
      </div>
      <span
        :tabindex="uploadReason ? 0 : -1"
        :title="uploadReason || undefined"
        @click="explain(uploadReason)"
        @keydown.enter.prevent="explain(uploadReason)"
      >
        <LsButton :disabled="Boolean(uploadReason)" :loading="uploading" @click="input?.click()">
          <Upload :size="17" />上传文件
        </LsButton>
      </span>
      <input ref="input" class="hidden" type="file" multiple :disabled="Boolean(uploadReason)" @change="upload">
    </header>
    <p v-if="uploadError" class="error" role="alert">{{ uploadError }}</p>

    <LsListToolbar
      v-model="keyword"
      placeholder="按文件名称搜索"
      aria-label="搜索文件"
      :count-label="`${total} 个文件`"
      @update:model-value="page = 1"
    />
    <Transition name="ls-state" mode="out-in">
      <p v-if="query.isError.value" key="error" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <div v-else-if="query.isPending.value" key="loading" class="loading"><span v-for="i in 6" :key="i" class="ls-skeleton" /></div>
      <div v-else-if="!files.length" key="empty" class="empty">
        <File :size="32" /><h3>还没有文件</h3>
        <p>{{ uploadReason ? '当前可查看团队文件，但不能上传本地文件。' : '上传团队需要共享的第一份资料。' }}</p>
      </div>
      <TransitionGroup v-else key="list" name="ls-list" tag="div" class="file-list">
        <article v-for="item in files" :key="String(item.id)">
          <div class="file-icon"><File /></div>
          <div>
            <strong>{{ item.name || item.original_name || '未命名文件' }}</strong>
            <small>{{ item.mime_type || item.ext || '未知格式' }} · {{ size(item.size) }}</small>
          </div>
          <a v-if="item.url" :href="String(item.url)" target="_blank" rel="noopener noreferrer">打开</a>
          <span
            :tabindex="deleteReason ? 0 : -1"
            :title="deleteReason || undefined"
            @click="explain(deleteReason)"
            @keydown.enter.prevent="explain(deleteReason)"
          >
            <button type="button" aria-label="删除文件" :disabled="Boolean(deleteReason)" @click="removeFile(Number(item.id))">
              <Trash2 :size="17" />
            </button>
          </span>
        </article>
      </TransitionGroup>
    </Transition>
    <footer v-if="pages > 1">
      <LsButton variant="secondary" size="sm" :disabled="page <= 1" @click="page--">上一页</LsButton>
      <span>第 {{ page }} / {{ pages }} 页</span>
      <LsButton variant="secondary" size="sm" :disabled="page >= pages" @click="page++">下一页</LsButton>
    </footer>
  </div>
</template>

<style scoped>
.files{display:grid;gap:1rem}header{display:flex;align-items:end;justify-content:space-between;gap:1rem;flex-wrap:wrap}header p,header h2{margin:0}header p{color:var(--muted-ink);font-size:.82rem}header h2{margin-top:.2rem}.hidden{display:none}header>span:focus-visible,.file-list article>span:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 65%);outline-offset:2px;border-radius:8px}.file-list{display:grid;gap:0;overflow:hidden;background:white;border:1px solid var(--line);border-radius:10px}.file-list article{display:grid;grid-template-columns:44px minmax(0,1fr) auto auto;align-items:center;gap:.75rem;padding:.85rem;border-bottom:1px solid var(--line);background:white;transition:background-color var(--motion-fast) var(--ease-standard),opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}.file-list article:last-child{border-bottom:0}.file-list article:hover{background:var(--cloud)}.file-icon{width:44px;height:44px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border-radius:8px}.file-list strong,.file-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-list small{margin-top:.2rem;color:var(--muted-ink);font-size:.75rem}.file-list a,.file-list button{min-width:44px;min-height:44px;display:grid;place-items:center;color:var(--sky-lost-strong);background:transparent;border:0;transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}.file-list button{color:var(--danger)}.file-list button:disabled{color:var(--muted-ink);opacity:.45;cursor:not-allowed}footer{display:flex;align-items:center;justify-content:center;gap:1rem;color:var(--muted-ink);font-size:.8rem}.empty,.error{display:grid;justify-items:center;gap:.35rem;padding:3rem 1rem;text-align:center;background:white;border:1px solid var(--line);border-radius:10px}.empty h3,.empty p{margin:0}.empty svg{color:var(--sky-lost-strong)}.error{display:block;padding:1rem;color:var(--danger);text-align:left}.loading{display:grid;gap:.6rem}.loading span{height:72px;background:var(--line);border-radius:10px}
@media(max-width:639px){.file-list article{grid-template-columns:44px minmax(0,1fr) auto}.file-list article>a{grid-column:2}.file-list article>span{grid-column:3;grid-row:1/3}}
</style>
