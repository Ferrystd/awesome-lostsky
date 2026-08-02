import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual<typeof import('naive-ui')>('naive-ui')
  const { defineComponent, h: createNode } = await import('vue')
  return {
    ...actual,
    NDropdown: defineComponent({
      name: 'NDropdownStub',
      setup(_props, { slots }) {
        return () => createNode('div', { class: 'n-dropdown-stub' }, slots.default?.())
      },
    }),
  }
})
import LsAsyncState from './components/LsAsyncState.vue'
import LsButton from './components/LsButton.vue'
import LsInlineError from './components/LsInlineError.vue'
import LsPanel from './components/LsPanel.vue'
import LsStatusTag from './components/LsStatusTag.vue'
import LsEmptyState from './components/LsEmptyState.vue'
import LsEntityIdentity from './components/LsEntityIdentity.vue'
import LsListToolbar from './components/LsListToolbar.vue'
import LsPageHeader from './components/LsPageHeader.vue'
import LsResponsiveActions from './components/LsResponsiveActions.vue'
import LsResponsiveDataTable from './components/LsResponsiveDataTable.vue'
import LsUploadField from './components/LsUploadField.vue'
import LsWorkspaceHeader from './components/LsWorkspaceHeader.vue'
import { lostskyNaiveTheme } from './naive-theme'

async function render(component: Parameters<typeof h>[0], props: Record<string, unknown> = {}, slots: Record<string, () => ReturnType<typeof h>> = {}) {
  const app = createSSRApp({ render: () => h(component, props, slots) })
  app.component('RouterLink', defineComponent({ setup(_props, { slots: linkSlots }) { return () => h('a', linkSlots.default?.()) } }))
  return renderToString(app)
}

