<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NCheckbox, NCheckboxGroup, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { searchEntities, uploadMarkdownImage } from '../lib/markdown'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const editor = ref<InstanceType<typeof LsMarkdownEditor> | null>(null)
const id = computed(() => Number(route.query.id || 0))
const editing = computed(() => id.value > 0)
const uploading = ref('')
const form = reactive({
  user_id: null as number | null,
  nickname: '',
  avatar: '',
  description: '',
  intro_image: '',
  intro_video: '',
  introduction_markdown: '',
})
const postIds = ref<number[]>([])
const identityForm = reactive({ slug: '', search_override: 'inherit' as 'inherit' | '0' | '1' })

const detail = useQuery({
  queryKey: computed(() => ['member', id.value]),
  queryFn: () => api.get<Record<string, unknown>>('/member/get', { member_id: id.value }),
  enabled: editing,
})
const posts = useQuery({ queryKey: ['post-types'], queryFn: () => api.get<Record<string, unknown>[]>('/postType/index') })

watch(() => detail.data.value, (data) => {
  if (!data) return
  form.user_id = Number(data.user_id || 0) || null
  form.nickname = String(data.nickname ?? '')
  form.avatar = String(data.avatar ?? '')
  form.description = String(data.description ?? '')
  form.intro_image = String(data.intro_image ?? '')
  form.intro_video = String(data.intro_video ?? '')
  form.introduction_markdown = String(data.introduction_markdown ?? '')
  postIds.value = Array.isArray(data.posts)
    ? (data.posts as Record<string, unknown>[]).map(item => Number(item.post_type_id ?? item.type_id)).filter(Boolean)
    : []
  identityForm.slug = String(data.slug ?? '')
  identityForm.search_override = data.search_override == null ? 'inherit' : String(Number(data.search_override)) as '0' | '1'
}, { immediate: true })

const save = useMutation({
  mutationFn: () => api.post(editing.value ? '/member/edit' : '/member/add', {
    ...(editing.value ? { member_id: id.value } : { user_id: form.user_id }),
    nickname: form.nickname.trim(),
    avatar: form.avatar || null,
    description: form.description || null,
    intro_image: form.intro_image || null,
    intro_video: form.intro_video || null,
    introduction_markdown: form.introduction_markdown || null,
    post_type_ids: postIds.value,
  }),
  onSuccess: async () => {
    editor.value?.clearDraft()
    await queryClient.invalidateQueries({ queryKey: ['members'] })
    await router.push('/members')
  },
})
const claim = useMutation({
  mutationFn: () => api.post<{ slug: string }>('/member/slug', { member_id: id.value, slug: identityForm.slug.trim() }),
  onSuccess: async () => { await detail.refetch() },
})
const saveSearch = useMutation({
  mutationFn: () => api.post('/member/search', { member_id: id.value, search_override: identityForm.search_override === 'inherit' ? null : Number(identityForm.search_override) }),
  onSuccess: async () => { await detail.refetch() },
})

const postOptions = computed(() => (posts.data.value ?? []).map(item => ({
  label: String(item.name ?? `岗位 #${item.id}`),
  value: Number(item.id),
})))
const searchOptions = [
  { label: '继承团队默认值', value: 'inherit' },
  { label: '禁止被搜索', value: '0' },
  { label: '允许被搜索', value: '1' },
]

async function upload(key: 'avatar' | 'intro_image' | 'intro_video', event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = key
  try {
    const result = await api.upload<Record<string, unknown>>(file)
    form[key] = String(result.url ?? result.path ?? result.id ?? '')
  } finally {
    uploading.value = ''
    ;(event.target as HTMLInputElement).value = ''
  }
}
</script>

