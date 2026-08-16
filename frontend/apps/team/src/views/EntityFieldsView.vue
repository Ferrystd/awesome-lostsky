<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import { useQuery } from '@tanstack/vue-query'
import { ChevronRight, FileText, Plus } from '@lucide/vue'
import { NRadioButton, NRadioGroup, NTag } from 'naive-ui'
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
}
const type = ref<EntityType>('entity')
const search = ref('')
const fields = useQuery({
  queryKey: computed(() => ['entity-fields', type.value]),
  queryFn: () => api.get<EntityField[]>('/entityField/index', { entity_type: type.value }),
})
const labels: Record<EntityType, string> = { entity: '人员', customer: '顾客', virtual: '虚拟实体' }
const visibleFields = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return (fields.data.value ?? []).filter(field => !keyword || `${field.name} ${field.field_key}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
  <div class="fields-page">
    <AdminPageHeader title="对象字段" description="统一定义人员、顾客和虚拟实体（Virtual Entity）的团队内部业务资料；顾客公开资料仍由顾客本人维护。">
      <template #actions><LsPagePrimaryAction :icon="Plus" label="创建字段" :to="{ path: '/field-new', query: { type } }" /></template>
    </AdminPageHeader>
    <LsListToolbar v-model="search" placeholder="搜索字段名称或标识" aria-label="搜索对象字段" :count-label="`${visibleFields.length} 个字段`"><template #filters><NRadioGroup v-model:value="type" class="tabs" name="entity-field-type" aria-label="对象类型"><NRadioButton v-for="item in (['entity','customer','virtual'] as EntityType[])" :key="item" :value="item">{{ labels[item] }}</NRadioButton></NRadioGroup></template></LsListToolbar>
    <p v-if="fields.isError.value" class="state error" role="alert">{{ friendlyError(fields.error.value) }}</p>
    <div v-else-if="visibleFields.length" class="field-list">
      <RouterLink v-for="field in visibleFields" :key="field.id" :to="{ path: '/field-edit', query: { id: field.id } }">
        <span class="field-icon"><FileText :size="20" /></span>
        <div><strong>{{ field.name }}</strong><small>{{ field.field_key }} · {{ field.value_type }} / {{ field.input_type }}</small></div>
        <NTag v-if="field.is_required" type="warning" size="small" :bordered="false">必填</NTag><ChevronRight :size="18" />
      </RouterLink>
    </div>
    <LsEmptyState v-else :title="`还没有${labels[type]}字段`" description="字段值只在团队内部使用，不会自动成为公开资料。" />
  </div>
</template>

<style scoped>
.fields-page{display:grid;gap:1rem}.tabs{width:fit-content}.tabs :deep(.n-radio-button){min-height:40px;display:inline-flex;align-items:center}.field-list{display:grid;overflow:hidden;background:white;border:1px solid var(--line);border-radius:12px}.field-list>a{min-height:72px;display:grid;grid-template-columns:42px minmax(0,1fr) auto 22px;align-items:center;gap:.7rem;padding:.75rem;background:white;border-bottom:1px solid var(--line);transition:background-color var(--motion-fast) var(--ease-standard)}.field-list>a:last-child{border-bottom:0}.field-list>a:hover{background:var(--cloud)}.field-icon{width:42px;height:42px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--cloud);border-radius:9px}.field-list strong,.field-list small{display:block}.field-list small{color:var(--muted-ink)}.state{display:grid;justify-items:center;gap:.35rem;padding:2rem;text-align:center;background:white;border:1px solid var(--line);border-radius:12px}.state h3,.state p{margin:0}.state p{color:var(--muted-ink)}.state.error{color:var(--danger)}@media(max-width:520px){.tabs{width:100%}.tabs :deep(.n-radio-button){flex:1}.field-list>a{grid-template-columns:42px minmax(0,1fr) 20px}.field-list :deep(.n-tag){display:none}}
</style>
