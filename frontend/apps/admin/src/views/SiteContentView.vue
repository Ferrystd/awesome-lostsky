<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { type SiteContent } from '@lostsky/shared/siteContent'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
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
function submit() {
  if (!writable.value) { feedback.info(reason.value); return }
  if (!draft.dirty.value || save.isPending.value || query.isError.value || !query.data.value) return
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
  <LsPageHeader title="官网内容" description="维护 www.lostsky.work 的备案号、核心人员和团队优势数据，保存后立即生效。" />
  <LsAsyncState v-if="!access.restricted.value && query.isPending.value" state="loading" :rows="5" />
  <div v-else-if="!access.restricted.value && query.isError.value" class="content-groups"><LsAsyncState state="error" title="暂时无法读取官网内容" :description="friendlyError(query.error.value)" /><LsButton variant="secondary" @click="query.refetch()">重新加载</LsButton></div>
  <form v-else class="site-form" @submit.prevent="submit">
    <LsPanel>
      <template #header><h2>维护官网内容</h2></template>
      <div class="content-groups">
        <LsField label="ICP备案号" for-id="site-icp" hint="留空时保留官网原有“备案信息”链接"><NInput v-model:value="content.icp" :input-props="{ id: 'site-icp' }" :disabled="!writable" :maxlength="100" :placeholder="access.restricted.value ? '-' : '例如 粤ICP备12345678号-1'" /></LsField>
        <section aria-labelledby="site-members-title">
          <h3 id="site-members-title">核心人员</h3>
          <p v-if="!content.members.length">{{ access.restricted.value ? '-' : '暂无核心人员，可添加后保存。' }}</p>
          <section v-for="(member, index) in content.members" :key="index" class="content-entry" :aria-label="`核心人员 ${index + 1}`">
            <h4>{{ member.name || `人员 ${index + 1}` }}</h4>
            <SiteMemberFields :member="member" :index="index" :readonly="!writable" />
            <div class="entry-actions">
              <LsSwitchField v-model="member.visible" label="公开展示" :disabled="!writable" :disabled-reason="reason" :aria-label="`显示人员 ${index + 1}`" />
              <LsButton variant="secondary" :disabled="!writable || index === 0" :disabled-reason="reason" @click="move(content.members, index, -1)">上移</LsButton>
              <LsButton variant="secondary" :disabled="!writable || index === content.members.length - 1" :disabled-reason="reason" @click="move(content.members, index, 1)">下移</LsButton>
              <LsButton variant="danger" :disabled="!writable" :disabled-reason="reason" @click="content.members.splice(index, 1)">移除人员</LsButton>
            </div>
          </section>
          <LsButton variant="secondary" :disabled="!writable || content.members.length >= 20" :disabled-reason="reason" @click="addMember">添加人员</LsButton>
        </section>
        <section aria-labelledby="site-stats-title">
          <h3 id="site-stats-title">团队优势数据</h3>
          <p v-if="!content.stats.length">{{ access.restricted.value ? '-' : '暂无指标，可添加后保存。' }}</p>
          <section v-for="(stat, index) in content.stats" :key="index" class="content-entry" :aria-label="`优势指标 ${index + 1}`">
            <h4>{{ stat.label || `指标 ${index + 1}` }}</h4>
            <LsField label="展示数值" :for-id="`stat-value-${index}`" required><NInput v-model:value="stat.value" :input-props="{ id: `stat-value-${index}` }" :disabled="!writable" :maxlength="30" /></LsField>
            <LsField label="指标名称" :for-id="`stat-label-${index}`" required><NInput v-model:value="stat.label" :input-props="{ id: `stat-label-${index}` }" :disabled="!writable" :maxlength="60" /></LsField>
            <div class="entry-actions">
              <LsSwitchField v-model="stat.visible" label="公开展示" :disabled="!writable" :disabled-reason="reason" :aria-label="`显示指标 ${index + 1}`" />
              <LsButton variant="secondary" :disabled="!writable || index === 0" :disabled-reason="reason" @click="move(content.stats, index, -1)">上移</LsButton>
              <LsButton variant="secondary" :disabled="!writable || index === content.stats.length - 1" :disabled-reason="reason" @click="move(content.stats, index, 1)">下移</LsButton>
              <LsButton variant="danger" :disabled="!writable" :disabled-reason="reason" @click="content.stats.splice(index, 1)">移除指标</LsButton>
            </div>
          </section>
          <LsButton variant="secondary" :disabled="!writable || content.stats.length >= 12" :disabled-reason="reason" @click="content.stats.push({ value: '', label: '', visible: true })">添加指标</LsButton>
        </section>
      </div>
      <template #footer><LsFormActions><LsButton type="submit" :loading="save.isPending.value" :disabled="!writable || !draft.dirty.value || !query.data.value" :disabled-reason="reason">保存官网内容</LsButton></LsFormActions></template>
    </LsPanel>
  </form>
</template>

<style scoped>
.site-form,.content-groups { display: grid; gap: 24px; }
.content-entry { display: grid; gap: 16px; padding-block: 20px; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.entry-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
h2,h3,h4 { margin: 0 0 16px; }
</style>