<template>
  <div class="member-form-view">
    <AdminPageHeader
      :title="editing ? '编辑成员' : '添加成员'"
      :description="editing ? '维护成员公开资料和岗位；身份认领由管理员入口单独处理。' : '先将已有用户加入当前团队，再维护其公开资料。'"
      back-to="/members"
      back-label="返回成员列表"
    />

    <p v-if="detail.isError.value" class="feedback error" role="alert">{{ friendlyError(detail.error.value) }}</p>
    <form v-else class="member-form" @submit.prevent="save.mutate()">
      <section class="panel">
        <div class="section-heading">
          <div><p>MEMBER PROFILE</p><h2>成员公开资料</h2></div>
          <span v-if="editing">成员 #{{ id }}</span>
        </div>

        <label v-if="!editing" class="field">
          <span>用户 ID <b>*</b></span>
          <NInputNumber v-model:value="form.user_id" :min="1" :precision="0" class="control" placeholder="输入 LostSky 用户 ID" />
        </label>
        <label class="field">
          <span>团队昵称 <b>*</b></span>
          <NInput v-model:value="form.nickname" autocomplete="name" maxlength="80" show-count placeholder="在当前团队中显示的名称" />
        </label>
        <label class="field">
          <span>头像</span>
          <div class="upload-field">
            <NInput v-model:value="form.avatar" placeholder="图片 URL 或上传文件" />
            <label class="upload-action">
              {{ uploading === 'avatar' ? '上传中…' : '上传图片' }}
              <input type="file" accept="image/*" :disabled="Boolean(uploading)" @change="upload('avatar', $event)">
            </label>
          </div>
        </label>
        <label class="field">
          <span>简短介绍</span>
          <NInput v-model:value="form.description" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" maxlength="500" show-count />
        </label>
        <div class="media-row">
          <label class="field">
            <span>介绍图片</span>
            <div class="upload-field">
              <NInput v-model:value="form.intro_image" placeholder="图片 URL" />
              <label class="upload-action">{{ uploading === 'intro_image' ? '上传中…' : '上传' }}<input type="file" accept="image/*" @change="upload('intro_image', $event)"></label>
            </div>
          </label>
          <label class="field">
            <span>介绍视频</span>
            <div class="upload-field">
              <NInput v-model:value="form.intro_video" placeholder="视频 URL" />
              <label class="upload-action">{{ uploading === 'intro_video' ? '上传中…' : '上传' }}<input type="file" accept="video/*" @change="upload('intro_video', $event)"></label>
            </div>
          </label>
        </div>
        <label class="field">
          <span>详细介绍</span>
          <LsMarkdownEditor
            v-if="!editing || detail.isSuccess.value"
            ref="editor"
            v-model="form.introduction_markdown"
            :draft-key="`member-profile:${editing ? id : 'new'}`"
            :search-entities="searchEntities"
            :upload-image="uploadMarkdownImage"
            placeholder="写下成员介绍，输入 @ 可引用团队或其他成员…"
          />
        </label>
      </section>

      <section class="panel">
        <div class="section-heading"><div><p>POST TYPES</p><h2>岗位类型</h2></div></div>
        <p v-if="posts.isPending.value" class="muted">正在读取岗位…</p>
        <NCheckboxGroup v-else v-model:value="postIds" class="post-grid">
          <NCheckbox v-for="option in postOptions" :key="option.value" :value="option.value" :label="option.label" />
        </NCheckboxGroup>
        <p v-if="!posts.isPending.value && !postOptions.length" class="muted">团队尚未创建岗位类型。</p>
      </section>

      <p v-if="save.isError.value" class="feedback error" role="alert">{{ friendlyError(save.error.value) }}</p>
      <div class="actions">
        <LsButton type="button" variant="secondary" @click="router.push('/members')">取消</LsButton>
        <LsButton type="submit" size="lg" :loading="save.isPending.value" :disabled="!form.nickname.trim() || (!editing && !form.user_id) || Boolean(uploading)">保存成员</LsButton>
      </div>
    </form>

    <section v-if="editing && detail.data.value" class="panel identity-admin" aria-labelledby="identity-admin-title">
      <div class="section-heading">
        <div><p>ADMIN ONLY</p><h2 id="identity-admin-title">对象身份设置</h2></div>
        <span>管理员入口</span>
      </div>
      <p class="muted">slug 首次认领后永久不变；搜索设置只影响当前成员，不会更改本人的资料表单。</p>
      <form v-if="!detail.data.value.slug" class="inline-form" @submit.prevent="claim.mutate()">
        <label class="field">
          <span>成员 slug</span>
          <NInput v-model:value="identityForm.slug" placeholder="例如 zhang-san" autocapitalize="none" />
        </label>
        <LsButton type="submit" :loading="claim.isPending.value" :disabled="!identityForm.slug.trim()">确认认领</LsButton>
      </form>
      <div v-else class="claimed"><span>已认领</span><strong>@{{ detail.data.value.slug }}</strong><small>不可修改或释放</small></div>
      <p v-if="claim.isError.value" class="feedback error" role="alert">{{ friendlyError(claim.error.value) }}</p>

      <form class="inline-form search-form" @submit.prevent="saveSearch.mutate()">
        <label class="field">
          <span>成员搜索状态</span>
          <NSelect v-model:value="identityForm.search_override" :options="searchOptions" />
        </label>
        <LsButton type="submit" variant="secondary" :loading="saveSearch.isPending.value" :disabled="!detail.data.value.slug">保存搜索设置</LsButton>
      </form>
      <p v-if="saveSearch.isError.value" class="feedback error" role="alert">{{ friendlyError(saveSearch.error.value) }}</p>
      <p v-if="saveSearch.isSuccess.value" class="feedback success" role="status">成员搜索设置已保存。</p>
    </section>
  </div>
</template>

<style scoped>
.member-form-view, .member-form { display: grid; gap: 22px; }
.member-form { max-width: 800px; }
.panel { display: grid; gap: 18px; padding: 24px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.section-heading p { margin: 0 0 4px; color: var(--primary); font-size: .7rem; font-weight: 800; letter-spacing: .13em; }
.section-heading h2 { margin: 0; font-size: 1.05rem; }
.section-heading > span { color: var(--text-tertiary); font-size: .8rem; }
.field { display: grid; gap: 8px; min-width: 0; }
.field > span { color: var(--text-secondary); font-size: .875rem; font-weight: 650; }
.field b { color: var(--danger); }
.control { width: 100%; }
.media-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.upload-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.upload-action { min-height: 36px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); background: var(--surface-subtle); font-size: .85rem; font-weight: 650; cursor: pointer; }
.upload-action:hover { border-color: var(--primary); color: var(--primary); }
.upload-action input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.post-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.actions { display: flex; justify-content: flex-end; gap: 10px; padding-bottom: 18px; }
.identity-admin { max-width: 800px; border-color: color-mix(in srgb, var(--primary) 24%, var(--border)); }
.inline-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 12px; }
.claimed { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md); background: var(--surface-subtle); }
.claimed span, .claimed small, .muted { color: var(--text-secondary); font-size: .85rem; }
.claimed strong { color: var(--primary); }
.feedback { margin: 0; padding: 11px 13px; border-radius: var(--radius-md); }
.error { color: var(--danger); background: color-mix(in srgb, var(--danger) 9%, transparent); }
.success { color: var(--success); background: color-mix(in srgb, var(--success) 9%, transparent); }
@media (max-width: 680px) {
  .panel { padding: 17px; }
  .media-row, .post-grid, .inline-form, .upload-field { grid-template-columns: 1fr; }
  .actions > * { flex: 1; }
  .claimed { align-items: flex-start; flex-direction: column; }
}
</style>
