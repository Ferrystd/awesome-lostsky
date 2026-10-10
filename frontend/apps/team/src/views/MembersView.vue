<script setup lang="ts">
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { FileText, MessageCircleMore, Pencil, Plus, ShieldBan, ShieldCheck, UserX } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { memberStatusCode, memberStatusLabel, memberStatusType } from '../lib/memberStatus'
import { hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'

const client = useQueryClient()
const router = useRouter()
const access = useTeamAccess()
const search = ref('')
const category = ref<'all' | 'active' | 'blocked' | 'departed' | 'unclaimed'>('all')
const categoryOptions = [
  { label: '全部成员', value: 'all' },
  { label: '正常成员', value: 'active' },
  { label: '已封禁', value: 'blocked' },
  { label: '已离队', value: 'departed' },
  { label: '未认领 slug', value: 'unclaimed' },
]
const accessUnknown = computed(() => access.isPending.value || access.isError.value)
const canUpdate = computed(() => accessUnknown.value || hasPermission(access.data.value, 'team.member.update'))
const canRemove = computed(() => accessUnknown.value || hasPermission(access.data.value, 'team.member.remove'))
const query = useQuery({
  queryKey: ['members'],
  queryFn: () => api.get<Record<string, unknown>[]>('/member/index'),
})
const members = computed(() => query.data.value ?? [])
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return members.value.filter((item) => {
    const status = memberStatusCode(item)
    const matchesCategory = category.value === 'all'
      || category.value === status
      || (category.value === 'unclaimed' && !item.slug)
    const matchesSearch = !term || [item.nickname, item.slug, item.user_id, item.description]
      .some(value => String(value ?? '').toLowerCase().includes(term))
    return matchesCategory && matchesSearch
  })
})
const action = useMutation({
  mutationFn: ({ endpoint, member_id }: { endpoint: string; member_id: number; success: string }) => (
    api.post(endpoint, { member_id })
  ),
  onSuccess: async (_data, variables) => {
    feedback.success(variables.success)
    await client.invalidateQueries({ queryKey: ['members'] })
  },
  onError: error => feedback.error(friendlyError(error)),
})

function mutate(endpoint: string, item: Record<string, unknown>, message: string, success: string) {
  if (confirm(message)) action.mutate({ endpoint, member_id: Number(item.id), success })
}
function memberActions(item: Record<string, unknown>) {
  const status = memberStatusCode(item)
  const available = item.is_valid !== false
  return [
    { key: 'chat', label: '对话', icon: MessageCircleMore, disabled: !item.slug || !available, reason: !item.slug ? '尚未认领 slug' : !available ? `${memberStatusLabel(item)}，人员当前不可用` : '' },
    { key: 'preview', label: '预览', icon: FileText },
    { key: 'manage', label: canUpdate.value ? '管理' : '查看', icon: Pencil },
    ...(status === 'departed' ? [] : [{ key: status === 'blocked' ? 'unblock' : 'block', label: status === 'blocked' ? '解封' : '封禁', icon: status === 'blocked' ? ShieldCheck : ShieldBan, disabled: !canUpdate.value, reason: canUpdate.value ? '' : permissionReason('team.member.update') }]),
    ...(status === 'departed' ? [] : [{ key: 'departure', label: '离职', icon: UserX, danger: true, disabled: !canRemove.value, reason: canRemove.value ? '' : permissionReason('team.member.remove') }]),
  ]
}
function handleAction(key: string, item: Record<string, unknown>) {
  if (key === 'chat') window.location.href = chatWorkspaceUrl('/new', { participant: String(item.slug) })
  else if (key === 'preview') void router.push(`/member-detail?id=${item.id}`)
  else if (key === 'manage') void router.push(`/member-edit?id=${item.id}`)
  else if (key === 'block') mutate('/member/block', item, '确认封禁该成员？其身份与旧引用会保留，但暂时不可用。', '成员已封禁')
  else if (key === 'unblock') mutate('/member/unblock', item, '确认解除该成员的封禁？', '成员已解除封禁')
  else if (key === 'departure') mutate('/memberDeparture/depart', item, '确认将该成员设为已离职？操作后该成员的现有会话会立即失效；资料、角色、对象标识和业务关系都会保留。', '成员已离职')
}
</script>

<template>
  <div class="members-view">
    <AdminPageHeader title="成员" description="查看团队内有权查看的成员。"><template #actions><LsPagePrimaryAction :icon="Plus" label="添加成员" to="/member-add" /></template></AdminPageHeader>
    <LsListToolbar v-model="search" placeholder="按昵称、slug 或用户 ID 搜索" aria-label="搜索成员" :count-label="`${filtered.length} 位成员`"><template #filters><NSelect v-model:value="category" :options="categoryOptions" aria-label="成员分类" /></template></LsListToolbar>
    <LsAsyncState v-if="query.isError.value" state="error" title="暂时无法读取成员" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="5" />
    <LsEmptyState v-else-if="!filtered.length" :source="query.data.value" :title="search || category !== 'all' ? '没有匹配的成员' : '当前没有可查看的成员'" :description="search || category !== 'all' ? '尝试更短的关键词或切换成员分类。' : '成员可能尚未加入，或被设置为团队内隐藏。'" />
    <LsResourceList v-else aria-label="成员列表">
      <LsResourceRow v-for="item in filtered" :key="String(item.id)" :description="String(item.description || '暂无成员简介')">
        <template #identity><LsEntityIdentity type="teamMember" :name="String(item.nickname || `成员 #${item.id}`)" :slug="String(item.slug || '')" :image-url="item.avatar ? String(item.avatar) : null" fallback="initial"><template #status><LsStatusTag :label="memberStatusLabel(item)" :type="memberStatusType(item)" /></template></LsEntityIdentity></template>
        <template #actions><LsResponsiveActions :actions="memberActions(item)" primary-key="manage" @select="handleAction($event, item)" /></template>
      </LsResourceRow>
    </LsResourceList>
  </div>
</template>

<style scoped>
.members-view { display: grid; gap: 1.5rem; }
</style>
