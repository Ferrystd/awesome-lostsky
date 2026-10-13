import { readFileSync } from 'node:fs'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { RouterLink } from 'vue-router'
import { describe, expect, it } from 'vitest'
import LsOverviewPage from './components/LsOverviewPage.vue'

const source = (path: string) => readFileSync(path, 'utf8')

describe('overview page pilot', () => {
  it('renders semantic content and optional slots without owning scene, data, width or submission', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(LsOverviewPage, { title: '团队概览', description: '工作范围', class: 'forbidden', style: 'width:1px' }, {
      actions: () => h('a', { href: '/personal' }, '个人工作台'),
      summary: () => h('p', '摘要数据'),
      default: () => h('nav', '业务入口'),
    }) }).component('RouterLink', RouterLink))
    expect(html).toMatch(/<h1[^>]*>团队概览<\/h1>/)
    expect(html).toContain('工作范围')
    expect(html.indexOf('摘要数据')).toBeLessThan(html.indexOf('业务入口'))
    expect(html).not.toMatch(/forbidden|width:1px|<form|<main|canvas/)
    const minimal = await renderToString(createSSRApp({ render: () => h(LsOverviewPage, { title: '概览' }) }).component('RouterLink', RouterLink))
    expect(minimal).not.toMatch(/__summary|__body|__actions/)
    const component = source('frontend/packages/ui/src/components/LsOverviewPage.vue')
    expect(component).toContain('defineProps<{ title: string; description?: string }>()')
    expect(component).toContain('defineSlots<{ actions(): unknown; summary(): unknown; default(): unknown }>()')
    expect(component).not.toMatch(/LsWorkspaceScene|NConfigProvider|useQuery|<LsPage\s|:deep/)
    expect(source('docs/dev/design/admin/components.md')).toContain('`LsOverviewPage`')
  })

  it('opts in only overview from the existing app provider and preserves wide routing and entry access', () => {
    const app = source('frontend/apps/transaction/src/App.vue')
    expect(app).toContain('route.meta.workspaceScene === true')
    expect(app).toContain('route.meta.workspaceScene === true')
    expect(app).toContain('<TransactionShell :scene="auroraScene">')
    expect(app.match(/<LsWorkspaceScene\b/g)).toHaveLength(1)
    expect(app.indexOf('<LsPage id="workspace"')).toBeLessThan(app.indexOf('<LsWorkspaceScene'))
    const router = source('frontend/apps/transaction/src/router.ts')
    expect(router).toMatch(/path: '\/overview'.*pageWidth: 'wide', accessPublic: true/)
    const page = source('frontend/apps/transaction/src/views/TeamOverviewView.vue')
    expect(page.match(/<LsDashboardPath\b/g)).toHaveLength(2)
    expect(page).toContain('loadWorkspaceAccess()')
    expect(page).toContain('<LsSceneMotionControl />')
    expect(page).not.toMatch(/LsWorkspaceOverview|useMutation|api\.(get|post)|:deep/)
  })
})