describe('后台设计系统组件契约', () => {
  it('固定后台控件高度和圆角令牌', () => {
    expect(lostskyNaiveTheme.Button).toMatchObject({ heightSmall: '40px', heightMedium: '44px', heightLarge: '48px' })
    expect(lostskyNaiveTheme.Input).toMatchObject({ heightSmall: '40px', heightMedium: '44px', heightLarge: '48px', borderRadius: '10px' })
    expect(lostskyNaiveTheme.InternalSelection).toMatchObject({ heightSmall: '40px', heightMedium: '44px', heightLarge: '48px' })
  })

  it('LsButton 保留旧 API 并渲染 Naive UI 按钮', async () => {
    const html = await render(LsButton, { variant: 'danger', size: 'lg', disabled: true }, { default: () => h('span', '删除') })
    expect(html).toContain('n-button')
    expect(html).toContain('disabled')
    expect(html).toContain('删除')
  })

  it('LsButton 将命令图标交给固定 icon 插槽', async () => {
    const html = await render(LsButton, {}, { icon: () => h('span', '图标'), default: () => h('span', '保存') })
    expect(html).toContain('图标')
    expect(html).toContain('保存')
  })

  it('LsInlineError 固定行内错误语义且仅接收 message', async () => {
    expect(Object.keys((LsInlineError as any).props)).toEqual(['message'])
    const html = await render(LsInlineError, { message: '保存失败' })
    expect(html).toContain('role="alert"')
    expect(html).toContain('保存失败')
  })

  it('LsPanel 只提供结构插槽，不暴露视觉参数', async () => {
    expect((LsPanel as any).props).toBeUndefined()
    const html = await render(LsPanel, {}, {
      header: () => h('h2', '标题'),
      default: () => h('p', '正文'),
      footer: () => h('span', '页脚'),
    })
    expect(html).toContain('ls-panel__header')
    expect(html).toContain('ls-panel__body')
    expect(html).toContain('ls-panel__footer')
  })

  it('LsStatusTag 固定 small 和无边框外观', async () => {
    const html = await render(LsStatusTag, { label: '正常', type: 'success' })
    expect(html).toContain('正常')
    expect(html).toContain('--n-text-color:#18a058')
  })

  it('工具栏统一搜索、筛选、动作和结果数量', async () => {
    const html = await render(LsListToolbar, { modelValue: '天空', placeholder: '搜索成员', countLabel: '2 位成员' }, {
      filters: () => h('span', '全部成员'),
      actions: () => h('button', '新建'),
    })
    expect(html).toContain('role="search"')
    expect(html).toContain('搜索成员')
    expect(html).toContain('全部成员')
    expect(html).toContain('新建')
    expect(html).toContain('2 位成员')
  })

  it('主体身份优先真实头像，并保留类型、名称和 slug', async () => {
    const html = await render(LsEntityIdentity, { type: 'teamMember', name: '青空', slug: 'sky', imageUrl: '/avatar.png' }, { status: () => h('span', '正常') })
    expect(html).toContain('src="/avatar.png"')
    expect(html).toContain('成员')
    expect(html).toContain('青空')
    expect(html).toContain('@sky')
    expect(html).toMatch(/ls-entity-identity__name-row[^]*青空[^]*正常/)
  })

  it('页面标题、工作区标题和响应式动作始终保留可读文字', async () => {
    const pageHeader = await render(LsPageHeader, { title: '成员', description: '团队成员目录' })
    const workspaceHeader = await render(LsWorkspaceHeader, { contextLabel: 'TEAM WORKSPACE', title: '成员', actions: [{ key: 'notice', label: '通知' }] })
    const actions = await render(LsResponsiveActions, { primaryKey: 'manage', actions: [{ key: 'manage', label: '管理' }, { key: 'remove', label: '移出' }] })
    expect(pageHeader).toContain('团队成员目录')
    expect(workspaceHeader).toContain('TEAM WORKSPACE')
    expect(workspaceHeader).toContain('操作')
    expect(workspaceHeader).toContain('ls-workspace-header__mobile')
    expect(workspaceHeader).toMatch(/ls-workspace-header__mobile[^]*n-dropdown-stub/)
    expect(actions).toContain('管理')
    expect(actions).toContain('更多')
    expect(actions).toContain('--n-color:#0000')
    expect(actions).toContain('--n-border:none')
    expect(actions).not.toContain('n-button--primary-type')
  })

  it('响应式数据表在移动端切换为同一份数据的记录结构', () => {
    const props = (LsResponsiveDataTable as unknown as { props: Record<string, unknown> }).props
    expect(Object.keys(props).sort()).toEqual(['columns', 'data', 'rowKey', 'scrollX'])
    const source = readFileSync(new URL('./components/LsResponsiveDataTable.vue', import.meta.url), 'utf8')
    expect(source).toContain('v-for="row in data"')
    expect(source).toContain('@media (max-width: 719px)')
    expect(source).toContain('.ls-responsive-data-table__desktop { display: none; }')
  })

  it('上传和错误状态提供禁用原因，且不渲染刷新或重试按钮', async () => {
    const upload = await render(LsUploadField, { disabled: true, disabledReason: '当前团队未开通文件上传', showUrl: false })
    const error = await render(LsAsyncState, { state: 'error', title: '暂时无法读取', description: '网络连接失败' })
    const empty = await render(LsEmptyState, { title: '还没有客户', description: '客户领取身份后会出现在这里。' })
    expect(upload).toContain('当前团队未开通文件上传')
    expect(upload).toContain('disabled')
    expect(error).toContain('网络连接失败')
    expect(error).not.toMatch(/刷新|重试/)
    expect(empty).toContain('还没有客户')
    expect(empty).toContain('客户领取身份后会出现在这里。')
  })

  it('LsEmptyState 只接收标题与提示文案并统一使用 Naive 空状态', async () => {
    const props = (LsEmptyState as unknown as { props: Record<string, unknown> }).props
    expect(Object.keys(props).sort()).toEqual(['description', 'title'])
    const html = await render(LsEmptyState, { title: '没有匹配结果', description: '调整筛选条件后查看。' })
    expect(html).toContain('n-empty')
    expect(html).toContain('没有匹配结果')
    expect(html).toContain('调整筛选条件后查看。')
  })

  it('LsEmptyState 保持 192px 紧凑基准且不随视口宽度增高', () => {
    const source = readFileSync(new URL('./components/LsEmptyState.vue', import.meta.url), 'utf8')
    expect(source).toContain('min-height: 12rem')
    expect(source).toContain('padding: 2rem 1.25rem')
    expect(source).not.toMatch(/padding:\s*clamp\([^;]*vw/)
  })
})
