import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import LsFormPage from './components/LsFormPage.vue'

describe('LsFormPage closed presentation contract', () => {
  it('renders one heading, ordered slots and only the caller-owned form', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(LsFormPage, { title: '新建商品', description: '统一保存', class: 'forbidden', style: 'width:9999px' }, {
      actions: () => h('a', { href: '/products' }, '返回商品'),
      default: () => h('form', { id: 'business-form' }, '商品字段'),
      footer: () => h('button', { form: 'business-form', type: 'submit' }, '保存商品'),
    }) }))
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html.match(/<form/g)).toHaveLength(1)
    expect(html).toContain('form="business-form"')
    expect(html.indexOf('统一保存')).toBeLessThan(html.indexOf('商品字段'))
    expect(html.indexOf('商品字段')).toBeLessThan(html.indexOf('保存商品'))
    expect(html).not.toMatch(/forbidden|9999px|<main|<canvas/)
    expect(Object.keys(LsFormPage.props ?? {}).sort()).toEqual(['asideLabel', 'description', 'title'])
  })

  it('does not render empty optional action or footer regions', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(LsFormPage, { title: '表单' }) }))
    expect(html).not.toContain('ls-page-header__actions')
    expect(html).not.toContain('ls-form-page__footer')
    expect(html).not.toContain('<form')
  })
})
