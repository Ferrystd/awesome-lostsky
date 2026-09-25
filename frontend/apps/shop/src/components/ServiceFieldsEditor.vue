<script setup lang="ts">
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsSwitch from '@lostsky/ui/components/LsSwitch.vue'
import { NInput, NSelect } from 'naive-ui'
import { watch } from 'vue'
import { createServiceRedemptionFieldDraft } from '../service-redemption-fields'
import type { ServiceRedemptionFieldDraft } from '../types'

const fields = defineModel<ServiceRedemptionFieldDraft[]>({ required: true })
withDefaults(defineProps<{ purpose?: 'redemption' | 'purchase' }>(), { purpose: 'redemption' })

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
  { label: '图片', value: 'image' },
]
const inputTypes = [
  { label: '单行输入', value: 'text' },
  { label: '多行输入', value: 'textarea' },
  { label: '下拉选择', value: 'select' },
  { label: '单选项', value: 'radio' },
  { label: '复选项', value: 'checkbox' },
  { label: '图片上传', value: 'upload' },
]

watch(fields, items => {
  items.forEach(item => {
    if (item.value_type === 'image') item.input_type = 'upload'
  })
}, { deep: true })
</script>

<template>
  <LsFormSection :title="purpose === 'purchase' ? '购买资料' : '核销字段'" :description="purpose === 'purchase' ? '购买当前商品或规格时填写，每笔订单一份。修改字段不会改变历史订单资料。' : '字段只属于当前服务；顾客字段在发起时填写，核销字段在接单人确认已核销时填写。停用不会删除历史值。'">
    <LsFormList v-model="fields" :item-key="field => field.key" :create-item="createServiceRedemptionFieldDraft" item-label="字段" :add-label="purpose === 'purchase' ? '添加购买字段' : '添加核销字段'">
      <template #item="{ item }">
        <div class="field-editor">
          <div class="inline-fields">
            <LsField label="字段名称" :for-id="`field-name-${item.key}`" required>
              <NInput :id="`field-name-${item.key}`" v-model:value="item.name" />
            </LsField>
            <LsField label="数据类型" :for-id="`field-type-${item.key}`">
              <NSelect :id="`field-type-${item.key}`" v-model:value="item.value_type" :options="valueTypes" />
            </LsField>
            <LsField label="输入控件" :for-id="`field-input-${item.key}`">
              <NSelect :id="`field-input-${item.key}`" v-model:value="item.input_type" :options="inputTypes" :disabled="item.value_type === 'image'" />
            </LsField>
            <LsField v-if="purpose !== 'purchase'" label="填写阶段" :for-id="`field-stage-${item.key}`">
              <NSelect :id="`field-stage-${item.key}`" v-model:value="item.fill_stage" :options="[{ label: '顾客发起时', value: 'customer' }, { label: '核销接单时', value: 'manager' }]" />
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
            <label v-if="purpose !== 'purchase'"><LsSwitch :model-value="item.is_customer_visible === 1" @update:model-value="value => item.is_customer_visible = value ? 1 : 0" />顾客可见</label>
            <label v-if="purpose !== 'purchase'"><LsSwitch :model-value="item.is_active === 1" @update:model-value="value => item.is_active = value ? 1 : 0" />启用</label>
          </div>
        </div>
      </template>
    </LsFormList>
  </LsFormSection>
</template>
