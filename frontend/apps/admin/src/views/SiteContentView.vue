<script setup lang="ts">
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'

import { api, auth, friendlyError } from '@lostsky/api/client'
import { type SiteContent } from '@lostsky/shared/siteContent'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInput } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import SiteMemberFields from '../components/SiteMemberFields.vue'
import { can, permissionReason } from '../session'

const access = useRouteAccess()
const empty = (): SiteContent => ({ icp: '', members: [], stats: [] })
const content = ref<SiteContent>(empty())
const draft = useQueryDraft({ key: () => `${location.host}:${JSON.stringify(auth.entity())}:site-content`, read: () => content.value, apply: value => { content.value = value }, initial: empty })
useUnsavedChangesGuard(draft.dirty)
const query = useQuery({ queryKey: ['admin-site-content'], queryFn: () => access.read(() => api.get<SiteContent>('/site-content')), enabled: computed(() => !access.restricted.value) })
watch(query.data, value => { if (value) draft.hydrate(value) }, { immediate: true })
watch(access.restricted, restricted => { if (restricted) draft.reset(empty()) })
const writable = computed(() => !access.restricted.value && can('admin.site.write'))
const reason = computed(() => access.reason.value || (!writable.value ? permissionReason('admin.site.write') : ''))
const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const saved = await api.put<SiteContent>('/site-content', submitted.value)
    return { submitted, saved }
  },
  onSuccess: ({ submitted, saved }) => { if (draft.accept(submitted, saved)) feedback.success('官网内容已保存，刷新官网即可查看') },
  onError: error => feedback.error(friendlyError(error)),
})
const saveReason = computed(() => reason.value || (save.isPending.value ? '正在保存，请稍候' : !query.data.value || query.isError.value ? '请等待官网内容加载成功' : !draft.dirty.value ? '尚未修改任何内容' : ''))
const addMemberReason = computed(() => reason.value || (content.value.members.length >= 20 ? '最多添加 20 位核心人员，请先移除其他人员' : ''))
const addStatReason = computed(() => reason.value || (content.value.stats.length >= 12 ? '最多添加 12 项优势指标，请先移除其他指标' : ''))
function moveReason(items: unknown[], index: number, delta: number) {
  return reason.value || (index + delta < 0 ? '已经是第一项，无法上移' : index + delta >= items.length ? '已经是最后一项，无法下移' : '')
}
function submit() {
  if (saveReason.value) { feedback.info(saveReason.value); return }
  save.mutate()
}
function addMember() { content.value.members.push({ name: '', role: '', description: '', tags: [], initials: '', avatar: '', visible: true }) }
function move(items: unknown[], index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= items.length) return
  const [item] = items.splice(index, 1)
  items.splice(target, 0, item)
}
</script>

