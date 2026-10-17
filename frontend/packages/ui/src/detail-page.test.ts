import { readFileSync } from 'node:fs'
import { createSSRApp, h, provide, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import LsDetailPage from './components/LsDetailPage.vue'
import { workspaceSceneKey } from './workspace-scene'

async function render(scene = false, withSlots = true) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push('/')
  const app = createSSRApp({
    setup() {
      if (scene) provide(workspaceSceneKey, { paused: ref(false), available: ref(true) })
      return () => h(LsDetailPage, { title: '顾客详情', description: '查看顾客', backTo: { path: '/customers', query: { q: '青空' } }, backLabel: '返回顾客列表', class: 'forbidden-visual-override', style: 'width:9999px' }, withSlots ? {
        actions: () => h('a', { href: '/chat' }, '发起对话'),
        summary: () => h('p', '经营摘要'),
        default: () => h('form', { id: 'business-form' }, '资料与关系'),
      } : undefined)
    },
  }).use(router)
  return renderToString(app)
}

describe('LsDetailPage closed composition contract', () => {
  it('preserves real return navigation and ordered slots without forwarding visual attrs', async () => {
    const html = await render()
    expect(html).toContain('href="/customers?q=%E9%9D%92%E7%A9%BA"')
    expect(html).toContain('返回顾客列表')
    expect(html.indexOf('发起对话')).toBeLessThan(html.indexOf('经营摘要'))
    expect(html.indexOf('经营摘要')).toBeLessThan(html.indexOf('资料与关系'))
    expect(html.match(/<form/g)).toHaveLength(1)
    expect(html).not.toContain('forbidden-visual-override')
    expect(html).not.toContain('9999px')
    expect(html).not.toContain('暂停极光')
  })

  it('only exposes motion control when a host scene is available', async () => {
    expect(await render(true)).toContain('暂停极光')
    const empty = await render(false, false)
    expect(empty).not.toContain('ls-detail-page__summary')
    expect(empty).not.toContain('ls-detail-page__body')
  })

  it('does not own background, provider, page width or business submission', () => {
    const source = readFileSync(new URL('./components/LsDetailPage.vue', import.meta.url), 'utf8')
    expect(source).not.toMatch(/LsWorkspaceScene|NConfigProvider|<LsPage\s|<form|@submit|:deep/)
    expect(source).toContain('title: string; description?: string; backTo?: RouteLocationRaw; backLabel?: string')
    expect(source).toContain('inheritAttrs: false')
  })

  it('opts in only the numeric customer detail record and retains the original provider precedence', () => {
    const page = readFileSync(new URL('../../../apps/team/src/views/CustomerDetailView.vue', import.meta.url), 'utf8')
    expect(page).toContain('<LsPageLink :icon="MessageCircleMore" label="发起对话" :href="chatUrl"')
    expect(page).toContain("chatWorkspaceUrl('/new', query.data.value?.slug ? { participant: query.data.value.slug } : {})")
    expect(page).not.toContain('<LsPagePrimaryAction')
    expect(page).toMatch(/<LsButton type="submit" :loading="save\.isPending\.value" :disabled="!canManage/)
    expect(page).toContain('保存顾客资料')
    const app = readFileSync(new URL('../../../apps/team/src/App.vue', import.meta.url), 'utf8')
    expect(app).toContain('route.meta.workspaceScene === true')
    expect(app).not.toContain('startsWith')
    expect(app.indexOf(':theme-overrides="lostskyNaiveTheme"')).toBeLessThan(app.indexOf('v-bind="workspaceSceneProviderProps'))
    expect(app).toContain(':contextual-header="auroraScene"')
    expect(app.match(/<TeamScene\s/g)).toHaveLength(1)
  })
})

it('keeps the full-width summary before main and aside and exposes only semantic props', async () => {
 const html = await renderToString(createSSRApp({ render: () => h(LsDetailPage, { title: '对象', asideLabel: '记录摘要' }, { summary: () => h('p', '对象身份'), default: () => h('form', '编辑资料'), aside: () => h('p', '已保存记录') }) }));
 expect(html.indexOf('对象身份')).toBeLessThan(html.indexOf('page-context__columns'));
 expect(html.indexOf('编辑资料')).toBeLessThan(html.indexOf('<aside'));
 expect(html).toContain('aria-label="记录摘要"');
 expect(Object.keys(LsDetailPage.props ?? {}).sort()).toEqual(['asideLabel','backLabel','backTo','description','title']);
});
