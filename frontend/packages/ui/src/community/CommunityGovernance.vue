<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { useCommunityListState } from '@lostsky/shared/useCommunityListState'
import { formatDate } from '@lostsky/shared/format'
import { api, friendlyError } from '@lostsky/api/client'
import type { CommunityBoard, CommunityAnnouncement, CommunityPost, CommunityComment, CommunityMember, CommunityPage } from '@lostsky/api/community'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NInputNumber, NSelect, NList, NListItem, NThing, NTag, NSpace, NPagination, NModal } from 'naive-ui'
import LsPageHeader from '../components/LsPageHeader.vue'
import LsListToolbar from '../components/LsListToolbar.vue'
import LsAsyncState from '../components/LsAsyncState.vue'
import LsEmptyState from '../components/LsEmptyState.vue'
import LsButton from '../components/LsButton.vue'
import LsField from '../components/LsField.vue'
import LsFormSection from '../components/LsFormSection.vue'
import LsFormActions from '../components/LsFormActions.vue'
import LsSwitchField from '../components/LsSwitchField.vue'
import LsMarkdownEditor from '../components/LsMarkdownEditor.vue'
import LsMarkdownRenderer from '../components/LsMarkdownRenderer.vue'
import CommunityContentState from './CommunityContentState.vue'
import { feedback } from '../feedback'

