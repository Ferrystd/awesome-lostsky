<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NDataTable, NTag } from 'naive-ui'
import { ShieldPlus } from '@lucide/vue'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import ReasonDialog from '../components/ReasonDialog.vue'
import { can } from '../session'
import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import type { AuditEvent, TeamSummary } from '../types'
import { formatTime } from '../utils'

interface Domain { id: number; domain: string; app: string; create_time: number }
interface TeamDetail extends TeamSummary { domains: Domain[]; abilities: Array<{ id: number; ability_key: string; level: number; expire_time: number }>; audit_events: AuditEvent[] }
const route = useRoute()
const id = Number(route.params.id)
const dialog = ref(false)
const query = useQuery({ queryKey: ['admin-team', id], queryFn: () => api.get<TeamDetail>(`/teams/${id}`) })
const action = computed(() => query.data.value?.is_banned ? 'unban' : 'ban')
const teamStatus = computed<AdminStatus>(() => query.data.value?.is_cancelled ? 'cancelled' : query.data.value?.is_banned ? 'banned' : 'active')
const mutation = useMutation({ mutationFn: (reason: string) => api.post(`/teams/${id}/${action.value}`, { reason }), onSuccess: async () => { feedback.success(action.value === 'ban' ? '团队已封禁' : '团队已解封'); dialog.value = false; await query.refetch() }, onError: error => feedback.error(friendlyError(error)) })
const domainColumns: DataTableColumns<Domain> = [
  { title: '域名', key: 'domain' },
  { title: '应用', key: 'app', render: row => h(NTag, { size: 'small' }, { default: () => row.app }) },
  { title: '创建时间', key: 'create_time', render: row => formatTime(row.create_time) },
]
</script>

<template>
  <LsPageHeader title="团队详情" description="查看平台层面的团队状态、域名和能力（Ability），不进入团队内部修改内容。" back-to="/teams">
    <template #actions>
      <LsPagePrimaryAction v-if="can('admin.team.ability.write') && query.data.value && !query.data.value.is_cancelled" :icon="ShieldPlus" label="开通能力" :to="{ path: '/entitlements/team-abilities', query: { team: query.data.value.slug, return: `/teams/${id}` } }" />
      <LsButton v-if="can('admin.team.moderate') && query.data.value && !query.data.value.is_cancelled" :variant="query.data.value.is_banned ? 'primary' : 'danger'" @click="dialog = true">{{ query.data.value.is_banned ? '解封团队' : '封禁团队' }}</LsButton>
    </template>
  </LsPageHeader>
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取团队详情" :description="friendlyError(query.error.value)" />
  <template v-else-if="query.data.value">
    <LsPanel>
      <template #header><LsSectionHeader :title="query.data.value.name || query.data.value.slug" :description="`#${query.data.value.id} · ${query.data.value.slug}`"><template #aside><LsStatusTag :label="adminStatusLabel(teamStatus)" :type="adminStatusType(teamStatus)" /></template></LsSectionHeader></template>
      <LsDescriptionList><dt>所有者</dt><dd>{{ query.data.value.owner_username || `用户 #${query.data.value.user_id}` }}</dd><dt>成员数量</dt><dd>{{ query.data.value.member_count }}</dd><dt>创建时间</dt><dd>{{ formatTime(query.data.value.create_time) }}</dd><dt>最近更新</dt><dd>{{ formatTime(query.data.value.update_time) }}</dd></LsDescriptionList>
    </LsPanel>
    <LsPanel>
      <template #header><div><h2>域名绑定</h2><p>只读平台配置</p></div></template>
      <LsEmptyState v-if="!query.data.value.domains.length" title="没有自定义域名" description="团队尚未绑定额外访问域名。" />
      <NDataTable v-else :columns="domainColumns" :data="query.data.value.domains" :row-key="row => row.id" />
    </LsPanel>
    <LsPanel>
      <template #header><div><h2>已启用能力</h2><p>具有团队能力管理权限的平台管理员可开通、调整或续期</p></div></template>
      <LsEmptyState v-if="!query.data.value.abilities.length" title="没有额外能力" description="当前团队仅使用默认能力。" />
      <div v-else class="ability-list"><div v-for="ability in query.data.value.abilities" :key="ability.id"><strong>{{ ability.ability_key }}</strong><span>等级 {{ ability.level }} · {{ ability.expire_time ? formatTime(ability.expire_time) : '永久' }}</span></div></div>
    </LsPanel>
  </template>
  <ReasonDialog v-model:show="dialog" :title="action === 'ban' ? '封禁这个团队？' : '解封这个团队？'" :consequence="action === 'ban' ? '团队全部业务入口会立即不可用；成员账号及其他团队不受影响。' : '团队业务入口将重新开放。'" :action-label="action === 'ban' ? '封禁团队' : '解封团队'" :danger="action === 'ban'" :loading="mutation.isPending.value" @confirm="mutation.mutate" />
</template>

<style scoped>.ability-list{display:grid}.ability-list>div{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.ability-list>div:last-child{border-bottom:0}.ability-list span{color:var(--muted-ink);font-size:.8rem}</style>
