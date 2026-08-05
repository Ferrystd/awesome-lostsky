<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NTag } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ReasonDialog from '../components/ReasonDialog.vue'
import { can } from '../session'
import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import type { AuditEvent, UserSummary } from '../types'
import { formatTime } from '../utils'

interface TeamLink { id: number; slug: string; is_banned: number; is_cancelled: number; create_time: number }
interface UserDetail extends UserSummary {
  teams: TeamLink[]
  devices: Array<{ id: number; device_name: string; ua: string; last_active_time: number; create_time: number }>
  roles: Array<{ id: number; name: string; role_key: string }>
  audit_events: AuditEvent[]
}
const route = useRoute()
const id = Number(route.params.id)
const dialog = ref(false)
const action = ref<'ban' | 'unban' | 'revoke-sessions'>('ban')
const query = useQuery({ queryKey: ['admin-user', id], queryFn: () => api.get<UserDetail>(`/users/${id}`) })
const mutation = useMutation({ mutationFn: (reason: string) => api.post(`/users/${id}/${action.value}`, { reason }), onSuccess: async () => { feedback.success(action.value === 'ban' ? '用户已封禁' : action.value === 'unban' ? '用户已解封' : '用户会话已撤销'); dialog.value = false; await query.refetch() } })
const dialogTitle = computed(() => action.value === 'ban' ? '封禁这个用户？' : action.value === 'unban' ? '解封这个用户？' : '撤销全部会话？')
const consequence = computed(() => action.value === 'ban' ? '用户将立即退出全部设备，并无法重新登录。' : action.value === 'unban' ? '用户可以重新登录，但旧会话不会恢复。' : '所有设备和刷新令牌都会失效，用户需要重新登录。')
const actionLabel = computed(() => action.value === 'ban' ? '封禁用户' : action.value === 'unban' ? '解封用户' : '撤销全部会话')
const teamStatus = (team: TeamLink): AdminStatus => team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'
function open(next: typeof action.value) { action.value = next; dialog.value = true }
</script>

<template>
  <LsPageHeader title="用户详情" description="核对身份、团队与设备后再执行治理操作。" back-to="/users">
    <template #actions>
      <LsButton v-if="can('admin.user.session.revoke')" variant="secondary" @click="open('revoke-sessions')">撤销全部会话</LsButton>
      <LsButton v-if="can('admin.user.moderate') && query.data.value" :variant="query.data.value.is_banned ? 'primary' : 'danger'" @click="open(query.data.value.is_banned ? 'unban' : 'ban')">{{ query.data.value.is_banned ? '解封用户' : '封禁用户' }}</LsButton>
    </template>
  </LsPageHeader>
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取用户详情" :description="friendlyError(query.error.value)" />
  <template v-else-if="query.data.value">
    <LsPanel>
      <template #header><div class="panel-heading"><div><h2>{{ query.data.value.nickname || query.data.value.username }}</h2><p>#{{ query.data.value.id }} · @{{ query.data.value.username }}</p></div><LsStatusTag :label="adminStatusLabel(query.data.value.is_banned ? 'banned' : 'active')" :type="adminStatusType(query.data.value.is_banned ? 'banned' : 'active')" /></div></template>
      <dl class="definition-list"><dt>手机</dt><dd>{{ query.data.value.phone || query.data.value.phone_masked || '—' }}</dd><dt>邮箱</dt><dd>{{ query.data.value.email || query.data.value.email_masked || '—' }}</dd><dt>平台角色</dt><dd><NTag v-for="role in query.data.value.roles" :key="role.id" size="small">{{ role.name }}</NTag><span v-if="!query.data.value.roles.length">非平台管理员</span></dd><dt>注册时间</dt><dd>{{ formatTime(query.data.value.create_time) }}</dd></dl>
    </LsPanel>
    <div class="detail-grid detail-grid--two">
      <LsPanel><template #header><div><h2>所属团队</h2><p>{{ query.data.value.teams.length }} 个团队关系</p></div></template><LsEmptyState v-if="!query.data.value.teams.length" title="尚未加入团队" description="该用户当前没有任何团队关系。" /><div v-else class="simple-list"><RouterLink v-for="team in query.data.value.teams" :key="team.id" :to="`/teams/${team.id}`"><span><strong>{{ team.slug }}</strong><small>#{{ team.id }} · {{ formatTime(team.create_time) }}</small></span><LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" /></RouterLink></div></LsPanel>
      <LsPanel><template #header><div><h2>已授权设备</h2><p>{{ query.data.value.devices.length }} 个有效会话</p></div></template><LsEmptyState v-if="!query.data.value.devices.length" title="当前没有有效设备" description="用户下次登录后，已授权设备会显示在这里。" /><div v-else class="simple-list"><div v-for="device in query.data.value.devices" :key="device.id"><span><strong>{{ device.device_name || '未命名设备' }}</strong><small>{{ device.ua || '未知客户端' }}</small></span><time>{{ formatTime(device.last_active_time) }}</time></div></div></LsPanel>
    </div>
  </template>
  <ReasonDialog v-model:show="dialog" :title="dialogTitle" :consequence="consequence" :action-label="actionLabel" :danger="action === 'ban' || action === 'revoke-sessions'" :loading="mutation.isPending.value" @confirm="mutation.mutate" />
</template>

<style scoped>.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.panel-heading h2,.panel-heading p,:deep(.ls-panel__header h2),:deep(.ls-panel__header p){margin:0}.panel-heading p,:deep(.ls-panel__header p){color:var(--muted-ink)}.definition-list .n-tag{margin:0 6px 4px 0}.simple-list{display:grid}.simple-list>a,.simple-list>div{min-height:60px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.simple-list>*:last-child{border-bottom:0}.simple-list strong,.simple-list small{display:block}.simple-list small,.simple-list time{max-width:42ch;color:var(--muted-ink);font-size:.76rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(min-width:800px){.detail-grid--two{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>
