<script setup lang="ts">
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { FileText, Plus, ArrowLeft } from '@lucide/vue'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { inputTypeLabel, valueTypeLabel } from '../lib/joinFields'

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
const routeAccess = useRouteAccess()
const fields = useQuery({
  queryKey: computed(() => ['entity-fields', type.value]),
  queryFn: () => api.get<EntityField[]>('/entityField/index', { entity_type: type.value }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const labels: Record<EntityType, string> = { entity: '人员', customer: '顾客', virtual: '虚拟人员' }
const typeOptions = Object.entries(labels).map(([value, label]) => ({ value, label }))
const visibleFields = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return (fields.data.value ?? []).filter(field => !keyword || `${field.name} ${field.field_key}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
  <div class="fields-page">
    <LsCollectionPage title="对象字段" description="在业务流程中，创建自定义字段以为不同人员存储业务所需数据。">
      <template #actions>
        <LsPageLink to="/entities" label="返回人员" :icon="ArrowLeft" />
        <LsPageLink :icon="Plus" label="创建字段" :to="{ path: '/field-new', query: { type } }" />
      </template>
      <template #toolbar>
        <LsListToolbar v-model="search" placeholder="搜索字段名称或标识" aria-label="搜索对象字段" :count-label="routeAccess.restricted.value ? '0 个字段' : `${visibleFields.length} 个字段`">
          <template #filters>
            <NSelect v-model:value="type" :options="typeOptions" aria-label="对象类型" />
          </template>
        </LsListToolbar>
      </template>
      <LsAsyncState v-if="!routeAccess.restricted.value && fields.isError.value" state="error" title="暂时无法读取对象字段" :description="friendlyError(fields.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && fields.isPending.value" state="loading" :rows="4" />
      <LsResourceList v-else-if="visibleFields.length" aria-label="对象字段列表">
        <LsResourceRow v-for="field in visibleFields" :key="field.id" :title="field.name" :to="{ path: '/field-edit', query: { id: field.id } }" :icon="FileText" :description="`${valueTypeLabel(field.value_type)} / ${inputTypeLabel(field.input_type)}`">
          <template #status>
            <LsStatusTag v-if="field.is_required" label="必填" type="warning" />
          </template>
          <template #metadata>
            <span>{{ field.field_key }}</span>
          </template>
        </LsResourceRow>
      </LsResourceList>
      <LsEmptyState v-else :source="fields.data.value" :title="routeAccess.restricted.value ? `没有可显示的${labels[type]}字段` : `还没有${labels[type]}字段`" description="暂无字段，请先添加。" />
    </LsCollectionPage>
  </div>
</template>
