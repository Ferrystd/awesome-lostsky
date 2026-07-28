<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { ChevronRight, FileText, Plus } from '@lucide/vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

type EntityType = 'entity' | 'customer' | 'virtual'
interface EntityField {
  id: number
  entity_type: EntityType
  field_key: string
  name: string
  value_type: string
  input_type: string
  is_required: number
  is_visible: number
}
const type = ref<EntityType>('entity')
const fields = useQuery({
  queryKey: computed(() => ['entity-fields', type.value]),
  queryFn: () => api.get<EntityField[]>('/entityField/index', { entity_type: type.value }),
})
const labels: Record<EntityType, string> = { entity: '人员', customer: '客户', virtual: '虚拟实体' }
</script>

<template>
  <div class="fields-page">
    <AdminPageHeader title="对象字段" description="统一定义人员、客户和虚拟实体的团队内部业务资料；客户公开资料仍由客户本人维护。">
      <template #actions><RouterLink :to="{ path: '/field-new', query: { type } }"><LsButton><Plus :size="16" />创建字段</LsButton></RouterLink></template>
    </AdminPageHeader>
    <div class="tabs" role="tablist" aria-label="对象类型">
      <button v-for="item in (['entity','customer','virtual'] as EntityType[])" :key="item" type="button" role="tab" :aria-selected="type === item" @click="type = item">{{ labels[item] }}</button>
    </div>
    <p v-if="fields.isError.value" class="state error" role="alert">{{ friendlyError(fields.error.value) }}</p>
    <div v-else-if="fields.data.value?.length" class="field-list">
      <RouterLink v-for="field in fields.data.value" :key="field.id" :to="{ path: '/field-edit', query: { id: field.id } }">
        <span class="field-icon"><FileText :size="20" /></span>
        <div><strong>{{ field.name }}</strong><small>{{ field.field_key }} · {{ field.value_type }} / {{ field.input_type }}</small></div>
        <span v-if="field.is_required" class="required">必填</span><ChevronRight :size="18" />
      </RouterLink>
    </div>
    <div v-else class="state"><FileText :size="32" /><h3>还没有{{ labels[type] }}字段</h3><p>字段值只在团队内部使用，不会自动成为公开资料。</p></div>
  </div>
</template>

<style scoped>
.fields-page{display:grid;gap:1rem}.tabs{width:fit-content;display:flex;padding:3px;background:white;border:1px solid var(--line);border-radius:10px}.tabs button{min-height:40px;padding:0 .9rem;color:var(--muted-ink);background:transparent;border:0;border-radius:8px}.tabs button[aria-selected=true]{color:white;background:var(--sky-lost-strong)}.field-list{display:grid;gap:.55rem}.field-list>a{min-height:72px;display:grid;grid-template-columns:42px minmax(0,1fr) auto 22px;align-items:center;gap:.7rem;padding:.75rem;background:white;border:1px solid var(--line);border-radius:10px}.field-list>a:hover{border-color:var(--sky-lost)}.field-icon{width:42px;height:42px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border-radius:9px}.field-list strong,.field-list small{display:block}.field-list small{color:var(--muted-ink)}.required{padding:.12rem .42rem;color:var(--warning);background:color-mix(in oklch,var(--warning),white 92%);border-radius:999px;font-size:.68rem}.state{display:grid;justify-items:center;gap:.35rem;padding:2rem;text-align:center;background:white;border:1px solid var(--line);border-radius:12px}.state h3,.state p{margin:0}.state p{color:var(--muted-ink)}.state.error{color:var(--danger)}@media(max-width:520px){.tabs{width:100%}.tabs button{flex:1}.field-list>a{grid-template-columns:42px minmax(0,1fr) 20px}.required{display:none}}
</style>
