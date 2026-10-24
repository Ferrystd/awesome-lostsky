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

  it('流水目录保留筛选、金额、真实详情导航与分页', () => {
    const page = read('frontend/apps/transaction/src/views/TransactionsView.vue')
    expect(page).toContain('<LsObjectDirectory')
    expect(page).toContain('<LsListToolbar')
    expect(page).toContain('<LsResourceList')
    expect(page).toContain('<LsResourceRow')
    expect(page).toContain(':to="`/detail?id=${row.id}`"')
    expect(page).toContain('money(row.total_price)')
    expect(page).toContain('filters.handler_entity_id')
    expect(page).toContain('<NPagination v-model:page="filters.page"')
  })
})
