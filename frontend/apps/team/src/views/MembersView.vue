<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { FileText, MessageCircleMore, Pencil, Plus, ShieldBan, ShieldCheck, UserRound, UserX } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'

const client = useQueryClient()
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
</script>

<template>
  <div class="members-view">
    <AdminPageHeader title="成员" description="浏览团队内可见成员；具有全量读取权限时也会列出隐藏或封禁成员。">
      <template #actions>
        <RouterLink v-if="canInvite" class="primary-link" to="/member-add"><Plus :size="17" />添加成员</RouterLink>
        <span v-else tabindex="0" :title="permissionReason('team.member.invite')">
          <button type="button" class="primary-link disabled" disabled :aria-label="`添加成员不可用：${permissionReason('team.member.invite')}`"><Plus :size="17" />添加成员</button>
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
      <section v-else-if="!filtered.length" key="empty" class="empty">
        <UserRound :size="34" />
        <h2>{{ search || category !== 'all' ? '没有匹配的成员' : '当前没有可查看的成员' }}</h2>
        <p>{{ search || category !== 'all' ? '尝试更短的关键词或切换成员分类。' : '成员可能尚未加入，或被设置为团队内隐藏。' }}</p>
      </section>
      <TransitionGroup v-else key="list" name="ls-list" tag="section" class="member-list">
        <article v-for="item in filtered" :key="String(item.id)">
        <div class="avatar">
          <img v-if="item.avatar" :src="String(item.avatar)" alt="">
          <span v-else>{{ String(item.nickname || '成').slice(0, 1) }}</span>
        </div>
        <div class="identity">
          <div>
            <h2>{{ item.nickname || `成员 #${item.id}` }}</h2>
            <span :class="{ blocked: Number(item.is_blocked) === 1 }">{{ Number(item.is_blocked) === 1 ? '已封禁' : '正常' }}</span>
          </div>
          <p>{{ item.slug ? `@${item.slug}` : '尚未认领 slug' }} · User #{{ item.user_id }}</p>
          <small>{{ item.description || '暂无成员简介' }}</small>
        </div>
        <nav aria-label="成员操作">
          <a
            v-if="item.slug && Number(item.is_blocked) !== 1"
            :href="chatWorkspaceUrl('/new', { participant: String(item.slug) })"
            :aria-label="`与 ${item.nickname || item.slug} 对话`"
          ><MessageCircleMore :size="18" /><span>对话</span></a>
          <RouterLink :to="`/member-detail?id=${item.id}`" title="预览成员资料"><FileText :size="18" /><span>预览</span></RouterLink>
          <RouterLink :to="`/member-edit?id=${item.id}`" :title="canUpdate ? '管理成员' : '查看成员'">
            <Pencil :size="18" /><span>{{ canUpdate ? '管理' : '查看' }}</span>
          </RouterLink>
          <span :tabindex="canUpdate ? -1 : 0" :title="canUpdate ? undefined : permissionReason('team.member.update')">
            <button
              v-if="Number(item.is_blocked) === 1"
              type="button"
              :disabled="!canUpdate"
              :aria-label="!canUpdate ? `解封不可用：${permissionReason('team.member.update')}` : undefined"
              @click="mutate('/member/unblock', item, '确认解除该成员的封禁？', '成员已解除封禁')"
            ><ShieldCheck :size="18" /><span>解封</span></button>
            <button
              v-else
              type="button"
              :disabled="!canUpdate"
              :aria-label="!canUpdate ? `封禁不可用：${permissionReason('team.member.update')}` : undefined"
              @click="mutate('/member/block', item, '确认封禁该成员？其身份与旧引用会保留，但暂时不可用。', '成员已封禁')"
            ><ShieldBan :size="18" /><span>封禁</span></button>
          </span>
          <span :tabindex="canRemove ? -1 : 0" :title="canRemove ? undefined : permissionReason('team.member.remove')">
            <button type="button" class="danger" :disabled="!canRemove" :aria-label="!canRemove ? `移出不可用：${permissionReason('team.member.remove')}` : undefined" @click="mutate('/member/remove', item, '确认将该成员移出团队？其 slug 将永久保留。', '成员已移出团队')">
              <UserX :size="18" /><span>移出</span>
            </button>
          </span>
        </nav>
        </article>
      </TransitionGroup>
    </Transition>
  </div>
</template>

<style scoped>
.members-view{display:grid;gap:22px}.primary-link{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 16px;border:0;border-radius:var(--radius-md);color:white;background:var(--primary);font-size:.88rem;font-weight:700;text-decoration:none}.primary-link:hover{background:var(--primary-hover)}.primary-link.disabled{opacity:.45;cursor:not-allowed}.category-select{width:10rem}.member-list{display:grid;overflow:hidden;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface)}.member-list article{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:15px;padding:15px 17px;border-bottom:1px solid var(--border);background:var(--surface);transition:background-color var(--motion-fast) var(--ease-standard),opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}.member-list article:last-child{border-bottom:0}.member-list article:hover{background:var(--surface-subtle)}.avatar{width:48px;height:48px;display:grid;place-items:center;overflow:hidden;border-radius:12px;color:white;background:var(--primary);font-weight:800}.avatar img{width:100%;height:100%;object-fit:cover}.identity{min-width:0}.identity>div{display:flex;align-items:center;gap:9px}.identity h2{margin:0;overflow:hidden;font-size:1rem;text-overflow:ellipsis;white-space:nowrap}.identity span{padding:2px 7px;border-radius:999px;color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent);font-size:.7rem}.identity span.blocked{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,transparent)}.identity p,.identity small{display:block;margin:4px 0 0;overflow:hidden;color:var(--text-secondary);font-size:.8rem;text-overflow:ellipsis;white-space:nowrap}.identity small{color:var(--text-tertiary)}nav{display:flex;align-items:center;gap:3px}nav a,nav button{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;border:0;border-radius:var(--radius-md);color:var(--text-secondary);background:transparent;font:inherit;font-size:.78rem;text-decoration:none;cursor:pointer;transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard)}nav a:hover,nav button:hover:not(:disabled){color:var(--primary);background:white}nav button:disabled{opacity:.38;cursor:not-allowed}nav>span:focus-visible{outline:3px solid color-mix(in srgb,var(--primary) 25%,transparent);border-radius:var(--radius-md)}nav .danger:hover:not(:disabled){color:var(--danger)}.empty{display:grid;justify-items:center;gap:8px;padding:54px 20px;border:1px dashed var(--border);border-radius:var(--radius-lg);color:var(--text-secondary);text-align:center}.empty h2,.empty p{margin:0}.loading{display:grid;gap:10px}.loading span{height:82px;border-radius:var(--radius-lg);background:var(--surface-subtle)}.error{color:var(--danger)}
@media(max-width:820px){.member-list article{grid-template-columns:auto minmax(0,1fr)}nav{grid-column:1/-1;justify-content:flex-end;border-top:1px solid var(--border);padding-top:9px}}@media(max-width:520px){nav span span{display:none}.member-list article{padding:14px}}
</style>
