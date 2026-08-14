<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsSwitch from '@lostsky/ui/components/LsSwitch.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NSelect } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { productManagement, type ProductManagementScope } from '../lib'

type Field = {
  key: string
  id?: number
  field_key: string
  name: string
  value_type: string
  input_type: string
  options_text: string
  fill_stage: 'customer' | 'manager'
  is_customer_visible: number
  is_required: number
  is_active: number
  sort: number
}

const props = defineProps<{
  productId: number
  scope: ProductManagementScope
  expectedEntityId?: number
}>()

let seq = 0
const make = (): Field => ({
  key: `new-${++seq}`,
  field_key: '',
  name: '',
  value_type: 'string',
  input_type: 'text',
  options_text: '',
  fill_stage: 'customer',
  is_customer_visible: 1,
  is_required: 0,
  is_active: 1,
  sort: 0,
})

const management = computed(() => productManagement(props.scope))
const client = useQueryClient()
const fields = ref<Field[]>([])
const savedIds = ref<number[]>([])
const query = useQuery({
  queryKey: computed(() => ['product-fields', props.scope, props.productId]),
  queryFn: () => management.value.productFields(props.productId),
})

watch(
  () => query.data.value,
  data => {
    if (!data) return
    fields.value = data.map((field: any) => ({
      key: `field-${field.id}`,
      id: field.id,
      field_key: field.field_key,
      name: field.name,
      value_type: field.value_type,
      input_type: field.input_type,
      options_text: Array.isArray(field.options) ? field.options.join('\n') : '',
      fill_stage: field.fill_stage,
      is_customer_visible: field.is_customer_visible,
      is_required: field.is_required,
      is_active: field.is_active,
      sort: field.sort,
    }))
    savedIds.value = data.map((field: any) => Number(field.id))
  },
  { immediate: true },
)

const mutation = useMutation({
  mutationFn: async () => {
    const currentIds = new Set(fields.value.flatMap(field => field.id ? [field.id] : []))
    for (const fieldId of savedIds.value) {
      if (!currentIds.has(fieldId)) {
        await management.value.deleteProductField(props.productId, fieldId, props.expectedEntityId)
      }
    }
    for (let index = 0; index < fields.value.length; index++) {
      const field = fields.value[index]
      await management.value.saveProductField(props.productId, field.id ?? null, {
        field_key: field.field_key,
        name: field.name,
        value_type: field.value_type,
        input_type: field.input_type,
        options: field.options_text.split(/\r?\n|,/).map(value => value.trim()).filter(Boolean),
        fill_stage: field.fill_stage,
        is_customer_visible: field.is_customer_visible,
        is_required: field.is_required,
        is_active: field.is_active,
        sort: index,
      }, props.expectedEntityId)
    }
  },
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['product-fields', props.scope, props.productId] })
  },
})

const valueTypes = [
  { label: '短文本', value: 'string' },
  { label: '长文本', value: 'text' },
  { label: '整数', value: 'int' },
  { label: '小数', value: 'decimal' },
  { label: '日期', value: 'date' },
  { label: '日期时间', value: 'datetime' },
  { label: '单选', value: 'select' },
  { label: '多选', value: 'multi_select' },
  { label: '是/否', value: 'bool' },
]
const inputTypes = [
  { label: '单行输入', value: 'text' },
  { label: '多行输入', value: 'textarea' },
  { label: '下拉选择', value: 'select' },
  { label: '单选项', value: 'radio' },
  { label: '复选项', value: 'checkbox' },
]

async function save() {
  if (query.isPending.value) await query.refetch()
  if (query.isError.value) throw query.error.value
  await mutation.mutateAsync()
}

defineExpose({ save })
</script>

<template>
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="4" />
  <LsAsyncState
    v-else-if="query.isError.value"
    state="error"
    title="暂时无法读取核销字段"
    :description="friendlyError(query.error.value)"
  />
  <template v-else>
    <LsFormSection title="核销字段" description="客户字段在发起时填写，管理字段在确认完成时填写；停用不会删除历史值。">
      <LsFormList v-model="fields" :item-key="field => field.key" :create-item="make" item-label="字段" add-label="添加核销字段">
        <template #item="{ item }">
          <div class="field-editor">
            <div class="inline-fields">
              <LsField label="字段标识" :for-id="`field-key-${item.key}`" required>
                <NInput :id="`field-key-${item.key}`" v-model:value="item.field_key" :disabled="Boolean(item.id)" placeholder="例如 account_name" />
              </LsField>
              <LsField label="显示名称" :for-id="`field-name-${item.key}`" required>
                <NInput :id="`field-name-${item.key}`" v-model:value="item.name" />
              </LsField>
              <LsField label="数据类型" :for-id="`field-type-${item.key}`">
                <NSelect :id="`field-type-${item.key}`" v-model:value="item.value_type" :options="valueTypes" />
              </LsField>
              <LsField label="输入控件" :for-id="`field-input-${item.key}`">
                <NSelect :id="`field-input-${item.key}`" v-model:value="item.input_type" :options="inputTypes" />
              </LsField>
              <LsField label="填写阶段" :for-id="`field-stage-${item.key}`">
                <NSelect :id="`field-stage-${item.key}`" v-model:value="item.fill_stage" :options="[{ label: '客户发起时', value: 'customer' }, { label: '管理确认时', value: 'manager' }]" />
              </LsField>
            </div>
            <LsField
              v-if="['select', 'multi_select'].includes(item.value_type) || ['select', 'radio', 'checkbox'].includes(item.input_type)"
              label="选项"
              :for-id="`field-options-${item.key}`"
              hint="每行一个选项"
            >
              <NInput :id="`field-options-${item.key}`" v-model:value="item.options_text" type="textarea" />
            </LsField>
            <div class="boolean-controls">
              <label><LsSwitch :model-value="item.is_required === 1" @update:model-value="value => item.is_required = value ? 1 : 0" />必填</label>
              <label><LsSwitch :model-value="item.is_customer_visible === 1" @update:model-value="value => item.is_customer_visible = value ? 1 : 0" />Customer 可见</label>
              <label><LsSwitch :model-value="item.is_active === 1" @update:model-value="value => item.is_active = value ? 1 : 0" />启用</label>
            </div>
          </div>
        </template>
      </LsFormList>
    </LsFormSection>
  </template>
</template>