const actorKey = communityActorKey()
const props = defineProps<{ apiBase: string; routeBase: string; backTo: string; communityName: string; canRead: boolean; canModerate: boolean; deniedReason: string; expectedEntityId?: number | null; uploadImage: (file: File) => Promise<string>; uploadDisabledReason?: string }>()
type Section = 'boards' | 'announcements' | 'posts' | 'comments' | 'members'
type Row = CommunityBoard | CommunityAnnouncement | CommunityPost | CommunityComment | CommunityMember
const sections: { key: Section; label: string }[] = [{ key: 'boards', label: '板块' }, { key: 'announcements', label: '公告' }, { key: 'posts', label: '帖子' }, { key: 'comments', label: '评论' }, { key: 'members', label: '成员' }]
const route = useRoute(), router = useRouter(), cache = useQueryClient()
const section = computed(() => String(route.params.section || 'boards') as Section)
const itemId = computed(() => String(route.params.itemId || ''))
const editing = computed(() => Boolean(itemId.value) && ['boards', 'announcements'].includes(section.value))
const title = computed(() => sections.find(item => item.key === section.value)!.label)
const { keyword, status, page, restoreScroll } = useCommunityListState(`governance:${props.apiBase}:${section.value}`)
const busy = ref(false)
watch([keyword, status, section], () => { page.value = 1 })
const query = useQuery({ queryKey: computed(() => ['community-governance', props.apiBase, section.value, keyword.value, page.value, status.value, actorKey]), queryFn: () => api.get<CommunityPage<Row>>(`${props.apiBase}/${section.value}`, { keyword: keyword.value, page: page.value, limit: 20, status: status.value }), enabled: computed(() => props.canRead && !editing.value) })
const detail = useQuery({ queryKey: computed(() => ['community-governance-detail', props.apiBase, section.value, itemId.value, actorKey]), queryFn: () => api.get<CommunityBoard | CommunityAnnouncement>(`${props.apiBase}/${section.value}/${itemId.value}`), enabled: computed(() => props.canRead && editing.value && itemId.value !== 'new') })
const form = reactive({ name: '', sort: 0 as number | null, enabled: true, title: '', content: '', pinned: false })
const draft = useQueryDraft({ key: () => `${props.apiBase}/${section.value}/${itemId.value}`, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty)
watch(detail.data, value => { if (value) draft.hydrate('name' in value ? { name: value.name, sort: value.sort, enabled: value.enabled, title: '', content: '', pinned: false } : { name: '', sort: 0, enabled: true, title: value.title, content: value.content, pinned: value.pinned }) }, { immediate: true })
const identityBody = computed(() => props.expectedEntityId == null ? {} : { expected_entity_id: props.expectedEntityId })
const unavailable = computed(() => !props.canModerate ? props.deniedReason : busy.value ? '正在保存操作' : '')
const formReason = computed(() => unavailable.value || (section.value === 'boards' ? (!form.name.trim() ? '请填写板块名称' : form.sort == null || !Number.isInteger(form.sort) || form.sort < 0 ? '排序需为非负整数' : '') : !form.title.trim() ? '请填写公告标题' : !form.content.trim() ? '请填写公告正文' : '') || (itemId.value !== 'new' && !draft.dirty.value ? '没有待保存的修改' : ''))
const boardRows = computed(() => (query.data.value?.list ?? []) as CommunityBoard[])
const announcementRows = computed(() => (query.data.value?.list ?? []) as CommunityAnnouncement[])
const contentRows = computed(() => (query.data.value?.list ?? []) as (CommunityPost | CommunityComment)[])
const memberRows = computed(() => (query.data.value?.list ?? []) as CommunityMember[])
async function refresh() { await cache.invalidateQueries({ queryKey: ['community-governance'] }); await cache.invalidateQueries({ queryKey: ['community-governance-detail'] }); await cache.invalidateQueries({ queryKey: ['community-boards'] }); await cache.invalidateQueries({ queryKey: ['community-announcements'] }); await cache.invalidateQueries({ queryKey: ['community-posts'] }) }
async function save() {
  if (formReason.value) return feedback.info(formReason.value)
  const submission = draft.capture(); busy.value = true
  try { const data = submission.value; await api.post(`${props.apiBase}/${section.value}/${itemId.value === 'new' ? 0 : itemId.value}`, { ...(section.value === 'boards' ? { name: data.name, sort: data.sort, enabled: data.enabled } : { title: data.title, content: data.content, pinned: data.pinned }), ...identityBody.value }); if (!draft.accept(submission) || draft.dirty.value) return; await refresh(); feedback.success(`${title.value}已保存`); await router.push(`${props.routeBase}/${section.value}`) } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
const action = ref<{ path: string; body: Record<string, unknown>; title: string; needsReason: boolean } | null>(null), reason = ref('')
function moderate(row: CommunityPost | CommunityComment, pin = false) {
  const body = pin && 'pinned' in row ? { pinned: !row.pinned } : { hidden: row.status !== 'Hidden' }
  action.value = { path: `${props.apiBase}/${section.value}/${row.id}/moderate`, body, title: pin ? ('pinned' in row && row.pinned ? '取消置顶帖子' : '置顶帖子') : row.status === 'Hidden' ? '恢复内容' : '隐藏内容', needsReason: !pin && row.status !== 'Hidden' }; reason.value = ''
}
function mute(row: CommunityMember) { action.value = { path: `${props.apiBase}/members/${row.entity_id}/mute`, body: { muted: !row.muted }, title: row.muted ? '解除禁言' : '禁言人员', needsReason: !row.muted }; reason.value = '' }
async function confirmAction() {
  if (!action.value || unavailable.value || (action.value.needsReason && !reason.value.trim())) return
  busy.value = true
  try { await api.post(action.value.path, { ...action.value.body, reason: reason.value, ...identityBody.value }); action.value = null; await refresh(); feedback.success('操作已保存') } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
watch(query.isSuccess, ready => { if (ready) void restoreScroll() }, { immediate: true })
</script>
<template>
  <LsPageHeader :title="editing ? `${itemId === 'new' ? '新增' : '编辑'}${title}` : `${communityName} · ${title}管理`" :back-to="editing ? `${routeBase}/${section}` : backTo"><template v-if="!editing && ['boards', 'announcements'].includes(section)" #actions><LsButton @click="router.push(`${routeBase}/${section}/new`)">新增{{ title }}</LsButton></template></LsPageHeader>
  <LsAsyncState v-if="editing && detail.isError.value && detail.data.value" state="error" title="暂时无法更新资料" description="已输入内容保留，网络恢复后将自动重新读取。" />
  <NSpace v-if="!editing" aria-label="社区管理分区"><RouterLink v-for="item in sections" :key="item.key" :to="`${routeBase}/${item.key}`" :aria-current="section === item.key ? 'page' : undefined">{{ item.label }}</RouterLink></NSpace>
  <LsEmptyState v-if="!canRead" :title="deniedReason" description="当前人员没有此社区的治理读取权限。" />
  <template v-else-if="editing">
    <LsAsyncState v-if="itemId !== 'new' && detail.isPending.value" state="loading" /><template v-else-if="detail.isError.value && !detail.data.value"><LsAsyncState state="error" :description="friendlyError(detail.error.value)" /></template>
    <form v-else @submit.prevent="save"><LsFormSection :title="section === 'boards' ? '板块设置' : '公告内容'">
      <template v-if="section === 'boards'"><LsField label="板块名称" for-id="board-name" required><NInput :input-props="{ id: 'board-name' }" v-model:value="form.name" maxlength="100" /></LsField><LsField label="排序" for-id="board-sort" hint="较小的数值显示在前面。"><NInputNumber :input-props="{ id: 'board-sort' }" v-model:value="form.sort" :min="0" :precision="0" /></LsField><LsSwitchField v-model="form.enabled" label="启用板块" description="停用后保留已有帖子，停止接受新帖子。" /></template>
      <template v-else><LsField label="公告标题" for-id="announcement-title" required><NInput :input-props="{ id: 'announcement-title' }" v-model:value="form.title" maxlength="200" /></LsField><LsField label="公告正文" for-id="announcement-content" required><LsMarkdownEditor id="announcement-content" v-model="form.content" :upload-image="uploadImage" :upload-disabled-reason="uploadDisabledReason" /></LsField><LsSwitchField v-model="form.pinned" label="置顶公告" description="在社区首页优先展示。" /></template>
    </LsFormSection><LsFormActions><LsButton type="submit" :disabled="Boolean(formReason)" :disabled-reason="formReason">保存{{ title }}</LsButton></LsFormActions></form>
  </template>
  <template v-else>
    <LsListToolbar v-model="keyword" :placeholder="`搜索${title}`" :aria-label="`搜索${title}`" :count-label="`${query.data.value?.total ?? 0} 条记录`"><template v-if="section === 'posts' || section === 'comments'" #filters><NSelect v-model:value="status" aria-label="内容状态" clearable placeholder="全部状态" :options="[{ label: '可见', value: 'Visible' }, { label: '已隐藏', value: 'Hidden' }, { label: '作者已删除', value: 'Deleted' }]" /></template></LsListToolbar>
    <LsAsyncState v-if="query.isPending.value" state="loading" /><template v-else-if="query.isError.value"><LsAsyncState state="error" :description="friendlyError(query.error.value)" /></template><LsEmptyState v-else-if="!query.data.value?.list.length" :title="`没有可显示的${title}`" description="调整搜索条件或稍后再来。" />
    <NList v-else bordered>
      <template v-if="section === 'boards'"><NListItem v-for="row in boardRows" :key="row.id"><NThing :title="row.name" :description="`排序 ${row.sort} · ${row.enabled ? '已启用' : '已停用'}`"><template #action><RouterLink :to="`${routeBase}/boards/${row.id}`">编辑板块</RouterLink></template></NThing></NListItem></template>
      <template v-else-if="section === 'announcements'"><NListItem v-for="row in announcementRows" :key="row.id"><NThing :title="row.title"><template #header-extra><NTag v-if="row.pinned">置顶公告</NTag></template><LsMarkdownRenderer :content="row.content" /><template #action><RouterLink :to="`${routeBase}/announcements/${row.id}`">编辑公告</RouterLink></template></NThing></NListItem></template>
      <template v-else-if="section === 'members'"><NListItem v-for="row in memberRows" :key="row.entity_id"><NThing :title="row.entity.name" :description="`${row.entity.slug} · ${row.joined ? '已加入' : '已退出'} · ${row.entity.is_valid ? '有效人员' : '人员已失效'}`"><p v-if="row.muted">禁言原因：{{ row.reason }}</p><template #action><LsButton variant="secondary" :disabled="Boolean(unavailable)" :disabled-reason="unavailable" @click="mute(row)">{{ row.muted ? '解除禁言' : '禁言' }}</LsButton></template></NThing></NListItem></template>
      <template v-else><NListItem v-for="row in contentRows" :key="row.id"><NThing :title="'title' in row ? row.title : `${row.author.name}的评论`" :description="`${row.author.name} · ${formatDate(row.create_time * 1000)}`"><CommunityContentState :status="row.status" :reason="row.hidden_reason" /><LsMarkdownRenderer v-if="row.status !== 'Deleted'" :content="row.content" /><template #action><NSpace><LsButton variant="secondary" :disabled="Boolean(unavailable) || row.status === 'Deleted'" :disabled-reason="unavailable || '作者已删除的内容不能恢复或隐藏'" @click="moderate(row)">{{ row.status === 'Hidden' ? '恢复内容' : '隐藏内容' }}</LsButton><LsButton v-if="'pinned' in row" variant="secondary" :disabled="Boolean(unavailable) || row.status === 'Deleted'" :disabled-reason="unavailable || '作者已删除的帖子不能置顶'" @click="moderate(row, true)">{{ row.pinned ? '取消置顶' : '置顶帖子' }}</LsButton></NSpace></template></NThing></NListItem></template>
    </NList>
    <NPagination v-if="(query.data.value?.total ?? 0) > 20" v-model:page="page" :page-size="20" :item-count="query.data.value?.total" simple />
  </template>
  <NModal :show="Boolean(action)" preset="card" :title="action?.title" class="community-action-dialog" :mask-closable="!busy" @update:show="!$event && !busy && (action = null)"><form @submit.prevent="confirmAction"><LsField v-if="action?.needsReason" label="处理原因" for-id="moderation-reason" required hint="原因会向被处理的作者或人员显示。"><NInput :input-props="{ id: 'moderation-reason' }" v-model:value="reason" type="textarea" maxlength="500" /></LsField><p v-else>确认{{ action?.title }}？</p><LsFormActions><LsButton type="submit" :disabled="Boolean(unavailable) || Boolean(action?.needsReason && !reason.trim())" :disabled-reason="unavailable || '请填写处理原因'">确认</LsButton><LsButton variant="secondary" :disabled="busy" disabled-reason="正在保存操作" @click="action = null">取消</LsButton></LsFormActions></form></NModal>
</template>
<style scoped>.community-action-dialog{width:min(32rem,calc(100vw - 2rem))}</style>
