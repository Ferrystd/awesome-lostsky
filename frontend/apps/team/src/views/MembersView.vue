<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { FileText, MessageCircleMore, Pencil, Plus, ShieldBan, ShieldCheck, UserX } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'

const client = useQueryClient()
const router = useRouter()
const access = useTeamAccess()
const search = ref('')
const category = ref<'all' | 'active' | 'blocked' | 'unclaimed'>('all')
const categoryOptions = [
  { label: '全部成员', value: 'all' },
  { label: '正常成员', value: 'active' },
  { label: '已封禁', value: 'blocked' },
  { label: '未认领 slug', value: 'unclaimed' },
]
const accessUnknown = computed(() => access.isPending.value || access.isError.value)
const canInvite = computed(() => accessUnknown.value || hasPermission(access.data.value, 'team.member.invite'))
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
    const blocked = Number(item.is_blocked) === 1
    const matchesCategory = category.value === 'all'
      || (category.value === 'active' && !blocked)
      || (category.value === 'blocked' && blocked)
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
  const blocked = Number(item.is_blocked) === 1
  return [
    { key: 'chat', label: '对话', icon: MessageCircleMore, disabled: !item.slug || blocked, reason: !item.slug ? '尚未认领 slug' : blocked ? '成员已封禁' : '' },
    { key: 'preview', label: '预览', icon: FileText },
    { key: 'manage', label: canUpdate.value ? '管理' : '查看', icon: Pencil },
    { key: blocked ? 'unblock' : 'block', label: blocked ? '解封' : '封禁', icon: blocked ? ShieldCheck : ShieldBan, disabled: !canUpdate.value, reason: canUpdate.value ? '' : permissionReason('team.member.update') },
    { key: 'remove', label: '移出', icon: UserX, danger: true, disabled: !canRemove.value, reason: canRemove.value ? '' : permissionReason('team.member.remove') },
  ]
}
function handleAction(key: string, item: Record<string, unknown>) {
  if (key === 'chat') window.location.href = chatWorkspaceUrl('/new', { participant: String(item.slug) })
  else if (key === 'preview') void router.push(`/member-detail?id=${item.id}`)
  else if (key === 'manage') void router.push(`/member-edit?id=${item.id}`)
  else if (key === 'block') mutate('/member/block', item, '确认封禁该成员？其身份与旧引用会保留，但暂时不可用。', '成员已封禁')
  else if (key === 'unblock') mutate('/member/unblock', item, '确认解除该成员的封禁？', '成员已解除封禁')
  else if (key === 'remove') mutate('/member/remove', item, '确认将该成员移出团队？其 slug 将永久保留。', '成员已移出团队')
}
</script>

<template>
  <div class="members-view">
    <AdminPageHeader title="成员" description="浏览团队内可见成员；具有全量读取权限时也会列出隐藏或封禁成员。">
      <template #actions>
        <RouterLink v-if="canInvite" class="primary-link" to="/member-add"><Plus :size="17" />添加成员</RouterLink>
        <span v-else tabindex="0" :title="permissionReason('team.member.invite')">
          <LsButton class="disabled" disabled :aria-label="`添加成员不可用：${permissionReason('team.member.invite')}`"><Plus :size="17" />添加成员</LsButton>
        </span>
      </template>
    </AdminPageHeader>

    <LsListToolbar
      v-model="search"
      placeholder="按昵称、slug 或用户 ID 搜索"
      aria-label="搜索成员"
      :count-label="`${filtered.length} 位成员`"
    >
      <template #filters>
        <NSelect v-model:value="category" class="category-select" :options="categoryOptions" aria-label="成员分类" />
      </template>
    </LsListToolbar>

    <Transition name="ls-state" mode="out-in">
      <p v-if="query.isError.value" key="error" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <div v-else-if="query.isPending.value" key="loading" class="loading"><span v-for="i in 5" :key="i" class="ls-skeleton" /></div>
      <LsEmptyState
        v-else-if="!filtered.length"
        key="empty"
        :title="search || category !== 'all' ? '没有匹配的成员' : '当前没有可查看的成员'"
        :description="search || category !== 'all' ? '尝试更短的关键词或切换成员分类。' : '成员可能尚未加入，或被设置为团队内隐藏。'"
      />
      <TransitionGroup v-else key="list" name="ls-list" tag="section" class="member-list">
        <article v-for="item in filtered" :key="String(item.id)">
        <div class="identity">
          <LsEntityIdentity type="teamMember" :name="String(item.nickname || `成员 #${item.id}`)" :slug="String(item.slug || '')" :image-url="item.avatar ? String(item.avatar) : null" fallback="initial">
            <template #status><LsStatusTag :label="Number(item.is_blocked) === 1 ? '已封禁' : '正常'" :type="Number(item.is_blocked) === 1 ? 'error' : 'success'" /></template>
          </LsEntityIdentity>
          <small>{{ item.description || '暂无成员简介' }}</small>
        </div>
        <LsResponsiveActions :actions="memberActions(item)" primary-key="manage" @select="handleAction($event, item)" />
        </article>
      </TransitionGroup>
    </Transition>
  </div>
</template>

<style scoped>
.members-view{display:grid;gap:22px}.primary-link{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 16px;border:0;border-radius:var(--radius-md);color:white;background:var(--primary);font-size:.88rem;font-weight:700;text-decoration:none}.primary-link:hover{background:var(--primary-hover)}.primary-link.disabled{opacity:.45;cursor:not-allowed}.category-select{width:10rem}.member-list{display:grid;overflow:hidden;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface)}.member-list article{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:15px;padding:15px 17px;border-bottom:1px solid var(--border);background:var(--surface);transition:background-color var(--motion-fast) var(--ease-standard),opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}.member-list article:last-child{border-bottom:0}.member-list article:hover{background:var(--surface-subtle)}.identity{min-width:0;display:grid;gap:.25rem}.identity>small{margin-left:56px;overflow:hidden;color:var(--text-tertiary);font-size:.8rem;text-overflow:ellipsis;white-space:nowrap}.empty{display:grid;justify-items:center;gap:8px;padding:54px 20px;border:1px dashed var(--border);border-radius:var(--radius-lg);color:var(--text-secondary);text-align:center}.empty h2,.empty p{margin:0}.loading{display:grid;gap:10px}.loading span{height:82px;border-radius:var(--radius-lg);background:var(--surface-subtle)}.error{color:var(--danger)}
@media(max-width:820px){.member-list article{grid-template-columns:minmax(0,1fr)}.identity>small{margin-left:0}}
</style>
