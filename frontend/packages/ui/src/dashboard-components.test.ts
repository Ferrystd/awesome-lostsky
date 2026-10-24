import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import { House } from '@lucide/vue'
import LsDashboardPath from './components/LsDashboardPath.vue'
import LsWorkspaceOverview from './components/LsWorkspaceOverview.vue'
import LsMetricGrid from './components/LsMetricGrid.vue'

async function render(component: Parameters<typeof h>[0], props: Record<string, unknown>, slots = {}) {
  const app = createSSRApp({ render: () => h(component, props, slots) })
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  app.use(router)
  await router.push('/')
  await router.isReady()
  return renderToString(app)
}

describe('概览组合契约', () => {
  it('路径只接收业务信息，按业务顺序保留真实导航', async () => {
    expect(Object.keys((LsDashboardPath as unknown as { props: object }).props).sort()).toEqual(['description', 'steps', 'title'])
    const html = await render(LsDashboardPath, { title: '配置链', description: '业务顺序', steps: [
      { key: 'services', label: '服务', description: '定义服务', to: '/manage/services', icon: House },
      { key: 'products', label: '商品', description: '维护商品', to: '/manage/products', icon: House },
    ] })
    expect(html).toMatch(/<ol(?:\s[^>]*)?>/)
    expect(html).toContain('href="/manage/services"')
    expect(html.indexOf('href="/manage/services"')).toBeLessThan(html.indexOf('href="/manage/products"'))
    expect(html).not.toContain('aria-disabled')
  })
  it('工作区与统计插槽可组合，未使用插槽的原入口继续渲染', async () => {
    const props = { eyebrow: '工作台', title: '当前团队', description: '工作摘要', actions: [], entries: [{ key: 'home', label: '原入口', description: '原入口说明', to: '/home', icon: House }] }
    const original = await render(LsWorkspaceOverview, props)
    expect(original).toContain('href="/home"')
    const composed = await render(LsWorkspaceOverview, props, {
      summary: () => h(LsMetricGrid, { items: [{ key: 'restricted', label: '受限值', value: '-' }, { key: 'zero', label: '真实空值', value: 0 }] }),
      workspace: () => h('section', '业务工作区'),
    })
    expect(composed).toContain('受限值')
    expect(composed).toContain('业务工作区')
    expect(composed).not.toContain('href="/home"')
    expect(composed).toMatch(/ls-tabular[^>]*>-</)
    expect(composed).toMatch(/ls-tabular[^>]*>0</)
  })
})
