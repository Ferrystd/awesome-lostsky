import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { describe, expect, it } from 'vitest'
import LsPageLink from './components/LsPageLink.vue'

describe('page navigation link', () => {
  it('keeps route objects and query encoding through RouterLink', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/docs/new', component: { render: () => null } }] })
    await router.push('/docs/new')
    const app = createSSRApp({ render: () => h(LsPageLink, { to: { path: '/docs/new', query: { visibility: '4' } }, icon: ArrowLeft, label: '新建文档' }) })
    app.use(router)
    const html = await renderToString(app)
    expect(html).toContain('href="/docs/new?visibility=4"')
    expect(html).not.toContain('target=')
    expect(html).not.toContain('<button')
  })

  it('preserves native cross-app href and explicit browsing context without inventing a new window', async () => {
    const props = { href: 'https://chat.example/new?participant=customer-518', icon: ArrowLeft, label: '发起对话' }
    const html = await renderToString(createSSRApp({ render: () => h(LsPageLink, props) }))
    expect(html).toContain(`href="${props.href}"`)
    expect(html).not.toContain('target=')
    const blank = await renderToString(createSSRApp({ render: () => h(LsPageLink, { ...props, target: '_blank', rel: 'noopener noreferrer' }) }))
    expect(blank).toContain('target="_blank"')
    expect(blank).toContain('rel="noopener noreferrer"')
    expect(blank).toContain('aria-hidden="true"')
  })
})
