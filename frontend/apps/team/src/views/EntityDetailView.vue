<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ExternalLink, MessageCircleMore } from '@lucide/vue'
import { NInput, NSwitch } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { permissionReason } from '../lib/teamAccess'

type EntityDetail = {
  id: number
  slug: string
  entityable_type: string
  is_displayed: number
  is_internal_visible: number
  capabilities?: { read_all: boolean; manage_profile: boolean }
  profile?: {
    name?: string
    avatar?: string
    description?: string
    intro_image?: string
    intro_video?: string
    introduction_markdown?: string
  }
}

const route = useRoute()
const client = useQueryClient()
const id = computed(() => Number(route.query.id || 0))
const detail = useQuery({
  queryKey: computed(() => ['entity', id.value]),
  queryFn: () => api.get<EntityDetail>('/entity/get', { entity_id: id.value }),
})
const form = reactive({
  name: '',
  avatar: '',
  description: '',
  intro_image: '',
  intro_video: '',
  introduction_markdown: '',
})
const isDisplayed = ref(false)
const isInternalVisible = ref(true)
const canManage = computed(() => Boolean(detail.data.value?.capabilities?.manage_profile))
const manageReason = permissionReason('team.entity.profile.manage')
const canDisplay = computed(() => (
  ['teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? ''))
))
const canToggleInternal = computed(() =>
  ['teamMember', 'teamVirtual'].includes(String(detail.data.value?.entityable_type ?? ''))
)
const internalFixedMessage = computed(() =>
  detail.data.value?.entityable_type === 'teamCustomer'
    ? 'Customer 属于敏感目录，始终需要 team.entity.read 才能查看。'
    : 'Team 实体始终在团队内部可见。'
)
const displayUrl = computed(() => (
  detail.data.value?.is_displayed && canDisplay.value
    ? `//${window.location.hostname.split('.')[0]}.display.lostsky.work/entity/${detail.data.value.slug}`
    : ''
))
const chatUrl = computed(() => (
  detail.data.value?.slug
    ? chatWorkspaceUrl('/new', { participant: detail.data.value.slug })
    : ''
))

const profileSave = useMutation({
  mutationFn: () => api.post('/entity/profile', { entity_id: id.value, ...form }),
  onSuccess: () => {
    feedback.success('实体资料已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: error => feedback.error(friendlyError(error)),
})
const displaySave = useMutation({
  mutationFn: () => api.post('/entity/display', {
    entity_id: id.value,
    is_displayed: isDisplayed.value ? 1 : 0,
  }),
  onSuccess: () => {
    feedback.success('公开展示设置已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: error => feedback.error(friendlyError(error)),
})
const visibilitySave = useMutation({
  mutationFn: () => api.post('/entity/visibility', {
    entity_id: id.value,
    is_internal_visible: isInternalVisible.value ? 1 : 0,
  }),
  onSuccess: () => {
    feedback.success('团队内可见设置已保存')
    return client.invalidateQueries({ queryKey: ['entity', id.value] })
  },
  onError: error => feedback.error(friendlyError(error)),
})

watch(() => detail.data.value, (data) => {
  if (!data) return
  isDisplayed.value = Number(data.is_displayed) === 1
  isInternalVisible.value = data.entityable_type === 'team' || Number(data.is_internal_visible) === 1
  const profile = data.profile
  if (profile) {
    Object.assign(form, {
      name: profile.name || '',
      avatar: profile.avatar || '',
      description: profile.description || '',
      intro_image: profile.intro_image || '',
      intro_video: profile.intro_video || '',
      introduction_markdown: profile.introduction_markdown || '',
    })
  }
}, { immediate: true })
</script>

<template>
  <div class="entity-detail">
    <AdminPageHeader
      :title="canManage ? '管理实体资料' : '查看实体资料'"
      description="团队内可见、全局搜索和公开主页是三套互相独立的展示范围。"
      back-to="/entities"
      back-label="返回实体"
    >
      <template #actions>
        <a v-if="chatUrl" class="chat-action" :href="chatUrl"><MessageCircleMore :size="17" />发起对话</a>
      </template>
    </AdminPageHeader>
    <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
    <template v-else-if="detail.data.value">
      <p v-if="!canManage" id="entity-manage-reason" class="permission-note" role="note">
        当前为只读模式。{{ manageReason }}
      </p>

      <form @submit.prevent="canManage && profileSave.mutate()"><LsPanel><div class="profile-panel">
        <div class="panel-heading">
          <div>
            <h2>{{ detail.data.value.entityable_type }} · @{{ detail.data.value.slug }}</h2>
            <p>这些资料用于实体详情；公开页面仍受“公开主页展示”控制。</p>
          </div>
          <a v-if="displayUrl" :href="displayUrl" target="_blank" rel="noopener noreferrer">
            查看公开主页<ExternalLink :size="16" />
          </a>
        </div>
        <label>名称<NInput v-model:value="form.name" :disabled="!canManage" /></label>
        <label>头像 URL<NInput v-model:value="form.avatar" :disabled="!canManage" /></label>
        <label>展示图片（人物图）URL
          <NInput v-model:value="form.intro_image" :disabled="!canManage" placeholder="用于公开主页 Hero 的人物图" />
        </label>
        <p class="field-help">建议使用透明背景或竖版人物图；未设置时使用名称占位。</p>
        <label>简介<NInput v-model:value="form.description" type="textarea" :disabled="!canManage" /></label>
        <span :tabindex="canManage ? -1 : 0" :aria-describedby="canManage ? undefined : 'entity-manage-reason'">
          <LsButton type="submit" :disabled="!canManage" :loading="profileSave.isPending.value">保存资料</LsButton>
        </span>
      </div></LsPanel></form>

      <LsPanel><section class="setting">
        <div>
          <h2>团队内可见</h2>
          <p>控制普通成员是否能在当前团队工作空间发现该实体；具有 <code>team.entity.read</code> 的角色仍可查看。它不影响全局搜索或公开主页。</p>
        </div>
        <NSwitch
          v-if="canToggleInternal"
          v-model:value="isInternalVisible"
          :disabled="!canManage"
          aria-label="在团队工作空间内可见"
        >
          <template #checked>可见</template><template #unchecked>隐藏</template>
        </NSwitch>
        <p v-else class="fixed-state">{{ internalFixedMessage }}</p>
        <span v-if="canToggleInternal" :tabindex="canManage ? -1 : 0" :aria-describedby="canManage ? undefined : 'entity-manage-reason'">
          <LsButton variant="secondary" :disabled="!canManage" :loading="visibilitySave.isPending.value" @click="visibilitySave.mutate()">保存团队内可见设置</LsButton>
        </span>
      </section></LsPanel>

      <LsPanel><section class="setting">
        <div>
          <h2>公开主页展示</h2>
          <p v-if="canDisplay">控制互联网访客能否在 Display 公开主页浏览该实体。它不影响团队内目录或全局搜索。</p>
          <p v-else>Team 主页始终公开；客户实体为保护隐私不支持公开展示。</p>
        </div>
        <NSwitch v-if="canDisplay" v-model:value="isDisplayed" :disabled="!canManage" aria-label="在公开主页展示">
          <template #checked>公开</template><template #unchecked>隐藏</template>
        </NSwitch>
        <span v-if="canDisplay" :tabindex="canManage ? -1 : 0" :aria-describedby="canManage ? undefined : 'entity-manage-reason'">
          <LsButton variant="secondary" :disabled="!canManage" :loading="displaySave.isPending.value" @click="displaySave.mutate()">保存公开设置</LsButton>
        </span>
      </section></LsPanel>
    </template>
  </div>
</template>

<style scoped>
.entity-detail{display:grid;gap:22px}.chat-action{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .875rem;color:white;background:var(--sky-lost-strong);border-radius:8px;font-size:.875rem;font-weight:650}.profile-panel,.setting{display:grid;gap:16px}.profile-panel h2,.profile-panel p,.setting h2,.setting p{margin:0}.profile-panel h2,.setting h2{font-size:1.05rem}.profile-panel label{display:grid;gap:7px;color:var(--text-secondary);font-weight:650}.panel-heading{display:flex;align-items:start;justify-content:space-between;gap:1rem}.panel-heading p,.setting>div p{max-width:68ch;margin-top:.4rem;color:var(--text-secondary);font-size:.84rem;line-height:1.6}.panel-heading a{min-height:44px;display:inline-flex;align-items:center;gap:.4rem;color:var(--primary);font-size:.82rem;font-weight:650;white-space:nowrap}.field-help{margin-top:-10px!important;color:var(--text-secondary);font-size:.8rem;line-height:1.55}.setting :deep(.n-switch){min-height:44px;justify-self:start}.profile-panel>span{justify-self:start}.profile-panel>span:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 65%);outline-offset:3px;border-radius:8px}.permission-note{margin:0;padding:.8rem 1rem;color:var(--muted-ink);background:color-mix(in oklch,var(--sky-lost),white 92%);border:1px solid color-mix(in oklch,var(--sky-lost),white 65%);border-radius:8px;font-size:.84rem}.fixed-state{color:var(--muted-ink);font-size:.84rem}.feedback{padding:.75rem;border-radius:8px}.error{color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%)}code{font-size:.8em}
@media(max-width:639px){.panel-heading{display:grid}.profile-panel>span,.profile-panel :deep(.ls-button){width:100%}}
</style>
