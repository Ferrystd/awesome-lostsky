import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import LsResourceList from './components/LsResourceList.vue'
import LsResourceRow from './components/LsResourceRow.vue'
import LsEntityIdentity from './components/LsEntityIdentity.vue'

describe('连续资源列表封闭契约', () => {
  it('只接收业务语义并保持真实列表和可导航资源', async () => {
    expect((LsResourceList as any).props).toBeUndefined()
    expect(Object.keys((LsResourceRow as any).props).sort()).toEqual(['description', 'icon', 'title', 'to', 'unread'])
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/docs', component: { render: () => null } }] })
    await router.push('/docs')
    const app = createSSRApp({ render: () => h(LsResourceList, {}, { default: () => [
      h(LsResourceRow, { title: '任务资料', description: '资料摘要', to: '/docs', unread: true }, { metadata: () => h('time', '昨天'), status: () => h('span', '未读'), actions: () => h('button', '管理') }),
      h(LsResourceRow, { description: '成员简介', to: '/docs' }, { identity: () => h(LsEntityIdentity, { type: 'teamMember', name: '成员甲', slug: 'member-a' }), metadata: () => h('span', '一个集成') }),
    ] }) }).use(router)
    const html = await renderToString(app)
    expect(html).toContain('n-list')
    expect(html).toContain('n-list-item')
    expect(html).toContain('href="/docs"')
    expect(html).toContain('ls-resource-row--unread')
    expect(html.indexOf('任务资料')).toBeLessThan(html.indexOf('昨天'))
    expect(html).toContain('成员甲')
    expect(html).toContain('成员简介')
    expect(html).toContain('一个集成')
    expect(html.indexOf('成员甲')).toBeLessThan(html.indexOf('成员简介'))
    expect(html.indexOf('成员简介')).toBeLessThan(html.indexOf('一个集成'))
    expect(html).toContain('管理')
  })

  it('Team 同义资源目录保留单一页面容量且不再拥有私有行皮肤', () => {
    const root = new URL('../../../', import.meta.url)
    for (const name of ['Entities', 'Documents', 'Files', 'Notices', 'ChatGroups', 'Members', 'Roles', 'ChatVirtuals', 'EntityFields', 'JoinFields', 'JoinReview', 'MemberDeparture', 'Abilities']) {
      const source = readFileSync(new URL(`apps/team/src/views/${name}View.vue`, root), 'utf8')
      if (['Files', 'ChatGroups'].includes(name)) {
        expect(source).toContain('<TeamResourceWorkspace')
        expect(source).toContain('<TeamResourceEntry')
      } else {
        expect(source).toContain('<LsResourceList')
        expect(source).toContain('<LsResourceRow')
      }
      expect(source).not.toMatch(/(?:entity-list|entity-row|document-list|file-list|notice-list|chat-groups-page|member-list|role-list|virtual-list|join-field-list|review-list)(?![-\w])/)
      expect(source).not.toMatch(/:deep\(\.ls-/)
    }
    const routes = readFileSync(new URL('apps/team/src/router.ts', root), 'utf8')
    expect(routes).toMatch(/path: '\/settings'[^\n]+pageWidth: 'content'/)
    const files = readFileSync(new URL('apps/team/src/views/FilesView.vue', root), 'utf8')
    expect(files).toContain('<TeamResourceWorkspace title="文件"')
    expect(files).toContain('usage.data.value.total_size')
    expect(files).toContain('fileSourceLabel(selectedFile.source)')
    expect(files).toContain('#context')
    expect(files).not.toContain('<header>')
  })
})
