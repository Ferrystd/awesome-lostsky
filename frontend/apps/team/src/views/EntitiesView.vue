<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { NSelect, NSpin } from 'naive-ui'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

type Entity = { id: number; slug: string; entityable_type: string; profile?: { name?: string; avatar?: string } }
const type = ref<string | null>(null)
const query = useQuery({ queryKey: computed(() => ['entities', type.value]), queryFn: () => api.get<{ list: Entity[] }>('/entity/index', { type: type.value || undefined, limit: 100 }) })
const labels: Record<string, string> = { team: '团队', teamMember: '成员', teamCustomer: '客户', teamVirtual: '虚拟实体' }
const options = [{ label: '全部实体', value: '' }, ...Object.entries(labels).map(([value, label]) => ({ label, value }))]
</script>
<template>
  <div class="entities-view">
    <AdminPageHeader title="实体" description="按类型查看并管理团队、成员、客户与虚拟实体的公开资料。" />
    <label class="filter"><span>实体类型</span><NSelect v-model:value="type" :options="options" clearable /></label>
    <NSpin v-if="query.isPending.value" size="large" />
    <p v-else-if="query.isError.value" class="feedback" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else class="entity-list">
      <RouterLink v-for="entity in query.data.value?.list ?? []" :key="entity.id" :to="{ path: '/entity', query: { id: entity.id } }" class="entity-row">
        <span class="avatar">{{ entity.profile?.name?.slice(0, 1) || '—' }}</span><span><strong>{{ entity.profile?.name || '未命名实体' }}</strong><small>{{ labels[entity.entityable_type] }} · @{{ entity.slug }}</small></span><span>管理</span>
      </RouterLink>
      <p v-if="!(query.data.value?.list?.length)" class="empty">当前筛选下没有实体。</p>
    </div>
  </div>
</template>
<style scoped>
.entities-view{display:grid;gap:22px}.filter{display:grid;gap:7px;max-width:22rem}.filter span{font-size:.875rem;font-weight:650;color:var(--text-secondary)}.entity-list{display:grid;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--surface)}.entity-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;min-height:68px;padding:12px 16px;color:inherit;text-decoration:none;border-bottom:1px solid var(--border)}.entity-row:last-child{border-bottom:0}.entity-row:hover{background:var(--surface-subtle)}.entity-row strong,.entity-row small{display:block}.entity-row small{margin-top:3px;color:var(--text-secondary)}.entity-row>span:last-child{color:var(--primary);font-size:.875rem;font-weight:650}.avatar{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--surface-subtle);color:var(--primary);font-weight:700}.feedback{color:var(--danger)}.empty{padding:28px 16px;margin:0;color:var(--text-secondary)}
</style>
