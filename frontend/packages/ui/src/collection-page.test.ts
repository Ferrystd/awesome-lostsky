import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import LsCollectionPage from './components/LsCollectionPage.vue'

const read = (path: string) => readFileSync(path, 'utf8')

describe('集合正文模板', () => {
  it('只公开标题和描述，按用户任务顺序组合四个插槽', async () => {
    expect(Object.keys((LsCollectionPage as unknown as { props: object }).props).sort()).toEqual(['description', 'title'])
    const html = await renderToString(createSSRApp({ render: () => h(LsCollectionPage, { title: '知识文档', description: '查找团队资料' }, {
      actions: () => h('a', { href: '/new' }, '创建'),
      toolbar: () => h('div', { id: 'filter' }, '筛选'),
      default: () => h('div', { id: 'results' }, '结果'),
      pagination: () => h('div', { id: 'pagination' }, '下一页'),
    }) }))
    expect(html).toMatch(/<h1[^>]*>知识文档<\/h1>/)
    expect(html).toContain('查找团队资料')
    expect(html.indexOf('id="filter"')).toBeLessThan(html.indexOf('id="results"'))
    expect(html.indexOf('id="results"')).toBeLessThan(html.indexOf('id="pagination"'))
    expect(html).not.toContain('team-aurora-backdrop')
    expect(html).not.toContain('暂停极光')
  })

  it('不创建限宽、场景、Provider、业务状态或视觉透传', async () => {
    const source = read('frontend/packages/ui/src/components/LsCollectionPage.vue')
    expect(source).toContain('inheritAttrs: false')
    expect(source).not.toMatch(/NConfigProvider|LsWorkspaceScene|:deep\(|defineEmits|fetch\(/)
    const html = await renderToString(createSSRApp({ render: () => h(LsCollectionPage, { title: '文档', class: 'override', style: 'width:900px' }) }))
    expect(html).not.toContain('override')
    expect(html).not.toContain('<footer')
    expect(html).not.toContain('ls-collection-page__toolbar')
  })

  it('唯一代表页复用集合组件，并仅为精确 docs 路由开启场景', () => {
    const page = read('frontend/apps/team/src/views/DocumentsView.vue')
    expect(page).toContain('<LsPageLink :icon="Plus" label="新建文档" :to="createTo"')
    expect(page).toContain('return suffix ? `/doc-create?${suffix}` : \'/doc-create\'')
    expect(page).not.toContain('<LsPagePrimaryAction')
    const form = read('frontend/apps/team/src/views/DocumentFormView.vue')
    expect(form).toMatch(/<LsButton type="submit"[^>]*:loading="save\.isPending\.value"/)
    expect(form).toContain('保存文档')
    for (const component of ['LsCollectionPage', 'LsListToolbar', 'LsResourceList', 'LsResourceRow', 'LsEmptyState', 'LsAsyncState']) expect(page).toContain(`<${component}`)
    expect(page).not.toContain('<style')
    const app = read('frontend/apps/team/src/App.vue')
    expect(app).toContain('route.meta.workspaceScene === true')
    expect(app.indexOf(':theme-overrides="lostskyNaiveTheme"')).toBeLessThan(app.indexOf('v-bind="workspaceSceneProviderProps(auroraScene)"'))
    expect(app.match(/<TeamScene /g)).toHaveLength(1)
    const catalog = JSON.parse(read('frontend/component-previews/catalog.json')) as { name: string; source: string }[]
    expect(catalog.filter(entry => entry.name === 'LsCollectionPage')).toEqual([expect.objectContaining({ source: 'frontend/packages/ui/src/components/LsCollectionPage.vue' })])
  })
})
