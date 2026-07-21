<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { Bot, ChevronRight, Plus, Webhook } from '@lucide/vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface Integration { id: number; name: string; is_active: number }
interface VirtualEntity {
  slug: string
  name: string
  description: string | null
  avatar: string | null
  is_active: number
  integrations?: Integration[]
}
const virtuals = useQuery({ queryKey: ['chat-virtuals'], queryFn: () => api.get<VirtualEntity[]>('/chatVirtual/index') })
</script>

<template>
  <div class="virtual-list-page">
    <AdminPageHeader title="虚拟实体" description="以同一套通用能力承载人工代操作、Webhook，以及未来的 LLM 或工作流。">
      <template #actions><RouterLink to="/chat-virtual-new"><LsButton><Plus :size="17" />创建虚拟实体</LsButton></RouterLink></template>
    </AdminPageHeader>
    <p v-if="virtuals.isError.value" class="state error" role="alert">{{ friendlyError(virtuals.error.value) }}</p>
    <div v-else-if="virtuals.data.value?.length" class="virtual-grid">
      <RouterLink v-for="item in virtuals.data.value" :key="item.slug" :to="{ path: '/chat-virtual', query: { slug: item.slug } }">
        <span class="icon"><Bot :size="24" /></span>
        <div>
          <header><strong>{{ item.name }}</strong><span :class="{ inactive: !item.is_active }">{{ item.is_active ? '启用' : '停用' }}</span></header>
          <small>@{{ item.slug }}</small>
          <p>{{ item.description || '还没有简介。' }}</p>
          <footer><span><Webhook :size="14" />{{ item.integrations?.length ?? 0 }} 个集成</span><ChevronRight :size="18" /></footer>
        </div>
      </RouterLink>
    </div>
    <div v-else class="state empty"><Bot :size="34" /><h3>还没有虚拟实体</h3><p>创建后再通过角色授予全局或指定 slug 的管理、操作与字段权限。</p></div>
  </div>
</template>

<style scoped>
.virtual-list-page{display:grid;gap:1.25rem}.virtual-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr));gap:.8rem}.virtual-grid>a{min-width:0;display:grid;grid-template-columns:48px minmax(0,1fr);gap:.85rem;padding:1rem;background:white;border:1px solid var(--line);border-radius:12px;transition:border-color .18s,transform .18s}.virtual-grid>a:hover{transform:translateY(-2px);border-color:var(--sky-lost)}.icon{width:48px;height:48px;display:grid;place-items:center;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 88%);border-radius:12px}.virtual-grid header,.virtual-grid footer{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.virtual-grid header span{padding:.12rem .45rem;color:var(--success);background:color-mix(in oklch,var(--success),white 91%);border-radius:999px;font-size:.67rem}.virtual-grid header span.inactive{color:var(--muted-ink);background:var(--cloud)}.virtual-grid small{color:var(--sky-lost-strong)}.virtual-grid p{min-height:2.8rem;margin:.45rem 0;color:var(--muted-ink);font-size:.8rem}.virtual-grid footer{color:var(--muted-ink);font-size:.72rem}.virtual-grid footer span{display:flex;align-items:center;gap:.3rem}.state{padding:2rem;text-align:center;background:white;border:1px solid var(--line);border-radius:12px}.state.error{color:var(--danger)}.empty{display:grid;justify-items:center;gap:.35rem}.empty h3,.empty p{margin:0}.empty p{max-width:32rem;color:var(--muted-ink)}
</style>
