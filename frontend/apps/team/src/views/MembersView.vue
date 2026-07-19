<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { FileText, Pencil, Plus, Search, ShieldBan, ShieldCheck, UserRound, UserX } from '@lucide/vue'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const client = useQueryClient()
const search = ref('')
const query = useQuery({ queryKey: ['members'], queryFn: () => api.get<Record<string, unknown>[]>('/member/index') })
const members = computed(() => query.data.value ?? [])
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return members.value
  return members.value.filter(item => [item.nickname, item.slug, item.user_id, item.description].some(value => String(value ?? '').toLowerCase().includes(term)))
})
const action = useMutation({
  mutationFn: ({ endpoint, member_id }: { endpoint: string; member_id: number }) => api.post(endpoint, { member_id }),
  onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
})

function mutate(endpoint: string, item: Record<string, unknown>, message: string) {
  if (confirm(message)) action.mutate({ endpoint, member_id: Number(item.id) })
}
</script>

<template>
  <div class="members-view">
    <AdminPageHeader title="成员" description="查看成员状态，进入独立页面维护公开资料、岗位和管理员身份设置。">
      <template #actions><RouterLink class="primary-link" to="/member-add"><Plus :size="17" />添加成员</RouterLink></template>
    </AdminPageHeader>

    <label class="search-field">
      <Search :size="18" aria-hidden="true" />
      <span class="ls-sr-only">搜索成员</span>
      <input v-model="search" type="search" placeholder="按昵称、slug 或用户 ID 搜索">
    </label>

    <p v-if="query.isError.value || action.isError.value" class="error" role="alert">{{ friendlyError(query.error.value || action.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading"><span v-for="i in 5" :key="i" /></div>
    <section v-else-if="!filtered.length" class="empty">
      <UserRound :size="34" />
      <h2>{{ search ? '没有匹配的成员' : '团队里还没有成员' }}</h2>
      <p>{{ search ? '尝试更短的关键词或直接输入用户 ID。' : '添加一位已有 LostSky 用户开始协作。' }}</p>
    </section>
    <section v-else class="member-list">
      <article v-for="item in filtered" :key="String(item.id)">
        <div class="avatar">
          <img v-if="item.avatar" :src="String(item.avatar)" alt="">
          <span v-else>{{ String(item.nickname || '成').slice(0, 1) }}</span>
        </div>
        <div class="identity">
          <div><h2>{{ item.nickname || `成员 #${item.id}` }}</h2><span :class="{ blocked: Number(item.is_blocked) === 1 }">{{ Number(item.is_blocked) === 1 ? '已封禁' : '正常' }}</span></div>
          <p>{{ item.slug ? `@${item.slug}` : '尚未认领 slug' }} · User #{{ item.user_id }}</p>
          <small>{{ item.description || '暂无成员简介' }}</small>
        </div>
        <nav aria-label="成员操作">
          <RouterLink :to="`/member-detail?id=${item.id}`" title="自定义资料"><FileText :size="18" /><span>资料</span></RouterLink>
          <RouterLink :to="`/member-edit?id=${item.id}`" title="编辑成员"><Pencil :size="18" /><span>编辑</span></RouterLink>
          <button v-if="Number(item.is_blocked) === 1" type="button" @click="mutate('/member/unblock', item, '确认解除该成员的封禁？')"><ShieldCheck :size="18" /><span>解封</span></button>
          <button v-else type="button" @click="mutate('/member/block', item, '确认封禁该成员？其身份与旧引用会保留，但暂时不可用。')"><ShieldBan :size="18" /><span>封禁</span></button>
          <button type="button" class="danger" @click="mutate('/member/remove', item, '确认将该成员移出团队？其 slug 将永久保留。')"><UserX :size="18" /><span>移出</span></button>
        </nav>
      </article>
    </section>
  </div>
</template>

<style scoped>
.members-view { display: grid; gap: 22px; }
.primary-link { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 16px; border-radius: var(--radius-md); color: white; background: var(--primary); font-size: .88rem; font-weight: 700; text-decoration: none; }
.primary-link:hover { background: var(--primary-hover); }
.search-field { max-width: 520px; min-height: 44px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.search-field:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 13%, transparent); }
.search-field input { width: 100%; border: 0; outline: 0; color: var(--text); background: transparent; font: inherit; }
.member-list { display: grid; gap: 10px; }
.member-list article { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 15px; padding: 17px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.avatar { width: 48px; height: 48px; display: grid; place-items: center; overflow: hidden; border-radius: 15px; color: white; background: linear-gradient(145deg, var(--primary), var(--primary-hover)); font-weight: 800; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.identity { min-width: 0; }
.identity > div { display: flex; align-items: center; gap: 9px; }
.identity h2 { margin: 0; overflow: hidden; font-size: 1rem; text-overflow: ellipsis; white-space: nowrap; }
.identity span { padding: 2px 7px; border-radius: 999px; color: var(--success); background: color-mix(in srgb, var(--success) 9%, transparent); font-size: .7rem; }
.identity span.blocked { color: var(--danger); background: color-mix(in srgb, var(--danger) 9%, transparent); }
.identity p, .identity small { display: block; margin: 4px 0 0; overflow: hidden; color: var(--text-secondary); font-size: .8rem; text-overflow: ellipsis; white-space: nowrap; }
.identity small { color: var(--text-tertiary); }
nav { display: flex; align-items: center; gap: 3px; }
nav a, nav button { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 10px; border: 0; border-radius: var(--radius-md); color: var(--text-secondary); background: transparent; font: inherit; font-size: .78rem; text-decoration: none; cursor: pointer; }
nav a:hover, nav button:hover { color: var(--primary); background: var(--surface-subtle); }
nav .danger:hover { color: var(--danger); }
.empty { display: grid; justify-items: center; gap: 8px; padding: 54px 20px; border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-secondary); text-align: center; }
.empty h2, .empty p { margin: 0; }
.loading { display: grid; gap: 10px; }
.loading span { height: 82px; border-radius: var(--radius-lg); background: var(--surface-subtle); }
.error { color: var(--danger); }
@media (max-width: 820px) {
  .member-list article { grid-template-columns: auto minmax(0, 1fr); }
  nav { grid-column: 1 / -1; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 9px; }
}
@media (max-width: 520px) { nav span { display: none; } .member-list article { padding: 14px; } }
</style>
