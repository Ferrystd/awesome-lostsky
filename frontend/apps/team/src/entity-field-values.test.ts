import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import LsFormPage from '../../../packages/ui/src/components/LsFormPage.vue'
import { formatFieldValue } from './lib/entityFieldValues'

describe('object field values', () => {
  it('keeps zero and false and renders structured values without object coercion', () => {
    expect(formatFieldValue(0, 'int')).toBe('0')
    expect(formatFieldValue(false, 'bool')).toBe('否')
    expect(formatFieldValue('0', 'bool')).toBe('否')
    expect(formatFieldValue(1, 'bool')).toBe('是')
    expect(formatFieldValue(['甲', '乙'], 'multi_select')).toBe('甲、乙')
    expect(formatFieldValue({ count: 0, enabled: false }, 'json')).toBe('{\n  "count": 0,\n  "enabled": false\n}')
    expect(formatFieldValue('0.00', 'decimal')).toBe('0.00')
    expect(formatFieldValue(0, 'date')).toContain('1970')
  })
  it('keeps forms without an aside unchanged and exposes a named optional aside', async () => {
    const plain = await renderToString(createSSRApp({ render: () => h(LsFormPage, { title: '配置' }, { default: () => h('form', '表单'), footer: () => '页尾' }) }))
    expect(plain).not.toContain('<aside')
    expect(plain).not.toContain('ls-form-page__columns')
    expect(plain).toContain('页尾')
    const aside = await renderToString(createSSRApp({ render: () => h(LsFormPage, { title: '配置', asideLabel: '人员值' }, { default: () => '表单', aside: () => '人员内容' }) }))
    expect(aside).toContain('<aside')
    expect(aside).toContain('aria-label="人员值"')
    expect(aside).toContain('人员内容')
  })
})
