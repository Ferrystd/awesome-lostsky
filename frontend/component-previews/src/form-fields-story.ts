import { h } from 'vue'
import { NInput, NSelect } from 'naive-ui'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import type { PreviewState, StoryDefinition } from './story-types'

function fields(state: PreviewState) {
  return h(LsFormFields, null, { default: () => [
    h(LsField, { label: '公开称号', forId: `form-name-${state}`, required: true, error: state === 'error' ? '请填写公开称号' : '', hint: '用于团队内展示。' }, { default: () => h(NInput, { inputProps: { id: `form-name-${state}` }, value: state === 'error' ? '' : '晚风小栖', disabled: state === 'disabled' }) }),
    h(LsField, { label: '常用服务时段', forId: `form-period-${state}` }, { default: () => h(NSelect, { id: `form-period-${state}`, value: 'evening', options: [{ label: '晚间', value: 'evening' }], loading: state === 'loading', disabled: state === 'disabled' }) }),
    h(LsSwitchField, { label: '接受预约', description: '允许顾客预约后续服务。', modelValue: state === 'active', disabled: state === 'disabled', loading: state === 'loading' }),
  ] })
}

export const formFieldsStories: Record<string, StoryDefinition> = {
  LsFormFields: { name: 'LsFormFields', desktopWidth: 720, supported: ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'mobile'], render: fields },
  LsFormContent: {
    name: 'LsFormContent', desktopWidth: 720, supported: ['default', 'mobile'],
    reason: { hover: '内容区没有悬停状态。', focus: '焦点由内容控件持有。', active: '内容区没有选中态。', disabled: '禁用由内容控件持有。', loading: '加载由业务内容持有。', error: '错误由业务内容持有。' },
    render: state => h(LsFormFields, null, { default: () => h(LsFormContent, { title: '详细介绍', description: '完整内容使用上下结构。' }, { default: () => h(LsField, { label: '介绍正文', forId: `form-content-${state}` }, { default: () => h(NInput, { inputProps: { id: `form-content-${state}` }, type: 'textarea', value: '介绍服务内容、预约条件与团队协作方式。', autosize: { minRows: 4 } }) }) }) }),
  },
}