<template>
  <LsFormPage title="官网内容" description="维护 www.lostsky.work 的备案号、核心人员和团队优势数据，保存后立即生效。">

  <LsAsyncState v-if="!access.restricted.value && query.isPending.value" state="loading" :rows="5" />
  <div v-else-if="!access.restricted.value && query.isError.value" class="content-groups"><LsAsyncState state="error" title="暂时无法读取官网内容" :description="friendlyError(query.error.value)" /><LsButton variant="secondary" @click="query.refetch()">重新加载</LsButton></div>
  <form v-else class="site-form" @submit.prevent="submit">
      <LsFormSection title="备案信息">
        <LsField label="ICP备案号" for-id="site-icp" hint="留空时保留官网原有“备案信息”链接"><NInput v-model:value="content.icp" :input-props="{ id: 'site-icp' }" :disabled="!writable" :maxlength="100" :placeholder="access.restricted.value ? '-' : '例如 粤ICP备12345678号-1'" /></LsField>
      </LsFormSection>
      <LsFormSection id="site-members-title" title="核心人员" description="编辑公开资料与展示顺序，所有修改随页面统一保存。">
          <p v-if="!content.members.length">{{ access.restricted.value ? '-' : '暂无核心人员，可添加后保存。' }}</p>
          <section v-for="(member, index) in content.members" :key="index" class="content-entry" :aria-label="`核心人员 ${index + 1}`">
            <h4>{{ member.name || `人员 ${index + 1}` }}</h4>
            <SiteMemberFields :member="member" :index="index" :readonly="!writable" />
            <div class="entry-actions">
              <LsSwitchField v-model="member.visible" label="公开展示" :disabled="!writable" :disabled-reason="reason" :aria-label="`显示人员 ${index + 1}`" />
              <LsButton variant="secondary" :disabled="Boolean(moveReason(content.members, index, -1))" :disabled-reason="moveReason(content.members, index, -1)" @click="move(content.members, index, -1)">上移</LsButton>
              <LsButton variant="secondary" :disabled="Boolean(moveReason(content.members, index, 1))" :disabled-reason="moveReason(content.members, index, 1)" @click="move(content.members, index, 1)">下移</LsButton>
              <LsButton variant="danger" :disabled="!writable" :disabled-reason="reason" @click="content.members.splice(index, 1)">移除人员</LsButton>
            </div>
          </section>
          <LsButton variant="secondary" :disabled="Boolean(addMemberReason)" :disabled-reason="addMemberReason" @click="addMember">添加人员</LsButton>
      </LsFormSection>
      <LsFormSection id="site-stats-title" title="团队优势数据" description="维护官网展示的数值、名称与顺序。">
          <p v-if="!content.stats.length">{{ access.restricted.value ? '-' : '暂无指标，可添加后保存。' }}</p>
          <section v-for="(stat, index) in content.stats" :key="index" class="content-entry" :aria-label="`优势指标 ${index + 1}`">
            <h4>{{ stat.label || `指标 ${index + 1}` }}</h4>
            <LsField label="展示数值" :for-id="`stat-value-${index}`" required><NInput v-model:value="stat.value" :input-props="{ id: `stat-value-${index}` }" :disabled="!writable" :maxlength="30" /></LsField>
            <LsField label="指标名称" :for-id="`stat-label-${index}`" required><NInput v-model:value="stat.label" :input-props="{ id: `stat-label-${index}` }" :disabled="!writable" :maxlength="60" /></LsField>
            <div class="entry-actions">
              <LsSwitchField v-model="stat.visible" label="公开展示" :disabled="!writable" :disabled-reason="reason" :aria-label="`显示指标 ${index + 1}`" />
              <LsButton variant="secondary" :disabled="Boolean(moveReason(content.stats, index, -1))" :disabled-reason="moveReason(content.stats, index, -1)" @click="move(content.stats, index, -1)">上移</LsButton>
              <LsButton variant="secondary" :disabled="Boolean(moveReason(content.stats, index, 1))" :disabled-reason="moveReason(content.stats, index, 1)" @click="move(content.stats, index, 1)">下移</LsButton>
              <LsButton variant="danger" :disabled="!writable" :disabled-reason="reason" @click="content.stats.splice(index, 1)">移除指标</LsButton>
            </div>
          </section>
          <LsButton variant="secondary" :disabled="Boolean(addStatReason)" :disabled-reason="addStatReason" @click="content.stats.push({ value: '', label: '', visible: true })">添加指标</LsButton>
      </LsFormSection>
      <LsFormActions><LsButton type="submit" :aria-busy="save.isPending.value" :disabled="Boolean(saveReason)" :disabled-reason="saveReason">{{ save.isPending.value ? '正在保存…' : '保存官网内容' }}</LsButton></LsFormActions>
  </form>
  </LsFormPage>
</template>

<style scoped>
.site-form,.content-groups { display: grid; gap: 24px; }
.content-entry { display: grid; gap: 16px; padding-block: 20px; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.entry-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
h4 { margin: 0; }
</style>
