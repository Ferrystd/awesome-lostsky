import { createSSRApp, h, Teleport } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import LsField from './components/LsField.vue'
import LsSwitchField from './components/LsSwitchField.vue'
import LsFormFields from './components/LsFormFields.vue'
import LsFormContent from './components/LsFormContent.vue'

const field = (props = {}) => h(LsField, { label: '名称', forId: 'name', ...props }, { default: () => h('input', { id: 'name' }) })
const render = (node: ReturnType<typeof h>, context = {}) => renderToString(createSSRApp({ render: () => node }), context)

describe('任务表单字段上下文', () => {
  it('未接入的调用保持上下字段，集合仅影响其后代', async () => {
    const plain = await render(field())
    const grouped = await render(h(LsFormFields, null, { default: () => field() }))
    expect(plain).not.toContain('ls-form-field-layout')
    expect(grouped).toContain('ls-form-field-layout__label')
    expect(grouped).toContain('for="name"')
    expect(LsFormFields.props).toBeUndefined()
    expect(LsFormFields.inheritAttrs).toBe(false)
  })

  it('复杂内容关闭继承的字段布局，不影响后续普通字段', async () => {
    const html = await render(h(LsFormFields, null, { default: () => [h(LsFormContent, null, { default: () => field() }), field({ forId: 'next' })] }))
    expect(html.match(/class="ls-form-field-layout"/g)).toHaveLength(1)
    expect(html).toContain('ls-form-content')
  })

  it('错误取代提示，标签辅助说明与只读值保持关联', async () => {
    const html = await render(h(LsFormFields, null, { default: () => field({ readOnly: true, description: '长文本', error: '请填写名称', hint: '不会重复显示' }) }))
    expect(html).toContain('aria-labelledby="name-label"')
    expect(html).toContain('role="group"')
    expect(html).toContain('role="alert"')
    expect(html).toContain('长文本')
    expect(html).not.toContain('不会重复显示')
  })

  it('提示与错误的稳定关联交给实际控件，错误优先且移除后不留悬空引用', async () => {
    for (const props of [{ hint: '说明' }, { hint: '说明', error: '错误' }, {}]) {
      const html = await render(h(LsFormFields, null, { default: () => h(LsField, { label: '名称', forId: 'name', ...props }, { default: ({ describedBy, invalid }: { describedBy?: string; invalid: boolean }) => h('input', { id: 'name', 'aria-describedby': describedBy, 'aria-invalid': invalid }) }) }))
      if (props.hint || props.error) { expect(html).toContain('aria-describedby="name-feedback"'); expect(html).toContain('id="name-feedback"') }
      else expect(html).not.toContain('name-feedback')
      if (props.error) { expect(html).toContain('aria-invalid="true"'); expect(html).not.toContain('>说明<') }
    }
  })

  it('开关使用同一行视觉所有者，默认设置行保持原契约', async () => {
    const props = { label: '允许预约', modelValue: false, description: '允许成员接收预约', disabled: true, disabledReason: '只读' }
    const plain = await render(h(LsSwitchField, props))
    const html = await render(h(LsFormFields, null, { default: () => h(LsSwitchField, props) }))
    expect(plain).toContain('class="ls-switch-field"')
    expect(plain).not.toContain('ls-form-field-layout')
    expect(html).toContain('ls-form-field-layout')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('允许成员接收预约')
  })

  it('组件上下文跨 Teleport，行响应式只依据容器且不暴露视觉参数', async () => {
    const context: { teleports?: Record<string, string> } = {}
    await render(h(LsFormFields, null, { default: () => h(Teleport, { to: '#modal' }, [field()]) }), context)
    expect(context.teleports?.['#modal']).toContain('ls-form-field-layout')
    const layout = readFileSync(new URL('./components/internal/FormFieldLayout.vue', import.meta.url), 'utf8')
    expect(layout).toContain('@container ls-form-field (min-width: 36rem)')
    expect(layout).not.toContain('@media')
    expect(layout).not.toContain('defineProps')
  })
})
