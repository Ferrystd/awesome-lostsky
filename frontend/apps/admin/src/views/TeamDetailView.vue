<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NButton, NTag } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import ReasonDialog from '../components/ReasonDialog.vue'
import RetryState from '../components/RetryState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { can } from '../session'
import type { AuditEvent, TeamSummary } from '../types'
import { formatTime } from '../utils'
interface TeamDetail extends TeamSummary { domains:Array<{id:number;domain:string;app:string;create_time:number}>; abilities:Array<{id:number;ability_key:string;level:number;expire_time:number}>; audit_events:AuditEvent[] }
const route=useRoute(); const id=Number(route.params.id); const dialog=ref(false)
const query=useQuery({queryKey:['admin-team',id],queryFn:()=>api.get<TeamDetail>(`/teams/${id}`)})
const action=computed(()=>query.data.value?.is_banned?'unban':'ban')
const mutation=useMutation({mutationFn:(reason:string)=>api.post(`/teams/${id}/${action.value}`,{reason}),onSuccess:async()=>{feedback.success(action.value==='ban'?'团队已封禁':'团队已解封');dialog.value=false;await query.refetch()}})
</script>
<template>
  <PageHeader title="团队详情" description="查看平台层面的团队状态、域名和能力，不进入团队内部修改内容。" back="/teams"><NButton v-if="can('admin.team.moderate')&&query.data.value&&!query.data.value.is_cancelled" :type="query.data.value.is_banned?'primary':'error'" @click="dialog=true">{{ query.data.value.is_banned?'解封团队':'封禁团队' }}</NButton></PageHeader>
  <div v-if="query.isPending.value" class="panel state">正在读取团队详情…</div><RetryState v-else-if="query.isError.value" class="panel" :error="query.error.value" @retry="query.refetch()" />
  <template v-else-if="query.data.value">
    <section class="panel"><div class="panel-heading"><div><h2>{{ query.data.value.name||query.data.value.slug }}</h2><p>#{{ query.data.value.id }} · {{ query.data.value.slug }}</p></div><StatusBadge :status="query.data.value.is_cancelled?'cancelled':query.data.value.is_banned?'banned':'active'" /></div><dl class="definition-list"><dt>所有者</dt><dd>{{ query.data.value.owner_username||`用户 #${query.data.value.user_id}` }}</dd><dt>成员数量</dt><dd>{{ query.data.value.member_count }}</dd><dt>创建时间</dt><dd>{{ formatTime(query.data.value.create_time) }}</dd><dt>最近更新</dt><dd>{{ formatTime(query.data.value.update_time) }}</dd></dl></section>
    <section class="panel"><div class="panel-heading"><div><h2>域名绑定</h2><p>只读平台配置</p></div></div><div v-if="!query.data.value.domains.length" class="state">没有自定义域名</div><table v-else class="data-table"><thead><tr><th>域名</th><th>应用</th><th>创建时间</th></tr></thead><tbody><tr v-for="domain in query.data.value.domains" :key="domain.id"><td>{{ domain.domain }}</td><td><NTag size="small">{{ domain.app }}</NTag></td><td>{{ formatTime(domain.create_time) }}</td></tr></tbody></table></section>
    <section class="panel"><div class="panel-heading"><div><h2>已启用能力</h2><p>能力仅展示，不在 Admin 首版调整</p></div></div><div v-if="!query.data.value.abilities.length" class="state">没有额外能力</div><div v-else class="ability-list"><div v-for="ability in query.data.value.abilities" :key="ability.id"><strong>{{ ability.ability_key }}</strong><span>等级 {{ ability.level }} · {{ ability.expire_time?formatTime(ability.expire_time):'永久' }}</span></div></div></section>
  </template>
  <ReasonDialog v-model:show="dialog" :title="action==='ban'?'封禁这个团队？':'解封这个团队？'" :consequence="action==='ban'?'团队全部业务入口会立即不可用；成员账号及其他团队不受影响。':'团队业务入口将重新开放。'" :action-label="action==='ban'?'封禁团队':'解封团队'" :danger="action==='ban'" :loading="mutation.isPending.value" @confirm="mutation.mutate" />
</template>
<style scoped>.ability-list{display:grid}.ability-list>div{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line)}.ability-list>div:last-child{border-bottom:0}.ability-list span{color:var(--muted-ink);font-size:.8rem}</style>
