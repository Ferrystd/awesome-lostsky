import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import LsRadioGroupField from './components/LsRadioGroupField.vue'

describe('单选组字段封闭契约', () => {
  it('只接受语义参数并保留禁用、选择和标签关联', async () => {
    const component = LsRadioGroupField as any
    expect(Object.keys(component.props).sort()).toEqual(['disabled', 'hint', 'id', 'label', 'modelValue', 'options'])
    expect(component.props.disabled.default).toBe(false)
    expect(component.emits).toEqual(['update:modelValue'])
    const html = await renderToString(createSSRApp({ render: () => h(LsRadioGroupField, {
      id: 'search-priority', label: '搜索优先级', hint: '选择搜索规则', modelValue: 'team', disabled: true,
      options: [{ value: 'team', label: '团队优先', description: '团队规则生效' }, { value: 'member', label: '成员优先' }],
    }) }))
    expect(html).toContain('<fieldset')
    expect(html).toContain('aria-labelledby="search-priority-label"')
    expect(html).toContain('aria-describedby="search-priority-hint"')
    expect(html).toContain('团队规则生效')
    expect(html.match(/type="radio"/g)).toHaveLength(2)
    expect(html).toContain('n-radio--checked')
    expect(html).toContain('n-radio--disabled')
  })
})
