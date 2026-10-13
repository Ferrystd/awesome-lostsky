import { h } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import type { StoryDefinition } from './story-types'

export const formPageStory: StoryDefinition = {
  name: 'LsFormPage',
  supported: ['default', 'mobile'],
  reason: {
    hover: '模板没有独立悬停态，操作由插槽内组件持有。',
    focus: '模板不接管业务控件焦点。',
    active: '模板没有选中状态。',
    disabled: '权限与只读状态由业务表单持有。',
    loading: '异步状态由页面在正文中表达。',
    error: '错误与空状态由页面在正文中表达。',
  },
  render: () => h(LsFormPage, { title: '新建商品', description: '填写商品资料后统一保存。' }, {
    actions: () => h(LsPageLink, { to: '/manage/products', icon: ArrowLeft, label: '返回商品' }),
    default: () => h('form', { id: 'preview-product-form', onSubmit: (event: Event) => event.preventDefault() }, [
      h(LsFormSection, { title: '基本信息' }, { default: () => [
        h(LsField, { label: '商品名称', forId: 'preview-product-name', required: true }, { default: () => h(LsInput, { id: 'preview-product-name', modelValue: '语音陪伴' }) }),
        h(LsField, { label: '简短说明', forId: 'preview-product-description' }, { default: () => h(LsInput, { id: 'preview-product-description', modelValue: '按约定时间提供服务' }) }),
      ] }),
    ]),
    footer: () => h(LsFormActions, null, { default: () => [h(LsButton, { variant: 'secondary' }, { default: () => '取消' }), h(LsButton, { type: 'submit', form: 'preview-product-form' }, { default: () => '保存商品' })] }),
  }),
}
